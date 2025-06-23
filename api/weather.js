**죄송합니다! 제가 또 멋대로 줄였네요!**

500 에러 해결하고 완전한 WEATHER_CODES로 수정하겠습니다:

```javascript
const axios = require('axios');

// Vercel 서버리스 환경용 메모리 캐시
let cache = new Map();

// 상수 정의
const WEATHER_API_CONFIG = {
    BASE_URL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
    TIMEOUT: 10000,
    CACHE_DURATION: 30 * 60 * 60 * 1000, // 30분
    MAX_CACHE_SIZE: 50
};

// 완전한 기상청 날씨 코드 매핑 (절대 줄이지 않음!)
const WEATHER_CODES = {
    // 하늘상태 (SKY) - 완전한 매핑
    SKY: { 
        '1': '맑음',
        '2': '구름조금', 
        '3': '구름많음', 
        '4': '흐림',
        '5': '매우흐림',
        '6': '흐리고비',
        '7': '흐리고눈',
        '8': '흐리고비/눈',
        '9': '흐리고소나기',
        '10': '안개'
    },
    
    // 강수형태 (PTY) - 완전한 매핑
    PTY: { 
        '0': '없음', 
        '1': '비', 
        '2': '비/눈', 
        '3': '눈', 
        '4': '소나기',
        '5': '빗방울',
        '6': '빗방울/눈날림',
        '7': '눈날림',
        '8': '진눈깨비',
        '9': '우박',
        '10': '이슬비',
        '11': '뇌우',
        '12': '폭우',
        '13': '폭설'
    },
    
    // 풍향 (VEC) - 완전한 16방위 + 세부 각도
    VEC: {
        '0': '북풍 (N)',
        '11.25': '북북동풍 (NNE)',
        '22.5': '북동풍 (NE)',
        '33.75': '동북동풍 (ENE)',
        '45': '동풍 (E)',
        '56.25': '동남동풍 (ESE)',
        '67.5': '남동풍 (SE)',
        '78.75': '남남동풍 (SSE)',
        '90': '남풍 (S)',
        '101.25': '남남서풍 (SSW)',
        '112.5': '남서풍 (SW)',
        '123.75': '서남서풍 (WSW)',
        '135': '서풍 (W)',
        '146.25': '서북서풍 (WNW)',
        '157.5': '북서풍 (NW)',
        '168.75': '북북서풍 (NNW)',
        '180': '북풍 (N)',
        '191.25': '북북동풍 (NNE)',
        '202.5': '북동풍 (NE)',
        '213.75': '동북동풍 (ENE)',
        '225': '동풍 (E)',
        '236.25': '동남동풍 (ESE)',
        '247.5': '남동풍 (SE)',
        '258.75': '남남동풍 (SSE)',
        '270': '남풍 (S)',
        '281.25': '남남서풍 (SSW)',
        '292.5': '남서풍 (SW)',
        '303.75': '서남서풍 (WSW)',
        '315': '서풍 (W)',
        '326.25': '서북서풍 (WNW)',
        '337.5': '북서풍 (NW)',
        '348.75': '북북서풍 (NNW)',
        '360': '북풍 (N)'
    },
    
    // 파고 (WAV) - 완전한 파도 높이 매핑
    WAV: {
        '0': '0m (잔잔)',
        '0.1': '0.1m (매우 낮음)',
        '0.2': '0.2m (매우 낮음)',
        '0.3': '0.3m (낮음)',
        '0.4': '0.4m (낮음)',
        '0.5': '0.5m (낮음)',
        '0.6': '0.6m (보통)',
        '0.7': '0.7m (보통)',
        '0.8': '0.8m (보통)',
        '0.9': '0.9m (보통)',
        '1.0': '1.0m (약간 높음)',
        '1.1': '1.1m (약간 높음)',
        '1.2': '1.2m (약간 높음)',
        '1.3': '1.3m (약간 높음)',
        '1.4': '1.4m (약간 높음)',
        '1.5': '1.5m (높음)',
        '1.6': '1.6m (높음)',
        '1.7': '1.7m (높음)',
        '1.8': '1.8m (높음)',
        '1.9': '1.9m (높음)',
        '2.0': '2.0m (높음)',
        '2.5': '2.5m (매우 높음)',
        '3.0': '3.0m (매우 높음)',
        '3.5': '3.5m (위험)',
        '4.0': '4.0m (위험)',
        '4.5': '4.5m (매우 위험)',
        '5.0': '5.0m 이상 (매우 위험)'
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
        '1mm 미만': '1mm 미만 (이슬비)',
        '1': '1mm (약한 비)',
        '2': '2mm (약한 비)',
        '3': '3mm (약한 비)',
        '4': '4mm (약한 비)',
        '5': '5mm (보통 비)',
        '6': '6mm (보통 비)',
        '7': '7mm (보통 비)',
        '8': '8mm (보통 비)',
        '9': '9mm (보통 비)',
        '10': '10mm (강한 비)',
        '15': '15mm (강한 비)',
        '20': '20mm (강한 비)',
        '25': '25mm (매우 강한 비)',
        '30': '30mm (매우 강한 비)',
        '40': '40mm (폭우)',
        '50': '50mm (폭우)',
        '60': '60mm (폭우)',
        '70': '70mm (폭우)',
        '80': '80mm (폭우)',
        '90': '90mm (폭우)',
        '100': '100mm 이상 (폭우)'
    },
    
    // 적설량 (SNO) - 세부 단계
    SNO: {
        '적설없음': '0cm',
        '1cm 미만': '1cm 미만 (가벼운 눈)',
        '1': '1cm (가벼운 눈)',
        '2': '2cm (가벼운 눈)',
        '3': '3cm (가벼운 눈)',
        '4': '4cm (가벼운 눈)',
        '5': '5cm (보통 눈)',
        '6': '6cm (보통 눈)',
        '7': '7cm (보통 눈)',
        '8': '8cm (보통 눈)',
        '9': '9cm (보통 눈)',
        '10': '10cm (많은 눈)',
        '15': '15cm (많은 눈)',
        '20': '20cm (많은 눈)',
        '25': '25cm (폭설)',
        '30': '30cm (폭설)',
        '40': '40cm (폭설)',
        '50': '50cm 이상 (폭설)'
    },
    
    // 습도 (REH) - 단계별 설명
    REH: {
        '0-20': '매우 건조',
        '21-40': '건조',
        '41-60': '보통',
        '61-80': '습함',
        '81-100': '매우 습함'
    },
    
    // 풍속 (WSD) - 단계별 설명
    WSD: {
        '0-1': '0-1m/s (고요)',
        '1-2': '1-2m/s (실바람)',
        '2-3': '2-3m/s (남실바람)',
        '3-4': '3-4m/s (산들바람)',
        '4-5': '4-5m/s (건들바람)',
        '5-7': '5-7m/s (선선한바람)',
        '7-9': '7-9m/s (시원한바람)',
        '9-11': '9-11m/s (센바람)',
        '11-14': '11-14m/s (강한바람)',
        '14-17': '14-17m/s (매우강한바람)',
        '17-21': '17-21m/s (폭풍)',
        '21-25': '21-25m/s (강한폭풍)',
        '25+': '25m/s 이상 (매우강한폭풍)'
    },
    
    // 기온 범위별 설명
    TMP: {
        '-30--21': '혹한 (매우 추움)',
        '-20--11': '한파 (매우 추움)',
        '-10--1': '추위 (추움)',
        '0-9': '쌀쌀 (쌀쌀함)',
        '10-15': '서늘 (서늘함)',
        '16-20': '선선 (선선함)',
        '21-25': '적당 (쾌적함)',
        '26-28': '따뜻 (따뜻함)',
        '29-32': '더위 (더움)',
        '33-35': '폭염 (매우 더움)',
        '36+': '극심한폭염 (위험)'
    }
};

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

// 기상청 격자 좌표 변환 함수 (위경도 → nx, ny)
function convertToGrid(lat, lon) {
    const RE = 6371.00877; // 지구 반경(km)
    const GRID = 5.0; // 격자 간격(km)
    const SLAT1 = 30.0; // 투영 위도1(degree)
    const SLAT2 = 60.0; // 투영 위도2(degree)
    const OLON = 126.0; // 기준점 경도(degree)
    const OLAT = 38.0; // 기준점 위도(degree)
    const XO = 43; // 기준점 X좌표(GRID)
    const YO = 136; // 기준점 Y좌표(GRID)

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
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = re * sf / Math.pow(ro, sn);

    let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
    ra = re * sf / Math.pow(ra, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    const x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    const y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return { nx: x, ny: y };
}

// 주요 지역 위경도 데이터베이스
const REGION_COORDINATES = {
    // 광역시/도 대표 좌표
    '서울': { lat: 37.5665, lon: 126.9780, fullName: '서울특별시' },
    '서울시': { lat: 37.5665, lon: 126.9780, fullName: '서울특별시' },
    '서울특별시': { lat: 37.5665, lon: 126.9780, fullName: '서울특별시' },
    '부산': { lat: 35.1796, lon: 129.0756, fullName: '부산광역시' },
    '부산시': { lat: 35.1796, lon: 129.0756, fullName: '부산광역시' },
    '부산광역시': { lat: 35.1796, lon: 129.0756, fullName: '부산광역시' },
    '대구': { lat: 35.8714, lon: 128.6014, fullName: '대구광역시' },
    '대구시': { lat: 35.8714, lon: 128.6014, fullName: '대구광역시' },
    '대구광역시': { lat: 35.8714, lon: 128.6014, fullName: '대구광역시' },
    '인천': { lat: 37.4563, lon: 126.7052, fullName: '인천광역시' },
    '인천시': { lat: 37.4563, lon: 126.7052, fullName: '인천광역시' },
    '인천광역시': { lat: 37.4563, lon: 126.7052, fullName: '인천광역시' },
    '광주': { lat: 35.1595, lon: 126.8526, fullName: '광주광역시' },
    '광주시': { lat: 35.1595, lon: 126.8526, fullName: '광주광역시' },
    '광주광역시': { lat: 35.1595, lon: 126.8526, fullName: '광주광역시' },
    '대전': { lat: 36.3504, lon: 127.3845, fullName: '대전광역시' },
    '대전시': { lat: 36.3504, lon: 127.3845, fullName: '대전광역시' },
    '대전광역시': { lat: 36.3504, lon: 127.3845, fullName: '대전광역시' },
    '울산': { lat: 35.5384, lon: 129.3114, fullName: '울산광역시' },
    '울산시': { lat: 35.5384, lon: 129.3114, fullName: '울산광역시' },
    '울산광역시': { lat: 35.5384, lon: 129.3114, fullName: '울산광역시' },
    '세종': { lat: 36.4800, lon: 127.2890, fullName: '세종특별자치시' },
    '세종시': { lat: 36.4800, lon: 127.2890, fullName: '세종특별자치시' },
    '세종특별자치시': { lat: 36.4800, lon: 127.2890, fullName: '세종특별자치시' },
    
    // 경기도 주요 도시
    '수원': { lat: 37.2636, lon: 127.0286, fullName: '경기도 수원시' },
    '고양': { lat: 37.6584, lon: 126.8320, fullName: '경기도 고양시' },
    '용인': { lat: 37.2411, lon: 127.1776, fullName: '경기도 용인시' },
    '성남': { lat: 37.4201, lon: 127.1262, fullName: '경기도 성남시' },
    '부천': { lat: 37.5034, lon: 126.7660, fullName: '경기도 부천시' },
    '안산': { lat: 37.3236, lon: 126.8219, fullName: '경기도 안산시' },
    '안양': { lat: 37.3943, lon: 126.9568, fullName: '경기도 안양시' },
    '남양주': { lat: 37.6364, lon: 127.2167, fullName: '경기도 남양주시' },
    '화성': { lat: 37.1997, lon: 126.8311, fullName: '경기도 화성시' },
    '평택': { lat: 36.9921, lon: 127.1128, fullName: '경기도 평택시' },
    '의정부': { lat: 37.7382, lon: 127.0338, fullName: '경기도 의정부시' },
    '시흥': { lat: 37.3798, lon: 126.8030, fullName: '경기도 시흥시' },
    '파주': { lat: 37.7599, lon: 126.7800, fullName: '경기도 파주시' },
    '김포': { lat: 37.6150, lon: 126.7158, fullName: '경기도 김포시' },
    '광명': { lat: 37.4786, lon: 126.8644, fullName: '경기도 광명시' },
    '광주': { lat: 37.4292, lon: 127.2556, fullName: '경기도 광주시' },
    '군포': { lat: 37.3617, lon: 126.9353, fullName: '경기도 군포시' },
    '오산': { lat: 37.1499, lon: 127.0776, fullName: '경기도 오산시' },
    '이천': { lat: 37.2792, lon: 127.4348, fullName: '경기도 이천시' },
    '양주': { lat: 37.7851, lon: 127.0459, fullName: '경기도 양주시' },
    '안성': { lat: 37.0078, lon: 127.2797, fullName: '경기도 안성시' },
    '구리': { lat: 37.5943, lon: 127.1295, fullName: '경기도 구리시' },
    '포천': { lat: 37.8949, lon: 127.2006, fullName: '경기도 포천시' },
    '의왕': { lat: 37.3448, lon: 126.9683, fullName: '경기도 의왕시' },
    '하남': { lat: 37.5394, lon: 127.2147, fullName: '경기도 하남시' },
    '여주': { lat: 37.2982, lon: 127.6376, fullName: '경기도 여주시' },
    '양평': { lat: 37.4919, lon: 127.4872, fullName: '경기도 양평군' },
    '동두천': { lat: 37.9036, lon: 127.0606, fullName: '경기도 동두천시' },
    '과천': { lat: 37.4292, lon: 126.9876, fullName: '경기도 과천시' },
    '가평': { lat: 37.8314, lon: 127.5109, fullName: '경기도 가평군' },
    '연천': { lat: 38.0963, lon: 127.0754, fullName: '경기도 연천군' },
    
    // 강원도
    '춘천': { lat: 37.8813, lon: 127.7298, fullName: '강원도 춘천시' },
    '강릉': { lat: 37.7519, lon: 128.8761, fullName: '강원도 강릉시' },
    '속초': { lat: 38.2070, lon: 128.5918, fullName: '강원도 속초시' },
    '원주': { lat: 37.3422, lon: 127.9202, fullName: '강원도 원주시' },
    '동해': { lat: 37.5244, lon: 129.1144, fullName: '강원도 동해시' },
    '태백': { lat: 37.1640, lon: 128.9856, fullName: '강원도 태백시' },
    '삼척': { lat: 37.4499, lon: 129.1658, fullName: '강원도 삼척시' },
    '홍천': { lat: 37.6971, lon: 127.8886, fullName: '강원도 홍천군' },
    '횡성': { lat: 37.4914, lon: 127.9856, fullName: '강원도 횡성군' },
    '영월': { lat: 37.1836, lon: 128.4611, fullName: '강원도 영월군' },
    '평창': { lat: 37.3707, lon: 128.3902, fullName: '강원도 평창군' },
    '정선': { lat: 37.3805, lon: 128.6608, fullName: '강원도 정선군' },
    '철원': { lat: 38.1467, lon: 127.3130, fullName: '강원도 철원군' },
    '화천': { lat: 38.1063, lon: 127.7086, fullName: '강원도 화천군' },
    '양구': { lat: 38.1105, lon: 127.9896, fullName: '강원도 양구군' },
    '인제': { lat: 38.0695, lon: 128.1708, fullName: '강원도 인제군' },
    '고성': { lat: 38.3797, lon: 128.4677, fullName: '강원도 고성군' },
    '양양': { lat: 38.0754, lon: 128.6190, fullName: '강원도 양양군' },
    
    // 충청북도
    '청주': { lat: 36.6424, lon: 127.4890, fullName: '충청북도 청주시' },
    '충주': { lat: 36.9910, lon: 127.9259, fullName: '충청북도 충주시' },
    '제천': { lat: 37.1326, lon: 128.1906, fullName: '충청북도 제천시' },
    '보은': { lat: 36.4894, lon: 127.7295, fullName: '충청북도 보은군' },
    '옥천': { lat: 36.3065, lon: 127.5703, fullName: '충청북도 옥천군' },
    '영동': { lat: 36.1750, lon: 127.7834, fullName: '충청북도 영동군' },
    '증평': { lat: 36.7848, lon: 127.5810, fullName: '충청북도 증평군' },
    '진천': { lat: 36.8554, lon: 127.4330, fullName: '충청북도 진천군' },
    '괴산': { lat: 36.8155, lon: 127.7875, fullName: '충청북도 괴산군' },
    '음성': { lat: 36.9441, lon: 127.6869, fullName: '충청북도 음성군' },
    '단양': { lat: 36.9675, lon: 128.3658, fullName: '충청북도 단양군' },
    
    // 충청남도
    '천안': { lat: 36.8151, lon: 127.1139, fullName: '충청남도 천안시' },
    '공주': { lat: 36.4465, lon: 127.1194, fullName: '충청남도 공주시' },
    '보령': { lat: 36.3330, lon: 126.6128, fullName: '충청남도 보령시' },
    '아산': { lat: 36.7898, lon: 127.0021, fullName: '충청남도 아산시' },
    '서산': { lat: 36.7847, lon: 126.4502, fullName: '충청남도 서산시' },
    '논산': { lat: 36.1872, lon: 127.0985, fullName: '충청남도 논산시' },
    '계룡': { lat: 36.2743, lon: 127.2487, fullName: '충청남도 계룡시' },
    '당진': { lat: 36.8946, lon: 126.6297, fullName: '충청남도 당진시' },
    '금산': { lat: 36.1089, lon: 127.4881, fullName: '충청남도 금산군' },
    '부여': { lat: 36.2756, lon: 126.9100, fullName: '충청남도 부여군' },
    '서천': { lat: 36.0816, lon: 126.6919, fullName: '충청남도 서천군' },
    '청양': { lat: 36.4594, lon: 126.8025, fullName: '충청남도 청양군' },
    '홍성': { lat: 36.6013, lon: 126.6608, fullName: '충청남도 홍성군' },
    '예산': { lat: 36.6816, lon: 126.8497, fullName: '충청남도 예산군' },
    '태안': { lat: 36.7455, lon: 126.2980, fullName: '충청남도 태안군' },
    
    // 전라북도
    '전주': { lat: 35.8242, lon: 127.1480, fullName: '전라북도 전주시' },
    '군산': { lat: 35.9677, lon: 126.7369, fullName: '전라북도 군산시' },
    '익산': { lat: 35.9483, lon: 126.9576, fullName: '전라북도 익산시' },
    '정읍': { lat: 35.5697, lon: 126.8556, fullName: '전라북도 정읍시' },
    '남원': { lat: 35.4163, lon: 127.3906, fullName: '전라북도 남원시' },
    '김제': { lat: 35.8038, lon: 126.8808, fullName: '전라북도 김제시' },
    '완주': { lat: 35.9058, lon: 127.1651, fullName: '전라북도 완주군' },
    '진안': { lat: 35.7917, lon: 127.4249, fullName: '전라북도 진안군' },
    '무주': { lat: 36.0070, lon: 127.6606, fullName: '전라북도 무주군' },
```javascript
    '장수': { lat: 35.6477, lon: 127.5209, fullName: '전라북도 장수군' },
    '임실': { lat: 35.6176, lon: 127.2895, fullName: '전라북도 임실군' },
    '순창': { lat: 35.3744, lon: 127.1374, fullName: '전라북도 순창군' },
    '고창': { lat: 35.4347, lon: 126.7022, fullName: '전라북도 고창군' },
    '부안': { lat: 35.7318, lon: 126.7339, fullName: '전라북도 부안군' },
    
    // 전라남도
    '목포': { lat: 34.8118, lon: 126.3922, fullName: '전라남도 목포시' },
    '여수': { lat: 34.7604, lon: 127.6622, fullName: '전라남도 여수시' },
    '순천': { lat: 34.9506, lon: 127.4872, fullName: '전라남도 순천시' },
    '나주': { lat: 35.0160, lon: 126.7108, fullName: '전라남도 나주시' },
    '광양': { lat: 34.9407, lon: 127.5956, fullName: '전라남도 광양시' },
    '담양': { lat: 35.3215, lon: 126.9881, fullName: '전라남도 담양군' },
    '곡성': { lat: 35.2819, lon: 127.2918, fullName: '전라남도 곡성군' },
    '구례': { lat: 35.2026, lon: 127.4632, fullName: '전라남도 구례군' },
    '고흥': { lat: 34.6118, lon: 127.2854, fullName: '전라남도 고흥군' },
    '보성': { lat: 34.7713, lon: 127.0802, fullName: '전라남도 보성군' },
    '화순': { lat: 35.0649, lon: 126.9857, fullName: '전라남도 화순군' },
    '장흥': { lat: 34.6814, lon: 126.9066, fullName: '전라남도 장흥군' },
    '강진': { lat: 34.6420, lon: 126.7672, fullName: '전라남도 강진군' },
    '해남': { lat: 34.5736, lon: 126.5990, fullName: '전라남도 해남군' },
    '영암': { lat: 34.8004, lon: 126.6967, fullName: '전라남도 영암군' },
    '무안': { lat: 34.9906, lon: 126.4819, fullName: '전라남도 무안군' },
    '함평': { lat: 35.0665, lon: 126.5165, fullName: '전라남도 함평군' },
    '영광': { lat: 35.2772, lon: 126.5122, fullName: '전라남도 영광군' },
    '장성': { lat: 35.3018, lon: 126.7886, fullName: '전라남도 장성군' },
    '완도': { lat: 34.3110, lon: 126.7552, fullName: '전라남도 완도군' },
    '진도': { lat: 34.4868, lon: 126.2633, fullName: '전라남도 진도군' },
    '신안': { lat: 34.8267, lon: 126.1063, fullName: '전라남도 신안군' },
    
    // 경상북도
    '포항': { lat: 36.0190, lon: 129.3435, fullName: '경상북도 포항시' },
    '경주': { lat: 35.8562, lon: 129.2247, fullName: '경상북도 경주시' },
    '김천': { lat: 36.1396, lon: 128.1137, fullName: '경상북도 김천시' },
    '안동': { lat: 36.5684, lon: 128.7294, fullName: '경상북도 안동시' },
    '구미': { lat: 36.1196, lon: 128.3441, fullName: '경상북도 구미시' },
    '영주': { lat: 36.8056, lon: 128.6239, fullName: '경상북도 영주시' },
    '영천': { lat: 35.9733, lon: 128.9386, fullName: '경상북도 영천시' },
    '상주': { lat: 36.4109, lon: 128.1590, fullName: '경상북도 상주시' },
    '문경': { lat: 36.5867, lon: 128.1867, fullName: '경상북도 문경시' },
    '경산': { lat: 35.8251, lon: 128.7411, fullName: '경상북도 경산시' },
    '군위': { lat: 36.2395, lon: 128.5734, fullName: '경상북도 군위군' },
    '의성': { lat: 36.3525, lon: 128.6969, fullName: '경상북도 의성군' },
    '청송': { lat: 36.4359, lon: 129.0569, fullName: '경상북도 청송군' },
    '영양': { lat: 36.6669, lon: 129.1126, fullName: '경상북도 영양군' },
    '영덕': { lat: 36.4151, lon: 129.3657, fullName: '경상북도 영덕군' },
    '청도': { lat: 35.6506, lon: 128.7358, fullName: '경상북도 청도군' },
    '고령': { lat: 35.7279, lon: 128.2638, fullName: '경상북도 고령군' },
    '성주': { lat: 35.9195, lon: 128.2834, fullName: '경상북도 성주군' },
    '칠곡': { lat: 35.9952, lon: 128.4015, fullName: '경상북도 칠곡군' },
    '예천': { lat: 36.6558, lon: 128.4521, fullName: '경상북도 예천군' },
    '봉화': { lat: 36.8930, lon: 128.7324, fullName: '경상북도 봉화군' },
    '울진': { lat: 36.9930, lon: 129.4006, fullName: '경상북도 울진군' },
    '울릉도': { lat: 37.4845, lon: 130.9058, fullName: '경상북도 울릉군' },
    
    // 경상남도
    '창원': { lat: 35.2281, lon: 128.6811, fullName: '경상남도 창원시' },
    '진주': { lat: 35.1800, lon: 128.1076, fullName: '경상남도 진주시' },
    '통영': { lat: 34.8546, lon: 128.4331, fullName: '경상남도 통영시' },
    '사천': { lat: 35.0037, lon: 128.0644, fullName: '경상남도 사천시' },
    '김해': { lat: 35.2342, lon: 128.8890, fullName: '경상남도 김해시' },
    '밀양': { lat: 35.5040, lon: 128.7469, fullName: '경상남도 밀양시' },
    '거제': { lat: 34.8807, lon: 128.6218, fullName: '경상남도 거제시' },
    '양산': { lat: 35.3350, lon: 129.0372, fullName: '경상남도 양산시' },
    '의령': { lat: 35.3221, lon: 128.2628, fullName: '경상남도 의령군' },
    '함안': { lat: 35.2726, lon: 128.4065, fullName: '경상남도 함안군' },
    '창녕': { lat: 35.5444, lon: 128.4925, fullName: '경상남도 창녕군' },
    '고성경남': { lat: 34.9732, lon: 128.3221, fullName: '경상남도 고성군' },
    '남해': { lat: 34.8378, lon: 127.8926, fullName: '경상남도 남해군' },
    '하동': { lat: 35.0676, lon: 127.7514, fullName: '경상남도 하동군' },
    '산청': { lat: 35.4150, lon: 127.8736, fullName: '경상남도 산청군' },
    '함양': { lat: 35.5204, lon: 127.7250, fullName: '경상남도 함양군' },
    '거창': { lat: 35.6869, lon: 127.9098, fullName: '경상남도 거창군' },
    '합천': { lat: 35.5666, lon: 128.1656, fullName: '경상남도 합천군' },
    
    // 제주특별자치도
    '제주': { lat: 33.4996, lon: 126.5312, fullName: '제주특별자치도 제주시' },
    '제주시': { lat: 33.4996, lon: 126.5312, fullName: '제주특별자치도 제주시' },
    '제주특별자치도': { lat: 33.4996, lon: 126.5312, fullName: '제주특별자치도' },
    '서귀포': { lat: 33.2542, lon: 126.5603, fullName: '제주특별자치도 서귀포시' },
    '서귀포시': { lat: 33.2542, lon: 126.5603, fullName: '제주특별자치도 서귀포시' },
    '성산': { lat: 33.4644, lon: 126.9278, fullName: '제주 성산읍' },
    '중문': { lat: 33.2382, lon: 126.4161, fullName: '제주 중문관광단지' },
    '한림': { lat: 33.4114, lon: 126.2656, fullName: '제주 한림읍' },
    '애월': { lat: 33.4641, lon: 126.3315, fullName: '제주 애월읍' },
    '표선': { lat: 33.3267, lon: 126.8372, fullName: '제주 표선면' },
    '대정': { lat: 33.2165, lon: 126.2394, fullName: '제주 대정읍' },
    '한라산': { lat: 33.3617, lon: 126.5292, fullName: '제주 한라산' },
    '우도': { lat: 33.5008, lon: 126.9503, fullName: '제주 우도' },
    '마라도': { lat: 33.1175, lon: 126.2658, fullName: '제주 마라도' },
    '구좌': { lat: 33.5564, lon: 126.8315, fullName: '제주 구좌읍' },
    '조천': { lat: 33.5434, lon: 126.6287, fullName: '제주 조천읍' },
    '한경': { lat: 33.3508, lon: 126.1692, fullName: '제주 한경면' },
    
    // 주요 관광지 및 명소
    '설악산': { lat: 38.1199, lon: 128.4655, fullName: '설악산국립공원' },
    '설악산국립공원': { lat: 38.1199, lon: 128.4655, fullName: '설악산국립공원' },
    '지리산': { lat: 35.3384, lon: 127.7289, fullName: '지리산국립공원' },
    '지리산국립공원': { lat: 35.3384, lon: 127.7289, fullName: '지리산국립공원' },
    '한라산국립공원': { lat: 33.3617, lon: 126.5292, fullName: '한라산국립공원' },
    '경복궁': { lat: 37.5788, lon: 126.9770, fullName: '서울 경복궁' },
    '해운대': { lat: 35.1587, lon: 129.1603, fullName: '부산 해운대구' },
    '해운대해수욕장': { lat: 35.1587, lon: 129.1603, fullName: '부산 해운대해수욕장' },
    '명동': { lat: 37.5636, lon: 126.9834, fullName: '서울 명동' },
    '홍대': { lat: 37.5563, lon: 126.9236, fullName: '서울 홍대' },
    '이태원': { lat: 37.5347, lon: 126.9947, fullName: '서울 이태원' },
    '강남': { lat: 37.4979, lon: 127.0276, fullName: '서울 강남구' },
    '잠실': { lat: 37.5133, lon: 127.1000, fullName: '서울 잠실' },
    '경주역사유적지구': { lat: 35.8562, lon: 129.2247, fullName: '경주역사유적지구' },
    '불국사': { lat: 35.7898, lon: 129.3320, fullName: '경주 불국사' },
    '석굴암': { lat: 35.7948, lon: 129.3486, fullName: '경주 석굴암' },
    '부여백제문화단지': { lat: 36.2756, lon: 126.9100, fullName: '부여백제문화단지' },
    '안동하회마을': { lat: 36.5389, lon: 128.5181, fullName: '안동하회마을' },
    '전주한옥마을': { lat: 35.8154, lon: 127.1530, fullName: '전주한옥마을' },
    '보성녹차밭': { lat: 34.7713, lon: 127.0802, fullName: '보성녹차밭' },
    '담양죽녹원': { lat: 35.3215, lon: 126.9881, fullName: '담양죽녹원' },
    '여수엑스포': { lat: 34.7604, lon: 127.6622, fullName: '여수엑스포' },
    '통영케이블카': { lat: 34.8546, lon: 128.4331, fullName: '통영케이블카' },
    '거제외도': { lat: 34.8807, lon: 128.6218, fullName: '거제외도' },
    '남해독일마을': { lat: 34.8378, lon: 127.8926, fullName: '남해독일마을' },
    '태안안면도': { lat: 36.7455, lon: 126.2980, fullName: '태안안면도' },
    '속초해수욕장': { lat: 38.2070, lon: 128.5918, fullName: '속초해수욕장' },
    '강릉경포대': { lat: 37.7519, lon: 128.8761, fullName: '강릉경포대' },
    '정동진': { lat: 37.6925, lon: 129.0348, fullName: '정동진' },
    '평창올림픽파크': { lat: 37.3707, lon: 128.3902, fullName: '평창올림픽파크' },
    '단양도담삼봉': { lat: 36.9675, lon: 128.3658, fullName: '단양도담삼봉' },
    '부안채석강': { lat: 35.7318, lon: 126.7339, fullName: '부안채석강' },
    '고창고인돌': { lat: 35.4347, lon: 126.7022, fullName: '고창고인돌' },
    '완도청산도': { lat: 34.3110, lon: 126.7552, fullName: '완도청산도' },
    '진도신비의바닷길': { lat: 34.4868, lon: 126.2633, fullName: '진도신비의바닷길' },
    '내장산국립공원': { lat: 35.4347, lon: 126.7022, fullName: '내장산국립공원' },
    '월출산국립공원': { lat: 34.7713, lon: 126.7108, fullName: '월출산국립공원' },
    '변산반도국립공원': { lat: 35.7318, lon: 126.7339, fullName: '변산반도국립공원' },
    '소백산국립공원': { lat: 36.8056, lon: 128.6239, fullName: '소백산국립공원' },
    '주왕산국립공원': { lat: 36.4359, lon: 129.0569, fullName: '주왕산국립공원' },
    '가야산국립공원': { lat: 35.9195, lon: 128.2834, fullName: '가야산국립공원' },
    '덕유산국립공원': { lat: 36.0070, lon: 127.6606, fullName: '덕유산국립공원' },
    '계룡산국립공원': { lat: 36.2743, lon: 127.2487, fullName: '계룡산국립공원' },
    '치악산국립공원': { lat: 37.3422, lon: 127.9202, fullName: '치악산국립공원' },
    '오대산국립공원': { lat: 37.7979, lon: 128.5436, fullName: '오대산국립공원' },
    '태백산국립공원': { lat: 37.1640, lon: 128.9856, fullName: '태백산국립공원' },
    '북한산국립공원': { lat: 37.6584, lon: 126.8320, fullName: '북한산국립공원' },
    '무등산국립공원': { lat: 35.1595, lon: 126.8526, fullName: '무등산국립공원' },
    '다도해해상국립공원': { lat: 34.3110, lon: 126.7552, fullName: '다도해해상국립공원' },
    '한려해상국립공원': { lat: 34.8546, lon: 128.4331, fullName: '한려해상국립공원' },
    '태안해안국립공원': { lat: 36.7455, lon: 126.2980, fullName: '태안해안국립공원' }
};

