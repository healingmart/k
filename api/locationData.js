
const axios = require('axios');

// ===================================================================== 
// 환경 변수 및 상수 설정
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const WEATHER_CONFIG = {
    API: {
        BASE_URL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
        TIMEOUT: IS_PRODUCTION ? 8000 : 10000,
        MAX_RETRIES: IS_PRODUCTION ? 5 : 3
    },
    CACHE: {
        TTL_MINUTES: IS_PRODUCTION ? 60 : 30,
        MAX_ENTRIES: 100
    },
    DEFAULTS: {
        REGION: '서울특별시',
        PAGE_SIZE: 10
    }
};

// 기상청 공식 예보 발표 시각 (문서 기준)
const FORECAST_SCHEDULE = {
    SHORT_TERM: [
        { hour: 2, minute: 10, base: '0200' },
        { hour: 5, minute: 10, base: '0500' },
        { hour: 8, minute: 10, base: '0800' },
        { hour: 11, minute: 10, base: '1100' },
        { hour: 14, minute: 10, base: '1400' },
        { hour: 17, minute: 10, base: '1700' },
        { hour: 20, minute: 10, base: '2000' },
        { hour: 23, minute: 10, base: '2300' }
    ]
};

// ===================================================================== 
// 메트릭 및 로깅 시스템
const metrics = {
    apiCalls: 0,
    apiErrors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    rateLimited: 0,
    coordinateConversions: 0,
    missingValueDetections: 0,
    seaAreaMasking: 0,
    avgResponseTime: 0,
    totalResponseTime: 0,
    responseTimeCount: 0,
    regionalRequests: {},
    errorTypes: {},

    reset: () => {
        Object.keys(metrics).forEach(key => {
            if (typeof metrics[key] === 'number') metrics[key] = 0;
            if (typeof metrics[key] === 'object') metrics[key] = {};
        });
    },

    addResponseTime: (duration) => {
        metrics.totalResponseTime += duration;
        metrics.responseTimeCount++;
        metrics.avgResponseTime = metrics.totalResponseTime / metrics.responseTimeCount;
    },

    addRegionalRequest: (regionName) => {
        metrics.regionalRequests[regionName] = (metrics.regionalRequests[regionName] || 0) + 1;
    },

    addErrorType: (errorCode) => {
        metrics.errorTypes[errorCode] = (metrics.errorTypes[errorCode] || 0) + 1;
    }
};

const logger = {
    info: (message, data = {}) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
    },
    warn: (message, data = {}) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
    },
    error: (message, error, requestInfo = {}) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN',
                stack: IS_PRODUCTION ? undefined : error.stack
            },
            request: requestInfo,
            originalError: error
        });
        metrics.apiErrors++;
        metrics.addErrorType(error.code || 'UNKNOWN');
    }
};

// ===================================================================== 
// 기상청 공식 좌표 변환 (문서 C 코드 완전 이식)
class KMAGridConverter {
    constructor() {
        this.RE = 6371.00877;
        this.GRID = 5.0;
        this.SLAT1 = 30.0;
        this.SLAT2 = 60.0;
        this.OLON = 126.0;
        this.OLAT = 38.0;
        this.XO = 210 / this.GRID;
        this.YO = 675 / this.GRID;
        
        this.initialized = false;
        this.PI = Math.asin(1.0) * 2.0;
        this.DEGRAD = this.PI / 180.0;
        this.RADDEG = 180.0 / this.PI;
    }

    latLonToGrid(lat, lon) {
        metrics.coordinateConversions++;
        
        if (!this.initialized) {
            this._initializeProjection();
        }

        const ra = this.re * this.sf / Math.pow(Math.tan(this.PI * 0.25 + lat * this.DEGRAD * 0.5), this.sn);
        let theta = lon * this.DEGRAD - this.olon;
        
        if (theta > this.PI) theta -= 2.0 * this.PI;
        if (theta < -this.PI) theta += 2.0 * this.PI;
        theta *= this.sn;

        const x = ra * Math.sin(theta) + this.XO;
        const y = this.ro - ra * Math.cos(theta) + this.YO;

        const nx = Math.floor(x + 1.5);
        const ny = Math.floor(y + 1.5);

        logger.info('좌표 변환 완료', { 
            input: { lat, lon }, 
            output: { nx, ny },
            intermediate: { x: x.toFixed(3), y: y.toFixed(3) }
        });

        return { nx, ny };
    }

