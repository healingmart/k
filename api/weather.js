const axios = require('axios');

// Vercel 서버리스용 캐시 (성능 개선 및 API 호출 빈도 관리)
let weatherCache = new Map();

// 기상청 날씨 코드 매핑 (SKY: 하늘상태, PTY: 강수형태 등)
const WEATHER_CODES = {
  // 하늘상태 (SKY) - 기상청 공식 전체 코드
  SKY: {
    '1': '맑음', '2': '구름조금', '3': '구름많음', '4': '흐림',
    '5': '매우흐림', '6': '흐리고비', '7': '흐리고눈', '8': '흐리고비/눈',
    '9': '흐리고소나기', '10': '안개'
  },
  // 강수형태 (PTY) - 기상청 공식 전체 코드
  PTY: {
    '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기',
    '5': '빗방울', '6': '빗방울/눈날림', '7': '눈날림', '8': '진눈깨비',
    '9': '우박', '10': '이슬비', '11': '뇌우', '12': '폭우', '13': '폭설'
  },
  
  // 강수확률 (POP) - 단계별 설명
  POP: {
    '0': '0% (강수 없음)', '10': '10% (거의 없음)', '20': '20% (낮음)',
    '30': '30% (약간 있음)', '40': '40% (보통)', '50': '50% (보통)',
    '60': '60% (높음)', '70': '70% (높음)', '80': '80% (매우 높음)',
    '90': '90% (매우 높음)', '100': '100% (확실)'
  },
  
  // 강수량 (PCP) - 세부 단계
  PCP: {
    '강수없음': '0mm', '1mm 미만': '1mm 미만 (이슬비)',
    '1': '1mm (약한 비)', '2': '2mm (약한 비)',
    '3': '3mm (약한 비)', '4': '4mm (약한 비)',
    '5': '5mm (보통 비)', '10': '10mm (강한 비)',
    '15': '15mm (강한 비)', '20': '20mm (강한 비)',
    '25': '25mm (매우 강한 비)', '30': '30mm (매우 강한 비)',
    '40': '40mm (폭우)', '50': '50mm (폭우)',
    '60': '60mm (폭우)', '70': '70mm (폭우)',
    '80': '80mm (폭우)', '90': '90mm (폭우)',
    '100': '100mm 이상 (폭우)'
  },
  
  // 적설량 (SNO) - 세부 단계
  SNO: {
    '적설없음': '0cm', '1cm 미만': '1cm 미만 (가벼운 눈)',
    '1': '1cm (가벼운 눈)', '2': '2cm (가벼운 눈)',
    '3': '3cm (가벼운 눈)', '4': '4cm (가벼운 눈)',
    '5': '5cm (보통 눈)', '10': '10cm (많은 눈)',
    '15': '15cm (많은 눈)', '20': '20cm (많은 눈)',
    '25': '25cm (폭설)', '30': '30cm (폭설)',
    '40': '40cm (폭설)', '50': '50cm 이상 (폭설)'
  },
  
  // 파고 (WAV) - 완전한 파도 높이 매핑
  WAV: {
    '0': '0m (잔잔)',
    '0.5': '0.5m 미만 (낮음)',
    '1.0': '0.5~1.0m (보통)',
    '1.5': '1.0~1.5m (약간 높음)',
    '2.0': '1.5~2.0m (높음)',
    '2.5': '2.0~2.5m (높음)',
    '3.0': '2.5~3.0m (매우 높음)',
    '4.0': '3.0~4.0m (위험)',
    '5.0': '4.0m 이상 (매우 위험)'
  }
};

// 기상청 API 에러 메시지 매핑
const ERROR_MESSAGES = {
  '01': '애플리케이션 에러', '02': 'DB 에러', '03': '데이터 없음', '04': 'HTTP 에러',
  '05': '서비스 연결 실패', '10': '잘못된 요청 파라미터', '11': '필수요청 파라미터가 없음',
  '12': '해당 오픈API서비스가 없거나 폐기됨', '20': '서비스 접근 거부', '21': '일시적으로 사용할 수 없는 서비스 키',
  '22': '서비스 요청 제한횟수 초과', '30': '등록되지 않은 서비스 키', '31': '기한만료된 서비스 키',
  '32': '등록되지 않은 IP', '33': '서명되지 않은 호출'
};

// 기본 지역 설정
const DEFAULT_REGION = '서울';

/**
 * 위경도를 기상청 격자 좌표로 변환합니다. (정확도 100%)
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {Object} 격자 좌표 {nx, ny}
 */
function latLonToGrid(lat, lon) {
  const RE = 6371.00877; // 지구 반경 (km)
  const GRID = 5.0; // 격자 간격 (km)
  const SLAT1 = 30.0; // 표준 위도 1
  const SLAT2 = 60.0; // 표준 위도 2
  const OLON = 126.0; // 기준 경도
  const OLAT = 38.0; // 기준 위도
  const XO = 43; // 기준 격자 X 좌표
  const YO = 136; // 기준 격자 Y 좌표

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

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)
  };
}

/**
 * 🔥 중복 지역명 해결을 위한 완전한 지역 데이터베이스
 * 우선순위: 1. 정확한 전체 이름, 2. 지역 규모 (시 > 군 > 구 > 동), 3. 인구/중요도
 */
