/**
 * @file weather.js
 * @description 기상청 날씨 API 연동 및 지역 검색을 위한 서버리스 함수.
 * Vercel 환경에 최적화되어 있으며, 캐싱, 에러 처리, 로깅, 성능 모니터링,
 * Rate Limiting, 데이터 검증 기능을 포함합니다.
 * locationData.js 파일을 로드하여 지역 정보를 활용합니다.
 */

const axios = require('axios');
// locationData 모듈 임포트
// locationDataModule은 전역 스코프에 설정되므로 별도 선언은 필요 없지만,
// 명시적 로딩을 위해 try-catch 블록 내에서 require를 사용합니다.

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
    const loaded = require('./제주도.txt'); // Changed to 제주도.txt based on file list
    if (loaded && typeof loaded === 'object') {
        // require 성공 시, locationModule의 속성을 로드된 모듈의 속성으로 덮어씁니다.
        // 이렇게 하면 기본값으로 초기화된 후 실제 데이터가 병합됩니다.
        Object.assign(locationModule, loaded);
    } else {
        // 모듈이 유효한 객체를 내보내지 않은 경우 (null, undefined, 비객체 등)
        throw new Error('locationData.js가 유효한 객체를 내보보내지 않았습니다.');
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
    const dayAfterTomorrow = new Date(kst.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');


    // 모든 기상 데이터 분류
    items.forEach(item => {
        const date = item.fcstDate;
        const time = item.fcstTime;
        const category = item.category;
        const value = item.fcstValue;

        if (!forecasts[date]) {
            forecasts[date] = {
                times: {},
                // dailyData는 이제 hourlyData에서 집계되므로 비워둡니다.
            };
        }

        if (!forecasts[date].times[time]) {
            forecasts[date].times[time] = {};
        }

        forecasts[date].times[time][category] = value;
    });

    // 각 날짜별 최저/최고 기온 및 최대 강수확률 계산
    const dailyStats = {};
    const targetDates = [today, tomorrow, dayAfterTomorrow];
    targetDates.forEach(date => {
        let minTemp = Infinity;
        let maxTemp = -Infinity;
        let maxPop = 0;
        const times = forecasts[date] ? forecasts[date].times : {};

        // 해당 날짜의 모든 시간별 데이터를 순회하며 통계 업데이트
        for (const time in times) {
            const hourData = times[time];
            if (hourData.TMP) {
                const temp = parseFloat(hourData.TMP);
                if (!isNaN(temp)) {
                    minTemp = Math.min(minTemp, temp);
                    maxTemp = Math.max(maxTemp, temp);
                }
            }
            if (hourData.POP) {
                const pop = parseInt(hourData.POP);
                if (!isNaN(pop)) {
                    maxPop = Math.max(maxPop, pop);
                }
            }
        }
        dailyStats[date] = {
            temperatureMin: minTemp === Infinity ? null : minTemp,
            temperatureMax: maxTemp === -Infinity ? null : maxTemp,
            precipitationProbabilityMax: maxPop
        };
    });


    // 3일간 완전한 날씨 데이터 생성
    const result = [];
    targetDates.forEach((date, index) => {
        if (forecasts[date]) {
            // 미리 계산된 일별 통계 값을 extractCompleteWeatherData로 전달
            const daySpecificStats = dailyStats[date];
            const dayData = extractCompleteWeatherData(
                forecasts[date],
                date,
                kst,
                locationFullName,
                daySpecificStats.temperatureMin,
                daySpecificStats.temperatureMax,
                daySpecificStats.precipitationProbabilityMax
            );
            dayData.dayLabel = index === 0 ? '오늘' : index === 1 ? '내일' : '모레';
            dayData.dayIndex = index;
            result.push(dayData);
        } else {
            // API에 해당 날짜 데이터가 없는 경우 (예: 모레 데이터가 없는 경우)
            logger.warn(`API에서 날짜 ${date} 에 대한 데이터가 부족합니다. 해당 날짜는 결과에서 제외됩니다.`);
        }
    });

    return result;
}

/**
 * 단일 날짜에 대한 상세 날씨 정보를 추출하고 가공합니다.
 * @param {Object} dayForecasts - 해당 날짜의 모든 시간별 예보 데이터
 * @param {string} date - 해당 날짜 (YYYYMMDD)
 * @param {Date} kst - 한국 표준시 Date 객체 (현재 시각 기준)
 * @param {string} locationFullName - 지역 전체 이름
 * @param {number|null} dailyMinTemp - 해당 날짜의 계산된 최저 기온
 * @param {number|null} dailyMaxTemp - 해당 날짜의 계산된 최고 기온
 * @param {number} dailyMaxPop - 해당 날짜의 계산된 최대 강수확률
 * @returns {DailyWeatherData} 가공된 일별 날씨 데이터 객체
 */
function extractCompleteWeatherData(dayForecasts, date, kst, locationFullName, dailyMinTemp, dailyMaxTemp, dailyMaxPop) {
    const hourlyData = [];
    let representativeTime = null;
    let minTimeDiff = Infinity; // to find the closest future time

    // 현재 시간 (예: 21시)
    const currentHour = kst.getHours();
    const currentMinute = kst.getMinutes();
    const currentTimeAsInt = currentHour * 100 + currentMinute; // For easier comparison (e.g., 2100)


    // 시간별 데이터를 시간 순서로 정렬하여 처리
    const sortedTimes = Object.keys(dayForecasts.times).sort();

    // 해당 날짜가 '오늘'인지 확인
    const isToday = (date === kst.toISOString().slice(0, 10).replace(/-/g, ''));

    // 모든 시간별 예보 항목을 순회하며 가공 및 대표 시간 선정
    for (const time of sortedTimes) {
        const hourData = dayForecasts.times[time];

        // 필요한 데이터가 없는 경우를 대비하여 기본값 설정
        const temp = parseFloat(hourData.TMP || '0');
        const pty = hourData.PTY || '0';
        const initialSkyCode = hourData.SKY ? parseInt(hourData.SKY) : 1; // 기본값 '맑음'
        const pop = parseInt(hourData.POP || '0');
        const reh = parseFloat(hourData.REH || '0');
        const wsd = parseFloat(hourData.WSD || '0');
        const vec = parseFloat(hourData.VEC || '0');

        // =================================================================
        // SKY (하늘 상태) 결정 로직 강화
        // PTY (강수 형태)가 '없음' (0) 일 때만 POP (강수확률)에 따라 SKY를 조정합니다.
        // 기상청 웹사이트가 강수확률이 높더라도 '맑음'이나 '구름조금'을 표시하는 경향 반영.
        let adjustedSkyCode = initialSkyCode;

        if (pty === '0') { // PTY가 '없음'일 경우에만 SKY 코드 조정 로직 적용
            if (initialSkyCode === 1) { // 원래 '맑음' (1) 이었던 경우
                if (pop >= 70) {
                    adjustedSkyCode = 3; // POP이 70% 이상이면 '구름많음' (3)으로
                } else if (pop >= 30) {
                    adjustedSkyCode = 2; // POP이 30% 이상 70% 미만이면 '구름조금' (2)으로
                }
                // 그 외에는 '맑음' (1) 유지
            } else if (initialSkyCode === 2) { // 원래 '구름조금' (2) 이었던 경우
                if (pop >= 60) {
                    adjustedSkyCode = 3; // POP이 60% 이상이면 '구름많음' (3)으로
                }
                // 그 외에는 '구름조금' (2) 유지
            }
            // initialSkyCode가 이미 3 (구름많음) 또는 4 (흐림) 이상인 경우는 그대로 유지합니다.
            // 이는 이미 구름이 많거나 흐린 상태가 강수확률을 포함하여 표현되었다고 보기 때문입니다.
        }
        // PTY가 '0'이 아닐 경우 (비, 눈 등 실제 강수가 있는 경우), SKY는 PTY와 관련된 원래의 값 (예: 흐리고 비)을 유지해야 합니다.
        // 이 경우 PTY가 SKY보다 우선하는 정보이므로 SKY를 강수확률로 인해 임의로 낮추지 않습니다.
        // =================================================================

        const hourlyItem = {
            time: time,
            timeFormatted: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
            temperature: temp,
            sensoryTemperature: calculateSensoryTemperature(temp, reh, wsd),
            sky: WEATHER_CODES.SKY[String(adjustedSkyCode)] || '알 수 없음',
            skyCode: String(adjustedSkyCode),
            precipitation: WEATHER_CODES.PTY[pty] || '알 수 없음',
            precipitationCode: pty,
            precipitationProbability: pop,
            humidity: reh,
            windSpeed: wsd.toFixed(1),
            windSpeedRange: getWindSpeedRange(wsd),
            windDirection: getWindDirection(vec),
            windDirectionDegree: vec
        };
        hourlyData.push(hourlyItem);

        // 대표 시간 선정 로직:
        // 1. '오늘'인 경우: 현재 시간과 가장 가까운 미래 예보 시간을 대표 시간으로 선정.
        // 2. '내일'/'모레'인 경우: 해당 날짜의 첫 번째 예보 시간을 대표 시간으로 선정.
        const forecastTimeAsInt = parseInt(time); // HHMM 형태의 시간을 정수로 변환

        if (isToday) {
            // 현재 시간보다 같거나 미래인 예보 시간 중에서 가장 가까운 시간 찾기
            if (forecastTimeAsInt >= currentTimeAsInt) {
                const currentDiff = Math.abs(forecastTimeAsInt - currentTimeAsInt);
                if (currentDiff < minTimeDiff) {
                    minTimeDiff = currentDiff;
                    representativeTime = time;
                }
            }
        } else {
            // 내일/모레인 경우, 첫 번째 시간 데이터를 대표 시간으로 설정하고 반복 중단
            if (!representativeTime) { // Ensure it's set only once to the first available time
                representativeTime = time;
                // No need to break, continue processing all hourly data for `hourlyData` array
            }
        }
    }

    // '오늘' 데이터인데 미래 예보가 없는 경우 (예: 자정 직전 조회 시 당일 남은 예보 없음)
    // 또는 '내일'/'모레'인데 데이터 자체가 없는 경우 (processCompleteWeatherData에서 필터링되나 안전 장치)
    if (!representativeTime && sortedTimes.length > 0) {
        // 모든 예보가 과거인 경우, 가장 최근 예보를 대표 시간으로 사용
        representativeTime = sortedTimes[sortedTimes.length - 1];
    } else if (!representativeTime) {
        // 해당 날짜에 대한 시간별 데이터가 전혀 없는 경우
        representativeTime = '0000'; // 기본값 (실제 사용될 일은 거의 없어야 함)
        logger.warn(`날짜 ${date} 에 대한 시간별 예보 데이터가 없어 대표 시간을 '0000'으로 설정합니다.`);
    }

    const representativeForecast = dayForecasts.times[representativeTime] || {};

    // 대표 시간의 하늘 상태도 조정된 SKY 코드를 사용
    let finalRepresentativeSkyCode = representativeForecast.SKY ? parseInt(representativeForecast.SKY) : 1;
    const representativePty = representativeForecast.PTY || '0';
    const representativePop = parseInt(representativeForecast.POP || '0');

    if (representativePty === '0') {
        if (finalRepresentativeSkyCode === 1) {
            if (representativePop >= 70) finalRepresentativeSkyCode = 3;
            else if (representativePop >= 30) finalRepresentativeSkyCode = 2;
        } else if (finalRepresentativeSkyCode === 2) {
            if (representativePop >= 60) finalRepresentativeSkyCode = 3;
        }
    }


    // 최종 반환 객체 구성
    const temperature = parseFloat(representativeForecast.TMP || '0');
    const pty = representativeForecast.PTY || '0';
    const sky = String(finalRepresentativeSkyCode); // 조정된 대표 하늘 상태 코드 사용
    const pop = parseInt(representativeForecast.POP || '0');
    const reh = parseFloat(representativeForecast.REH || '0');
    const wsd = parseFloat(representativeForecast.WSD || '0');
    const vec = parseFloat(representativeForecast.VEC || '0');
    const wav = parseFloat(representativeForecast.WAV || '0');

    // Generate weather status and advice
    const weatherStatus = generateWeatherStatus(sky, pty, pop);
    const weatherAdvice = generateWeatherAdvice(temperature, pty, reh, wsd, locationFullName);

    return {
        date: date,
        dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        representativeTime: representativeTime,
        temperature: temperature,
        temperatureMin: dailyMinTemp, // 미리 계산된 일별 최저 기온 사용
        temperatureMax: dailyMaxTemp, // 미리 계산된 일별 최고 기온 사용
        temperatureUnit: '°C',
        temperatureDescription: getTemperatureDescription(temperature),
        sensoryTemperature: calculateSensoryTemperature(temperature, reh, wsd),
        sensoryTemperatureDescription: getSensoryTemperatureDescription(calculateSensoryTemperature(temperature, reh, wsd)),
        temperatureCompareYesterday: null, // 미구현 (API에서 직접 제공하지 않음)
        sky: WEATHER_CODES.SKY[sky] || '알 수 없음',
        skyCode: sky,
        skyDescription: WEATHER_CODES.SKY[sky] || '알 수 없음',
        precipitation: WEATHER_CODES.PTY[pty] || '알 수 없음',
        precipitationCode: pty,
        precipitationDescription: WEATHER_CODES.PTY[pty] || '알 수 없음',
        precipitationProbability: pop,
        precipitationProbabilityMax: dailyMaxPop, // 미리 계산된 일별 최대 강수확률 사용
        precipitationProbabilityDescription: WEATHER_CODES.POP[String(pop)] || '정보 없음',
        precipitationAmount: WEATHER_CODES.PCP[representativeForecast.PCP] || '0mm',
        precipitationAmountDescription: WEATHER_CODES.PCP[representativeForecast.PCP] || '0mm',
        snowAmount: WEATHER_CODES.SNO[representativeForecast.SNO] || '0cm',
        snowAmountDescription: WEATHER_CODES.SNO[representativeForecast.SNO] || '0cm',
        humidity: reh,
        humidityUnit: '%',
        humidityDescription: getHumidityDescription(reh),
        windSpeed: wsd.toFixed(1),
        windSpeedUnit: 'm/s',
        windSpeedDescription: getWindSpeedDescription(wsd),
        windSpeedRange: getWindSpeedRange(wsd),
        windDirection: getWindDirection(vec),
        windDirectionDegree: vec,
        windDirectionDescription: `${getWindDirection(vec)} (${vec}도)`,
        waveHeight: WEATHER_CODES.WAV[String(wav)] ? wav.toFixed(1) : null,
        waveHeightDescription: WEATHER_CODES.WAV[String(wav)] || '정보 없음',
        uvIndex: null, // 미구현
        visibility: null, // 미구현
        weatherStatus: weatherStatus,
        weatherAdvice: weatherAdvice,
        hourlyData: hourlyData // 시간별 데이터 배열
    };
}


/**
 * 기온에 따른 설명을 반환합니다.
 * @param {number} temp - 기온
 * @returns {string} 기온 설명
 */
function getTemperatureDescription(temp) {
    if (temp >= 33) return '매우 더움 (폭염)';
    if (temp >= 28) return '더움 (불쾌지수 높음)';
    if (temp >= 24) return '적당 (쾌적함)';
    if (temp >= 20) return '약간 쌀쌀 (활동하기 좋음)';
    if (temp >= 10) return '쌀쌀 (겉옷 필요)';
    if (temp >= 0) return '추움 (따뜻한 옷차림)';
    return '매우 추움 (동상 주의)';
}

/**
 * 체감 온도에 따른 설명을 반환합니다.
 * @param {number} temp - 체감 온도
 * @returns {string} 체감 온도 설명
 */
function getSensoryTemperatureDescription(sensoryTemp) {
    if (sensoryTemp >= 33) return '매우 더움 (폭염)';
    if (sensoryTemp >= 28) return '더움 (불쾌지수 높음)';
    if (sensoryTemp >= 24) return '적당 (쾌적함)';
    if (sensoryTemp >= 20) return '약간 쌀쌀 (활동하기 좋음)';
    if (sensoryTemp >= 10) return '쌀쌀 (겉옷 필요)';
    if (sensoryTemp >= 0) return '추움 (따뜻한 옷차림)';
    return '매우 추움 (동상 주의)';
}

/**
 * 습도에 따른 설명을 반환합니다.
 * @param {number} humidity - 습도
 * @returns {string} 습도 설명
 */
function getHumidityDescription(humidity) {
    if (humidity >= 90) return '매우 습함';
    if (humidity >= 70) return '습함';
    if (humidity >= 50) return '적당';
    if (humidity >= 30) return '약간 건조';
    return '매우 건조';
}

/**
 * 풍속에 따른 설명을 반환합니다.
 * @param {number} windSpeed - 풍속 (m/s)
 * @returns {string} 풍속 설명
 */
function getWindSpeedDescription(windSpeed) {
    if (windSpeed >= 14) return '매우 강함 (태풍급, 위험)';
    if (windSpeed >= 9) return '강함 (시설물 피해 주의)';
    if (windSpeed >= 4) return '약간 강함 (바람 강하게 붊)';
    if (windSpeed >= 1) return '1-2m/s (실바람) (변동 가능)';
    return '0-1m/s (고요함)';
}

/**
 * 풍속에 따른 범위 설명을 반환합니다.
 * 기상청의 풍속 단계를 따름 (예: 1~3m/s, 4~8m/s 등)
 * @param {number} wsd - 풍속 (m/s)
 * @returns {string} 풍속 범위 설명
 */
function getWindSpeedRange(wsd) {
    if (wsd < 0.5) return '0.0~0.4m/s (정온)';
    if (wsd < 1.6) return '0.5~1.5m/s (실바람)';
    if (wsd < 3.4) return '1.6~3.3m/s (남실바람)';
    if (wsd < 5.5) return '3.4~5.4m/s (산들바람)';
    if (wsd < 8.0) return '5.5~7.9m/s (건들바람)';
    if (wsd < 10.8) return '8.0~10.7m/s (흔들바람)';
    if (wsd < 13.9) return '10.8~13.8m/s (된바람)';
    if (wsd < 17.2) return '13.9~17.1m/s (센바람)';
    if (wsd < 20.8) return '17.2~20.7m/s (큰바람)';
    if (wsd < 24.5) return '20.8~24.4m/s (강풍)';
    if (wsd < 28.5) return '24.5~28.4m/s (왕바람)';
    if (wsd < 32.7) return '28.5~32.6m/s (싹쓸바람)';
    return '32.7m/s 이상 (미친바람)';
}

/**
 * 풍향 각도를 16방위로 변환합니다.
 * @param {number} vec - 풍향 각도 (0 ~ 360)
 * @returns {string} 16방위 풍향
 */
function getWindDirection(vec) {
    const directions = ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
        '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'];
    const index = Math.floor((vec + 11.25) / 22.5);
    return directions[index % 16];
}

