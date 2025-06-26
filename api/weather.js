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
    avgResponseTime: 0, // 평균 응답 시간 (단순화된 누적 합계/카운트)
    totalResponseTime: 0,
    responseTimeCount: 0,
    regionalRequests: {}, // 지역별 요청 통계 (예: { '서울특별시': 10, '제주시': 5 })
    errorTypes: {},       // 에러 타입별 분류 (예: { 'API_ERROR_22': 3, 'LOCATION_NOT_FOUND': 1 } 총 에러 종류
    // responseTimeHistogram: { '0-100ms': 0, '101-500ms': 0, '501-1000ms': 0, '>1000ms': 0 }, // 응답 시간 히스토그램 (더 복잡한 구현 필요)

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
        // for (const key in metrics.responseTimeHistogram) metrics.responseTimeHistogram[key] = 0;
    },
    // 응답 시간 추가 및 평균 계산
    addResponseTime: (duration) => {
        metrics.totalResponseTime += duration;
        metrics.responseTimeCount++;
        metrics.avgResponseTime = metrics.totalResponseTime / metrics.responseTimeCount;
        // if (duration <= 100) metrics.responseTimeHistogram['0-100ms']++;
        // else if (duration <= 500) metrics.responseTimeHistogram['101-500ms']++;
        // else if (duration <= 1000) metrics.responseTimeHistogram['501-1000ms']++;
        // else metrics.responseTimeHistogram['>1000ms']++;
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
    // 에러 로그 출력 (구조화된 로깅으로 개선)
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
        metrics.apiErrors++; // 에러 발생 시 메트릭 증가
        metrics.addErrorType(error.code || 'UNKNOWN'); // 에러 타입별 메트릭 증가
    }
};
// =====================================================================

// =====================================================================
// 1. locationData.js 의존성 처리 (안전한 import와 폴백 처리)
// locationModule의 모든 속성을 항상 유효한 기본값으로 초기화합니다.
let locationModule = {
    locationData: {}, // 항상 빈 객체로 시작하여 TypeError 방지
    searchLocations: (q, p, s) => ({ results: [], pagination: { currentPage: p, totalPages: 0, totalResults: 0 } }),
    findMatchingLocation: (coords) => null,
    findAllMatches: (q) => {
        // locationData.js가 로드되지 않았을 때의 폴백 (주요 도시만)
        const MAJOR_CITIES_FALLBACK = {
            '서울특별시': { lat: 37.5665, lon: 126.9780, name: '서울특별시', type: '광역자치단체', priority_score: 1000 },
            '부산광역시': { lat: 35.1796, lon: 129.0756, name: '부산광역시', type: '광역자치단체', priority_score: 980 },
            '제주특별자치도': { lat: 33.4996, lon: 126.5312, name: '제주특별자치도', type: '광역자치단체', priority_score: 1000 }
        };
        const normalizedQuery = q.trim().toLowerCase();
        const results = Object.values(MAJOR_CITIES_FALLBACK).filter(loc =>
            loc.name.toLowerCase().includes(normalizedQuery) ||
            (loc.aliases && loc.aliases.some(alias => alias.toLowerCase().includes(normalizedQuery)))
        ).map(loc => ({ ...loc, key: loc.name, priority: loc.priority_score }));
        return results.sort((a, b) => b.priority - a.priority);
    },
    latLonToGrid: (lat, lon) => {
        // locationData.js가 없어 기본 격자 좌표(서울)를 반환합니다.
        return { nx: 60, ny: 127 };
    }
};

try {
    const loaded = require('./locationData.js');
    if (loaded && typeof loaded === 'object') {
        // require 성공 시, locationModule의 속성을 로드된 모듈의 속성으로 덮어씁니다.
        // 이렇게 하면 기본값으로 초기화된 후 실제 데이터가 병합됩니다.
        Object.assign(locationModule, loaded);
    } else {
        // 모듈이 유효한 객체를 내보내지 않은 경우 (null, undefined, 비객체 등)
        throw new Error('locationData.js가 유효한 객체를 내보내지 않았습니다.');
    }
} catch (error) {
    // locationData.js 로드 실패 시 에러 로깅.
    // locationModule은 이미 기본값으로 초기화되어 있으므로 추가적인 폴백 로직은 필요 없습니다.
    logger.error('locationData.js를 로드하는 데 실패했습니다. 지역 검색 및 좌표 변환 기능이 제한됩니다.', error);
}

// locationModule에서 필요한 변수들을 구조 분해 할당합니다.
// 이제 locationData는 항상 객체이므로 안전하게 Object.keys() 등을 사용할 수 있습니다.
const { locationData, searchLocations, findMatchingLocation, findAllMatches, latLonToGrid } = locationModule;

// =====================================================================

// Vercel 서버리스용 캐시 (인메모리 캐시 - 서버리스 환경에서는 인스턴스별 동작. 외부 캐시 고려 필요)
let weatherCache = new Map();

// =====================================================================
// 1. 설정 관리 개선: 모든 설정 값을 한 곳에서 관리 (환경별 설정 분리 포함)
const WEATHER_CONFIG = {
    API: {
        BASE_URL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
        TIMEOUT: process.env.NODE_ENV === 'production' ? 8000 : 10000, // 환경별 타임아웃 설정
        MAX_RETRIES: process.env.NODE_ENV === 'production' ? 5 : 3 // 환경별 재시도 횟수
    },
    CACHE: {
        TTL_MINUTES: process.env.NODE_ENV === 'production' ? 60 : 30, // 환경별 캐시 유효 시간 (분)
        MAX_ENTRIES: 100 // 최대 캐시 항목 수
    },
    DEFAULTS: {
        REGION: '서울특별시', // 기본 지역 설정
        PAGE_SIZE: 10 // 지역 검색 시 기본 페이지당 항목 수
    }
};
// =====================================================================

