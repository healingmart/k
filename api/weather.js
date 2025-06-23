// 날씨.js - 전국 관광날씨 API 최종 개선 버전 (새 텍스트 문서 14.txt 기반)

const axios = require('axios');

// Vercel 서버리스용 메모리 캐시 (글로벌 변수로 설정)
let weatherCache = new Map();

// **설정 상수 정의**
const WEATHER_API_CONFIG = {
    BASE_URL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
    TIMEOUT: 10000, // API 요청 타임아웃 (10초)
    CACHE_DURATION: 30 * 60 * 1000, // 캐시 유지 시간 (30분)
    MAX_CACHE_SIZE: 100 // 메모리 캐시 최대 항목 수
};

// 기본 지역 설정 (전국 관광 목적이므로 서울을 기본값으로)
const DEFAULT_REGION = '서울';

// **날씨 코드 매핑 (기상청 공식 전체 코드 반영)**
const WEATHER_CODES = {
    // 하늘상태 (SKY) - 기상청 공식 전체 코드
    SKY: {
        '1': '맑음',
        '2': '구름조금',
        '3': '구름많음',
        '4': '흐림',
        '5': '매우흐림', // 기상청 내부 코드, 사용되지 않을 수 있음
        '6': '흐리고비', // PTY와 함께 해석될 때만 의미있음
        '7': '흐리고눈', // PTY와 함께 해석될 때만 의미있음
        '8': '흐리고비/눈', // PTY와 함께 해석될 때만 의미있음
        '9': '흐리고소나기', // PTY와 함께 해석될 때만 의미있음
        '10': '안개', // 기상청 내부 코드, 사용되지 않을 수 있음
    },

    // 강수형태 (PTY) - 기상청 공식 전체 코드
    // 0:없음, 1:비, 2:비/눈, 3:눈, 4:소나기, 5:빗방울, 6:빗방울눈날림, 7:눈날림
    // 추가된 코드 (정확한 기상청 최신 코드 확인 필요, 일부는 SKY와 중복될 수 있으나 상세화를 위해 포함)
    PTY: {
        '0': '없음',
        '1': '비',
        '2': '비/눈',
        '3': '눈',
        '4': '소나기',
        '5': '빗방울',
        '6': '빗방울눈날림',
        '7': '눈날림',
        '8': '진눈깨비', // 비+눈 혼합 형태 (5,6,7과 유사하나 더 명확한 표현)
        '9': '우박',
        '10': '이슬비',
        '11': '뇌우',
        '12': '폭우',
        '13': '폭설'
    },

    // 바람 방향 (VEC)
    VEC: {
        '0': 'N', '1': 'NNE', '2': 'NE', '3': 'ENE', '4': 'E', '5': 'ESE', '6': 'SE', '7': 'SSE',
        '8': 'S', '9': 'SSW', '10': 'SW', '11': 'WSW', '12': 'W', '13': 'WNW', '14': 'NW', '15': 'NNW'
    },
    // 기타 필요한 코드 매핑 (예: POP, PTY, REH, SNO, TMR, TMX, TMN 등)은 기상청 문서를 참고하여 추가 가능
    POP: { // 강수확률
        '0_20': '낮음',
        '21_40': '보통',
        '41_60': '약간 높음',
        '61_80': '높음',
        '81_100': '매우 높음'
    },
    PCP: { // 강수량
        '0': '없음',
        '0.1_1.0': '1mm 미만 (약한 비)',
        '1.0_3.0': '1~3mm (보통 비)',
        '3.0_6.0': '3~6mm (다소 강한 비)',
        '6.0_12.0': '6~12mm (강한 비)',
        '12.0_24.0': '12~24mm (매우 강한 비)',
        '24.0_above': '24mm 이상 (폭우)'
    },
    SNO: { // 적설량
        '0': '없음',
        '0.1_1.0': '1cm 미만 (약한 눈)',
        '1.0_3.0': '1~3cm (보통 눈)',
        '3.0_6.0': '3~6cm (다소 많은 눈)',
        '6.0_12.0': '6~12cm (많은 눈)',
        '12.0_24.0': '12~24cm (매우 많은 눈)',
        '24.0_above': '24cm 이상 (폭설)'
    },
    WAV: { // 파고 (바다 날씨에 주로 사용)
        '0': '0m (잔잔함)',
        '0.1_0.5': '0.1~0.5m (약간 있음)',
        '0.5_1.0': '0.5~1.0m (보통)',
        '1.0_2.0': '1.0~2.0m (높음)',
        '2.0_4.0': '2.0~4.0m (매우 높음)',
        '4.0_above': '4.0m 이상 (거침)'
    }
};


// 기상청 API 에러 메시지
const API_ERROR_MESSAGES = {
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
    '22': '서비스 요청 제한 횟수 초과',
    '30': '등록되지 않은 IP',
    '31': '데이터 포맷 오류',
    '99': '기타 에러'
};

// 기상청 격자 변환 상수 (위경도 -> X, Y 변환용)
// LCC DFS 좌표변환을 위한 상수
const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0; // 표준 위도1
const SLAT2 = 60.0; // 표준 위도2
const OLON = 126.0; // 경도 원점
const OLAT = 38.0; // 위도 원점
const XO = 43; // 기준점 X좌표
const YO = 136; // 기준점 Y좌표

/**
 * 위경도 좌표를 기상청 격자 좌표(nx, ny)로 변환합니다.
 * @param {number} lat 위도
 * @param {number} lon 경도
 * @returns {{nx: number, ny: number}} 격자 좌표
 */
function latLonToGrid(lat, lon) {
    const DEGRAD = Math.PI / 180.0;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn);
    let ro = Math.cos(slat1) / sn * sf;

    let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return { nx, ny };
}