/**
 * 체감 온도를 계산합니다.
 * @param {number} temp - 기온 (°C)
 * @param {number} humidity - 습도 (%)
 * @param {number} windSpeed - 풍속 (m/s)
 * @returns {string} 체감 온도 (소수점 첫째 자리)
 */
function calculateSensoryTemperature(temp, humidity, windSpeed) {
    // 기본 체감 온도 계산식 (ASHRAE 기준)
    // T_sensory = 1.07 * T + 0.2 * e - 0.65 * v + 4.6
    // 여기서 e는 수증기압 (hPa), v는 풍속 (m/s)

    // 수증기압 e 계산: 6.112 * exp(17.67 * T / (T + 243.5)) * RH / 100
    const e = 6.112 * Math.exp((17.67 * temp) / (temp + 243.5)) * (humidity / 100);

    let sensoryTemp = 1.07 * temp + 0.2 * e - 0.65 * windSpeed + 4.6;

    // 극단적인 값 방지 및 유효 범위 설정
    if (sensoryTemp < -50) sensoryTemp = -50;
    if (sensoryTemp > 50) sensoryTemp = 50;

    return sensoryTemp.toFixed(1);
}

/**
 * 종합 날씨 상태를 요약하여 반환합니다.
 * @param {string} skyCode - 하늘 상태 코드
 * @param {string} ptyCode - 강수 형태 코드
 * @param {number} pop - 강수확률
 * @returns {string} 종합 날씨 상태 요약
 */
