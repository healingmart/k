/**
 * @file locationData.js
 * @description 전국의 행정 구역 및 주요 지역 데이터를 관리하는 모듈.
 *              데이터 구조를 최적화하여 검색 정확도와 효율성을 높였습니다.
 *              행정동/읍/면을 기본 단위로 하며, 법정동/리 및 별칭 검색을 지원합니다.
 * @version 2.0 (Optimized & Integrated)
 * @last-modified 2025-06-26
 */

/**
 * 위경도를 기상청 격자 좌표로 변환하는 함수.
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {{nx: number, ny: number}} 격자 좌표 객체
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

    const ra = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5), sn);
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
 * 전국의 지역 정보를 담는 최종 데이터 객체.
 * 즉시 실행 함수(IIFE)를 통해 초기화되며, 데이터 무결성과 검색 효율성을 보장합니다.
 */
const locationModule = (() => {
    const locationData = {}; // Key: 고유 식별자 (e.g., '서울특별시_종로구_청운효자동'), Value: 지역 정보 객체
    const searchIndex = {};  // Key: 검색어 (e.g., '청운효자동'), Value: 고유 식별자 배열

    const priorityMap = {
        '광역자치단체': 1000,
        '기초자치단체': 900,
        '행정동': 800, '읍': 800, '면': 800,
        '법정동': 700, '리': 700,
        '별칭': 600,
        // 특정 지역에 대한 가중치
        '서울특별시': 1050, '제주특별자치도': 1050, '부산광역시': 1020,
        '강남구': 950, '해운대구': 950, '제주시': 950, '서귀포시': 950,
        '강남역': 850, '홍대': 850, '성산일출봉': 850,
    };
    
    /**
     * 검색 인덱스에 키워드와 고유 ID를 추가하는 헬퍼 함수.
     * @param {string} keyword - 인덱싱할 검색어
     * @param {string} uniqueId - 지역 데이터의 고유 식별자
     */
    const addToIndex = (keyword, uniqueId) => {
        const normalizedKey = keyword.toLowerCase().replace(/\s+/g, '');
        if (!normalizedKey) return;
        if (!searchIndex[normalizedKey]) {
            searchIndex[normalizedKey] = [];
        }
        if (!searchIndex[normalizedKey].includes(uniqueId)) {
            searchIndex[normalizedKey].push(uniqueId);
        }
    };

    /**
     * 지역 데이터를 추가하고 검색 인덱스를 구축하는 메인 함수.
     * @param {Object} loc - 추가할 지역의 상세 정보
     */
    const addLocation = (loc) => {
        const { name, lat, lon, type, admin_parent, legal_divisions = [], aliases = [] } = loc;
        const uniqueId = name.replace(/\s+/g, '_');

        if (locationData[uniqueId]) return;

        const { nx, ny } = latLonToGrid(lat, lon);
        const shortName = name.split(' ').pop();
        const basePriority = priorityMap[type] || 750;
        const namePriority = priorityMap[shortName] || 0;
        
        locationData[uniqueId] = {
            ...loc,
            key: uniqueId,
            kma_nx: nx,
            kma_ny: ny,
            priority_score: basePriority + namePriority
        };

        addToIndex(name, uniqueId);
        if(shortName && shortName !== name) addToIndex(shortName, uniqueId);
        aliases.forEach(alias => addToIndex(alias, uniqueId));
        legal_divisions.forEach(legal => addToIndex(legal, uniqueId));
    };

    // ============================================================= //
    // 데이터 정의 (locationData (2).js의 모든 데이터 통합)
    // ============================================================= //
    
    // 서울특별시
    addLocation({ name: '서울특별시', lat: 37.5665, lon: 126.9780, type: '광역자치단체', aliases: ['서울', '서울시'] });
    addLocation({ name: '서울특별시 종로구', lat: 37.5735, lon: 126.9788, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['종로구'] });
    addLocation({ name: '서울특별시 종로구 청운효자동', lat: 37.5852, lon: 126.9691, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['청운동', '효자동', '궁정동', '신교동', '창성동', '통인동', '누하동', '옥인동', '필운동', '내자동'] });
    addLocation({ name: '서울특별시 종로구 사직동', lat: 37.5746, lon: 126.9702, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['사직동', '내수동', '도렴동', '당주동', '신문로1가', '신문로2가', '세종로'] });
    addLocation({ name: '서울특별시 종로구 삼청동', lat: 37.5898, lon: 126.9806, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['삼청동', '팔판동', '안국동', '화동'] });
    addLocation({ name: '서울특별시 종로구 평창동', lat: 37.6080, lon: 126.9670, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['평창동'] });
    addLocation({ name: '서울특별시 종로구 가회동', lat: 37.5830, lon: 126.9890, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['가회동', '재동', '계동', '원서동'] });
    addLocation({ name: '서울특별시 종로구 종로1.2.3.4가동', lat: 37.5710, lon: 126.9910, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['종로1가', '종로2가', '종로3가', '종로4가', '인사동', '관철동', '관수동', '견지동', '공평동', '와룡동', '운니동', '익선동', '돈화문로'] });
    addLocation({ name: '서울특별시 종로구 혜화동', lat: 37.5810, lon: 127.0000, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['혜화동', '명륜1가', '명륜2가', '동숭동'] });
    addLocation({ name: '서울특별시 종로구 창신1동', lat: 37.5780, lon: 127.0100, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['창신동'] });
    addLocation({ name: '서울특별시 종로구 숭인1동', lat: 37.5750, lon: 127.0200, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['숭인동'] });
    addLocation({ name: '서울특별시 종로구 종로1가', lat: 37.5700, lon: 126.9790, type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['종각','종로'] });
    addLocation({ name: '서울특별시 종로구 세종로', lat: 37.5776, lon: 126.9769, type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['경복궁'] });
    addLocation({ name: '서울특별시 중구', lat: 37.5630, lon: 126.9970, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['중구'] });
    addLocation({ name: '서울특별시 중구 소공동', lat: 37.5630, lon: 126.9800, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['소공동', '북창동', '태평로2가'] });
    addLocation({ name: '서울특별시 중구 명동', lat: 37.5610, lon: 126.9860, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['명동1가', '명동2가', '남산동1가', '남산동2가', '남산동3가', '충무로1가', '충무로2가', '저동1가', '저동2가', '예관동'], aliases: ['명동성당'] });
    addLocation({ name: '서울특별시 중구 을지로동', lat: 37.5650, lon: 126.9910, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['을지로1가', '을지로2가', '을지로3가', '을지로4가', '을지로5가', '을지로6가', '을지로7가', '수하동', '장교동', '삼각동', '입정동', '산림동', '주교동'] });
    addLocation({ name: '서울특별시 중구 필동', lat: 37.5600, lon: 127.0000, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['필동1가', '필동2가', '필동3가', '묵정동', '장충동1가', '장충동2가', '광희동1가', '광희동2가'] });
    addLocation({ name: '서울특별시 중구 장충동', lat: 37.5580, lon: 127.0090, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['장충동1가', '장충동2가', '묵정동'] });
    addLocation({ name: '서울특별시 중구 신당5동', lat: 37.5680, lon: 127.0180, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['신당동'] });
    addLocation({ name: '서울특별시 중구 황학동', lat: 37.5710, lon: 127.0150, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['황학동'] });
    addLocation({ name: '서울특별시 중구 중림동', lat: 37.5590, lon: 126.9670, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['중림동'] });
    addLocation({ name: '서울특별시 중구 회현동', lat: 37.5580, lon: 126.9770, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['회현동1가', '회현동2가', '회현동3가', '남산동1가', '남산동2가', '남산동3가', '충무로1가'] });
    addLocation({ name: '서울특별시 용산구 용산동2가', lat: 37.5512, lon: 126.9880, type: '별칭', admin_parent: '서울특별시 용산구', aliases: ['남산타워', 'N서울타워'] });
    addLocation({ name: '서울특별시 중구 남대문로4가', lat: 37.5590, lon: 126.9770, type: '별칭', admin_parent: '서울특별시 중구', aliases: ['남대문시장'] });
    addLocation({ name: '서울특별시 종로구 예지동', lat: 37.5709, lon: 127.0006, type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['광장시장'] });
    addLocation({ name: '서울특별시 용산구', lat: 37.5326, lon: 126.9905, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['용산구'] });
    addLocation({ name: '서울특별시 용산구 후암동', lat: 37.5450, lon: 126.9740, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['후암동'] });
    addLocation({ name: '서울특별시 용산구 용산2가동', lat: 37.5380, lon: 126.9830, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['용산동2가'] });
    addLocation({ name: '서울특별시 용산구 남영동', lat: 37.5410, lon: 126.9700, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['남영동', '갈월동'] });
    addLocation({ name: '서울특별시 용산구 원효로2동', lat: 37.5350, lon: 126.9600, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['원효로2가', '원효로3가'] });
    addLocation({ name: '서울특별시 용산구 이촌1동', lat: 37.5220, lon: 126.9700, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['이촌동'] });
    addLocation({ name: '서울특별시 용산구 이태원1동', lat: 37.5345, lon: 126.9934, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['이태원동', '한남동'], aliases: ['이태원'] });
    addLocation({ name: '서울특별시 용산구 한남동', lat: 37.5370, lon: 127.0090, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['한남동'] });
    addLocation({ name: '서울특별시 용산구 보광동', lat: 37.5310, lon: 127.0060, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['보광동'] });
    addLocation({ name: '서울특별시 용산구 청파동', lat: 37.5500, lon: 126.9690, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['청파동1가', '청파동2가', '청파동3가'] });
    addLocation({ name: '서울특별시 용산구 효창동', lat: 37.5400, lon: 126.9600, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['효창동'] });
    addLocation({ name: '서울특별시 용산구 서빙고동', lat: 37.5190, lon: 126.9820, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['서빙고동', '동빙고동'] });
    addLocation({ name: '서울특별시 용산구 용문동', lat: 37.5330, lon: 126.9580, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['용문동'] });
    addLocation({ name: '서울특별시 용산구 이촌동', lat: 37.5190, lon: 126.9740, type: '법정동', admin_parent: '서울특별시 용산구' });
    addLocation({ name: '서울특별시 성동구', lat: 37.5635, lon: 127.0365, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['성동구'] });
    addLocation({ name: '서울특별시 성동구 왕십리2동', lat: 37.5660, lon: 127.0290, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['하왕십리동'] });
    addLocation({ name: '서울특별시 성동구 마장동', lat: 37.5700, lon: 127.0430, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['마장동'] });
    addLocation({ name: '서울특별시 성동구 사근동', lat: 37.5600, lon: 127.0400, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['사근동'] });
    addLocation({ name: '서울특별시 성동구 행당1동', lat: 37.5580, lon: 127.0270, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['행당동'] });
    addLocation({ name: '서울특별시 성동구 응봉동', lat: 37.5460, lon: 127.0370, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['응봉동'] });
    addLocation({ name: '서울특별시 성동구 금호1가동', lat: 37.5500, lon: 127.0200, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['금호동1가'] });
    addLocation({ name: '서울특별시 성동구 성수1가1동', lat: 37.5460, lon: 127.0470, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['성수동1가'] });
    addLocation({ name: '서울특별시 성동구 옥수동', lat: 37.5520, lon: 127.0140, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['옥수동'] });
    addLocation({ name: '서울특별시 광진구', lat: 37.5384, lon: 127.0822, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['광진구'] });
    addLocation({ name: '서울특별시 광진구 화양동', lat: 37.5450, lon: 127.0690, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['화양동'] });
    addLocation({ name: '서울특별시 광진구 군자동', lat: 37.5500, lon: 127.0760, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['군자동'] });
    addLocation({ name: '서울특별시 광진구 중곡1동', lat: 37.5680, lon: 127.0850, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['중곡동'] });
    addLocation({ name: '서울특별시 광진구 능동', lat: 37.5550, lon: 127.0800, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['능동'] });
    addLocation({ name: '서울특별시 광진구 광장동', lat: 37.5520, lon: 127.1030, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['광장동'] });
    addLocation({ name: '서울특별시 광진구 구의1동', lat: 37.5370, lon: 127.0880, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['구의동'] });
    addLocation({ name: '서울특별시 광진구 자양1동', lat: 37.5320, lon: 127.0670, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['자양동'] });
    addLocation({ name: '서울특별시 동대문구', lat: 37.5744, lon: 127.0394, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['동대문구'] });
    addLocation({ name: '서울특별시 동대문구 용두동', lat: 37.5740, lon: 127.0270, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['용두동'] });
    addLocation({ name: '서울특별시 동대문구 제기동', lat: 37.5790, lon: 127.0350, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['제기동'] });
    addLocation({ name: '서울특별시 동대문구 전농1동', lat: 37.5850, lon: 127.0500, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['전농동'] });
    addLocation({ name: '서울특별시 동대문구 답십리1동', lat: 37.5700, lon: 127.0500, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['답십리동'] });
    addLocation({ name: '서울특별시 동대문구 장안1동', lat: 37.5700, lon: 127.0660, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['장안동'] });
    addLocation({ name: '서울특별시 동대문구 청량리동', lat: 37.5900, lon: 127.0480, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['청량리동'] });
    addLocation({ name: '서울특별시 동대문구 회기동', lat: 37.5940, lon: 127.0560, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['회기동'] });
    addLocation({ name: '서울특별시 동대문구 휘경1동', lat: 37.5960, lon: 127.0620, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['휘경동'] });
    addLocation({ name: '서울특별시 중랑구', lat: 37.6063, lon: 127.0925, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['중랑구'] });
    addLocation({ name: '서울특별시 중랑구 면목2동', lat: 37.5890, lon: 127.0880, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['면목동'] });
    addLocation({ name: '서울특별시 중랑구 상봉1동', lat: 37.5950, lon: 127.0870, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['상봉동'] });
    addLocation({ name: '서울특별시 중랑구 중화1동', lat: 37.6000, lon: 127.0810, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['중화동'] });
    addLocation({ name: '서울특별시 중랑구 묵1동', lat: 37.6180, lon: 127.0780, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['묵동'] });
    addLocation({ name: '서울특별시 중랑구 망우3동', lat: 37.6060, lon: 127.0970, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['망우동'] });
    addLocation({ name: '서울특별시 중랑구 신내1동', lat: 37.6180, lon: 127.0960, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['신내동'] });
    addLocation({ name: '서울특별시 성북구', lat: 37.5894, lon: 127.0167, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['성북구'] });
    addLocation({ name: '서울특별시 성북구 성북동', lat: 37.5950, lon: 127.0080, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['성북동'] });
    addLocation({ name: '서울특별시 성북구 삼선동', lat: 37.5850, lon: 127.0130, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['삼선동1가', '삼선동2가', '삼선동3가', '삼선동4가'] });
    addLocation({ name: '서울특별시 성북구 동선동', lat: 37.5880, lon: 127.0210, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['동선동1가', '동선동2가', '동선동3가', '동선동4가', '동선동5가'] });
    addLocation({ name: '서울특별시 성북구 돈암1동', lat: 37.5890, lon: 127.0170, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['돈암동'] });
    addLocation({ name: '서울특별시 성북구 안암동', lat: 37.5870, lon: 127.0300, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['안암동1가', '안암동2가', '안암동3가', '안암동4가', '안암동5가'] });
    addLocation({ name: '서울특별시 성북구 정릉1동', lat: 37.6000, lon: 127.0100, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['정릉동'] });
    addLocation({ name: '서울특별시 성북구 길음1동', lat: 37.6050, lon: 127.0240, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['길음동'] });
    addLocation({ name: '서울특별시 강북구', lat: 37.6397, lon: 127.0256, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['강북구'] });
    addLocation({ name: '서울특별시 강북구 미아동', lat: 37.6250, lon: 127.0250, type: '법정동', admin_parent: '서울특별시 강북구' });
    addLocation({ name: '서울특별시 강북구 수유1동', lat: 37.6380, lon: 127.0180, type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['수유동'] });
    addLocation({ name: '서울특별시 강북구 번1동', lat: 37.6300, lon: 127.0400, type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['번동'] });
    addLocation({ name: '서울특별시 강북구 삼각산동', lat: 37.6470, lon: 127.0080, type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['수유동', '우이동'] });
    addLocation({ name: '서울특별시 강북구 우이동', lat: 37.6600, lon: 127.0180, type: '법정동', admin_parent: '서울특별시 강북구' });
    addLocation({ name: '서울특별시 도봉구', lat: 37.6688, lon: 127.0471, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['도봉구'] });
    addLocation({ name: '서울특별시 도봉구 쌍문1동', lat: 37.6490, lon: 127.0340, type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['쌍문동'] });
    addLocation({ name: '서울특별시 도봉구 방학1동', lat: 37.6680, lon: 127.0380, type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['방학동'] });
    addLocation({ name: '서울특별시 도봉구 창2동', lat: 37.6480, lon: 127.0560, type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['창동'] });
    addLocation({ name: '서울특별시 도봉구 도봉1동', lat: 37.6850, lon: 127.0450, type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['도봉동'] });
    addLocation({ name: '서울특별시 노원구', lat: 37.6541, lon: 127.0568, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['노원구'] });
    addLocation({ name: '서울특별시 노원구 월계1동', lat: 37.6180, lon: 127.0570, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['월계동'] });
    addLocation({ name: '서울특별시 노원구 공릉1동', lat: 37.6260, lon: 127.0750, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['공릉동'] });
    addLocation({ name: '서울특별시 노원구 하계1동', lat: 37.6170, lon: 127.0710, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['하계동'] });
    addLocation({ name: '서울특별시 노원구 중계1동', lat: 37.6370, lon: 127.0700, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['중계동'] });
    addLocation({ name: '서울특별시 노원구 상계1동', lat: 37.6530, lon: 127.0600, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['상계동'] });
    addLocation({ name: '서울특별시 노원구 상계동', lat: 37.6800, lon: 127.0700, type: '별칭', admin_parent: '서울특별시 노원구', aliases: ['수락산'] });
    addLocation({ name: '서울특별시 은평구', lat: 37.6176, lon: 126.9227, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['은평구'] });
    addLocation({ name: '서울특별시 은평구 녹번동', lat: 37.6100, lon: 126.9360, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['녹번동'] });
    addLocation({ name: '서울특별시 은평구 불광1동', lat: 37.6150, lon: 126.9300, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['불광동'] });
    addLocation({ name: '서울특별시 은평구 갈현1동', lat: 37.6250, lon: 126.9050, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['갈현동'] });
    addLocation({ name: '서울특별시 은평구 구산동', lat: 37.6100, lon: 126.9050, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['구산동'] });
    addLocation({ name: '서울특별시 은평구 응암1동', lat: 37.5980, lon: 126.9240, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['응암동'] });
    addLocation({ name: '서울특별시 은평구 역촌동', lat: 37.6050, lon: 126.9120, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['역촌동'] });
    addLocation({ name: '서울특별시 은평구 진관동', lat: 37.6350, lon: 126.9250, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['진관동', '구파발동'] });
    addLocation({ name: '서울특별시 서대문구', lat: 37.5791, lon: 126.9368, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['서대문구'] });
    addLocation({ name: '서울특별시 서대문구 천연동', lat: 37.5720, lon: 126.9530, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['천연동', '옥천동', '영천동'] });
    addLocation({ name: '서울특별시 서대문구 홍제1동', lat: 37.5880, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['홍제동'] });
    addLocation({ name: '서울특별시 서대문구 연희동', lat: 37.5680, lon: 126.9370, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['연희동'] });
    addLocation({ name: '서울특별시 서대문구 북가좌1동', lat: 37.5850, lon: 126.9100, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['북가좌동'] });
    addLocation({ name: '서울특별시 서대문구 신촌동', lat: 37.5598, lon: 126.9423, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['신촌동', '창천동', '대현동', '봉원동'], aliases: ['신촌'] });
    addLocation({ name: '서울특별시 마포구', lat: 37.5615, lon: 126.9088, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['마포구'] });
    addLocation({ name: '서울특별시 마포구 공덕동', lat: 37.5450, lon: 126.9520, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['공덕동'] });
    addLocation({ name: '서울특별시 마포구 아현동', lat: 37.5580, lon: 126.9520, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['아현동'] });
    addLocation({ name: '서울특별시 마포구 도화동', lat: 37.5400, lon: 126.9490, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['도화동'] });
    addLocation({ name: '서울특별시 마포구 용강동', lat: 37.5350, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['용강동'] });
    addLocation({ name: '서울특별시 마포구 대흥동', lat: 37.5500, lon: 126.9420, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['대흥동'] });
    addLocation({ name: '서울특별시 마포구 염리동', lat: 37.5520, lon: 126.9490, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['염리동'] });
    addLocation({ name: '서울특별시 마포구 신수동', lat: 37.5480, lon: 126.9300, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['신수동'] });
    addLocation({ name: '서울특별시 마포구 서교동', lat: 37.5577, lon: 126.9248, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['서교동', '동교동', '합정동'], aliases: ['홍대', '홍대입구'] });
    addLocation({ name: '서울특별시 마포구 합정동', lat: 37.5490, lon: 126.9140, type: '법정동', admin_parent: '서울특별시 마포구' });
    addLocation({ name: '서울특별시 마포구 망원1동', lat: 37.5600, lon: 126.9030, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['망원동'] });
    addLocation({ name: '서울특별시 마포구 연남동', lat: 37.5610, lon: 126.9260, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['연남동'] });
    addLocation({ name: '서울특별시 마포구 상암동', lat: 37.5770, lon: 126.8900, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['상암동'] });
    addLocation({ name: '서울특별시 양천구', lat: 37.5173, lon: 126.8665, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['양천구'] });
    addLocation({ name: '서울특별시 양천구 목1동', lat: 37.5360, lon: 126.8780, type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['목동'] });
    addLocation({ name: '서울특별시 양천구 신월1동', lat: 37.5300, lon: 126.8370, type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['신월동'] });
    addLocation({ name: '서울특별시 양천구 신정1동', lat: 37.5180, lon: 126.8680, type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['신정동'] });
    addLocation({ name: '서울특별시 강서구', lat: 37.5509, lon: 126.8495, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['강서구'] });
    addLocation({ name: '서울특별시 강서구 염창동', lat: 37.5610, lon: 126.8770, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['염창동'] });
    addLocation({ name: '서울특별시 강서구 등촌1동', lat: 37.5600, lon: 126.8570, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['등촌동'] });
    addLocation({ name: '서울특별시 강서구 화곡1동', lat: 37.5450, lon: 126.8400, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['화곡동'] });
    addLocation({ name: '서울특별시 강서구 가양1동', lat: 37.5660, lon: 126.8500, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['가양동'] });
    addLocation({ name: '서울특별시 강서구 발산1동', lat: 37.5600, lon: 126.8200, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['발산동'] });
    addLocation({ name: '서울특별시 강서구 공항동', lat: 37.5600, lon: 126.7940, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['공항동'] });
    addLocation({ name: '서울특별시 강서구 방화1동', lat: 37.5700, lon: 126.8000, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['방화동'] });
    addLocation({ name: '서울특별시 구로구', lat: 37.4954, lon: 126.8874, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['구로구'] });
    addLocation({ name: '서울특별시 구로구 신도림동', lat: 37.5060, lon: 126.8910, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['신도림동'] });
    addLocation({ name: '서울특별시 구로구 구로1동', lat: 37.4960, lon: 126.8850, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['구로동'] });
    addLocation({ name: '서울특별시 구로구 고척1동', lat: 37.5010, lon: 126.8650, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['고척동'] });
    addLocation({ name: '서울특별시 구로구 개봉1동', lat: 37.4870, lon: 126.8580, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['개봉동'] });
    addLocation({ name: '서울특별시 구로구 오류1동', lat: 37.4870, lon: 126.8370, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['오류동'] });
    addLocation({ name: '서울특별시 구로구 가리봉동', lat: 37.4820, lon: 126.8820, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['가리봉동'] });
    addLocation({ name: '서울특별시 금천구', lat: 37.4571, lon: 126.9009, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['금천구'] });
    addLocation({ name: '서울특별시 금천구 가산동', lat: 37.4770, lon: 126.8800, type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['가산동'] });
    addLocation({ name: '서울특별시 금천구 독산1동', lat: 37.4650, lon: 126.9000, type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['독산동'] });
    addLocation({ name: '서울특별시 금천구 시흥1동', lat: 37.4470, lon: 126.9140, type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['시흥동'] });
    addLocation({ name: '서울특별시 영등포구', lat: 37.5262, lon: 126.9095, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['영등포구'] });
    addLocation({ name: '서울특별시 영등포구 여의동', lat: 37.5222, lon: 126.9242, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['여의도동'], aliases: ['여의도'] });
    addLocation({ name: '서울특별시 영등포구 당산1동', lat: 37.5330, lon: 126.9000, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['당산동'] });
    addLocation({ name: '서울특별시 영등포구 영등포동', lat: 37.5180, lon: 126.9060, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['영등포동'] });
    addLocation({ name: '서울특별시 영등포구 도림동', lat: 37.5080, lon: 126.8960, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['도림동'] });
    addLocation({ name: '서울특별시 영등포구 신길1동', lat: 37.5080, lon: 126.9140, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['신길동'] });
    addLocation({ name: '서울특별시 영등포구 대림1동', lat: 37.4900, lon: 126.9060, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['대림동'] });
    addLocation({ name: '서울특별시 영등포구 양평1동', lat: 37.5400, lon: 126.8970, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['양평동1가', '양평동2가'] });
    addLocation({ name: '서울특별시 동작구', lat: 37.5124, lon: 126.9392, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['동작구'] });
    addLocation({ name: '서울특별시 동작구 노량진1동', lat: 37.5130, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['노량진동'] });
    addLocation({ name: '서울특별시 동작구 상도1동', lat: 37.5020, lon: 126.9440, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['상도동'] });
    addLocation({ name: '서울특별시 동작구 흑석동', lat: 37.5080, lon: 126.9580, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['흑석동'] });
    addLocation({ name: '서울특별시 동작구 사당1동', lat: 37.4840, lon: 126.9740, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['사당동'] });
    addLocation({ name: '서울특별시 동작구 대방동', lat: 37.5000, lon: 126.9260, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['대방동'] });
    addLocation({ name: '서울특별시 동작구 신대방1동', lat: 37.4910, lon: 126.9200, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['신대방동'] });
    addLocation({ name: '서울특별시 관악구', lat: 37.4784, lon: 126.9517, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['관악구'] });
    addLocation({ name: '서울특별시 관악구 봉천동', lat: 37.4780, lon: 126.9530, type: '법정동', admin_parent: '서울특별시 관악구' });
    addLocation({ name: '서울특별시 관악구 신림동', lat: 37.4830, lon: 126.9300, type: '법정동', admin_parent: '서울특별시 관악구' });
    addLocation({ name: '서울특별시 관악구 남현동', lat: 37.4700, lon: 126.9800, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['남현동'] });
    addLocation({ name: '서울특별시 관악구 대학동', lat: 37.4660, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation({ name: '서울특별시 관악구 조원동', lat: 37.4710, lon: 126.9060, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation({ name: '서울특별시 관악구 삼성동', lat: 37.4650, lon: 126.9250, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation({ name: '서울특별시 관악구 청룡동', lat: 37.4800, lon: 126.9540, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['봉천동'] });
    addLocation({ name: '서울특별시 관악구 은천동', lat: 37.4860, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['봉천동'] });
    addLocation({ name: '서울특별시 서초구', lat: 37.4837, lon: 127.0324, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['서초구'] });
    addLocation({ name: '서울특별시 서초구 서초1동', lat: 37.4900, lon: 127.0170, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['서초동'] });
    addLocation({ name: '서울특별시 서초구 잠원동', lat: 37.5200, lon: 127.0180, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['잠원동'] });
    addLocation({ name: '서울특별시 서초구 반포1동', lat: 37.5020, lon: 127.0000, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['반포동'] });
    addLocation({ name: '서울특별시 서초구 방배1동', lat: 37.4830, lon: 126.9850, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['방배동'] });
    addLocation({ name: '서울특별시 서초구 양재1동', lat: 37.4600, lon: 127.0380, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['양재동', '염곡동'] });
    addLocation({ name: '서울특별시 서초구 내곡동', lat: 37.4470, lon: 127.0700, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['내곡동', '신원동', '원지동', '염곡동'] });
    addLocation({ name: '서울특별시 서초구 반포동', lat: 37.5050, lon: 127.0040, type: '별칭', admin_parent: '서울특별시 서초구', aliases: ['고속터미널'] });
    addLocation({ name: '서울특별시 강남구', lat: 37.5172, lon: 127.0473, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['강남구'] });
    addLocation({ name: '서울특별시 강남구 신사동', lat: 37.5200, lon: 127.0200, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['신사동'], aliases: ['가로수길'] });
    addLocation({ name: '서울특별시 강남구 논현1동', lat: 37.5130, lon: 127.0250, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['논현동'] });
    addLocation({ name: '서울특별시 강남구 압구정동', lat: 37.5270, lon: 127.0290, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['압구정동'] });
    addLocation({ name: '서울특별시 강남구 청담동', lat: 37.5220, lon: 127.0500, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['청담동'] });
    addLocation({ name: '서울특별시 강남구 삼성1동', lat: 37.5140, lon: 127.0560, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['삼성동'], aliases: ['코엑스'] });
    addLocation({ name: '서울특별시 강남구 대치1동', lat: 37.4990, lon: 127.0580, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['대치동'] });
    addLocation({ name: '서울특별시 강남구 역삼1동', lat: 37.5000, lon: 127.0360, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['역삼동'], aliases: ['강남', '강남역'] });
    addLocation({ name: '서울특별시 강남구 도곡1동', lat: 37.4900, lon: 127.0450, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['도곡동'] });
    addLocation({ name: '서울특별시 강남구 개포1동', lat: 37.4760, lon: 127.0540, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['개포동'] });
    addLocation({ name: '서울특별시 강남구 세곡동', lat: 37.4660, lon: 127.1000, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['세곡동', '자곡동', '율현동'] });
    addLocation({ name: '서울특별시 강남구 일원1동', lat: 37.4850, lon: 127.0800, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['일원동'] });
    addLocation({ name: '서울특별시 강남구 수서동', lat: 37.4870, lon: 127.1000, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['수서동'] });
    addLocation({ name: '서울특별시 송파구', lat: 37.5145, lon: 127.1054, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['송파구'] });
    addLocation({ name: '서울특별시 송파구 잠실본동', lat: 37.5080, lon: 127.0850, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'], aliases: ['잠실'] });
    addLocation({ name: '서울특별시 송파구 잠실2동', lat: 37.5130, lon: 127.0860, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실3동', lat: 37.5100, lon: 127.0900, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실7동', lat: 37.5200, lon: 127.1000, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실4동', lat: 37.5160, lon: 127.0800, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실5동', lat: 37.5140, lon: 127.0820, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실6동', lat: 37.5130, lon: 127.0990, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 신천동', lat: 37.5130, lon: 127.1000, type: '법정동', admin_parent: '서울특별시 송파구' });
    addLocation({ name: '서울특별시 송파구 방이1동', lat: 37.5150, lon: 127.1250, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['방이동'] });
    addLocation({ name: '서울특별시 송파구 오륜동', lat: 37.5140, lon: 127.1360, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['오륜동'] });
    addLocation({ name: '서울특별시 송파구 송파1동', lat: 37.5020, lon: 127.1080, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['송파동'] });
    addLocation({ name: '서울특별시 송파구 석촌동', lat: 37.5030, lon: 127.0990, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['석촌동'] });
    addLocation({ name: '서울특별시 송파구 삼전동', lat: 37.5070, lon: 127.0820, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['삼전동'] });
    addLocation({ name: '서울특별시 송파구 가락1동', lat: 37.4950, lon: 127.1120, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['가락동'] });
    addLocation({ name: '서울특별시 송파구 문정1동', lat: 37.4870, lon: 127.1160, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['문정동'] });
    addLocation({ name: '서울특별시 송파구 장지동', lat: 37.4780, lon: 127.1280, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['장지동', '복정동'] });
    addLocation({ name: '서울특별시 송파구 위례동', lat: 37.4850, lon: 127.1430, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['장지동', '거여동'] });
    addLocation({ name: '서울특별시 강동구', lat: 37.5298, lon: 127.1269, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['강동구'] });
    addLocation({ name: '서울특별시 강동구 명일1동', lat: 37.5500, lon: 127.1400, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['명일동'] });
    addLocation({ name: '서울특별시 강동구 고덕1동', lat: 37.5580, lon: 127.1480, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['고덕동'] });
    addLocation({ name: '서울특별시 강동구 암사1동', lat: 37.5540, lon: 127.1280, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['암사동'] });
    addLocation({ name: '서울특별시 강동구 천호1동', lat: 37.5380, lon: 127.1200, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['천호동'] });
    addLocation({ name: '서울특별시 강동구 성내1동', lat: 37.5300, lon: 127.1200, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['성내동'] });
    addLocation({ name: '서울특별시 강동구 둔촌1동', lat: 37.5200, lon: 127.1450, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['둔촌동'] });
    addLocation({ name: '서울특별시 강동구 길동', lat: 37.5370, lon: 127.1370, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['길동'] });
    addLocation({ name: '서울특별시 강동구 상일동', lat: 37.5500, lon: 127.1600, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['상일동'] });
    addLocation({ name: '서울특별시 강동구 강일동', lat: 37.5670, lon: 127.1700, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['강일동'] });
    addLocation({ name: '제주특별자치도', lat: 33.4891, lon: 126.5135, type: '광역자치단체', aliases: ['제주', '제주도'] });
    addLocation({ name: '제주특별자치시 제주시', lat: 33.5073, lon: 126.5148, type: '기초자치단체', admin_parent: '제주특별자치도', aliases: ['제주시'] });
    addLocation({ name: '제주특별자치시 제주시 일도1동', lat: 33.5130, lon: 126.5270, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['일도일동'] });
    addLocation({ name: '제주특별자치시 제주시 일도2동', lat: 33.5078, lon: 126.5362, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['일도이동'] });
    addLocation({ name: '제주특별자치시 제주시 이도1동', lat: 33.5060, lon: 126.5180, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['이도일동'] });
    addLocation({ name: '제주특별자치시 제주시 이도2동', lat: 33.4975, lon: 126.5337, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['이도이동', '도남동', '영평동', '오등동'], aliases: ['도남'] });
    addLocation({ name: '제주특별자치시 제주시 삼도1동', lat: 33.5113, lon: 126.5120, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['삼도일동'] });
    addLocation({ name: '제주특별자치시 제주시 삼도2동', lat: 33.5090, lon: 126.5080, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['삼도이동'] });
    addLocation({ name: '제주특별자치시 제주시 건입동', lat: 33.5140, lon: 126.5360, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['건입동'] });
    addLocation({ name: '제주특별자치시 제주시 화북동', lat: 33.5210, lon: 126.5700, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['화북일동', '화북이동'] });
    addLocation({ name: '제주특별자치시 제주시 삼양동', lat: 33.5260, lon: 126.6010, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['삼양일동', '삼양이동', '삼양삼동'] });
    addLocation({ name: '제주특별자치시 제주시 봉개동', lat: 33.4590, lon: 126.6190, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['봉개동'] });
    addLocation({ name: '제주특별자치시 제주시 아라동', lat: 33.4680, lon: 126.5490, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['아라일동', '아라이동'] });
    addLocation({ name: '제주특별자치시 제주시 오라동', lat: 33.4800, lon: 126.4990, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['오라일동', '오라이동', '오라삼동'] });
    addLocation({ name: '제주특별자치시 제주시 연동', lat: 33.4890, lon: 126.4900, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['연동'] });
    addLocation({ name: '제주특별자치시 제주시 노형동', lat: 33.4850, lon: 126.4670, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['노형동'] });
    addLocation({ name: '제주특별자치시 제주시 외도동', lat: 33.5040, lon: 126.4490, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['외도일동', '외도이동', '외도삼동'] });
    addLocation({ name: '제주특별자치시 제주시 이호동', lat: 33.5130, lon: 126.4710, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['이호일동', '이호이동'] });
    addLocation({ name: '제주특별자치시 제주시 도두동', lat: 33.5160, lon: 126.4350, type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['도두일동', '도두이동'] });
    addLocation({ name: '제주특별자치시 제주시 애월읍', lat: 33.4560, lon: 126.3300, type: '읍', admin_parent: '제주특별자치시 제주시', legal_divisions: ['고내리', '고성리', '곽지리', '광령리', '구엄리', '금성리', '납읍리', '봉성리', '상가리', '상귀리', '소길리', '수산리', '애월리', '어음리', '신엄리', '유수암리'] });
    addLocation({ name: '제주특별자치시 제주시 한림읍', lat: 33.4140, lon: 126.2570, type: '읍', admin_parent: '제주특별자치시 제주시', legal_divisions: ['귀덕리', '금능리', '금악리', '대림리', '동명리', '명월리', '상대리', '상명리', '수원리', '옹포리', '월령리', '월림리', '한림리', '한수리', '협재리'] });
    addLocation({ name: '제주특별자치시 제주시 구좌읍', lat: 33.5180, lon: 126.8370, type: '읍', admin_parent: '제주특별자치시 제주시', legal_divisions: ['김녕리', '덕천리', '동복리', '상도리', '세화리', '송당리', '월정리', '종달리', '평대리', '하도리', '한동리', '행원리'] });
    addLocation({ name: '제주특별자치시 제주시 조천읍', lat: 33.5320, lon: 126.6800, type: '읍', admin_parent: '제주특별자치시 제주시', legal_divisions: ['교래리', '대흘리', '북촌리', '선흘리', '신촌리', '신흥리', '와산리', '와흘리', '조천리', '함덕리'] });
    addLocation({ name: '제주특별자치시 제주시 한경면', lat: 33.3280, lon: 126.1730, type: '면', admin_parent: '제주특별자치시 제주시', legal_divisions: ['고산리', '금등리', '낙천리', '두모리', '신창리', '용수리', '저지리', '조수리', '청수리', '판포리'] });
    addLocation({ name: '제주특별자치시 제주시 추자면', lat: 33.9500, lon: 126.3200, type: '면', admin_parent: '제주특별자치시 제주시', legal_divisions: ['대서리', '묵리', '신양리', '영흥리', '예초리'], aliases: ['추자'] });
    addLocation({ name: '제주특별자치시 제주시 우도면', lat: 33.5040, lon: 126.9530, type: '면', admin_parent: '제주특별자치시 제주시', legal_divisions: ['연평리'], aliases: ['우도'] });
    addLocation({ name: '제주특별자치시 서귀포시', lat: 33.2540, lon: 126.5600, type: '기초자치단체', admin_parent: '제주특별자치도', aliases: ['서귀포', '서귀포시'] });
    addLocation({ name: '제주특별자치시 서귀포시 정방동', lat: 33.2490, lon: 126.5690, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['서귀동'] });
    addLocation({ name: '제주특별자치시 서귀포시 중앙동', lat: 33.2500, lon: 126.5630, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['서귀동'] });
    addLocation({ name: '제주특별자치시 서귀포시 천지동', lat: 33.2470, lon: 126.5560, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['서귀동', '서홍동'] });
    addLocation({ name: '제주특별자치시 서귀포시 효돈동', lat: 33.2800, lon: 126.6100, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['하효동', '신효동'] });
    addLocation({ name: '제주특별자치시 서귀포시 영천동', lat: 33.2850, lon: 126.5800, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['토평동', '서귀동'] });
    addLocation({ name: '제주특별자치시 서귀포시 동홍동', lat: 33.2700, lon: 126.5750, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['동홍동'] });
    addLocation({ name: '제주특별자치시 서귀포시 서홍동', lat: 33.2600, lon: 126.5400, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['서홍동'] });
    addLocation({ name: '제주특별자치시 서귀포시 대륜동', lat: 33.2450, lon: 126.5200, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['법환동', '서호동', '호근동'] });
    addLocation({ name: '제주특별자치시 서귀포시 대천동', lat: 33.2580, lon: 126.4900, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['강정동', '도순동', '영남동', '월평동'] });
    addLocation({ name: '제주특별자치시 서귀포시 중문동', lat: 33.2440, lon: 126.4300, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['중문동', '대포동', '하원동', '회수동'] });
    addLocation({ name: '제주특별자치시 서귀포시 예래동', lat: 33.2480, lon: 126.3800, type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['예래동', '상예동', '하예동'] });
    addLocation({ name: '제주특별자치시 서귀포시 대정읍', lat: 33.2260, lon: 126.2570, type: '읍', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['하모리', '상모리', '신평리', '영락리', '무릉리', '보성리', '안성리', '구억리', '인성리', '일과리', '동일1리', '동일2리', '가파리', '마라리'] });
    addLocation({ name: '제주특별자치시 서귀포시 남원읍', lat: 33.2800, lon: 126.7300, type: '읍', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['남원리', '위미리', '태흥리', '한남리', '의귀리', '신례리', '하례리'] });
    addLocation({ name: '제주특별자치시 서귀포시 성산읍', lat: 33.3800, lon: 126.8900, type: '읍', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['성산리', '고성리', '온평리', '신풍리', '수산리', '신천리', '삼달리', '오조리', '시흥리'], aliases: ['성산일출봉'] });
    addLocation({ name: '제주특별자치시 서귀포시 안덕면', lat: 33.2500, lon: 126.3100, type: '면', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['화순리', '감산리', '서광리', '동광리', '사계리', '창천리', '상창리', '광평리', '덕수리'] });
    addLocation({ name: '제주특별자치시 서귀포시 표선면', lat: 33.3000, lon: 126.8300, type: '면', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['표선리', '세화리', '가시리', '성읍리', '하천리', '토산리'] });


    // 모듈이 반환할 최종 객체
    return {
        locationData,
        latLonToGrid,

        findAllMatches: (searchTerm) => {
            const normalizedSearch = searchTerm.trim().toLowerCase().replace(/\s+/g, '');
            if (!normalizedSearch) return [];
            const matchedIds = new Set();
            for (const key in searchIndex) {
                if (key.includes(normalizedSearch)) {
                    searchIndex[key].forEach(id => matchedIds.add(id));
                }
            }
            const results = Array.from(matchedIds).map(id => locationData[id]);
            results.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
            return results;
        },

        findMatchingLocation: ({ lat, lon }) => {
            let closestLocation = null;
            let minDistance = Infinity;
            Object.values(locationData).forEach(loc => {
                if (['광역자치단체', '기초자치단체', '행정동', '읍', '면'].includes(loc.type)) {
                    const distance = Math.pow(lat - loc.lat, 2) + Math.pow(lon - loc.lon, 2);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestLocation = loc;
                    }
                }
            });
            return closestLocation;
        },
        
        searchLocations: (query, page = 1, size = 10) => {
            const allMatches = locationModule.findAllMatches(query);
            const totalResults = allMatches.length;
            const totalPages = Math.ceil(totalResults / size);
            const startIndex = (page - 1) * size;
            const paginatedResults = allMatches.slice(startIndex, startIndex + size);
            return {
                results: paginatedResults.map(loc => ({
                    ...loc,
                    displayName: (loc.name.replace(loc.admin_parent || '', '').trim() || loc.name)
                })),
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalResults,
                    pageSize: size
                }
            };
        }
    };
})();

// CommonJS 모듈로 내보내기
module.exports = locationModule;
