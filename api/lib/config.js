/**
 * 관광 API 설정 파일
 * 모든 설정값을 한 곳에서 관리
 */

const CONFIG = {
  // API 기본 설정
  API_BASE_URL: 'https://apis.data.go.kr/B551011/KorService2',
  API_KEY: process.env.TOURISM_API_KEY || '',
  
  // 보안 설정
  ALLOWED_API_KEYS: (process.env.ALLOWED_API_KEYS || '').split(',').filter(Boolean),
  ALLOWED_DOMAINS: [
    'localhost',
    'localhost:3000',
    'localhost:8080',
    'localhost:5173',
    'healingk.com',
    'www.healingk.com',
    'tistory100.com',
    'www.tistory100.com',
    'jejugil.com',
    'www.jejugil.com',
    'healing-mart.com',
    'www.healing-mart.com',
    'ggeori.com',
    'www.ggeori.com',
    '*.vercel.app',
    '*.scf.usercontent.goog',
    'preview.app.goo.gl'
  ],
  API_KEY_HEADER: 'X-API-Key',
  
  // 요청 제한
  MAX_INPUT_LENGTH: 1000,
  REQUEST_TIMEOUT: 30000,
  
  // 캐시 설정
  CACHE_TTL: 300000, // 5분
  MAX_CACHE_SIZE: 100,
  
  // Rate Limit
  RATE_LIMIT_WINDOW: 60000, // 1분
  RATE_LIMIT_MAX: 100,
};

// API 오류 코드 매핑
const API_ERROR_CODES = {
  '00': 'NORMAL_CODE',
  '01': 'APPLICATION_ERROR',
  '02': 'DB_ERROR',
  '03': 'NODATA_ERROR',
  '04': 'HTTP_ERROR',
  '05': 'SERVICETIMEOUT_ERROR',
  '10': 'INVALID_REQUEST_PARAMETER_ERROR',
  '11': 'NO_MANDATORY_REQUEST_PARAMETERS_ERROR',
  '12': 'NO_OPENAPI_SERVICE_ERROR',
  '20': 'SERVICE_ACCESS_DENIED_ERROR',
  '21': 'TEMPORARILY_DISABLE_THE_SERVICEKEY_ERROR',
  '22': 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR',
  '30': 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
  '31': 'DEADLINE_HAS_EXPIRED_ERROR',
  '32': 'UNREGISTERED_IP_ERROR',
  '33': 'UNSIGNED_CALL_ERROR',
  '99': 'UNKNOWN_ERROR'
};

// 지원하는 API 작업 목록
const SUPPORTED_OPERATIONS = [
  'areaBasedList',
  'detailCommon',
  'detailIntro',  // 추가!
  'searchKeyword',
  'locationBasedList'
];

module.exports = {
  CONFIG,
  API_ERROR_CODES,
  SUPPORTED_OPERATIONS
};