// 완전한 기상청 날씨 코드 매핑
const WEATHER_CODES = {
    // 하늘상태 (SKY) - 기상청 공식 전체 코드
    SKY: {
        '1': '맑음',
        '2': '구름조금',
        '3': '구름많음',
        '4': '흐림',
        '5': '매우흐림',
        '6': '흐리고비',
        '7': '흐리고눈',
        '8': '흐리고비/눈',
        '9': '흐리고소나기',
        '10': '안개'
    },

    // 강수형태 (PTY) - 기상청 공식 전체 코드
    PTY: {
        '0': '없음',
        '1': '비',
        '2': '비/눈',
        '3': '눈',
        '4': '소나기',
        '5': '빗방울',
        '6': '빗방울/눈날림',
        '7': '눈날림',
        '8': '진눈깨비',
        '9': '우박',
        '10': '이슬비',
        '11': '뇌우',
        '12': '폭우',
        '13': '폭설'
    },

    // 강수확률 (POP) - 단계별 설명
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

    // 강수량 (PCP) - 세부 단계
    PCP: {
        '강수없음': '0mm',
        '1mm 미만': '1mm 미만 (이슬비)',
        '1': '1mm (약한 비)',
        '2': '2mm (약한 비)',
        '3': '3mm (약한 비)',
        '4': '4mm (약한 비)',
        '5': '5mm (보통 비)',
        '10': '10mm (강한 비)',
        '15': '15mm (강한 비)',
        '20': '20mm (강한 비)',
        '25': '25mm (매우 강한 비)',
        '30': '30mm (매우 강한 비)',
        '40': '40mm (폭우)',
        '50': '50mm (폭우)',
        '60': '60mm (폭우)',
        '70': '70mm (폭우)',
        '80': '80mm (폭우)',
        '90': '90mm (폭우)',
        '100': '100mm 이상 (폭우)'
    },

    // 적설량 (SNO) - 세부 단계
    SNO: {
        '적설없음': '0cm',
        '1cm 미만': '1cm 미만 (가벼운 눈)',
        '1': '1cm (가벼운 눈)',
        '2': '2cm (가벼운 눈)',
        '3': '3cm (가벼운 눈)',
        '4': '4cm (가벼운 눈)',
        '5': '5cm (보통 눈)',
        '10': '10cm (많은 눈)',
        '15': '15cm (많은 눈)',
        '20': '20cm (많은 눈)',
        '25': '25cm (폭설)',
        '30': '30cm (폭설)',
        '40': '40cm (폭설)',
        '50': '50cm 이상 (폭설)'
    },

    // 파고 (WAV) - 완전한 파도 높이 매핑
    WAV: {
        '0': '0m (잔잔)',
        '0.5': '0.5m 미만 (낮음)',
        '1.0': '0.5~1.0m (보통)',
        '1.5': '1.0~1.5m (약간 높음)',
        '2.0': '1.5~2.0m (높음)',
        '2.5': '2.0~2.5m (높음)',
        '3.0': '2.5~3.0m (매우 높음)',
        '4.0': '3.0~4.0m (위험)',
        '5.0': '4.0m 이상 (매우 위험)'
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

// =====================================================================
// 3. 성능 모니터링 (performanceLogger는 이제 metrics 객체를 활용)
const performanceLogger = {
    startTimer: (operation) => {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            logger.info(`성능 측정: ${operation}`, { duration: `${duration}ms` });
            metrics.addResponseTime(duration); // 응답 시간 메트릭에 추가
        };
    }
};
// =====================================================================

// =====================================================================
// 2. Rate Limiting 구현
const rateLimitMap = new Map(); // IP별 요청 시간을 저장 (서버리스 인스턴스별)

/**
 * **Rate Limit 데이터 영속성 재고:**
 * 현재 `rateLimitMap`은 인메모리 Map을 사용하므로, 서버리스 환경에서 콜드 스타트가 발생하면 데이터가 초기화됩니다.
 * 이는 단일 인스턴스에서는 문제가 없지만, 다수의 인스턴스가 동시에 실행되는 분산 환경에서는 정확한 Rate Limiting이 어렵습니다.
 * **개선안:** 분산 환경에서는 Redis, Vercel KV, 또는 기타 영속적인 외부 캐시/저장소 서비스를 활용하여 Rate Limit 데이터를 공유하고 관리해야 합니다.
 */
/**
 * IP 주소 기반 요청 Rate Limit을 체크합니다.
 * @param {string} ip - 클라이언트 IP 주소
 * @param {number} limit - 허용되는 요청 수
 * @param {number} windowMs - 시간 윈도우 (밀리초)
 * @throws {WeatherAPIError} 요청 한도 초과 시
 */
function checkRateLimit(ip, limit = 100, windowMs = 60 * 1000) { // 기본 1분당 100회 요청
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];

    // 윈도우 내의 요청만 필터링
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= limit) {
        metrics.rateLimited++; // Rate Limit 메트릭 증가
        throw new WeatherAPIError('요청 한도 초과입니다. 잠시 후 다시 시도해주세요.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    recentRequests.push(now);
    // 캐시 사이즈 관리를 위해 오래된 요청 제거
    while (recentRequests.length > limit) {
        recentRequests.shift();
    }
    rateLimitMap.set(ip, recentRequests);
    logger.info(`Rate Limit 체크: ${ip}, 요청 수: ${recentRequests.length}/${limit}`);
}
// =====================================================================

/**
 * @typedef {Object} WeatherForecastItem - 기상청 API 응답에서 파싱된 개별 날씨 예보 항목
 * @property {string} category - 예보 항목의 종류 (예: 'TMP', 'SKY', 'PTY')
 * @property {string} fcstDate - 예보 날짜 (YYYYMMDD)
 * @property {string} fcstTime - 예보 시간 (HHMM)
 * @property {string} fcstValue - 예보 값
 * @property {number} nx - 예보 지점 X 좌표
 * @property {number} ny - 예보 지점 Y 좌표
 */

/**
 * @typedef {Object} DailyWeatherData - 가공된 일별 날씨 데이터
 * @property {string} date - 날짜 (YYYYMMDD)
 * @property {string} dateFormatted - 포맷된 날짜 (YYYY-MM-DD)
 * @property {string} dayLabel - 요일 라벨 (예: '오늘', '내일')
 * @property {number} dayIndex - 날짜 인덱스 (0: 오늘, 1: 내일, 2: 모레)
 * @property {string} representativeTime - 대표 시간 (HHMM)
 * @property {number|null} temperature - 대표 시간 기온
 * @property {number|null} temperatureMin - 일별 최저 기온
 * @property {number|null} temperatureMax - 일별 최고 기온
 * @property {string} temperatureUnit - 기온 단위 (°C)
 * @property {string} temperatureDescription - 기온에 대한 설명
 * @property {string|null} sensoryTemperature - 체감 온도 (소수점 첫째 자리)
 * @property {string} sensoryTemperatureDescription - 체감 온도에 대한 설명
 * @property {string|null} temperatureCompareYesterday - 어제 대비 기온 변화 (현재 미구현)
 * @property {string} sky - 하늘 상태에 대한 설명 (예: '맑음', '흐림')
 * @property {string|null} skyCode - 하늘 상태 코드
 * @property {string} skyDescription - 하늘 상태 코드에 대한 상세 설명
 * @property {string} precipitation - 강수 형태에 대한 설명 (예: '비', '눈')
 * @property {string|null} precipitationCode - 강수 형태 코드
 * @property {string} precipitationDescription - 강수 형태 코드에 대한 상세 설명
 * @property {number|null} precipitationProbability - 대표 시간 강수확률
 * @property {number} precipitationProbabilityMax - 일별 최대 강수확률
 * @property {string} precipitationProbabilityDescription - 강수확률에 대한 상세 설명
 * @property {string} precipitationAmount - 강수량
 * @property {string} precipitationAmountDescription - 강수량에 대한 상세 설명
 * @property {string} snowAmount - 적설량
 * @property {string} snowAmountDescription - 적설량에 대한 상세 설명
 * @property {number|null} humidity - 습도
 * @property {string} humidityUnit - 습도 단위 (%)
 * @property {string} humidityDescription - 습도에 대한 설명
 * @property {string|null} windSpeed - 풍속
 * @property {string} windSpeedUnit - 풍속 단위 (m/s)
 * @property {string} windSpeedDescription - 풍속에 대한 설명
 * @property {string|null} windSpeedRange - 풍속 범위 (예: 3~6m/s)
 * @property {string} windDirection - 풍향 (16방위)
 * @property {number|null} windDirectionDegree - 풍향 각도
 * @property {string} windDirectionDescription - 풍향에 대한 상세 설명
 * @property {string|null} waveHeight - 파고
 * @property {string} waveHeightDescription - 파고에 대한 상세 설명
 * @property {number|null} uvIndex - 자외선 지수 (있는 경우)
 * @property {number|null} visibility - 가시거리 (있는 경우)
 * @property {string} weatherStatus - 종합 날씨 상태 요약
 * @property {string} weatherAdvice - 날씨 기반 맞춤형 조언
 * @property {Array<Object>} hourlyData - 시간별 상세 날씨 데이터
 */

/**
 * 기상청 API 응답 데이터를 가공하여 3일간의 완전한 날씨 정보 반환
 * @param {Array<WeatherForecastItem>} items - 기상청 API에서 반환된 날씨 데이터 항목 배열
 * @param {Date} kst - 한국 표준시 Date 객체 (현재 시각 기준)
 * @param {string} locationFullName - 요청된 지역의 전체 이름 (예: '제주특별자치시 서귀포시 성산읍')
 * @returns {Array<DailyWeatherData>} 가공된 3일간의 날씨 데이터 배열
 */
function processCompleteWeatherData(items, kst, locationFullName) {
    const forecasts = {};

    // 오늘, 내일, 모레 날짜 계산
    const today = kst.toISOString().slice(0, 10).replace(/-/g, '');
    const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    // 기상청 단기예보 API는 보통 최대 48시간 (오늘과 내일) 데이터를 제공합니다.
    // 따라서 '모레'에 해당하는 데이터는 API 응답에 포함되지 않을 수 있습니다.
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
                dailyData: { // dailyData는 이제 hourlyData에서 집계되므로 비워둡니다.
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
        // '모레' 데이터는 API에서 제공하지 않을 수 있음
        if (forecasts[date]) {
            // kst (현재 시각)를 extractCompleteWeatherData에 전달하여 가장 가까운 예보 시간을 찾도록 함
            const dayData = extractCompleteWeatherData(forecasts[date], date, kst, locationFullName);
            dayData.dayLabel = index === 0 ? '오늘' : index === 1 ? '내일' : '모레';
            dayData.dayIndex = index;

            // 5. 데이터 검증 함수 활용
            validateWeatherData(dayData);

            result.push(dayData);
        }
    });

    return result;
}

