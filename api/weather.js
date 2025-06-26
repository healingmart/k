
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
    ).map(loc => ({
      ...loc,
      key: loc.name,
      priority: loc.priority_score
    }));
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
    Object.assign(locationModule, loaded);
  } else {
    throw new Error('locationData.js가 유효한 객체를 내보내지 않았습니다.');
  }
} catch (error) {
  logger.error('locationData.js를 로드하는 데 실패했습니다. 지역 검색 및 좌표 변환 기능이 제한됩니다.', error);
}

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
    '3': '구름많음',
    '4': '흐림'
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
    '7': '눈날림'
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
    '1mm 미만': '0.5mm',
    '1.0mm': '1mm',
    '5.0mm': '5mm',
    '10.0mm': '10mm',
    '20.0mm': '20mm',
    '30.0mm': '30mm',
    '50.0mm': '50mm',
    '70.0mm': '70mm'
  },
  
  // 적설량 (SNO) - 세부 단계
  SNO: {
    '적설없음': '0cm',
    '1cm 미만': '0.5cm',
    '1.0cm': '1cm',
    '5.0cm': '5cm',
    '10.0cm': '10cm',
    '20.0cm': '20cm'
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

// ===================================================================== 
// 기상청 API base_time 계산 완전 재작성
/**
 * 기상청 단기예보 API의 base_time을 정확하게 계산합니다.
 * 단기예보는 매일 02:10, 05:10, 08:10, 11:10, 14:10, 17:10, 20:10, 23:10에 생성됩니다.
 * @param {Date} kst - 한국 표준시 Date 객체
 * @returns {{baseDate: string, baseTime: string}} 기상청 API base_date와 base_time
 */
const calculateBaseDateTime = (kst) => {
  const hour = kst.getHours();
  const minute = kst.getMinutes();
  
  // 발표 시간표 (실제 API 생성 시간은 10분 후)
  const baseTimes = [
    { hour: 2, minute: 10, baseTime: '0200' },
    { hour: 5, minute: 10, baseTime: '0500' },
    { hour: 8, minute: 10, baseTime: '0800' },
    { hour: 11, minute: 10, baseTime: '1100' },
    { hour: 14, minute: 10, baseTime: '1400' },
    { hour: 17, minute: 10, baseTime: '1700' },
    { hour: 20, minute: 10, baseTime: '2000' },
    { hour: 23, minute: 10, baseTime: '2300' }
  ];
  
  let baseTime = '2300';
  let baseDate = new Date(kst);
  
  // 현재 시간보다 이전의 가장 최근 발표 시간 찾기
  for (let i = baseTimes.length - 1; i >= 0; i--) {
    const bt = baseTimes[i];
    if (hour > bt.hour || (hour === bt.hour && minute >= bt.minute)) {
      baseTime = bt.baseTime;
      break;
    }
  }
  
  // 02:10 이전이면 전날 23:00 기준
  if (hour < 2 || (hour === 2 && minute < 10)) {
    baseDate.setDate(baseDate.getDate() - 1);
    baseTime = '2300';
  }
  
  const baseDateStr = baseDate.toISOString().slice(0, 10).replace(/-/g, '');
  
  logger.info('기상청 API 기준 시간 계산', {
    currentKST: kst.toISOString(),
    currentHour: hour,
    currentMinute: minute,
    baseDate: baseDateStr,
    baseTime: baseTime
  });
  
  return { baseDate: baseDateStr, baseTime };
};
// =====================================================================

/**
 * 기상청 API 응답 데이터를 가공하여 3일간의 완전한 날씨 정보 반환
 * @param {Array<WeatherForecastItem>} items - 기상청 API에서 반환된 날씨 데이터 항목 배열
 * @param {Date} kst - 한국 표준시 Date 객체 (현재 시각 기준)
 * @param {string} locationFullName - 요청된 지역의 전체 이름 (예: '제주특별자치시 서귀포시 성산읍')
 * @returns {Array<DailyWeatherData>} 가공된 3일간의 날씨 데이터 배열
 */
function processCompleteWeatherData(items, kst, locationFullName) {
  const forecasts = {};
  
  // 디버깅: 받은 데이터 샘플 로깅
  logger.info('기상청 원시 데이터 샘플', {
    totalItems: items.length,
    sample: items.slice(0, 10).map(item => ({
      date: item.fcstDate,
      time: item.fcstTime,
      category: item.category,
      value: item.fcstValue
    }))
  });
  
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
  const forecastDateObj = new Date(
    parseInt(date.substring(0, 4)), 
    parseInt(date.substring(4, 6)) - 1, 
    parseInt(date.substring(6, 8))
  );
  
  const timeKeys = Object.keys(times).sort();
  let bestRepresentativeTime = null;
  
  // 오늘 날짜인 경우: 현재 시간 이후의 가장 가까운 예보
  // 미래 날짜인 경우: 낮 시간대(11시 또는 14시) 우선 선택
  if (forecastDateObj.toDateString() === kst.toDateString()) {
    // 오늘: 현재 시간 이후 가장 가까운 예보
    const currentHour = kst.getHours();
    const currentMinute = kst.getMinutes();
    
    for (const timeStr of timeKeys) {
      const fcstHour = parseInt(timeStr.substring(0, 2), 10);
      const fcstMinute = parseInt(timeStr.substring(2, 4), 10);
      
      if (fcstHour > currentHour || 
          (fcstHour === currentHour && fcstMinute >= currentMinute)) {
        bestRepresentativeTime = timeStr;
        break;
      }
    }
    
    // 오늘의 모든 예보가 지났으면 마지막 예보 사용
    if (!bestRepresentativeTime && timeKeys.length > 0) {
      bestRepresentativeTime = timeKeys[timeKeys.length - 1];
    }
  } else {
    // 내일/모레: 낮 시간대 우선 (14시 > 11시 > 12시 순)
    const preferredTimes = ['1400', '1100', '1200', '1500', '1300'];
    for (const preferred of preferredTimes) {
      if (timeKeys.includes(preferred)) {
        bestRepresentativeTime = preferred;
        break;
      }
    }
    
    // 선호 시간이 없으면 첫 번째 시간
    if (!bestRepresentativeTime && timeKeys.length > 0) {
      bestRepresentativeTime = timeKeys[0];
    }
  }
  
  // 데이터가 아예 없는 경우를 대비한 폴백
  if (!bestRepresentativeTime && timeKeys.length === 0) {
    logger.warn(`[WARN] 날씨 데이터를 찾을 수 없어 대표 시간을 설정할 수 없습니다. 날짜: ${date}`);
    return createEmptyWeatherData(date);
  }
  
  const data = bestRepresentativeTime ? times[bestRepresentativeTime] : {};
  
  // 일별 최저/최고 기온 및 최대 강수확률 추출 (시간별 데이터에서 재집계)
  let minTemp = Infinity;
  let maxTemp = -Infinity;
  let maxPop = 0;
  
  timeKeys.forEach(timeKey => {
    const hourData = times[timeKey];
    if (hourData.TMN) { // 일 최저기온
      const temp = parseFloat(hourData.TMN);
      if (temp < minTemp) minTemp = temp;
    }
    if (hourData.TMX) { // 일 최고기온
      const temp = parseFloat(hourData.TMX);
      if (temp > maxTemp) maxTemp = temp;
    }
    if (hourData.TMP) { // 시간별 기온도 체크
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
  
  // 강수 정보 처리 개선
  const precipitationCode = data.PTY || '0';
  const precipitationProbability = data.POP ? parseInt(data.POP) : 0;
  const precipitationAmount = data.PCP || '강수없음';
  const snowAmount = data.SNO || '적설없음';
  
  // 강수형태가 있으면 강수확률과 상관없이 강수로 표시
  let actualPrecipitation = getPrecipitationDescription(precipitationCode);
  let actualPrecipitationDescription = WEATHER_CODES.PTY[precipitationCode] || '없음';
  
  // PTY가 0이어도 강수확률이 높으면 강수 가능성 표시
  if (precipitationCode === '0' && precipitationProbability >= 60) {
    actualPrecipitation = '강수 가능';
    actualPrecipitationDescription = `강수확률 ${precipitationProbability}%`;
  }
  
  // 완전한 날씨 정보 생성
  return {
    date: date,
    dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    representativeTime: bestRepresentativeTime,
    
    // 기온 정보 (완전)
    temperature: currentTemperature ? Math.round(currentTemperature) : null,
    temperatureMin: minTemp ? Math.round(minTemp) : null,
    temperatureMax: maxTemp ? Math.round(maxTemp) : null,
    temperatureUnit: '°C',
    temperatureDescription: getTemperatureDescription(currentTemperature),
    sensoryTemperature: sensoryTemp,
    sensoryTemperatureDescription: sensoryTemp !== null ? getTemperatureDescription(sensoryTemp) : '정보없음',
    temperatureCompareYesterday: null,
    
    // 하늘 상태 (완전)
    sky: getSkyDescription(data.SKY),
    skyCode: data.SKY,
    skyDescription: WEATHER_CODES.SKY[data.SKY] || '정보없음',
    
    // 강수 정보 (완전)
    precipitation: actualPrecipitation,
    precipitationCode: precipitationCode,
    precipitationDescription: actualPrecipitationDescription,
    precipitationProbability: precipitationProbability,
    precipitationProbabilityMax: Math.round(maxPop),
    precipitationProbabilityDescription: WEATHER_CODES.POP[String(precipitationProbability)] || `${precipitationProbability}%`,
    precipitationAmount: processPrecipitationAmount(precipitationAmount),
    precipitationAmountDescription: getDetailedPrecipitationDescription(precipitationAmount),
    
    // 적설 정보 (완전)
    snowAmount: processSnowAmount(snowAmount),
    snowAmountDescription: getDetailedSnowDescription(snowAmount),
    
    // 습도 정보 (완전)
    humidity: currentHumidity,
    humidityUnit: '%',
    humidityDescription: getHumidityDescription(currentHumidity),
    
    // 풍속/풍향 정보 (완전)
    windSpeed: currentWindSpeed ? currentWindSpeed.toFixed(1) : null,
    windSpeedUnit: 'm/s',
    windSpeedDescription: getWindSpeedDescription(currentWindSpeed, locationFullName.includes('제주')),
    windSpeedRange: currentWindSpeed ? `${Math.max(0, currentWindSpeed - 1).toFixed(1)}~${(currentWindSpeed + 2).toFixed(1)}m/s` : null,
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
    weatherAdvice: getWeatherAdvice(data, locationFullName),
    
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
        sensoryTemperature: hourlySensoryTemp,
        sky: WEATHER_CODES.SKY[hourData.SKY] || '정보없음',
        precipitation: WEATHER_CODES.PTY[hourData.PTY] || '없음',
        precipitationProbability: hourData.POP ? parseInt(hourData.POP) : 0,
        precipitationAmount: processPrecipitationAmount(hourData.PCP),
        snowAmount: processSnowAmount(hourData.SNO),
        humidity: hourlyHumidity,
        windSpeed: hourlyWindSpeed ? hourlyWindSpeed.toFixed(1) : null,
        windSpeedRange: hourlyWindSpeed ? `${Math.max(0, hourlyWindSpeed - 1).toFixed(1)}~${(hourlyWindSpeed + 2).toFixed(1)}m/s` : null,
      };
    }).sort((a, b) => a.time.localeCompare(b.time))
  };
}

// 빈 날씨 데이터 생성 함수
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
 * 기온, 습도, 풍속을 기반으로 체감온도를 계산합니다. (개선된 공식 적용)
 * @param {number|null} temperature - 실제 기온 (°C)
 * @param {number|null} humidity - 상대 습도 (%)
 * @param {number|null} windSpeed - 풍속 (m/s)
 * @returns {string|null} 계산된 체감온도 (소수점 첫째 자리) 또는 null
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
    // 더위 체감 (온열 지수 단순화)
    feelsLike = T + (RH / 100) * (T - 20) * 0.25;
  } else if (T <= 10) {
    // 추위 체감 (윈드칠 지수 단순화)
    feelsLike = T - (WS * 1.2) - 1.5;
  } else {
    // 쾌적 범위
    feelsLike = T;
    feelsLike += (RH - 50) * 0.04;
    feelsLike -= (WS * 0.3);
  }
  
  // 극단적인 값 방지
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
  if (pcp === '1mm 미만') return '0.5mm';
  
  // 숫자값 추출 및 처리
  const numMatch = pcp.match(/(\d+\.?\d*)/);
  if (numMatch) {
    const value = parseFloat(numMatch[1]);
    if (value >= 30) {
      return `${value}mm 이상`;
    }
    return `${value}mm`;
  }
  
  return pcp;
}