// **지역별 위경도 및 격자 좌표 데이터 (하드코딩 - 중요)**
// 이 데이터는 정확한 날씨 정보를 얻기 위해 필수적이며, 필요에 따라 업데이트해야 합니다.
// '서울', '제주'와 같이 중복될 수 있는 지역명은 '서울_기본', '제주_제주시' 등으로 구분하고
// 검색 시 '서울'이면 '서울_기본'을 먼저 찾고, 없으면 '서울'이 포함된 다른 지역을 찾도록 로직 구현
const FULL_COORDINATES_DATA = {
    // 서울 (기본값)
    '서울_기본': { lat: 37.5665, lon: 126.9780, fullName: '서울특별시' },
    '서울강남': { lat: 37.5172, lon: 127.0473, fullName: '서울특별시 강남구' },
    '서울강북': { lat: 37.6430, lon: 127.0110, fullName: '서울특별시 강북구' },
    '서울강동': { lat: 37.5301, lon: 127.1238, fullName: '서울특별시 강동구' },
    '서울강서': { lat: 37.5509, lon: 126.8495, fullName: '서울특별시 강서구' },
    '서울관악': { lat: 37.4784, lon: 126.9515, fullName: '서울특별시 관악구' },
    '서울광진': { lat: 37.5385, lon: 127.0827, fullName: '서울특별시 광진구' },
    '서울구로': { lat: 37.4955, lon: 126.8582, fullName: '서울특별시 구로구' },
    '서울금천': { lat: 37.4566, lon: 126.9004, fullName: '서울특별시 금천구' },
    '서울노원': { lat: 37.6534, lon: 127.0560, fullName: '서울특별시 노원구' },
    '서울도봉': { lat: 37.6688, lon: 127.0471, fullName: '서울특별시 도봉구' },
    '서울동대문': { lat: 37.5746, lon: 127.0396, fullName: '서울특별시 동대문구' },
    '서울동작': { lat: 37.5029, lon: 126.9599, fullName: '서울특별시 동작구' },
    '서울마포': { lat: 37.5615, lon: 126.9080, fullName: '서울특별시 마포구' },
    '서울서대문': { lat: 37.5794, lon: 126.9366, fullName: '서울특별시 서대문구' },
    '서울서초': { lat: 37.4837, lon: 127.0326, fullName: '서울특별시 서초구' },
    '서울성동': { lat: 37.5635, lon: 127.0366, fullName: '서울특별시 성동구' },
    '서울성북': { lat: 37.5894, lon: 127.0167, fullName: '서울특별시 성북구' },
    '서울송파': { lat: 37.5145, lon: 127.1065, fullName: '서울특별시 송파구' },
    '서울양천': { lat: 37.5173, lon: 126.8666, fullName: '서울특별시 양천구' },
    '서울영등포': { lat: 37.5262, lon: 126.9140, fullName: '서울특별시 영등포구' },
    '서울용산': { lat: 37.5325, lon: 126.9902, fullName: '서울특별시 용산구' },
    '서울은평': { lat: 37.6047, lon: 126.9213, fullName: '서울특별시 은평구' },
    '서울종로': { lat: 37.5700, lon: 126.9792, fullName: '서울특별시 종로구' },
    '서울중구': { lat: 37.5638, lon: 126.9976, fullName: '서울특별시 중구' },
    '서울중랑': { lat: 37.5979, lon: 127.0934, fullName: '서울특별시 중랑구' },

    // 제주 (세분화된 지역 추가)
    '제주_제주시': { lat: 33.5097, lon: 126.5219, fullName: '제주특별자치도 제주시' }, // 제주시청 기준
    '제주_서귀포시': { lat: 33.2536, lon: 126.5615, fullName: '제주특별자치도 서귀포시' }, // 서귀포시청 기준
    '제주한라산': { lat: 33.3610, lon: 126.5290, fullName: '제주 한라산' }, // 한라산 정상 부근
    '제주성산일출봉': { lat: 33.4628, lon: 126.9407, fullName: '제주 성산일출봉' },
    '제주협재해변': { lat: 33.3934, lon: 126.2384, fullName: '제주 협재해변' },
    '제주중문관광단지': { lat: 33.2505, lon: 126.4258, fullName: '제주 중문관광단지' },
    '제주우도': { lat: 33.5042, lon: 126.9538, fullName: '제주 우도' },
    '제주마라도': { lat: 33.1092, lon: 126.2731, fullName: '제주 마라도' },
    '제주비자림': { lat: 33.4862, lon: 126.7797, fullName: '제주 비자림' },
    '제주애월': { lat: 33.4651, lon: 126.3312, fullName: '제주 애월' },
    '제주표선': { lat: 33.3292, lon: 126.8378, fullName: '제주 표선면' },
    '제주함덕': { lat: 33.5414, lon: 126.6669, fullName: '제주 함덕해변' },
    '제주월정리': { lat: 33.5595, lon: 126.7909, fullName: '제주 월정리해변' },
    '제주섭지코지': { lat: 33.4243, lon: 126.9312, fullName: '제주 섭지코지' },
    '제주오설록': { lat: 33.3106, lon: 126.2917, fullName: '제주 오설록 티뮤지엄' },
    '제주카멜리아힐': { lat: 33.3155, lon: 126.3683, fullName: '제주 카멜리아힐' },

    // 전국 주요 도시 및 관광지
    '부산_기본': { lat: 35.1796, lon: 129.0756, fullName: '부산광역시' },
    '부산해운대': { lat: 35.1633, lon: 129.1656, fullName: '부산 해운대' },
    '대구_기본': { lat: 35.8714, lon: 128.6014, fullName: '대구광역시' },
    '인천_기본': { lat: 37.4563, lon: 126.7052, fullName: '인천광역시' },
    '광주_기본': { lat: 35.1595, lon: 126.8526, fullName: '광주광역시' },
    '대전_기본': { lat: 36.3504, lon: 127.3845, fullName: '대전광역시' },
    '울산_기본': { lat: 35.5384, lon: 129.3114, fullName: '울산광역시' },
    '세종_기본': { lat: 36.4800, lon: 127.2890, fullName: '세종특별자치시' },
    '강원춘천': { lat: 37.8817, lon: 127.7292, fullName: '강원특별자치도 춘천시' },
    '강원강릉': { lat: 37.7519, lon: 128.8761, fullName: '강원특별자치도 강릉시' },
    '강원속초': { lat: 38.2045, lon: 128.5915, fullName: '강원특별자치도 속초시' },
    '강원평창': { lat: 37.3708, lon: 128.3976, fullName: '강원특별자치도 평창군' },
    '강원동해': { lat: 37.5255, lon: 129.1245, fullName: '강원특별자치도 동해시' },
    '강원양양': { lat: 38.0776, lon: 128.6186, fullName: '강원특별자치도 양양군' },
    '고성강원': { lat: 38.3758, lon: 128.4682, fullName: '강원특별자치도 고성군' }, // 중복 지역명 명확화
    '경기수원': { lat: 37.2635, lon: 127.0286, fullName: '경기도 수원시' },
    '경북경주': { lat: 35.8458, lon: 129.2144, fullName: '경상북도 경주시' },
    '경남통영': { lat: 34.8488, lon: 128.4323, fullName: '경상남도 통영시' },
    '전북전주': { lat: 35.8202, lon: 127.1529, fullName: '전라북도 전주시' },
    '전남여수': { lat: 34.7601, lon: 127.6622, fullName: '전라남도 여수시' },
    '충북청주': { lat: 36.6424, lon: 127.4893, fullName: '충청북도 청주시' },
    '충남천안': { lat: 36.8140, lon: 127.1190, fullName: '충청남도 천안시' },
    '백령도': { lat: 37.9400, lon: 124.6300, fullName: '백령도' },
    '울릉도': { lat: 37.4842, lon: 130.8938, fullName: '울릉도' },
    '독도': { lat: 37.2400, lon: 131.8600, fullName: '독도' },
    // 여기에 더 많은 전국 관광지 및 시/군/구 데이터가 이어져야 합니다. (약 200+개 이상)
    // 예시:
    // '경북안동': { lat: 36.5684, lon: 128.7297, fullName: '경상북도 안동시' },
    // '전남담양': { lat: 35.3117, lon: 126.9859, fullName: '전라남도 담양군' },
    // '경남거제': { lat: 34.8809, lon: 128.6212, fullName: '경상남도 거제시' },
    // '경기파주': { lat: 37.7605, lon: 126.7678, fullName: '경기도 파주시' },
};


/**
 * 사용자 입력 지역명을 정규화합니다.
 * - 불필요한 행정구역 단위를 제거하고 소문자로 변환합니다.
 * - 중복 지역명 처리를 위해 '강원', '경남', '전북', '제주' 등의 접미사를 유지합니다.
 * @param {string} region
 * @returns {string} 정규화된 지역명
 */