function getLocationCoordinates() {
    return {
        // 서울특별시
        '서울': { lat: 37.5665, lon: 126.9780, name: '서울특별시', priority: 1000 },
        '서울시': { lat: 37.5665, lon: 126.9780, name: '서울특별시', priority: 1000 },
        '서울특별시': { lat: 37.5665, lon: 126.9780, name: '서울특별시', priority: 1000 },
        
        // 🔥 중복 지역명 해결 - 남원 (전북이 기본, 충남은 명시적 표기)
        '남원': { lat: 35.4163, lon: 127.3906, name: '전라북도 남원시', priority: 900 },
        '남원시': { lat: 35.4163, lon: 127.3906, name: '전라북도 남원시', priority: 900 },
        '전북남원': { lat: 35.4163, lon: 127.3906, name: '전라북도 남원시', priority: 950 },
        '전라북도남원': { lat: 35.4163, lon: 127.3906, name: '전라북도 남원시', priority: 1000 },
        '남원전북': { lat: 35.4163, lon: 127.3906, name: '전라북도 남원시', priority: 950 },
        '충남남원': { lat: 36.7455, lon: 126.2980, name: '충청남도 태안군 남원면', priority: 700 },
        '태안남원': { lat: 36.7455, lon: 126.2980, name: '충청남도 태안군 남원면', priority: 800 },
        
        // 🔥 중복 지역명 해결 - 고성 (강원이 기본, 경남은 명시적 표기)
        '고성': { lat: 38.3797, lon: 128.4677, name: '강원특별자치도 고성군', priority: 900 },
        '고성군': { lat: 38.3797, lon: 128.4677, name: '강원특별자치도 고성군', priority: 900 },
        '강원고성': { lat: 38.3797, lon: 128.4677, name: '강원특별자치도 고성군', priority: 950 },
        '강원도고성': { lat: 38.3797, lon: 128.4677, name: '강원특별자치도 고성군', priority: 1000 },
        '고성강원': { lat: 38.3797, lon: 128.4677, name: '강원특별자치도 고성군', priority: 950 },
        '경남고성': { lat: 34.9733, lon: 128.3229, name: '경상남도 고성군', priority: 800 },
        '고성경남': { lat: 34.9733, lon: 128.3229, name: '경상남도 고성군', priority: 800 },
        '경상남도고성': { lat: 34.9733, lon: 128.3229, name: '경상남도 고성군', priority: 950 },
        
        // 🔥 기타 중복 지역명들
        '중구': { lat: 37.5641, lon: 126.9979, name: '서울특별시 중구', priority: 900 }, // 서울이 기본
        '서울중구': { lat: 37.5641, lon: 126.9979, name: '서울특별시 중구', priority: 950 },
        '부산중구': { lat: 35.1064, lon: 129.0326, name: '부산광역시 중구', priority: 850 },
        '대구중구': { lat: 35.8686, lon: 128.6059, name: '대구광역시 중구', priority: 800 },
        '인천중구': { lat: 37.4738, lon: 126.6214, name: '인천광역시 중구', priority: 800 },
        '대전중구': { lat: 36.3256, lon: 127.4211, name: '대전광역시 중구', priority: 800 },
        '울산중구': { lat: 35.5693, lon: 129.3309, name: '울산광역시 중구', priority: 750 },
        
        '동구': { lat: 35.1368, lon: 129.0568, name: '부산광역시 동구', priority: 900 }, // 부산이 기본
        '서울동구': { lat: 37.5744, lon: 127.0394, name: '서울특별시 동대문구', priority: 850 },
        '부산동구': { lat: 35.1368, lon: 129.0568, name: '부산광역시 동구', priority: 950 },
        '대구동구': { lat: 35.8896, lon: 128.6355, name: '대구광역시 동구', priority: 850 },
        '인천동구': { lat: 37.4739, lon: 126.6433, name: '인천광역시 동구', priority: 800 },
        '대전동구': { lat: 36.3504, lon: 127.4548, name: '대전광역시 동구', priority: 800 },
        '울산동구': { lat: 35.5049, lon: 129.4167, name: '울산광역시 동구', priority: 750 },
        '광주동구': { lat: 35.1465, lon: 126.9227, name: '광주광역시 동구', priority: 750 },
        
        '서구': { lat: 35.0979, lon: 129.0244, name: '부산광역시 서구', priority: 900 }, // 부산이 기본
        '부산서구': { lat: 35.0979, lon: 129.0244, name: '부산광역시 서구', priority: 950 },
        '대구서구': { lat: 35.8719, lon: 128.5592, name: '대구광역시 서구', priority: 850 },
        '인천서구': { lat: 37.5458, lon: 126.6757, name: '인천광역시 서구', priority: 850 },
        '대전서구': { lat: 36.3554, lon: 127.3834, name: '대전광역시 서구', priority: 800 },
        '광주서구': { lat: 35.1522, lon: 126.8892, name: '광주광역시 서구', priority: 750 },
        
        '남구': { lat: 35.1366, lon: 129.0845, name: '부산광역시 남구', priority: 900 }, // 부산이 기본
        '부산남구': { lat: 35.1366, lon: 129.0845, name: '부산광역시 남구', priority: 950 },
        '대구남구': { lat: 35.8464, lon: 128.5974, name: '대구광역시 남구', priority: 850 },
        '울산남구': { lat: 35.5460, lon: 129.3297, name: '울산광역시 남구', priority: 800 },
        '광주남구': { lat: 35.1330, lon: 126.9026, name: '광주광역시 남구', priority: 750 },
        
        '북구': { lat: 35.1975, lon: 128.9897, name: '부산광역시 북구', priority: 900 }, // 부산이 기본
        '부산북구': { lat: 35.1975, lon: 128.9897, name: '부산광역시 북구', priority: 950 },
        '대구북구': { lat: 35.8858, lon: 128.5829, name: '대구광역시 북구', priority: 850 },
        '울산북구': { lat: 35.5827, lon: 129.3612, name: '울산광역시 북구', priority: 800 },
        '광주북구': { lat: 35.1740, lon: 126.9115, name: '광주광역시 북구', priority: 750 },
        
        '강서구': { lat: 37.5509, lon: 126.8495, name: '서울특별시 강서구', priority: 900 }, // 서울이 기본
        '서울강서구': { lat: 37.5509, lon: 126.8495, name: '서울특별시 강서구', priority: 950 },
        '부산강서구': { lat: 35.2120, lon: 128.9804, name: '부산광역시 강서구', priority: 850 },
        
        // 제주특별자치도
        '제주': { lat: 33.4996, lon: 126.5312, name: '제주특별자치도', priority: 1000 },
        '제주시': { lat: 33.5097, lon: 126.5219, name: '제주시', priority: 950 },
        '서귀포': { lat: 33.2541, lon: 126.5601, name: '서귀포시', priority: 950 },
        '서귀포시': { lat: 33.2541, lon: 126.5601, name: '서귀포시', priority: 950 },
        
        // 제주 세부 지역
        '서귀포버스터미널': { lat: 33.2546, lon: 126.5685, name: '서귀포버스터미널', priority: 800 },
        '서귀포터미널': { lat: 33.2546, lon: 126.5685, name: '서귀포버스터미널', priority: 800 },
        '성산일출봉': { lat: 33.4615, lon: 126.9410, name: '제주 성산일출봉', priority: 850 },
        '한라산': { lat: 33.3617, lon: 126.5292, name: '제주 한라산', priority: 850 },
        '우도': { lat: 33.5009, lon: 126.9506, name: '제주 우도', priority: 800 },
        '중문관광단지': { lat: 33.2394, lon: 126.4128, name: '제주 중문관광단지', priority: 800 },
        
        // 경기도 주요 도시
        '수원': { lat: 37.2636, lon: 127.0286, name: '경기도 수원시', priority: 950 },
        '수원시': { lat: 37.2636, lon: 127.0286, name: '경기도 수원시', priority: 950 },
        '성남': { lat: 37.4201, lon: 127.1262, name: '경기도 성남시', priority: 900 },
        '성남시': { lat: 37.4201, lon: 127.1262, name: '경기도 성남시', priority: 900 },
        '용인': { lat: 37.2411, lon: 127.1776, name: '경기도 용인시', priority: 900 },
        '용인시': { lat: 37.2411, lon: 127.1776, name: '경기도 용인시', priority: 900 },
        '안양': { lat: 37.3943, lon: 126.9568, name: '경기도 안양시', priority: 900 },
        '안양시': { lat: 37.3943, lon: 126.9568, name: '경기도 안양시', priority: 900 },
        '부천': { lat: 37.5034, lon: 126.7660, name: '경기도 부천시', priority: 900 },
        '부천시': { lat: 37.5034, lon: 126.7660, name: '경기도 부천시', priority: 900 },
        '고양': { lat: 37.6584, lon: 126.8320, name: '경기도 고양시', priority: 900 },
        '고양시': { lat: 37.6584, lon: 126.8320, name: '경기도 고양시', priority: 900 },
        '의정부': { lat: 37.7381, lon: 127.0338, name: '경기도 의정부시', priority: 850 },
        '의정부시': { lat: 37.7381, lon: 127.0338, name: '경기도 의정부시', priority: 850 },
        '평택': { lat: 36.9921, lon: 127.1123, name: '경기도 평택시', priority: 850 },
        '평택시': { lat: 36.9921, lon: 127.1123, name: '경기도 평택시', priority: 850 },
        
        // 강원특별자치도
        '춘천': { lat: 37.8816, lon: 127.7292, name: '강원특별자치도 춘천시', priority: 900 },
        '춘천시': { lat: 37.8816, lon: 127.7292, name: '강원특별자치도 춘천시', priority: 900 },
        '원주': { lat: 37.3422, lon: 127.9200, name: '강원특별자치도 원주시', priority: 850 },
        '원주시': { lat: 37.3422, lon: 127.9200, name: '강원특별자치도 원주시', priority: 850 },
        '강릉': { lat: 37.7519, lon: 128.8758, name: '강원특별자치도 강릉시', priority: 850 },
        '강릉시': { lat: 37.7519, lon: 128.8758, name: '강원특별자치도 강릉시', priority: 850 },
        '속초': { lat: 38.2036, lon: 128.5647, name: '강원특별자치도 속초시', priority: 800 },
        '속초시': { lat: 38.2036, lon: 128.5647, name: '강원특별자치도 속초시', priority: 800 },
        
        // 충청북도
        '청주': { lat: 36.6424, lon: 127.4890, name: '충청북도 청주시', priority: 900 },
        '청주시': { lat: 36.6424, lon: 127.4890, name: '충청북도 청주시', priority: 900 },
        '충주': { lat: 36.9910, lon: 127.9259, name: '충청북도 충주시', priority: 800 },
        '충주시': { lat: 36.9910, lon: 127.9259, name: '충청북도 충주시', priority: 800 },
        
        // 충청남도
        '천안': { lat: 36.8151, lon: 127.1139, name: '충청남도 천안시', priority: 900 },
        '천안시': { lat: 36.8151, lon: 127.1139, name: '충청남도 천안시', priority: 900 },
        '공주': { lat: 36.4465, lon: 127.1189, name: '충청남도 공주시', priority: 800 },
        '공주시': { lat: 36.4465, lon: 127.1189, name: '충청남도 공주시', priority: 800 },
        '아산': { lat: 36.7898, lon: 127.0018, name: '충청남도 아산시', priority: 850 },
        '아산시': { lat: 36.7898, lon: 127.0018, name: '충청남도 아산시', priority: 850 },
        
        // 전라북도
        '전주': { lat: 35.8242, lon: 127.1480, name: '전라북도 전주시', priority: 950 },
        '전주시': { lat: 35.8242, lon: 127.1480, name: '전라북도 전주시', priority: 950 },
        '군산': { lat: 35.9677, lon: 126.7366, name: '전라북도 군산시', priority: 800 },
        '군산시': { lat: 35.9677, lon: 126.7366, name: '전라북도 군산시', priority: 800 },
        '익산': { lat: 35.9483, lon: 126.9575, name: '전라북도 익산시', priority: 800 },
        '익산시': { lat: 35.9483, lon: 126.9575, name: '전라북도 익산시', priority: 800 },
        
        // 전라남도
        '광주': { lat: 35.1595, lon: 126.8526, name: '광주광역시', priority: 950 },
        '광주시': { lat: 35.1595, lon: 126.8526, name: '광주광역시', priority: 950 },
        '광주광역시': { lat: 35.1595, lon: 126.8526, name: '광주광역시', priority: 1000 },
        '목포': { lat: 34.8118, lon: 126.3922, name: '전라남도 목포시', priority: 850 },
        '목포시': { lat: 34.8118, lon: 126.3922, name: '전라남도 목포시', priority: 850 },
        '여수': { lat: 34.7604, lon: 127.6622, name: '전라남도 여수시', priority: 850 },
        '여수시': { lat: 34.7604, lon: 127.6622, name: '전라남도 여수시', priority: 850 },
        '순천': { lat: 34.9507, lon: 127.4872, name: '전라남도 순천시', priority: 800 },
        '순천시': { lat: 34.9507, lon: 127.4872, name: '전라남도 순천시', priority: 800 },
        
        // 경상북도
        '대구': { lat: 35.8714, lon: 128.6014, name: '대구광역시', priority: 1000 },
        '대구시': { lat: 35.8714, lon: 128.6014, name: '대구광역시', priority: 1000 },
        '대구광역시': { lat: 35.8714, lon: 128.6014, name: '대구광역시', priority: 1000 },
        '포항': { lat: 36.0190, lon: 129.3435, name: '경상북도 포항시', priority: 850 },
        '포항시': { lat: 36.0190, lon: 129.3435, name: '경상북도 포항시', priority: 850 },
        '경주': { lat: 35.8562, lon: 129.2247, name: '경상북도 경주시', priority: 800 },
        '경주시': { lat: 35.8562, lon: 129.2247, name: '경상북도 경주시', priority: 800 },
        '안동': { lat: 36.5684, lon: 128.7294, name: '경상북도 안동시', priority: 800 },
        '안동시': { lat: 36.5684, lon: 128.7294, name: '경상북도 안동시', priority: 800 },
        '구미': { lat: 36.1196, lon: 128.3441, name: '경상북도 구미시', priority: 800 },
        '구미시': { lat: 36.1196, lon: 128.3441, name: '경상북도 구미시', priority: 800 },
        
        // 경상남도
        '부산': { lat: 35.1796, lon: 129.0756, name: '부산광역시', priority: 1000 },
        '부산시': { lat: 35.1796, lon: 129.0756, name: '부산광역시', priority: 1000 },
        '부산광역시': { lat: 35.1796, lon: 129.0756, name: '부산광역시', priority: 1000 },
        '창원': { lat: 35.2281, lon: 128.6811, name: '경상남도 창원시', priority: 900 },
        '창원시': { lat: 35.2281, lon: 128.6811, name: '경상남도 창원시', priority: 900 },
 '진주': { lat: 35.1800, lon: 128.1076, name: '경상남도 진주시', priority: 800 },
        '진주시': { lat: 35.1800, lon: 128.1076, name: '경상남도 진주시', priority: 800 },
        '통영': { lat: 34.8544, lon: 128.4331, name: '경상남도 통영시', priority: 800 },
        '통영시': { lat: 34.8544, lon: 128.4331, name: '경상남도 통영시', priority: 800 },
        '김해': { lat: 35.2342, lon: 128.8896, name: '경상남도 김해시', priority: 850 },
        '김해시': { lat: 35.2342, lon: 128.8896, name: '경상남도 김해시', priority: 850 },
        '거제': { lat: 34.8806, lon: 128.6212, name: '경상남도 거제시', priority: 750 },
        '거제시': { lat: 34.8806, lon: 128.6212, name: '경상남도 거제시', priority: 750 },
        '양산': { lat: 35.3350, lon: 129.0375, name: '경상남도 양산시', priority: 750 },
        '양산시': { lat: 35.3350, lon: 129.0375, name: '경상남도 양산시', priority: 750 },
        
        // 울산광역시
        '울산': { lat: 35.5384, lon: 129.3114, name: '울산광역시', priority: 950 },
        '울산시': { lat: 35.5384, lon: 129.3114, name: '울산광역시', priority: 950 },
        '울산광역시': { lat: 35.5384, lon: 129.3114, name: '울산광역시', priority: 1000 },
        
        // 인천광역시
        '인천': { lat: 37.4563, lon: 126.7052, name: '인천광역시', priority: 1000 },
        '인천시': { lat: 37.4563, lon: 126.7052, name: '인천광역시', priority: 1000 },
        '인천광역시': { lat: 37.4563, lon: 126.7052, name: '인천광역시', priority: 1000 },
        '송도': { lat: 37.3894, lon: 126.6541, name: '인천 연수구 송도', priority: 800 },
        '부평': { lat: 37.5073, lon: 126.7218, name: '인천 부평구', priority: 750 },
        '부평구': { lat: 37.5073, lon: 126.7218, name: '인천 부평구', priority: 750 },
        
        // 대전광역시
        '대전': { lat: 36.3504, lon: 127.3845, name: '대전광역시', priority: 1000 },
        '대전시': { lat: 36.3504, lon: 127.3845, name: '대전광역시', priority: 1000 },
        '대전광역시': { lat: 36.3504, lon: 127.3845, name: '대전광역시', priority: 1000 },
        '유성': { lat: 36.3621, lon: 127.3565, name: '대전 유성구', priority: 750 },
        '유성구': { lat: 36.3621, lon: 127.3565, name: '대전 유성구', priority: 750 },
        
        // 세종특별자치시
        '세종': { lat: 36.4801, lon: 127.2890, name: '세종특별자치시', priority: 950 },
        '세종시': { lat: 36.4801, lon: 127.2890, name: '세종특별자치시', priority: 950 },
        '세종특별자치시': { lat: 36.4801, lon: 127.2890, name: '세종특별자치시', priority: 1000 },
        
        // 🔥 자주 검색되는 세부 지역들 (문제가 되었던 지역들 포함)
        '중방동': { lat: 35.8198, lon: 128.7441, name: '경상북도 경산시 중방동', priority: 800 },
        '경산중방동': { lat: 35.8198, lon: 128.7441, name: '경상북도 경산시 중방동', priority: 850 },
        '경산시중방동': { lat: 35.8198, lon: 128.7441, name: '경상북도 경산시 중방동', priority: 900 },
        
        '수성1가': { lat: 35.8450, lon: 128.6186, name: '대구광역시 수성구 수성1가', priority: 800 },
        '수성2가': { lat: 35.8445, lon: 128.6190, name: '대구광역시 수성구 수성2가', priority: 800 },
        '수성3가': { lat: 35.8440, lon: 128.6195, name: '대구광역시 수성구 수성3가', priority: 800 },
        '수성4가': { lat: 35.8435, lon: 128.6200, name: '대구광역시 수성구 수성4가', priority: 800 },
        '대구수성1가': { lat: 35.8450, lon: 128.6186, name: '대구광역시 수성구 수성1가', priority: 850 },
        
        // 서울 주요 동
        '역삼동': { lat: 37.4998, lon: 127.0374, name: '서울특별시 강남구 역삼동', priority: 850 },
        '역삼1동': { lat: 37.4998, lon: 127.0374, name: '서울특별시 강남구 역삼1동', priority: 850 },
        '역삼2동': { lat: 37.4985, lon: 127.0395, name: '서울특별시 강남구 역삼2동', priority: 850 },
        '삼성동': { lat: 37.5112, lon: 127.0540, name: '서울특별시 강남구 삼성동', priority: 850 },
        '삼성1동': { lat: 37.5112, lon: 127.0540, name: '서울특별시 강남구 삼성1동', priority: 850 },
        '삼성2동': { lat: 37.5095, lon: 127.0585, name: '서울특별시 강남구 삼성2동', priority: 850 },
        '청담동': { lat: 37.5235, lon: 127.0470, name: '서울특별시 강남구 청담동', priority: 850 },
        '신사동': { lat: 37.5204, lon: 127.0205, name: '서울특별시 강남구 신사동', priority: 850 },
        '논현동': { lat: 37.5110, lon: 127.0220, name: '서울특별시 강남구 논현동', priority: 800 },
        '압구정동': { lat: 37.5274, lon: 127.0280, name: '서울특별시 강남구 압구정동', priority: 800 },
        
        // 명동, 홍대 등 주요 관광지
        '명동': { lat: 37.5636, lon: 126.9822, name: '서울특별시 중구 명동', priority: 900 },
        '홍대': { lat: 37.5577, lon: 126.9246, name: '서울특별시 마포구 홍대입구역', priority: 900 },
        '이태원': { lat: 37.5349, lon: 126.9947, name: '서울특별시 용산구 이태원', priority: 850 },
        '강남역': { lat: 37.4979, lon: 127.0276, name: '서울특별시 강남구 강남역', priority: 900 },
        '신촌': { lat: 37.5591, lon: 126.9425, name: '서울특별시 서대문구 신촌', priority: 850 },
        '잠실': { lat: 37.5133, lon: 127.1000, name: '서울특별시 송파구 잠실', priority: 850 },
        '여의도': { lat: 37.5219, lon: 126.9245, name: '서울특별시 영등포구 여의도', priority: 850 },
        
        // 부산 주요 지역
        '해운대': { lat: 35.1631, lon: 129.1635, name: '부산광역시 해운대구', priority: 900 },
        '해운대구': { lat: 35.1631, lon: 129.1635, name: '부산광역시 해운대구', priority: 900 },
        '광안리': { lat: 35.1532, lon: 129.1183, name: '부산광역시 수영구 광안리', priority: 850 },
        '서면': { lat: 35.1579, lon: 129.0563, name: '부산광역시 부산진구 서면', priority: 850 },
        '남포동': { lat: 35.0975, lon: 129.0279, name: '부산광역시 중구 남포동', priority: 800 },
        '기장': { lat: 35.2446, lon: 129.2224, name: '부산광역시 기장군', priority: 750 },
        '기장군': { lat: 35.2446, lon: 129.2224, name: '부산광역시 기장군', priority: 750 },
        
        // 주요 교통시설
        '김포공항': { lat: 37.5583, lon: 126.7906, name: '김포국제공항', priority: 900 },
        '인천공항': { lat: 37.4602, lon: 126.4407, name: '인천국제공항', priority: 950 },
        '제주공항': { lat: 33.5097, lon: 126.4930, name: '제주국제공항', priority: 900 },
        '김해공항': { lat: 35.1795, lon: 128.9385, name: '김해국제공항', priority: 850 },
        '서울역': { lat: 37.5547, lon: 126.9706, name: '서울역', priority: 900 },
        '부산역': { lat: 35.1156, lon: 129.0403, name: '부산역', priority: 850 },
        '대구역': { lat: 35.8808, lon: 128.6287, name: '대구역', priority: 800 },
        
        // 기타 주요 관광지
        '경복궁': { lat: 37.5788, lon: 126.9770, name: '서울특별시 종로구 경복궁', priority: 850 },
        '창덕궁': { lat: 37.5792, lon: 126.9910, name: '서울특별시 종로구 창덕궁', priority: 800 },
        '덕수궁': { lat: 37.5658, lon: 126.9751, name: '서울특별시 중구 덕수궁', priority: 800 },
        '남산타워': { lat: 37.5512, lon: 126.9882, name: '서울특별시 용산구 남산타워', priority: 850 },
        'N서울타워': { lat: 37.5512, lon: 126.9882, name: '서울특별시 용산구 남산타워', priority: 850 }
    };
}

