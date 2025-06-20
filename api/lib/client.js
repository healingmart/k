/*
 * 관광 API 클라이언트
 */

const { CONFIG, API_ERROR_CODES } = require('./config');
const { sanitizeInput, safeParseFloat, safeParseInt } = require('./security');

// 간단한 메모리 캐시
const cache = new Map();

/**
 * 캐시 정리
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, data] of cache.entries()) {
    if (now > data.expiry) {
      cache.delete(key);
    }
  }
  
  if (cache.size > CONFIG.MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    cache.delete(entries[0][0]);
  }
}

/**
 * API 에러 클래스
 */
class ApiError extends Error {
  constructor(message, code = 'API_ERROR', statusCode = 500, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: false,
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * 관광 API 클라이언트
 */
class TourismApiClient {
  constructor() {
    // 환경변수에서 API 키 가져오기
    this.apiKey = process.env.TOURISM_API_KEY;
    
    if (!this.apiKey) {
      throw new ApiError(
        'TOURISM_API_KEY 환경변수가 설정되지 않았습니다.',
        'MISSING_API_KEY',
        500
      );
    }
    
    this.baseURL = CONFIG.API_BASE_URL;
  }

  /**
   * 기본 파라미터
   */
  buildBaseParams(params = {}) {
    return {
      serviceKey: this.apiKey,
      MobileOS: 'ETC',
      MobileApp: 'TourismAPI',
      _type: 'json',
      ...params
    };
  }

  /**
   * 캐시 키 생성
   */
  generateCacheKey(operation, params) {
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    return `${operation}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * API 요청 실행
   */
  async makeRequest(endpoint, params = {}, operation = 'unknown') {
    const fullParams = this.buildBaseParams(params);
    const cacheKey = this.generateCacheKey(operation, fullParams);
    
    // 캐시 확인
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    // 캐시 정리
    if (cache.size > CONFIG.MAX_CACHE_SIZE) {
      cleanupCache();
    }
    
    // URL 생성
    const queryString = new URLSearchParams(fullParams).toString();
    const url = `${this.baseURL}${endpoint}?${queryString}`;
    
    console.log(`[${operation}] Request URL:`, url);
    
    try {
      // API 호출
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new ApiError(
          `API 호출 실패: ${response.status} ${response.statusText}`,
          'HTTP_ERROR',
          response.status
        );
      }
      
      const data = await response.json();
      
      console.log(`[${operation}] Response:`, data);
      
      // API 응답 검증
      if (data.response?.header?.resultCode !== '0000') {
        const resultCode = data.response?.header?.resultCode || '99';
        const errorCode = API_ERROR_CODES[resultCode] || 'API_ERROR';
        throw new ApiError(
          data.response?.header?.resultMsg || '알 수 없는 오류',
          errorCode,
          400,
          {
            resultCode,
            resultMsg: data.response?.header?.resultMsg
          }
        );
      }
      
      // 성공 응답 처리
      const result = data.response?.body || data;
      
      // 캐시 저장
      cache.set(cacheKey, {
        data: result,
        expiry: Date.now() + CONFIG.CACHE_TTL,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError('API 요청 시간 초과', 'TIMEOUT', 504);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        `네트워크 오류: ${error.message}`,
        'NETWORK_ERROR',
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * 지역 기반 관광정보 조회
   */
  async areaBasedList(params = {}) {
    const validatedParams = {
      numOfRows: safeParseInt(params.numOfRows, 10),
      pageNo: safeParseInt(params.pageNo, 1),
      ...params
    };
    
    return this.makeRequest('/areaBasedList2', validatedParams, 'areaBasedList');
  }

  /**
   * 상세 정보 조회 (공통정보)
   */
  async detailCommon(params = {}) {
    if (!params.contentId) {
      throw new ApiError('contentId는 필수 파라미터입니다.', 'VALIDATION_ERROR', 400);
    }
    
    const validatedParams = {
      contentId: String(params.contentId),
      // contentTypeId 제거됨 - API에서 거부함
      defaultYN: 'Y',
      firstImageYN: 'Y',
      areacodeYN: 'Y',
      catcodeYN: 'Y',
      addrinfoYN: 'Y',
      mapinfoYN: 'Y',
      overviewYN: 'Y'
    };
    
    return this.makeRequest('/detailCommon2', validatedParams, 'detailCommon');
  }

  /**
   * 소개 정보 조회 (타입별 상세 정보)
   */
  async detailIntro(params = {}) {
    if (!params.contentId || !params.contentTypeId) {
      throw new ApiError('contentId와 contentTypeId는 필수 파라미터입니다.', 'VALIDATION_ERROR', 400);
    }
    
    const validatedParams = {
      contentId: String(params.contentId),
      contentTypeId: String(params.contentTypeId),
      numOfRows: 10,
      pageNo: 1
    };
    
    console.log('[detailIntro] Validated params:', validatedParams);
    
    return this.makeRequest('/detailIntro2', validatedParams, 'detailIntro');
  }

  /**
   * 키워드 검색
   */
  async searchKeyword(params = {}) {
    if (!params.keyword) {
      throw new ApiError('keyword는 필수 파라미터입니다.', 'VALIDATION_ERROR', 400);
    }
    
    const validatedParams = {
      numOfRows: safeParseInt(params.numOfRows, 10),
      pageNo: safeParseInt(params.pageNo, 1),
      keyword: sanitizeInput(params.keyword, 100),
      ...params
    };
    
    return this.makeRequest('/searchKeyword2', validatedParams, 'searchKeyword');
  }

  /**
   * 위치 기반 관광정보 조회
   */
  async locationBasedList(params = {}) {
    if (!params.mapX || !params.mapY) {
      throw new ApiError('mapX와 mapY는 필수 파라미터입니다.', 'VALIDATION_ERROR', 400);
    }
    
    const lat = safeParseFloat(params.mapY);
    const lng = safeParseFloat(params.mapX);
    
    if (isNaN(lat) || isNaN(lng)) {
      throw new ApiError('유효하지 않은 좌표값입니다.', 'VALIDATION_ERROR', 400);
    }
    
    // 한국 좌표 범위 검증
    if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
      throw new ApiError(
        `좌표값이 한국 범위를 벗어났습니다. (위도: ${lat}, 경도: ${lng})`,
        'VALIDATION_ERROR',
        400
      );
    }
    
    const validatedParams = {
      numOfRows: safeParseInt(params.numOfRows, 10),
      pageNo: safeParseInt(params.pageNo, 1),
      mapX: lng,
      mapY: lat,
      radius: safeParseInt(params.radius, 1000),
      ...params
    };
    
    const result = await this.makeRequest('/locationBasedList2', validatedParams, 'locationBasedList');
    
    // 거리 정보 추가 (선택사항)
    if (params.addDistance === 'Y' && result.items?.item) {
      const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
      
      result.items.item = items.map(item => {
        const itemLat = safeParseFloat(item.mapy);
        const itemLng = safeParseFloat(item.mapx);
        
        if (!isNaN(itemLat) && !isNaN(itemLng)) {
          const distance = this.calculateDistance(lat, lng, itemLat, itemLng);
          return { ...item, distance };
        }
        
        return item;
      }).sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
    }
    
    return result;
  }

  /**
   * 거리 계산 (미터 단위)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a = 
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return Math.round(R * c);
  }
}

/**
 * Rate Limiter
 */
const rateLimitMap = new Map();

function checkRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMIT_WINDOW;
  
  const requests = rateLimitMap.get(identifier) || [];
  const validRequests = requests.filter(time => time > windowStart);
  
  if (validRequests.length >= CONFIG.RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(validRequests[0] + CONFIG.RATE_LIMIT_WINDOW).toISOString()
    };
  }
  
  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  
  // 메모리 정리
  if (rateLimitMap.size > 1000) {
    for (const [key, reqs] of rateLimitMap.entries()) {
      if (reqs.length === 0 || reqs[reqs.length - 1] < windowStart) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  return {
    allowed: true,
    remaining: CONFIG.RATE_LIMIT_MAX - validRequests.length
  };
}

module.exports = {
  TourismApiClient,
  ApiError,
  checkRateLimit
};




/**
 * 이미지 정보 조회 (detailImage API)
 */
async detailImage(params = {}) {
    if (!params.contentId) {
        throw new ApiError('contentId는 필수 파라미터입니다.', 'VALIDATION_ERROR', 400);
    }

    const validatedParams = {
        contentId: String(params.contentId),
        imageYN: 'Y',
        subImageYN: 'Y',
        numOfRows: safeParseInt(params.numOfRows, 10),
        pageNo: safeParseInt(params.pageNo, 1)
    };

    return this.makeRequest('/detailImage2', validatedParams, 'detailImage');
}

/**
 * 반복 정보 조회 (detailInfo API)
 */
async detailInfo(params = {}) {
    if (!params.contentId || !params.contentTypeId) {
        throw new ApiError('contentId와 contentTypeId는 필수 파라미터입니다.', 'VALIDATION_ERROR', 400);
    }

    const validatedParams = {
        contentId: String(params.contentId),
        contentTypeId: String(params.contentTypeId),
        numOfRows: safeParseInt(params.numOfRows, 10),
        pageNo: safeParseInt(params.pageNo, 1)
    };

    return this.makeRequest('/detailInfo2', validatedParams, 'detailInfo');
}

/**
 * 지역코드 조회 (areaCode API)
 */
async areaCode(params = {}) {
    const validatedParams = {
        numOfRows: safeParseInt(params.numOfRows, 100),
        pageNo: safeParseInt(params.pageNo, 1),
        ...params
    };

    return this.makeRequest('/areaCode2', validatedParams, 'areaCode');
}

/**
 * 서비스분류코드 조회 (categoryCode API)
 */
async categoryCode(params = {}) {
    const validatedParams = {
        numOfRows: safeParseInt(params.numOfRows, 100),
        pageNo: safeParseInt(params.pageNo, 1),
        ...params
    };

    return this.makeRequest('/categoryCode2', validatedParams, 'categoryCode');
}