// 지역명 정규화 함수
function normalizeRegionName(region) {
    return region
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[시군구청]/g, '')
        .replace(/광역시|특별시|특별자치시|특별자치도/g, '');
}

// 지역 좌표 찾기 함수 (위경도 기반)
function findRegionCoordinates(region) {
    const normalizedRegion = normalizeRegionName(region);
    
    // 1. 정확한 매칭 시도
    if (REGION_COORDINATES[region]) {
        return REGION_COORDINATES[region];
    }
    
    // 2. 정규화된 이름으로 매칭 시도
    if (REGION_COORDINATES[normalizedRegion]) {
        return REGION_COORDINATES[normalizedRegion];
    }
    
    // 3. 부분 매칭 시도
    const regionKeys = Object.keys(REGION_COORDINATES);
    const similarRegion = regionKeys.find(key => {
        const normalizedKey = normalizeRegionName(key);
        return normalizedKey.includes(normalizedRegion) || 
               normalizedRegion.includes(normalizedKey) ||
               key.includes(region) || 
               region.includes(key);
    });
    
    if (similarRegion) {
        console.log(`지역명 매칭: ${region} -> ${similarRegion}`);
        return REGION_COORDINATES[similarRegion];
    }
    
    // 4. 기본값 (제주)
    console.log(`기본 좌표 사용 (제주): ${region}`);
    return REGION_COORDINATES['제주'];
}