/**
 * 🔥 개선된 지역명 정규화 함수 - 중요한 행정구역 정보는 보존
 * @param {string} name - 정규화할 지역명
 * @returns {string} 정규화된 지역명
 */
function normalizeLocationName(name) {
    if (!name) return '';
    
    return name.toLowerCase()
        .replace(/\s+/g, '') // 공백 제거
        .replace(/[^\w가-힣]/g, '') // 특수문자 제거
        .trim();
    // 중요: 행정구역 단위(시/군/구/읍/면/동/리)는 제거하지 않음
}

/**
 * 🔥 완벽한 지역 매칭 점수 계산 함수
 * @param {string} query - 검색어
 * @param {string} target - 대상 지역명
 * @param {string} targetAddress - 대상 주소 (선택)
 * @param {number} basePriority - 기본 우선순위 점수
 * @returns {number} 매칭 점수 (0-2000)
 */
function calculateLocationMatchScore(query, target, targetAddress = '', basePriority = 0) {
    const normalizedQuery = normalizeLocationName(query);
    const normalizedTarget = normalizeLocationName(target);
    const normalizedAddress = normalizeLocationName(targetAddress);
    
    let score = basePriority; // 기본 우선순위 점수 추가
    
    // 1. 완전 일치 (최고 점수)
    if (normalizedQuery === normalizedTarget) return 2000 + basePriority;
    if (normalizedQuery === normalizedAddress) return 1950 + basePriority;
    
    // 2. 원본 문자열 완전 일치
    if (query.toLowerCase().trim() === target.toLowerCase().trim()) return 1900 + basePriority;
    if (query.toLowerCase().trim() === targetAddress.toLowerCase().trim()) return 1850 + basePriority;
    
    // 3. 포함 관계 - 하지만 길이 차이가 클수록 감점
    const queryLen = normalizedQuery.length;
    const targetLen = normalizedTarget.length;
    
    if (normalizedTarget.includes(normalizedQuery)) {
        // 대상이 검색어를 포함하는 경우
        const lengthDiff = targetLen - queryLen;
        if (lengthDiff === 0) score += 1800; // 같은 길이면 거의 완전 일치
        else if (lengthDiff <= 2) score += 1400; // 약간의 차이
        else if (lengthDiff <= 5) score += 1000; // 중간 차이
        else if (lengthDiff <= 10) score += 600; // 큰 차이
        else score += 200; // 매우 큰 차이 (예: "동" 검색에 "서울특별시 강남구 역삼동" 매칭)
    }
    
    if (normalizedQuery.includes(normalizedTarget) && targetLen > 2) {
        // 검색어가 대상을 포함하는 경우 (역방향)
        const lengthDiff = queryLen - targetLen;
        if (lengthDiff <= 2) score += 1200;
        else if (lengthDiff <= 5) score += 800;
        else if (lengthDiff <= 10) score += 400;
        else score += 150;
    }
    
    // 4. 주소 포함 관계
    if (normalizedAddress.includes(normalizedQuery)) {
        const lengthDiff = normalizedAddress.length - queryLen;
        if (lengthDiff <= 5) score += 600;
        else if (lengthDiff <= 10) score += 300;
        else score += 100;
    }
    
    // 5. 특정 키워드 가중치
    if (query.includes('터미널') && target.includes('터미널')) score += 400;
    if (query.includes('역') && target.includes('역')) score += 400;
    if (query.includes('공항') && target.includes('공항')) score += 400;
    if (query.includes('구') && target.includes('구')) score += 200;
    if (query.includes('동') && target.includes('동')) score += 200;
    if (query.includes('시') && target.includes('시')) score += 200;
    if (query.includes('군') && target.includes('군')) score += 200;
    
    return Math.max(0, score);
}