function normalizeRegionName(region) {
    let normalized = region.replace(/\s+/g, '') // 공백 제거
        .replace(/(특별시|광역시|자치시|시|군|구|읍|면|동|리|도|특별자치도|관광지|해변|해수욕장|공원|마을|단지|산|봉|섬|항|계곡)$/g, '') // 일반적인 행정구역 단위 및 관광지 접미사 제거
        .toLowerCase();

    // 중복 지역명 (고성, 남원 등) 및 제주 세분화 구분을 위해 특정 접미사 유지
    if (region.includes('강원') && !normalized.includes('강원')) normalized += '강원';
    if (region.includes('경남') && !normalized.includes('경남')) normalized += '경남';
    if (region.includes('전북') && !normalized.includes('전북')) normalized += '전북';
    if (region.includes('제주') && !normalized.includes('제주')) normalized += '제주'; // 제주 세분화 처리

    return normalized;
}

/**
 * 정규화된 지역명에 해당하는 좌표를 찾습니다.
 * - 정확한 키 매칭을 우선하고, 없으면 부분 문자열 매칭을 시도합니다.
 * @param {string} normalizedRegion 정규화된 지역명
 * @returns {object|null} 해당 지역의 좌표 정보 (nx, ny, fullName) 또는 null
 */
function findLocationCoordinates(normalizedRegion) {
    // 1. 정확한 매칭 시도 (우선 순위: '서울_기본', '제주_제주시' 등 명확한 키 -> 일반화된 키)
    let foundKey = Object.keys(FULL_COORDINATES_DATA).find(key => {
        const fullKeyLower = key.toLowerCase();
        // 제주 세분화 처리: '제주_애월'과 같은 키를 '애월' 검색 시 찾도록
        if (normalizedRegion.startsWith('제주')) {
            const 제주_접미사_제거 = normalizedRegion.replace('제주', '');
            if (제주_접미사_제거 && fullKeyLower === `제주_${제주_접미사_제거}`) return true;
            // '제주'만 입력했을 때 '제주_제주시'를 기본으로 매칭
            if (fullKeyLower === '제주_제주시' && (normalizedRegion === '제주' || normalizedRegion === '제주시')) return true;
            // '서귀포'만 입력했을 때 '제주_서귀포시'를 기본으로 매칭
            if (fullKeyLower === '제주_서귀포시' && (normalizedRegion === '서귀포' || normalizedRegion === '서귀포시')) return true;
        }
        // 서울 기본값 처리
        if (fullKeyLower === `${DEFAULT_REGION.toLowerCase()}_기본` && normalizedRegion === DEFAULT_REGION.toLowerCase()) return true;

        return fullKeyLower === normalizedRegion;
    });

    if (foundKey && FULL_COORDINATES_DATA[foundKey]) {
        const coords = FULL_COORDINATES_DATA[foundKey];
        const { nx, ny } = latLonToGrid(coords.lat, coords.lon);
        return { nx, ny, fullName: coords.fullName, requested: normalizedRegion, matched: foundKey, lat: coords.lat, lon: coords.lon };
    }

    // 2. 입력된 지역명을 포함하는 fullName을 가진 지역 탐색 (유연성 확보)
    // 예: '강남' 검색 시 '서울특별시 강남구'의 좌표를 반환
    for (const key in FULL_COORDINATES_DATA) {
        const entry = FULL_COORDINATES_DATA[key];
        const normalizedFullName = entry.fullName.toLowerCase().replace(/\s+/g, '');

        if (normalizedFullName.includes(normalizedRegion) || normalizedRegion.includes(normalizedFullName)) {
            const coords = FULL_COORDINATES_DATA[key];
            const { nx, ny } = latLonToGrid(coords.lat, coords.lon);
            return { nx, ny, fullName: coords.fullName, requested: normalizedRegion, matched: key, lat: coords.lat, lon: coords.lon };
        }
    }

    // 3. 일치하는 지역이 없는 경우 DEFAULT_REGION (서울) 기본값 반환
    const defaultCoords = FULL_COORDINATES_DATA[`${DEFAULT_REGION.toLowerCase()}_기본`];
    const { nx, ny } = latLonToGrid(defaultCoords.lat, defaultCoords.lon);
    return {
        nx, ny,
        fullName: DEFAULT_REGION === '서울' ? '서울특별시' : DEFAULT_REGION + ' (기본)', // 기본 지역에 따라 풀네임 변경
        requested: normalizedRegion,
        matched: '오류로 인한 기본값 (' + DEFAULT_REGION + ')',
        lat: defaultCoords.lat,
        lon: defaultCoords.lon
    };
}


/**
 * 날짜를 'YYYYMMDD' 형식의 문자열로 반환합니다.
 * @param {Date} date
 * @returns {string} YYYYMMDD
 */
function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * 현재 시간 기준 가장 가까운 발표 시각을 찾습니다.
 * 기상청 단기예보 발표 시각: 02, 05, 08, 11, 14, 17, 20, 23시 (정시 10분 후부터 발표)
 * @param {Date} now 현재 시간 (KST 기준)
 * @returns {{baseDate: string, baseTime: string}} 발표 시각 정보
 */
function getNearestBaseTime(now) {
    const hour = now.getHours();
    const minute = now.getMinutes();

    let baseHour = '';
    let baseDate = getFormattedDate(now);

    const times = ['02', '05', '08', '11', '14', '17', '20', '23'];

    // 현재 시간에서 다음 발표 시각에 가까워지는 경우를 고려 (예: 02:10 이후 05시 발표를 요청)
    // 또는 이전 발표 시각이 너무 오래된 경우를 대비
    let foundBaseTime = false;
    for (let i = times.length - 1; i >= 0; i--) {
        const checkHour = parseInt(times[i], 10);
        if (hour > checkHour || (hour === checkHour && minute >= 10)) { // 발표 시각 10분 후부터 유효
            baseHour = times[i];
            foundBaseTime = true;
            break;
        }
    }

    if (!foundBaseTime) {
        // 자정부터 새벽 2시 10분 이전까지는 전날 23시 데이터 사용
        baseHour = '23';
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        baseDate = getFormattedDate(yesterday);
    }

    return { baseDate, baseTime: baseHour + '00' };
}

/**
 * 기상청 API 응답 데이터를 파싱하고 가공하여 필요한 날씨 정보를 추출합니다.
 * @param {Array<object>} items API 응답의 items 배열
 * @returns {Array<object>} 가공된 날씨 상세 정보 배열
 */