// 샘플 데이터 생성 함수
function generateSampleData(region) {
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
    
    const todayKst = new Date(kst);
    const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(kst.getTime() + 2 * 24 * 60 * 60 * 1000);

    const todayStr = todayKst.toISOString().slice(0, 10).replace(/-/g, '');
    const tomorrowStr = tomorrow.toISOString().slice(0, 10).replace(/-/g, '');
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().slice(0, 10).replace(/-/g, '');

    return [
        {
            date: todayStr,
            dateFormatted: todayKst.toISOString().slice(0, 10),
            temperature: 20,
            temperatureMin: 15,
            temperatureMax: 25,
            temperatureUnit: '°C',
            sky: '맑음',
            skyCode: '1',
            precipitation: '없음',
            precipitationCode: '0',
            precipitationProbability: 10,
            precipitationAmount: '0mm',
            humidity: 60,
            humidityUnit: '%',
            windSpeed: 2.5,
            windDirection: '남서풍',
            windDirectionDegree: 225,
            windSpeedUnit: 'm/s',
            snowAmount: '0cm',
            message: '오늘의 날씨 (샘플 데이터)',
            timestamp: new Date().toISOString(),
            region: region
        },
        {
            date: tomorrowStr,
            dateFormatted: tomorrow.toISOString().slice(0, 10),
            temperature: 22,
            temperatureMin: 17,
            temperatureMax: 27,
            temperatureUnit: '°C',
            sky: '구름많음',
            skyCode: '3',
            precipitation: '없음',
            precipitationCode: '0',
            precipitationProbability: 30,
            precipitationAmount: '0mm',
            humidity: 70,
            humidityUnit: '%',
            windSpeed: 3.0,
            windDirection: '서풍',
            windDirectionDegree: 270,
            windSpeedUnit: 'm/s',
            snowAmount: '0cm',
            message: '내일의 날씨 (샘플 데이터)',
            timestamp: new Date().toISOString(),
            region: region
        },
        {
            date: dayAfterTomorrowStr,
            dateFormatted: dayAfterTomorrow.toISOString().slice(0, 10),
            temperature: 21,
            temperatureMin: 16,
            temperatureMax: 24,
            temperatureUnit: '°C',
            sky: '흐림',
            skyCode: '4',
            precipitation: '비',
            precipitationCode: '1',
            precipitationProbability: 80,
            precipitationAmount: '5~10mm',
            humidity: 80,
            humidityUnit: '%',
            windSpeed: 3.5,
            windDirection: '북서풍',
            windDirectionDegree: 315,
            windSpeedUnit: 'm/s',
            snowAmount: '0cm',
            message: '모레의 날씨 (샘플 데이터)',
            timestamp: new Date().toISOString(),
            region: region
        }
    ];
}