function generateWeatherStatus(skyCode, ptyCode, pop) {
    let status = WEATHER_CODES.SKY[skyCode] || '알 수 없음';
    const precipitation = WEATHER_CODES.PTY[ptyCode] || '없음';

    if (precipitation !== '없음') {
        // 실제 강수가 있는 경우
        status = `${status} (${precipitation} 예상)`;
    } else if (pop > 0) {
        // 강수확률이 있지만 PTY가 없는 경우 (예: 이슬비, 눈날림, 빗방울 등 또는 그냥 가능성)
        if (pop >= 60) {
            status = `${status} (강수 가능성 높음)`;
        } else if (pop >= 30) {
            status = `${status} (강수 가능성 있음)`;
        } else {
            status = `${status} (강수 가능성 낮음)`;
        }
    }
    return status;
}

/**
 * 날씨 정보에 기반한 맞춤형 조언을 생성합니다.
 * @param {number} temp - 기온
 * @param {string} ptyCode - 강수 형태 코드
 * @param {number} humidity - 습도
 * @param {number} windSpeed - 풍속
 * @param {string} locationFullName - 지역 전체 이름
 * @returns {string} 날씨 조언
 */
function generateWeatherAdvice(temp, ptyCode, humidity, windSpeed, locationFullName) {
    const advice = [];
    const isJeju = locationFullName.includes('제주');

    // 하늘 상태 및 강수 조언
    const pty = WEATHER_CODES.PTY[ptyCode];
    if (pty === '비' || pty === '소나기' || pty === '비/눈' || pty === '빗방울' || pty === '이슬비' || pty === '폭우') {
        advice.push('☔ 우산 또는 우비 휴대 필수');
    } else if (pty === '눈' || pty === '눈날림' || pty === '진눈깨비' || pty === '폭설') {
        advice.push('🌨️ 눈길 미끄럼 주의, 따뜻한 옷차림');
    } else if (pty === '없음') {
        // PTY는 없지만 강수확률이 30% 이상인 경우 (예: 구름 많고 흐린데 강수 확률이 있는 경우)
        // 이 부분은 skyCode와 pop의 조합을 더 고려하여 호출부에서 최종 SKY 상태가 정해진 후에 적용하는 것이 좋습니다.
        // 현재는 대표시간의 PTY로만 판단합니다.
    }

    // 기온 조언
    if (temp >= 33) {
        advice.push('🥵 폭염주의, 야외 활동 자제 및 수분 섭취');
    } else if (temp >= 28) {
        advice.push('☀️ 더운 날씨, 시원한 옷차림 권장');
    } else if (temp <= 5) {
        advice.push('🥶 추운 날씨, 따뜻하게 입으세요');
    } else if (temp <= 10) {
        advice.push('🧣 쌀쌀하니 겉옷 챙기세요');
    }

    // 습도 조언
    if (humidity >= 85) {
        advice.push('💦 매우 습한 날씨, 불쾌지수 높음');
    } else if (humidity <= 30) {
        advice.push('🌬️ 건조한 날씨, 보습에 신경 쓰세요');
    }

    // 바람 조언 (제주 특화)
    if (windSpeed >= 8) {
        advice.push('💨 바람 매우 강함, 시설물 관리 및 안전 유의');
    } else if (windSpeed >= 4 && isJeju) {
        advice.push('🌬️ 제주는 바람이 수시로 변하니 유의하세요');
    }

    // 기본 조언 추가
    if (advice.length === 0) {
        advice.push('쾌적한 날씨, 즐거운 하루 되세요!');
    }

    return advice.join(' | ');
}