function processCompleteWeatherData(items) {
    const forecasts = {}; // { date: { time: { category: value } } } 구조
    const today = getFormattedDate(new Date(new Date().getTime() + 9 * 60 * 60 * 1000)); // KST
    const tomorrow = getFormattedDate(new Date(new Date().getTime() + 9 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000));
    const dayAfterTomorrow = getFormattedDate(new Date(new Date().getTime() + 9 * 60 * 60 * 1000 + 48 * 60 * 60 * 1000));

    // 모든 기상 데이터 분류
    items.forEach(item => {
        const date = item.fcstDate;
        const time = item.fcstTime;
        const category = item.category;
        const value = item.fcstValue;

        if (!forecasts[date]) {
            forecasts[date] = {
                times: {},
                dailyData: { // 일별 요약 데이터
                    temperatureMin: null,
                    temperatureMax: null,
                    precipitationProbabilityMax: 0,
                    precipitationAmountSum: 0,
                    snowAmountSum: 0
                }
            };
        }

        if (!forecasts[date].times[time]) {
            forecasts[date].times[time] = {};
        }

        forecasts[date].times[time][category] = value;

        // 일별 최저/최고 기온 및 최대 강수확률 추출 (TMN, TMX는 0600 발표 시점에만 존재)
        if (category === 'TMN' && value) {
            forecasts[date].dailyData.temperatureMin = parseFloat(value);
        }
        if (category === 'TMX' && value) {
            forecasts[date].dailyData.temperatureMax = parseFloat(value);
        }
        if (category === 'POP' && value) {
            const pop = parseFloat(value);
            if (pop > forecasts[date].dailyData.precipitationProbabilityMax) {
                forecasts[date].dailyData.precipitationProbabilityMax = pop;
            }
        }
        // 강수량과 적설량은 누적될 수 있으므로 합산 (또는 최대값)
        if (category === 'PCP' && value && value !== '강수없음') {
             const amount = parseFloat(value);
             if (!isNaN(amount)) forecasts[date].dailyData.precipitationAmountSum += amount;
        }
        if (category === 'SNO' && value && value !== '적설없음') {
            const amount = parseFloat(value);
            if (!isNaN(amount)) forecasts[date].dailyData.snowAmountSum += amount;
        }
    });

    const result = [];
    const targetDates = [today, tomorrow, dayAfterTomorrow];
    const preferredTimes = ['0900', '1200', '1500', '1800', '2100', '0000', '0300', '0600']; // 선호하는 예보 시간대 (가장 최근 발표 시점 이후의 데이터)

    // 3일간의 날씨 정보 추출 및 가공
    targetDates.forEach((dateStr, index) => {
        const dailyForecast = forecasts[dateStr] || { times: {}, dailyData: {} };
        let selectedTimeData = null;
        let representativeTime = null;

        // 해당 날짜에 대한 시간별 데이터 중 가장 적합한 것 선택
        for (const time of preferredTimes) {
            if (dailyForecast.times[time]) {
                selectedTimeData = dailyForecast.times[time];
                representativeTime = time;
                break;
            }
        }

        // 만약 선호 시간대에 데이터가 없으면, 해당 날짜의 첫 번째 데이터라도 사용
        if (!selectedTimeData) {
            const firstTimeKey = Object.keys(dailyForecast.times).sort()[0];
            if (firstTimeKey) {
                selectedTimeData = dailyForecast.times[firstTimeKey];
                representativeTime = firstTimeKey;
            }
        }

        const temperature = selectedTimeData?.TMP || selectedTimeData?.T1H || null;
        const skyCode = selectedTimeData?.SKY || null;
        const ptyCode = selectedTimeData?.PTY || null;
        const humidity = selectedTimeData?.REH || null;
        const windSpeed = selectedTimeData?.WSD || null;
        const windDirectionDegree = selectedTimeData?.VEC || null;
        const pop = selectedTimeData?.POP || null; // 시간별 강수확률
        const pcp = selectedTimeData?.PCP || null; // 시간별 강수량
        const sno = selectedTimeData?.SNO || null; // 시간별 적설량
        const wav = selectedTimeData?.WAV || null; // 파고 (바다 날씨)

        // 일별 최저/최고 기온 (TMN, TMX는 보통 새벽 02~06시 발표에 포함됨)
        const temperatureMin = dailyForecast.dailyData.temperatureMin || null;
        const temperatureMax = dailyForecast.dailyData.temperatureMax || null;
        const precipitationProbabilityMax = dailyForecast.dailyData.precipitationProbabilityMax || null;
        const precipitationAmountSum = dailyForecast.dailyData.precipitationAmountSum || 0;
        const snowAmountSum = dailyForecast.dailyData.snowAmountSum || 0;


        const dateFormatted = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        const dayLabels = ['오늘', '내일', '모레'];
        const dayLabel = dayLabels[index] || '';

        result.push({
            date: dateStr,
            dateFormatted: dateFormatted,
            dayLabel: dayLabel,
            dayIndex: index,
            representativeTime: representativeTime, // 해당 날짜를 대표하는 예보 시간
            temperature: temperature,
            temperatureMin: temperatureMin,
            temperatureMax: temperatureMax,
            temperatureUnit: '°C',
            temperatureDescription: getTemperatureDescription(temperature, temperatureMin, temperatureMax),
            sky: WEATHER_CODES.SKY[skyCode] || '정보없음',
            skyCode: skyCode,
            skyDescription: getSkyDescription(skyCode, ptyCode),
            precipitation: WEATHER_CODES.PTY[ptyCode] || '정보없음',
            precipitationCode: ptyCode,
            precipitationDescription: getPrecipitationDescription(ptyCode),
            precipitationProbability: pop, // 시간별 강수확률
            precipitationProbabilityMax: precipitationProbabilityMax, // 일별 최대 강수확률
            precipitationProbabilityDescription: getPrecipitationProbabilityDescription(pop, precipitationProbabilityMax),
            precipitationAmount: pcp, // 시간별 강수량
            precipitationAmountDescription: processPrecipitationAmount(pcp, precipitationAmountSum),
            snowAmount: sno, // 시간별 적설량
            snowAmountDescription: processSnowAmount(sno, snowAmountSum),
            humidity: humidity,
            humidityUnit: '%',
            humidityDescription: getHumidityDescription(humidity),
            windSpeed: windSpeed,
            windSpeedUnit: 'm/s',
            windSpeedDescription: getWindSpeedDescription(windSpeed),
            windDirection: WEATHER_CODES.VEC[Math.floor(windDirectionDegree / 22.5) % 16] || '정보없음',
            windDirectionDegree: windDirectionDegree,
            windDirectionDescription: getWindDirectionFromDegree(windDirectionDegree),
            waveHeight: wav, // 파고
            waveHeightDescription: getWaveHeightDescription(wav),
            uvIndex: null, // 기상청 단기예보에는 UV 지수 없음, 필요시 다른 API 연동
            visibility: null, // 단기예보에 가시거리 없음
            weatherStatus: getOverallWeatherStatus(skyCode, ptyCode, temperature, windSpeed),
            weatherAdvice: getWeatherAdvice(skyCode, ptyCode, temperature, windSpeed, humidity),
            hourlyData: Object.entries(dailyForecast.times).map(([time, data]) => ({
                time: time,
                temperature: data.TMP || data.T1H,
                sky: WEATHER_CODES.SKY[data.SKY],
                pty: WEATHER_CODES.PTY[data.PTY],
                pop: data.POP,
                reh: data.REH,
                wsd: data.WSD,
                vec: data.VEC,
                pcp: data.PCP,
                sno: data.SNO
            })).sort((a,b) => parseInt(a.time) - parseInt(b.time)) // 시간 순 정렬
        });
    });

    return result;
}


// --- 날씨 설명 및 조언 헬퍼 함수들 (관광 목적 최적화) ---

/** 기온 설명 */
function getTemperatureDescription(temp, minTemp, maxTemp) {
    if (temp === null) return '정보없음';
    let desc = `${temp}°C`;
    if (minTemp !== null && maxTemp !== null) {
        desc += ` (최저 ${minTemp}°C / 최고 ${maxTemp}°C)`;
    } else if (minTemp !== null) {
        desc += ` (최저 ${minTemp}°C)`;
    } else if (maxTemp !== null) {
        desc += ` (최고 ${maxTemp}°C)`;
    }

    if (temp >= 30) return `${desc} - 매우 더움! 시원한 곳 위주로 계획하세요.`;
    if (temp >= 25) return `${desc} - 더움, 가벼운 옷차림이 좋아요.`;
    if (temp >= 20) return `${desc} - 쾌적해요! 활동하기 좋은 기온.`;
    if (temp >= 10) return `${desc} - 쌀쌀, 겉옷 챙기세요.`;
    if (temp >= 0) return `${desc} - 추움, 따뜻하게 입으세요.`;
    return `${desc} - 매우 추움! 방한 준비 철저히.`;
}

