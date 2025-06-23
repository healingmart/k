/** 
 * 관광 API 클라이언트 (매뉴얼 기반 수정버전) 
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
     * API 요청 실행 (XML/JSON 자동 처리)
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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

            const response = await fetch(url, { 
                method: 'GET', 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json, application/xml, text/xml, */*'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new ApiError(
                    `API 호출 실패: ${response.status} ${response.statusText}`,
                    'HTTP_ERROR',
                    response.status
                );
            }

            const responseText = await response.text();
            console.log(`[${operation}] Raw Response:`, responseText.substring(0, 200) + '...');

            let data;

            // XML 응답인지 확인
            if (responseText.trim().startsWith('<')) {
                console.log(`[${operation}] XML 응답 감지, 파싱 중...`);
                data = this.parseXmlResponse(responseText);
            } else {
                // JSON 파싱 시도
                try {
                    data = JSON.parse(responseText);
                } catch (jsonError) {
                    console.error('JSON 파싱 실패:', jsonError);
                    throw new ApiError('응답 데이터 파싱 실패', 'PARSE_ERROR', 500);
                }
            }

            console.log(`[${operation}] Parsed Response:`, data);

            // API 응답 검증
            let resultCode, resultMsg, responseBody;

            if (data.response?.header) {
                resultCode = data.response.header.resultCode;
                resultMsg = data.response.header.resultMsg;
                responseBody = data.response.body || {};
            } else if (data.resultCode !== undefined) {
                resultCode = data.resultCode;
                resultMsg = data.resultMsg;
                responseBody = data;
            } else {
                resultCode = '0000';
                responseBody = data;
            }

            if (resultCode !== '0000') {
                const errorCode = API_ERROR_CODES[resultCode] || 'API_ERROR';
                throw new ApiError(
                    resultMsg || '알 수 없는 오류',
                    errorCode,
                    400,
                    { resultCode, resultMsg }
                );
            }

            // 캐시 저장
            cache.set(cacheKey, {
                data: responseBody,
                expiry: Date.now() + CONFIG.CACHE_TTL,
                timestamp: Date.now()
            });

            return responseBody;

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
     * XML 응답을 JSON으로 변환
     */
    parseXmlResponse(xmlText) {
        try {
            const result = { response: { header: {}, body: { items: { item: [] } } } };
            
            // resultCode 추출
            const resultCodeMatch = xmlText.match(/<resultCode>([^<]*)<\/resultCode>/);
            if (resultCodeMatch) {
                result.response.header.resultCode = resultCodeMatch[1];
            }
            
            // resultMsg 추출
            const resultMsgMatch = xmlText.match(/<resultMsg>([^<]*)<\/resultMsg>/);
            if (resultMsgMatch) {
                result.response.header.resultMsg = resultMsgMatch[1];
            }
            
            // totalCount 추출
            const totalCountMatch = xmlText.match(/<totalCount>([^<]*)<\/totalCount>/);
            if (totalCountMatch) {
                result.response.body.totalCount = parseInt(totalCountMatch[1]) || 0;
            }

            // numOfRows 추출
            const numOfRowsMatch = xmlText.match(/<numOfRows>([^<]*)<\/numOfRows>/);
            if (numOfRowsMatch) {
                result.response.body.numOfRows = parseInt(numOfRowsMatch[1]) || 0;
            }

            // pageNo 추출
            const pageNoMatch = xmlText.match(/<pageNo>([^<]*)<\/pageNo>/);
            if (pageNoMatch) {
                result.response.body.pageNo = parseInt(pageNoMatch[1]) || 1;
            }
            
            // items 추출
            const itemsMatch = xmlText.match(/<items>(.*?)<\/items>/s);
            if (itemsMatch) {
                const itemMatches = itemsMatch[1].match(/<item>(.*?)<\/item>/gs);
                if (itemMatches) {
                    result.response.body.items.item = itemMatches.map(itemXml => {
                        const item = {};
                        
                        // 주요 필드들 추출
                    const fields = [
    'contentid', 'contenttypeid', 'title', 'addr1', 'addr2', 'zipcode', 
    'tel', 'telname', 'homepage', 'firstimage', 'firstimage2', 
    'mapx', 'mapy', 'mlevel', 'overview', 'modifiedtime', 'createdtime', 
    'booktour', 'dist', 'areacode', 'sigungucode', 'cat1', 'cat2', 'cat3',
    'readcount', 'eventstartdate', 'eventenddate', 'cpyrhtDivCd'
];
                        
                        fields.forEach(field => {
                            const regex = new RegExp(`<${field}>(.*?)<\/${field}>`, 's');
                            const match = itemXml.match(regex);
                            if (match) {
                                let value = match[1].trim();
                                
                                // CDATA 처리
                                if (value.includes('<![CDATA[')) {
                                    value = value
                                        .replace('<![CDATA[', '')
                                        .replace(']]>', '')
                                        .trim();
                                }
                                
                                // 숫자 필드 변환
                                if (['contentid', 'contenttypeid', 'areacode', 'sigungucode', 'mapx', 'mapy', 'mlevel'].includes(field)) {
                                    const numValue = parseFloat(value);
                                    item[field] = isNaN(numValue) ? value : numValue;
                                } else {
                                    item[field] = value;
                                }
                            }
                        });
                        
                        return item;
                    });
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('XML 파싱 오류:', error);
            throw new ApiError('XML 응답 파싱 실패', 'PARSE_ERROR', 500);
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
            numOfRows: 10,
            pageNo: 1
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

        return this.makeRequest('/detailIntro2', validatedParams, 'detailIntro');
    }

    /**
     * 이미지 정보 조회
     */
    async detailImage(params = {}) {
        if (!params.contentId) {
            throw new ApiError('contentId는 필수 파라미터입니다.', 'VALIDATION_ERROR', 400);
        }

        const validatedParams = {
            contentId: String(params.contentId),
            imageYN: 'Y',
            numOfRows: safeParseInt(params.numOfRows, 20),
            pageNo: safeParseInt(params.pageNo, 1)
        };

        return this.makeRequest('/detailImage2', validatedParams, 'detailImage');
    }

    /**
     * 반복 정보 조회
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
     * 지역코드 조회
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
     * 서비스분류코드 조회
     */
    async categoryCode(params = {}) {
        const validatedParams = {
            numOfRows: safeParseInt(params.numOfRows, 100),
            pageNo: safeParseInt(params.pageNo, 1),
            ...params
        };

        return this.makeRequest('/categoryCode2', validatedParams, 'categoryCode');
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
            radius: safeParseInt(params.radius, 1000)
        };

        // 선택적 파라미터들
        if (params.contentTypeId) validatedParams.contentTypeId = params.contentTypeId;
        if (params.areaCode) validatedParams.areaCode = params.areaCode;
        if (params.sigunguCode) validatedParams.sigunguCode = params.sigunguCode;
        if (params.cat1) validatedParams.cat1 = params.cat1;
        if (params.cat2) validatedParams.cat2 = params.cat2;
        if (params.cat3) validatedParams.cat3 = params.cat3;

        const result = await this.makeRequest('/locationBasedList2', validatedParams, 'locationBasedList');

        // 거리 정보 처리
        if (result.items?.item) {
            const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];
            result.items.item = items.map(item => {
                if (item.dist && !item.distance) {
                    return { ...item, distance: parseFloat(item.dist) };
                }
                return item;
            });
        }

        return result;
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
