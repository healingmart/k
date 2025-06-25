이 코드의 주요 문제점은 `logger`가 정의되기 전에 사용되고 있다는 것입니다. 수정된 전체 코드를 제공하겠습니다:

```javascript
const axios = require('axios');

// ===================================================================== 
// 로거를 가장 먼저 정의 (다른 모든 코드보다 앞에)
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
    }
};
// =====================================================================

// ===================================================================== 
// 1. locationData.js 의존성 처리 (안전한 import와 폴백 처리)
let locationModule = {}; // 기본값: 빈 객체

try {
    const loadedModule = require('./locationData.js');
    if (typeof loadedModule === 'object' && loadedModule !== null) {
        locationModule = loadedModule;
        logger.info('locationData.js 로드 성공');
    } else {
        throw new Error('locationData.js did not export a valid object');
    }
} catch (error) {
    logger.error('locationData.js를 로드하는 데 실패했습니다. 지역 검색 및 좌표 변환 기능이 제한됩니다.', error);
    
    // 폴백 구현
    locationModule.locationData = {};
    locationModule.searchLocations = (q, p, s) => ({ 
        results: [], 
        pagination: { currentPage: p, totalPages: 0, totalResults: 0 } 
    });
    locationModule.findMatchingLocation = (coords) => null;
    locationModule.findAllMatches = (q) => {
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
    };
    locationModule.latLonToGrid = (lat, lon) => {
        logger.warn('locationData.js가 없어 기본 격자 좌표(서울)를 반환합니다.');
        return { nx: 60, ny: 127 };
    };
}

const {
    locationData,
    searchLocations,
    findMatchingLocation,
    findAllMatches,
    latLonToGrid
} = locationModule;
// =====================================================================

// Vercel 서버리스용 캐시
let weatherCache = new Map();

// ===================================================================== 
// 설정 관리
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

// 완전한 기상청 날씨 코드 매핑
const WEATHER_CODES = {
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
// 에러 처리 강화: 커스텀 에러 클래스
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
// 모니터링 메트릭
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
// =====================================================================

// ===================================================================== 
// 성능 모니터링
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

// ===================================================================== 
// Rate Limiting 구현
const rateLimitMap = new Map();

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

// 날씨 데이터 처리 함수들
function processCompleteWeatherData(items, kst) {
    const forecasts = {};

    const today = kst.toISOString().slice(0, 10).replace(/-/g, '');
    const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const dayAfter = new Date(kst.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

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

        if (category === 'TMN' && value) {
            forecasts[date].dailyData.temperatureMin = parseFloat(value);
        }
        if (category === 'TMX' && value) {
            forecasts[date].dailyData.temperatureMax = parseFloat(value);
            if (forecasts[date].dailyData.temperatureMin === null) {
                forecasts[date].dailyData.temperatureMin = parseFloat(value) - 5;
            }
        }
        if (category === 'POP' && value) {
            const pop = parseFloat(value);
            if (pop > forecasts[date].dailyData.precipitationProbabilityMax) {
                forecasts[date].dailyData.precipitationProbabilityMax = pop;
            }
        }
    });

    const result = [];
    [today, tomorrow, dayAfter].forEach((date, index) => {
        if (forecasts[date]) {
            const dayData = extractCompleteWeatherData(forecasts[date], date);
            dayData.dayLabel = index === 0 ? '오늘' : index === 1 ? '내일' : '모레';
            dayData.dayIndex = index;
            validateWeatherData(dayData);
            result.push(dayData);
        }
    });

    return result;
}

function extractCompleteWeatherData(dayForecast, date) {
    const times = dayForecast.times;
    const dailyData = dayForecast.dailyData;

    const timeKeys = Object.keys(times).sort();
    let representativeTime = timeKeys.find(t => t === '1400') || 
                            timeKeys.find(t => t >= '1200' && t <= '1500') || 
                            timeKeys[Math.floor(timeKeys.length / 2)];

    if (!representativeTime && timeKeys.length > 0) {
        representativeTime = timeKeys[0];
    }

    const data = representativeTime ? times[representativeTime] : {};

    return {
        date: date,
        dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        representativeTime: representativeTime,

        temperature: data.TMP ? Math.round(parseFloat(data.TMP)) : null,
        temperatureMin: dailyData.temperatureMin ? Math.round(dailyData.temperatureMin) : null,
        temperatureMax: dailyData.temperatureMax ? Math.round(dailyData.temperatureMax) : null,
        temperatureUnit: '°C',
        temperatureDescription: getTemperatureDescription(data.TMP),

        sky: getSkyDescription(data.SKY),
        skyCode: data.SKY,
        skyDescription: WEATHER_CODES.SKY[data.SKY] || '정보없음',

        precipitation: getPrecipitationDescription(data.PTY),
        precipitationCode: data.PTY,
        precipitationDescription: WEATHER_CODES.PTY[data.PTY] || '없음',
        precipitationProbability: data.POP ? parseInt(data.POP) : 0,
        precipitationProbabilityMax: Math.round(dailyData.precipitationProbabilityMax),
        precipitationProbabilityDescription: WEATHER_CODES.POP[data.POP] || '0% (강수 없음)',
        precipitationAmount: processPrecipitationAmount(data.PCP),
        precipitationAmountDescription: WEATHER_CODES.PCP[data.PCP] || '0mm',

        snowAmount: processSnowAmount(data.SNO),
        snowAmountDescription: WEATHER_CODES.SNO[data.SNO] || '0cm',

        humidity: data.REH ? parseInt(data.REH) : null,
        humidityUnit: '%',
        humidityDescription: getHumidityDescription(data.REH),

        windSpeed: data.WSD ? parseFloat(data.WSD).toFixed(1) : null,
        windSpeedUnit: 'm/s',
        windSpeedDescription: getWindSpeedDescription(data.WSD),
        windDirection: getWindDirectionFromDegree(data.VEC),
        windDirectionDegree: data.VEC ? parseFloat(data.VEC) : null,
        windDirectionDescription: data.VEC ? `${getWindDirectionFromDegree(data.VEC)} (${data.VEC}도)` : '정보없음',

        waveHeight: data.WAV || null,
        waveHeightDescription: WEATHER_CODES.WAV[data.WAV] || '정보없음',

        uvIndex: data.UVI || null,
        visibility: data.VIS || null,

        weatherStatus: getOverallWeatherStatus(data),
        weatherAdvice: getWeatherAdvice(data),

        hourlyData: Object.keys(times).map(time => ({
            time: time,
            timeFormatted: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
            temperature: times[time].TMP ? Math.round(parseFloat(times[time].TMP)) : null,
            sky: WEATHER_CODES.SKY[times[time].SKY] || '정보없음',
            precipitation: WEATHER_CODES.PTY[times[time].PTY] || '없음',
            precipitationProbability: times[time].POP ? parseInt(times[time].POP) : 0,
            humidity: times[time].REH ? parseInt(times[time].REH) : null,
            windSpeed: times[time].WSD ? parseFloat(times[time].WSD).toFixed(1) : null
        })).sort((a, b) => a.time.localeCompare(b.time))
    };
}

// Helper functions
function getTemperatureDescription(temp) {
    if (!temp) return '정보없음';
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

function getSkyDescription(code) {
    return WEATHER_CODES.SKY[code] || '정보없음';
}

function getPrecipitationDescription(code) {
    return WEATHER_CODES.PTY[code] || '없음';
}

function processPrecipitationAmount(pcp) {
    if (!pcp || pcp === '강수없음' || pcp === '0') return '0mm';
    if (pcp === '1mm 미만') return '1mm 미만';
    if (pcp.includes('mm')) return pcp;
    return `${pcp}mm`;
}

function processSnowAmount(sno) {
    if (!sno || sno === '적설없음' || sno === '0') return '0cm';
    if (sno === '1cm 미만') return '1cm 미만';
    if (sno.includes('cm')) return sno;
    return `${sno}cm`;
}

function getHumidityDescription(humidity) {
    if (!humidity) return '정보없음';
    const h = parseInt(humidity);
    if (h <= 20) return '매우 건조';
    if (h <= 40) return '건조';
    if (h <= 60) return '보통';
    if (h <= 80) return '습함';
    return '매우 습함';
}

function getWindSpeedDescription(windSpeed) {
    if (!windSpeed) return '정보없음';
    const ws = parseFloat(windSpeed);
    if (ws < 1) return '0-1m/s (고요)';
    if (ws < 2) return '1-2m/s (실바람)';
    if (ws < 3) return '2-3m/s (남실바람)';
    if (ws < 4) return '3-4m/s (산들바람)';
    if (ws < 5) return '4-5m/s (건들바람)';
    if (ws < 7) return '5-7m/s (선선한바람)';
    if (ws < 9) return '7-9m/s (시원한바람)';
    if (ws < 11) return '9-11m/s (센바람)';
    if (ws < 14) return '11-14m/s (강한바람)';
    if (ws < 17) return '14-17m/s (매우강한바람)';
    if (ws < 21) return '17-21m/s (폭풍)';
    if (ws < 25) return '21-25m/s (강한폭풍)';
    return '25m/s 이상 (매우강한폭풍)';
}

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

function getWeatherAdvice(data) {
    const temp = data.TMP ? parseFloat(data.TMP) : null;
    const pty = data.PTY;
    const pop = data.POP ? parseInt(data.POP) : 0;
    const wsd = data.WSD ? parseFloat(data.WSD) : 0;

    const advice = [];

    if (temp !== null) {
        if (temp >= 35) advice.push('🌡️ 폭염 경보! 야외활동 자제하세요');
        else if (temp >= 33) advice.push('🌡️ 폭염 주의! 충분한 수분 섭취하세요');
        else if (temp >= 28) advice.push('☀️ 더운 날씨, 시원한 복장 추천');
        else if (temp <= -10) advice.push('🧊 한파 주의! 방한용품 필수');
        else if (temp <= 0) advice.push('❄️ 추운 날씨, 따뜻한 복장 필요');
        else if (temp <= 10) advice.push('🧥 쌀쌀한 날씨, 외투 준비하세요');
    }

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

    if (wsd >= 14) advice.push('💨 강풍 주의! 야외활동 조심하세요');
    else if (wsd >= 10) advice.push('🌬️ 바람이 강해요, 모자나 가벼운 물건 주의');

    return advice.length > 0 ? advice.join(' | ') : '쾌적한 날씨입니다';
}

function getPathname(req) {
    try {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        return url.pathname;
    } catch (error) {
        logger.warn('URL 파싱 중 오류 발생, Fallback 경로 사용:', { message: error.message });
        return req.url.split('?')[0];
    }
}

const calculateBaseTime = (hour) => {
    if (hour >= 23 || hour < 2) return '2300';
    if (hour < 5) return '0200';
    if (hour < 8) return '0500';
    if (hour < 11) return '0800';
    if (hour < 14) return '1100';
    if (hour < 17) return '1400';
    if (hour < 20) return '1700';
    return '2000';
};

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

function validateWeatherData(data) {
    const errors = [];

    if (data.temperature !== null && (data.temperature < -50 || data.temperature > 60)) {
        errors.push(`비정상적인 기온: ${data.temperature}°C`);
    }

    if (data.humidity !== null && (data.humidity < 0 || data.humidity > 100)) {
        errors.push(`비정상적인 습도: ${data.humidity}%`);
    }

    if (data.precipitationProbability !== null && (data.precipitationProbability < 0 || data.precipitationProbability > 100)) {
        errors.push(`비정상적인 강수확률: ${data.precipitationProbability}%`);
    }

    if (errors.length > 0) {
        logger.warn('날씨 데이터 검증 경고', { errors, data });
    }

    return errors.length === 0;
}

async function preloadPopularLocations() {
    if (!locationData || Object.keys(locationData).length === 0) {
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
            const baseTime = calculateBaseTime(kst.getHours());
            let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');

            if (kst.getHours() < 2 && baseTime === '2300') {
                const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
                baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
            }

            const cacheKey = `weather_${location.name}_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;

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
            const weatherData = processCompleteWeatherData(items, kst);

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