/**
 * 일별 날씨 데이터에서 필요한 정보 추출 및 가공
 * @param {Object} dayForecast - 특정 일자의 날씨 예측 데이터
 * @param {string} date - 날짜 (YYYYMMDD 형식)
 * @param {Date} kst - 한국 표준시 Date 객체 (현재 시각 기준)
 * @param {string} locationFullName - 요청된 지역의 전체 이름
 * @returns {DailyWeatherData} 가공된 일별 날씨 데이터
 */
function extractCompleteWeatherData(dayForecast, date, kst, locationFullName) {
    const times = dayForecast.times;
    const forecastDateObj = new Date(parseInt(date.substring(0, 4)), parseInt(date.substring(4, 6)) - 1, parseInt(date.substring(6, 8)));

    const timeKeys = Object.keys(times).sort(); // 예보 시간들 (예: ["0200", "0500", "0800", ..., "2300"])

    let bestRepresentativeTime = null;
    const currentKstHours = kst.getHours();
    const currentKstMinutes = kst.getMinutes();

    // 1. 현재 시각 이후의 가장 가까운 예보 시간을 찾습니다.
    for (const fcstTimeStr of timeKeys) {
        const fcstHour = parseInt(fcstTimeStr.substring(0, 2), 10);
        const fcstMinute = parseInt(fcstTimeStr.substring(2, 4), 10);

        // 현재 날짜의 예보라면, 현재 시각보다 미래인 예보 시간 중 가장 가까운 것을 찾습니다.
        if (forecastDateObj.toDateString() === kst.toDateString()) { // 오늘 날짜
            // 현재 시각보다 미래이거나 같은 시간
            if (fcstHour > currentKstHours || (fcstHour === currentKstHours && fcstMinute >= currentKstMinutes)) {
                bestRepresentativeTime = fcstTimeStr;
                break; // 가장 가까운 미래 시간을 찾았으므로 루프 종료
            }
        } else { // 미래 날짜 (내일, 모레)
            bestRepresentativeTime = timeKeys[0]; // 해당 날짜의 첫 번째 예보 시간을 대표 시간으로 설정
            break;
        }
    }

    // 2. 만약 현재 시각 이후의 예보가 없거나 (모든 예보 시간이 이미 지난 경우), 당일의 가장 마지막 예보 시간을 선택합니다.
    if (!bestRepresentativeTime && timeKeys.length > 0) {
        bestRepresentativeTime = timeKeys[timeKeys.length - 1]; // 가장 늦은 시간
    }

    // 3. 데이터가 아예 없는 경우를 대비한 폴백
    if (!bestRepresentativeTime && timeKeys.length === 0) {
        logger.warn(`[WARN] 날씨 데이터를 찾을 수 없어 대표 시간을 설정할 수 없습니다. 날짜: ${date}`);
        // 이 경우, 반환될 DailyWeatherData 객체가 유효하지 않을 수 있으므로,
        // 이 함수를 호출하는 상위 함수에서 null 체크 또는 빈 데이터 처리가 필요합니다.
        return {
            date: date,
            dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
            representativeTime: null,
            temperature: null, temperatureMin: null, temperatureMax: null, temperatureUnit: '°C', temperatureDescription: '정보없음',
            sensoryTemperature: null, sensoryTemperatureDescription: '정보없음', temperatureCompareYesterday: null,
            sky: '정보없음', skyCode: null, skyDescription: '정보없음',
            precipitation: '정보없음', precipitationCode: null, precipitationDescription: '정보없음',
            precipitationProbability: 0, precipitationProbabilityMax: 0, precipitationProbabilityDescription: '0% (강수 없음)',
            precipitationAmount: '0mm', precipitationAmountDescription: '0mm',
            snowAmount: '0cm', snowAmountDescription: '0cm',
            humidity: null, humidityUnit: '%', humidityDescription: '정보없음',
            windSpeed: null, windSpeedUnit: 'm/s', windSpeedDescription: '정보없음',
            windSpeedRange: null, windDirection: '정보없음', windDirectionDegree: null, windDirectionDescription: '정보없음',
            waveHeight: null, waveHeightDescription: '정보없음', uvIndex: null, visibility: null,
            weatherStatus: '정보없음', weatherAdvice: '정보를 확인할 수 없습니다',
            hourlyData: []
        };
    }

    const data = bestRepresentativeTime ? times[bestRepresentativeTime] : {};

    // 일별 최저/최고 기온 및 최대 강수확률 추출 (시간별 데이터에서 재집계)
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

    // 데이터가 유효하지 않을 경우 (Infinity 또는 -Infinity) null로 처리
    minTemp = minTemp === Infinity ? null : minTemp;
    maxTemp = maxTemp === -Infinity ? null : maxTemp;


    // 체감온도 계산
    const currentTemperature = data.TMP ? parseFloat(data.TMP) : null;
    const currentHumidity = data.REH ? parseInt(data.REH) : null;
    const currentWindSpeed = data.WSD ? parseFloat(data.WSD) : null;
    const sensoryTemp = calculateSensoryTemperature(currentTemperature, currentHumidity, currentWindSpeed);

    // 완전한 날씨 정보 생성
    return {
        date: date,
        dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        representativeTime: bestRepresentativeTime, // 동적으로 선택된 대표 시간

        // 기온 정보 (완전)
        temperature: data.TMP ? Math.round(parseFloat(data.TMP)) : null,
        temperatureMin: minTemp ? Math.round(minTemp) : null, // 재집계된 최저 기온
        temperatureMax: maxTemp ? Math.round(maxTemp) : null, // 재집계된 최고 기온
        temperatureUnit: '°C',
        temperatureDescription: getTemperatureDescription(data.TMP),
        sensoryTemperature: sensoryTemp, // 체감온도 추가
        sensoryTemperatureDescription: sensoryTemp !== null ? getTemperatureDescription(sensoryTemp) : '정보없음',
        temperatureCompareYesterday: null, // 어제와의 비교: 현재 미구현 (이력 데이터 필요)

        // 하늘 상태 (완전)
        sky: getSkyDescription(data.SKY),
        skyCode: data.SKY,
        skyDescription: WEATHER_CODES.SKY[data.SKY] || '정보없음',

        // 강수 정보 (완전)
        precipitation: getPrecipitationDescription(data.PTY),
        precipitationCode: data.PTY,
        precipitationDescription: WEATHER_CODES.PTY[data.PTY] || '없음',
        precipitationProbability: data.POP ? parseInt(data.POP) : 0,
        precipitationProbabilityMax: Math.round(maxPop), // 재집계된 최대 강수확률
        precipitationProbabilityDescription: WEATHER_CODES.POP[data.POP] || '0% (강수 없음)',
        precipitationAmount: processPrecipitationAmount(data.PCP),
        precipitationAmountDescription: WEATHER_CODES.PCP[data.PCP] || '0mm',

        // 적설 정보 (완전)
        snowAmount: processSnowAmount(data.SNO),
        snowAmountDescription: WEATHER_CODES.SNO[data.SNO] || '0cm',

        // 습도 정보 (완전)
        humidity: data.REH ? parseInt(data.REH) : null,
        humidityUnit: '%',
        humidityDescription: getHumidityDescription(data.REH),

        // 풍속/풍향 정보 (완전)
        windSpeed: data.WSD ? parseFloat(data.WSD).toFixed(1) : null,
        windSpeedUnit: 'm/s',
        // 제주 지역 특성 반영
        windSpeedDescription: getWindSpeedDescription(data.WSD, locationFullName.includes('제주')),
        windSpeedRange: data.WSD ? `${Math.max(0, parseFloat(data.WSD) - 1).toFixed(1)}~${(parseFloat(data.WSD) + 2).toFixed(1)}m/s` : null,
        windDirection: getWindDirectionFromDegree(data.VEC),
        windDirectionDegree: data.VEC ? parseFloat(data.VEC) : null,
        windDirectionDescription: data.VEC ? `${getWindDirectionFromDegree(data.VEC)} (${data.VEC}도)` : '정보없음',

        // 파고 정보 (완전)
        waveHeight: data.WAV || null,
        waveHeightDescription: WEATHER_CODES.WAV[data.WAV] || '정보없음',

        // 추가 상세 정보
        uvIndex: data.UVI || null,
        visibility: data.VIS || null,

        // 종합 날씨 상태
        weatherStatus: getOverallWeatherStatus(data),
        weatherAdvice: getWeatherAdvice(data, locationFullName), // 날씨 조언에도 지역 정보 전달

        // 시간별 상세 데이터 (선택적으로 포함)
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
                sensoryTemperature: hourlySensoryTemp, // 시간별 체감온도 추가
                sky: WEATHER_CODES.SKY[hourData.SKY] || '정보없음',
                precipitation: WEATHER_CODES.PTY[hourData.PTY] || '없음',
                precipitationProbability: hourData.POP ? parseInt(hourData.POP) : 0,
                humidity: hourData.REH ? parseInt(hourData.REH) : null,
                windSpeed: hourlyWindSpeed ? hourlyWindSpeed.toFixed(1) : null,
                windSpeedRange: hourlyWindSpeed ? `${Math.max(0, hourlyWindSpeed - 1).toFixed(1)}~${(hourlyWindSpeed + 2).toFixed(1)}m/s` : null,
            };
        }).sort((a, b) => a.time.localeCompare(b.time))
    };
}

