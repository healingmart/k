제미나이2.txt를 기반으로 소넷2의 장점을 통합하고 단점을 보완한 최종 코드를 작성하겠습니다.

```javascript
/**
 * @file weather.js
 * @description 기상청 날씨 API 연동 및 지역 검색을 위한 서버리스 함수.
 * Vercel 환경에 최적화되어 있으며, 캐싱, 에러 처리, 로깅, 성능 모니터링,
 * Rate Limiting, 데이터 검증 기능을 포함합니다.
 * 
 * @version 3.0-final
 * @improvements
 * - 정확한 base_time 계산 (분 단위 체크)
 * - 기상청 공식 체감온도 계산
 * - TMN/TMX 우선 처리
 * - SKY 코드 동적 조정
 * - 효율적인 캐시 관리
 * - 강수량/적설량 범위값 처리
 */

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
    MAX_ENTRIES: 100,
    CLEANUP_INTERVAL: IS_PRODUCTION ? 30 * 60 * 1000 : 15 * 60 * 1000 // 30분 or 15분
  },
  DEFAULTS: {
    REGION: '서울특별시',
    PAGE_SIZE: 10
  }
};

// 날씨 예보 발표 시각 상수
const FORECAST_TIMES = [
  { hour: 2, minute: 10, base: '0200' },
  { hour: 5, minute: 10, base: '0500' },
  { hour: 8, minute: 10, base: '0800' },
  { hour: 11, minute: 10, base: '1100' },
  { hour: 14, minute: 10, base: '1400' },
  { hour: 17, minute: 10, base: '1700' },
  { hour: 20, minute: 10, base: '2000' },
  { hour: 23, minute: 10, base: '2300' }
];

// =====================================================================
// 메트릭 및 로깅 시스템 (소넷2 개선사항 적용)
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
// locationData.js 의존성 처리
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
    ).map(loc => ({ ...loc, key: loc.name, priority: loc.priority_score }));
    return results.sort((a, b) => b.priority - a.priority);
  },
  // 기상청 격자 좌표 변환 공식
  latLonToGrid: (lat, lon) => {
    const RE = 6371.00877;
    const GRID = 5.0;
    const SLAT1 = 30.0;
    const SLAT2 = 60.0;
    const OLON = 126.0;
    const OLAT = 38.0;
    const XO = 43;
    const YO = 136;

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

// =====================================================================
// 캐시 시스템 (소넷2 개선사항 적용)
let weatherCache = new Map();

// 효율적인 캐시 정리 함수
const cleanupCache = () => {
  const now = Date.now();
  const ttlMs = WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000;
  let cleanedCount = 0;

  // 만료된 항목 제거
  for (const [key, entry] of weatherCache.entries()) {
    if (now - entry.timestamp > ttlMs) {
      weatherCache.delete(key);
      cleanedCount++;
    }
  }

  // LRU 방식으로 최대 엔트리 수 관리
  if (weatherCache.size > WEATHER_CONFIG.CACHE.MAX_ENTRIES) {
    const sortedEntries = [...weatherCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = sortedEntries.slice(0, 
      weatherCache.size - WEATHER_CONFIG.CACHE.MAX_ENTRIES);
    
    toRemove.forEach(([key]) => {
      weatherCache.delete(key);
      cleanedCount++;
    });
  }

  if (cleanedCount > 0) {
    logger.info(`🧹 캐시 정리 완료: ${cleanedCount}개 항목 제거, 현재 크기: ${weatherCache.size}`);
  }
};

// 캐시 정리 스케줄러 (프로덕션 환경에서만)
if (IS_PRODUCTION) {
  setInterval(cleanupCache, WEATHER_CONFIG.CACHE.CLEANUP_INTERVAL);
}

// =====================================================================
// 기상청 공식 날씨 코드 매핑
const WEATHER_CODES = {
  SKY: {
    '1': '맑음',
    '2': '구름조금',
    '3': '구름많음',
    '4': '흐림'
  },
  PTY: {
    '0': '없음',
    '1': '비',
    '2': '비/눈',
    '3': '눈',
    '4': '소나기',
    '5': '빗방울',
    '6': '빗방울/눈날림',
    '7': '눈날림'
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
    '1mm 미만': '1mm 미만',
    '1': '1mm',
    '5': '5mm',
    '10': '10mm',
    '20': '20mm',
    '30': '30mm',
    '50': '50mm',
    '100': '100mm 이상',
    '30mm 이상': '30mm 이상',
    '50mm 이상': '50mm 이상',
    '100mm 이상': '100mm 이상'
  },
  SNO: {
    '적설없음': '0cm',
    '1cm 미만': '1cm 미만',
    '1': '1cm',
    '5': '5cm',
    '10': '10cm',
    '20': '20cm',
    '30': '30cm 이상',
    '5cm 이상': '5cm 이상',
    '10cm 이상': '10cm 이상',
    '20cm 이상': '20cm 이상',
    '30cm 이상': '30cm 이상'
  },
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

// 기상청 API 에러 메시지 매핑
const API_ERROR_MESSAGES = {
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
// Rate Limiting
const rateLimitMap = new Map();

function checkRateLimit(ip, limit = 100, windowMs = 60 * 1000) {
  if (!ip) return;

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
// 유틸리티 함수

// URL의 pathname 추출
function getPathname(req) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    return url.pathname;
  } catch (error) {
    logger.warn('URL 파싱 중 오류 발생, Fallback 경로 사용:', { message: error.message });
    return req.url.split('?')[0];
  }
}

// 날짜 문자열 포맷팅
function formatDateString(dateString) {
  return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

/**
 * @description 기상청 API의 base_date 및 base_time을 정확히 계산합니다.
 * @param {Date} kst - 현재 KST Date 객체
 * @returns {{baseDate: string, baseTime: string}} 계산된 base_date와 base_time
 */
const calculateBaseDateTime = (kst) => {
  const hour = kst.getHours();
  const minute = kst.getMinutes();
  const currentTimeInMinutes = hour * 60 + minute;

  let baseTime = '2300';
  let baseDate = new Date(kst);

  // 역순으로 탐색하여 가장 가까운 과거 발표 시간 찾기
  for (let i = FORECAST_TIMES.length - 1; i >= 0; i--) {
    const { hour: standardHour, minute: standardMinute, base } = FORECAST_TIMES[i];
    const standardTimeInMinutes = standardHour * 60 + standardMinute;

    if (currentTimeInMinutes >= standardTimeInMinutes) {
      baseTime = base;
      break;
    }
  }

  // 02:10 이전이라면 전날 23:00 사용
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

// =====================================================================
// API 호출 재시도 로직
const apiCallWithRetry = async (url, axiosParams, retries = WEATHER_CONFIG.API.MAX_RETRIES) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.warn('API 요청 타임아웃 발생 (AbortController)');
    }, WEATHER_CONFIG.API.TIMEOUT);

    const response = await axios.get(url, {
      signal: controller.signal,
      ...axiosParams
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      return apiCallWithRetry(url, axiosParams, retries - 1);
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
    return region.replace(/[<>"'&]/g, ''); // XSS 방지
  },
  page: (page) => {
    const num = parseInt(page);
    if (isNaN(num) || num < 1) {
      throw new WeatherAPIError('유효하지 않은 페이지 번호입니다. 1 이상의 숫자여야 합니다.', 'INVALID_PAGE_NUMBER', 400);
    }
    return num;
  }
};

// =====================================================================
// 날씨 관련 계산 함수들

/**
 * 체감온도를 계산합니다 (기상청 공식)
 * @param {number|null} temperature - 기온 (°C)
 * @param {number|null} humidity - 습도 (%)
 * @param {number|null} windSpeed - 풍속 (m/s)
 * @returns {string|null} 체감온도 (소수점 첫째 자리까지) 또는 null
 */
function calculateSensoryTemperature(temperature, humidity, windSpeed) {
  if (temperature === null || windSpeed === null || isNaN(temperature) || isNaN(windSpeed)) {
    return null;
  }

  const T = parseFloat(temperature);
  const WS = parseFloat(windSpeed);
  const RH = humidity !== null && !isNaN(humidity) ? parseFloat(humidity) : 50;

  let feelsLike;

  // 겨울철 체감온도 (기온 10도 이하, 풍속 1.3m/s 이상) - 기상청 공식
  if (T <= 10 && WS >= 1.3) {
    const V_kmh = WS * 3.6;
    feelsLike = 13.12 + (0.6215 * T) - (11.37 * Math.pow(V_kmh, 0.16)) + 
                (0.3965 * T * Math.pow(V_kmh, 0.16));
  }
  // 여름철 더위체감지수 (기온 33도 이상, 습도 40% 이상) - 기상청 공식
  else if (T >= 33 && RH >= 40) {
    feelsLike = -0.2442 + (0.55399 * T) + (0.45535 * RH) - (0.0022 * T * RH) + 
                (0.00278 * T * T) + (3.0 * Math.pow(10, -6) * T * T * RH) - 
                (5.481717 * Math.pow(10, -2) * Math.sqrt(RH));
  }
  else {
    feelsLike = T;
    if (RH > 70) feelsLike += (RH - 70) * 0.02;
    if (WS > 3) feelsLike -= (WS - 3) * 0.5;
  }

  // 극단값 방지
  if (feelsLike > T + 10) feelsLike = T + 10;
  if (feelsLike < T - 15) feelsLike = T - 15;
  if (feelsLike < -50) feelsLike = -50;
  if (feelsLike > 50) feelsLike = 50;

  return isNaN(feelsLike) ? null : feelsLike.toFixed(1);
}

/**
 * 강수량 값을 처리합니다 (범위값 포함)
 * @param {string|null} pcp - 강수량 값
 * @returns {string} 강수량 설명
 */
function processPrecipitationAmount(pcp) {
  if (!pcp || pcp === '강수없음') return '0mm';
  if (pcp === '1mm 미만') return '1mm 미만';
  
  // 범위값 처리
  if (pcp.includes('mm 이상')) return pcp;
  if (pcp.includes('이상')) return pcp;
  if (pcp.includes('mm')) return pcp;
  
  // 숫자만 있는 경우
  const num = parseFloat(pcp);
  if (!isNaN(num)) {
    if (num >= 100) return `${num}mm 이상`;
    return `${num}mm`;
  }
  
  return WEATHER_CODES.PCP[pcp] || `${pcp}mm`;
}

/**
 * 적설량 값을 처리합니다 (범위값 포함)
 * @param {string|null} sno - 적설량 값
 * @returns {string} 적설량 설명
 */
function processSnowAmount(sno) {
  if (!sno || sno === '적설없음') return '0cm';
  if (sno === '1cm 미만') return '1cm 미만';
  
  // 범위값 처리
  if (sno.includes('cm 이상')) return sno;
  if (sno.includes('이상')) return sno;
  if (sno.includes('cm')) return sno;
  
  // 숫자만 있는 경우
  const num = parseFloat(sno);
  if (!isNaN(num)) {
    if (num >= 30) return `${num}cm 이상`;
    return `${num}cm`;
  }
  
  return WEATHER_CODES.SNO[sno] || `${sno}cm`;
}

// 기타 날씨 관련 설명 함수들
function getTemperatureDescription(temp) {
  if (temp === null || isNaN(temp)) return '정보없음';
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

function getSensoryTemperatureDescription(sensoryTemp) {
  if (sensoryTemp === null || isNaN(parseFloat(sensoryTemp))) return '정보없음';
  const temp = parseFloat(sensoryTemp);
  if (temp >= 35) return '매우 더움 (폭염)';
  if (temp >= 30) return '더움 (불쾌지수 높음)';
  if (temp >= 25) return '약간 더움 (활동하기 좋음)';
  if (temp >= 20) return '쾌적함';
  if (temp >= 15) return '약간 쌀쌀 (활동하기 좋음)';
  if (temp >= 10) return '쌀쌀함';
  if (temp >= 5) return '추움';
  if (temp < 5) return '매우 추움';
  return '정보없음';
}

function getHumidityDescription(humidity) {
  if (humidity === null || isNaN(humidity)) return '정보없음';
  const h = parseInt(humidity);
  if (h >= 90) return '매우 습함';
  if (h >= 70) return '습함';
  if (h >= 50) return '적당';
  if (h >= 30) return '약간 건조';
  return '매우 건조';
}

function getWindSpeedDescription(windSpeed, isJeju = false) {
  if (windSpeed === null || isNaN(windSpeed)) return '정보없음';
  const ws = parseFloat(windSpeed);
  let desc = '';

  if (ws < 0.5) desc = '0.0m/s (고요)';
  else if (ws < 1.6) desc = '0.5~1.5m/s (실바람)';
  else if (ws < 3.4) desc = '1.6~3.3m/s (남실바람)';
  else if (ws < 5.5) desc = '3.4~5.4m/s (산들바람)';
  else if (ws < 8.0) desc = '5.5~7.9m/s (건들바람)';
  else if (ws < 10.8) desc = '8.0~10.7m/s (흔들바람)';
  else if (ws < 13.9) desc = '10.8~13.8m/s (된바람)';
  else if (ws < 17.2) desc = '13.9~17.1m/s (센바람)';
  else if (ws < 20.8) desc = '17.2~20.7m/s (큰바람)';
  else if (ws < 24.5) desc = '20.8~24.4m/s (강풍)';
  else if (ws < 28.5) desc = '24.5~28.4m/s (왕바람)';
  else if (ws < 32.7) desc = '28.5~32.6m/s (싹쓸바람)';
  else desc = '32.7m/s 이상 (미친바람)';

  return isJeju ? `${desc} (제주 특성상 변동성 있음)` : desc;
}

function getWindSpeedRange(wsd) {
  if (wsd === null || isNaN(wsd)) return '정보없음';
  const ws = parseFloat(wsd);
  if (ws < 0.5) return '0.0~0.4m/s (정온)';
  if (ws < 1.6) return '0.5~1.5m/s (실바람)';
  if (ws < 3.4) return '1.6~3.3m/s (남실바람)';
  if (ws < 5.5) return '3.4~5.4m/s (산들바람)';
  if (ws < 8.0) return '5.5~7.9m/s (건들바람)';
  if (ws < 10.8) return '8.0~10.7m/s (흔들바람)';
  if (ws < 13.9) return '10.8~13.8m/s (된바람)';
  if (ws < 17.2) return '13.9~17.1m/s (센바람)';
  if (ws < 20.8) return '17.2~20.7m/s (큰바람)';
  if (ws < 24.5) return '20.8~24.4m/s (강풍)';
  if (ws < 28.5) return '24.5~28.4m/s (왕바람)';
  if (ws < 32.7) return '28.5~32.6m/s (싹쓸바람)';
  return '32.7m/s 이상 (미친바람)';
}

function getWindDirectionFromDegree(degree) {
  if (degree === null || isNaN(degree)) return '정보없음';

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

/**
 * 파고 값을 가장 가까운 코드에 매핑합니다
 * @param {number|null} waveHeight - 파고 (m)
 * @returns {string} 파고 코드
 */
function getWaveHeightCode(waveHeight) {
  if (waveHeight === null || isNaN(waveHeight)) return '0';

  const wavCodes = Object.keys(WEATHER_CODES.WAV).map(Number).sort((a, b) => a - b);

  for (let i = 0; i < wavCodes.length; i++) {
    if (waveHeight < wavCodes[i]) {
      return String(wavCodes[i - 1] !== undefined ? wavCodes[i - 1] : wavCodes[0]);
    }
  }
  return String(wavCodes[wavCodes.length - 1]);
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

function getWeatherAdvice(data, locationFullName) {
  const temp = data.TMP ? parseFloat(data.TMP) : null;
  const pty = data.PTY;
  const pop = data.POP ? parseInt(data.POP) : 0;
  const wsd = data.WSD ? parseFloat(data.WSD) : 0;
  const isJeju = locationFullName.includes('제주');

  const advice = [];

  if (temp !== null) {
    if (temp >= 35) advice.push('🌡️ 폭염 경보! 야외활동 자제하세요');
    else if (temp >= 33) advice.push('🌡️️ 폭염 주의! 충분한 수분 섭취하세요');
    else if (temp >= 28) advice.push('☀️ 더운 날씨, 시원한 복장 추천');
    else if (temp <= -10) advice.push('🧊 한파 주의! 방한용품 필수');
    else if (temp <= 0) advice.push('❄️ 추운 날씨, 따뜻한 복장 필요');
    else if (temp <= 10) advice.push('🧥 쌀쌀한 날씨, 외투 준비하세요');
  }

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

  if (wsd >= 14) advice.push('💨 강풍 주의! 야외활동 조심하세요');
  else if (wsd >= 10) advice.push('🌬️ 바람이 강해요, 모자나 가벼운 물건 주의');

  if (isJeju) {
    advice.push('🌪️ 제주는 바람이 수시로 변하니 유의하세요');
  }

  return advice.length > 0 ? advice.join(' | ') : '쾌적한 날씨입니다';
}

// =====================================================================
// 날씨 데이터 처리 함수들

/**
 * 기상청 API 응답 데이터를 가공하여 일별, 시간별 날씨 정보로 구성합니다.
 * @param {Array<Object>} items - 기상청 API에서 반환된 날씨 데이터 항목 배열
 * @param {Date} kst - 현재 KST Date 객체
 * @param {string} locationFullName - 조회된 지역의 전체 이름
 * @returns {Array<Object>} 가공된 날씨 데이터 배열 (3일치)
 */
function processCompleteWeatherData(items, kst, locationFullName) {
  const forecastsByDateAndTime = {};

  // API 응답 데이터를 날짜-시간-카테고리별로 정리
  items.forEach(item => {
    const date = item.fcstDate;
    const time = item.fcstTime;
    const category = item.category;
    const value = item.fcstValue;

    if (!forecastsByDateAndTime[date]) {
      forecastsByDateAndTime[date] = {};
    }

    if (!forecastsByDateAndTime[date][time]) {
      forecastsByDateAndTime[date][time] = {};
    }

    forecastsByDateAndTime[date][time][category] = value;
  });

  const result = [];
  const targetDates = [];
  
  // 오늘, 내일, 모레의 날짜 문자열 생성 (YYYYMMDD)
  for (let i = 0; i < 3; i++) {
    const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
    targetDates.push(date.toISOString().slice(0, 10).replace(/-/g, ''));
  }

  targetDates.forEach((dateString, index) => {
    const dailyItems = forecastsByDateAndTime[dateString] || {};
    let processedDayData;

    if (Object.keys(dailyItems).length > 0) {
      processedDayData = extractDetailedWeatherDataForDay(dailyItems, dateString, kst, locationFullName);
    } else {
      logger.warn(`날짜 ${dateString} 에 대한 API 데이터가 부족하여 샘플 데이터로 대체합니다.`);
      processedDayData = generateCompleteSampleData(locationFullName, `API 데이터 없음: ${dateString}`)[index] || 
                        generateCompleteSampleData(locationFullName, `API 데이터 없음: ${dateString}`)[0];
      processedDayData.date = dateString;
      processedDayData.dateFormatted = formatDateString(dateString);
    }

    processedDayData.dayLabel = ['오늘', '내일', '모레'][index];
    processedDayData.dayIndex = index;
    result.push(processedDayData);
  });

  return result;
}

/**
 * 특정 날짜에 대한 시간별 날씨 데이터를 추출하고 가공합니다.
 * @param {Object} dailyItems - 특정 날짜의 시간별 API 데이터
 * @param {string} dateString - 날짜 (YYYYMMDD)
 * @param {Date} kst - 현재 KST Date 객체
 * @param {string} locationFullName - 지역 전체 이름
 * @returns {Object} 가공된 일별 날씨 데이터 객체
 */
function extractDetailedWeatherDataForDay(dailyItems, dateString, kst, locationFullName) {
  const hourlyData = [];
  let representativeTime = null;

  const currentKstHours = kst.getHours();
  const currentKstMinutes = kst.getMinutes();
  const isToday = (dateString === kst.toISOString().slice(0, 10).replace(/-/g, ''));

  const sortedTimes = Object.keys(dailyItems).sort();

  // TMN/TMX 우선 처리 로직
  let minTemp = null;
  let maxTemp = null;
  let maxPop = 0;

  // 1단계: TMN/TMX 필드에서 직접 일별 최저/최고 기온을 찾습니다.
  Object.values(dailyItems).forEach(hourData => {
    if (hourData.TMN !== undefined && hourData.TMN !== '' && hourData.TMN !== null) {
      minTemp = parseFloat(hourData.TMN);
    }
    if (hourData.TMX !== undefined && hourData.TMX !== '' && hourData.TMX !== null) {
      maxTemp = parseFloat(hourData.TMX);
    }
    if (hourData.POP) {
      const pop = parseInt(hourData.POP);
      if (!isNaN(pop) && pop > maxPop) maxPop = pop;
    }
  });

  // 2단계: TMN/TMX 필드가 없는 경우 TMP 값들을 순회하며 최저/최고를 찾습니다.
  if (minTemp === null || maxTemp === null) {
    let tempMinFromTMP = Infinity;
    let tempMaxFromTMP = -Infinity;

    sortedTimes.forEach(timeKey => {
      const hourData = dailyItems[timeKey];
      if (hourData.TMP !== undefined && hourData.TMP !== '' && hourData.TMP !== null) {
        const temp = parseFloat(hourData.TMP);
        if (!isNaN(temp)) {
          tempMinFromTMP = Math.min(tempMinFromTMP, temp);
          tempMaxFromTMP = Math.max(tempMaxFromTMP, temp);
        }
      }
    });

    if (minTemp === null && tempMinFromTMP !== Infinity) minTemp = tempMinFromTMP;
    if (maxTemp === null && tempMaxFromTMP !== -Infinity) maxTemp = tempMaxFromTMP;
  }

  // 시간별 데이터 가공
  for (const time of sortedTimes) {
    const hourData = dailyItems[time];

    const temp = parseFloat(hourData.TMP || '0');
    const pty = hourData.PTY || '0';
    const initialSkyCode = hourData.SKY ? String(hourData.SKY) : '1';
    const pop = parseInt(hourData.POP || '0');
    const reh = parseFloat(hourData.REH || '0');
    const wsd = parseFloat(hourData.WSD || '0');
    const vec = parseFloat(hourData.VEC || '0');
    const wav = parseFloat(hourData.WAV || '0');
    const vvv = parseFloat(hourData.VVV || '0');
    const pcp = hourData.PCP;
    const sno = hourData.SNO;

    // SKY 코드 동적 조정
    let adjustedSkyCode = initialSkyCode;
    if (pty === '0') {
      if (initialSkyCode === '1') {
        if (pop >= 70) adjustedSkyCode = '3';
        else if (pop >= 30) adjustedSkyCode = '2';
      } else if (initialSkyCode === '2') {
        if (pop >= 60) adjustedSkyCode = '3';
      }
    }

    const hourlyItem = {
      time: time,
      timeFormatted: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
      temperature: temp,
      sensoryTemperature: calculateSensoryTemperature(temp, reh, wsd),
      sky: WEATHER_CODES.SKY[adjustedSkyCode] || '알 수 없음',
      skyCode: adjustedSkyCode,
      precipitation: WEATHER_CODES.PTY[pty] || '알 수 없음',
      precipitationCode: pty,
      precipitationProbability: pop,
      precipitationAmount: processPrecipitationAmount(pcp),
      snowAmount: processSnowAmount(sno),
      humidity: reh,
      windSpeed: wsd.toFixed(1),
      windSpeedRange: getWindSpeedRange(wsd),
      windDirection: getWindDirectionFromDegree(vec),
      windDirectionDegree: vec,
      waveHeight: wav,
      visibility: vvv
    };
    hourlyData.push(hourlyItem);

    // 대표 시간 선정 로직
    const forecastTimeAsInt = parseInt(time);
    const currentKstTimeAsInt = currentKstHours * 100 + currentKstMinutes;

    if (isToday) {
      if (forecastTimeAsInt >= currentKstTimeAsInt && 
          (representativeTime === null || 
           Math.abs(forecastTimeAsInt - currentKstTimeAsInt) < 
           Math.abs(parseInt(representativeTime) - currentKstTimeAsInt))) {
        representativeTime = time;
      }
    } else {
      if (!representativeTime) {
        representativeTime = time;
      }
    }
  }

  // 대표 시간이 없는 경우 처리
  if (!representativeTime && sortedTimes.length > 0) {
    representativeTime = sortedTimes[sortedTimes.length - 1];
  } else if (!representativeTime) {
    representativeTime = '0000';
    logger.warn(`날짜 ${dateString} 에 대한 시간별 예보 데이터가 없어 대표 시간을 '0000'으로 설정합니다.`);
  }

  const representativeForecastData = dailyItems[representativeTime] || {};

  // 대표 시간의 하늘 상태도 조정된 SKY 코드를 사용
  let finalRepresentativeSkyCode = representativeForecastData.SKY ? String(representativeForecastData.SKY) : '1';
  const representativePty = representativeForecastData.PTY || '0';
  const representativePop = parseInt(representativeForecastData.POP || '0');

  if (representativePty === '0') {
    if (finalRepresentativeSkyCode === '1') {
      if (representativePop >= 70) finalRepresentativeSkyCode = '3';
      else if (representativePop >= 30) finalRepresentativeSkyCode = '2';
    } else if (finalRepresentativeSkyCode === '2') {
      if (representativePop >= 60) finalRepresentativeSkyCode = '3';
    }
  }

  const currentTemperature = representativeForecastData.TMP ? parseFloat(representativeForecastData.TMP) : null;
  const currentHumidity = representativeForecastData.REH ? parseInt(representativeForecastData.REH) : null;
  const currentWindSpeed = representativeForecastData.WSD ? parseFloat(representativeForecastData.WSD) : null;
  const currentVector = representativeForecastData.VEC ? parseFloat(representativeForecastData.VEC) : null;
  const currentWave = representativeForecastData.WAV ? parseFloat(representativeForecastData.WAV) : null;
  const currentVisibility = representativeForecastData.VVV ? parseFloat(representativeForecastData.VVV) : null;
  const currentPcp = representativeForecastData.PCP;
  const currentSno = representativeForecastData.SNO;

  const weatherStatus = getOverallWeatherStatus({
    TMP: currentTemperature,
    SKY: finalRepresentativeSkyCode,
    PTY: representativePty,
    POP: representativePop
  });

  const weatherAdvice = getWeatherAdvice({
    TMP: currentTemperature,
    PTY: representativePty,
    POP: representativePop,
    WSD: currentWindSpeed
  }, locationFullName);

  return {
    date: dateString,
    dateFormatted: formatDateString(dateString),
    representativeTime: representativeTime,

    temperature: currentTemperature ? Math.round(currentTemperature) : null,
    temperatureMin: minTemp ? Math.round(minTemp) : null,
    temperatureMax: maxTemp ? Math.round(maxTemp) : null,
    temperatureUnit: '°C',
    temperatureDescription: getTemperatureDescription(currentTemperature),
    sensoryTemperature: calculateSensoryTemperature(currentTemperature, currentHumidity, currentWindSpeed),
    sensoryTemperatureDescription: getSensoryTemperatureDescription(calculateSensoryTemperature(currentTemperature, currentHumidity, currentWindSpeed)),
    temperatureCompareYesterday: null,

    sky: WEATHER_CODES.SKY[finalRepresentativeSkyCode] || '정보없음',
    skyCode: finalRepresentativeSkyCode,
    skyDescription: WEATHER_CODES.SKY[finalRepresentativeSkyCode] || '정보없음',

    precipitation: WEATHER_CODES.PTY[representativePty] || '없음',
    precipitationCode: representativePty,
    precipitationDescription: WEATHER_CODES.PTY[representativePty] || '없음',
    precipitationProbability: representativePop,
    precipitationProbabilityMax: maxPop,
    precipitationProbabilityDescription: WEATHER_CODES.POP[String(representativePop)] || '정보없음',
    precipitationAmount: processPrecipitationAmount(currentPcp),
    precipitationAmountDescription: WEATHER_CODES.PCP[currentPcp] || '0mm',

    snowAmount: processSnowAmount(currentSno),
    snowAmountDescription: WEATHER_CODES.SNO[currentSno] || '0cm',

    humidity: currentHumidity,
    humidityUnit: '%',
    humidityDescription: getHumidityDescription(currentHumidity),

    windSpeed: currentWindSpeed ? currentWindSpeed.toFixed(1) : null,
    windSpeedUnit: 'm/s',
    windSpeedDescription: getWindSpeedDescription(currentWindSpeed, locationFullName.includes('제주')),
    windSpeedRange: getWindSpeedRange(currentWindSpeed),
    windDirection: getWindDirectionFromDegree(currentVector),
    windDirectionDegree: currentVector,
    windDirectionDescription: currentVector !== null ? `${getWindDirectionFromDegree(currentVector)} (${currentVector}도)` : '정보없음',

    waveHeight: currentWave,
    waveHeightDescription: WEATHER_CODES.WAV[String(getWaveHeightCode(currentWave))] || '정보없음',

    uvIndex: null,
    visibility: currentVisibility,

    weatherStatus: weatherStatus,
    weatherAdvice: weatherAdvice,
    hourlyData: hourlyData
  };
}

/**
 * 빈 날씨 데이터 객체를 생성합니다 (에러 발생 시 폴백용)
 * @param {string} date - 날짜 (YYYYMMDD)
 * @returns {Object} 빈 날씨 데이터 객체
 */
function createEmptyWeatherData(date) {
  return {
    date: date,
    dateFormatted: formatDateString(date),
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
 * 샘플 날씨 데이터를 생성합니다 (API 호출 실패 또는 환경 변수 누락 시 사용).
 * @param {string} region - 지역 이름
 * @param {string|null} errorMessage - 발생한 에러 메시지
 * @returns {Array<Object>} 3일치 샘플 날씨 데이터 배열
 */
function generateCompleteSampleData(region, errorMessage = null) {
  const today = new Date();
  const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000);

  const dates = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(date);
  }

  const baseMessage = errorMessage ? 
    `⚠️ 오류: ${errorMessage}` : 
    '⚠️ API 키 또는 데이터 로드 문제 - 샘플 데이터';

  const sampleDataByDay = [
    { temp: 23, minTemp: 18, maxTemp: 26, sky: '3', pty: '0', pop: 30, reh: 70, wsd: 2.5 },
    { temp: 24, minTemp: 19, maxTemp: 27, sky: '1', pty: '0', pop: 10, reh: 65, wsd: 2.0 },
    { temp: 21, minTemp: 17, maxTemp: 25, sky: '4', pty: '1', pop: 60, reh: 80, wsd: 3.5 }
  ];

  return dates.map((date, index) => {
    const sampleDay = sampleDataByDay[index];
    const data = {
      TMP: sampleDay.temp,
      PTY: sampleDay.pty,
      SKY: sampleDay.sky,
      POP: sampleDay.pop,
      REH: sampleDay.reh,
      WSD: sampleDay.wsd
    };

    const currentTemperature = data.TMP;
    const currentHumidity = data.REH;
    const currentWindSpeed = data.WSD;
    const currentVector = 225;
    const currentPcp = data.PTY === '1' ? '5' : '강수없음';
    const currentSno = data.PTY === '3' ? '1' : '적설없음';

    const hourlySampleData = [
      { time: '0600', temp: sampleDay.temp - 3, hum: sampleDay.reh - 5, ws: sampleDay.wsd - 0.5 },
      { time: '1200', temp: sampleDay.temp, hum: sampleDay.reh, ws: sampleDay.wsd },
      { time: '1800', temp: sampleDay.temp - 2, hum: sampleDay.reh + 5, ws: sampleDay.wsd - 0.3 }
    ].map(item => ({
      time: item.time,
      timeFormatted: `${item.time.slice(0, 2)}:${item.time.slice(2, 4)}`,
      temperature: Math.round(item.temp),
      sensoryTemperature: calculateSensoryTemperature(item.temp, item.hum, item.ws),
      sky: WEATHER_CODES.SKY[sampleDay.sky] || '정보없음',
      skyCode: sampleDay.sky,
      precipitation: WEATHER_CODES.PTY[sampleDay.pty] || '없음',
      precipitationCode: sampleDay.pty,
      precipitationProbability: sampleDay.pop,
      precipitationAmount: currentPcp === '강수없음' ? '0mm' : '5mm',
      snowAmount: currentSno === '적설없음' ? '0cm' : '1cm',
      humidity: Math.round(item.hum),
      windSpeed: item.ws.toFixed(1),
      windSpeedRange: getWindSpeedRange(item.ws),
      windDirection: getWindDirectionFromDegree(currentVector),
      windDirectionDegree: currentVector
    }));

    return {
      date: date.toISOString().slice(0, 10).replace(/-/g, ''),
      dateFormatted: date.toISOString().slice(0, 10),
      dayLabel: ['오늘', '내일', '모레'][index],
      dayIndex: index,
      representativeTime: '1200',

      temperature: currentTemperature,
      temperatureMin: sampleDay.minTemp,
      temperatureMax: sampleDay.maxTemp,
      temperatureUnit: '°C',
      temperatureDescription: getTemperatureDescription(currentTemperature),
      sensoryTemperature: calculateSensoryTemperature(currentTemperature, currentHumidity, currentWindSpeed),
      sensoryTemperatureDescription: getSensoryTemperatureDescription(
        calculateSensoryTemperature(currentTemperature, currentHumidity, currentWindSpeed)
      ),
      temperatureCompareYesterday: null,

      sky: WEATHER_CODES.SKY[data.SKY] || '정보없음',
      skyCode: data.SKY,
      skyDescription: WEATHER_CODES.SKY[data.SKY] || '정보없음',

      precipitation: WEATHER_CODES.PTY[data.PTY] || '없음',
      precipitationCode: data.PTY,
      precipitationDescription: WEATHER_CODES.PTY[data.PTY] || '없음',
      precipitationProbability: data.POP,
      precipitationProbabilityMax: sampleDay.pop,
      precipitationProbabilityDescription: WEATHER_CODES.POP[String(data.POP)] || '정보없음',
      precipitationAmount: processPrecipitationAmount(currentPcp),
      precipitationAmountDescription: WEATHER_CODES.PCP[currentPcp] || '0mm',

      snowAmount: processSnowAmount(currentSno),
      snowAmountDescription: WEATHER_CODES.SNO[currentSno] || '0cm',

      humidity: currentHumidity,
      humidityUnit: '%',
      humidityDescription: getHumidityDescription(currentHumidity),

      windSpeed: currentWindSpeed ? currentWindSpeed.toFixed(1) : null,
      windSpeedUnit: 'm/s',
      windSpeedDescription: getWindSpeedDescription(currentWindSpeed, region.includes('제주')),
      windSpeedRange: getWindSpeedRange(currentWindSpeed),
      windDirection: getWindDirectionFromDegree(currentVector),
      windDirectionDegree: currentVector,
      windDirectionDescription: `${getWindDirectionFromDegree(currentVector)} (${currentVector}도)`,

      waveHeight: null,
      waveHeightDescription: '정보없음',

      uvIndex: null,
      visibility: null,

      weatherStatus: getOverallWeatherStatus(data),
      weatherAdvice: getWeatherAdvice(data, region),

      hourlyData: hourlySampleData,

      message: `${baseMessage} (${['오늘', '내일', '모레'][index]})`,
      timestamp: new Date().toISOString(),
      region: region
    };
  });
}

/**
 * 날씨 데이터의 유효성을 검증합니다.
 * @param {Object} data - 검증할 날씨 데이터 객체
 * @returns {boolean} 유효성 통과 여부
 */
function validateWeatherData(data) {
  const errors = [];

  if (data.temperature !== null && (parseFloat(data.temperature) < -50 || parseFloat(data.temperature) > 60)) {
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

/**
 * 인기 지역 날씨 데이터를 사전 캐싱합니다.
 * @returns {Promise<void>}
 */
async function preloadPopularLocations() {
  if (!WEATHER_API_KEY) {
    logger.warn('WEATHER_API_KEY가 없어 인기 지역 사전 캐싱을 건너뜁니다.');
    return;
  }
  if (Object.keys(locationData).length === 0) {
    logger.warn('locationData가 로드되지 않아 인기 지역 사전 캐싱을 건너뜁니다.');
    return;
  }

  const popularRegions = ['서울특별시', '제주시', '부산광역시', '서귀포시', '대전광역시'];

  for (const regionName of popularRegions) {
    try {
      const locationMatches = findAllMatches(regionName);
      if (locationMatches.length === 0) {
        logger.warn(`사전 캐싱을 위한 지역 '${regionName}'을(를) 찾을 수 없습니다.`);
        continue;
      }
      const location = locationMatches[0];

      const coordinates = latLonToGrid(location.lat, location.lon);
      const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
      const { baseDate, baseTime } = calculateBaseDateTime(kstNow);

      const cacheKey = `weather_${location.name}_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;

      if (weatherCache.has(cacheKey)) {
        logger.info(`사전 캐싱: '${regionName}' (캐시에 이미 존재)`);
        continue;
      }

      logger.info(`사전 캐싱 시작: '${regionName}'`);
      const response = await apiCallWithRetry(WEATHER_CONFIG.API.BASE_URL, {
        params: {
          serviceKey: decodeURIComponent(WEATHER_API_KEY),
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
      const weatherData = processCompleteWeatherData(items, kstNow, location.name);

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
          version: '3.0-final'
        },
        weatherCodes: WEATHER_CODES
      };

      weatherCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      logger.info(`사전 캐싱 완료: '${regionName}'`);
      cleanupCache();

    } catch (error) {
      logger.error(`사전 캐싱 중 오류 발생: '${regionName}'`, error);
    }
  }
}