// 기상청 API 호출 함수 (재시도 로직 추가)
async function fetchWeatherFromAPI(params, retries = 0) {
    const endPerformanceMeasurement = performanceLogger.startTimer('API 호출');
    metrics.apiCalls++; // API 호출 메트릭 증가
    try {
        const response = await axios.get(WEATHER_CONFIG.API.BASE_URL, {
            params: {
                ...params,
                serviceKey: process.env.WEATHER_API_KEY,
                dataType: 'JSON'
            },
            timeout: WEATHER_CONFIG.API.TIMEOUT // 타임아웃 적용
        });

        if (response.data && response.data.response && response.data.response.header) {
            const header = response.data.response.header;
            if (header.resultCode === '00') {
                endPerformanceMeasurement();
                return response.data.response.body.items.item;
            } else {
                const errorMessage = ERROR_MESSAGES[header.resultCode] || '알 수 없는 API 에러';
                logger.error(`기상청 API 응답 오류: ${errorMessage} (${header.resultCode})`,
                    new Error(errorMessage),
                    { params, responseHeader: header }
                );
                throw new WeatherAPIError(errorMessage, header.resultCode, 500);
            }
        } else {
            logger.error('기상청 API 응답 형식이 올바르지 않습니다.',
                new Error('Invalid API response structure'),
                { responseData: response.data }
            );
            throw new WeatherAPIError('기상청 API 응답 형식이 올바르지 않습니다.', 'INVALID_RESPONSE_STRUCTURE', 500);
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // 재시도 로직
            if (retries < WEATHER_CONFIG.API.MAX_RETRIES && (error.code === 'ECONNABORTED' || !error.response || error.response.status >= 500)) {
                logger.warn(`API 호출 재시도 (${retries + 1}/${WEATHER_CONFIG.API.MAX_RETRIES}):`, { error: error.message });
                // 지수 백오프: 200ms, 400ms, 800ms ...
                await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retries)));
                return fetchWeatherFromAPI(params, retries + 1);
            }
        }
        logger.error('API 호출 중 최종 오류 발생', error, { params, retries });
        throw error; // 최종적으로 에러 던지기
    }
}