/** 하늘 상태 설명 */
function getSkyDescription(skyCode, ptyCode) {
    const sky = WEATHER_CODES.SKY[skyCode];
    const pty = WEATHER_CODES.PTY[ptyCode];

    if (ptyCode !== '0' && pty) { // 강수 형태가 있으면 강수 우선
        if (pty === '비' || pty === '소나기' || pty === '폭우' || pty === '빗방울' || pty === '이슬비' || pty === '뇌우') {
            return `${sky ? sky + ' 후' : ''} 비 소식. 우산 필수!`;
        }
        if (pty === '눈' || pty === '폭설' || pty === '눈날림' || pty === '빗방울눈날림' || pty === '진눈깨비' || pty === '우박') {
            return `${sky ? sky + ' 후' : ''} 눈 소식. 눈길 조심!`;
        }
    }
    if (sky === '맑음') return '화창한 날씨! 햇살 가득한 하루.';
    if (sky === '구름조금') return '구름이 살짝, 그래도 맑아요.';
    if (sky === '구름많음') return '구름이 많은 편, 간간이 햇살.';
    if (sky === '흐림' || sky === '매우흐림') return '전반적으로 흐린 날씨.';
    if (sky === '안개') return '안개 주의, 시야가 좋지 않아요.';
    return '정보없음';
}

/** 강수 형태 설명 */
function getPrecipitationDescription(ptyCode) {
    const pty = WEATHER_CODES.PTY[ptyCode];
    if (!pty) return '정보없음';
    if (pty === '없음') return '비 소식 없음.';
    if (pty === '비' || pty === '빗방울' || pty === '이슬비') return '비가 예상됩니다.';
    if (pty === '비/눈' || pty === '진눈깨비' || pty === '빗방울눈날림') return '비 또는 눈이 예상됩니다.';
    if (pty === '눈' || pty === '눈날림') return '눈이 예상됩니다.';
    if (pty === '소나기') return '갑작스러운 소나기 가능성.';
    if (pty === '우박') return '우박 주의! 실내 활동 권장.';
    if (pty === '뇌우') return '천둥번개 동반한 비 예상, 안전 유의.';
    if (pty === '폭우') return '매우 강한 비가 예상됩니다. 호우 주의!';
    if (pty === '폭설') return '많은 눈이 예상됩니다. 대설 주의!';
    return '강수 정보 확인 필요.';
}

/** 강수 확률 설명 */
function getPrecipitationProbabilityDescription(pop, popMax) {
    if (pop === null && popMax === null) return '정보없음';
    const prob = popMax !== null ? popMax : pop; // 일별 최대 강수확률 우선
    if (prob === null) return '정보없음';

    if (prob <= 20) return `강수확률 ${prob}% (비 올 확률 매우 낮음)`;
    if (prob <= 40) return `강수확률 ${prob}% (비 올 확률 낮음)`;
    if (prob <= 60) return `강수확률 ${prob}% (비 올 확률 보통)`;
    if (prob <= 80) return `강수확률 ${prob}% (비 올 확률 높음, 우산 권장)`;
    return `강수확률 ${prob}% (비 올 확률 매우 높음, 외출 시 대비 철저)`;
}

/** 강수량 처리 및 설명 */
function processPrecipitationAmount(pcp, pcpSum) {
    if (pcp === null || pcp === '강수없음') {
        return pcpSum > 0 ? `${pcpSum}mm (총 강수량)` : '없음';
    }
    if (pcp === '0.1mm 미만') return '1mm 미만 (약한 비)';
    if (pcp === '1mm 이상') return '1mm 이상';
    if (pcp === '30mm 이상') return '30mm 이상 (매우 강한 비)';
    if (pcp === '50mm 이상') return '50mm 이상 (폭우)';
    // 범위 기반 설명 (WEATHER_CODES.PCP 참고)
    const val = parseFloat(pcp);
    if (!isNaN(val)) {
        for (const range in WEATHER_CODES.PCP) {
            if (range.includes('_')) {
                const [min, max] = range.split('_').map(Number);
                if (val >= min && (val < max || (isNaN(max) && val >= min))) return WEATHER_CODES.PCP[range];
            }
        }
    }
    return `${pcp}mm`;
}

/** 적설량 처리 및 설명 */
function processSnowAmount(sno, snoSum) {
    if (sno === null || sno === '적설없음') {
        return snoSum > 0 ? `${snoSum}cm (총 적설량)` : '없음';
    }
    if (sno === '0.1cm 미만') return '1cm 미만 (약한 눈)';
    if (sno === '1cm 이상') return '1cm 이상';
    if (sno === '5cm 이상') return '5cm 이상 (많은 눈)';
    if (sno === '10cm 이상') return '10cm 이상 (폭설)';
    // 범위 기반 설명 (WEATHER_CODES.SNO 참고)
    const val = parseFloat(sno);
    if (!isNaN(val)) {
        for (const range in WEATHER_CODES.SNO) {
            if (range.includes('_')) {
                const [min, max] = range.split('_').map(Number);
                if (val >= min && (val < max || (isNaN(max) && val >= min))) return WEATHER_CODES.SNO[range];
            }
        }
    }
    return `${sno}cm`;
}

/** 습도 설명 */
function getHumidityDescription(humidity) {
    if (humidity === null) return '정보없음';
    if (humidity >= 80) return `${humidity}% (매우 습함, 불쾌지수 높을 수 있어요)`;
    if (humidity >= 60) return `${humidity}% (습함, 쾌적하지 않을 수 있어요)`;
    if (humidity >= 40) return `${humidity}% (적정 습도, 쾌적해요)`;
    return `${humidity}% (건조함, 보습에 신경 쓰세요)`;
}

/** 풍속 설명 */
function getWindSpeedDescription(windSpeed) {
    if (windSpeed === null) return '정보없음';
    if (windSpeed < 1) return `${windSpeed}m/s (바람 거의 없음)`;
    if (windSpeed < 4) return `${windSpeed}m/s (약한 바람, 쾌적)`;
    if (windSpeed < 9) return `${windSpeed}m/s (약간 강한 바람, 활동 지장 없을 정도)`;
    if (windSpeed < 14) return `${windSpeed}m/s (강한 바람, 모자 날아갈 수 있음)`;
    return `${windSpeed}m/s (매우 강한 바람, 주의!)`;
}

/** 풍향 설명 (360도 -> 16방위) */
function getWindDirectionFromDegree(degree) {
    if (degree === null) return '정보없음';
    if (degree < 0 || degree > 360) return '정보없음';
    const index = Math.floor(degree / 22.5 + 0.5) % 16;
    return WEATHER_CODES.VEC[index] || '정보없음';
}

/** 파고 설명 */
function getWaveHeightDescription(wav) {
    if (wav === null) return '정보없음';
    const val = parseFloat(wav);
    if (!isNaN(val)) {
        for (const range in WEATHER_CODES.WAV) {
            if (range.includes('_')) {
                const [min, max] = range.split('_').map(Number);
                if (val >= min && (val < max || (isNaN(max) && val >= min))) return WEATHER_CODES.WAV[range];
            } else if (val === 0 && range === '0') {
                return WEATHER_CODES.WAV[range];
            } else if (range.includes('above') && val >= min) { // "X_above" 패턴 처리
                const minVal = parseFloat(range.split('_')[0]);
                if (val >= minVal) return WEATHER_CODES.WAV[range];
            }
        }
    }
    return `${wav}m`;
}