/**
 * 기온, 습도, 풍속을 기반으로 체감온도를 계산합니다. (개선된 공식 적용)
 * 이 공식은 온열지수(Heat Index)와 윈드칠(Wind Chill)을 단순화하여 반영합니다.
 * 더 현실적인 체감온도를 제공하도록 계수를 조정했습니다.
 * @param {number|null} temperature - 실제 기온 (°C)
 * @param {number|null} humidity - 상대 습도 (%)
 * @param {number|null} windSpeed - 풍속 (m/s)
 * @returns {string|null} 계산된 체감온도 (소수점 첫째 자리) 또는 null
 */
function calculateSensoryTemperature(temperature, humidity, windSpeed) {
    if (temperature === null || humidity === null || windSpeed === null) {
        return null;
    }

    const T = parseFloat(temperature); // 기온
    const RH = parseFloat(humidity);   // 상대 습도
    const WS = parseFloat(windSpeed); // 풍속

    let feelsLike;

    if (T >= 25) { // 쾌적 범위 이상: 더위 체감 (온열 지수 단순화)
        // 습도 영향 강화 및 온도와의 조화 고려
        // 계수 조정으로 습도에 따른 체감 온도 상승폭 확대
        feelsLike = T + (RH / 100) * (T - 20) * 0.25; // 이전 0.15에서 0.25로 증가
    } else if (T <= 10) { // 서늘 범위 이하: 추위 체감 (윈드칠 지수 단순화)
        // 바람 영향 강화 및 기본 하락 폭 증가
        feelsLike = T - (WS * 1.2) - 1.5; // 이전 0.8에서 1.2로 증가, 기본 -1에서 -1.5로 증가
    } else { // 쾌적 범위: 실제 기온과 유사하되 습도/바람 영향 추가
        feelsLike = T;
        // 쾌적한 범위에서도 습도와 바람이 있다면 미세하게 체감온도에 영향
        feelsLike += (RH - 50) * 0.04; // 습도가 50% 기준, 10%당 0.4도 변화 (이전 0.05에서 조정)
        feelsLike -= (WS * 0.3); // 바람 1m/s당 0.3도 하락 (이전 0.2에서 조정)
    }

    // 너무 극단적인 값 방지
    // 실제 기온과의 차이를 최대 5도로 제한 (더 큰 차이도 있을 수 있지만 일반적인 경우에 맞춰 조정)
    if (feelsLike > T + 5) feelsLike = T + 5;
    if (feelsLike < T - 5) feelsLike = T - 5;


    if (isNaN(feelsLike)) {
        return null;
    }

    return feelsLike.toFixed(1);
}


