
/** 
 * @file weather.js 
 * @description 기상청 날씨 API 연동 및 지역 검색을 위한 서버리스 함수.
 * Vercel 환경에 최적화되어 있으며, 캐싱, 에러 처리, 로깅, 성능 모니터링,
 * Rate Limiting, 데이터 검증 기능을 포함합니다.
 * locationData.js 파일을 로드하여 지역 정보를 활용합니다.
 */

const axios = require('axios');

// =====================================================================
// 7. 로깅 개선: 통합 로거 객체 (12. 에러 로깅 개선 포함)
// 3. 모니터링 강화를 위한 메트릭 추가
const metrics = {
    apiCalls: 0,
    apiErrors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    rateLimited: 0,
    avgResponseTime: 0,
    totalResponseTime: 0,
    responseTimeCount: 0,
    regionalRequests: {},
    errorTypes: {},

    // 메트릭 초기화
    reset: () => {
        metrics.apiCalls = 0;
        metrics.apiErrors = 0;
        metrics.cacheHits = 0;
        metrics.cacheMisses = 0;
        metrics.rateLimited = 0;
        metrics.avgResponseTime = 0;
        metrics.totalResponseTime = 0;
        metrics.responseTimeCount = 0;
        metrics.regionalRequests = {};
        metrics.errorTypes = {};
    },

    // 응답 시간 추가 및 평균 계산
    addResponseTime: (duration) => {
        metrics.totalResponseTime += duration;
        metrics.responseTimeCount++;
        metrics.avgResponseTime = metrics.totalResponseTime / metrics.responseTimeCount;
    },

    // 지역별 요청 증가
    addRegionalRequest: (regionName) => {
        metrics.regionalRequests[regionName] = (metrics.regionalRequests[regionName] || 0) + 1;
    },

    // 에러 타입별 증가
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
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            request: requestInfo,
            originalError: error
        });
        metrics.apiErrors++;
        metrics.addErrorType(error.code || 'UNKNOWN');
    }
};

// =====================================================================
// 1. locationData.js 의존성 처리 (안전한 import와 폴백 처리)
let locationModule = {
    locationData: {},
    searchLocations: (q, p, s) => ({
        results: [],
        pagination: { currentPage: p, totalPages: 0, totalResults: 0 }
    }),
    findMatchingLocation: (coords) => null,
    findAllMatches: (q) => {
        const MAJOR_CITIES_FALLBACK = {
            '서울특별시': { lat: 37.5665, lon: 126.9780, name: '서울특별시', type: '광역자치단체', priority_score: 1000 },
            '부산광역시': { lat: 35.1796, lon: 129.0756, name: '부산광역시', type: '광역자치단체', priority_score: 980 },
            '제주특별자치도': { lat: 33.4996, lon: 126.5312, name: '제주특별자치도', type: '광역자치단체', priority_score: 1000 }
        };
        const normalizedQuery = q.trim().toLowerCase();
        const results = Object.values(MAJOR_CITIES_FALLBACK).filter(loc =>
            loc.name.toLowerCase().includes(normalizedQuery) ||
            (loc.aliases && loc.aliases.some(alias => alias.toLowerCase().includes(normalizedQuery)))
        ).map(loc => ({
            ...loc,
            key: loc.name,
            priority: loc.priority_score
        }));
        return results.sort((a, b) => b.priority - a.priority);
    },
    latLonToGrid: (lat, lon) => {
        return { nx: 60, ny: 127 };
    }
};

try {
    const loaded = require('./locationData.js');
    if (loaded && typeof loaded === 'object') {
        Object.assign(locationModule, loaded);
    } else {
        throw new Error('locationData.js가 유효한 객체를 내보내지 않았습니다.');
    }
} catch (error) {
    logger.error('locationData.js를 로드하는 데 실패했습니다. 지역 검색 및 좌표 변환 기능이 제한됩니다.', error);
}

const { locationData, searchLocations, findMatchingLocation, findAllMatches, latLonToGrid } = locationModule;

// =====================================================================
// Vercel 서버리스용 캐시
let weatherCache = new Map();

// =====================================================================
// 1. 설정 관리 개선
const WEATHER_CONFIG = {
    API: {
        BASE_URL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
        TIMEOUT: process.env.NODE_ENV === 'production' ? 8000 : 10000,
        MAX_RETRIES: process.env.NODE_ENV === 'production' ? 5 : 3
    },
    CACHE: {
        TTL_MINUTES: process.env.NODE_ENV === 'production' ? 60 : 30,
        MAX_ENTRIES: 100
    },
    DEFAULTS: {
        REGION: '서울특별시',
        PAGE_SIZE: 10
    }
};

// =====================================================================
// 기상청 공식 날씨 코드 매핑 (정확성 개선)
const WEATHER_CODES = {
    // 하늘상태 (SKY) - 기상청 공식 코드
    SKY: {
        '1': '맑음',
        '3': '구름많음',
        '4': '흐림'
    },

    // 강수형태 (PTY) - 기상청 공식 코드
    PTY: {
        '0': '없음',
        '1': '비',
        '2': '비/눈',
        '3': '눈',
        '4': '소나기'
    },

    // 강수확률 (POP) - 백분율 그대로 사용
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
    },

    // 강수량 (PCP) - 기상청 표준 단위
    PCP: {
        '강수없음': '0mm',
        '1mm 미만': '1mm 미만',
        '1': '1mm',
        '2': '2mm',
        '3': '3mm',
        '5': '5mm',
        '10': '10mm',
        '20': '20mm',
        '30': '30mm',
        '50': '50mm',
        '100': '100mm 이상'
    },

    // 적설량 (SNO) - 기상청 표준 단위
    SNO: {
        '적설없음': '0cm',
        '1cm 미만': '1cm 미만',
        '1': '1cm',
        '5': '5cm',
        '10': '10cm',
        '20': '20cm',
        '30': '30cm 이상'
    },

    // 파고 (WAV) - 해안 지역용
    WAV: {
        '0': '0m (잔잔)',
        '0.5': '0.5m 미만',
        '1.0': '0.5~1.0m',
        '1.5': '1.0~1.5m',
        '2.0': '1.5~2.0m',
        '2.5': '2.0~2.5m',
        '3.0': '2.5~3.0m',
        '4.0': '3.0~4.0m',
        '5.0': '4.0m 이상'
    }
};

// 기상청 API 에러 메시지
const ERROR_MESSAGES = {
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
    '33': '서명되지 않은 호출'
};

// =====================================================================
// 3. 에러 처리 강화: 커스텀 에러 클래스
class WeatherAPIError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'WeatherAPIError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

// =====================================================================
// 3. 성능 모니터링
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

// =====================================================================
// 2. Rate Limiting 구현
const rateLimitMap = new Map();

/**
 * IP 주소 기반 요청 Rate Limit을 체크합니다.
 */