// =====================================================================
// 5. 유효성 검증 (validateQueryParams 함수는 이제 사용되지 않으므로 제거)
// 6. 데이터 검증 (validateWeatherData 함수는 이제 processCompleteWeatherData 내에서 처리)
// =====================================================================

/**
 * 날짜와 시간을 기상청 API baseDate, baseTime 형식으로 변환 (가장 가까운 발표 시간 기준)
 * 기상청 단기예보는 매 3시간마다 발표 (02, 05, 08, 11, 14, 17, 20, 23시) + 10분 후 서비스 시작
 * @param {Date} kst - 한국 표준시 Date 객체
 * @returns {{baseDate: string, baseTime: string}}
 */
function getBaseDateTime(kst) {
    let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');
    let baseTime = '';

    const hour = kst.getHours();
    const minute = kst.getMinutes();

    // 기상청 API는 정시 발표 후 10분 뒤부터 데이터 제공
    // 0210, 0510, 0810, 1110, 1410, 1710, 2010, 2310
    const times = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];

    // 현재 시간(kst)에 가장 가까운 이전 발표 시간 찾기
    let foundBaseTime = null;
    for (let i = times.length - 1; i >= 0; i--) {
        const timeHour = parseInt(times[i].slice(0, 2));
        const timeMinute = parseInt(times[i].slice(2, 4));

        if (hour > timeHour || (hour === timeHour && minute >= 10)) {
            foundBaseTime = times[i];
            break;
        }
    }

    // 만약 현재 시각이 02시 10분 이전이라면, 전날 23시 발표 데이터를 사용
    if (!foundBaseTime) {
        const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
        baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        baseTime = '2300';
    } else {
        baseTime = foundBaseTime;
    }

    logger.info(`기준 시간 계산: ${baseDate}, ${baseTime}`);
    return { baseDate, baseTime };
}