    gridToLatLon(nx, ny) {
        if (!this.initialized) {
            this._initializeProjection();
        }

        const x = nx - 1;
        const y = ny - 1;
        
        const xn = x - this.XO;
        const yn = this.ro - y + this.YO;
        const ra = Math.sqrt(xn * xn + yn * yn);
        
        let alat = Math.pow((this.re * this.sf / ra), (1.0 / this.sn));
        alat = 2.0 * Math.atan(alat) - this.PI * 0.5;
        
        let theta;
        if (Math.abs(xn) <= 0.0) {
            theta = 0.0;
        } else {
            if (Math.abs(yn) <= 0.0) {
                theta = this.PI * 0.5;
                if (xn < 0.0) theta = -theta;
            } else {
                theta = Math.atan2(xn, yn);
            }
        }
        
        const alon = theta / this.sn + this.olon;
        
        return {
            lat: alat * this.RADDEG,
            lon: alon * this.RADDEG
        };
    }

    _initializeProjection() {
        const slat1 = this.SLAT1 * this.DEGRAD;
        const slat2 = this.SLAT2 * this.DEGRAD;
        this.olon = this.OLON * this.DEGRAD;
        const olat = this.OLAT * this.DEGRAD;
        
        this.re = this.RE / this.GRID;
        
        this.sn = Math.tan(this.PI * 0.25 + slat2 * 0.5) / Math.tan(this.PI * 0.25 + slat1 * 0.5);
        this.sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(this.sn);
        
        this.sf = Math.tan(this.PI * 0.25 + slat1 * 0.5);
        this.sf = Math.pow(this.sf, this.sn) * Math.cos(slat1) / this.sn;
        
        this.ro = Math.tan(this.PI * 0.25 + olat * 0.5);
        this.ro = this.re * this.sf / Math.pow(this.ro, this.sn);
        
        this.initialized = true;
        logger.info('기상청 좌표 변환 시스템 초기화 완료');
    }
}

const gridConverter = new KMAGridConverter();

// ===================================================================== 
// 기상청 공식 날씨 코드 매핑 (문서 기준)
const WEATHER_CODES = {
    SKY: {
        '1': '맑음',
        '3': '구름많음', 
        '4': '흐림'
    },
    PTY: {
        '0': '없음',
        '1': '비',
        '2': '비/눈',
        '3': '눈',
        '4': '소나기'
    },
    POP: {
        '0': '0% (강수 없음)',
        '10': '10% (거의 없음)',
        '20': '20% (낮음)',
        '30': '30% (약간 있음)',
        '40': '40% (보통)',
        '50': '50% (보통)',
        '60': '60% (높음)',
        '70': '70% (높음)',
        '80': '80% (매우 높음)',
        '90': '90% (매우 높음)',
        '100': '100% (확실)'
    }
};

// 기상청 API 에러 메시지 매핑 (문서 완전 기준)
const API_ERROR_MESSAGES = {
    '00': 'NORMAL_SERVICE',
    '01': '애플리케이션 에러',
    '02': 'DB 에러', 
    '03': '데이터 없음',
    '04': 'HTTP 에러',
    '05': '서비스 연결 실패',
    '10': '잘못된 요청 파라미터',
    '11': '필수요청 파라미터가 없음',
    '12': '해당 오픈API서비스가 없거나 폐기됨',
    '20': '서비스 접근 거부',
    '21': '일시적으로 사용할 수 없는 서비스 키',
    '22': '서비스 요청 제한횟수 초과',
    '30': '등록되지 않은 서비스 키',
    '31': '기한만료된 서비스 키',
    '32': '등록되지 않은 IP',
    '33': '서명되지 않은 호출',
    '99': '기타 에러'
};

// ===================================================================== 
// 캐시 시스템
let weatherCache = new Map();

const cleanupCache = () => {
    const now = Date.now();
    const ttlMs = WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000;
    let cleanedCount = 0;

    for (const [key, entry] of weatherCache.entries()) {
        if (now - entry.timestamp > ttlMs) {
            weatherCache.delete(key);
            cleanedCount++;
        }
    }

    if (weatherCache.size > WEATHER_CONFIG.CACHE.MAX_ENTRIES) {
        const sortedEntries = [...weatherCache.entries()]
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toRemove = sortedEntries.slice(0, weatherCache.size - WEATHER_CONFIG.CACHE.MAX_ENTRIES);
        toRemove.forEach(([key]) => {
            weatherCache.delete(key);
            cleanedCount++;
        });
    }

    if (cleanedCount > 0) {
        logger.info(`🧹 캐시 정리 완료: ${cleanedCount}개 항목 제거, 현재 크기: ${weatherCache.size}`);
    }
};

if (IS_PRODUCTION) {
    setInterval(cleanupCache, WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000);
}