async function handleLocationSearch(req, res) {
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

        const searchResult = searchLocations(query, page, WEATHER_CONFIG.DEFAULTS.PAGE_SIZE);

        logger.info('지역 검색 성공', {
            query: query,
            page: page,
            resultsCount: searchResult.results.length
        });

        return res.json({
            success: true,
            query: query,
            results: searchResult.results.map(location => ({
                name: location.name,
                displayName: location.weather_name || location.name,
                type: location.type,
                lat: location.lat,
                lon: location.lon,
                key: location.key
            })),
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

async function handleWeatherRequest(req, res) {
    metrics.apiCalls++;
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
            regionName = WEATHER_CONFIG.DEFAULTS.REGION;
            const defaultLocationMatches = findAllMatches(regionName);
            const defaultLocation = defaultLocationMatches.length > 0 ? defaultLocationMatches[0] : null;

            if (!defaultLocation || Object.keys(locationData).length === 0) {
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

        const currentRegionKey = regionName || (findMatchingLocation({ lat: latitude, lon: longitude })?.name || 'UNKNOWN_REGION');
        metrics.addRegionalRequest(currentRegionKey);

        logger.info('완전한 날씨 API 요청 수신', {
            region: regionName,
            lat: latitude,
            lon: longitude,
            detailed,
            minimal,
            hasWeatherApiKey: !!weatherApiKey
        });

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

        if (latitude && longitude) {
            coordinates = latLonToGrid(latitude, longitude);
            const matchedAdminLocation = findMatchingLocation({ lat: latitude, lon: longitude });

            locationInfo = {
                requested: `${lat}, ${lon}`,
                matched: matchedAdminLocation ? matchedAdminLocation.name : `위경도 (${latitude}, ${longitude})`,
                fullName: matchedAdminLocation ? matchedAdminLocation.name : `위도 ${latitude}, 경도 ${longitude}`,
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

            if (!location) {
                throw new WeatherAPIError(`지역 "${regionName}"에 대한 정보를 찾을 수 없습니다.`, 'LOCATION_NOT_FOUND', 404);
            }

            coordinates = latLonToGrid(location.lat, location.lon);
            locationInfo = {
                requested: regionName,
                matched: location.name,
                fullName: location.name,
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
                    weatherStatus: day.weatherStatus
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
            throw new WeatherAPIError(`기상청 API 오류: ${errorMsg}`, `API_ERROR_${resultCode}`, 
                ['10', '11'].includes(resultCode) ? 400 : 500);
        }

        const items = response.data.response.body.items.item || [];
        logger.info('📊 받은 기상 데이터 항목 수', { count: items.length });

        const weatherData = processCompleteWeatherData(items, kst);

        logger.info('✅ 완전한 날씨 데이터 처리 완료', { days: weatherData.length });

        let responseData = {
            success: true,
            data: weatherData,
            locationInfo: locationInfo,
            apiInfo: {
                source: '기상청 단기예보 API',
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
                weatherStatus: day.weatherStatus
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

// 메인 서버리스 핸들러 함수
module.exports = async function handler(req, res) {
    if (!global.weatherServiceInitialized) {
        validateEnvironment();
        if (Object.keys(locationData).length > 0 && process.env.WEATHER_API_KEY) {
            await preloadPopularLocations();
        } else {
            logger.warn('사전 캐싱 조건이 충족되지 않아 건너뜁니다 (locationData 없음 또는 API 키 없음).');
        }
        global.weatherServiceInitialized = true;
    }

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

    if (pathname === '/api/search-locations') {
        return handleLocationSearch(req, res);
    }

    return handleWeatherRequest(req, res);
};