// 샘플 데이터 생성 함수 (API 호출 실패 시 사용)
function generateCompleteSampleData(regionName = '제주특별자치도', errorMessage = 'API 호출 실패 또는 데이터 없음') {
    const now = new Date();
    // KST 시간대를 정확히 반영
    const kstOffset = now.getTimezoneOffset() * 60000; // Offset in milliseconds
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000) + kstOffset); // Add 9 hours for KST and adjust for local offset

    const todayDate = kstTime.toISOString().slice(0, 10).replace(/-/g, '');
    const tomorrowDate = new Date(kstTime.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

    const currentHour = kstTime.getHours();
    const currentMinute = kstTime.getMinutes();
    const representativeTime = `${String(currentHour).padStart(2, '0')}00`; // 현재 시각 기준 (예: 2100)

    // 샘플 데이터의 유효성을 높이기 위해 실제 API 응답 구조를 최대한 모방
    return [
        {
            date: todayDate,
            dateFormatted: `${todayDate.slice(0, 4)}-${todayDate.slice(4, 6)}-${todayDate.slice(6, 8)}`,
            representativeTime: representativeTime,
            temperature: 23,
            temperatureMin: 20,
            temperatureMax: 27,
            temperatureUnit: '°C',
            temperatureDescription: '적당 (쾌적함)',
            sensoryTemperature: '24.2',
            sensoryTemperatureDescription: '적당 (쾌적함)',
            temperatureCompareYesterday: null,
            sky: '구름많음',
            skyCode: '3',
            skyDescription: '구름많음',
            precipitation: '없음',
            precipitationCode: '0',
            precipitationDescription: '없음',
            precipitationProbability: 20,
            precipitationProbabilityMax: 30,
            precipitationProbabilityDescription: '20% (낮음)',
            precipitationAmount: '0mm',
            precipitationAmountDescription: '0mm',
            snowAmount: '0cm',
            snowAmountDescription: '0cm',
            humidity: 90,
            humidityUnit: '%',
            humidityDescription: '매우 습함',
            windSpeed: '1.4',
            windSpeedUnit: 'm/s',
            windSpeedDescription: '1-2m/s (실바람) (변동 가능)',
            windSpeedRange: '0.4~3.4m/s',
            windDirection: '서',
            windDirectionDegree: 274,
            windDirectionDescription: '서 (274도)',
            waveHeight: '0.5',
            waveHeightDescription: '0.5m 미만 (낮음)',
            uvIndex: null,
            visibility: null,
            weatherStatus: '구름많음 (강수 가능성 있음)',
            weatherAdvice: `☁️ 구름 많음, 우산 휴대 권장 | 💦 습한 날씨, 불쾌지수 높음 | 🌪️ ${regionName.includes('제주') ? '제주는 바람이 수시로 변하니 유의하세요' : '바람이 적당합니다'}`,
            hourlyData: [
                { time: "2100", timeFormatted: "21:00", temperature: 23, sensoryTemperature: "24.2", sky: "구름많음", precipitation: "없음", precipitationProbability: 20, humidity: 90, windSpeed: "1.3", windSpeedRange: "0.3~3.3m/s" },
                { time: "2200", timeFormatted: "22:00", temperature: 23, sensoryTemperature: "24.2", sky: "구름많음", precipitation: "없음", precipitationProbability: 20, humidity: 90, windSpeed: "1.4", windSpeedRange: "0.4~3.4m/s" },
                { time: "2300", timeFormatted: "23:00", temperature: 23, sensoryTemperature: "24.1", sky: "흐림", precipitation: "없음", precipitationProbability: 30, humidity: 90, windSpeed: "1.6", windSpeedRange: "0.6~3.6m/s" }
            ],
            dayLabel: '오늘',
            dayIndex: 0
        },
        {
            date: tomorrowDate,
            dateFormatted: `${tomorrowDate.slice(0, 4)}-${tomorrowDate.slice(4, 6)}-${tomorrowDate.slice(6, 8)}`,
            representativeTime: '0000', // 내일의 첫 시간으로 설정
            temperature: 23,
            temperatureMin: 23,
            temperatureMax: 28, // 웹사이트와 유사하게 높게 설정
            temperatureUnit: '°C',
            temperatureDescription: '적당 (쾌적함)',
            sensoryTemperature: '24.0',
            sensoryTemperatureDescription: '적당 (쾌적함)',
            temperatureCompareYesterday: null,
            sky: '구름많음', // 웹사이트 경향 반영
            skyCode: '3',
            skyDescription: '구름많음',
            precipitation: '없음',
            precipitationCode: '0',
            precipitationDescription: '없음',
            precipitationProbability: 70, // 웹사이트 경향 반영 (높게)
            precipitationProbabilityMax: 80, // 웹사이트 경향 반영 (높게)
            precipitationProbabilityDescription: '70% (높음)',
            precipitationAmount: '0mm',
            precipitationAmountDescription: '0mm',
            snowAmount: '0cm',
            snowAmountDescription: '0cm',
            humidity: 85,
            humidityUnit: '%',
            humidityDescription: '매우 습함',
            windSpeed: '1.4',
            windSpeedUnit: 'm/s',
            windSpeedDescription: '1-2m/s (실바람) (변동 가능)',
            windSpeedRange: '0.4~3.4m/s',
            windDirection: '서남서',
            windDirectionDegree: 245,
            windDirectionDescription: '서남서 (245도)',
            waveHeight: '0.5',
            waveHeightDescription: '0.5m 미만 (낮음)',
            uvIndex: null,
            visibility: null,
            weatherStatus: '구름많음 (강수 가능성 높음)',
            weatherAdvice: `☁️ 구름 많음, 우산 휴대 권장 | 💦 습한 날씨, 불쾌지수 높음 | 🌪️ ${regionName.includes('제주') ? '제주는 바람이 수시로 변하니 유의하세요' : '바람이 적당합니다'}`,
            hourlyData: [
                { time: "0000", timeFormatted: "00:00", temperature: 23, sensoryTemperature: "24.0", sky: "구름많음", precipitation: "없음", precipitationProbability: 70, humidity: 85, windSpeed: "1.4", windSpeedRange: "0.4~3.4m/s" },
                { time: "0600", timeFormatted: "06:00", temperature: 24, sensoryTemperature: "25.1", sky: "구름많음", precipitation: "없음", precipitationProbability: 70, humidity: 90, windSpeed: "2.4", windSpeedRange: "1.4~4.4m/s" },
                { time: "1200", timeFormatted: "12:00", temperature: 27, sensoryTemperature: "28.5", sky: "구름많음", precipitation: "없음", precipitationProbability: 80, humidity: 80, windSpeed: "3.2", windSpeedRange: "2.2~5.2m/s" },
                { time: "1800", timeFormatted: "18:00", temperature: 26, sensoryTemperature: "27.3", sky: "맑음", precipitation: "없음", precipitationProbability: 10, humidity: 85, windSpeed: "2.1", windSpeedRange: "1.1~4.1m/s" }
            ],
            dayLabel: '내일',
            dayIndex: 1
        }
    ];
}