// ===================================================================== 
// 커스텀 에러 클래스
class WeatherAPIError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'WeatherAPIError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

// ===================================================================== 
// 유틸리티 함수들

const calculateBaseDateTime = (kst) => {
    const hour = kst.getHours();
    const minute = kst.getMinutes();
    const currentTimeInMinutes = hour * 60 + minute;

    let baseTime = '2300';
    let baseDate = new Date(kst);

    for (let i = FORECAST_SCHEDULE.SHORT_TERM.length - 1; i >= 0; i--) {
        const { hour: standardHour, minute: standardMinute, base } = FORECAST_SCHEDULE.SHORT_TERM[i];
        const standardTimeInMinutes = standardHour * 60 + standardMinute;

        if (currentTimeInMinutes >= standardTimeInMinutes) {
            baseTime = base;
            break;
        }
    }

    if (baseTime === '2300' && currentTimeInMinutes < (2 * 60 + 10)) {
        baseDate.setDate(baseDate.getDate() - 1);
    }

    return {
        baseDate: baseDate.getFullYear() + 
                 ('0' + (baseDate.getMonth() + 1)).slice(-2) + 
                 ('0' + baseDate.getDate()).slice(-2),
        baseTime: baseTime
    };
};

const isMissingValue = (value) => {
    if (value === null || value === undefined || value === '') return true;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return true;
    
    const isMissing = numValue >= 900 || numValue <= -900;
    if (isMissing) {
        metrics.missingValueDetections++;
        logger.warn('Missing 값 감지', { value, numValue });
    }
    
    return isMissing;
};

const isSeaArea = (nx, ny) => {
    const isOutOfBounds = nx < 1 || nx > 149 || ny < 1 || ny > 253;
    const isLikelySea = (nx < 20 || nx > 130) || (ny < 20 || ny > 230);
    
    if (isOutOfBounds || isLikelySea) {
        metrics.seaAreaMasking++;
        return true;
    }
    
    return false;
};

const processPrecipitationAmount = (pcp) => {
    if (!pcp || pcp === '강수없음' || pcp === '-' || pcp === 'null' || pcp === '0') {
        return '강수없음';
    }
    
    if (pcp === '1mm 미만') return '1mm 미만';
    
    const f = parseFloat(pcp);
    if (isNaN(f)) return pcp;
    
    if (f < 1.0) return "1mm 미만";
    else if (f >= 1.0 && f < 30.0) return `${f}mm`;
    else if (f >= 30.0 && f < 50.0) return "30.0~50.0mm";
    else return "50.0mm 이상";
};

const processSnowAmount = (sno) => {
    if (!sno || sno === '적설없음' || sno === '-' || sno === 'null' || sno === '0') {
        return '적설없음';
    }
    
    if (sno === '1cm 미만') return '1cm 미만';
    
    const f = parseFloat(sno);
    if (isNaN(f)) return sno;
    
    if (f < 0.5) return "0.5cm 미만";
    else if (f >= 0.5 && f < 5.0) return `${f}cm`;
    else return "5.0cm 이상";
};