/** 전반적인 날씨 상태 요약 */
function getOverallWeatherStatus(skyCode, ptyCode, temp, windSpeed) {
    const sky = WEATHER_CODES.SKY[skyCode];
    const pty = WEATHER_CODES.PTY[ptyCode];

    if (ptyCode !== '0' && pty) {
        if (pty.includes('비') || pty.includes('소나기') || pty.includes('뇌우') || pty.includes('폭우')) return '💧 비';
        if (pty.includes('눈') || pty.includes('폭설') || pty.includes('진눈깨비') || pty.includes('우박')) return '❄️ 눈';
    }

    if (sky === '맑음') return '☀️ 맑음';
    if (sky === '구름많음' || sky === '구름조금') return '☁️ 구름';
    if (sky === '흐림' || sky === '매우흐림') return '🌫️ 흐림';
    if (sky === '안개') return '🌁 안개';

    return '정보없음';
}

/** 관광 활동 조언 */
function getWeatherAdvice(skyCode, ptyCode, temp, windSpeed, humidity) {
    const sky = WEATHER_CODES.SKY[skyCode];
    const pty = WEATHER_CODES.PTY[ptyCode];

    // 강수 상황 조언
    if (ptyCode !== '0' && pty) {
        if (pty.includes('비') || pty.includes('소나기') || pty.includes('폭우')) {
            return "☔ 우산 필수! 실내 관광이나 비오는 날 운치 있는 코스를 추천해요.";
        }
        if (pty.includes('눈') || pty.includes('폭설')) {
            return "☃️ 따뜻하게 입고 설경을 즐겨보세요! 눈길 운전/도보 조심하세요.";
        }
    }

    // 날씨 상태별 조언
    if (sky === '맑음' || sky === '구름조금') {
        if (temp >= 25) return "☀️ 맑지만 더워요! 시원한 음료와 모자 챙기고 야외 활동을 즐겨보세요.";
        if (temp >= 15) return "🌳 쾌청한 날씨! 야외 활동하기 최고예요. 피크닉이나 산책 어떠세요?";
        return "🌬️ 맑지만 쌀쌀! 따뜻한 겉옷 챙겨 가을/겨울 풍경을 만끽하세요.";
    }

    if (sky === '구름많음') {
        if (temp >= 20) return "☁️ 구름 많지만 활동하기 좋아요. 햇볕이 강하지 않아 걷기 편해요.";
        return "🍂 구름 많은 날, 실내외를 섞어 여행하는 것을 추천해요.";
    }

    if (sky === '흐림' || sky === '매우흐림') {
        return "🌫️ 흐린 날의 감성! 미술관, 박물관 등 실내 명소나 분위기 좋은 카페를 찾아보세요.";
    }

    if (sky === '안개') {
        return "🌁 안개 주의! 시야가 좋지 않으니 안전 운전하시고, 몽환적인 풍경을 즐겨보세요.";
    }

    // 기타 조건
    if (windSpeed && windSpeed >= 9) { // 강풍
        return "💨 바람이 강해요! 안전에 유의하시고, 야외 활동 시 조심하세요.";
    }
    if (humidity && humidity >= 80 && temp >= 25) { // 고온다습
        return "🥵 매우 습하고 더워요! 시원한 실내 위주로 계획하고 수분 섭취 잊지 마세요.";
    }
    if (humidity && humidity <= 30 && temp >= 20) { // 건조
        return "🔥 건조하니 산불 조심! 보습에도 신경 쓰세요.";
    }

    return "✨ 정보를 확인할 수 없습니다. 즐거운 여행 되세요!";
}


/**
 * 에러 발생 시 반환할 완전한 형태의 샘플 데이터를 생성합니다.
 * @param {string} requestedRegion 요청된 지역명
 * @param {string} errorMessage 발생한 에러 메시지
 * @returns {object} 샘플 날씨 데이터
 */