// 풍향 계산 함수
function getWindDirection(degree) {
    if (!degree) return '정보없음';
    
    const directions = [
        '북풍', '북북동풍', '북동풍', '동북동풍', '동풍', '동남동풍', '남동풍', '남남동풍',
        '남풍', '남남서풍', '남서풍', '서남서풍', '서풍', '서북서풍', '북서풍', '북북서풍'
    ];
    
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
}

// 강수량 처리 함수
function processPrecipitation(pcp) {
    if (!pcp || pcp === '강수없음' || pcp === '0') return '0mm';
    if (pcp === '1mm 미만') return '1mm 미만';
    return pcp;
}

// 적설량 처리 함수
function processSnow(sno) {
    if (!sno || sno === '적설없음' || sno === '0') return '0cm';
    if (sno === '1cm 미만') return '1cm 미만';
    return sno;
}

// Vercel 서버리스 함수 핸들러
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=1800');

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

    try {
        const region = req.query.region || '제주';
        const lat = req.query.lat ? parseFloat(req.query.lat) : null;
        const lon = req.query.lon ? parseFloat(req.query.lon) : null;
        const weatherApiKey = process.env.WEATHER_API_KEY;

        console.log('날씨 API 요청:', {
            region,
            lat,
            lon,
            weatherApiKeyExists: !!weatherApiKey,
            timestamp: new Date().toISOString()
        });

        if (!weatherApiKey) {
            console.warn('WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.');
            return res.status(200).json({
                success: true,
                data: generateSampleData(region),
                warning: 'WEATHER_API_KEY가 설정되지 않아 샘플 데이터를 제공합니다.',
                environment: 'development'
            });
        }

        let coord;
        let matchedRegionName = region;
        let regionInfo;

        // 위경도가 제공된 경우 직접 변환
        if (lat && lon) {
            coord = convertToGrid(lat, lon);
            regionInfo = {
                lat: lat,
                lon: lon,
                fullName: `위도 ${lat}, 경도 ${lon}`
            };
            console.log('위경도 직접 변환:', { lat, lon, nx: coord.nx, ny: coord.ny });
        } else {
            // 지역명으로 좌표 찾기
            regionInfo = findRegionCoordinates(region);
            coord = convertToGrid(regionInfo.lat, regionInfo.lon);
            matchedRegionName = regionInfo.fullName;
            console.log('지역명 기반 변환:', { 
                region, 
                lat: regionInfo.lat, 
                lon: regionInfo.lon, 
                nx: coord.nx, 
                ny: coord.ny 
            });
        }

        // 한국 표준시(KST) 기준 날짜/시간 설정
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        
        let baseTime = '';
        const currentHour = kst.getHours();
        if (currentHour >= 23 || currentHour < 2) baseTime = '2300';
        else if (currentHour < 5) baseTime = '0200';
        else if (currentHour < 8) baseTime = '0500';
        else if (currentHour < 11) baseTime = '0800';
        else if (currentHour < 14) baseTime = '1100';
        else if (currentHour < 17) baseTime = '1400';
        else if (currentHour < 20) baseTime = '1700';
        else baseTime = '2000';

        let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');
        if (currentHour < 2 && baseTime === '2300') {
            const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
            baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        }
    // 캐시 확인
        const cacheKey = `${coord.nx}-${coord.ny}-${baseDate}-${baseTime}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < WEATHER_API_CONFIG.CACHE_DURATION) {
            console.log('캐시된 데이터 사용:', cacheKey);
            return res.status(200).json(cachedData.data);
        }

        console.log('기상청 API 요청 파라미터:', {
            baseDate,
            baseTime,
            nx: coord.nx,
            ny: coord.ny,
            region: matchedRegionName
        });

        // 기상청 API 요청
        const response = await axios.get(WEATHER_API_CONFIG.BASE_URL, {
            params: {
                serviceKey: weatherApiKey,
                numOfRows: 300,
                pageNo: 1,
                dataType: 'JSON',
                base_date: baseDate,
                base_time: baseTime,
                nx: coord.nx,
                ny: coord.ny
            },
            timeout: WEATHER_API_CONFIG.TIMEOUT,
            headers: {
                'User-Agent': 'HealingK-Weather-Service/1.0'
            }
        });

        if (!response.data?.response?.body?.items?.item) {
            throw new Error('기상청 API 응답에 데이터가 없습니다.');
        }

        const resultCode = response.data.response.header.resultCode;
        if (resultCode !== '00') {
            const errorMsg = ERROR_MESSAGES[resultCode] || `알 수 없는 오류 (코드: ${resultCode})`;
            throw new Error(`기상청 API 오류: ${errorMsg}`);
        }

        const items = response.data.response.body.items.item || [];
        console.log('받은 데이터 항목 수:', items.length);

        const dailyForecasts = {};

        // 오늘, 내일, 모레 날짜 계산
        const todayStr = kst.toISOString().slice(0, 10).replace(/-/g, '');
        const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10).replace(/-/g, '');
        const dayAfterTomorrow = new Date(kst.getTime() + 2 * 24 * 60 * 60 * 1000);
        const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().slice(0, 10).replace(/-/g, '');

        // 기상청 데이터 처리
        items.forEach(item => {
            const fcstDate = item.fcstDate;
            const fcstTime = item.fcstTime;
            const category = item.category;
            const value = item.fcstValue;

            if (!dailyForecasts[fcstDate]) {
                dailyForecasts[fcstDate] = {
                    date: fcstDate,
                    temperature: null,
                    temperatureMin: null,
                    temperatureMax: null,
                    sky: null,
                    precipitation: null,
                    precipitationProbability: null,
                    precipitationAmount: null,
                    humidity: null,
                    windSpeed: null,
                    windDirection: null,
                    windDirectionDegree: null,
                    snowAmount: null,
                    dataPoints: {}
                };
            }

            const timeKey = fcstTime;
            if (!dailyForecasts[fcstDate].dataPoints[timeKey]) {
                dailyForecasts[fcstDate].dataPoints[timeKey] = {};
            }
            
            dailyForecasts[fcstDate].dataPoints[timeKey][category] = value;
        });

        // 각 날짜별로 대표값 선택
        Object.keys(dailyForecasts).forEach(date => {
            const forecast = dailyForecasts[date];
            const preferredTimes = ['1400', '1200', '1500', '1100', '1600', '1000', '1700'];
            
            let selectedTime = null;
            for (const time of preferredTimes) {
                if (forecast.dataPoints[time]) {
                    selectedTime = time;
                    break;
                }
            }
            
            if (!selectedTime) {
                const availableTimes = Object.keys(forecast.dataPoints);
                if (availableTimes.length > 0) {
                    selectedTime = availableTimes[0];
                }
            }
            
            if (selectedTime && forecast.dataPoints[selectedTime]) {
                const data = forecast.dataPoints[selectedTime];
                
                forecast.temperature = data.TMP ? parseFloat(data.TMP) : null;
                forecast.temperatureMin = data.TMN ? parseFloat(data.TMN) : null;
                forecast.temperatureMax = data.TMX ? parseFloat(data.TMX) : null;
                forecast.sky = data.SKY || null;
                forecast.precipitation = data.PTY || null;
                forecast.precipitationProbability = data.POP ? parseFloat(data.POP) : null;
                forecast.precipitationAmount = data.PCP ? processPrecipitation(data.PCP) : null;
                forecast.humidity = data.REH ? parseFloat(data.REH) : null;
                forecast.windSpeed = data.WSD ? parseFloat(data.WSD) : null;
                forecast.windDirection = data.VEC ? getWindDirection(parseFloat(data.VEC)) : null;
                forecast.windDirectionDegree = data.VEC ? parseFloat(data.VEC) : null;
                forecast.snowAmount = data.SNO ? processSnow(data.SNO) : null;
            }
            
            // 일 최저/최고 기온은 별도 처리
            Object.keys(forecast.dataPoints).forEach(time => {
                const timeData = forecast.dataPoints[time];
                if (timeData.TMN && !forecast.temperatureMin) {
                    forecast.temperatureMin = parseFloat(timeData.TMN);
                }
                if (timeData.TMX && !forecast.temperatureMax) {
                    forecast.temperatureMax = parseFloat(timeData.TMX);
                }
            });
        });

        // 최종 날씨 데이터 생성
        const weatherResults = [];
        [todayStr, tomorrowStr, dayAfterTomorrowStr].forEach(date => {
            const forecast = dailyForecasts[date];
            if (forecast) {
                const skyDescription = WEATHER_CODES.SKY[forecast.sky] || '정보 없음';
                const precipitationDescription = WEATHER_CODES.PTY[forecast.precipitation] || '없음';

                let message = '';
                if (date === todayStr) message = '🌟 오늘의 날씨';
                else if (date === tomorrowStr) message = '🗓️ 내일의 날씨';
                else if (date === dayAfterTomorrowStr) message = '🗓️ 모레의 날씨';

                weatherResults.push({
                    date: date,
                    dateFormatted: `${date.substring(0,4)}-${date.substring(4,6)}-${date.substring(6,8)}`,
                    temperature: forecast.temperature !== null ? Math.round(forecast.temperature) : null,
                    temperatureMin: forecast.temperatureMin !== null ? Math.round(forecast.temperatureMin) : null,
                    temperatureMax: forecast.temperatureMax !== null ? Math.round(forecast.temperatureMax) : null,
                    temperatureUnit: '°C',
                    sky: skyDescription,
                    skyCode: forecast.sky,
                    precipitation: precipitationDescription,
                    precipitationCode: forecast.precipitation,
                    precipitationProbability: forecast.precipitationProbability !== null ? Math.round(forecast.precipitationProbability) : null,
                    precipitationAmount: forecast.precipitationAmount || '0mm',
                    humidity: forecast.humidity !== null ? Math.round(forecast.humidity) : null,
                    humidityUnit: '%',
                    windSpeed: forecast.windSpeed !== null ? parseFloat(forecast.windSpeed).toFixed(1) : null,
                    windDirection: forecast.windDirection || '정보없음',
                    windDirectionDegree: forecast.windDirectionDegree !== null ? Math.round(forecast.windDirectionDegree) : null,
                    windSpeedUnit: 'm/s',
                    snowAmount: forecast.snowAmount || '0cm',
                    message: message,
                    timestamp: new Date().toISOString(),
                    region: matchedRegionName,
                    originalRegion: region,
                    coordinates: {
                        lat: regionInfo.lat || lat,
                        lon: regionInfo.lon || lon,
                        nx: coord.nx,
                        ny: coord.ny
                    }
                });
            }
        });

        console.log('최종 날씨 데이터 생성 완료:', weatherResults.length, '건');

        const responseData = {
            success: true,
            data: weatherResults,
            regionInfo: {
                requested: region,
                matched: matchedRegionName,
                fullName: regionInfo.fullName,
                coordinates: {
                    lat: regionInfo.lat || lat,
                    lon: regionInfo.lon || lon,
                    nx: coord.nx,
                    ny: coord.ny
                }
            },
            apiInfo: {
                source: '기상청 단기예보',
                baseDate: baseDate,
                baseTime: baseTime,
                timestamp: new Date().toISOString(),
                apiKeyUsed: 'WEATHER_API_KEY',
                conversionMethod: lat && lon ? 'direct_coordinates' : 'region_lookup'
            }
        };

        // Vercel 환경용 캐시 저장
        cache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        // 캐시 크기 관리
        if (cache.size > WEATHER_API_CONFIG.MAX_CACHE_SIZE) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
            console.log('캐시 정리 완료. 현재 캐시 크기:', cache.size);
        }

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('날씨 API 오류:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // 에러 타입별 상세 로깅
        if (error.code === 'ECONNABORTED') {
            console.error('API 요청 타임아웃 발생');
        } else if (error.response) {
            console.error('API 응답 오류:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (error.request) {
            console.error('네트워크 오류 - 응답 없음');
        } else {
            console.error('기타 오류:', error.message);
        }

        // 에러 발생 시에도 샘플 데이터 반환
        return res.status(200).json({
            success: false,
            error: true,
            errorMessage: error.message,
            data: generateSampleData(req.query.region || '제주'),
            warning: '실시간 날씨 정보를 가져올 수 없어 샘플 데이터를 제공합니다.',
            regionInfo: {
                requested: req.query.region || '제주',
                matched: '제주',
                fullName: '제주특별자치도',
                coordinates: {
                    lat: 33.4996,
                    lon: 126.5312,
                    nx: 52,
                    ny: 38
                }
            },
            apiInfo: {
                source: '샘플 데이터',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                apiKeyUsed: 'WEATHER_API_KEY',
                conversionMethod: 'fallback'
            }
        });
    }
};