// 강수량 상세 설명
function getDetailedPrecipitationDescription(pcp) {
  if (!pcp || pcp === '강수없음') return '강수 없음';
  if (pcp === '1mm 미만') return '매우 약한 비 (1mm 미만)';
  
  const numMatch = pcp.match(/(\d+\.?\d*)/);
  if (numMatch) {
    const value = parseFloat(numMatch[1]);
    if (value < 3) return `약한 비 (${value}mm)`;
    if (value < 15) return `보통 비 (${value}mm)`;
    if (value < 30) return `강한 비 (${value}mm)`;
    return `매우 강한 비 (${value}mm 이상)`;
  }
  
  return pcp;
}

// **적설량 값 처리 및 설명 반환**
function processSnowAmount(sno) {
  if (!sno || sno === '적설없음' || sno === '0') return '0cm';
  if (sno === '1cm 미만') return '0.5cm';
  
  const numMatch = sno.match(/(\d+\.?\d*)/);
  if (numMatch) {
    const value = parseFloat(numMatch[1]);
    return `${value}cm`;
  }
  
  return sno;
}

// 적설량 상세 설명
function getDetailedSnowDescription(sno) {
  if (!sno || sno === '적설없음') return '적설 없음';
  if (sno === '1cm 미만') return '매우 약한 눈 (1cm 미만)';
  
  const numMatch = sno.match(/(\d+\.?\d*)/);
  if (numMatch) {
    const value = parseFloat(numMatch[1]);
    if (value < 3) return `약한 눈 (${value}cm)`;
    if (value < 10) return `보통 눈 (${value}cm)`;
    if (value < 20) return `많은 눈 (${value}cm)`;
    return `폭설 (${value}cm 이상)`;
  }
  
  return sno;
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
    return `${desc} (변동 가능)`;
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
  
  // 강수형태가 있으면 우선
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

// URL pathname을 안전하게 추출하는 헬퍼 함수
function getPathname(req) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    return url.pathname;
  } catch (error) {
    logger.warn('URL 파싱 중 오류 발생, Fallback 경로 사용:', { message: error.message });
    return req.url.split('?')[0];
  }
}