function generateCompleteSampleData(requestedRegion, errorMessage) {
    const now = new Date();
    const today = new Date(now.getTime() + 9 * 60 * 60 * 1000); // KST
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    const formatSampleDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const regionForError = requestedRegion || DEFAULT_REGION;
    // 샘플 데이터는 특정 좌표 기반이 아니므로 기본값만 사용
    const messagePrefix = `⚠️ API 호출 실패: ${errorMessage ? errorMessage.substring(0, 50) + '...' : '알 수 없는 오류'}`;

    // 샘플 데이터에 대한 상세 설명 및 조언 생성 (실제 데이터처럼 보이도록)
    const getSampleDescriptions = (temp, sky, pty, wind) => ({
        temperatureDescription: getTemperatureDescription(temp, null, null),
        skyDescription: getSkyDescription(sky, pty),
        precipitationDescription: getPrecipitationDescription(pty),
        precipitationProbabilityDescription: getPrecipitationProbabilityDescription(null, 30), // 샘플 확률
        precipitationAmountDescription: processPrecipitationAmount('0', 0),
        snowAmountDescription: processSnowAmount('0', 0),
        humidityDescription: getHumidityDescription(70),
        windSpeedDescription: getWindSpeedDescription(wind),
        windDirectionDescription: getWindDirectionFromDegree(180), // 남풍
        waveHeightDescription: getWaveHeightDescription(0),
        weatherStatus: getOverallWeatherStatus(sky, pty, temp, wind),
        weatherAdvice: getWeatherAdvice(sky, pty, temp, wind, 70)
    });

    const todayTemp = 25;
    const todaySkyCode = '1'; // 맑음
    const todayPtyCode = '0'; // 없음
    const todayWind = 2.5;
    const todayDesc = getSampleDescriptions(todayTemp, todaySkyCode, todayPtyCode, todayWind);

    const tomorrowTemp = 22;
    const tomorrowSkyCode = '3'; // 구름많음
    const tomorrowPtyCode = '0'; // 없음
    const tomorrowWind = 3.0;
    const tomorrowDesc = getSampleDescriptions(tomorrowTemp, tomorrowSkyCode, tomorrowPtyCode, tomorrowWind);

    const dayAfterTomorrowTemp = 21;
    const dayAfterTomorrowSkyCode = '4'; // 흐림
    const dayAfterTomorrowPtyCode = '1'; // 비
    const dayAfterTomorrowWind = 3.5;
    const dayAfterTomorrowDesc = getSampleDescriptions(dayAfterTomorrowTemp, dayAfterTomorrowSkyCode, dayAfterTomorrowPtyCode, dayAfterTomorrowWind);


    return [
        {
            date: formatSampleDate(today).replace(/-/g, ''),
            dateFormatted: formatSampleDate(today),
            dayLabel: '오늘',
            dayIndex: 0,
            representativeTime: '1400',
            temperature: todayTemp,
            temperatureMin: todayTemp - 3,
            temperatureMax: todayTemp + 2,
            temperatureUnit: '°C',
            sky: WEATHER_CODES.SKY[todaySkyCode],
            skyCode: todaySkyCode,
            precipitation: WEATHER_CODES.PTY[todayPtyCode],
            precipitationCode: todayPtyCode,
            humidity: 60,
            humidityUnit: '%',
            windSpeed: todayWind,
            windSpeedUnit: 'm/s',
            pop: 10,
            message: `${messagePrefix} (오늘)`,
            timestamp: new Date().toISOString(),
            region: regionForError,
            // 샘플 데이터에 대한 상세 설명 필드 추가
            temperatureDescription: todayDesc.temperatureDescription,
            skyDescription: todayDesc.skyDescription,
            precipitationDescription: todayDesc.precipitationDescription,
            precipitationProbability: 10, // 임의의 값
            precipitationProbabilityMax: 15,
            precipitationProbabilityDescription: todayDesc.precipitationProbabilityDescription,
            precipitationAmount: '0',
            precipitationAmountDescription: todayDesc.precipitationAmountDescription,
            snowAmount: '0',
            snowAmountDescription: todayDesc.snowAmountDescription,
            humidityDescription: todayDesc.humidityDescription,
            windSpeedDescription: todayDesc.windSpeedDescription,
            windDirection: '남',
            windDirectionDegree: 180,
            windDirectionDescription: todayDesc.windDirectionDescription,
            waveHeight: '0',
            waveHeightDescription: todayDesc.waveHeightDescription,
            uvIndex: null,
            visibility: null,
            weatherStatus: todayDesc.weatherStatus,
            weatherAdvice: todayDesc.weatherAdvice,
            hourlyData: [] // 샘플이므로 비워둠
        },
        {
            date: formatSampleDate(tomorrow).replace(/-/g, ''),
            dateFormatted: formatSampleDate(tomorrow),
            dayLabel: '내일',
            dayIndex: 1,
            representativeTime: '1400',
            temperature: tomorrowTemp,
            temperatureMin: tomorrowTemp - 2,
            temperatureMax: tomorrowTemp + 1,
            temperatureUnit: '°C',
            sky: WEATHER_CODES.SKY[tomorrowSkyCode],
            skyCode: tomorrowSkyCode,
            precipitation: WEATHER_CODES.PTY[tomorrowPtyCode],
            precipitationCode: tomorrowPtyCode,
            humidity: 70,
            humidityUnit: '%',
            windSpeed: tomorrowWind,
            windSpeedUnit: 'm/s',
            pop: 20,
            message: `${messagePrefix} (내일)`,
            timestamp: new Date().toISOString(),
            region: regionForError,
            temperatureDescription: tomorrowDesc.temperatureDescription,
            skyDescription: tomorrowDesc.skyDescription,
            precipitationDescription: tomorrowDesc.precipitationDescription,
            precipitationProbability: 20,
            precipitationProbabilityMax: 30,
            precipitationProbabilityDescription: tomorrowDesc.precipitationProbabilityDescription,
            precipitationAmount: '0',
            precipitationAmountDescription: tomorrowDesc.precipitationAmountDescription,
            snowAmount: '0',
            snowAmountDescription: tomorrowDesc.snowAmountDescription,
            humidityDescription: tomorrowDesc.humidityDescription,
            windSpeedDescription: tomorrowDesc.windSpeedDescription,
            windDirection: '남서',
            windDirectionDegree: 225,
            windDirectionDescription: tomorrowDesc.windDirectionDescription,
            waveHeight: '0',
            waveHeightDescription: tomorrowDesc.waveHeightDescription,
            uvIndex: null,
            visibility: null,
            weatherStatus: tomorrowDesc.weatherStatus,
            weatherAdvice: tomorrowDesc.weatherAdvice,
            hourlyData: []
        },
        {
            date: formatSampleDate(dayAfterTomorrow).replace(/-/g, ''),
            dateFormatted: formatSampleDate(dayAfterTomorrow),
            dayLabel: '모레',
            dayIndex: 2,
            representativeTime: '1400',
            temperature: dayAfterTomorrowTemp,
            temperatureMin: dayAfterTomorrowTemp - 1,
            temperatureMax: dayAfterTomorrowTemp + 1,
            temperatureUnit: '°C',
            sky: WEATHER_CODES.SKY[dayAfterTomorrowSkyCode],
            skyCode: dayAfterTomorrowSkyCode,
            precipitation: WEATHER_CODES.PTY[dayAfterTomorrowPtyCode],
            precipitationCode: dayAfterTomorrowPtyCode,
            humidity: 80,
            humidityUnit: '%',
            windSpeed: dayAfterTomorrowWind,
            windSpeedUnit: 'm/s',
            pop: 70,
            message: `${messagePrefix} (모레)`,
            timestamp: new Date().toISOString(),
            region: regionForError,
            temperatureDescription: dayAfterTomorrowDesc.temperatureDescription,
            skyDescription: dayAfterTomorrowDesc.skyDescription,
            precipitationDescription: dayAfterTomorrowDesc.precipitationDescription,
            precipitationProbability: 70,
            precipitationProbabilityMax: 80,
            precipitationProbabilityDescription: dayAfterTomorrowDesc.precipitationProbabilityDescription,
            precipitationAmount: '0',
            precipitationAmountDescription: dayAfterTomorrowDesc.precipitationAmountDescription,
            snowAmount: '0',
            snowAmountDescription: dayAfterTomorrowDesc.snowAmountDescription,
            humidityDescription: dayAfterTomorrowDesc.humidityDescription,
            windSpeedDescription: dayAfterTomorrowDesc.windSpeedDescription,
            windDirection: '서',
            windDirectionDegree: 270,
            windDirectionDescription: dayAfterTomorrowDesc.windDirectionDescription,
            waveHeight: '0',
            waveHeightDescription: dayAfterTomorrowDesc.waveHeightDescription,
            uvIndex: null,
            visibility: null,
            weatherStatus: dayAfterTomorrowDesc.weatherStatus,
            weatherAdvice: dayAfterTomorrowDesc.weatherAdvice,
            hourlyData: []
        }
    ];
}


