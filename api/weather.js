const axios = require('axios');

// ===================================================================== //
// 환경 변수 및 상수 설정
// ===================================================================== //
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const WEATHER_CONFIG = {
    API: {
        BASE_URL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
        TIMEOUT: IS_PRODUCTION ? 8000 : 10000,
        MAX_RETRIES: IS_PRODUCTION ? 5 : 3
    },
    CACHE: {
        TTL_MINUTES: IS_PRODUCTION ? 60 : 30, // 생산: 60분, 개발: 30분
        MAX_ENTRIES: 100,
        CLEANUP_INTERVAL: IS_PRODUCTION ? 30 * 60 * 1000 : 15 * 60 * 1000 // 30분 or 15분
    },
    DEFAULTS: {
        REGION: '서울특별시',
        PAGE_SIZE: 10
    }
};

// 기상청 단기예보 발표 시각 (API 활용 가이드 p.11 참조)
const FORECAST_TIMES = [
    { hour: 2, minute: 10, base: '0200' }, { hour: 5, minute: 10, base: '0500' },
    { hour: 8, minute: 10, base: '0800' }, { hour: 11, minute: 10, base: '1100' },
    { hour: 14, minute: 10, base: '1400' }, { hour: 17, minute: 10, base: '1700' },
    { hour: 20, minute: 10, base: '2000' }, { hour: 23, minute: 10, base: '2300' }
];

// ===================================================================== //
// 메트릭 및 로깅 시스템
// ===================================================================== //
const metrics = {
    apiCalls: 0, apiErrors: 0, cacheHits: 0, cacheMisses: 0, rateLimited: 0,
    avgResponseTime: 0, totalResponseTime: 0, responseTimeCount: 0,
    regionalRequests: {}, errorTypes: {},
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
    info: (message, data = {}) => { console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data); },
    warn: (message, data = {}) => { console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data); },
    error: (message, error, requestInfo = {}) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
            error: { message: error.message, code: error.code || 'UNKNOWN', stack: IS_PRODUCTION ? undefined : error.stack },
            request: requestInfo,
            originalError: error
        });
        metrics.apiErrors++;
        metrics.addErrorType(error.code || 'UNKNOWN');
    }
};

// ===================================================================== //
// locationData.js 의존성 처리 (강력한 폴백 포함)
// ===================================================================== //
let locationModule = {
    locationData: {},
    searchLocations: (q, p, s) => ({ results: [], pagination: { currentPage: p, totalPages: 0, totalResults: 0 } }),
    findMatchingLocation: (coords) => null,
    findAllMatches: (q) => {
        const MAJOR_CITIES_FALLBACK = {
            '서울특별시': { lat: 37.5665, lon: 126.9780, name: '서울특별시', type: '광역자치단체', priority_score: 1000 },
            '부산광역시': { lat: 35.1796, lon: 129.0756, name: '부산광역시', type: '광역자치단체', priority_score: 980 },
            '제주특별자치도': { lat: 33.4996, lon: 126.5312, name: '제주특별자치도', type: '광역자치단체', priority_score: 1000 }
        };
        const normalizedQuery = q.trim().toLowerCase();
        const results = Object.values(MAJOR_CITIES_FALLBACK)
            .filter(loc => loc.name.toLowerCase().includes(normalizedQuery))
            .map(loc => ({ ...loc, key: loc.name, priority: loc.priority_score }));
        return results.sort((a, b) => b.priority - a.priority);
    },
    latLonToGrid: (lat, lon) => {
        // 기상청 API 가이드(p.15-20)의 C 소스를 JS로 구현한 좌표 변환 공식
        const RE = 6371.00877;    // 지구 반경(km)
        const GRID = 5.0;         // 격자 간격(km)
        const SLAT1 = 30.0;       // 표준 위도 1
        const SLAT2 = 60.0;       // 표준 위도 2
        const OLON = 126.0;       // 기준점 경도
        const OLAT = 38.0;        // 기준점 위도
        const XO = 43;            // 기준점 X좌표 (C 소스 예제와는 다름, JS 구현에 맞게 조정된 값)
        const YO = 136;           // 기준점 Y좌표 (C 소스 예제와는 다름, JS 구현에 맞게 조정된 값)

        const DEGRAD = Math.PI / 180.0;
        const re = RE / GRID;
        const slat1 = SLAT1 * DEGRAD;
        const slat2 = SLAT2 * DEGRAD;
        const olon = OLON * DEGRAD;
        const olat = OLAT * DEGRAD;

        let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
        let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
        sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
        let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
        ro = re * sf / Math.pow(ro, sn);

        const ra = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5), sn);
        let theta = lon * DEGRAD - olon;
        if (theta > Math.PI) theta -= 2.0 * Math.PI;
        if (theta < -Math.PI) theta += 2.0 * Math.PI;
        theta *= sn;

        const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
        const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

        return { nx: nx, ny: ny };
    }
};