// 2. 재시도 로직 구현 & 7. 타임아웃 처리 개선 (AbortController 사용)
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

// 5. 데이터 검증 함수 활용 (기존에 정의되어 있었으나 호출 추가)
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
  
  // 강수 데이터 일관성 검증
  if (data.precipitationCode === '0' && data.precipitationProbability > 30) {
    logger.info(`강수형태 없음인데 강수확률이 ${data.precipitationProbability}% - 정상적일 수 있음`);
  }
  
  if (data.precipitationCode !== '0' && data.precipitationAmount === '0mm') {
    logger.warn(`강수형태 ${data.precipitation}인데 강수량이 0mm`);
  }
  
  if (errors.length > 0) {
    logger.warn('날씨 데이터 검증 경고', { 
      errors, 
      date: data.date,
      time: data.representativeTime 
    });
  }
  
  return errors.length === 0;
}

// 지역 검색 API 핸들러
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

// 날씨 정보 요청 API 핸들러
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
    
    if (!weatherApiKey || !validateEnvironment().isValid) {
      const validationResult = validateEnvironment();
      const errorMessage = !weatherApiKey 
        ? 'WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.' 
        : `필수 환경 변수 누락: ${validationResult.missing.join(', ')}.`;
      
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
        numOfRows: 1000, // 3일치 전체 데이터
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
    
    // API 응답 데이터 검증
    if (items.length < 100) {
      logger.warn('기상청 API 응답 데이터가 예상보다 적습니다', { 
        count: items.length,
        expected: '최소 100개 이상'
      });
    }
    
    const weatherData = processCompleteWeatherData(items, kst, actualLocationFullName);
    
    logger.info('✅ 완전한 날씨 데이터 처리 완료', { days: weatherData.length });
    
    let responseData = {
      success: true,
      data: weatherData,
      locationInfo: locationInfo,
      apiInfo: {
        source: '기상청 단기예보 API',
        note: '기상청 단기예보 API 기준입니다. 실시간 관측값과 차이가 있을 수 있으며, ' +
              '어제와의 비교 정보는 현재 API에서 제공하지 않습니다.',
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

// 필수 환경 변수가 설정되었는지 검증
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
    global.weatherServiceInitialized = true;
  }
  
  // 보안 헤더 추가
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
  
  // Rate Limiting 적용
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