// **기온에 따른 설명 반환**
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

// **하늘 상태 코드에 따른 설명 반환**
function getSkyDescription(code) {
    return WEATHER_CODES.SKY[code] || '정보없음';
}

// **강수 형태 코드에 따른 설명 반환**
function getPrecipitationDescription(code) {
    return WEATHER_CODES.PTY[code] || '없음';
}

// **강수량 값 처리 및 설명 반환**
function processPrecipitationAmount(pcp) {
    if (!pcp || pcp === '강수없음' || pcp === '0') return '0mm';
    if (pcp === '1mm 미만') return '1mm 미만';
    if (pcp.includes('mm')) return pcp;
    return `${pcp}mm`;
}

// **적설량 값 처리 및 설명 반환**
function processSnowAmount(sno) {
    if (!sno || sno === '적설없음' || sno === '0') return '0cm';
    if (sno === '1cm 미만') return '1cm 미만';
    if (sno.includes('cm')) return sno;
    return `${sno}cm`;
}

// **습도에 따른 설명 반환**
function getHumidityDescription(humidity) {
    if (!humidity) return '정보없음';
    const h = parseInt(humidity);
    if (h <= 20) return '매우 건조';
    if (h <= 40) return '건조';
    if (h <= 60) return '보통';
    if (h <= 80) return '습함';
    return '매우 습함';
}

// **풍속에 따른 설명 반환 (제주 지역 특성 반영)**
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
        return `${desc} (변동 가능)`; // 제주 지역일 때 추가 문구
    }
    return desc;
}

// **풍향 각도에 따른 16방위 설명 반환**
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

// **주요 날씨 요소 기반 종합 날씨 상태 반환**
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

// **현재 날씨 데이터 기반 맞춤형 조언 반환 (제주 특성 반영)**
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
        if (precipType.includes('폭우')) advice.push('🌊 폭우 주의! 저지대 침수 조심');
    } else if (pop >= 60) {
        advice.push('🌧️ 강수 가능성 높음, 우산 준비 권장');
    } else if (pop >= 30) {
        advice.push('☁️ 구름 많음, 우산 휴대 권장');
    }

    // 바람 관련 조언
    if (wsd >= 14) advice.push('💨 강풍 주의! 야외활동 조심하세요');
    else if (wsd >= 10) advice.push('🌬️ 바람이 강해요, 모자나 가벼운 물건 주의');

    // 제주 특성 조언 추가
    if (isJeju) {
        advice.push('🌪️ 제주는 바람이 수시로 변하니 유의하세요');
    }

    return advice.length > 0 ? advice.join(' | ') : '쾌적한 날씨입니다';
}

/**
 * API 키가 없거나 오류 발생 시 완전한 샘플 데이터 생성
 * @param {string} region - 요청된 지역명
 * @param {string} [errorMessage=null] - 발생한 오류 메시지 (선택 사항)
 * @returns {Array<DailyWeatherData>} 샘플 날씨 데이터 배열
 */