const getWindDirection16 = (degree) => {
    if (degree === null || isNaN(degree)) return '정보없음';
    
    const convertedValue = Math.floor((degree + 22.5 * 0.5) / 22.5);
    
    const directions16 = [
        'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    
    const index = convertedValue % 16;
    return directions16[index];
};

const calculateSensoryTemperature = (temperature, humidity, windSpeed) => {
    if (isMissingValue(temperature) || isMissingValue(windSpeed)) {
        return null;
    }

    const T = parseFloat(temperature);
    const WS = parseFloat(windSpeed);
    const RH = humidity !== null && !isMissingValue(humidity) ? parseFloat(humidity) : 50;

    let feelsLike;

    if (T <= 10 && WS >= 1.3) {
        const V_kmh = WS * 3.6;
        feelsLike = 13.12 + (0.6215 * T) - (11.37 * Math.pow(V_kmh, 0.16)) + 
                   (0.3965 * T * Math.pow(V_kmh, 0.16));
    } else if (T >= 33 && RH >= 40) {
        feelsLike = -0.2442 + (0.55399 * T) + (0.45535 * RH) - (0.0022 * T * RH) + 
                   (0.00278 * T * T) + (3.0 * Math.pow(10, -6) * T * T * RH) - 
                   (5.481717 * Math.pow(10, -2) * Math.sqrt(RH));
    } else {
        feelsLike = T;
        if (RH > 70) feelsLike += (RH - 70) * 0.02;
        if (WS > 3) feelsLike -= (WS - 3) * 0.5;
    }

    if (feelsLike > T + 10) feelsLike = T + 10;
    if (feelsLike < T - 15) feelsLike = T - 15;
    if (feelsLike < -50) feelsLike = -50;
    if (feelsLike > 50) feelsLike = 50;

    return isNaN(feelsLike) ? null : feelsLike.toFixed(1);
};

// ===================================================================== 
// 날씨 데이터 처리 함수

const processWeatherData = (items, kst, locationName, coordinates) => {
    const forecasts = {};
    const isSeaLocation = isSeaArea(coordinates.nx, coordinates.ny);
    
    const targetDates = [];
    for (let i = 0; i < 3; i++) {
        const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
        targetDates.push(date.toISOString().slice(0, 10).replace(/-/g, ''));
    }

    items.forEach(item => {
        const date = item.fcstDate;
        const time = item.fcstTime;
        const category = item.category;
        let value = item.fcstValue;

        if (isMissingValue(value)) {
            value = null;
        }

        if (isSeaLocation && ['TMP', 'TMN', 'TMX', 'POP', 'PCP', 'SNO', 'REH'].includes(category)) {
            value = null;
            logger.warn('해상 지역 마스킹 처리', { category, originalValue: item.fcstValue });
        }

        if (!forecasts[date]) {
            forecasts[date] = { times: {} };
        }
        if (!forecasts[date].times[time]) {
            forecasts[date].times[time] = {};
        }
        
        forecasts[date].times[time][category] = value;
    });

    const result = [];

    targetDates.forEach((dateString, index) => {
        let dayData;
        
        if (forecasts[dateString] && Object.keys(forecasts[dateString].times).length > 0) {
            dayData = extractDayWeatherData(forecasts[dateString], dateString, kst, locationName, isSeaLocation);
        } else {
            logger.warn(`날짜 ${dateString}에 대한 데이터가 없어 빈 데이터를 생성합니다.`);
            dayData = createEmptyWeatherData(dateString);
        }

        dayData.dayLabel = ['오늘', '내일', '모레'][index];
        dayData.dayIndex = index;
        dayData.isSeaArea = isSeaLocation;
        
        result.push(dayData);
    });

    return result;
};

const extractDayWeatherData = (dayForecast, dateString, kst, locationName, isSeaLocation) => {
    const times = dayForecast.times;
    const timeKeys = Object.keys(times).sort();
    
    if (timeKeys.length === 0) {
        return createEmptyWeatherData(dateString);
    }

    const isToday = dateString === kst.toISOString().slice(0, 10).replace(/-/g, '');
    const currentKstHours = kst.getHours();
    const currentKstMinutes = kst.getMinutes();
    const currentTimeInMinutes = currentKstHours * 60 + currentKstMinutes;

    let representativeTime = timeKeys[0];

    if (isToday) {
        for (const timeKey of timeKeys) {
            const timeInMinutes = parseInt(timeKey.slice(0, 2)) * 60 + parseInt(timeKey.slice(2, 4));
            if (timeInMinutes >= currentTimeInMinutes) {
                representativeTime = timeKey;
                break;
            }
        }
    }

    const data = times[representativeTime];

    // TMN/TMX 우선 처리
    let minTemp = null;
    let maxTemp = null;
    let maxPop = 0;

    Object.values(times).forEach(hourData => {
        if (hourData.TMN !== null && hourData.TMN !== undefined) {
            minTemp = parseFloat(hourData.TMN);
        }
        if (hourData.TMX !== null && hourData.TMX !== undefined) {
            maxTemp = parseFloat(hourData.TMX);
        }
        if (hourData.POP) {
            const pop = parseInt(hourData.POP);
            if (!isNaN(pop) && pop > maxPop) maxPop = pop;
        }
    });

    // TMN/TMX가 없으면 TMP에서 계산
    if (minTemp === null || maxTemp === null) {
        let tempMin = Infinity;
        let tempMax = -Infinity;

        timeKeys.forEach(timeKey => {
            const hourData = times[timeKey];
            if (hourData.TMP !== null && hourData.TMP !== undefined) {
                const temp = parseFloat(hourData.TMP);
                if (!isNaN(temp)) {
                    tempMin = Math.min(tempMin, temp);
                    tempMax = Math.max(tempMax, temp);
                }
            }
        });

        if (minTemp === null && tempMin !== Infinity) {
            minTemp = tempMin;
        }
        if (maxTemp === null && tempMax !== -Infinity) {
            maxTemp = tempMax;
        }
    }

    // 시간별 데이터 생성
    const hourlyData = timeKeys.map(time => {
        const hourData = times[time];
        const temp = hourData.TMP ? parseFloat(hourData.TMP) : null;
        const humidity = hourData.REH ? parseInt(hourData.REH) : null;
        const windSpeed = hourData.WSD ? parseFloat(hourData.WSD) : null;
        const windDirection = hourData.VEC ? parseFloat(hourData.VEC) : null;

        return {
            time: time,
            timeFormatted: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
            temperature: temp ? Math.round(temp) : null,
            sensoryTemperature: calculateSensoryTemperature(temp, humidity, windSpeed),
            sky: WEATHER_CODES.SKY[hourData.SKY] || '정보없음',
            skyCode: hourData.SKY,
            precipitation: WEATHER_CODES.PTY[hourData.PTY] || '없음',
            precipitationCode: hourData.PTY,
            precipitationProbability: hourData.POP ? parseInt(hourData.POP) : 0,
            precipitationAmount: processPrecipitationAmount(hourData.PCP),
            snowAmount: processSnowAmount(hourData.SNO),
            humidity: humidity,
            windSpeed: windSpeed ? windSpeed.toFixed(1) : null,
            windDirection: getWindDirection16(windDirection),
            windDirectionDegree: windDirection,
            waveHeight: hourData.WAV ? parseFloat(hourData.WAV) : null
        };
    });

    // 대표 데이터 구성
    const currentTemp = data.TMP ? parseFloat(data.TMP) : null;
    const currentHumidity = data.REH ? parseInt(data.REH) : null;
    const currentWindSpeed = data.WSD ? parseFloat(data.WSD) : null;
    const currentWindDirection = data.VEC ? parseFloat(data.VEC) : null;

    return {
        date: dateString,
        dateFormatted: `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`,
        representativeTime: representativeTime,
        
        temperature: currentTemp ? Math.round(currentTemp) : null,
        temperatureMin: minTemp ? Math.round(minTemp) : null,
        temperatureMax: maxTemp ? Math.round(maxTemp) : null,
        temperatureUnit: '°C',
        sensoryTemperature: calculateSensoryTemperature(currentTemp, currentHumidity, currentWindSpeed),
        
        sky: WEATHER_CODES.SKY[data.SKY] || '정보없음',
        skyCode: data.SKY,
        
        precipitation: WEATHER_CODES.PTY[data.PTY] || '없음',
        precipitationCode: data.PTY,
        precipitationProbability: data.POP ? parseInt(data.POP) : 0,
        precipitationProbabilityMax: maxPop,
        precipitationAmount: processPrecipitationAmount(data.PCP),
        snowAmount: processSnowAmount(data.SNO),
        
        windSpeed: currentWindSpeed ? currentWindSpeed.toFixed(1) : null,
        windSpeedUnit: 'm/s',
        windDirection: getWindDirection16(currentWindDirection),
        windDirectionDegree: currentWindDirection,
        
        humidity: currentHumidity,
        humidityUnit: '%',
        waveHeight: data.WAV ? parseFloat(data.WAV) : null,
        visibility: data.VVV ? parseFloat(data.VVV) : null,
        
        hourlyData: hourlyData,
        isSeaArea: isSeaLocation
    };
};

const createEmptyWeatherData = (dateString) => {
    return {
        date: dateString,
        dateFormatted: `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`,
        representativeTime: null,
        temperature: null,
        temperatureMin: null,
        temperatureMax: null,
        temperatureUnit: '°C',
        sensoryTemperature: null,
        sky: '정보없음',
        skyCode: null,
        precipitation: '정보없음',
        precipitationCode: null,
        precipitationProbability: 0,
        precipitationProbabilityMax: 0,
        precipitationAmount: '강수없음',
        snowAmount: '적설없음',
        windSpeed: null,
        windSpeedUnit: 'm/s',
        windDirection: '정보없음',
        windDirectionDegree: null,
        humidity: null,
        humidityUnit: '%',
        waveHeight: null,
        visibility: null,
        hourlyData: [],
        isSeaArea: false
    };
};

const generateSampleData = (region, errorMessage = null) => {
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
    
    const dates = [];
    for (let i = 0; i < 3; i++) {
        const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
        dates.push(date);
    }
    
 ```javascript
    const baseMessage = errorMessage ? `⚠️ 오류: ${errorMessage}` : '⚠️ 기상청 API 연결 문제 - 샘플 데이터';
    
    const sampleData = [
        { temp: 23, minTemp: 18, maxTemp: 26, sky: '3', pty: '0', pop: 30, reh: 70, wsd: 2.5 },
        { temp: 24, minTemp: 19, maxTemp: 27, sky: '1', pty: '0', pop: 10, reh: 65, wsd: 2.0 },
        { temp: 21, minTemp: 17, maxTemp: 25, sky: '4', pty: '1', pop: 60, reh: 80, wsd: 3.5 }
    ];
    
    return dates.map((date, index) => {
        const sample = sampleData[index];
        
        return {
            date: date.toISOString().slice(0, 10).replace(/-/g, ''),
            dateFormatted: date.toISOString().slice(0, 10),
            dayLabel: ['오늘', '내일', '모레'][index],
            dayIndex: index,
            representativeTime: '1200',
            
            temperature: sample.temp,
            temperatureMin: sample.minTemp,
            temperatureMax: sample.maxTemp,
            temperatureUnit: '°C',
            sensoryTemperature: calculateSensoryTemperature(sample.temp, sample.reh, sample.wsd),
            
            sky: WEATHER_CODES.SKY[sample.sky] || '정보없음',
            skyCode: sample.sky,
            
            precipitation: WEATHER_CODES.PTY[sample.pty] || '없음',
            precipitationCode: sample.pty,
            precipitationProbability: sample.pop,
            precipitationProbabilityMax: sample.pop,
            precipitationAmount: sample.pty === '1' ? '5mm' : '강수없음',
            snowAmount: sample.pty === '3' ? '1cm' : '적설없음',
            
            windSpeed: sample.wsd.toFixed(1),
            windSpeedUnit: 'm/s',
            windDirection: getWindDirection16(225),
            windDirectionDegree: 225,
            
            humidity: sample.reh,
            humidityUnit: '%',
            waveHeight: null,
            visibility: null,
            
            hourlyData: [
                {
                    time: '0600',
                    timeFormatted: '06:00',
                    temperature: sample.temp - 3,
                    sensoryTemperature: calculateSensoryTemperature(sample.temp - 3, sample.reh, sample.wsd),
                    sky: WEATHER_CODES.SKY[sample.sky],
                    precipitation: WEATHER_CODES.PTY[sample.pty],
                    precipitationProbability: sample.pop
                },
                {
                    time: '1200',
                    timeFormatted: '12:00',
                    temperature: sample.temp,
                    sensoryTemperature: calculateSensoryTemperature(sample.temp, sample.reh, sample.wsd),
                    sky: WEATHER_CODES.SKY[sample.sky],
                    precipitation: WEATHER_CODES.PTY[sample.pty],
                    precipitationProbability: sample.pop
                },
                {
                    time: '1800',
                    timeFormatted: '18:00',
                    temperature: sample.temp - 2,
                    sensoryTemperature: calculateSensoryTemperature(sample.temp - 2, sample.reh, sample.wsd),
                    sky: WEATHER_CODES.SKY[sample.sky],
                    precipitation: WEATHER_CODES.PTY[sample.pty],
                    precipitationProbability: sample.pop
                }
            ],
            
            isSeaArea: false,
            message: `${baseMessage} (${['오늘', '내일', '모레'][index]})`,
            timestamp: new Date().toISOString(),
            region: region
        };
    });
};

// ===================================================================== 
// API 호출 및 재시도 로직

const apiCallWithRetry = async (url, params, retries = WEATHER_CONFIG.API.MAX_RETRIES) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, WEATHER_CONFIG.API.TIMEOUT);

        const response = await axios.get(url, {
            params: params,
            signal: controller.signal,
            headers: {
                'User-Agent': 'KMA-Weather-Service/3.0-SPEC-COMPLIANT'
            }
        });
        
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        if (retries > 0 && (error.code === 'ECONNABORTED' || error.name === 'AbortError')) {
            logger.warn(`API 호출 재시도 (남은 횟수: ${retries - 1})`, { 
                url, 
                error_message: error.message 
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            return apiCallWithRetry(url, params, retries - 1);
        }
        throw error;
    }
};

// ===================================================================== 
// 입력 검증

const validateInput = {
    latitude: (lat) => {
        const num = parseFloat(lat);
        if (isNaN(num) || num < 33 || num > 43) {
            throw new WeatherAPIError(
                '유효하지 않은 위도입니다. 위도는 33-43 범위여야 합니다.',
                'INVALID_LATITUDE',
                400
            );
        }
        return num;
    },
    
    longitude: (lon) => {
        const num = parseFloat(lon);
        if (isNaN(num) || num < 124 || num > 132) {
            throw new WeatherAPIError(
                '유효하지 않은 경도입니다. 경도는 124-132 범위여야 합니다.',
                'INVALID_LONGITUDE', 
                400
            );
        }
        return num;
    },
    
    region: (region) => {
        if (typeof region !== 'string' || region.trim().length === 0 || region.length > 50) {
            throw new WeatherAPIError(
                '유효하지 않은 지역명입니다. 1자 이상 50자 이하의 문자열이어야 합니다.',
                'INVALID_REGION',
                400
            );
        }
        return region.replace(/[<>"'&]/g, ''); // XSS 방지
    }
};

// ===================================================================== 
// Rate Limiting

const rateLimitMap = new Map();

const checkRateLimit = (ip, limit = 100, windowMs = 60 * 1000) => {
    if (!ip) return;
    
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= limit) {
        metrics.rateLimited++;
        throw new WeatherAPIError(
            '요청 한도 초과입니다. 잠시 후 다시 시도해주세요.',
            'RATE_LIMIT_EXCEEDED',
            429
        );
    }
    
    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
};

// ===================================================================== 
// 메인 날씨 API 핸들러

const handleWeatherRequest = async (req, res) => {
    metrics.apiCalls++;
    const startTime = Date.now();
    
    try {
        const { lat, lon, region = '서울특별시' } = req.query;
        
        // 환경 변수 검증
        if (!WEATHER_API_KEY) {
            const errorMessage = 'WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.';
            logger.error(errorMessage);
            return res.status(500).json({
                success: false,
                data: generateSampleData(region, errorMessage),
                error: errorMessage,
                code: 'API_KEY_MISSING'
            });
        }
        
        // 좌표 결정
        let latitude, longitude, locationName;
        
        if (lat && lon) {
            latitude = validateInput.latitude(lat);
            longitude = validateInput.longitude(lon);
            locationName = `위도 ${latitude}, 경도 ${longitude}`;
        } else {
            // 기본 지역 좌표 (서울)
            latitude = 37.5665;
            longitude = 126.9780;
            locationName = validateInput.region(region);
        }
        
        // 기상청 격자 좌표 변환
        const coordinates = gridConverter.latLonToGrid(latitude, longitude);
        
        // base_date, base_time 계산
        const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const { baseDate, baseTime } = calculateBaseDateTime(kstNow);
        
        // 캐시 확인
        const cacheKey = `weather_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;
        const cachedData = weatherCache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp < WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000)) {
            logger.info('✅ 캐시된 데이터 사용', { cacheKey });
            metrics.cacheHits++;
            
            const responseTime = Date.now() - startTime;
            metrics.addResponseTime(responseTime);
            
            return res.json({
                ...cachedData.data,
                locationInfo: {
                    requested: region,
                    coordinates: coordinates,
                    latLon: { lat: latitude, lon: longitude },
                    source: '캐시'
                }
            });
        }
        
        metrics.cacheMisses++;
        
        // 기상청 API 호출
        logger.info('🌤️ 기상청 API 호출 시작', { 
            baseDate, 
            baseTime, 
            nx: coordinates.nx, 
            ny: coordinates.ny 
        });
        
        const response = await apiCallWithRetry(WEATHER_CONFIG.API.BASE_URL, {
            serviceKey: decodeURIComponent(WEATHER_API_KEY),
            numOfRows: 300,
            pageNo: 1,
            dataType: 'JSON',
            base_date: baseDate,
            base_time: baseTime,
            nx: coordinates.nx,
            ny: coordinates.ny
        });
        
        // API 응답 검증
        if (!response.data?.response?.body?.items?.item) {
            throw new WeatherAPIError(
                '기상청 API 응답에 날씨 데이터가 없습니다.',
                'API_RESPONSE_EMPTY',
                500
            );
        }
        
        const resultCode = response.data.response.header.resultCode;
        if (resultCode !== '00') {
            const errorMsg = API_ERROR_MESSAGES[resultCode] || `알 수 없는 오류 (코드: ${resultCode})`;
            throw new WeatherAPIError(
                `기상청 API 오류: ${errorMsg}`,
                `API_ERROR_${resultCode}`,
                ['10', '11'].includes(resultCode) ? 400 : 500
            );
        }
        
        // 데이터 가공
        const items = response.data.response.body.items.item || [];
        logger.info('📊 받은 기상 데이터 항목 수', { count: items.length });
        
        const weatherData = processWeatherData(items, kstNow, locationName, coordinates);
        
        // 응답 데이터 구성
        const responseData = {
            success: true,
            data: weatherData,
            locationInfo: {
                requested: region,
                matched: locationName,
                coordinates: coordinates,
                latLon: { lat: latitude, lon: longitude },
                source: '기상청 API'
            },
            apiInfo: {
                source: '기상청 단기예보 조회서비스 (VilageFcstInfoService_2.0)',
                baseDate: baseDate,
                baseTime: baseTime,
                timestamp: new Date().toISOString(),
                dataPoints: items.length,
                version: '3.0-KMA-SPEC-COMPLIANT',
                improvements: [
                    '기상청 공식 좌표 변환 공식 적용',
                    '정확한 API 호출 시점 (매시각 10분 이후)',
                    'Missing 값 처리 (+900이상, -900이하)',
                    '해상 마스킹 처리',
                    '16방위 풍향 변환 공식',
                    '강수량/적설량 범위 처리',
                    '기상청 공식 체감온도 계산'
                ]
            },
            weatherCodes: WEATHER_CODES
        };
        
        // 캐싱
        weatherCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });
        
        cleanupCache();
        
        const responseTime = Date.now() - startTime;
        metrics.addResponseTime(responseTime);
        metrics.addRegionalRequest(locationName);
        
        logger.info('🎉 날씨 API 응답 성공', { responseTime: `${responseTime}ms` });
        
        return res.json(responseData);
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        metrics.addResponseTime(responseTime);
        
        logger.error(`날씨 API 오류: ${error.message}`, error, {
            url: req.url,
            query: req.query
        });
        
        if (error instanceof WeatherAPIError) {
            return res.status(error.statusCode).json({
                success: false,
                data: generateSampleData(req.query.region || '서울특별시', error.message),
                error: error.message,
                code: error.code
            });
        }
        
        return res.status(500).json({
            success: false,
            data: generateSampleData(req.query.region || '서울특별시', '서버 내부 오류'),
            error: '서버 내부 오류가 발생했습니다.',
            code: 'UNKNOWN_SERVER_ERROR'
        });
    }
};