/**
 * 환경 변수 유효성 검사
 * @returns {{isValid: boolean, missing: string[]}}
 */
function validateEnvironment() {
  const required = ['WEATHER_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && IS_PRODUCTION) {
    logger.error(`필수 환경 변수 누락: ${missing.join(', ')}. 프로덕션 환경에서는 서비스 시작이 불가능합니다.`);
    throw new Error(`필수 환경 변수 누락: ${missing.join(', ')}.`);
  } else if (missing.length > 0) {
    logger.warn(`필수 환경 변수 누락 (개발/테스트 환경): ${missing.join(', ')}`);
  }

  return {
    isValid: missing.length === 0,
    missing
  };
}

// =====================================================================
// API 핸들러 함수들

/**
 * 지역 검색 API 핸들러
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
async function handleLocationSearch(req, res) {
  const requestInfo = { url: req.url, query: req.query, headers: req.headers };
  try {
    const query = validateInput.region(req.query.q);
    const page = validateInput.page(req.query.page || 1);

    const searchResult = searchLocations(query, page, WEATHER_CONFIG.DEFAULTS.PAGE_SIZE);

    logger.info('지역 검색 성공', {
      query: query,
      page: page,
      resultsCount: searchResult.results.length
    });

    const processedResults = searchResult.results.map(location => ({
      name: location.name,
      displayName: location.displayName || location.name,
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

    return res.json({
      success: true,
      query: query,
      results: processedResults,
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
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
async function handleWeatherRequest(req, res) {
  metrics.apiCalls++;
  const requestInfo = { url: req.url, query: req.query, headers: req.headers };
  const endResponseTimer = performanceLogger.startTimer('전체 날씨 응답 처리');

  try {
    let latitude, longitude, regionName;
    const { lat, lon, region, detailed = 'true', minimal = 'false' } = req.query;

    // 1. 입력 파라미터 유효성 검사 및 지역/좌표 결정
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
      logger.warn(`위경도/지역명 없음: 기본 지역(${regionName}) 사용`);
    }

    // 2. 환경 변수 검증
    if (!WEATHER_API_KEY) {
      const errorMessage = 'WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.';
      logger.error(errorMessage, new Error(errorMessage), requestInfo);
      return res.status(500).json({
        success: false,
        data: generateCompleteSampleData(regionName || WEATHER_CONFIG.DEFAULTS.REGION, errorMessage),
        error: errorMessage,
        code: 'API_KEY_MISSING'
      });
    }

    let coordinates;
    let locationInfo;
    let actualLocationFullName;

    // 3. 지역명 또는 위경도에 따른 실제 조회 위치 결정
    if (latitude && longitude) {
      coordinates = latLonToGrid(latitude, longitude);
      const matchedAdminLocation = findMatchingLocation({ lat: latitude, lon: longitude });
      actualLocationFullName = matchedAdminLocation ? 
        matchedAdminLocation.name : 
        `위도 ${latitude}, 경도 ${longitude}`;

      locationInfo = {
        requested: `${lat}, ${lon}`,
        matched: matchedAdminLocation ? 
          matchedAdminLocation.name : 
          `위경도 (${latitude}, ${longitude})`,
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

    } else if (regionName) {
      const locationMatches = findAllMatches(regionName);
      const location = locationMatches.length > 0 ? locationMatches[0] : null;

      if (!location || !location.lat || !location.lon || Object.keys(locationData).length === 0) {
        throw new WeatherAPIError(
          `지역 "${regionName}"에 대한 좌표 정보를 찾을 수 없습니다. (날씨 조회 불가)`,
          'LOCATION_COORDINATES_MISSING',
          404
        );
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
    } else {
      throw new WeatherAPIError('날씨 정보를 조회할 지역 정보가 없습니다.', 'MISSING_LOCATION_PARAM', 400);
    }

    metrics.addRegionalRequest(actualLocationFullName);

    // 4. 캐시 확인 및 사용
    const kstNow = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    const { baseDate, baseTime } = calculateBaseDateTime(kstNow);
    const cacheKey = `weather_${actualLocationFullName}_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;
    const cachedData = weatherCache.get(cacheKey);

    if (cachedData && (Date.now() - cachedData.timestamp < WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000)) {
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
      endResponseTimer();
      return res.status(200).json(responseData);
    }
    metrics.cacheMisses++;

    // 5. 기상청 API 호출
    logger.info('🌤️ 기상청 API 호출 시작', {
      baseDate,
      baseTime,
      nx: coordinates.nx,
      ny: coordinates.ny,
      location: locationInfo.fullName
    });

    const apiCallTimer = performanceLogger.startTimer('기상청 API 실제 호출');
    const response = await apiCallWithRetry(WEATHER_CONFIG.API.BASE_URL, {
      params: {
        serviceKey: decodeURIComponent(WEATHER_API_KEY),
        numOfRows: 300,
        pageNo: 1,
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx: coordinates.nx,
        ny: coordinates.ny
      },
      headers: {
        'User-Agent': 'HealingK-Complete-Weather-Service/3.0-Final'
      }
    }, WEATHER_CONFIG.API.MAX_RETRIES);
    apiCallTimer();

    // 6. API 응답 검증 및 에러 처리
    if (!response.data?.response?.body?.items?.item) {
      throw new WeatherAPIError('기상청 API 응답에 날씨 데이터가 없습니다.', 'API_RESPONSE_EMPTY', 500);
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

    // 7. 데이터 가공 및 검증
    const items = response.data.response.body.items.item || [];
    logger.info('📊 받은 기상 데이터 항목 수', { count: items.length });

    const weatherData = processCompleteWeatherData(items, kstNow, actualLocationFullName);

    logger.info('✅ 최종 날씨 데이터 처리 완료', { days: weatherData.length });

    // 8. 최종 응답 데이터 구성 및 캐싱
    let responseData = {
      success: true,
      data: weatherData,
      locationInfo: locationInfo,
      apiInfo: {
        source: '기상청 단기예보 API',
        note: '기상청 단기예보 API 기준입니다. 실시간 관측값과 차이가 있을 수 있습니다.',
        baseDate: baseDate,
        baseTime: baseTime,
        timestamp: new Date().toISOString(),
        apiKeyUsed: 'WEATHER_API_KEY',
        totalCategories: Object.keys(WEATHER_CODES).length,
        dataPoints: items.length,
        version: '3.0-final',
        improvements: [
          '정확한 base_time 계산 (분 단위 체크)',
          'TMN/TMX 우선 처리',
          '기상청 공식 체감온도 계산',
          '강수량/적설량 범위값 처리',
          'SKY 코드 동적 조정',
          '효율적인 캐시 관리',
          '포괄적인 에러 처리'
        ]
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

    cleanupCache();

    logger.info('🎉 최종 날씨 API 응답 성공');
    endResponseTimer();
    return res.status(200).json(responseData);

  } catch (error) {
    logger.error(`최종 날씨 API 오류: ${error.message}`, error, requestInfo);
    endResponseTimer();

    if (error instanceof WeatherAPIError) {
      return res.status(error.statusCode).json({
        success: false,
        data: generateCompleteSampleData(
          req.query.region || WEATHER_CONFIG.DEFAULTS.REGION,
          error.message
        ),
        error: error.message,
        code: error.code
      });
    }

    return res.status(500).json({
      success: false,
      data: generateCompleteSampleData(
        req.query.region || WEATHER_CONFIG.DEFAULTS.REGION,
        '서버 내부 오류'
      ),
      error: '서버 내부 오류가 발생했습니다.',
      code: 'UNKNOWN_SERVER_ERROR'
    });
  }
}

// =====================================================================
// 메인 서버리스 핸들러 (Vercel의 entry point)
module.exports = async function handler(req, res) {
  // 서버리스 함수의 콜드 스타트 시 1회만 초기화
  if (!global.weatherServiceInitialized) {
    try {
      validateEnvironment();
      // locationData 로드 여부와 API 키 존재 여부에 따라 사전 캐싱 실행
      if (Object.keys(locationData).length > 0 && WEATHER_API_KEY) {
        await preloadPopularLocations();
      } else {
        logger.warn('사전 캐싱 조건이 충족되지 않아 건너뜁니다 (locationData 없음 또는 API 키 없음).');
      }
      global.weatherServiceInitialized = true;
    } catch (error) {
      logger.error('서비스 초기화 중 오류 발생', error);
    }
  }

  // CORS 및 보안 헤더 설정
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

  // Rate Limiting 적용
  const clientIp = req.headers['x-forwarded-for']?.split(',').shift() || 
                  req.connection?.remoteAddress || '';
  if (IS_PRODUCTION && clientIp) {
    try {
      checkRateLimit(clientIp, 100, 60 * 1000);
    } catch (error) {
      if (error instanceof WeatherAPIError && error.code === 'RATE_LIMIT_EXCEEDED') {
        logger.warn(`Rate Limit 초과: ${clientIp}`, { error_message: error.message });
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
          data: generateCompleteSampleData(
            req.query.region || WEATHER_CONFIG.DEFAULTS.REGION,
            error.message
          )
        });
      }
      throw error;
    }
  }

  const pathname = getPathname(req);

  // 라우팅 처리
  if (pathname === '/api/health') {
    logger.info('헬스체크 요청 수신');
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0-final',
      description: '제미나이2 기반 + 소넷2 장점 통합 최종 버전',
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
        hasApiKey: !!WEATHER_API_KEY,
        environment: process.env.NODE_ENV || 'production',
        cacheTtlMinutes: WEATHER_CONFIG.CACHE.TTL_MINUTES,
        apiTimeoutMs: WEATHER_CONFIG.API.TIMEOUT,
        apiMaxRetries: WEATHER_CONFIG.API.MAX_RETRIES,
        locationDataLoaded: Object.keys(locationData).length > 0
      },
      improvements: [
        '정확한 base_time 계산 (분 단위 체크)',
        'TMN/TMX 우선 처리',
        '기상청 공식 체감온도 계산',
        '강수량/적설량 범위값 처리',
        'SKY 코드 동적 조정',
        '효율적인 캐시 관리 (LRU)',
        '포괄적인 에러 처리',
        '파고 코드 매핑',
        '코드 구조 최적화'
      ],
      uptime: process.uptime ? `${process.uptime().toFixed(2)}s` : 'N/A'
    });
  }

  if (pathname === '/api/search/locations') {
    return handleLocationSearch(req, res);
  }

  // 기본 날씨 요청 처리
  return handleWeatherRequest(req, res);
};
```

이 최종 코드는 다음과 같은 개선사항을 포함합니다:

**제미나이2 기반 유지:**
- 체계적인 코드 구조와 상세한 문서화
- SKY 코드 동적 조정
- 파고(WAV) 코드 매핑 함수
- TMN/TMX 우선 처리
- 정확한 base_time 계산

**소넷2 장점 통합:**
- 환경 변수 상수화 (IS_PRODUCTION, WEATHER_API_KEY)
- 효율적인 캐시 정리 함수 (LRU 방식)
- 메트릭 reset 함수 개선
- 에러 시 샘플 데이터 제공
- try-catch로 서비스 초기화 보호

**추가 개선사항:**
- FORECAST_TIMES 상수 배열로 분리
- formatDateString 헬퍼 함수 추가
- 강수량/적설량 범위값 처리 강화
- 코드 중복 제거
- 더 명확한 로깅

이 최종 버전은 가장 완성도 높고 안정적인 날씨 API 구현입니다.
