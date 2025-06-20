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

        const contentType = response.headers.get('content-type') || '';
        let data;

        // XML 응답 처리
        if (contentType.includes('xml') || contentType.includes('text/xml')) {
            const xmlText = await response.text();
            console.log(`[${operation}] XML Response:`, xmlText.substring(0, 200) + '...');
            data = this.parseXmlResponse(xmlText);
        } 
        // JSON 응답 처리
        else {
            data = await response.json();
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
        // 간단한 XML 파싱 (DOMParser 사용)
        if (typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            return this.xmlToJson(xmlDoc);
        } else {
            // Node.js 환경에서는 xml2js 같은 라이브러리 필요
            // 임시로 정규식 사용
            return this.parseXmlWithRegex(xmlText);
        }
    } catch (error) {
        console.error('XML 파싱 오류:', error);
        throw new ApiError('XML 응답 파싱 실패', 'PARSE_ERROR', 500);
    }
}

/**
 * 정규식을 사용한 간단한 XML 파싱
 */
parseXmlWithRegex(xmlText) {
    const result = { response: { header: {}, body: { items: { item: [] } } } };
    
    // resultCode 추출
    const resultCodeMatch = xmlText.match(/<resultCode>([^<]+)<\/resultCode>/);
    if (resultCodeMatch) {
        result.response.header.resultCode = resultCodeMatch[1];
    }
    
    // resultMsg 추출
    const resultMsgMatch = xmlText.match(/<resultMsg>([^<]+)<\/resultMsg>/);
    if (resultMsgMatch) {
        result.response.header.resultMsg = resultMsgMatch[1];
    }
    
    // totalCount 추출
    const totalCountMatch = xmlText.match(/<totalCount>([^<]+)<\/totalCount>/);
    if (totalCountMatch) {
        result.response.body.totalCount = parseInt(totalCountMatch[1]);
    }
       // items 추출 (복잡하므로 기본 구조만)
    const itemsMatch = xmlText.match(/<items>(.*?)<\/items>/s);
    if (itemsMatch) {
        // item들을 개별적으로 파싱
        const itemMatches = itemsMatch[1].match(/<item>(.*?)<\/item>/gs);
        if (itemMatches) {
            result.response.body.items.item = itemMatches.map(itemXml => {
                const item = {};
                
                // 각 필드 추출 - 관광 API 주요 필드들
                const fields = [
                    'contentid', 'contenttypeid', 'title', 'addr1', 'addr2',
                    'zipcode', 'tel', 'homepage', 'firstimage', 'firstimage2',
                    'mapx', 'mapy', 'mlevel', 'overview', 'modifiedtime',
                    'createdtime', 'booktour', 'dist', 'areacode', 'sigungucode',
                    'cat1', 'cat2', 'cat3'
                ];
                
                fields.forEach(field => {
                    const regex = new RegExp(`<${field}>(.*?)<\/${field}>`, 's');
                    const match = itemXml.match(regex);
                    if (match) {
                        item[field] = match[1].trim();
                    }
                });
                
                // CDATA 처리 (특히 overview, homepage 등)
                Object.keys(item).forEach(key => {
                    if (item[key] && item[key].includes('<![CDATA[')) {
                        item[key] = item[key]
                            .replace('<![CDATA[', '')
                            .replace(']]>', '')
                            .trim();
                    }
                });
                
                return item;
            });
        }
    }
    
    return result;
}

/**
 * DOMParser를 사용한 XML to JSON 변환 (브라우저용)
 */
xmlToJson(xml) {
    const result = { response: { header: {}, body: {} } };
    
    try {
        // resultCode
        const resultCode = xml.querySelector('resultCode');
        if (resultCode) {
            result.response.header.resultCode = resultCode.textContent;
        }
        
        // resultMsg
        const resultMsg = xml.querySelector('resultMsg');
        if (resultMsg) {
            result.response.header.resultMsg = resultMsg.textContent;
        }
        
        // totalCount
        const totalCount = xml.querySelector('totalCount');
        if (totalCount) {
            result.response.body.totalCount = parseInt(totalCount.textContent);
        }
        
        // numOfRows
        const numOfRows = xml.querySelector('numOfRows');
        if (numOfRows) {
            result.response.body.numOfRows = parseInt(numOfRows.textContent);
        }
        
        // pageNo
        const pageNo = xml.querySelector('pageNo');
        if (pageNo) {
            result.response.body.pageNo = parseInt(pageNo.textContent);
        }
        
        // items
        const items = xml.querySelectorAll('item');
        if (items.length > 0) {
            result.response.body.items = { item: [] };
            
            items.forEach(item => {
                const itemObj = {};
                
                // item의 모든 자식 요소들을 추출
                const children = item.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    const tagName = child.tagName.toLowerCase();
                    let value = child.textContent || child.innerHTML;
                    
                    // CDATA 처리
                    if (value.includes('<![CDATA[')) {
                        value = value
                            .replace('<![CDATA[', '')
                            .replace(']]>', '')
                            .trim();
                    }
                    
                    // 숫자 필드 처리
                    if (['contentid', 'contenttypeid', 'areacode', 'sigungucode', 'mapx', 'mapy', 'mlevel'].includes(tagName)) {
                        const numValue = parseFloat(value);
                        itemObj[tagName] = isNaN(numValue) ? value : numValue;
                    } else {
                        itemObj[tagName] = value;
                    }
                }
                
                result.response.body.items.item.push(itemObj);
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('DOMParser XML 변환 오류:', error);
        // 정규식 방식으로 폴백
        return this.parseXmlWithRegex(xml.toString());
    }
}

/**
 * Node.js 환경에서 XML 파싱 (서버사이드)
 */
parseXmlServerSide(xmlText) {
    // xml2js 라이브러리가 설치되어 있다면 사용
    if (typeof require !== 'undefined') {
        try {
            const xml2js = require('xml2js');
            return new Promise((resolve, reject) => {
                xml2js.parseString(xmlText, { 
                    explicitArray: false,
                    ignoreAttrs: true,
                    trim: true 
                }, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } catch (e) {
            // xml2js가 없으면 정규식 방식 사용
            return this.parseXmlWithRegex(xmlText);
        }
    }
    
    // 기본적으로 정규식 방식 사용
    return this.parseXmlWithRegex(xmlText);
}