function generateCompleteSampleData(region, errorMessage = null) {
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000);

    const dates = [];
    for (let i = 0; i < 3; i++) {
        const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
        dates.push(date);
    }

    const baseMessage = errorMessage
        ? `⚠️ 오류: ${errorMessage}`
        : '⚠️ WEATHER_API_KEY 설정 필요 - 샘플 데이터';
    const sampleTemps = [20, 22, 21];
    const sampleSkies = ['1', '3', '4'];
    const samplePrecips = ['0', '0', '1'];
    const sampleHumidity = [60, 70, 80];
    const sampleWindSpeed = [2.5, 3.0, 3.5];

    const defaultLocationFullName = '서울특별시';

    return dates.map((date, index) => {
        // 샘플 데이터의 hourlyData를 현재 시간 기준으로 재구성하여 representativeTime 계산에 활용
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
            },
            {
                time: '2100', // 새로운 샘플 시간 추가 (저녁 시간대 포함)
                timeFormatted: '21:00',
                temperature: Math.round(sampleTemps[index] - 1),
                humidity: sampleHumidity[index],
                windSpeed: sampleWindSpeed[index] - 0.5,
                sky: sampleSkies[index],
                precipitation: samplePrecips[index],
                precipitationProbability: [10, 30, 60][index],
            },
            {
                time: '2300', // 새로운 샘플 시간 추가 (밤 시간대 포함)
                timeFormatted: '23:00',
                temperature: Math.round(sampleTemps[index] - 2),
                humidity: sampleHumidity[index],
                windSpeed: sampleWindSpeed[index] - 1,
                sky: sampleSkies[index],
                precipitation: samplePrecips[index],
                precipitationProbability: [10, 30, 60][index],
            }
        ];

        // extractCompleteWeatherData와 동일한 로직으로 bestRepresentativeTime 선정
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

        // extractCompleteWeatherData 함수 재사용 (null 반환 방지 위해 직접 구현)
        const times = currentDayForecast.times;
        const timeKeys = Object.keys(times).sort();

        let bestRepTime = null;
        const currentKstHours = kst.getHours();
        const currentKstMinutes = kst.getMinutes();
        const forecastDateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

        if (forecastDateStr === kst.toISOString().slice(0, 10).replace(/-/g, '')) { // 오늘 날짜
            for (const fcstTimeStr of timeKeys) {
                const fcstHour = parseInt(fcstTimeStr.substring(0, 2), 10);
                const fcstMinute = parseInt(fcstTimeStr.substring(2, 4), 10);
                if (fcstHour > currentKstHours || (fcstHour === currentKstHours && fcstMinute >= currentKstMinutes)) {
                    bestRepTime = fcstTimeStr;
                    break;
                }
            }
            if (!bestRepTime && timeKeys.length > 0) { // 오늘 예보 시간이 모두 지났다면 가장 마지막 예보
                bestRepTime = timeKeys[timeKeys.length - 1];
            }
        } else { // 미래 날짜 (내일, 모레)
            if (timeKeys.length > 0) {
                bestRepTime = timeKeys[0]; // 해당 날짜의 첫 번째 예보 시간을 대표 시간으로 설정
            }
        }
        // 최악의 경우 (데이터 없음) '0000'으로 폴백 (generateCompleteSampleData에만 해당)
        bestRepTime = bestRepTime || (timeKeys.length > 0 ? timeKeys[0] : '0000');


        const data = bestRepTime ? times[bestRepTime] : {};

        // 일별 최저/최고 기온 및 최대 강수확률 재집계 (샘플 데이터에서도)
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
            representativeTime: bestRepTime, // 동적으로 선택된 대표 시간

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
            precipitationProbabilityDescription: WEATHER_CODES.POP[data.POP] || '0% (강수 없음)',
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
 * URL pathname을 안전하게 추출하는 헬퍼 함수.
 * Vercel과 같은 서버리스 환경에서 req.headers.host가 없을 경우를 대비합니다.
 * @param {Object} req - 요청 객체
 * @returns {string} 요청 URL의 pathname
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

// =====================================================================
// 8. 테스트 가능성 향상: calculateBaseTime을 순수 함수로 분리
/**
 * 현재 시간(시)을 기준으로 기상청 API의 base_time을 계산합니다.
 * @param {number} hour - 현재 시 (0-23)
 * @returns {string} 기상청 API base_time (HHMM 형식)
 */
const calculateBaseTime = (hour) => {
    // 기상청 단기예보는 02, 05, 08, 11, 14, 17, 20, 23시 발표 (정시보다 10분 후 확정)
    // 따라서 현재 시각 02:10 이전은 전날 23:00, 05:10 이전은 02:00 등으로 계산
    if (hour < 2) return '2300'; // 00, 01시는 전날 23시 기준
    if (hour < 5) return '0200';
    if (hour < 8) return '0500';
    if (hour < 11) return '0800';
    if (hour < 14) return '1100';
    if (hour < 17) return '1400';
    if (hour < 20) return '1700';
    if (hour < 23) return '2000';
    return '2300';
};
// =====================================================================