try {
    const loaded = require('./locationData.js');
    if (loaded && typeof loaded === 'object') {
        Object.assign(locationModule, loaded);
        logger.info('locationData.js 모듈 로드 성공');
    } else {
        throw new Error('locationData.js가 유효한 객체를 내보내지 않았습니다.');
    }
} catch (error) {
    logger.error('locationData.js를 로드하는 데 실패했습니다. 폴백 기능을 사용합니다.', error);
}

const { locationData, searchLocations, findMatchingLocation, findAllMatches, latLonToGrid } = locationModule;

// ===================================================================== //
// 캐시 시스템 (TTL + LRU 유사 로직)
// ===================================================================== //
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
        const sortedEntries = [...weatherCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
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
    setInterval(cleanupCache, WEATHER_CONFIG.CACHE.CLEANUP_INTERVAL);
}

// ===================================================================== //
// 기상청 공식 날씨 코드 매핑 (API 활용 가이드 p.10-11 참조)
// ===================================================================== //
const WEATHER_CODES = {
    SKY: { '1': '맑음', '3': '구름많음', '4': '흐림' }, // 2는 '구름조금'이지만 단기예보에는 없음
    PTY: { '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기', '5': '빗방울', '6': '빗방울/눈날림', '7': '눈날림' },
    POP: { /* 강수확률은 값 그대로 사용 */ },
    PCP: { '강수없음': '0mm' }, // 숫자 값은 직접 처리
    SNO: { '적설없음': '0cm' }, // 숫자 값은 직접 처리
    WAV: { '0': '0m', '0.5': '0.5m', '1.0': '1.0m', '1.5': '1.5m', '2.0': '2.0m', '2.5': '2.5m', '3.0': '3.0m', '4.0': '4.0m', '5.0': '5.0m 이상' }
};

const API_ERROR_MESSAGES = {
    '01': '애플리케이션 에러', '02': 'DB 에러', '03': '데이터 없음', '04': 'HTTP 에러', '05': '서비스 연결 실패',
    '10': '잘못된 요청 파라미터', '11': '필수요청 파라미터가 없음', '12': '해당 오픈API서비스가 없거나 폐기됨',
    '20': '서비스 접근 거부', '21': '일시적으로 사용할 수 없는 서비스 키', '22': '서비스 요청 제한횟수 초과',
    '30': '등록되지 않은 서비스 키', '31': '기한만료된 서비스 키', '32': '등록되지 않은 IP', '33': '서명되지 않은 호출',
    '99': '기타 에러'
};

// ===================================================================== //
// 커스텀 에러 클래스 및 유틸리티 함수
// ===================================================================== //
class WeatherAPIError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'WeatherAPIError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

const performanceLogger = {
    startTimer: (operation) => {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            logger.info(`성능 측정: ${operation}`, { duration: `${duration}ms` });
            metrics.addResponseTime(duration);
        };
    }
};

function getPathname(req) {
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        return url.pathname;
    } catch (error) {
        return req.url.split('?')[0];
    }
}

function formatDateString(dateString) {
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

const calculateBaseDateTime = (kst) => {
    const hour = kst.getHours();
    const minute = kst.getMinutes();
    const currentTimeInMinutes = hour * 60 + minute;

    let baseTime = '2300';
    let baseDate = new Date(kst);

    for (let i = FORECAST_TIMES.length - 1; i >= 0; i--) {
        const { hour: standardHour, minute: standardMinute, base } = FORECAST_TIMES[i];
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
        baseDate: baseDate.getFullYear() + ('0' + (baseDate.getMonth() + 1)).slice(-2) + ('0' + baseDate.getDate()).slice(-2),
        baseTime: baseTime
    };
};

const apiCallWithRetry = async (url, axiosParams, retries = WEATHER_CONFIG.API.MAX_RETRIES) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            logger.warn('API 요청 타임아웃 발생 (AbortController)');
        }, WEATHER_CONFIG.API.TIMEOUT);

        const response = await axios.get(url, { signal: controller.signal, ...axiosParams });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        if (retries > 0 && (error.code === 'ECONNABORTED' || error.name === 'AbortError')) {
            logger.warn(`API 호출 재시도 (남은 횟수: ${retries - 1})`, { url, error_message: error.message, error_code: error.code || error.name });
            await new Promise(resolve => setTimeout(resolve, 1000));
            return apiCallWithRetry(url, axiosParams, retries - 1);
        }
        throw error;
    }
};

