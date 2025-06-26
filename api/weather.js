**소넷2 기반 완전한 날씨 API 서버리스 함수 - 처음부터 완성**

소넷4의 정확성과 제미나이의 안정성을 결합한 최종 완성본을 처음부터 완전히 작성해드리겠습니다.

```javascript
/**
 * @file weather.js
 * @description 기상청 날씨 API 연동 및 지역 검색을 위한 서버리스 함수.
 * 소넷4의 정확성과 제미나이의 안정성을 결합한 최종 완성본
 * - 정확한 base_time 계산 (분 단위 체크)
 * - 기상청 공식 체감온도 계산
 * - TMN/TMX 우선 처리
 * - 안정적인 에러 처리 및 캐싱 시스템
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
    MAX_ENTRIES: 100
  },
  DEFAULTS: {
    REGION: '서울특별시',
    PAGE_SIZE: 10
  }
};

// =====================================================================
// 메트릭 및 로깅 시스템
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
  // 정확한 격자 변환 공식
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
// 캐시 시스템
let weatherCache = new Map();

// 캐시 정리 스케줄러
const cleanupCache = () => {
  const now = Date.now();
  let cleanedCount = 0;

  weatherCache.forEach((entry, key) => {
    if (now - entry.timestamp > WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000) {
      weatherCache.delete(key);
      cleanedCount++;
    }
  });

  // 최대 엔트리 수 초과 시 가장 오래된 항목 제거
  while (weatherCache.size > WEATHER_CONFIG.CACHE.MAX_ENTRIES) {
    const oldestKey = weatherCache.keys().next().value;
    weatherCache.delete(oldestKey);
    cleanedCount++;
  }

  if (cleanedCount > 0) {
    logger.info(`🧹 캐시 정리 완료: ${cleanedCount}개 항목 제거, 현재 크기: ${weatherCache.size}`);
  }
};

// 캐시 정리 스케줄러 실행
if (IS_PRODUCTION) {
  setInterval(cleanupCache, WEATHER_CONFIG.CACHE.TTL_MINUTES * 60 * 1000);
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
    '2': '2mm',
    '3': '3mm',
    '5': '5mm',
    '10': '10mm',
    '20': '20mm',
    '30': '30mm',
    '50': '50mm',
    '100': '100mm 이상'
  },
  SNO: {
    '적설없음': '0cm',
    '1cm 미만': '1cm 미만',
    '1': '1cm',
    '5': '5cm',
    '10': '10cm',
    '20': '20cm',
    '30': '30cm 이상'
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
// 정확한 base_time 계산 (소넷4의 핵심 기능)
const calculateBaseDateTime = (kst) => {
  const hour = kst.getHours();
  const minute = kst.getMinutes();

  let baseTime = '2300';
  let baseDate = new Date(kst);

  if (hour >= 23 && minute >= 10) {
    baseTime = '2300';
  } else if (hour >= 20 && minute >= 10) {
    baseTime = '2000';
  } else if (hour >= 17 && minute >= 10) {
    baseTime = '1700';
  } else if (hour >= 14 && minute >= 10) {
    baseTime = '1400';
  } else if (hour >= 11 && minute >= 10) {
    baseTime = '1100';
  } else if (hour >= 8 && minute >= 10) {
    baseTime = '0800';
  } else if (hour >= 5 && minute >= 10) {
    baseTime = '0500';
  } else if (hour >= 2 && minute >= 10) {
    baseTime = '0200';
  } else {
    baseDate.setDate(baseDate.getDate() - 1);
    baseTime = '2300';
  }

  return {
    baseDate: baseDate.toISOString().slice(0, 10).replace(/-/g, ''),
    baseTime: baseTime
  };
};

// =====================================================================
// API 호출 재시도 로직
const apiCallWithRetry = async (url, params, retries = WEATHER_CONFIG.API.MAX_RETRIES) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.warn('API 요청 타임아웃 발생');
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
// 기상청 공식 체감온도 계산
function calculateSensoryTemperature(temperature, humidity, windSpeed) {
  if (temperature === null || windSpeed === null) return null;

  const T = parseFloat(temperature);
  const WS = parseFloat(windSpeed);
  const RH = humidity !== null ? parseFloat(humidity) : 50;

  let feelsLike;

  // 겨울철 체감온도 (10도 이하, 풍속 1.3m/s 이상) - 기상청 공식
  if (T <= 10 && WS >= 1.3) {
    const V = WS * 3.6; // m/s를 km/h로 변환
    feelsLike = 13.12 + 0.6215 * T - 11.37 * Math.pow(V, 0.16) + 0.3965 * T * Math.pow(V, 0.16);
  }
  // 여름철 더위체감지수 (33도 이상, 습도 40% 이상) - 기상청 공식
  else if (T >= 33 && RH >= 40) {
    feelsLike = -0.2442 + 0.55399 * T + 0.45535 * RH - 0.0022 * T * RH + 
                0.00278 * T * T + 3.0 * Math.pow(10, -6) * T * T * RH - 
                5.481717 * Math.pow(10, -2) * Math.sqrt(RH);
  } else {
    // 일반적인 경우
    feelsLike = T;
    if (RH > 70) feelsLike += (RH - 70) * 0.02;
    if (WS > 3) feelsLike -= (WS - 3) * 0.5;
  }

  // 극단값 방지
  if (feelsLike > T + 10) feelsLike = T + 10;
  if (feelsLike < T - 15) feelsLike = T - 15;

  return isNaN(feelsLike) ? null : feelsLike.toFixed(1);
}

// =====================================================================
// 강수량/적설량 처리
function processPrecipitationAmount(pcp) {
  if (!pcp || pcp === '강수없음') return '0mm';
  if (pcp === '1mm 미만') return '0.5mm';
  if (pcp.includes('mm 이상')) return pcp;
  if (pcp.includes('이상')) return pcp;
  if (pcp.includes('mm')) return pcp;

  const num = parseFloat(pcp);
  if (!isNaN(num)) {
    if (num >= 100) return `${num}mm 이상`;
    return `${num}mm`;
  }
  return pcp;
}

function processSnowAmount(sno) {
  if (!sno || sno === '적설없음') return '0cm';
  if (sno === '1cm 미만') return '0.5cm';
  if (sno.includes('cm 이상')) return sno;
  if (sno.includes('이상')) return sno;
  if (sno.includes('cm')) return sno;

  const num = parseFloat(sno);
  if (!isNaN(num)) {
    if (num >= 30) return `${num}cm 이상`;
    return `${num}cm`;
  }
  return sno;
}

// =====================================================================
// TMN/TMX 우선 처리 로직을 포함한 완전한 날씨 데이터 처리
function processCompleteWeatherData(items, kst, locationFullName) {
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
  });

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

// TMN/TMX 우선 처리 로직을 포함한 완전한 날씨 데이터 추출
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

  // 대표 시간 선정 로직
  for (const fcstTimeStr of timeKeys) {
    const fcstHour = parseInt(fcstTimeStr.substring(0, 2), 10);
    const fcstMinute = parseInt(fcstTimeStr.substring(2, 4), 10);

    if (forecastDateObj.toDateString() === kst.toDateString()) {
      if (fcstHour > currentKstHours || (fcstHour === currentKstHours && fcstMinute >= currentKstMinutes)) {
        bestRepresentativeTime = fcstTimeStr;
        break;
      }
    } else {
      bestRepresentativeTime = timeKeys[0];
      break;
    }
  }

  if (!bestRepresentativeTime && timeKeys.length > 0) {
    bestRepresentativeTime = timeKeys[timeKeys.length - 1];
  }

  if (!bestRepresentativeTime || timeKeys.length === 0) {
    logger.warn(`날씨 데이터를 찾을 수 없어 대표 시간을 설정할 수 없습니다. 날짜: ${date}`);
    return createEmptyWeatherData(date);
  }

  const data = times[bestRepresentativeTime];

  // TMN/TMX 우선 처리 로직
  let minTemp = null;
  let maxTemp = null;

  // 1단계: TMN/TMX 먼저 확인
  Object.values(times).forEach(hourData => {
    if (hourData.TMN !== undefined && hourData.TMN !== '' && hourData.TMN !== null) {
      minTemp = parseFloat(hourData.TMN);
    }
    if (hourData.TMX !== undefined && hourData.TMX !== '' && hourData.TMX !== null) {
      maxTemp = parseFloat(hourData.TMX);
    }
  });

  // 2단계: TMN/TMX 없으면 TMP에서 계산
  if (minTemp === null || maxTemp === null) {
    let tempMin = Infinity;
    let tempMax = -Infinity;

    timeKeys.forEach(timeKey => {
      const hourData = times[timeKey];
      if (hourData.TMP && hourData.TMP !== '' && hourData.TMP !== null) {
        const temp = parseFloat(hourData.TMP);
        if (!isNaN(temp)) {
          if (minTemp === null && temp < tempMin) tempMin = temp;
          if (maxTemp === null && temp > tempMax) tempMax = temp;
        }
      }
    });

    if (minTemp === null && tempMin !== Infinity) minTemp = tempMin;
    if (maxTemp === null && tempMax !== -Infinity) maxTemp = tempMax;
  }


  // 최대 강수확률 계산
  let maxPop = 0;
  timeKeys.forEach(timeKey => {
    const hourData = times[timeKey];
    if (hourData.POP) {
      const pop = parseInt(hourData.POP);
      if (pop > maxPop) maxPop = pop;
    }
  });

  const currentTemperature = data.TMP ? parseFloat(data.TMP) : null;
  const currentHumidity = data.REH ? parseInt(data.REH) : null;
  const currentWindSpeed = data.WSD ? parseFloat(data.WSD) : null;
  const sensoryTemp = calculateSensoryTemperature(currentTemperature, currentHumidity, currentWindSpeed);

  return {
    date: date,
    dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    representativeTime: bestRepresentativeTime,
    temperature: data.TMP ? Math.round(parseFloat(data.TMP)) : null,
    temperatureMin: minTemp ? Math.round(minTemp) : null,
    temperatureMax: maxTemp ? Math.round(maxTemp) : null,
    temperatureUnit: '°C',
    temperatureDescription: getTemperatureDescription(data.TMP),
    sensoryTemperature: sensoryTemp,
    sensoryTemperatureDescription: sensoryTemp !== null ? getTemperatureDescription(sensoryTemp) : '정보없음',
    temperatureCompareYesterday: null,
    sky: getSkyDescription(data.SKY),
    skyCode: data.SKY,
    skyDescription: WEATHER_CODES.SKY[data.SKY] || '정보없음',
    precipitation: getPrecipitationDescription(data.PTY),
    precipitationCode: data.PTY,
    precipitationDescription: WEATHER_CODES.PTY[data.PTY] || '없음',
    precipitationProbability: data.POP ? parseInt(data.POP) : 0,
    precipitationProbabilityMax: Math.round(maxPop),
    precipitationProbabilityDescription: getPrecipitationProbabilityDescription(data.POP),
    precipitationAmount: processPrecipitationAmount(data.PCP),
    precipitationAmountDescription: WEATHER_CODES.PCP[data.PCP] || '0mm',
    snowAmount: processSnowAmount(data.SNO),
    snowAmountDescription: WEATHER_CODES.SNO[data.SNO] || '0cm',
    humidity: data.REH ? parseInt(data.REH) : null,
    humidityUnit: '%',
    humidityDescription: getHumidityDescription(data.REH),
    windSpeed: data.WSD ? parseFloat(data.WSD).toFixed(1) : null,
    windSpeedUnit: 'm/s',
    windSpeedDescription: getWindSpeedDescription(data.WSD, locationFullName.includes('제주')),
    windSpeedRange: data.WSD ? `${Math.max(0, parseFloat(data.WSD) - 1).toFixed(1)}~${(parseFloat(data.WSD) + 2).toFixed(1)}m/s` : null,
    windDirection: getWindDirectionFromDegree(data.VEC),
    windDirectionDegree: data.VEC ? parseFloat(data.VEC) : null,
    windDirectionDescription: data.VEC ? `${getWindDirectionFromDegree(data.VEC)} (${data.VEC}도)` : '정보없음',
    waveHeight: data.WAV || null,
    waveHeightDescription: WEATHER_CODES.WAV[data.WAV] || '정보없음',
    uvIndex: data.UVI || null,
    visibility: data.VIS || null,
    weatherStatus: getOverallWeatherStatus(data),
    weatherAdvice: getWeatherAdvice(data, locationFullName),
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

// =====================================================================
// 날씨 관련 설명 함수들

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

function getSkyDescription(code) {
  return WEATHER_CODES.SKY[code] || '정보없음';
}

function getPrecipitationDescription(code) {
  return WEATHER_CODES.PTY[code] || '없음';
}

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

function getHumidityDescription(humidity) {
  if (!humidity) return '정보없음';
  const h = parseInt(humidity);
  if (h >= 90) return '매우 습함';
  if (h >= 70) return '습함';
  if (h >= 50) return '적당';
  if (h >= 30) return '약간 건조';
  return '매우 건조';
}

function getWindSpeedDescription(windSpeed, isJeju = false) {
  if (!windSpeed) return '정보없음';
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
// 샘플 데이터 생성
function generateCompleteSampleData(region, errorMessage = null) {
  const today = new Date();
  const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000);

  const dates = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(date);
  }

  const baseMessage = errorMessage ? `⚠️ 오류: ${errorMessage}` : '⚠️ API 키 또는 데이터 로드 문제 - 샘플 데이터';

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
      precipitation: WEATHER_CODES.PTY[sampleDay.pty] || '없음',
      precipitationProbability: sampleDay.pop,
      humidity: Math.round(item.hum),
      windSpeed: item.ws.toFixed(1),
      windSpeedRange: `${Math.max(0, item.ws - 1).toFixed(1)}~${(item.ws + 2).toFixed(1)}m/s`
    }));

    return {
      date: date.toISOString().slice(0, 10).replace(/-/g, ''),
      dateFormatted: date.toISOString().slice(0, 10),
      dayLabel: ['오늘', '내일', '모레'][index],
      dayIndex: index,
      representativeTime: '1200',
      temperature: errorMessage ? null : Math.round(sampleDay.temp),
      temperatureMin: errorMessage ? null : Math.round(sampleDay.minTemp),
      temperatureMax: errorMessage ? null : Math.round(sampleDay.maxTemp),
      temperatureUnit: '°C',
      temperatureDescription: errorMessage ? '정보없음' : getTemperatureDescription(sampleDay.temp),
      sensoryTemperature: errorMessage ? null : calculateSensoryTemperature(sampleDay.temp, sampleDay.reh, sampleDay.wsd),
      sensoryTemperatureDescription: errorMessage ? '정보없음' : getTemperatureDescription(calculateSensoryTemperature(sampleDay.temp, sampleDay.reh, sampleDay.wsd)),
      temperatureCompareYesterday: null,
      sky: errorMessage ? '정보없음' : WEATHER_CODES.SKY[sampleDay.sky],
      skyCode: errorMessage ? null : sampleDay.sky,
      skyDescription: errorMessage ? '정보없음' : WEATHER_CODES.SKY[sampleDay.sky],
      precipitation: errorMessage ? '정보없음' : WEATHER_CODES.PTY[sampleDay.pty],
      precipitationCode: errorMessage ? null : sampleDay.pty,
      precipitationDescription: WEATHER_CODES.PTY[sampleDay.pty],
      precipitationProbability: errorMessage ? null : sampleDay.pop,
      precipitationProbabilityMax: errorMessage ? null : sampleDay.pop,
      precipitationProbabilityDescription: getPrecipitationProbabilityDescription(sampleDay.pop),
      precipitationAmount: errorMessage ? '정보없음' : (sampleDay.pty === '1' ? '5mm' : '0mm'),
      precipitationAmountDescription: sampleDay.pty === '1' ? '5mm' : '0mm',
      snowAmount: '0cm',
      snowAmountDescription: '0cm',
      humidity: errorMessage ? null : sampleDay.reh,
      humidityUnit: '%',
      humidityDescription: errorMessage ? '정보없음' : getHumidityDescription(sampleDay.reh),
      windSpeed: errorMessage ? null : sampleDay.wsd.toFixed(1),
      windSpeedUnit: 'm/s',
      windSpeedDescription: errorMessage ? '정보없음' : getWindSpeedDescription(sampleDay.wsd, region.includes('제주')),
      windSpeedRange: errorMessage ? null : `${Math.max(0, sampleDay.wsd - 1).toFixed(1)}~${(sampleDay.wsd + 2).toFixed(1)}m/s`,
      windDirection: errorMessage ? '정보없음' : '남서',
      windDirectionDegree: errorMessage ? null : 225,
      windDirectionDescription: errorMessage ? '정보없음' : '남서 (225도)',
      waveHeight: null,
      waveHeightDescription: '정보없음',
      uvIndex: null,
      visibility: null,
      weatherStatus: errorMessage ? '정보없음' : getOverallWeatherStatus(data),
      weatherAdvice: errorMessage ? '정보를 확인할 수 없습니다' : getWeatherAdvice(data, region),
      hourlyData: errorMessage ? [] : hourlySampleData,
      message: `${baseMessage} (${['오늘', '내일', '모레'][index]})`,
      timestamp: new Date().toISOString(),
      region: region
    };
  });
}

// =====================================================================
// 데이터 검증 함수
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

// =====================================================================
// 사전 캐싱
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
      const now = new Date();
      const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const { baseDate, baseTime } = calculateBaseDateTime(kst);

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
          version: '2.0-complete-final'
        },
        weatherCodes: WEATHER_CODES
      };

      weatherCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      logger.info(`사전 캐싱 완료: '${regionName}'`);
      cleanupCache(); // 캐시 정리

    } catch (error) {
      logger.error(`사전 캐싱 중 오류 발생: '${regionName}'`, error);
    }
  }
}

// =====================================================================
// 환경 변수 검증
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

async function handleWeatherRequest(req, res) {
  metrics.apiCalls++;
  const requestInfo = { url: req.url, query: req.query, headers: req.headers };
  const endResponseTimer = performanceLogger.startTimer('전체 날씨 응답 처리');

  try {
    let latitude, longitude, regionName;
    const { lat, lon, region, detailed = 'true', minimal = 'false' } = req.query;

    // 입력 파라미터 검증 및 지역/좌표 결정
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
          data: generateCompleteSampleData(regionName, '기본 지역 정보 로드 실패'),
          error: '기본 지역 정보를 로드할 수 없어 날씨 정보를 제공할 수 없습니다.',
          code: 'LOCATION_DATA_UNAVAILABLE'
        });
      }
      latitude = defaultLocation.lat;
      longitude = defaultLocation.lon;
      logger.warn(`위경도/지역명 없음: 기본 지역(${regionName}) 사용`);
    }

    // 환경 변수 검증
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
    let currentRegionKey;

    if (regionName) {
      currentRegionKey = regionName;
    } else {
      const matchedLocation = findMatchingLocation({ lat: latitude, lon: longitude });
      currentRegionKey = matchedLocation ? matchedLocation.name : 'UNKNOWN_REGION';
    }
    metrics.addRegionalRequest(currentRegionKey);

    // 지역명 또는 위경도에 따른 실제 조회 위치 결정
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

    // 소넷4의 정확한 base_time 계산 사용
    const { baseDate, baseTime } = calculateBaseDateTime(kst);

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

      endResponseTimer();
      return res.status(200).json(responseData);
    }

    metrics.cacheMisses++;

    logger.info('🌤️ 기상청 API 호출 시작 (정확한 base_time)', {
      baseDate,
      baseTime,
      nx: coordinates.nx,
      ny: coordinates.ny,
      location: locationInfo.fullName
    });

    const endApiCallTimer = performanceLogger.startTimer('기상청 API 호출');
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
        'User-Agent': 'HealingK-Complete-Weather-Service/2.0-Final'
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

    logger.info('✅ 최종 완성된 날씨 데이터 처리 완료', {
      days: weatherData.length,
      improvements: 'TMN/TMX 우선처리, 정확한 체감온도, 강수량 범위값 처리, 안정적 에러 처리'
    });

    let responseData = {
      success: true,
      data: weatherData,
      locationInfo: locationInfo,
      apiInfo: {
        source: '기상청 단기예보 API',
        note: '기상청 단기예보 API 기준입니다. 소넷4의 정확성과 제미나이의 안정성을 결합한 최종 완성본입니다.',
        baseDate: baseDate,
        baseTime: baseTime,
        timestamp: new Date().toISOString(),
        apiKeyUsed: 'WEATHER_API_KEY',
        totalCategories: Object.keys(WEATHER_CODES).length,
        dataPoints: items.length,
        version: '2.0-complete-final',
        improvements: [
          '정확한 base_time 계산 (분 단위 체크)',
          'TMN/TMX 우선 처리',
          '기상청 공식 체감온도 계산',
          '강수량/적설량 범위값 처리',
          '안정적인 캐싱 시스템',
          '포괄적인 에러 처리',
          '성능 모니터링 및 Rate Limiting'
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

    cleanupCache(); // 캐시 정리

    logger.info('🎉 최종 완성된 날씨 API 응답 성공');
    endResponseTimer();
    return res.status(200).json(responseData);

  } catch (error) {
    logger.error(`최종 완성된 날씨 API 오류: ${error.message}`, error, requestInfo);
    endResponseTimer();

    if (error instanceof WeatherAPIError) {
      return res.status(error.statusCode).json({
        success: false,
        data: generateCompleteSampleData(req.query.region || WEATHER_CONFIG.DEFAULTS.REGION, error.message),
        error: error.message,
        code: error.code
      });
    }

    return res.status(500).json({
      success: false,
      data: generateCompleteSampleData(req.query.region || WEATHER_CONFIG.DEFAULTS.REGION, '서버 내부 오류'),
      error: '서버 내부 오류가 발생했습니다.',
      code: 'UNKNOWN_SERVER_ERROR'
    });
  }
}

// =====================================================================
// 메인 서버리스 핸들러 (최종 완성본)
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

  // Rate Limiting 적용 (프로덕션 환경에서만)
  const clientIp = req.headers['x-forwarded-for']?.split(',').shift() || req.connection?.remoteAddress || '';
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
          data: generateCompleteSampleData(req.query.region || WEATHER_CONFIG.DEFAULTS.REGION, error.message)
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
      version: '2.0-complete-final',
      description: '소넷4의 정확성과 제미나이의 안정성을 결합한 최종 완성본',
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
        '안정적인 캐싱 시스템',
        '포괄적인 에러 처리',
        '성능 모니터링 및 Rate Limiting',
        '자동 캐시 정리 스케줄러',
        '상세한 풍속 설명',
        '제주 지역 특성 반영'
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