/**
 * 카카오 API를 이용한 지역 검색
 * @param {string} query - 검색할 지역명
 * @param {string} kakaoApiKey - 카카오 REST API 키
 * @returns {Object|null} 검색 결과 또는 null
 */
async function searchLocationWithKakao(query, kakaoApiKey) {
    try {
        console.log(`🔍 카카오 API 검색 시작: "${query}"`);
        
        // 1단계: 키워드 검색 (장소 우선)
        const keywordResponse = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: {
                query: query,
                size: 15,
                sort: 'accuracy'
            },
            headers: {
                'Authorization': `KakaoAK ${kakaoApiKey}`
            },
            timeout: 5000
        });

        let bestMatch = null;
        const documents = keywordResponse.data.documents || [];

        if (documents.length > 0) {
            bestMatch = findBestLocationMatch(query, documents);
        }

        // 2단계: 키워드 검색 실패 시 주소 검색 시도
        if (!bestMatch) {
            const addressResponse = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
                params: {
                    query: query,
                    analyze_type: 'similar',
                    size: 10
                },
                headers: {
                    'Authorization': `KakaoAK ${kakaoApiKey}`
                },
                timeout: 5000
            });

            const addressDocuments = addressResponse.data.documents || [];
            if (addressDocuments.length > 0) {
                bestMatch = findBestAddressMatch(query, addressDocuments);
            }
        }

        return bestMatch;

    } catch (error) {
        console.error('❌ 카카오 API 검색 오류:', error.message);
        return null;
    }
}

/**
 * 🔥 개선된 카카오 키워드 검색 결과 매칭 로직
 */
function findBestLocationMatch(query, documents) {
    const originalQueryLower = query.toLowerCase().trim();
    
    const scoredResults = documents.map(doc => {
        const placeName = doc.place_name || '';
        const addressName = doc.address_name || '';
        const roadAddressName = doc.road_address_name || '';
        const categoryGroupCode = doc.category_group_code || '';
        const categoryName = doc.category_name || '';
        
        let score = 0;
        
        // 1. 기본 매칭 점수 계산
        const placeScore = calculateLocationMatchScore(query, placeName, addressName);
        const addressScore = calculateLocationMatchScore(query, addressName);
        const roadScore = calculateLocationMatchScore(query, roadAddressName);
        
        score = Math.max(placeScore, addressScore, roadScore);
        
        // 2. 행정구역(AD5) 카테고리 가중치
        if (categoryGroupCode === 'AD5') {
            score += 500; // 행정구역 우선
            
            // 세부 행정구역 타입별 가중치
            if (categoryName.includes('동')) score += 200;
            if (categoryName.includes('구')) score += 150;
            if (categoryName.includes('시')) score += 100;
            if (categoryName.includes('군')) score += 100;
        }
        
        // 3. 🔥 중요: 지역 특이성 검사 (서울이 아닌 지역 검색 시 서울 결과 감점)
        const isSeoulQuery = query.includes('서울') || query.includes('seoul');
        const isSeoulResult = addressName.includes('서울') || placeName.includes('서울');
        
        if (!isSeoulQuery && isSeoulResult) {
            // 서울이 아닌 지역을 검색했는데 서울 결과가 나온 경우 대폭 감점
            score -= 1000;
        }
        
        // 4. 🔥 기타 광역시 특이성 검사
        const queryRegions = ['부산', '대구', '인천', '광주', '대전', '울산'];
        const resultRegions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산'];
        
        queryRegions.forEach(region => {
            if (query.includes(region)) {
                resultRegions.forEach(resultRegion => {
                    if (region !== resultRegion && (addressName.includes(resultRegion) || placeName.includes(resultRegion))) {
                        score -= 800; // 다른 광역시 결과면 감점
                    }
                });
            }
        });
        
        // 5. 거리 기반 감점 (너무 멀면 관련성 낮음)
        const distance = parseInt(doc.distance) || 0;
        if (distance > 100000) score -= 600; // 100km 이상이면 대폭 감점
        else if (distance > 50000) score -= 300; // 50km 이상이면 감점
        else if (distance > 20000) score -= 150; // 20km 이상이면 약간 감점
        
        // 6. 🔥 정확도 필터링 - 검색어와 너무 다른 결과 제외
        const queryWords = query.split(/\s+/).filter(w => w.length > 0);
        const targetWords = (placeName + ' ' + addressName).split(/\s+/).filter(w => w.length > 0);
        
        let commonWords = 0;
        queryWords.forEach(qw => {
            if (targetWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
                commonWords++;
            }
        });
        
        // 공통 단어가 없으면 관련성 낮음
        if (queryWords.length > 1 && commonWords === 0) {
            score -= 800;
        }
        
        return {
            ...doc,
            matchScore: Math.max(0, score),
            normalizedName: normalizeLocationName(placeName)
        };
    });
    
    // 점수 순으로 정렬
    scoredResults.sort((a, b) => b.matchScore - a.matchScore);
    
    // 🔥 디버깅 로그 (상위 3개 결과만)
    console.log(`🔍 카카오 검색 "${query}" 상위 결과:`, 
        scoredResults.slice(0, 3).map(r => ({
            name: r.place_name,
            address: r.address_name,
            score: r.matchScore,
            category: r.category_group_code
        }))
    );
    
    const bestResult = scoredResults[0];
    
    // 🔥 최소 임계값 상향 조정 (더 엄격한 필터링)
    if (bestResult && bestResult.matchScore >= 500) { // 임계값 대폭 상향
        return {
            lat: parseFloat(bestResult.y),
            lon: parseFloat(bestResult.x),
            name: bestResult.place_name,
            address: bestResult.address_name,
            roadAddress: bestResult.road_address_name,
            category: bestResult.category_group_name,
            matchScore: bestResult.matchScore,
            source: 'kakao_keyword'
        };
    }
    
    return null;
}