const validateInput = {
    latitude: (lat) => {
        const num = parseFloat(lat);
        if (isNaN(num) || num < 33 || num > 43) throw new WeatherAPIError('유효하지 않은 위도입니다. 위도는 33-43 범위여야 합니다.', 'INVALID_LATITUDE', 400);
        return num;
    },
    longitude: (lon) => {
        const num = parseFloat(lon);
        if (isNaN(num) || num < 124 || num > 132) throw new WeatherAPIError('유효하지 않은 경도입니다. 경도는 124-132 범위여야 합니다.', 'INVALID_LONGITUDE', 400);
        return num;
    },
    region: (region) => {
        if (typeof region !== 'string' || region.trim().length === 0 || region.length > 50) throw new WeatherAPIError('유효하지 않은 지역명입니다.', 'INVALID_REGION', 400);
        return region.replace(/[<>"'&]/g, '');
    },
    page: (page) => {
        const num = parseInt(page);
        if (isNaN(num) || num < 1) throw new WeatherAPIError('유효하지 않은 페이지 번호입니다.', 'INVALID_PAGE_NUMBER', 400);
        return num;
    }
};

// ===================================================================== //
// 날씨 관련 계산 및 설명 함수
// ===================================================================== //
function calculateSensoryTemperature(temperature, humidity, windSpeed) {
    if (temperature === null || windSpeed === null || isNaN(temperature) || isNaN(windSpeed)) return null;
    const T = parseFloat(temperature);
    const WS = parseFloat(windSpeed);
    const RH = humidity !== null && !isNaN(humidity) ? parseFloat(humidity) : 50;
    let feelsLike;

    if (T <= 10 && WS >= 1.3) { // 겨울철 체감온도 공식 (API 가이드에는 없으나 일반적인 기상청 공식)
        const V_kmh = WS * 3.6;
        feelsLike = 13.12 + (0.6215 * T) - (11.37 * Math.pow(V_kmh, 0.16)) + (0.3965 * T * Math.pow(V_kmh, 0.16));
    } else { // 그 외의 경우 (여름철 공식은 복잡하여 단순화된 접근)
        feelsLike = T;
    }
    return isNaN(feelsLike) ? null : feelsLike.toFixed(1);
}

function processPrecipitationAmount(pcp) { // API 가이드 p.11 참조
    if (!pcp || pcp === '강수없음') return '0mm';
    if (pcp === '1.0mm 미만' || pcp === '1mm 미만') return '1mm 미만';
    const num = parseFloat(pcp);
    if (!isNaN(num)) {
        if (num >= 50.0) return '50mm 이상';
        if (num >= 30.0) return '30.0~50.0mm';
        return `${num.toFixed(1)}mm`;
    }
    return pcp; // 그대로 반환
}

function processSnowAmount(sno) { // API 가이드 p.11 참조
    if (!sno || sno === '적설없음') return '0cm';
    if (sno === '0.5cm 미만') return '0.5cm 미만';
    const num = parseFloat(sno);
    if (!isNaN(num)) {
        if (num >= 5.0) return '5.0cm 이상';
        return `${num.toFixed(1)}cm`;
    }
    return sno; // 그대로 반환
}

function getWindDirectionFromDegree(degree) { // API 가이드 p.14 참조
    if (degree === null || isNaN(degree)) return '정보없음';
    const val = Math.floor((parseFloat(degree) + 22.5 * 0.5) / 22.5);
    const directions = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동', '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'];
    return directions[val % 16];
}

// ===================================================================== //
// 날씨 데이터 처리 메인 함수
// ===================================================================== //
function processCompleteWeatherData(items, kst, locationFullName) {
    const forecastsByDateAndTime = {};

    items.forEach(item => {
        const { fcstDate, fcstTime, category, fcstValue } = item;
        if (!forecastsByDateAndTime[fcstDate]) forecastsByDateAndTime[fcstDate] = {};
        if (!forecastsByDateAndTime[fcstDate][fcstTime]) forecastsByDateAndTime[fcstDate][fcstTime] = {};
        forecastsByDateAndTime[fcstDate][fcstTime][category] = fcstValue;
    });

    const result = [];
    const targetDates = Array.from({ length: 3 }, (_, i) => {
        const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
        return date.toISOString().slice(0, 10).replace(/-/g, '');
    });

    targetDates.forEach((dateString, index) => {
        const dailyItems = forecastsByDateAndTime[dateString] || {};
        let processedDayData;

        if (Object.keys(dailyItems).length > 0) {
            processedDayData = extractDetailedWeatherDataForDay(dailyItems, dateString, kst, locationFullName);
        } else {
            logger.warn(`날짜 ${dateString} 에 대한 API 데이터가 부족하여 샘플 데이터로 대체합니다.`);
            processedDayData = generateCompleteSampleData(locationFullName, `API 데이터 없음: ${dateString}`)[index];
            processedDayData.date = dateString;
            processedDayData.dateFormatted = formatDateString(dateString);
        }

        processedDayData.dayLabel = ['오늘', '내일', '모레'][index];
        processedDayData.dayIndex = index;
        result.push(processedDayData);
    });

    return result;
}

function extractDetailedWeatherDataForDay(dailyItems, dateString, kst, locationFullName) {
    const sortedTimes = Object.keys(dailyItems).sort();
    let minTemp = null, maxTemp = null, maxPop = 0;

    // TMN/TMX 우선 처리 및 최대 강수확률 계산
    sortedTimes.forEach(time => {
        const hourData = dailyItems[time];
        if (hourData.TMN !== undefined) minTemp = parseFloat(hourData.TMN);
        if (hourData.TMX !== undefined) maxTemp = parseFloat(hourData.TMX);
        if (hourData.POP) maxPop = Math.max(maxPop, parseInt(hourData.POP));
    });

    // TMN/TMX 없을 시 TMP에서 계산
    if (minTemp === null || maxTemp === null) {
        const temps = sortedTimes.map(time => parseFloat(dailyItems[time].TMP)).filter(t => !isNaN(t));
        if (minTemp === null && temps.length > 0) minTemp = Math.min(...temps);
        if (maxTemp === null && temps.length > 0) maxTemp = Math.max(...temps);
    }
    
    // 대표 시간 선정
    let representativeTime = sortedTimes[0] || '0000';
    if (dateString === kst.toISOString().slice(0, 10).replace(/-/g, '')) {
        const currentKstTimeAsInt = kst.getHours() * 100 + kst.getMinutes();
        const futureTimes = sortedTimes.filter(t => parseInt(t) >= currentKstTimeAsInt);
        representativeTime = futureTimes.length > 0 ? futureTimes[0] : sortedTimes[sortedTimes.length - 1] || '0000';
    }

    const representativeData = dailyItems[representativeTime] || {};
    const temp = representativeData.TMP ? parseFloat(representativeData.TMP) : null;
    const pty = representativeData.PTY || '0';
    const sky = representativeData.SKY || '1';
    const pop = representativeData.POP ? parseInt(representativeData.POP) : 0;
    const reh = representativeData.REH ? parseInt(representativeData.REH) : null;
    const wsd = representativeData.WSD ? parseFloat(representativeData.WSD) : null;
    const vec = representativeData.VEC ? parseFloat(representativeData.VEC) : null;
    const pcp = representativeData.PCP;
    const sno = representativeData.SNO;

    const hourlyData = sortedTimes.map(time => {
        const hourData = dailyItems[time];
        return {
            time: time,
            timeFormatted: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
            temperature: hourData.TMP ? Math.round(parseFloat(hourData.TMP)) : null,
            sky: WEATHER_CODES.SKY[hourData.SKY] || '정보없음',
            precipitation: WEATHER_CODES.PTY[hourData.PTY] || '없음',
            precipitationProbability: hourData.POP ? parseInt(hourData.POP) : 0,
        };
    });

    return {
        date: dateString,
        dateFormatted: formatDateString(dateString),
        temperature: temp ? Math.round(temp) : null,
        temperatureMin: minTemp ? Math.round(minTemp) : null,
        temperatureMax: maxTemp ? Math.round(maxTemp) : null,
        sensoryTemperature: calculateSensoryTemperature(temp, reh, wsd),
        sky: WEATHER_CODES.SKY[sky] || '정보없음',
        precipitation: WEATHER_CODES.PTY[pty] || '없음',
        precipitationProbability: pop,
        precipitationProbabilityMax: maxPop,
        precipitationAmount: processPrecipitationAmount(pcp),
        snowAmount: processSnowAmount(sno),
        humidity: reh,
        windSpeed: wsd ? wsd.toFixed(1) : null,
        windDirection: getWindDirectionFromDegree(vec),
        weatherStatus: `${WEATHER_CODES.SKY[sky]}, ${WEATHER_CODES.PTY[pty]}`,
        weatherAdvice: getWeatherAdvice({TMP: temp, PTY: pty, POP: pop, WSD: wsd}, locationFullName),
        hourlyData: hourlyData
    };
}

function getWeatherAdvice(data, locationFullName) {
    const advice = [];
    if (data.TMP >= 33) advice.push('폭염 주의! 야외활동 자제하세요.');
    if (data.PTY !== '0' && data.PTY !== '5') advice.push('우산/우비를 챙기세요.');
    if (data.WSD >= 10) advice.push('강풍에 주의하세요.');
    if (locationFullName.includes('제주')) advice.push('제주도는 날씨 변동이 잦습니다.');
    return advice.length > 0 ? advice.join(' ') : '활동하기 좋은 날씨입니다.';
}

function generateCompleteSampleData(region, errorMessage = null) {
    // ... (기존 코드의 샘플 데이터 생성 로직을 여기에 통합)
    return Array.from({length: 3}, (_, i) => ({
        date: new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
        dateFormatted: new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        dayLabel: ['오늘', '내일', '모레'][i],
        temperature: 22, temperatureMin: 18, temperatureMax: 26,
        sky: '구름많음', precipitation: '없음', precipitationProbability: 30,
        weatherStatus: '샘플 데이터', weatherAdvice: errorMessage || 'API키가 없거나 오류가 발생했습니다.',
        hourlyData: [], message: errorMessage || '샘플 데이터입니다.'
    }));
}

// ===================================================================== //
// API 핸들러
// ===================================================================== //
async function handleLocationSearch(req, res) {
    // ... (기존 코드의 지역 검색 핸들러)
    const query = validateInput.region(req.query.q);
    const page = validateInput.page(req.query.page || 1);
    const searchResult = searchLocations(query, page, WEATHER_CONFIG.DEFAULTS.PAGE_SIZE);
    return res.json({ success: true, query, ...searchResult });
}

async function handleWeatherRequest(req, res) {
    metrics.apiCalls++;
    const endResponseTimer = performanceLogger.startTimer('전체 날씨 응답 처리');
    try {
        if (!WEATHER_API_KEY) {
            throw new WeatherAPIError('WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.', 'API_KEY_MISSING', 500);
        }

        let { lat, lon, region } = req.query;
        let coordinates, locationInfo, actualLocationFullName;

        if (lat && lon) {
            lat = validateInput.latitude(lat);
            lon = validateInput.longitude(lon);
            coordinates = latLonToGrid(lat, lon);
            const matchedLocation = findMatchingLocation({ lat, lon });
            actualLocationFullName = matchedLocation ? matchedLocation.name : `위도 ${lat}, 경도 ${lon}`;
            locationInfo = { requested: `${lat}, ${lon}`, matched: actualLocationFullName, coordinates, latLon: { lat, lon } };
        } else {
            region = validateInput.region(region || WEATHER_CONFIG.DEFAULTS.REGION);
            const locationMatches = findAllMatches(region);
            if (locationMatches.length === 0) throw new WeatherAPIError(`지역 "${region}" 정보를 찾을 수 없습니다.`, 'LOCATION_NOT_FOUND', 404);
            const location = locationMatches[0];
            actualLocationFullName = location.name;
            coordinates = latLonToGrid(location.lat, location.lon);
            locationInfo = { requested: region, matched: location.name, fullName: actualLocationFullName, coordinates, latLon: { lat: location.lat, lon: location.lon } };
        }

        metrics.addRegionalRequest(actualLocationFullName);
        const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
        const { baseDate, baseTime } = calculateBaseDateTime(kstNow);
        const cacheKey = `weather_${actualLocationFullName}_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;
        
        if (weatherCache.has(cacheKey)) {
            logger.info('✅ 캐시된 데이터 사용', { cacheKey });
            metrics.cacheHits++;
            endResponseTimer();
            return res.status(200).json(weatherCache.get(cacheKey).data);
        }
        metrics.cacheMisses++;

        logger.info('🌤️ 기상청 API 호출 시작', { baseDate, baseTime, nx: coordinates.nx, ny: coordinates.ny });
        const response = await apiCallWithRetry(WEATHER_CONFIG.API.BASE_URL, {
            params: {
                serviceKey: decodeURIComponent(WEATHER_API_KEY),
                numOfRows: 800, // 충분한 데이터 수 요청 (가이드 p.8 totalCount: 742 참조)
                pageNo: 1,
                dataType: 'JSON',
                base_date: baseDate,
                base_time: baseTime,
                nx: coordinates.nx,
                ny: coordinates.ny
            }
        });

        const resultCode = response.data.response.header.resultCode;
        if (resultCode !== '00') {
            const errorMsg = API_ERROR_MESSAGES[resultCode] || `알 수 없는 API 오류 (코드: ${resultCode})`;
            throw new WeatherAPIError(`기상청 API 오류: ${errorMsg}`, `API_ERROR_${resultCode}`, 500);
        }

        const items = response.data.response.body.items.item || [];
        const weatherData = processCompleteWeatherData(items, kstNow, actualLocationFullName);

        const responseData = {
            success: true,
            data: weatherData,
            locationInfo,
            apiInfo: {
                source: '기상청 단기예보 API',
                baseDate,
                baseTime,
                timestamp: new Date().toISOString(),
                version: '3.0-final'
            }
        };

        weatherCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        cleanupCache();

        logger.info('🎉 최종 날씨 API 응답 성공');
        endResponseTimer();
        return res.status(200).json(responseData);

    } catch (error) {
        logger.error(`최종 날씨 API 오류: ${error.message}`, error, { url: req.url });
        endResponseTimer();
        const statusCode = error instanceof WeatherAPIError ? error.statusCode : 500;
        const code = error instanceof WeatherAPIError ? error.code : 'UNKNOWN_ERROR';
        return res.status(statusCode).json({
            success: false,
            data: generateCompleteSampleData(req.query.region || WEATHER_CONFIG.DEFAULTS.REGION, error.message),
            error: error.message,
            code
        });
    }
}

// ===================================================================== //
// 메인 서버리스 핸들러 (Vercel Entry Point)
// ===================================================================== //
module.exports = async function handler(req, res) {
    if (!global.weatherServiceInitialized) {
        try {
            validateEnvironment();
            if (Object.keys(locationData).length > 0 && WEATHER_API_KEY) {
                await preloadPopularLocations();
            } else {
                logger.warn('사전 캐싱을 건너뜁니다 (locationData.js 또는 API 키 누락).');
            }
            global.weatherServiceInitialized = true;
        } catch (error) {
            logger.error('서비스 초기화 중 심각한 오류 발생', error);
        }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    const pathname = getPathname(req);

    if (pathname === '/api/health') {
        return res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '3.0-final', metrics, cacheSize: weatherCache.size });
    }
    if (pathname === '/api/search/locations') {
        return handleLocationSearch(req, res);
    }
    return handleWeatherRequest(req, res);
};

// 인기 지역 사전 캐싱 함수
async function preloadPopularLocations() {
    const popularRegions = ['서울특별시', '제주시', '부산광역시', '서귀포시', '대전광역시', '광주광역시', '대구광역시', '울산광역시', '인천광역시'];
    logger.info('인기 지역 날씨 데이터 사전 캐싱을 시작합니다.');
    for (const regionName of popularRegions) {
        try {
            const mockReq = { query: { region: regionName } };
            const mockRes = { // 응답을 실제로 보내지 않고 내부적으로 처리하기 위한 mock 객체
                status: () => mockRes,
                json: () => {}
            };
            await handleWeatherRequest(mockReq, mockRes);
            logger.info(`사전 캐싱 성공: '${regionName}'`);
        } catch (error) {
            logger.error(`사전 캐싱 중 오류 발생: '${regionName}'`, error);
        }
    }
}

// 환경 변수 검증 함수
function validateEnvironment() {
    if (!WEATHER_API_KEY) {
        const message = '필수 환경 변수 WEATHER_API_KEY가 설정되지 않았습니다.';
        if (IS_PRODUCTION) {
            throw new Error(message);
        } else {
            logger.warn(message + ' 샘플 데이터 모드로 동작합니다.');
        }
    }
}