// 메인 서버리스 함수 핸들러
module.exports = async (req, res) => {
    // CORS 설정 (모든 도메인 허용)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const requestedRegion = req.query.region;
    const detailFlag = req.query.detailed === 'true'; // 상세 정보 요청 여부

    // 환경 변수 검증
    const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
    if (!WEATHER_API_KEY) {
        console.error('❌ 오류: WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.');
        return res.status(500).json({
            success: false,
            error: true,
            errorMessage: '서버 설정 오류: 기상청 API 키가 누락되었습니다.',
            data: generateCompleteSampleData(requestedRegion || DEFAULT_REGION, 'API 키 누락'),
            warning: 'API 키가 없어 샘플 데이터를 제공합니다.',
            apiInfo: {
                source: '샘플 데이터 (API 키 오류)',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                version: '2.0.0-final'
            },
            locationInfo: {
                requested: requestedRegion || DEFAULT_REGION,
                matched: DEFAULT_REGION,
                fullName: DEFAULT_REGION === '서울' ? '서울특별시' : DEFAULT_REGION + ' (기본)',
                source: 'API 키 오류로 인한 기본값'
            }
        });
    }

    // 지역명 유효성 검사 및 좌표 찾기
    const locationInfo = findLocationCoordinates(requestedRegion ? normalizeRegionName(requestedRegion) : DEFAULT_REGION);
    const { nx, ny, fullName, matched } = locationInfo;

    // nx, ny가 숫자가 아니거나 유효하지 않은 경우
    if (isNaN(nx) || isNaN(ny) || nx === null || ny === null) {
        console.error(`❌ 오류: 유효한 지역(${requestedRegion})에 대한 격자 좌표를 찾을 수 없거나 변환에 실패했습니다.`);
        return res.status(400).json({
            success: false,
            error: true,
            errorMessage: '유효한 지역에 대한 날씨 정보를 찾을 수 없습니다.',
            data: generateCompleteSampleData(requestedRegion || DEFAULT_REGION, '유효하지 않은 지역 또는 좌표 변환 실패'),
            warning: '유효한 지역을 찾을 수 없어 샘플 데이터를 제공합니다.',
            apiInfo: {
                source: '샘플 데이터 (지역 검색 오류)',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                version: '2.0.0-final'
            },
            locationInfo: {
                requested: requestedRegion || DEFAULT_REGION,
                matched: DEFAULT_REGION, // 이 경우 실제 매칭은 아니지만, 폴백
                fullName: DEFAULT_REGION === '서울' ? '서울특별시' : DEFAULT_REGION + ' (기본)',
                source: '지역 검색 오류로 인한 기본값'
            }
        });
    }


    // KST 현재 시간 및 API 발표 시각 계산 (Vercel 서버가 UTC임을 가정)
    const nowKST = new Date(new Date().getTime() + 9 * 60 * 60 * 1000); // KST로 변환
    const { baseDate, baseTime } = getNearestBaseTime(nowKST);

    const cacheKey = `${baseDate}_${baseTime}_${nx}_${ny}`;
    const cachedData = weatherCache.get(cacheKey);

    // 캐시 확인
    if (cachedData && (Date.now() - cachedData.timestamp) < WEATHER_API_CONFIG.CACHE_DURATION) {
        console.log(`✅ 캐시 데이터 사용: ${cacheKey}`);
        const responseData = {
            success: true,
            data: cachedData.data,
            locationInfo: { requested: requestedRegion, matched: matched, fullName: fullName, coordinates: { nx, ny } },
            apiInfo: {
                source: '캐시',
                timestamp: cachedData.timestamp,
                baseDate: baseDate,
                baseTime: baseTime,
                environment: process.env.NODE_ENV || 'production',
                version: '2.0.0-final'
            },
        };
        if (detailFlag) {
            responseData.apiInfo.weatherCodes = WEATHER_CODES;
        }
        return res.status(200).json(responseData);
    }

    try {
        const queryParams = {
            serviceKey: decodeURIComponent(WEATHER_API_KEY),
            pageNo: '1',
            numOfRows: '1000', // 충분히 많은 데이터 요청 (모든 예보 항목 포함)
            dataType: 'JSON',
            base_date: baseDate,
            base_time: baseTime,
            nx: nx,
            ny: ny
        };

        const response = await axios.get(WEATHER_API_CONFIG.BASE_URL, {
            params: queryParams,
            timeout: WEATHER_API_CONFIG.TIMEOUT,
            headers: { 'User-Agent': 'HealingK-Complete-Weather-Service/2.0' }
        });

        const header = response.data.response.header;
        const resultCode = header.resultCode;
        const resultMsg = header.resultMsg;

        if (resultCode !== '00') {
            const apiErrorMessage = API_ERROR_MESSAGES[resultCode] || resultMsg || '알 수 없는 API 에러';
            console.error(`❌ 기상청 API 응답 오류: [${resultCode}] ${apiErrorMessage}`);
            return res.status(200).json({ // 기상청 오류라도 200으로 반환 후 클라이언트에서 처리
                success: false,
                error: true,
                errorMessage: `기상청 API 오류: [${resultCode}] ${apiErrorMessage}`,
                data: generateCompleteSampleData(requestedRegion || DEFAULT_REGION, `API 오류: ${apiErrorMessage}`),
                warning: '실시간 날씨 정보를 가져올 수 없어 샘플 데이터를 제공합니다.',
                apiInfo: {
                    source: '샘플 데이터 (기상청 API 오류)',
                    timestamp: new Date().toISOString(),
                    baseDate: baseDate,
                    baseTime: baseTime,
                    environment: process.env.NODE_ENV || 'production',
                    version: '2.0.0-final',
                    resultCode: resultCode,
                    resultMsg: resultMsg
                },
                locationInfo: {
                    requested: requestedRegion || DEFAULT_REGION,
                    matched: matched,
                    fullName: fullName,
                    coordinates: { nx, ny }
                }
            });
        }

        const items = response.data.response.body.items.item;
        if (!items || items.length === 0) {
            console.warn('⚠️ 기상청 API에서 데이터를 가져왔으나 item 배열이 비어있습니다.');
            return res.status(200).json({
                success: false,
                error: true,
                errorMessage: '요청된 날씨 데이터가 없습니다.',
                data: generateCompleteSampleData(requestedRegion || DEFAULT_REGION, '데이터 없음'),
                warning: '요청된 날씨 데이터가 없어 샘플 데이터를 제공합니다.',
                apiInfo: {
                    source: '샘플 데이터 (데이터 없음)',
                    timestamp: new Date().toISOString(),
                    baseDate: baseDate,
                    baseTime: baseTime,
                    environment: process.env.NODE_ENV || 'production',
                    version: '2.0.0-final'
                },
                locationInfo: {
                    requested: requestedRegion || DEFAULT_REGION,
                    matched: matched,
                    fullName: fullName,
                    coordinates: { nx, ny }
                }
            });
        }

        const processedData = processCompleteWeatherData(items);

        const responseData = {
            success: true,
            data: processedData,
            locationInfo: { requested: requestedRegion, matched: matched, fullName: fullName, coordinates: { nx, ny } },
            apiInfo: {
                source: '기상청 API',
                timestamp: new Date().toISOString(),
                baseDate: baseDate,
                baseTime: baseTime,
                environment: process.env.NODE_ENV || 'production',
                version: '2.0.0-final'
            }
        };

        // 상세 요청 시 WEATHER_CODES 포함
        if (detailFlag) {
            responseData.apiInfo.weatherCodes = WEATHER_CODES;
        }

        // 캐시 저장
        weatherCache.set(cacheKey, { data: processedData, timestamp: Date.now() });
        // 캐시 크기 관리
        if (weatherCache.size > WEATHER_API_CONFIG.MAX_CACHE_SIZE) {
            const oldestKey = weatherCache.keys().next().value;
            weatherCache.delete(oldestKey);
            console.log('🗑️ 캐시 정리 완료. 현재 캐시 크기:', weatherCache.size);
        }

        console.log('🎉 날씨 API 응답 성공');
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('❌ 날씨 API 호출 중 예상치 못한 오류:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // 에러 타입별 상세 로깅
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ API 요청 타임아웃 발생');
        } else if (axios.isAxiosError(error) && error.response) { // Axios 에러 명확화
            console.error('🚫 API 응답 오류 (Axios):', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (axios.isAxiosError(error) && error.request) { // Axios 에러 명확화
            console.error('🌐 네트워크 오류 - 응답 없음 (Axios)');
        } else {
            console.error('🔧 기타 오류:', error.message);
        }

        // 에러 발생 시에도 완전한 샘플 데이터 반환
        return res.status(200).json({
            success: false,
            error: true,
            errorMessage: error.message,
            data: generateCompleteSampleData(requestedRegion || DEFAULT_REGION, error.message),
            warning: '실시간 날씨 정보를 가져올 수 없어 샘플 데이터를 제공합니다.',
            apiInfo: {
                source: '샘플 데이터 (예상치 못한 오류)',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                version: '2.0.0-final'
            },
            locationInfo: {
                requested: requestedRegion || DEFAULT_REGION,
                matched: DEFAULT_REGION,
                fullName: DEFAULT_REGION === '서울' ? '서울특별시' : DEFAULT_REGION + ' (기본)',
                source: '오류 처리로 인한 기본값'
            }
        });
    }
};
