/**
 * 보안 모듈 - 최소한의 보안 기능
 */

const { CONFIG } = require('./config');

/**
 * 간단한 입력값 새니타이즈
 */
function sanitizeInput(input, maxLength = CONFIG.MAX_INPUT_LENGTH) {
  if (typeof input !== 'string') return input;
  
  // 길이 제한
  let sanitized = input.substring(0, maxLength);
  
  // 기본 HTML 이스케이프
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // 위험한 패턴 제거
  sanitized = sanitized.replace(/<script|javascript:|onerror=|onload=/gi, '');
  
  return sanitized.trim();
}

/**
 * API 키 검증
 */
function validateApiKey(headers) {
  // 설정된 API 키가 없으면 검증 스킵
  if (CONFIG.ALLOWED_API_KEYS.length === 0) {
    return { valid: true, reason: 'no_keys_configured' };
  }
  
  const apiKey = headers[CONFIG.API_KEY_HEADER.toLowerCase()] || 
                 headers['x-api-key'] || 
                 headers['authorization'];
  
  if (!apiKey) {
    return { 
      valid: false, 
      reason: 'missing_api_key',
      message: `API key is required. Please provide it in the '${CONFIG.API_KEY_HEADER}' header.`
    };
  }
  
  if (!CONFIG.ALLOWED_API_KEYS.includes(apiKey)) {
    return { 
      valid: false, 
      reason: 'unauthorized_api_key',
      message: 'Unauthorized API key.'
    };
  }
  
  return { valid: true, reason: 'authorized' };
}

/**
 * Origin 검증
 */
function validateOrigin(headers) {
  const origin = headers.origin || headers.referer;
  
  if (!origin) {
    return { 
      valid: true, 
      reason: 'no_origin',
      allowedOrigin: '*'
    };
  }
  
  try {
    const url = new URL(origin);
    const domain = url.hostname + (url.port ? `:${url.port}` : '');
    
    const isAllowed = CONFIG.ALLOWED_DOMAINS.some(allowedDomain => {
      if (allowedDomain.startsWith('*.')) {
        const baseDomain = allowedDomain.substring(2);
        return domain.endsWith(`.${baseDomain}`) || domain === baseDomain;
      }
      return domain === allowedDomain;
    });
    
    if (!isAllowed) {
      return {
        valid: false,
        reason: 'unauthorized_origin',
        message: `Origin '${domain}' is not allowed.`,
        origin: domain
      };
    }
    
    return {
      valid: true,
      reason: 'authorized_origin',
      allowedOrigin: origin,
      domain
    };
  } catch (error) {
    return {
      valid: false,
      reason: 'invalid_origin_format',
      message: 'Invalid origin format.',
      origin
    };
  }
}

/**
 * CORS 헤더 생성
 */
function generateCorsHeaders(originValidation) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': `Content-Type, Authorization, ${CONFIG.API_KEY_HEADER}`,
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };
  
  if (originValidation.valid && originValidation.allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = originValidation.allowedOrigin;
  } else {
    headers['Access-Control-Allow-Origin'] = 'null';
  }
  
  return headers;
}

/**
 * 파라미터 검증 및 새니타이즈
 */
function validateAndSanitizeParams(params) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * 숫자 파싱 헬퍼
 */
function safeParseInt(value, defaultValue = NaN) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

function safeParseFloat(value, defaultValue = NaN) {
  const num = parseFloat(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
}

module.exports = {
  sanitizeInput,
  validateApiKey,
  validateOrigin,
  generateCorsHeaders,
  validateAndSanitizeParams,
  safeParseInt,
  safeParseFloat
};