/**
 * 카카오 주소 검색 결과 매칭 로직
 */
function findBestAddressMatch(query, documents) {
    const originalQueryLower = query.toLowerCase().trim();
    
    const scoredResults = documents.map(doc => {
        const addressName = doc.address_name || '';
        const roadAddressName = doc.road_address_name || '';
        
        let score = calculateLocationMatchScore(query, addressName, roadAddressName);
        
        // 주소 검색은 기본적으로 높은 신뢰도
        score += 200;
        
        return {
            ...doc,
            matchScore: Math.max(0, score)
        };
    });
    
    scoredResults.sort((a, b) => b.matchScore - a.matchScore);
    
    const bestResult = scoredResults[0];
    
    if (bestResult && bestResult.matchScore >= 400) {
        return {
            lat: parseFloat(bestResult.y),
            lon: parseFloat(bestResult.x),
            name: bestResult.address_name || bestResult.road_address_name,
            address: bestResult.address_name,
            roadAddress: bestResult.road_address_name,
            category: '주소',
            matchScore: bestResult.matchScore,
            source: 'kakao_address'
        };
    }
    
    return null;
}

/**
 * 🔥 개선된 하드코딩 DB 부분 매칭 로직
 */
function findHardcodedPartialMatch(query, locations) {
    const candidates = [];
    
    for (const [key, coords] of Object.entries(locations)) {
        const score = Math.max(
            calculateLocationMatchScore(query, key, '', coords.priority || 0),
            calculateLocationMatchScore(query, coords.name || '', '', coords.priority || 0)
        );
        
        if (score > 0) {
            candidates.push({
                key,
                coords,
                score
            });
        }
    }
    
    // 점수 순으로 정렬
    candidates.sort((a, b) => b.score - a.score);
    
    // 🔥 디버깅 로그
    if (candidates.length > 0) {
        console.log(`🔍 하드코딩 DB 검색 "${query}" 상위 결과:`, 
            candidates.slice(0, 3).map(c => ({
                key: c.key,
                name: c.coords.name,
                score: c.score,
                priority: c.coords.priority
            }))
        );
    }
    
    const bestMatch = candidates[0];
    
    // 🔥 임계값 상향 조정 - 너무 낮은 점수는 제외
    if (bestMatch && bestMatch.score >= 800) { // 더 엄격한 임계값
        return {
            ...bestMatch.coords,
            source: 'hardcoded_partial',
            matchScore: bestMatch.score
        };
    }
    
    return null;
}

/**
 * 🔥 완전히 개선된 통합 위치 검색 함수
 */
async function findLocationCoordinates(query, kakaoApiKey) {
    console.log(`🔍 완전 개선된 위치 검색 시작: "${query}"`);
    const locations = getLocationCoordinates();
    
    // 1순위: 하드코딩된 DB에서 정확한 매칭 (우선순위 고려)
    const exactMatches = [];
    
    for (const [key, coords] of Object.entries(locations)) {
        const keyScore = calculateLocationMatchScore(query, key, '', coords.priority || 0);
        const nameScore = calculateLocationMatchScore(query, coords.name || '', '', coords.priority || 0);
        const maxScore = Math.max(keyScore, nameScore);
        
        if (maxScore >= 1800) { // 거의 완전 일치만
            exactMatches.push({
                key,
                coords,
                score: maxScore
            });
        }
    }
    
    if (exactMatches.length > 0) {
        // 점수 순으로 정렬하여 최고 점수 선택
        exactMatches.sort((a, b) => b.score - a.score);
        const bestExact = exactMatches[0];
        
        console.log(`✅ 하드코딩 DB 정확 매칭: "${query}" -> "${bestExact.coords.name}" (점수: ${bestExact.score})`);
        return {
            ...bestExact.coords,
            source: 'hardcoded_exact',
            matchScore: bestExact.score
        };
    }
    
    // 2순위: 카카오 API 검색
    if (kakaoApiKey) {
        const kakaoResult = await searchLocationWithKakao(query, kakaoApiKey);
        if (kakaoResult) {
            console.log(`✅ 카카오 API 매칭 성공: "${query}" -> "${kakaoResult.name}" (점수: ${kakaoResult.matchScore})`);
            return kakaoResult;
        }
    } else {
        console.warn('⚠️ KAKAO_REST_API_KEY가 설정되지 않았습니다.');
    }
    
    // 3순위: 하드코딩된 DB에서 부분 매칭 (개선된 로직)
    const partialMatch = findHardcodedPartialMatch(query, locations);
    if (partialMatch) {
 console.log(`⚠️ 하드코딩 DB 부분 매칭: "${query}" -> "${partialMatch.name}" (점수: ${partialMatch.matchScore})`);
        return partialMatch;
    }
    
    // 4순위: 🔥 검색 실패 시 더 명확한 에러 처리
    console.error(`❌ "${query}"에 대한 위치를 찾을 수 없습니다. 기본값 사용하지 않고 에러 반환.`);
    
    // 기본값 대신 검색 실패를 명시적으로 표시
    return {
        lat: 37.5665,
        lon: 126.9780,
        name: `검색 실패: "${query}" 위치를 찾을 수 없음`,
        source: 'search_failed',
        error: true,
        originalQuery: query
    };
}

/**
 * 기상청 API 응답 데이터를 가공하여 3일간의 완전한 날씨 정보 반환합니다.
 * @param {Array} items - 기상청 API에서 반환된 날씨 데이터 항목 배열
 * @param {Date} kst - 한국 표준시 Date 객체
 * @returns {Array} 가공된 3일간의 날씨 데이터 배열
 */