// =====================================================================
// 2. 재시도 로직 구현 & 7. 타임아웃 처리 개선 (AbortController 사용)
/**
 * API 호출을 재시도 로직과 함께 수행합니다.
 * 주로 'ECONNABORTED' (타임아웃) 오류에 대해 재시도합니다.
 * @param {string} url - 요청 URL
 * @param {Object} params - axios 요청 파라미터 객체
 * @param {number} [retries=WEATHER_CONFIG.API.MAX_RETRIES] - 남은 재시도 횟수
 * @returns {Promise<Object>} axios 응답 객체
 * @throws {Error} 재시도 횟수를 모두 소진하거나 다른 종류의 오류 발생 시
 */
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
        if (retries > 0 && (error.code === 'ECONNABORTED' || error.name === 'AbortError')) { // AbortError도 처리
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

// =====================================================================
// 10. 입력 검증 강화
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

// =====================================================================
// 5. 데이터 검증 함수 활용 (기존에 정의되어 있었으나 호출 추가)
/**
 * 날씨 데이터의 유효성을 간단하게 검증합니다.
 * @param {DailyWeatherData} data - 검증할 날씨 데이터
 * @returns {boolean} 데이터가 유효하면 true, 아니면 false
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
// =====================================================================

// =====================================================================
// 추가 개선 제안: 1. 에러 복구 전략 (기존 샘플 데이터 활용 강화)
// generateCompleteSampleData 함수가 이미 이 역할을 수행하고 있습니다.
// API 키가 없거나, API 호출이 실패하거나, 응답 데이터가 없을 때 호출됩니다.
// =====================================================================

// =====================================================================
// 추가 개선 제안: 2. 성능 최적화 (자주 요청되는 지역 데이터 사전 캐싱)
/**
 * 서버 시작 시 인기 지역의 날씨 데이터를 미리 캐싱합니다.
 */
async function preloadPopularLocations() {
    // locationData는 이제 항상 객체로 존재합니다.
    if (Object.keys(locationData).length === 0) {
        logger.warn('locationData가 로드되지 않아 인기 지역 사전 캐싱을 건너뜜니다.');
        return;
    }

    const popularRegions = ['서울특별시', '제주시', '부산광역시', '서귀포시']; // 인기 지역 목록
    const weatherApiKey = process.env.WEATHER_API_KEY;

    if (!weatherApiKey) {
        logger.warn('WEATHER_API_KEY가 없어 인기 지역 사전 캐싱을 건너뜜니다.');
        return;
    }

    for (const regionName of popularRegions) {
        try {
            const locationMatches = findAllMatches(regionName);
            if (locationMatches.length === 0) {
                logger.warn(`사전 캐싱을 위한 지역 '${regionName}'을(를) 찾을 수 없습니다.`);
                continue;
            }
            const location = locationMatches[0]; // 가장 적합한 매칭 사용

            const coordinates = latLonToGrid(location.lat, location.lon);
            const now = new Date();
            const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
            const baseTime = calculateBaseTime(kst.getHours());
            let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');

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
            const weatherData = processCompleteWeatherData(items, kst, location.name); // fullName 전달

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
                    note: '기상청 단기예보 API 기준입니다. 실시간 관측값과 차이가 있을 수 있으며, ' +
                        '어제와의 비교 정보는 현재 API에서 제공하지 않습니다.', // note 추가
                    baseDate: baseDate,
                    baseTime: baseTime,
                    timestamp: new Date().toISOString(),
                    apiKeyUsed: 'WEATHER_API_KEY',
                    totalCategories: Object.keys(WEATHER_CODES).length,
                    dataPoints: items.length,
                    version: '2.0-complete'
                },
                weatherCodes: WEATHER_CODES // 상세 정보 포함
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
// =====================================================================

/**
 * 지역 검색 API 핸들러 - 중복 제거 및 하이브리드 검색 지원
 * @param {Object} req - 요청 객체 (query: { q: string, page: number })
 * @param {Object} res - 응답 객체
 */
async function handleLocationSearch(req, res) {
    // 12. 에러 로깅 개선을 위한 요청 정보 미리 캡쳐
    const requestInfo = {
        url: req.url,
        query: req.query,
        headers: req.headers
    };
    try {
        const query = validateInput.region(req.query.q);
        const page = parseInt(req.query.page || 1);

        if (isNaN(page) || page < 1) {
            throw new WeatherAPIError('유효하지 않은 페이지 번호입니다.', 'INVALID_PAGE_NUMBER', 400);
        }

        // searchLocations 함수를 호출하여 페이지네이션된 결과를 받음
        const searchResult = searchLocations(query, page, WEATHER_CONFIG.DEFAULTS.PAGE_SIZE);

        logger.info('지역 검색 성공', {
            query: query,
            page: page,
            resultsCount: searchResult.results.length
        });

        // 검색 결과를 행정구역과 관련 장소로 분류
        const adminResults = [];
        const relatedResults = []; // 여기에는 카카오 API 결과가 들어갈 예정

        // 각 결과 항목의 displayName 최종 구성 (locationData.js에서 이미 처리)
        // 여기서는 locationData.js에서 넘어온 displayName을 그대로 사용합니다.
        const processedResults = searchResult.results.map(location => ({
            name: location.name, // 공식 행정구역 이름
            displayName: location.displayName, // locationData.js에서 개선된 형태
            type: location.type,
            searchType: location.searchType || 'direct', // 매칭 타입 추가 (searchType이 없으면 direct)
            lat: location.lat,
            lon: location.lon,
            key: location.key,
            priority: location.priority_score || location.priority || 0, // 우선순위 추가
            admin_parent: location.admin_parent, // 상위 행정구역
            legal_divisions: location.legal_divisions, // 관할 법정동 목록
            originalSearchTerm: location.originalSearchTerm || query // 원본 검색어 (검색된 방식과 관계없이)
        }));

        // 현재는 locationData.js에서 반환되는 모든 결과를 'adminDivisions'로 간주
        // 2단계에서 카카오 API 통합 시 'relatedPlaces'에 실제 장소 데이터 추가
        processedResults.forEach(loc => {
            adminResults.push({
                name: loc.name,
                displayName: loc.displayName,
                type: loc.type,
                originalSearchTerm: loc.originalSearchTerm // 분류 시 원본 검색어 유지
            });
        });


        return res.json({
            success: true,
            query: query,
            results: processedResults, // 개선된 displayName이 적용된 결과
            // 분류된 결과도 함께 제공 (프론트엔드에서 활용 가능)
            categorizedResults: {
                adminDivisions: adminResults,
                relatedPlaces: relatedResults // 카카오 API 연동 시 채워질 부분
            },
            pagination: searchResult.pagination
        });

    } catch (error) {
        logger.error(`지역 검색 API 오류: ${error.message}`, error, requestInfo);
        // 샘플 데이터 대신 명확한 에러 메시지 반환
        if (error instanceof WeatherAPIError) {
            return res.status(error.statusCode).json({
                success: false,
                data: null, // 에러 시 데이터는 null
                error: error.message,
                code: error.code
            });
        }
        return res.status(500).json({
            success: false,
            data: null, // 에러 시 데이터는 null
            error: '지역 검색 중 알 수 없는 오류가 발생했습니다.',
            code: 'UNKNOWN_ERROR'
        });
    }
}

/**
 * 날씨 정보 요청 API 핸들러
 * 위경도 또는 지역명을 기반으로 날씨 정보를 조회합니다.
 * @param {Object} req - 요청 객체 (query: { lat: number, lon: number, region: string, detailed: boolean, minimal: boolean })
 * @param {Object} res - 응답 객체
 */
async function handleWeatherRequest(req, res) {
    metrics.apiCalls++; // API 호출 시 메트릭 증가
    const requestInfo = {
        url: req.url,
        query: req.query,
        headers: req.headers
    };

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
            // 위경도나 지역명 둘 중 하나도 없으면 기본 지역 사용
            regionName = WEATHER_CONFIG.DEFAULTS.REGION;
            const defaultLocationMatches = findAllMatches(regionName);
            const defaultLocation = defaultLocationMatches.length > 0 ? defaultLocationMatches[0] : null;

            // locationData가 로드되지 않았거나 기본 지역을 찾을 수 없는 경우
            if (!defaultLocation || Object.keys(locationData).length === 0 || !defaultLocation.lat || !defaultLocation.lon) {
                logger.warn('기본 지역 정보를 찾을 수 없거나 locationData가 로드되지 않아 날씨 정보를 제공할 수 없습니다.');
                return res.status(500).json({
                    success: false,
                    data: null, // 에러 시 데이터는 null
                    error: '기본 지역 정보를 로드할 수 없어 날씨 정보를 제공할 수 없습니다.',
                    code: 'LOCATION_DATA_UNAVAILABLE'
                });
            }
            latitude = defaultLocation.lat;
            longitude = defaultLocation.lon;
            logger.warn(`위경도/지역명 없음: 기본 지역(${regionName}) 사용`);
        }

        const weatherApiKey = process.env.WEATHER_API_KEY;

        // 지역별 요청 통계 증가 (유효한 지역명 또는 매칭된 지역명 사용)
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

        // API 키 확인 로직 (샘플 데이터 대신 에러 반환)
        if (!weatherApiKey || !validateEnvironment().isValid) { // 환경 변수 검증 결과도 확인
            const validationResult = validateEnvironment();
            const errorMessage = !weatherApiKey
                ? 'WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.'
                : `필수 환경 변수 누락: ${validationResult.missing.join(', ')}.`;

            logger.error(`${errorMessage} 날씨 정보를 제공할 수 없습니다.`, new Error(errorMessage), requestInfo);
            return res.status(500).json({
                success: false,
                data: null, // 에러 시 데이터는 null
                error: errorMessage,
                code: 'API_KEY_OR_ENV_MISSING'
            });
        }

        let coordinates;
        let locationInfo;
        let actualLocationFullName; // 실제 매칭된 지역의 전체 이름 저장

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
                displayName: location.displayName, // locationData에서 넘어온 displayName 사용
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
        const baseTime = calculateBaseTime(kst.getHours());
        let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');

        if (kst.getHours() < 2 && baseTime === '2300') {
            const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
            baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        }

        // 5. 캐시 키 충돌 가능성 (개선: 지역 fullName 포함)
        const cacheKey = `weather_${locationInfo.fullName}_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;
        const cachedData = weatherCache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000) {
            logger.info('✅ 캐시된 데이터 사용', { cacheKey });
            metrics.cacheHits++; // 캐시 히트 메트릭 증가

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
                    sensoryTemperature: day.sensoryTemperature // minimal에도 체감온도 포함
                }));
                delete responseData.weatherCodes;
            }

            return res.status(200).json(responseData);
        }
        metrics.cacheMisses++; // 캐시 미스 메트릭 증가

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

        const weatherData = processCompleteWeatherData(items, kst, actualLocationFullName); // fullName 전달

        logger.info('✅ 완전한 날씨 데이터 처리 완료', { days: weatherData.length });

        let responseData = {
            success: true,
            data: weatherData,
            locationInfo: locationInfo,
            apiInfo: {
                source: '기상청 단기예보 API',
                note: '기상청 단기예보 API 기준입니다. 실시간 관측값과 차이가 있을 수 있으며, ' +
                    '어제와의 비교 정보는 현재 API에서 제공하지 않습니다. (별도 데이터 저장/조회 필요)', // note 추가
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
                sensoryTemperature: day.sensoryTemperature // minimal에도 체감온도 포함
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

        // 에러 시 샘플 데이터 대신 명확한 에러 메시지 반환
        if (error instanceof WeatherAPIError) {
            return res.status(error.statusCode).json({
                success: false,
                data: null, // 에러 시 데이터는 null
                error: error.message,
                code: error.code
            });
        }

        return res.status(500).json({
            success: false,
            data: null, // 에러 시 데이터는 null
            error: '서버 내부 오류가 발생했습니다.',
            code: 'UNKNOWN_SERVER_ERROR'
        });
    }
}

/**
 * 필수 환경 변수가 설정되었는지 검증합니다.
 * @returns {{isValid: boolean, missing: string[]}} 검증 결과
 */
function validateEnvironment() {
    const required = ['WEATHER_API_KEY'];
    const missing = required.filter(key => !process.env[key]);

    // 개발 환경에서는 경고만, 프로덕션 환경에서는 오류 발생 (서버 시작 방지)
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
 * 요청 URL 경로에 따라 적절한 API 핸들러 함수로 라우팅합니다.
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
module.exports = async function handler(req, res) {
    // 서버 시작 시 한 번만 환경 변수 검증 및 사전 캐싱 실행
    // (서버리스 환경에서는 콜드 스타트 시 매번 실행될 수 있음)
    // locationData는 이제 CommonJS export로 직접 제공되므로,
    // locationModule.locationData가 아닌 전역 스코프의 locationData 변수를 직접 참조합니다.
    if (!global.weatherServiceInitialized) {
        validateEnvironment(); // 환경 변수 검증
        // locationData가 빈 객체({})이 아닌 경우에만 사전 캐싱을 시도합니다.
        if (Object.keys(locationData).length > 0 && process.env.WEATHER_API_KEY) {
            await preloadPopularLocations(); // 인기 지역 사전 캐싱
        } else {
            logger.warn('사전 캐싱 조건이 충족되지 않아 건너뜜니다 (locationData 없음 또는 API 키 없음).');
        }
        global.weatherServiceInitialized = true; // 플래그 설정
    }

    // 보안 헤더 추가
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // HTTPS 강제, 개발 환경 주의

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

    // Rate Limiting 적용 (클라이언트 IP 추출)
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
        // 프로덕션 환경에서만 실제 Rate Limit 적용
        if (process.env.NODE_ENV === 'production' && clientIp) {
            checkRateLimit(clientIp, 100, 60 * 1000); // 1분당 100회 요청 제한
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
        throw error; // 다른 예상치 못한 오류는 다시 throw
    }

    const pathname = getPathname(req);

    if (pathname === '/api/health') {
        logger.info('헬스체크 요청 수신');
        return res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0-complete',
            cacheSize: weatherCache.size,
            metrics: { // 모니터링 강화: 메트릭 정보 포함
                apiCalls: metrics.apiCalls,
                apiErrors: metrics.apiErrors,
                cacheHits: metrics.cacheHits,
                cacheMisses: metrics.cacheMisses,
                rateLimited: metrics.rateLimited,
                avgResponseTimeMs: metrics.avgResponseTime.toFixed(2),
                regionalRequests: metrics.regionalRequests, // 지역별 요청 통계
                errorTypes: metrics.errorTypes, // 에러 타입별 분류
                // responseTimeHistogram: metrics.responseTimeHistogram // 응답 시간 히스토그램 (활성화 시)
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

    if (pathname === '/api/search-locations') {
        return handleLocationSearch(req, res);
    }

    return handleWeatherRequest(req, res);
};