function checkRateLimit(ip, limit = 100, windowMs = 60 * 1000) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];

    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= limit) {
        metrics.rateLimited++;
        throw new WeatherAPIError('요청 한도 초과입니다. 잠시 후 다시 시도해주세요.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    recentRequests.push(now);
    while (recentRequests.length > limit) {
        recentRequests.shift();
    }
    rateLimitMap.set(ip, recentRequests);
    logger.info(`Rate Limit 체크: ${ip}, 요청 수: ${recentRequests.length}/${limit}`);
}

// =====================================================================
// 기상청 API base_time 계산 정확성 개선
const calculateBaseTime = (hour, minute = 0) => {
    // 기상청 단기예보 발표 시간: 02, 05, 08, 11, 14, 17, 20, 23시 (매 3시간)
    // 발표 후 약 10분 후에 데이터가 완전히 준비됨
    const forecastTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
    const currentTimeInMinutes = hour * 60 + minute;
    
    // 각 발표 시간을 분 단위로 변환하고 10분 추가 (데이터 준비 시간)
    const forecastTimesInMinutes = [
        2 * 60 + 10,   // 02:10
        5 * 60 + 10,   // 05:10
        8 * 60 + 10,   // 08:10
        11 * 60 + 10,  // 11:10
        14 * 60 + 10,  // 14:10
        17 * 60 + 10,  // 17:10
        20 * 60 + 10,  // 20:10
        23 * 60 + 10   // 23:10
    ];
    
    // 현재 시간 이전의 가장 최근 발표 시간 찾기
    let baseTime = '2300'; // 기본값 (전날 23시)
    
    for (let i = forecastTimesInMinutes.length - 1; i >= 0; i--) {
        if (currentTimeInMinutes >= forecastTimesInMinutes[i]) {
            baseTime = forecastTimes[i];
            break;
        }
    }
    
    return baseTime;
};

// =====================================================================
// API 호출 재시도 로직
const apiCallWithRetry = async (url, params, retries = WEATHER_CONFIG.API.MAX_RETRIES) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            logger.warn('API 요청 타임아웃 발생 (AbortController)');
        }, WEATHER_CONFIG.API.TIMEOUT);

        const response = await axios.get(url, {
            signal: controller.signal,
            ...params
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        if (retries > 0 && (error.code === 'ECONNABORTED' || error.name === 'AbortError')) {
            logger.warn(`API 호출 재시도 (남은 횟수: ${retries - 1})`, {
                url,
                error_message: error.message,
                error_code: error.code || error.name
            });
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
            throw new WeatherAPIError('유효하지 않은 위도입니다. 위도는 33-43 범위여야 합니다.', 'INVALID_LATITUDE', 400);
        }
        return num;
    },
    longitude: (lon) => {
        const num = parseFloat(lon);
        if (isNaN(num) || num < 124 || num > 132) {
            throw new WeatherAPIError('유효하지 않은 경도입니다. 경도는 124-132 범위여야 합니다.', 'INVALID_LONGITUDE', 400);
        }
        return num;
    },
    region: (region) => {
        if (typeof region !== 'string' || region.trim().length === 0 || region.length > 50) {
            throw new WeatherAPIError('유효하지 않은 지역명입니다. 1자 이상 50자 이하의 문자열이어야 합니다.', 'INVALID_REGION', 400);
        }
        return region.replace(/[<>"'&]/g, '');
    }
};

// =====================================================================
// 날씨 데이터 처리 함수들

/**
 * 기상청 API 응답 데이터를 가공하여 3일간의 완전한 날씨 정보 반환
 */
function processCompleteWeatherData(items, kst, locationFullName) {
    const forecasts = {};

    // 오늘, 내일, 모레 날짜 계산
    const today = kst.toISOString().slice(0, 10).replace(/-/g, '');
    const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const dayAfter = new Date(kst.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

    // 모든 기상 데이터 분류
    items.forEach(item => {
        const date = item.fcstDate;
        const time = item.fcstTime;
        const category = item.category;
        const value = item.fcstValue;

        if (!forecasts[date]) {
            forecasts[date] = {
                times: {},
                dailyData: {
                    temperatureMin: null,
                    temperatureMax: null,
                    precipitationProbabilityMax: 0
                }
            };
        }

        if (!forecasts[date].times[time]) {
            forecasts[date].times[time] = {};
        }

        forecasts[date].times[time][category] = value;
    });

    // 3일간 완전한 날씨 데이터 생성
    const result = [];
    [today, tomorrow, dayAfter].forEach((date, index) => {
        if (forecasts[date]) {
            const dayData = extractCompleteWeatherData(forecasts[date], date, kst, locationFullName);
            dayData.dayLabel = index === 0 ? '오늘' : index === 1 ? '내일' : '모레';
            dayData.dayIndex = index;

            validateWeatherData(dayData);
            result.push(dayData);
        }
    });

    return result;
}

/**
 * 일별 날씨 데이터에서 필요한 정보 추출 및 가공
 */
function extractCompleteWeatherData(dayForecast, date, kst, locationFullName) {
    const times = dayForecast.times;
    const forecastDateObj = new Date(
        parseInt(date.substring(0, 4)),
        parseInt(date.substring(4, 6)) - 1,
        parseInt(date.substring(6, 8))
    );

    const timeKeys = Object.keys(times).sort();
    let bestRepresentativeTime = null;

    const currentKstHours = kst.getHours();
    const currentKstMinutes = kst.getMinutes();

    // 현재 시각 이후의 가장 가까운 예보 시간 찾기
    for (const fcstTimeStr of timeKeys) {
        const fcstHour = parseInt(fcstTimeStr.substring(0, 2), 10);
        const fcstMinute = parseInt(fcstTimeStr.substring(2, 4), 10);

        if (forecastDateObj.toDateString() === kst.toDateString()) {
            // 오늘 날짜: 현재 시각 이후 가장 가까운 시간
            if (fcstHour > currentKstHours || (fcstHour === currentKstHours && fcstMinute >= currentKstMinutes)) {
                bestRepresentativeTime = fcstTimeStr;
                break;
            }
        } else {
            // 미래 날짜: 해당 날짜의 첫 번째 예보 시간
            bestRepresentativeTime = timeKeys[0];
            break;
        }
    }

    // 현재 시각 이후 예보가 없으면 가장 마지막 예보 시간 사용
    if (!bestRepresentativeTime && timeKeys.length > 0) {
        bestRepresentativeTime = timeKeys[timeKeys.length - 1];
    }

    // 데이터가 없는 경우 처리
    if (!bestRepresentativeTime || timeKeys.length === 0) {
        logger.warn(`날씨 데이터를 찾을 수 없어 대표 시간을 설정할 수 없습니다. 날짜: ${date}`);
        return createEmptyWeatherData(date);
    }

    const data = times[bestRepresentativeTime];

    // 일별 최저/최고 기온 및 최대 강수확률 추출
    let minTemp = Infinity;
    let maxTemp = -Infinity;
    let maxPop = 0;

    timeKeys.forEach(timeKey => {
        const hourData = times[timeKey];
        if (hourData.TMP) {
            const temp = parseFloat(hourData.TMP);
            if (temp < minTemp) minTemp = temp;
            if (temp > maxTemp) maxTemp = temp;
        }
        if (hourData.POP) {
            const pop = parseInt(hourData.POP);
            if (pop > maxPop) maxPop = pop;
        }
    });

    minTemp = minTemp === Infinity ? null : minTemp;
    maxTemp = maxTemp === -Infinity ? null : maxTemp;

    // 체감온도 계산
    const currentTemperature = data.TMP ? parseFloat(data.TMP) : null;
    const currentHumidity = data.REH ? parseInt(data.REH) : null;
    const currentWindSpeed = data.WSD ? parseFloat(data.WSD) : null;
    const sensoryTemp = calculateSensoryTemperature(currentTemperature, currentHumidity, currentWindSpeed);

    return {
        date: date,
        dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        representativeTime: bestRepresentativeTime,

        // 기온 정보
        temperature: data.TMP ? Math.round(parseFloat(data.TMP)) : null,
        temperatureMin: minTemp ? Math.round(minTemp) : null,
        temperatureMax: maxTemp ? Math.round(maxTemp) : null,
        temperatureUnit: '°C',
        temperatureDescription: getTemperatureDescription(data.TMP),
        sensoryTemperature: sensoryTemp,
        sensoryTemperatureDescription: sensoryTemp !== null ? getTemperatureDescription(sensoryTemp) : '정보없음',
        temperatureCompareYesterday: null,

        // 하늘 상태
        sky: getSkyDescription(data.SKY),
        skyCode: data.SKY,
        skyDescription: WEATHER_CODES.SKY[data.SKY] || '정보없음',

        // 강수 정보
        precipitation: getPrecipitationDescription(data.PTY),
        precipitationCode: data.PTY,
        precipitationDescription: WEATHER_CODES.PTY[data.PTY] || '없음',
        precipitationProbability: data.POP ? parseInt(data.POP) : 0,
        precipitationProbabilityMax: Math.round(maxPop),
        precipitationProbabilityDescription: getPrecipitationProbabilityDescription(data.POP),
        precipitationAmount: processPrecipitationAmount(data.PCP),
        precipitationAmountDescription: WEATHER_CODES.PCP[data.PCP] || '0mm',

        // 적설 정보
        snowAmount: processSnowAmount(data.SNO),
        snowAmountDescription: WEATHER_CODES.SNO[data.SNO] || '0cm',

        // 습도 정보
        humidity: data.REH ? parseInt(data.REH) : null,
        humidityUnit: '%',
        humidityDescription: getHumidityDescription(data.REH),

        // 풍속/풍향 정보
        windSpeed: data.WSD ? parseFloat(data.WSD).toFixed(1) : null,
        windSpeedUnit: 'm/s',
        windSpeedDescription: getWindSpeedDescription(data.WSD, locationFullName.includes('제주')),
        windSpeedRange: data.WSD ? `${Math.max(0, parseFloat(data.WSD) - 1).toFixed(1)}~${(parseFloat(data.WSD) + 2).toFixed(1)}m/s` : null,
        windDirection: getWindDirectionFromDegree(data.VEC),
        windDirectionDegree: data.VEC ? parseFloat(data.VEC) : null,
        windDirectionDescription: data.VEC ? `${getWindDirectionFromDegree(data.VEC)} (${data.VEC}도)` : '정보없음',

        // 파고 정보
        waveHeight: data.WAV || null,
        waveHeightDescription: WEATHER_CODES.WAV[data.WAV] || '정보없음',

        // 추가 상세 정보
        uvIndex: data.UVI || null,
        visibility: data.VIS || null,

        // 종합 날씨 상태
        weatherStatus: getOverallWeatherStatus(data),
        weatherAdvice: getWeatherAdvice(data, locationFullName),

        // 시간별 상세 데이터
        hourlyData: Object.keys(times).map(time => {
            const hourData = times[time];
            const hourlyTemp = hourData.TMP ? parseFloat(hourData.TMP) : null;
            const hourlyHumidity = hourData.REH ? parseInt(hourData.REH) : null;
            const hourlyWindSpeed = hourData.WSD ? parseFloat(hourData.WSD) : null;
            const hourlySensoryTemp = calculateSensoryTemperature(hourlyTemp, hourlyHumidity, hourlyWindSpeed);

            return {
                time: time,
                timeFormatted: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
                temperature: hourlyTemp ? Math.round(hourlyTemp) : null,
                sensoryTemperature: hourlySensoryTemp,
                sky: WEATHER_CODES.SKY[hourData.SKY] || '정보없음',
                precipitation: WEATHER_CODES.PTY[hourData.PTY] || '없음',
                precipitationProbability: hourData.POP ? parseInt(hourData.POP) : 0,
                humidity: hourData.REH ? parseInt(hourData.REH) : null,
                windSpeed: hourlyWindSpeed ? hourlyWindSpeed.toFixed(1) : null,
                windSpeedRange: hourlyWindSpeed ? `${Math.max(0, hourlyWindSpeed - 1).toFixed(1)}~${(parseFloat(hourlyWindSpeed) + 2).toFixed(1)}m/s` : null,
            };
        }).sort((a, b) => a.time.localeCompare(b.time))
    };
}



* 빈 날씨 데이터 생성
 */
function createEmptyWeatherData(date) {
    return {
        date: date,
        dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        representativeTime: null,
        temperature: null,
        temperatureMin: null,
        temperatureMax: null,
        temperatureUnit: '°C',
        temperatureDescription: '정보없음',
        sensoryTemperature: null,
        sensoryTemperatureDescription: '정보없음',
        temperatureCompareYesterday: null,
        sky: '정보없음',
        skyCode: null,
        skyDescription: '정보없음',
        precipitation: '정보없음',
        precipitationCode: null,
        precipitationDescription: '정보없음',
        precipitationProbability: 0,
        precipitationProbabilityMax: 0,
        precipitationProbabilityDescription: '0% (강수 없음)',
        precipitationAmount: '0mm',
        precipitationAmountDescription: '0mm',
        snowAmount: '0cm',
        snowAmountDescription: '0cm',
        humidity: null,
        humidityUnit: '%',
        humidityDescription: '정보없음',
        windSpeed: null,
        windSpeedUnit: 'm/s',
        windSpeedDescription: '정보없음',
        windSpeedRange: null,
        windDirection: '정보없음',
        windDirectionDegree: null,
        windDirectionDescription: '정보없음',
        waveHeight: null,
        waveHeightDescription: '정보없음',
        uvIndex: null,
        visibility: null,
        weatherStatus: '정보없음',
        weatherAdvice: '정보를 확인할 수 없습니다',
        hourlyData: []
    };
}

/**
 * 체감온도 계산 (개선된 공식)
 */
function calculateSensoryTemperature(temperature, humidity, windSpeed) {
    if (temperature === null || humidity === null || windSpeed === null) {
        return null;
    }

    const T = parseFloat(temperature);
    const RH = parseFloat(humidity);
    const WS = parseFloat(windSpeed);

    let feelsLike;

    if (T >= 25) {
        // 더위 체감 (온열 지수)
        feelsLike = T + (RH / 100) * (T - 20) * 0.25;
    } else if (T <= 10) {
        // 추위 체감 (윈드칠 지수)
        feelsLike = T - (WS * 1.2) - 1.5;
    } else {
        // 쾌적 범위
        feelsLike = T;
        feelsLike += (RH - 50) * 0.04;
        feelsLike -= (WS * 0.3);
    }

    // 극단값 방지
    if (feelsLike > T + 5) feelsLike = T + 5;
    if (feelsLike < T - 5) feelsLike = T - 5;

    if (isNaN(feelsLike)) {
        return null;
    }

    return feelsLike.toFixed(1);
}

// 기온 설명 함수
function getTemperatureDescription(temp) {
    if (!temp && temp !== 0) return '정보없음';
    const t = parseFloat(temp);
    if (t <= -20) return '혹한 (매우 추움)';
    if (t <= -10) return '한파 (매우 추움)';
    if (t <= 0) return '추위 (추움)';
    if (t <= 9) return '쌀쌀 (쌀쌀함)';
    if (t <= 15) return '서늘 (서늘함)';
    if (t <= 20) return '선선 (선선함)';
    if (t <= 25) return '적당 (쾌적함)';
    if (t <= 28) return '따뜻 (따뜻함)';
    if (t <= 32) return '더위 (더움)';
    if (t <= 35) return '폭염 (매우 더움)';
    return '극심한폭염 (위험)';
}

// 하늘 상태 설명
function getSkyDescription(code) {
    return WEATHER_CODES.SKY[code] || '정보없음';
}

// 강수 형태 설명
function getPrecipitationDescription(code) {
    return WEATHER_CODES.PTY[code] || '없음';
}

// 강수확률 설명 (정확성 개선)
function getPrecipitationProbabilityDescription(pop) {
    if (!pop) return '0% (강수 없음)';
    const probability = parseInt(pop);
    return `${probability}% ${getProbabilityText(probability)}`;
}

function getProbabilityText(prob) {
    if (prob === 0) return '(강수 없음)';
    if (prob <= 20) return '(낮음)';
    if (prob <= 40) return '(보통)';
    if (prob <= 60) return '(높음)';
    if (prob <= 80) return '(매우 높음)';
    return '(확실)';
}

// 강수량 처리
function processPrecipitationAmount(pcp) {
    if (!pcp || pcp === '강수없음' || pcp === '0') return '0mm';
    if (pcp === '1mm 미만') return '1mm 미만';
    if (pcp.includes('mm')) return pcp;
    return `${pcp}mm`;
}

// 적설량 처리
function processSnowAmount(sno) {
    if (!sno || sno === '적설없음' || sno === '0') return '0cm';
    if (sno === '1cm 미만') return '1cm 미만';
    if (sno.includes('cm')) return sno;
    return `${sno}cm`;
}

// 습도 설명
function getHumidityDescription(humidity) {
    if (!humidity) return '정보없음';
    const h = parseInt(humidity);
    if (h <= 20) return '매우 건조';
    if (h <= 40) return '건조';
    if (h <= 60) return '보통';
    if (h <= 80) return '습함';
    return '매우 습함';
}

// 풍속 설명 (제주 특성 반영)
function getWindSpeedDescription(windSpeed, isJeju = false) {
    if (!windSpeed) return '정보없음';
    const ws = parseFloat(windSpeed);
    let desc = '';
    
    if (ws < 1) desc = '0-1m/s (고요)';
    else if (ws < 2) desc = '1-2m/s (실바람)';
    else if (ws < 3) desc = '2-3m/s (남실바람)';
    else if (ws < 4) desc = '3-4m/s (산들바람)';
    else if (ws < 5) desc = '4-5m/s (건들바람)';
    else if (ws < 7) desc = '5-7m/s (선선한바람)';
    else if (ws < 9) desc = '7-9m/s (시원한바람)';
    else if (ws < 11) desc = '9-11m/s (센바람)';
    else if (ws < 14) desc = '11-14m/s (강한바람)';
    else if (ws < 17) desc = '14-17m/s (매우강한바람)';
    else if (ws < 21) desc = '17-21m/s (폭풍)';
    else if (ws < 25) desc = '21-25m/s (강한폭풍)';
    else desc = '25m/s 이상 (매우강한폭풍)';

    if (isJeju) {
        return `${desc} (변동 가능)`;
    }
    return desc;
}

// 풍향 변환 (16방위)
function getWindDirectionFromDegree(degree) {
    if (!degree && degree !== 0) return '정보없음';

    const deg = parseFloat(degree);
    const normalizedDeg = ((deg % 360) + 360) % 360;

    const directions = [
        '북', '북북동', '북동', '동북동',
        '동', '동남동', '남동', '남남동',
        '남', '남남서', '남서', '서남서',
        '서', '서북서', '북서', '북북서'
    ];

    const index = Math.round(normalizedDeg / 22.5) % 16;
    return directions[index];
}

// 종합 날씨 상태
function getOverallWeatherStatus(data) {
    const temp = data.TMP ? parseFloat(data.TMP) : null;
    const sky = data.SKY;
    const pty = data.PTY;
    const pop = data.POP ? parseInt(data.POP) : 0;

    if (pty && pty !== '0') {
        const precipType = WEATHER_CODES.PTY[pty] || '강수';
        if (pop >= 80) return `${precipType} 확실`;
        if (pop >= 60) return `${precipType} 가능성 높음`;
        return `${precipType} 가능성 있음`;
    }

    if (pop >= 60) {
        return '강수 가능성 높음';
    }

    const skyDesc = WEATHER_CODES.SKY[sky] || '정보없음';

    if (temp !== null) {
        if (temp >= 33) return `${skyDesc}, 폭염 주의`;
        if (temp >= 28) return `${skyDesc}, 더움`;
        if (temp >= 21) return `${skyDesc}, 쾌적`;
        if (temp >= 10) return `${skyDesc}, 선선`;
        if (temp >= 0) return `${skyDesc}, 쌀쌀`;
        return `${skyDesc}, 추움`;
    }

    return skyDesc;
}

// 날씨 조언 (제주 특성 반영)
function getWeatherAdvice(data, locationFullName) {
    const temp = data.TMP ? parseFloat(data.TMP) : null;
    const pty = data.PTY;
    const pop = data.POP ? parseInt(data.POP) : 0;
    const wsd = data.WSD ? parseFloat(data.WSD) : 0;
    const isJeju = locationFullName.includes('제주');

    const advice = [];

    // 기온 관련 조언
    if (temp !== null) {
        if (temp >= 35) advice.push('🌡️ 폭염 경보! 야외활동 자제하세요');
        else if (temp >= 33) advice.push('🌡️️ 폭염 주의! 충분한 수분 섭취하세요');
        else if (temp >= 28) advice.push('☀️ 더운 날씨, 시원한 복장 추천');
        else if (temp <= -10) advice.push('🧊 한파 주의! 방한용품 필수');
        else if (temp <= 0) advice.push('❄️ 추운 날씨, 따뜻한 복장 필요');
        else if (temp <= 10) advice.push('🧥 쌀쌀한 날씨, 외투 준비하세요');
    }

    // 강수 관련 조언
    if (pty && pty !== '0') {
        const precipType = WEATHER_CODES.PTY[pty];
        if (precipType.includes('비')) advice.push('☔ 우산 또는 우비 준비하세요');
        if (precipType.includes('눈')) advice.push('⛄ 눈 예보, 미끄럼 주의하세요');
        if (precipType.includes('소나기')) advice.push('🌦️ 소나기 주의, 우산 휴대하세요');
    } else if (pop >= 60) {
        advice.push('🌧️ 강수 가능성 높음, 우산 준비 권장');
    } else if (pop >= 30) {
        advice.push('☁️ 구름 많음, 우산 휴대 권장');
    }

    // 바람 관련 조언
    if (wsd >= 14) advice.push('💨 강풍 주의! 야외활동 조심하세요');
    else if (wsd >= 10) advice.push('🌬️ 바람이 강해요, 모자나 가벼운 물건 주의');

    // 제주 특성 조언
    if (isJeju) {
        advice.push('🌪️ 제주는 바람이 수시로 변하니 유의하세요');
    }

    return advice.length > 0 ? advice.join(' | ') : '쾌적한 날씨입니다';
}

/**
 * 샘플 데이터 생성 (API 키 없거나 오류 시)
 */
function generateCompleteSampleData(region, errorMessage = null) {
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000);

    const dates = [];
    for (let i = 0; i < 3; i++) {
        const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
        dates.push(date);
    }

    const baseMessage = errorMessage ? `⚠️ 오류: ${errorMessage}` : '⚠️ WEATHER_API_KEY 설정 필요 - 샘플 데이터';
    const sampleTemps = [20, 22, 21];
    const sampleSkies = ['1', '3', '4'];
    const samplePrecips = ['0', '0', '1'];
    const sampleHumidity = [60, 70, 80];
    const sampleWindSpeed = [2.5, 3.0, 3.5];

    return dates.map((date, index) => {
        const hourlySampleData = [
            {
                time: '0600',
                timeFormatted: '06:00',
                temperature: Math.round(sampleTemps[index] - 3),
                humidity: sampleHumidity[index],
                windSpeed: sampleWindSpeed[index],
                sky: sampleSkies[index],
                precipitation: samplePrecips[index],
                precipitationProbability: [10, 30, 60][index],
            },
            {
                time: '1200',
                timeFormatted: '12:00',
                temperature: Math.round(sampleTemps[index]),
                humidity: sampleHumidity[index],
                windSpeed: sampleWindSpeed[index],
                sky: sampleSkies[index],
                precipitation: samplePrecips[index],
                precipitationProbability: [10, 30, 60][index],
            },
            {
                time: '1800',
                timeFormatted: '18:00',
                temperature: Math.round(sampleTemps[index] - 2),
                humidity: sampleHumidity[index],
                windSpeed: sampleWindSpeed[index],
                sky: sampleSkies[index],
                precipitation: samplePrecips[index],
                precipitationProbability: [10, 30, 60][index],
            }
        ];

        let currentDayForecast = {
            times: {},
            dailyData: {
                temperatureMin: null,
                temperatureMax: null,
                precipitationProbabilityMax: 0
            }
        };

        hourlySampleData.forEach(item => {
            currentDayForecast.times[item.time] = {
                TMP: item.temperature,
                REH: item.humidity,
                WSD: item.windSpeed,
                SKY: item.sky,
                PTY: item.precipitation,
                POP: item.precipitationProbability
            };
        });

        const times = currentDayForecast.times;
        const timeKeys = Object.keys(times).sort();
        let bestRepTime = timeKeys.length > 0 ? timeKeys[0] : '0600';

        const data = times[bestRepTime] || {};

        // 최저/최고 기온 계산
        let minTemp = Infinity;
        let maxTemp = -Infinity;
        let maxPop = 0;

        hourlySampleData.forEach(item => {
            if (item.temperature !== null) {
                if (item.temperature < minTemp) minTemp = item.temperature;
                if (item.temperature > maxTemp) maxTemp = item.temperature;
            }
            if (item.precipitationProbability !== null) {
                if (item.precipitationProbability > maxPop) maxPop = item.precipitationProbability;
            }
        });

        minTemp = minTemp === Infinity ? null : minTemp;
        maxTemp = maxTemp === -Infinity ? null : maxTemp;

        return {
            date: date.toISOString().slice(0, 10).replace(/-/g, ''),
            dateFormatted: date.toISOString().slice(0, 10),
            dayLabel: index === 0 ? '오늘' : index === 1 ? '내일' : '모레',
            dayIndex: index,
            representativeTime: bestRepTime,

            temperature: errorMessage ? null : (data.TMP ? Math.round(data.TMP) : null),
            temperatureMin: errorMessage ? null : (minTemp ? Math.round(minTemp) : null),
            temperatureMax: errorMessage ? null : (maxTemp ? Math.round(maxTemp) : null),
            temperatureUnit: '°C',
            temperatureDescription: errorMessage ? '정보없음' : getTemperatureDescription(data.TMP),
            sensoryTemperature: errorMessage ? null : calculateSensoryTemperature(data.TMP, data.REH, data.WSD),
            sensoryTemperatureDescription: errorMessage ? '정보없음' : getTemperatureDescription(calculateSensoryTemperature(data.TMP, data.REH, data.WSD)),
            temperatureCompareYesterday: null,

            sky: errorMessage ? '정보없음' : WEATHER_CODES.SKY[data.SKY],
            skyCode: errorMessage ? null : data.SKY,
            skyDescription: errorMessage ? '정보없음' : WEATHER_CODES.SKY[data.SKY],

            precipitation: errorMessage ? '정보없음' : WEATHER_CODES.PTY[data.PTY],
            precipitationCode: errorMessage ? null : data.PTY,
            precipitationDescription: WEATHER_CODES.PTY[data.PTY],
            precipitationProbability: errorMessage ? null : (data.POP ? parseInt(data.POP) : 0),
            precipitationProbabilityMax: errorMessage ? null : Math.round(maxPop),
            precipitationProbabilityDescription: getPrecipitationProbabilityDescription(data.POP),
            precipitationAmount: errorMessage ? '정보없음' : processPrecipitationAmount(data.PCP),
            precipitationAmountDescription: WEATHER_CODES.PCP[data.PCP] || '0mm',

            snowAmount: '0cm',
            snowAmountDescription: '0cm',

            humidity: errorMessage ? null : (data.REH ? parseInt(data.REH) : null),
            humidityUnit: '%',
            humidityDescription: errorMessage ? '정보없음' : getHumidityDescription(data.REH),

            windSpeed: errorMessage ? null : (data.WSD ? parseFloat(data.WSD).toFixed(1) : null),
            windSpeedUnit: 'm/s',
            windSpeedDescription: errorMessage ? '정보없음' : getWindSpeedDescription(data.WSD, region.includes('제주')),
            windSpeedRange: errorMessage ? null : (data.WSD ? `${Math.max(0, data.WSD - 1).toFixed(1)}~${(parseFloat(data.WSD) + 2).toFixed(1)}m/s` : null),
            windDirection: errorMessage ? '정보없음' : getWindDirectionFromDegree(data.VEC),
            windDirectionDegree: errorMessage ? null : (data.VEC ? parseFloat(data.VEC) : null),
            windDirectionDescription: errorMessage ? '정보없음' : (data.VEC ? `${getWindDirectionFromDegree(data.VEC)} (${data.VEC}도)` : '정보없음'),

            waveHeight: null,
            waveHeightDescription: '정보없음',
            uvIndex: null,
            visibility: null,

            weatherStatus: errorMessage ? '정보없음' : getOverallWeatherStatus(data),
            weatherAdvice: errorMessage ? '정보를 확인할 수 없습니다' : getWeatherAdvice(data, region),

            hourlyData: errorMessage ? [] : hourlySampleData.map(item => ({
                time: item.time,
                timeFormatted: item.timeFormatted,
                temperature: item.temperature,
                sensoryTemperature: calculateSensoryTemperature(item.temperature, item.humidity, item.windSpeed),
                sky: WEATHER_CODES.SKY[item.sky] || '정보없음',
                precipitation: WEATHER_CODES.PTY[item.precipitation] || '없음',
                precipitationProbability: item.precipitationProbability,
                humidity: item.humidity,
                windSpeed: item.windSpeed.toFixed(1),
                windSpeedRange: `${Math.max(0, item.windSpeed - 1).toFixed(1)}~${(parseFloat(item.windSpeed) + 2).toFixed(1)}m/s`,
            })).sort((a, b) => a.time.localeCompare(b.time)),

            message: `${baseMessage} (${['오늘', '내일', '모레'][index]})`,
            timestamp: new Date().toISOString(),
            region: region
        };
    });
}

/**
 * URL pathname 추출
 */
function getPathname(req) {
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        return url.pathname;
    } catch (error) {
        logger.warn('URL 파싱 중 오류 발생, Fallback 경로 사용:', { message: error.message });
        return req.url.split('?')[0];
    }
}

/**
 * 데이터 검증
 */
function validateWeatherData(data) {
    const errors = [];

    // 기온 범위 검증 (-50°C ~ 60°C)
    if (data.temperature !== null && (parseFloat(data.temperature) < -50 || parseFloat(data.temperature) > 60)) {
        errors.push(`비정상적인 기온: ${data.temperature}°C`);
    }

    // 습도 범위 검증 (0% ~ 100%)
    if (data.humidity !== null && (data.humidity < 0 || data.humidity > 100)) {
        errors.push(`비정상적인 습도: ${data.humidity}%`);
    }

    // 강수확률 범위 검증 (0% ~ 100%)
    if (data.precipitationProbability !== null && (data.precipitationProbability < 0 || data.precipitationProbability > 100)) {
        errors.push(`비정상적인 강수확률: ${data.precipitationProbability}%`);
    }

    if (errors.length > 0) {
        logger.warn('날씨 데이터 검증 경고', { errors, data });
    }

    return errors.length === 0;
}

/**
 * 인기 지역 사전 캐싱
 */
async function preloadPopularLocations() {
    if (Object.keys(locationData).length === 0) {
        logger.warn('locationData가 로드되지 않아 인기 지역 사전 캐싱을 건너뜁니다.');
        return;
    }

    const popularRegions = ['서울특별시', '제주시', '부산광역시', '서귀포시'];
    const weatherApiKey = process.env.WEATHER_API_KEY;

    if (!weatherApiKey) {
        logger.warn('WEATHER_API_KEY가 없어 인기 지역 사전 캐싱을 건너뜁니다.');
        return;
    }

    for (const regionName of popularRegions) {
        try {
            const locationMatches = findAllMatches(regionName);
            if (locationMatches.length === 0) {
                logger.warn(`사전 캐싱을 위한 지역 '${regionName}'을(를) 찾을 수 없습니다.`);
                continue;
            }
            const location = locationMatches[0];

            const coordinates = latLonToGrid(location.lat, location.lon);
            const now = new Date();
            const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
            const baseTime = calculateBaseTime(kst.getHours(), kst.getMinutes());
            let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');

            // 전날 23시 예보인 경우 날짜 조정
            if (kst.getHours() < 2 && baseTime === '2300') {
                const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
                baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
            }

            const cacheKey = `weather_${location.name}_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;

            // 캐시에 이미 있으면 건너뛰기
            if (weatherCache.has(cacheKey)) {
                logger.info(`사전 캐싱: '${regionName}' (캐시에 이미 존재)`);
                continue;
            }

            logger.info(`사전 캐싱 시작: '${regionName}'`);
            const response = await apiCallWithRetry(WEATHER_CONFIG.API.BASE_URL, {
                params: {
                    serviceKey: weatherApiKey,
                    numOfRows: 300,
                    pageNo: 1,
                    dataType: 'JSON',
                    base_date: baseDate,
                    base_time: baseTime,
                    nx: coordinates.nx,
                    ny: coordinates.ny
                }
            }, WEATHER_CONFIG.API.MAX_RETRIES);

            if (!response.data?.response?.body?.items?.item) {
                logger.warn(`사전 캐싱 실패: '${regionName}' - API 응답 데이터 없음`);
                continue;
            }
            if (response.data.response.header.resultCode !== '00') {
                logger.warn(`사전 캐싱 실패: '${regionName}' - API 오류 (${response.data.response.header.resultCode})`);
                continue;
            }

            const items = response.data.response.body.items.item || [];
            const weatherData = processCompleteWeatherData(items, kst, location.name);

            const responseData = {
                success: true,
                data: weatherData,
                locationInfo: {
                    requested: regionName,
                    matched: location.name,
                    fullName: location.name,
                    coordinates: coordinates,
                    latLon: { lat: location.lat, lon: location.lon },
                    source: '사전 캐싱'
                },
                apiInfo: {
                    source: '기상청 단기예보 API',
                    note: '기상청 단기예보 API 기준입니다. 실시간 관측값과 차이가 있을 수 있습니다.',
                    baseDate: baseDate,
                    baseTime: baseTime,
                    timestamp: new Date().toISOString(),
                    apiKeyUsed: 'WEATHER_API_KEY',
                    totalCategories: Object.keys(WEATHER_CODES).length,
                    dataPoints: items.length,
                    version: '2.0-complete'
                },
                weatherCodes: WEATHER_CODES
            };

            weatherCache.set(cacheKey, {
                data: responseData,
                timestamp: Date.now()
            });

            logger.info(`사전 캐싱 완료: '${regionName}'`);

            // 캐시 크기 관리
            if (weatherCache.size > WEATHER_CONFIG.CACHE.MAX_ENTRIES) {
                const oldestKey = weatherCache.keys().next().value;
                weatherCache.delete(oldestKey);
                logger.info('🧹 캐시 정리 완료 (사전 캐싱 중)', { currentCacheSize: weatherCache.size });
            }

        } catch (error) {
            logger.error(`사전 캐싱 중 오류 발생: '${regionName}'`, error);
        }
    }
}

/**
 * 지역 검색 API 핸들러
 */
async function handleLocationSearch(req, res) {
    const requestInfo = { url: req.url, query: req.query, headers: req.headers };
    try {
        const query = validateInput.region(req.query.q);
        const page = parseInt(req.query.page || 1);

        if (isNaN(page) || page < 1) {
            throw new WeatherAPIError('유효하지 않은 페이지 번호입니다.', 'INVALID_PAGE_NUMBER', 400);
        }

        const searchResult = searchLocations(query, page, WEATHER_CONFIG.DEFAULTS.PAGE_SIZE);

        logger.info('지역 검색 성공', {
            query: query,
            page: page,
            resultsCount: searchResult.results.length
        });
        const adminResults = [];
        const relatedResults = [];

        const processedResults = searchResult.results.map(location => ({
            name: location.name,
            displayName: location.displayName,
            type: location.type,
            searchType: location.searchType || 'direct',
            lat: location.lat,
            lon: location.lon,
            key: location.key,
            priority: location.priority_score || location.priority || 0,
            admin_parent: location.admin_parent,
            legal_divisions: location.legal_divisions,
            originalSearchTerm: location.originalSearchTerm || query
        }));

        processedResults.forEach(loc => {
            adminResults.push({
                name: loc.name,
                displayName: loc.displayName,
                type: loc.type,
                originalSearchTerm: loc.originalSearchTerm
            });
        });

        return res.json({
            success: true,
            query: query,
            results: processedResults,
            categorizedResults: {
                adminDivisions: adminResults,
                relatedPlaces: relatedResults
            },
            pagination: searchResult.pagination
        });

    } catch (error) {
        logger.error(`지역 검색 API 오류: ${error.message}`, error, requestInfo);
        if (error instanceof WeatherAPIError) {
            return res.status(error.statusCode).json({
                success: false,
                data: null,
                error: error.message,
                code: error.code
            });
        }
        return res.status(500).json({
            success: false,
            data: null,
            error: '지역 검색 중 알 수 없는 오류가 발생했습니다.',
            code: 'UNKNOWN_ERROR'
        });
    }
}

/**
 * 날씨 정보 요청 API 핸들러
 */
async function handleWeatherRequest(req, res) {
    metrics.apiCalls++;
    const requestInfo = { url: req.url, query: req.query, headers: req.headers };

    try {
        let latitude, longitude, regionName;
        const { lat, lon, region, detailed = 'true', minimal = 'false' } = req.query;

        if (lat && lon) {
            latitude = validateInput.latitude(lat);
            longitude = validateInput.longitude(lon);
            regionName = null;
        } else if (region) {
            regionName = validateInput.region(region);
            latitude = null;
            longitude = null;
        } else {
            regionName = WEATHER_CONFIG.DEFAULTS.REGION;
            const defaultLocationMatches = findAllMatches(regionName);
            const defaultLocation = defaultLocationMatches.length > 0 ? defaultLocationMatches[0] : null;

            if (!defaultLocation || Object.keys(locationData).length === 0 || !defaultLocation.lat || !defaultLocation.lon) {
                logger.warn('기본 지역 정보를 찾을 수 없거나 locationData가 로드되지 않아 날씨 정보를 제공할 수 없습니다.');
                return res.status(500).json({
                    success: false,
                    data: null,
                    error: '기본 지역 정보를 로드할 수 없어 날씨 정보를 제공할 수 없습니다.',
                    code: 'LOCATION_DATA_UNAVAILABLE'
                });
            }
            latitude = defaultLocation.lat;
            longitude = defaultLocation.lon;
            logger.warn(`위경도/지역명 없음: 기본 지역(${regionName}) 사용`);
        }

        const weatherApiKey = process.env.WEATHER_API_KEY;

        // 지역별 요청 통계 증가
        let currentRegionKey;
        if (regionName) {
            currentRegionKey = regionName;
        } else {
            const matchedLocation = findMatchingLocation({ lat: latitude, lon: longitude });
            currentRegionKey = matchedLocation ? matchedLocation.name : 'UNKNOWN_REGION';
        }
        metrics.addRegionalRequest(currentRegionKey);

        logger.info('완전한 날씨 API 요청 수신', {
            region: regionName,
            lat: latitude,
            lon: longitude,
            detailed,
            minimal,
            hasWeatherApiKey: !!weatherApiKey
        });

        // API 키 확인
        if (!weatherApiKey || !validateEnvironment().isValid) {
            const validationResult = validateEnvironment();
            const errorMessage = !weatherApiKey ? 
                'WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.' : 
                `필수 환경 변수 누락: ${validationResult.missing.join(', ')}.`;

            logger.error(`${errorMessage} 날씨 정보를 제공할 수 없습니다.`, new Error(errorMessage), requestInfo);
            return res.status(500).json({
                success: false,
                data: null,
                error: errorMessage,
                code: 'API_KEY_OR_ENV_MISSING'
            });
        }

        let coordinates;
        let locationInfo;
        let actualLocationFullName;

        if (latitude && longitude) {
            coordinates = latLonToGrid(latitude, longitude);
            const matchedAdminLocation = findMatchingLocation({ lat: latitude, lon: longitude });
            actualLocationFullName = matchedAdminLocation ? matchedAdminLocation.name : `위도 ${latitude}, 경도 ${longitude}`;

            locationInfo = {
                requested: `${lat}, ${lon}`,
                matched: matchedAdminLocation ? matchedAdminLocation.name : `위경도 (${latitude}, ${longitude})`,
                fullName: actualLocationFullName,
                coordinates: coordinates,
                latLon: { lat: latitude, lon: longitude },
                source: '위경도 직접 입력 또는 매칭'
            };

            logger.info('위경도 변환 및 매칭 완료', {
                lat: latitude,
                lon: longitude,
                grid: coordinates,
                matchedAdminLocation: matchedAdminLocation?.name
            });
        } else {
            const locationMatches = findAllMatches(regionName);
            const location = locationMatches.length > 0 ? locationMatches[0] : null;

            if (!location || !location.lat || !location.lon) {
                throw new WeatherAPIError(`지역 "${regionName}"에 대한 좌표 정보를 찾을 수 없습니다. (날씨 조회 불가)`, 'LOCATION_COORDINATES_MISSING', 404);
            }
            actualLocationFullName = location.name;
            coordinates = latLonToGrid(location.lat, location.lon);
            locationInfo = {
                requested: regionName,
                matched: location.name,
                fullName: actualLocationFullName,
                displayName: location.displayName,
                coordinates: coordinates,
                latLon: { lat: location.lat, lon: location.lon },
                source: '지역명 검색'
            };

            logger.info('지역명 검색 완료', {
                region: regionName,
                location: location.name,
                grid: coordinates
            });
        }

        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const baseTime = calculateBaseTime(kst.getHours(), kst.getMinutes());
        let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');

        // 전날 23시 예보인 경우 날짜 조정
        if (kst.getHours() < 2 && baseTime === '2300') {
            const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
            baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        }

        // 캐시 키 생성
        const cacheKey = `weather_${locationInfo.fullName}_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;
        const cachedData = weatherCache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000) {
            logger.info('✅ 캐시된 데이터 사용', { cacheKey });
            metrics.cacheHits++;

            const responseData = { ...cachedData.data };
            responseData.locationInfo = locationInfo;

            if (minimal === 'true') {
                responseData.data = responseData.data.map(day => ({
                    date: day.date,
                    dateFormatted: day.dateFormatted,
                    dayLabel: day.dayLabel,
                    temperature: day.temperature,
                    temperatureMin: day.temperatureMin,
                    temperatureMax: day.temperatureMax,
                    sky: day.sky,
                    precipitation: day.precipitation,
                    precipitationProbability: day.precipitationProbability,
                    weatherStatus: day.weatherStatus,
                    sensoryTemperature: day.sensoryTemperature
                }));
                delete responseData.weatherCodes;
            }

            return res.status(200).json(responseData);
        }
        metrics.cacheMisses++;

        logger.info('🌤️ 기상청 API 호출 시작', {
            baseDate,
            baseTime,
            nx: coordinates.nx,
            ny: coordinates.ny,
            location: locationInfo.fullName
        });

        const endApiCallTimer = performanceLogger.startTimer('기상청 API 호출');
        const response = await apiCallWithRetry(WEATHER_CONFIG.API.BASE_URL, {
            params: {
                serviceKey: weatherApiKey,
                numOfRows: 300,
                pageNo: 1,
                dataType: 'JSON',
                base_date: baseDate,
                base_time: baseTime,
                nx: coordinates.nx,
                ny: coordinates.ny
            },
            headers: {
                'User-Agent': 'HealingK-Complete-Weather-Service/2.0'
            }
        }, WEATHER_CONFIG.API.MAX_RETRIES);
        endApiCallTimer();

        if (!response.data?.response?.body?.items?.item) {
            throw new WeatherAPIError('기상청 API 응답에 날씨 데이터가 없습니다.', 'API_RESPONSE_EMPTY', 500);
        }

        const resultCode = response.data.response.header.resultCode;
        if (resultCode !== '00') {
            const errorMsg = ERROR_MESSAGES[resultCode] || `알 수 없는 오류 (코드: ${resultCode})`;
            throw new WeatherAPIError(`기상청 API 오류: ${errorMsg}`, `API_ERROR_${resultCode}`, ['10', '11'].includes(resultCode) ? 400 : 500);
        }

        const items = response.data.response.body.items.item || [];
        logger.info('📊 받은 기상 데이터 항목 수', { count: items.length });

        const weatherData = processCompleteWeatherData(items, kst, actualLocationFullName);

        logger.info('✅ 완전한 날씨 데이터 처리 완료', { days: weatherData.length });

        let responseData = {
            success: true,
            data: weatherData,
            locationInfo: locationInfo,
            apiInfo: {
                source: '기상청 단기예보 API',
                note: '기상청 단기예보 API 기준입니다. 실시간 관측값과 차이가 있을 수 있으며, 어제와의 비교 정보는 현재 API에서 제공하지 않습니다.',
                baseDate: baseDate,
                baseTime: baseTime,
                timestamp: new Date().toISOString(),
                apiKeyUsed: 'WEATHER_API_KEY',
                totalCategories: Object.keys(WEATHER_CODES).length,
                dataPoints: items.length,
                version: '2.0-complete'
            },
            weatherCodes: detailed === 'true' ? WEATHER_CODES : undefined
        };

        if (minimal === 'true') {
            responseData.data = weatherData.map(day => ({
                date: day.date,
                dateFormatted: day.dateFormatted,
                dayLabel: day.dayLabel,
                temperature: day.temperature,
                temperatureMin: day.temperatureMin,
                temperatureMax: day.temperatureMax,
                sky: day.sky,
                precipitation: day.precipitation,
                precipitationProbability: day.precipitationProbability,
                weatherStatus: day.weatherStatus,
                sensoryTemperature: day.sensoryTemperature
            }));
            delete responseData.weatherCodes;
        }

        weatherCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        if (weatherCache.size > WEATHER_CONFIG.CACHE.MAX_ENTRIES) {
            const oldestKey = weatherCache.keys().next().value;
            weatherCache.delete(oldestKey);
            logger.info('🧹 캐시 정리 완료', { currentCacheSize: weatherCache.size });
        }

        logger.info('🎉 완전한 날씨 API 응답 성공');
        return res.status(200).json(responseData);

    } catch (error) {
        logger.error(`완전한 날씨 API 오류: ${error.message}`, error, requestInfo);

        if (error instanceof WeatherAPIError) {
            return res.status(error.statusCode).json({
                success: false,
                data: null,
                error: error.message,
                code: error.code
            });
        }

        return res.status(500).json({
            success: false,
            data: null,
            error: '서버 내부 오류가 발생했습니다.',
            code: 'UNKNOWN_SERVER_ERROR'
        });
    }
}

/**
 * 필수 환경 변수 검증
 */
function validateEnvironment() {
    const required = ['WEATHER_API_KEY'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
        throw new Error(`필수 환경 변수 누락: ${missing.join(', ')}. 프로덕션 환경에서는 서비스 시작이 불가능합니다.`);
    } else if (missing.length > 0) {
        logger.warn(`필수 환경 변수 누락 (개발/테스트 환경): ${missing.join(', ')}`);
    }

    return {
        isValid: missing.length === 0,
        missing
    };
}

/**
 * 메인 서버리스 핸들러 함수
 */
module.exports = async function handler(req, res) {
    // 서버 초기화
    if (!global.weatherServiceInitialized) {
        validateEnvironment();
        if (Object.keys(locationData).length > 0 && process.env.WEATHER_API_KEY) {
            await preloadPopularLocations();
        } else {
            logger.warn('사전 캐싱 조건이 충족되지 않아 건너뜁니다 (locationData 없음 또는 API 키 없음).');
        }
        global.weatherServiceInitialized = true;
    }

    // 보안 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            message: 'GET 요청만 지원됩니다.'
        });
    }

    // Rate Limiting
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
        if (process.env.NODE_ENV === 'production' && clientIp) {
            checkRateLimit(clientIp, 100, 60 * 1000);
        }
    } catch (error) {
        if (error instanceof WeatherAPIError && error.code === 'RATE_LIMIT_EXCEEDED') {
            logger.warn(`Rate Limit 초과: ${clientIp}`, { error_message: error.message });
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code
            });
        }
        throw error;
    }

    const pathname = getPathname(req);

    if (pathname === '/api/health') {
        logger.info('헬스체크 요청 수신');
        return res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0-complete',
            cacheSize: weatherCache.size,
            metrics: {
                apiCalls: metrics.apiCalls,
                apiErrors: metrics.apiErrors,
                cacheHits: metrics.cacheHits,
                cacheMisses: metrics.cacheMisses,
                rateLimited: metrics.rateLimited,
                avgResponseTimeMs: metrics.avgResponseTime.toFixed(2),
                regionalRequests: metrics.regionalRequests,
                errorTypes: metrics.errorTypes
            },
            config: {
                hasApiKey: !!process.env.WEATHER_API_KEY,
                environment: process.env.NODE_ENV || 'production',
                cacheTtlMinutes: WEATHER_CONFIG.CACHE.TTL_MINUTES,
                apiTimeoutMs: WEATHER_CONFIG.API.TIMEOUT,
                apiMaxRetries: WEATHER_CONFIG.API.MAX_RETRIES
            },
            uptime: process.uptime ? `${process.uptime().toFixed(2)}s` : 'N/A'
        });
    }

    if (pathname === '/api/search/locations') {
        return handleLocationSearch(req, res);
    }

    return handleWeatherRequest(req, res);
};