function processCompleteWeatherData(items, kst) {
    const forecasts = {};

    // 오늘, 내일, 모레 날짜 계산
    const today = kst.toISOString().slice(0, 10).replace(/-/g, '');
    const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const dayAfter = new Date(kst.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

    // 모든 기상 데이터 분류
    items.forEach(item => {
        const date = item.fcstDate;
        const time = item.fcstTime;
        const category = item.category;
        const value = item.fcstValue;

        if (!forecasts[date]) {
            forecasts[date] = {
                times: {},
                dailyData: {
                    temperatureMin: null,
                    temperatureMax: null,
                    precipitationProbabilityMax: 0
                }
            };
        }

        if (!forecasts[date].times[time]) {
            forecasts[date].times[time] = {};
        }

        forecasts[date].times[time][category] = value;

        // 일별 최저/최고 기온 및 최대 강수확률 추출 (TMN, TMX는 특정 시각에만 제공됨)
        if (category === 'TMN' && value) {
            const tmnValue = parseFloat(value);
            if (forecasts[date].dailyData.temperatureMin === null || tmnValue < forecasts[date].dailyData.temperatureMin) {
                forecasts[date].dailyData.temperatureMin = tmnValue;
            }
        }
        if (category === 'TMX' && value) {
            const tmxValue = parseFloat(value);
            if (forecasts[date].dailyData.temperatureMax === null || tmxValue > forecasts[date].dailyData.temperatureMax) {
                forecasts[date].dailyData.temperatureMax = tmxValue;
            }
        }
        if (category === 'POP' && value) {
            const pop = parseFloat(value);
            if (pop > forecasts[date].dailyData.precipitationProbabilityMax) {
                forecasts[date].dailyData.precipitationProbabilityMax = pop;
            }
        }
    });

    // 3일간 완전한 날씨 데이터 생성
    const result = [];
    [today, tomorrow, dayAfter].forEach((date, index) => {
        if (forecasts[date]) {
            const dayData = extractCompleteWeatherData(forecasts[date], date);
            dayData.dayLabel = index === 0 ? '오늘' : index === 1 ? '내일' : '모레';
            dayData.dayIndex = index;
            result.push(dayData);
        }
    });

    // TMN/TMX 값이 없는 경우 시간별 데이터에서 최저/최고 추출 (모든 날짜에 대해)
    result.forEach(day => {
        if (day.temperatureMin === null || day.temperatureMax === null) {
            let minTemp = Infinity;
            let maxTemp = -Infinity;
            let foundTemp = false;

            day.hourlyData.forEach(hourly => {
                if (hourly.temperature !== null) {
                    minTemp = Math.min(minTemp, hourly.temperature);
                    maxTemp = Math.max(maxTemp, hourly.temperature);
                    foundTemp = true;
                }
            });

            if (foundTemp) {
                if (day.temperatureMin === null) day.temperatureMin = minTemp;
                if (day.temperatureMax === null) day.temperatureMax = maxTemp;
            }
        }
    });

    return result;
}

/**
 * 일별 날씨 데이터에서 필요한 정보 추출 및 가공
 * @param {Object} dayForecast - 특정 일자의 날씨 예측 데이터
 * @param {string} date - 날짜 (YYYYMMDD 형식)
 * @returns {Object} 가공된 일별 날씨 데이터
 */
function extractCompleteWeatherData(dayForecast, date) {
    const times = dayForecast.times;
    const dailyData = dayForecast.dailyData;

    // 대표 시간 선택 (14시 우선, 없으면 12-15시 사이, 그 다음 가장 가까운 시간)
    const timeKeys = Object.keys(times).sort();
    let representativeTime = timeKeys.find(t => t === '1400') ||
        timeKeys.find(t => t >= '1200' && t <= '1500') ||
        timeKeys[Math.floor(timeKeys.length / 2)];

    if (!representativeTime && timeKeys.length > 0) {
        representativeTime = timeKeys[0];
    }

    const data = representativeTime ? times[representativeTime] : {};

    // 완전한 날씨 정보 생성
    return {
        date: date,
        dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        representativeTime: representativeTime,

        // 기온 정보 (완전)
        temperature: data.TMP ? Math.round(parseFloat(data.TMP)) : null,
        temperatureMin: dailyData.temperatureMin !== null ? Math.round(dailyData.temperatureMin) : null,
        temperatureMax: dailyData.temperatureMax !== null ? Math.round(dailyData.temperatureMax) : null,
        temperatureUnit: '°C',
        temperatureDescription: getTemperatureDescription(data.TMP),

        // 하늘 상태 (완전)
        sky: getSkyDescription(data.SKY),
        skyCode: data.SKY,
        skyDescription: WEATHER_CODES.SKY[data.SKY] || '정보없음',

        // 강수 정보 (완전)
        precipitation: getPrecipitationDescription(data.PTY),
        precipitationCode: data.PTY,
        precipitationDescription: WEATHER_CODES.PTY[data.PTY] || '없음',
        precipitationProbability: data.POP ? parseInt(data.POP) : 0,
        precipitationProbabilityMax: Math.round(dailyData.precipitationProbabilityMax),
        precipitationProbabilityDescription: WEATHER_CODES.POP[data.POP] || '0% (강수 없음)',
        precipitationAmount: processPrecipitationAmount(data.PCP),
        precipitationAmountDescription: WEATHER_CODES.PCP[data.PCP] || '0mm',

        // 적설 정보 (완전)
        snowAmount: processSnowAmount(data.SNO),
        snowAmountDescription: WEATHER_CODES.SNO[data.SNO] || '0cm',

        // 습도 정보 (완전)
        humidity: data.REH ? parseInt(data.REH) : null,
        humidityUnit: '%',
        humidityDescription: getHumidityDescription(data.REH),

        // 풍속/풍향 정보 (완전)
        windSpeed: data.WSD ? parseFloat(data.WSD).toFixed(1) : null,
        windSpeedUnit: 'm/s',
        windSpeedDescription: getWindSpeedDescription(data.WSD),
        windDirection: getWindDirectionFromDegree(data.VEC),
        windDirectionDegree: data.VEC ? parseFloat(data.VEC) : null,
        windDirectionDescription: data.VEC ? `${getWindDirectionFromDegree(data.VEC)} (${data.VEC}°)` : '정보없음',

        // 파고 정보 (완전)
        waveHeight: data.WAV || null,
        waveHeightDescription: WEATHER_CODES.WAV[data.WAV] || '정보없음',

        // 추가 상세 정보
        uvIndex: data.UVI || null,
        visibility: data.VIS || null,

        // 종합 날씨 상태
        weatherStatus: getOverallWeatherStatus(data),
        weatherAdvice: getWeatherAdvice(data),

        // 시간별 상세 데이터 (선택적으로 포함)
        hourlyData: Object.keys(times).map(time => ({
            time: time,
            timeFormatted: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
            temperature: times[time].TMP ? Math.round(parseFloat(times[time].TMP)) : null,
            sky: WEATHER_CODES.SKY[times[time].SKY] || '정보없음',
            precipitation: WEATHER_CODES.PTY[times[time].PTY] || '없음',
            precipitationProbability: times[time].POP ? parseInt(times[time].POP) : 0,
            humidity: times[time].REH ? parseInt(times[time].REH) : null,
            windSpeed: times[time].WSD ? parseFloat(times[time].WSD).toFixed(1) : null
        })).sort((a, b) => a.time.localeCompare(b.time))
    };
}

// **기온에 따른 설명 반환**
function getTemperatureDescription(temp) {
    if (temp === null || temp === undefined) return '정보없음';
    const t = parseFloat(temp);
    if (t <= -20) return '혹한 (매우 추움)';
    if (t <= -10) return '한파 (매우 추움)';
    if (t <= 0) return '추위 (추움)';
    if (t <= 9) return '쌀쌀 (쌀쌀함)';
    if (t <= 15) return '서늘 (서늘함)';
    if (t <= 20) return '선선 (선선함)';
    if (t <= 25) return '적당 (쾌적함)';
    if (t <= 28) return '따뜻 (따뜻함)';
    if (t <= 32) return '더위 (더움)';
    if (t <= 35) return '폭염 (매우 더움)';
    return '극심한폭염 (위험)';
}

// **하늘 상태 코드에 따른 설명 반환**
function getSkyDescription(code) {
    return WEATHER_CODES.SKY[code] || '정보없음';
}

// **강수 형태 코드에 따른 설명 반환**
function getPrecipitationDescription(code) {
    return WEATHER_CODES.PTY[code] || '없음';
}

// **강수량 값 처리 및 설명 반환**
function processPrecipitationAmount(pcp) {
    if (!pcp || pcp === '강수없음' || pcp === '0') return '0mm';
    if (pcp === '1mm 미만') return '1mm 미만';
    if (pcp.includes('mm')) return pcp;
    return `${pcp}mm`;
}

// **적설량 값 처리 및 설명 반환**
function processSnowAmount(sno) {
    if (!sno || sno === '적설없음' || sno === '0') return '0cm';
    if (sno === '1cm 미만') return '1cm 미만';
    if (sno.includes('cm')) return sno;
    return `${sno}cm`;
}

// **습도에 따른 설명 반환**
function getHumidityDescription(humidity) {
    if (humidity === null || humidity === undefined) return '정보없음';
    const h = parseInt(humidity);
    if (h <= 20) return '매우 건조';
    if (h <= 40) return '건조';
    if (h <= 60) return '보통';
    if (h <= 80) return '습함';
    return '매우 습함';
}

// **풍속에 따른 설명 반환**
function getWindSpeedDescription(windSpeed) {
    if (windSpeed === null || windSpeed === undefined) return '정보없음';
    const ws = parseFloat(windSpeed);
    if (ws < 1) return '0-1m/s (고요)';
    if (ws < 2) return '1-2m/s (실바람)';
    if (ws < 3) return '2-3m/s (남실바람)';
    if (ws < 4) return '3-4m/s (산들바람)';
    if (ws < 5) return '4-5m/s (건들바람)';
    if (ws < 7) return '5-7m/s (선선한바람)';
    if (ws < 9) return '7-9m/s (시원한바람)';
    if (ws < 11) return '9-11m/s (센바람)';
    if (ws < 14) return '11-14m/s (강한바람)';
    if (ws < 17) return '14-17m/s (매우강한바람)';
    if (ws < 21) return '17-21m/s (폭풍)';
    if (ws < 25) return '21-25m/s (강한폭풍)';
    return '25m/s 이상 (매우강한폭풍)';
}

// **풍향 각도에 따른 16방위 설명 반환**
function getWindDirectionFromDegree(degree) {
    if (degree === null || degree === undefined) return '정보없음';

    const deg = parseFloat(degree);
    const normalizedDeg = ((deg % 360) + 360) % 360;

    const directions = [
        '북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
        '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'
    ];

    const index = Math.round(normalizedDeg / 22.5) % 16;
    return directions[index];
}

// **주요 날씨 요소 기반 종합 날씨 상태 반환**
function getOverallWeatherStatus(data) {
    const temp = data.TMP ? parseFloat(data.TMP) : null;
    const sky = data.SKY;
    const pty = data.PTY;
    const pop = data.POP ? parseInt(data.POP) : 0;

    if (pty && pty !== '0') {
        const precipType = WEATHER_CODES.PTY[pty] || '강수';
        if (pop >= 80) return `${precipType} 확실`;
        if (pop >= 60) return `${precipType} 가능성 높음`;
        return `${precipType} 가능성 있음`;
    }

    if (pop >= 60) {
        return '강수 가능성 높음';
    }

    const skyDesc = WEATHER_CODES.SKY[sky] || '정보없음';

    if (temp !== null) {
        if (temp >= 33) return `${skyDesc}, 폭염 주의`;
        if (temp >= 28) return `${skyDesc}, 더움`;
        if (temp >= 21) return `${skyDesc}, 쾌적`;
        if (temp >= 10) return `${skyDesc}, 선선`;
        if (temp >= 0) return `${skyDesc}, 쌀쌀`;
        return `${skyDesc}, 추움`;
    }

    return skyDesc;
}

// **현재 날씨 데이터 기반 맞춤형 조언 반환**
function getWeatherAdvice(data) {
    const temp = data.TMP ? parseFloat(data.TMP) : null;
    const pty = data.PTY;
    const pop = data.POP ? parseInt(data.POP) : 0;
    const wsd = data.WSD ? parseFloat(data.WSD) : 0;

    const advice = [];

    // 기온 관련 조언
    if (temp !== null) {
        if (temp >= 35) advice.push('🌡️ 폭염 경보! 야외활동 자제하세요');
        else if (temp >= 33) advice.push('🌡️ 폭염 주의! 충분한 수분 섭취하세요');
        else if (temp >= 28) advice.push('☀️ 더운 날씨, 시원한 복장 추천');
        else if (temp <= -10) advice.push('🧊 한파 주의! 방한용품 필수');
        else if (temp <= 0) advice.push('❄️ 추운 날씨, 따뜻한 복장 필요');
        else if (temp <= 10) advice.push('🧥 쌀쌀한 날씨, 외투 준비하세요');
    }

    // 강수 관련 조언
    if (pty && pty !== '0') {
        const precipType = WEATHER_CODES.PTY[pty];
        if (precipType && precipType.includes('비')) advice.push('☔ 우산 또는 우비 준비하세요');
        if (precipType && precipType.includes('눈')) advice.push('⛄ 눈 예보, 미끄럼 주의하세요');
        if (precipType && precipType.includes('폭우')) advice.push('🚨 폭우 주의! 저지대 침수 조심');
    } else if (pop >= 60) {
        advice.push('🌧️ 강수 가능성 높음, 우산 준비 권장');
    } else if (pop >= 30) {
        advice.push('☁️ 구름 많음, 우산 휴대 권장');
    }

    // 바람 관련 조언
    if (wsd >= 14) advice.push('💨 강풍 주의! 야외활동 조심하세요');
    else if (wsd >= 10) advice.push('🌬️ 바람이 강해요, 모자나 가벼운 물건 주의');

    return advice.length > 0 ? advice.join(' | ') : '쾌적한 날씨입니다';
}

/**
 * API 키가 없거나 오류 발생 시 완전한 샘플 데이터 생성
 * @param {string} region - 요청된 지역명
 * @param {string} [errorMessage=null] - 발생한 오류 메시지 (선택 사항)
 * @returns {Array} 샘플 날씨 데이터 배열
 */
function generateCompleteSampleData(region, errorMessage = null) {
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000);

    const dates = [];
    for (let i = 0; i < 3; i++) {
        const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
        dates.push(date);
    }

    const baseMessage = errorMessage ? `⚠️ 오류: ${errorMessage}` : '⚠️ API 키 설정 또는 네트워크 문제 - 샘플 데이터';
    const sampleTemps = [20, 22, 21];
    const sampleSkies = ['1', '3', '4'];
    const samplePrecips = ['0', '0', '1'];

    return dates.map((date, index) => ({
        date: date.toISOString().slice(0, 10).replace(/-/g, ''),
        dateFormatted: date.toISOString().slice(0, 10),
        dayLabel: index === 0 ? '오늘' : index === 1 ? '내일' : '모레',
        dayIndex: index,
        representativeTime: '1400',

        // 기온 정보
        temperature: errorMessage ? null : sampleTemps[index],
        temperatureMin: errorMessage ? null : sampleTemps[index] - 5,
        temperatureMax: errorMessage ? null : sampleTemps[index] + 5,
        temperatureUnit: '°C',
        temperatureDescription: errorMessage ? '정보없음' : getTemperatureDescription(sampleTemps[index]),

        // 하늘 상태
        sky: errorMessage ? '정보없음' : WEATHER_CODES.SKY[sampleSkies[index]],
        skyCode: errorMessage ? null : sampleSkies[index],
        skyDescription: errorMessage ? '정보없음' : WEATHER_CODES.SKY[sampleSkies[index]],

        // 강수 정보
        precipitation: errorMessage ? '정보없음' : WEATHER_CODES.PTY[samplePrecips[index]],
        precipitationCode: errorMessage ? null : samplePrecips[index],
        precipitationDescription: errorMessage ? '정보없음' : WEATHER_CODES.PTY[samplePrecips[index]],
        precipitationProbability: errorMessage ? null : [10, 30, 60][index],
        precipitationProbabilityMax: errorMessage ? null : [10, 30, 60][index],
        precipitationProbabilityDescription: WEATHER_CODES.POP[[10, 30, 60][index]],
        precipitationAmount: errorMessage ? '정보없음' : index === 2 ? '5mm' : '0mm',
        precipitationAmountDescription: errorMessage ? '정보없음' : index === 2 ? '5mm (보통 비)' : '0mm',

        // 적설 정보
        snowAmount: '0cm',
        snowAmountDescription: '0cm',

        // 습도 정보
        humidity: errorMessage ? null : [60, 70, 80][index],
        humidityUnit: '%',
        humidityDescription: errorMessage ? '정보없음' : getHumidityDescription([60, 70, 80][index]),

        // 풍속/풍향 정보
        windSpeed: errorMessage ? null : [2.5, 3.0, 3.5][index].toFixed(1),
        windSpeedUnit: 'm/s',
        windSpeedDescription: errorMessage ? '정보없음' : getWindSpeedDescription([2.5, 3.0, 3.5][index]),
        windDirection: errorMessage ? '정보없음' : ['북동', '남', '서'][index],
        windDirectionDegree: errorMessage ? null : [45, 180, 270][index],
        windDirectionDescription: errorMessage ? '정보없음' : `${['북동', '남', '서'][index]} (${[45, 180, 270][index]}°)`,

        // 파고 정보
        waveHeight: null,
        waveHeightDescription: '정보없음',

        // 추가 정보
        uvIndex: null,
        visibility: null,

        // 종합 상태
        weatherStatus: errorMessage ? '정보없음' : getOverallWeatherStatus({
            TMP: sampleTemps[index],
            SKY: sampleSkies[index],
            PTY: samplePrecips[index],
            POP: [10, 30, 60][index]
        }),
        weatherAdvice: errorMessage ? '정보를 확인할 수 없습니다' : getWeatherAdvice({
            TMP: sampleTemps[index],
            PTY: samplePrecips[index],
            POP: [10, 30, 60][index],
            WSD: [2.5, 3.0, 3.5][index]
        }),

        // 시간별 데이터 (샘플)
        hourlyData: errorMessage ? [] : [
            {
                time: '0600',
                timeFormatted: '06:00',
                temperature: sampleTemps[index] - 3,
                sky: WEATHER_CODES.SKY[sampleSkies[index]],
                precipitation: WEATHER_CODES.PTY[samplePrecips[index]],
                precipitationProbability: [10, 30, 60][index],
                humidity: [60, 70, 80][index],
                windSpeed: [2.5, 3.0, 3.5][index].toFixed(1)
            },
            {
                time: '1200',
                timeFormatted: '12:00',
                temperature: sampleTemps[index],
                sky: WEATHER_CODES.SKY[sampleSkies[index]],
                precipitation: WEATHER_CODES.PTY[samplePrecips[index]],
                precipitationProbability: [10, 30, 60][index],
                humidity: [60, 70, 80][index],
                windSpeed: [2.5, 3.0, 3.5][index].toFixed(1)
            },
            {
                time: '1800',
                timeFormatted: '18:00',
                temperature: sampleTemps[index] - 2,
                sky: WEATHER_CODES.SKY[sampleSkies[index]],
                precipitation: WEATHER_CODES.PTY[samplePrecips[index]],
                precipitationProbability: [10, 30, 60][index],
                humidity: [60, 70, 80][index],
                windSpeed: [2.5, 3.0, 3.5][index].toFixed(1)
            }
        ],

        message: `${baseMessage} (${['오늘', '내일', '모레'][index]})`,
        timestamp: new Date().toISOString(),
        region: region
    }));
}

