/**
 * 관광 API 서버리스 함수 - 메인 엔트리포인트
 * Vercel 배포용 핸들러
 */

// 환경변수 디버깅 (배포 후 제거)
console.log('Tourism API Handler - Environment Check:', {
  TOURISM_API_KEY: process.env.TOURISM_API_KEY ? 'EXISTS' : 'NOT EXISTS',
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  ENV_KEYS: Object.keys(process.env).filter(k => k.includes('TOURISM') || k.includes('API')).join(', ')
});

const { CONFIG, SUPPORTED_OPERATIONS } = require('./lib/config');
const { 
  validateApiKey, 
  validateOrigin, 
  generateCorsHeaders, 
  validateAndSanitizeParams 
} = require('./lib/security');
const { TourismApiClient, ApiError, checkRateLimit } = require('./lib/client');

// 전역 API 클라이언트 (재사용)
let apiClient = null;

/**
 * Vercel 서버리스 함수 핸들러
 */
module.exports = async function handler(req, res) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    // 1. Origin 검증 및 CORS 헤더 설정
    const originValidation = validateOrigin(req.headers);
    const corsHeaders = generateCorsHeaders(originValidation);
    
    // CORS 헤더 설정
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      if (!originValidation.valid) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN_ORIGIN',
            message: originValidation.message || 'Origin not allowed',
            timestamp: new Date().toISOString()
          }
        });
      }
      return res.status(200).end();
    }
    
    // 2. API 키 검증 (ALLOWED_API_KEYS가 설정된 경우만)
    const apiKeyValidation = validateApiKey(req.headers);
    if (!apiKeyValidation.valid && apiKeyValidation.reason !== 'no_keys_configured') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: apiKeyValidation.message,
          reason: apiKeyValidation.reason,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // 3. Rate Limit 확인
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                    req.connection?.remoteAddress || 
                    'unknown';
    const rateLimit = checkRateLimit(clientIp);
    
    if (!rateLimit.allowed) {
      res.setHeader('X-RateLimit-Limit', CONFIG.RATE_LIMIT_MAX);
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', rateLimit.resetTime);
      
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '요청 한도를 초과했습니다.',
          timestamp: new Date().toISOString(),
          retryAfter: new Date(rateLimit.resetTime).getTime() - Date.now()
        }
      });
    }
    
    // Rate Limit 헤더 설정
    res.setHeader('X-RateLimit-Limit', CONFIG.RATE_LIMIT_MAX);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    
    // 4. 요청 파싱
    let operation, params;
    
    if (req.method === 'GET') {
      const { operation: op, ...rest } = req.query || {};
      operation = op;
      params = rest;
    } else if (req.method === 'POST') {
      const body = req.body || {};
      operation = body.operation;
      params = body.params || body;
      delete params.operation;
    } else {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: '허용되지 않은 HTTP 메소드입니다.',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // 5. Operation 검증
    if (!operation || !SUPPORTED_OPERATIONS.includes(operation)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: `지원하지 않는 작업입니다: '${operation}'. 지원 작업: ${SUPPORTED_OPERATIONS.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // 6. 파라미터 검증 및 새니타이즈
    const sanitizedParams = validateAndSanitizeParams(params);
    
    // 7. API 클라이언트 초기화
    if (!apiClient) {
      console.log('Initializing API client...');
      apiClient = new TourismApiClient();
    }
    
    // 8. API 호출
    const result = await apiClient[operation](sanitizedParams);
    
    // 9. 성공 응답
    const responseTime = Date.now() - startTime;
    
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('Content-Type', 'application/json');
    
    // 기존 코드와 동일한 응답 형식
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      operation,
      data: result,
      metadata: {
        version: '1.0.0',
        responseTime
      }
    });
    
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    
    // 에러 응답
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('Content-Type', 'application/json');
    
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    
    // 예상치 못한 에러
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다.',
        details: {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }
};

/**
 * 사용 예시:
 * 
 * GET 요청:
 * /api/tourism?operation=searchKeyword&keyword=서울&numOfRows=10
 * /api/tourism?operation=areaBasedList&areaCode=1&numOfRows=20
 * /api/tourism?operation=detailCommon&contentId=12345
 * /api/tourism?operation=locationBasedList&mapX=126.9&mapY=37.5&radius=1000
 * 
 * POST 요청:
 * Body: {
 *   "operation": "searchKeyword",
 *   "keyword": "서울",
 *   "numOfRows": 10
 * }
 */
