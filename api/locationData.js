/**
 * @file locationData.js
 * @description 제주특별자치도 내 모든 읍·면·동 단위의 행정 지역 데이터를 포함하는 파일.
 * weather.js에서 require 방식으로 임포트될 수 있도록 CommonJS 형식으로 작성되었습니다.
 */

/**
 * 위경도를 기상청 격자 좌표로 변환
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {{nx: number, ny: number}} 격자 좌표
 */
const latLonToGrid = (lat, lon) => {
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

    let ro = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + olat * 0.5), sn);
    let ra = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5), sn);
    
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    return {
        nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
        ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)
    };
};

/**
 * 제주도 지역 데이터
 */
const locationData = (() => {
    const data = {};

    // 우선순위 점수 매핑
    const priorityMap = {
        '제주특별자치도': 1000,
        '제주시': 950,
        '서귀포시': 930,
        
        // 제주시 주요 지역
        '연동': 900,
        '노형동': 890,
        '아라동': 880,
        '이도2동': 870,
        '일도2동': 860,
        '삼양동': 850,
        '화북동': 840,
        '애월읍': 820,
        '한림읍': 810,
        '구좌읍': 800,
        '조천읍': 790,
        
        // 서귀포시 주요 지역
        '중문동': 900,
        '동홍동': 890,
        '서홍동': 880,
        '성산읍': 820,
        '대정읍': 810,
        '남원읍': 800
    };

    /**
     * 지역 데이터 추가 헬퍼 함수
     */
    const addLocation = (key, locationObj) => {
        const { lat, lon } = locationObj;
        const { nx, ny } = latLonToGrid(lat, lon);
        
        data[key] = {
            ...locationObj,
            kma_nx: nx,
            kma_ny: ny,
            priority_score: priorityMap[key] || 500
        };

        // 별칭 처리
        (locationObj.aliases || []).forEach(alias => {
            if (!data[alias]) {
                data[alias] = data[key];
            }
        });
    };

    // ===== 제주특별자치도 =====
    addLocation('제주특별자치도', {
        lat: 33.4996,
        lon: 126.5312,
        name: '제주특별자치도',
        type: '광역자치단체',
        aliases: ['제주', '제주도']
    });

    // ===== 제주시 =====
    addLocation('제주시', {
        lat: 33.4996,
        lon: 126.5312,
        name: '제주특별자치도 제주시',
        type: '기초자치단체',
        admin_parent: '제주특별자치도'
    });

    // 제주시 행정동
    addLocation('일도1동', {
        lat: 33.5130,
        lon: 126.5270,
        name: '제주특별자치도 제주시 일도1동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('일도2동', {
        lat: 33.5100,
        lon: 126.5300,
        name: '제주특별자치도 제주시 일도2동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('이도1동', {
        lat: 33.5070,
        lon: 126.5200,
        name: '제주특별자치도 제주시 이도1동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('이도2동', {
        lat: 33.5050,
        lon: 126.5250,
        name: '제주특별자치도 제주시 이도2동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('삼도1동', {
        lat: 33.5100,
        lon: 126.5150,
        name: '제주특별자치도 제주시 삼도1동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('삼도2동', {
        lat: 33.5080,
        lon: 126.5100,
        name: '제주특별자치도 제주시 삼도2동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('건입동', {
        lat: 33.5150,
        lon: 126.5350,
        name: '제주특별자치도 제주시 건입동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('화북동', {
        lat: 33.5200,
        lon: 126.5700,
        name: '제주특별자치도 제주시 화북동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('삼양동', {
        lat: 33.5250,
        lon: 126.6000,
        name: '제주특별자치도 제주시 삼양동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('봉개동', {
        lat: 33.4600,
        lon: 126.6200,
        name: '제주특별자치도 제주시 봉개동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('아라동', {
        lat: 33.4650,
        lon: 126.5500,
        name: '제주특별자치도 제주시 아라동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('오라동', {
        lat: 33.4700,
        lon: 126.5000,
        name: '제주특별자치도 제주시 오라동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('연동', {
        lat: 33.4900,
        lon: 126.4900,
        name: '제주특별자치도 제주시 연동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('노형동', {
        lat: 33.4850,
        lon: 126.4700,
        name: '제주특별자치도 제주시 노형동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('외도동', {
        lat: 33.5050,
        lon: 126.4500,
        name: '제주특별자치도 제주시 외도동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('이호동', {
        lat: 33.5150,
        lon: 126.4700,
        name: '제주특별자치도 제주시 이호동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    addLocation('도두동', {
        lat: 33.5200,
        lon: 126.4300,
        name: '제주특별자치도 제주시 도두동',
        type: '행정동',
        admin_parent: '제주특별자치도 제주시'
    });

    // 제주시 읍면
    addLocation('애월읍', {
        lat: 33.4600,
        lon: 126.3300,
        name: '제주특별자치도 제주시 애월읍',
        type: '읍',
        admin_parent: '제주특별자치도 제주시',
        aliases: ['애월']
    });

    addLocation('한림읍', {
        lat: 33.4100,
        lon: 126.2600,
        name: '제주특별자치도 제주시 한림읍',
        type: '읍',
        admin_parent: '제주특별자치도 제주시',
        aliases: ['한림']
    });

    addLocation('구좌읍', {
        lat: 33.5100,
        lon: 126.7500,
        name: '제주특별자치도 제주시 구좌읍',
        type: '읍',
        admin_parent: '제주특별자치도 제주시',
        aliases: ['구좌']
    });

    addLocation('조천읍', {
        lat: 33.5300,
        lon: 126.6600,
        name: '제주특별자치도 제주시 조천읍',
        type: '읍',
        admin_parent: '제주특별자치도 제주시',
        aliases: ['조천']
    });

    addLocation('한경면', {
        lat: 33.3200,
        lon: 126.1700,
        name: '제주특별자치도 제주시 한경면',
        type: '면',
        admin_parent: '제주특별자치도 제주시',
        aliases: ['한경']
    });

    addLocation('추자면', {
        lat: 33.9500,
        lon: 126.3200,
        name: '제주특별자치도 제주시 추자면',
        type: '면',
        admin_parent: '제주특별자치도 제주시',
        aliases: ['추자', '추자도']
    });

    addLocation('우도면', {
        lat: 33.5130,
        lon: 126.9460,
        name: '제주특별자치도 제주시 우도면',
        type: '면',
        admin_parent: '제주특별자치도 제주시',
        aliases: ['우도']
    });

    // ===== 서귀포시 =====
    addLocation('서귀포시', {
        lat: 33.2541,
        lon: 126.5601,
        name: '제주특별자치도 서귀포시',
        type: '기초자치단체',
        admin_parent: '제주특별자치도',
        aliases: ['서귀포']
    });

    // 서귀포시 행정동
    addLocation('정방동', {
        lat: 33.2500,
        lon: 126.5650,
        name: '제주특별자치도 서귀포시 정방동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('중앙동', {
        lat: 33.2450,
        lon: 126.5580,
        name: '제주특별자치도 서귀포시 중앙동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('천지동', {
        lat: 33.2530,
        lon: 126.5600,
        name: '제주특별자치도 서귀포시 천지동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('효돈동', {
        lat: 33.2800,
        lon: 126.6100,
        name: '제주특별자치도 서귀포시 효돈동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('영천동', {
        lat: 33.2850,
        lon: 126.5800,
        name: '제주특별자치도 서귀포시 영천동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('동홍동', {
        lat: 33.2700,
        lon: 126.5600,
        name: '제주특별자치도 서귀포시 동홍동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('서홍동', {
        lat: 33.2600,
        lon: 126.5400,
        name: '제주특별자치도 서귀포시 서홍동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('대륜동', {
        lat: 33.2400,
        lon: 126.5300,
        name: '제주특별자치도 서귀포시 대륜동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('대천동', {
        lat: 33.2500,
        lon: 126.5100,
        name: '제주특별자치도 서귀포시 대천동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    addLocation('중문동', {
        lat: 33.2500,
        lon: 126.4300,
        name: '제주특별자치도 서귀포시 중문동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시',
        aliases: ['중문']
    });

    addLocation('예래동', {
        lat: 33.2400,
        lon: 126.3700,
        name: '제주특별자치도 서귀포시 예래동',
        type: '행정동',
        admin_parent: '제주특별자치도 서귀포시'
    });

    // 서귀포시 읍면
    addLocation('대정읍', {
        lat: 33.2100,
        lon: 126.2600,
        name: '제주특별자치도 서귀포시 대정읍',
        type: '읍',
        admin_parent: '제주특별자치도 서귀포시',
        aliases: ['대정']
    });

    addLocation('남원읍', {
        lat: 33.2800,
        lon: 126.7300,
        name: '제주특별자치도 서귀포시 남원읍',
        type: '읍',
        admin_parent: '제주특별자치도 서귀포시',
        aliases: ['남원']
    });

    addLocation('성산읍', {
        lat: 33.3800,
        lon: 126.8900,
        name: '제주특별자치도 서귀포시 성산읍',
        type: '읍',
        admin_parent: '제주특별자치도 서귀포시',
        aliases: ['성산', '성산일출봉']
    });

    addLocation('안덕면', {
        lat: 33.2500,
        lon: 126.3100,
        name: '제주특별자치도 서귀포시 안덕면',
        type: '면',
        admin_parent: '제주특별자치도 서귀포시',
        aliases: ['안덕']
    });

    addLocation('표선면', {
        lat: 33.3000,
        lon: 126.8300,
        name: '제주특별자치도 서귀포시 표선면',
        type: '면',
        admin_parent: '제주특별자치도 서귀포시',
        aliases: ['표선']
    });

    return data;
})();