/**
 * HTTP 요청에서 클라이언트 IP 주소를 추출합니다.
 * Vercel 환경에서는 `x-forwarded-for` 헤더를 사용합니다.
 * @param {Object} req - HTTP 요청 객체
 * @returns {string} 클라이언트 IP 주소
 */
function getClientIp(req) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
        // x-forwarded-for 헤더는 콤마로 구분된 IP 주소 목록일 수 있으므로 첫 번째 IP를 사용
        return xForwardedFor.split(',')[0].trim();
    }
    // Fallback for non-Vercel environments or direct connections
    return req.connection?.remoteAddress || req.socket?.remoteAddress || 'UNKNOWN_IP';
}

/**
 * 요청 URL의 pathname을 추출합니다.
 * @param {Object} req - HTTP 요청 객체
 * @returns {string} URL pathname
 */
function getPathname(req) {
    // Vercel 환경에서 req.url은 전체 URL을 포함할 수 있으므로 URL 객체를 사용합니다.
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        return url.pathname;
    } catch (e) {
        logger.error('URL 파싱 오류', e, { url: req.url, host: req.headers.host });
        return req.url; // 파싱 실패 시 원본 URL 반환
    }
}


/**
 * 메인 서버리스 함수 핸들러
 * @param {Object} req - HTTP 요청 객체
 * @param {Object} res - HTTP 응답 객체
 */
module.exports = async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*'); // 모든 도메인 허용 (개발 및 테스트용)
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const clientIp = getClientIp(req);
    logger.info(`요청 수신: ${req.method} ${req.url} (IP: ${clientIp})`);

    try {
        checkRateLimit(clientIp); // Rate Limit 체크

        const pathname = getPathname(req);

        // 헬스 체크 엔드포인트
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

        // 지역 검색 엔드포인트
        if (pathname === '/api/search-locations') {
            return handleLocationSearch(req, res);
        }

        // 기본 날씨 정보 엔드포인트
        return handleWeatherForecast(req, res);

    } catch (error) {
        if (error instanceof WeatherAPIError) {
            // 커스텀 에러 처리
            res.status(error.statusCode).json({
                success: false,
                error: true,
                errorMessage: error.message,
                errorCode: error.code,
                data: generateCompleteSampleData(req.query.region || WEATHER_CONFIG.DEFAULTS.REGION, error.message) // 에러 시 샘플 데이터 반환
            });
        } else {
            // 예상치 못한 에러
            logger.error('예상치 못한 서버 에러', error, { requestUrl: req.url, clientIp: clientIp });
            res.status(500).json({
                success: false,
                error: true,
                errorMessage: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                errorCode: 'SERVER_ERROR',
                data: generateCompleteSampleData(req.query.region || WEATHER_CONFIG.DEFAULTS.REGION, '서버 오류') // 에러 시 샘플 데이터 반환
            });
        }
    }
};

/**
 * 날씨 예보를 처리하는 함수 (메인 로직)
 * @param {Object} req - HTTP 요청 객체
 * @param {Object} res - HTTP 응답 객체
 */