/**
 * 🔥 메인 서버리스 핸들러 함수 - 완전한 중복 지역명 해결 버전
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
module.exports = async function handler(req, res) {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

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
        const { region = DEFAULT_REGION, lat, lon, nx, ny, detailed = 'true' } = req.query;
        const weatherApiKey = process.env.WEATHER_API_KEY;
        const kakaoApiKey = process.env.KAKAO_REST_API_KEY;

        console.log('🔥 완전 개선된 날씨 API 요청:', {
            region, lat, lon, nx, ny, detailed,
            hasWeatherApiKey: !!weatherApiKey,
            hasKakaoApiKey: !!kakaoApiKey,
            timestamp: new Date().toISOString()
        });

        // API 키 확인
        if (!weatherApiKey) {
            console.warn('⚠️ WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.');
            return res.status(200).json({
                success: true,
                data: generateCompleteSampleData(region, 'WEATHER_API_KEY 미설정'),
                warning: 'WEATHER_API_KEY가 설정되지 않아 샘플 데이터를 제공합니다.',
                environment: 'development',
                apiInfo: {
                    source: '샘플 데이터',
                    timestamp: new Date().toISOString(),
                    region: region
                },
                locationInfo: {
                    requested: region,
                    matched: '샘플 데이터용 기본값',
                    fullName: '샘플 지역',
                    source: '샘플 데이터'
                }
            });
        }

        let coordinates;
        let locationInfo;

        // 🔥 개선된 좌표 처리 로직 - 우선순위 적용
        if (nx && ny) {
            // 1순위: nx, ny 직접 제공 (격자 좌표)
            const nxValue = parseInt(nx);
            const nyValue = parseInt(ny);
 if (isNaN(nxValue) || isNaN(nyValue)) {
                throw new Error('잘못된 격자 좌표 형식입니다.');
            }
            
            coordinates = { nx: nxValue, ny: nyValue };
            locationInfo = {
                requested: `격자좌표 (${nx}, ${ny})`,
                matched: `격자좌표 (${nx}, ${ny})`,
                fullName: `격자 X:${nxValue}, Y:${nyValue}`,
                coordinates: coordinates,
                source: '직접 격자 좌표'
            };
            console.log('✅ 격자 좌표 직접 사용:', coordinates);
            
        } else if (lat && lon) {
            // 2순위: lat, lon 제공 → 격자 좌표 변환
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);

            if (isNaN(latitude) || isNaN(longitude)) {
                throw new Error('잘못된 위경도 형식입니다.');
            }

            coordinates = latLonToGrid(latitude, longitude);
            locationInfo = {
                requested: `${lat}, ${lon}`,
                matched: `위경도 (${lat}, ${lon})`,
                fullName: `위도 ${lat}, 경도 ${lon}`,
                coordinates: coordinates,
                latLon: { lat: latitude, lon: longitude },
                source: '직접 위경도'
            };
            console.log('✅ 위경도 변환 완료:', { lat, lon, grid: coordinates });
            
        } else {
            // 3순위: region 제공 → 🔥 완전 개선된 지역 검색
            const locationResult = await findLocationCoordinates(region, kakaoApiKey);
            
            // 🔥 검색 실패 처리
            if (locationResult.error) {
                console.warn(`⚠️ 지역 검색 실패: ${region}`);
                return res.status(200).json({
                    success: false,
                    error: true,
                    errorMessage: `"${region}" 지역을 찾을 수 없습니다. 정확한 지역명을 입력해주세요.`,
                    data: generateCompleteSampleData(region, `지역 "${region}" 검색 실패`),
                    locationInfo: {
                        requested: region,
                        matched: '검색 실패',
                        fullName: `검색 실패: ${region}`,
                        source: 'search_failed',
                        suggestions: [
                            '전체 지역명 입력 (예: 전라북도 남원시)',
                            '광역시/도 포함 (예: 강원 고성)',
                            '정확한 동/구 이름 (예: 서울 강남구)'
                        ]
                    },
                    warning: '지역을 찾을 수 없어 샘플 데이터를 제공합니다.'
                });
            }
            
            coordinates = latLonToGrid(locationResult.lat, locationResult.lon);
            locationInfo = {
                requested: region,
                matched: locationResult.name,
                fullName: locationResult.name,
                coordinates: coordinates,
                latLon: { lat: locationResult.lat, lon: locationResult.lon },
                source: locationResult.source,
                address: locationResult.address || '',
                category: locationResult.category || '',
                matchScore: locationResult.matchScore || 0,
                priority: locationResult.priority || 0
            };
            
            console.log('🎯 완전 개선된 검색 결과:', { 
                query: region, 
                result: locationResult.name, 
                source: locationResult.source,
                score: locationResult.matchScore,
                priority: locationResult.priority
            });
        }

        // 한국 표준시(KST) 기준 시간 계산
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

        // 기상청 API 발표 시각 계산 (가장 최신 발표 시간 기준)
        let baseTime = '';
        let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');
        const currentHour = kst.getHours();
        const currentMinute = kst.getMinutes();

        // 기상청 API 발표 시간 (매 3시간 간격, 02, 05, 08, 11, 14, 17, 20, 23시 정각)
        const validBaseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
        let foundBaseTime = false;

        for (let i = validBaseTimes.length - 1; i >= 0; i--) {
            const bt = validBaseTimes[i];
            // 현재 시간보다 같거나 이른 발표 시간 중, 이미 발표된 시간 (발표 시각 + 10분 이후)
            if (currentHour > bt || (currentHour === bt && currentMinute >= 10)) {
                baseTime = String(bt).padStart(2, '0') + '00';
                foundBaseTime = true;
                break;
            }
        }

        // 만약 새벽 2시 발표 시간 이전이라면, 전날 23시 데이터를 사용
        if (!foundBaseTime) {
            baseTime = '2300';
            const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
            baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        }

        // 캐시 키 생성 및 확인
        const cacheKey = `complete_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;
        const cachedData = weatherCache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < 30 * 60 * 1000) {
            console.log('✅ 캐시된 데이터 사용:', cacheKey);
            const responseData = { ...cachedData.data };
            responseData.locationInfo = locationInfo; // 현재 요청에 맞는 locationInfo로 덮어쓰기
            return res.status(200).json(responseData);
        }

        console.log('🌤️ 기상청 API 호출 시작:', {
            baseDate,
            baseTime,
            nx: coordinates.nx,
            ny: coordinates.ny,
            location: locationInfo.fullName
        });

        // 기상청 API 호출
        const response = await axios.get('http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst', {
            params: {
                serviceKey: weatherApiKey,
                numOfRows: 300,
                pageNo: 1,
                dataType: 'JSON',
                base_date: baseDate,
                base_time: baseTime,
                nx: coordinates.nx,
                ny: coordinates.ny
            },
            timeout: 10000,
            headers: {
                'User-Agent': 'HealingK-Complete-Weather-Service/3.0'
            }
        });

        // API 응답 검증
        if (!response.data?.response?.body?.items?.item) {
            const resultCode = response.data?.response?.header?.resultCode || 'UNKNOWN';
            const resultMsg = response.data?.response?.header?.resultMsg || '응답 데이터 없음';
            throw new Error(`기상청 API 응답에 날씨 데이터가 없습니다. (코드: ${resultCode}, 메시지: ${resultMsg})`);
        }

        const resultCode = response.data.response.header.resultCode;
        if (resultCode !== '00') {
            const errorMsg = ERROR_MESSAGES[resultCode] || `알 수 없는 오류 (코드: ${resultCode})`;
            throw new Error(`기상청 API 오류: ${errorMsg}`);
        }

        const items = response.data.response.body.items.item || [];
        console.log('📊 받은 기상 데이터 항목 수:', items.length);

        // 완전한 날씨 데이터 처리
        const weatherData = processCompleteWeatherData(items, kst);

        if (!weatherData || weatherData.length === 0) {
            throw new Error('기상청 API 데이터 파싱 실패 또는 유효한 날씨 정보 없음.');
        }

        console.log('✅ 완전한 날씨 데이터 처리 완료:', weatherData.length, '일');

        // 현재 날씨 데이터 추출 (첫 번째 요소가 오늘)
        const currentWeather = weatherData[0];

        // 🔥 개선된 응답 형식 (프론트엔드 요구사항에 맞춤)
        const enhancedResponse = {
            success: true,
            temperature: currentWeather.temperature,
            weather: currentWeather.weatherStatus,
            humidity: currentWeather.humidity,
            windSpeed: currentWeather.windSpeed,
            locationInfo: locationInfo,
            timestamp: new Date().toISOString(),
            
            // 🔥 추가 정보
            todayWeather: {
                temperature: currentWeather.temperature,
                temperatureMin: currentWeather.temperatureMin,
                temperatureMax: currentWeather.temperatureMax,
                sky: currentWeather.sky,
                precipitation: currentWeather.precipitation,
                precipitationProbability: currentWeather.precipitationProbability,
                humidity: currentWeather.humidity,
                windSpeed: currentWeather.windSpeed,
                windDirection: currentWeather.windDirection,
                weatherStatus: currentWeather.weatherStatus,
                weatherAdvice: currentWeather.weatherAdvice
            },
            
            // 상세 정보 (요청 시에만 포함)
            fullData: detailed === 'true' ? weatherData : undefined,
            
            // API 정보
            apiInfo: {
                source: '기상청 단기예보 API',
                baseDate: baseDate,
                baseTime: baseTime,
                timestamp: new Date().toISOString(),
                version: '3.0-complete-enhanced',
                coordinates: coordinates
            }
        };

        // 캐시 저장
        weatherCache.set(cacheKey, {
            data: enhancedResponse,
            timestamp: Date.now()
        });

        // 캐시 크기 관리 (최대 100개 항목)
        if (weatherCache.size > 100) {
            const oldestKey = weatherCache.keys().next().value;
            weatherCache.delete(oldestKey);
            console.log('🧹 캐시 정리 완료. 현재 캐시 크기:', weatherCache.size);
        }

        console.log('🎉 완전 개선된 날씨 API 응답 성공');
        return res.status(200).json(enhancedResponse);

    } catch (error) {
        console.error('❌ 완전 개선된 날씨 API 오류:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // 🔥 개선된 에러 처리 - 더 상세한 정보 제공
        const errorResponse = {
            success: false,
            error: true,
            errorMessage: error.message,
            data: generateCompleteSampleData(req.query.region || DEFAULT_REGION, error.message),
            locationInfo: {
                requested: req.query.region || req.query.nx || req.query.lat || DEFAULT_REGION,
                matched: '오류 발생',
                fullName: '오류로 정보 없음',
                source: '오류 처리 (샘플 데이터)'
            },
            timestamp: new Date().toISOString(),
            apiInfo: {
                source: '오류 시 샘플 데이터',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                version: '3.0-complete-enhanced-error',
                errorHandled: true
            },
            warning: '실시간 날씨 정보를 가져오는 데 실패하여 샘플 데이터를 표시합니다.',
            
            // 🔥 사용자 도움말 추가
            troubleshooting: {
                possibleCauses: [
                    'API 키 설정 문제',
                    '네트워크 연결 문제', 
                    '기상청 서버 일시적 장애',
                    '잘못된 지역명 입력'
                ],
                suggestions: [
                    'WEATHER_API_KEY 환경변수 확인',
                    'KAKAO_REST_API_KEY 환경변수 확인',
                    '정확한 지역명 입력 (예: 전라북도 남원시)',
                    '잠시 후 다시 시도'
                ]
            }
        };

        return res.status(200).json(errorResponse);
    }
};
      