/**
 * 지역 검색 함수
 */
function searchLocations(query, page = 1, pageSize = 10) {
    const normalizedQuery = query.trim().toLowerCase();
    const results = [];
    
    for (const [key, location] of Object.entries(locationData)) {
        const keyLower = key.toLowerCase();
        const nameLower = location.name.toLowerCase();
        
        if (keyLower.includes(normalizedQuery) || nameLower.includes(normalizedQuery)) {
            results.push({
                ...location,
                key
            });
        }
    }
    
    // 우선순위로 정렬
    results.sort((a, b) => b.priority_score - a.priority_score);
    
    // 페이지네이션
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return {
        results: results.slice(start, end),
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(results.length / pageSize),
            totalResults: results.length
        }
    };
}

/**
 * 가장 가까운 위치 찾기
 */
function findMatchingLocation(coords) {
    let minDistance = Infinity;
    let closest = null;
    
    for (const [key, location] of Object.entries(locationData)) {
        const distance = Math.sqrt(
            Math.pow(location.lat - coords.lat, 2) + 
            Math.pow(location.lon - coords.lon, 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            closest = { ...location, key };
        }
    }
    
    return closest;
}

/**
 * 모든 매칭 찾기
 */
function findAllMatches(query) {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = [];
    
    for (const [key, location] of Object.entries(locationData)) {
        const keyLower = key.toLowerCase();
        const nameLower = location.name.toLowerCase();
        
        if (keyLower.includes(normalizedQuery) || nameLower.includes(normalizedQuery)) {
            matches.push({
                ...location,
                key
            });
        }
    }
    
    return matches.sort((a, b) => b.priority_score - a.priority_score);
}

// CommonJS exports
module.exports = {
    locationData,
    searchLocations,
    findMatchingLocation,
    findAllMatches,
    latLonToGrid
};