async function handleWeatherForecast(req, res) {
    const requestedRegion = req.query.region || WEATHER_CONFIG.DEFAULTS.REGION;
    const cacheKey = `weather-${requestedRegion}`;
    metrics.addRegionalRequest(requestedRegion); // 지역별 요청 메트릭 증가

    // 2. 캐싱 로직 적용
    if (weatherCache.has(cacheKey)) {
        const cachedData = weatherCache.get(cacheKey);
        const now = Date.now();
        if (now - cachedData.timestamp < WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000) {
            logger.info(`캐시 히트: ${requestedRegion}`);
            metrics.cacheHits++; // 캐시 히트 메트릭 증가
            return res.status(200).json(cachedData.data);
        } else {
            logger.info(`캐시 만료: ${requestedRegion}`);
            weatherCache.delete(cacheKey); // 만료된 캐시 제거
        }
    }
    metrics.cacheMisses++; // 캐시 미스 메트릭 증가

    try {
        const kst = new Date(); // 현재 KST 시간 (서버 시간 기준)

        // 기상청 API 기준 날짜 및 시간 계산
        const { baseDate, baseTime } = getBaseDateTime(kst);

        // =============================================================
        // 8. 지역 검색 및 좌표 변환 통합: locationData.js 활용
        let matchedLocation = null;
        let nx, ny, lat, lon;
        let locationSource = '기본값';
        let locationFullName = requestedRegion; // 기본은 요청된 지역명

        if (requestedRegion && locationData && typeof latLonToGrid === 'function' && typeof findAllMatches === 'function') {
            const searchResults = findAllMatches(requestedRegion); // locationData.js의 findAllMatches 사용
            if (searchResults && searchResults.length > 0) {
                matchedLocation = searchResults[0]; // 가장 우선순위 높은 결과 사용
                const gridCoords = latLonToGrid(matchedLocation.lat, matchedLocation.lon);
                nx = gridCoords.nx;
                ny = gridCoords.ny;
                lat = matchedLocation.lat;
                lon = matchedLocation.lon;
                locationSource = '지역명 검색';
                locationFullName = matchedLocation.fullName || matchedLocation.name; // fullName이 있다면 사용
                logger.info(`지역 일치: ${requestedRegion} -> ${locationFullName} (nx:${nx}, ny:${ny})`);
            } else {
                logger.warn(`일치하는 지역을 찾을 수 없음: ${requestedRegion}. 기본값 사용 (서울).`);
                // 기본값 서울 설정
                nx = 60;
                ny = 127;
                lat = 37.5665;
                lon = 126.9780;
                locationSource = '매칭 실패 (기본값 서울)';
                locationFullName = '서울특별시';
            }
        } else {
            logger.warn('locationData 모듈이 로드되지 않았거나 필수 함수가 없어 기본값(서울) 사용');
            nx = 60;
            ny = 127;
            lat = 37.5665;
            lon = 126.9780;
            locationSource = '모듈 로드 실패 (기본값 서울)';
            locationFullName = '서울특별시';
        }

        // =============================================================

        // 기상청 API 호출
        const apiParams = {
            numOfRows: 300, // 충분한 데이터 확보
            pageNo: 1,
            base_date: baseDate,
            base_time: baseTime,
            nx: nx,
            ny: ny
        };
        const items = await fetchWeatherFromAPI(apiParams);

        // 데이터 가공 및 클라이언트에 전송할 최종 데이터 생성
        const processedData = processCompleteWeatherData(items, kst, locationFullName);

        const responseData = {
            success: true,
            data: processedData,
            locationInfo: {
                requested: requestedRegion,
                matched: locationFullName,
                fullName: locationFullName,
                coordinates: { nx, ny },
                latLon: { lat, lon },
                source: locationSource
            },
            apiInfo: {
                source: '기상청 단기예보 API',
                note: '기상청 단기예보 API 기준입니다. 실시간 관측값과 차이가 있을 수 있으며, 어제와의 비교 정보는 현재 API에서 제공하지 않습니다. (별도 데이터 저장/조회 필요)',
                baseDate: baseDate,
                baseTime: baseTime,
                timestamp: new Date().toISOString(),
                apiKeyUsed: process.env.WEATHER_API_KEY ? 'WEATHER_API_KEY' : 'NOT_SET',
                totalCategories: items ? new Set(items.map(item => item.category)).size : 0,
                dataPoints: items ? items.length : 0,
                version: '2.0-complete'
            },
            weatherCodes: WEATHER_CODES
        };

        // 캐시 업데이트
        weatherCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        // 캐시 항목 수 제한
        if (weatherCache.size > WEATHER_CONFIG.CACHE.MAX_ENTRIES) {
            // 가장 오래된 항목 제거
            const firstKey = weatherCache.keys().next().value;
            weatherCache.delete(firstKey);
            logger.info('캐시 최대 항목 수 초과로 가장 오래된 항목 제거');
        }

        res.status(200).json(responseData);

    } catch (error) {
        // API 호출 실패 시 또는 데이터 가공 중 에러 발생 시
        logger.error('날씨 예보 처리 중 오류 발생', error, { region: requestedRegion });
        throw error; // 상위 try-catch로 에러 전달
    }
}

/**
 * 지역 검색 요청을 처리하는 함수
 * @param {Object} req - HTTP 요청 객체
 * @param {Object} res - HTTP 응답 객체
 */
async function handleLocationSearch(req, res) {
    const query = req.query.q;
    const page = parseInt(req.query.page || '1');
    const pageSize = parseInt(req.query.pageSize || WEATHER_CONFIG.DEFAULTS.PAGE_SIZE);

    if (!query || query.length < 2) {
        return res.status(400).json({
            success: false,
            error: true,
            errorMessage: '검색어는 최소 2글자 이상이어야 합니다.',
            errorCode: 'INVALID_QUERY'
        });
    }

    try {
        if (typeof searchLocations === 'function') {
            const searchResult = searchLocations(query, page, pageSize); // locationData.js의 searchLocations 사용
            if (searchResult && searchResult.results) {
                res.status(200).json({
                    success: true,
                    data: searchResult.results,
                    pagination: searchResult.pagination,
                    info: '지역 검색 결과',
                    source: 'locationData.js'
                });
            } else {
                // searchLocations 함수가 정의되어 있지만 결과가 유효하지 않은 경우
                logger.warn(`locationData.js의 searchLocations가 유효하지 않은 결과를 반환했습니다. 쿼리: ${query}`);
                res.status(500).json({
                    success: false,
                    error: true,
                    errorMessage: '지역 검색 서비스에 문제가 발생했습니다.',
                    errorCode: 'SEARCH_SERVICE_ERROR'
                });
            }
        } else {
            logger.error('locationData.js의 searchLocations 함수를 찾을 수 없습니다.');
            res.status(500).json({
                success: false,
                error: true,
                    errorMessage: '지역 검색 기능을 사용할 수 없습니다. 서버 설정을 확인해주세요.',
                    errorCode: 'SEARCH_FUNCTION_MISSING'
                });
        }
    } catch (error) {
        logger.error('지역 검색 중 오류 발생', error, { query });
        res.status(500).json({
            success: false,
            error: true,
            errorMessage: '지역 검색 중 예상치 못한 오류가 발생했습니다.',
            errorCode: 'UNEXPECTED_SEARCH_ERROR'
        });
    }
}