// ===================================================================== 
// 헬스체크 핸들러

const handleHealthCheck = (req, res) => {
    return res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '3.0-KMA-SPEC-COMPLIANT',
        description: '기상청 단기예보 조회서비스 API 가이드 완전 준수 버전',
        cacheSize: weatherCache.size,
        metrics: {
            apiCalls: metrics.apiCalls,
            apiErrors: metrics.apiErrors,
            cacheHits: metrics.cacheHits,
            cacheMisses: metrics.cacheMisses,
            rateLimited: metrics.rateLimited,
            coordinateConversions: metrics.coordinateConversions,
            missingValueDetections: metrics.missingValueDetections,
            seaAreaMasking: metrics.seaAreaMasking,
            avgResponseTimeMs: metrics.avgResponseTime.toFixed(2),
            regionalRequests: metrics.regionalRequests,
            errorTypes: metrics.errorTypes
        },
        config: {
            hasApiKey: !!WEATHER_API_KEY,
            environment: process.env.NODE_ENV || 'production',
            cacheTtlMinutes: WEATHER_CONFIG.CACHE.TTL_MINUTES,
            apiTimeoutMs: WEATHER_CONFIG.API.TIMEOUT,
            apiMaxRetries: WEATHER_CONFIG.API.MAX_RETRIES
        },
        kmaCompliance: {
            coordinateConversion: '기상청 공식 Lambert Conformal Conic Projection',
            apiCallTiming: '매시각 10분 이후 호출',
            missingValueHandling: '+900이상, -900이하 값 Missing 처리',
            seaAreaMasking: '해상 지역 기온군/강수확률/강수량/적설/습도 마스킹',
            windDirection: '16방위 변환 공식 적용',
            precipitationRange: '기상청 JAVA 코드 기준 범위 처리',
            sensoryTemperature: '기상청 공식 체감온도 계산'
        }
    });
};

// ===================================================================== 
// 메인 핸들러 (Vercel entry point)

module.exports = async function handler(req, res) {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            message: 'GET 요청만 지원됩니다.'
        });
    }
    
    // Rate Limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',').shift() || 
                    req.connection?.remoteAddress || '';
    
    if (IS_PRODUCTION && clientIp) {
        try {
            checkRateLimit(clientIp, 100, 60 * 1000);
        } catch (error) {
            if (error instanceof WeatherAPIError && error.code === 'RATE_LIMIT_EXCEEDED') {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message,
                    code: error.code
                });
            }
            throw error;
        }
    }
    
    // 라우팅
    const pathname = req.url.split('?')[0];
    
    if (pathname === '/api/health') {
        return handleHealthCheck(req, res);
    }
    
    // 기본 날씨 요청 처리
    return handleWeatherRequest(req, res);
};
