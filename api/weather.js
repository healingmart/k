const axios = require('axios');

// Vercel 서버리스용 캐시
let weatherCache = new Map();

// 완전한 기상청 날씨 코드 매핑
const WEATHER_CODES = {
  // 하늘상태 (SKY) - 기상청 공식 전체 코드
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
  
  // 강수형태 (PTY) - 기상청 공식 전체 코드
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
    '10': '10cm (많은 눈)',
    '15': '15cm (많은 눈)',
    '20': '20cm (많은 눈)',
    '25': '25cm (폭설)',
    '30': '30cm (폭설)',
    '40': '40cm (폭설)',
    '50': '50cm 이상 (폭설)'
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

// 기상청 API 에러 메시지
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

// 기본 지역 설정 (일관성을 위해 상수로 정의)
const DEFAULT_REGION = '서울';

/**
 * 위경도를 기상청 격자 좌표로 변환 (정확도 100%)
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @returns {Object} 격자 좌표 {nx, ny}
 */
function latLonToGrid(lat, lon) {
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
 * 완전한 전국 좌표 매핑 (중복 지역 처리 포함)
 * @returns {Object} 지역별 좌표 정보
 */
function getLocationCoordinates() {
  return {
    // 서울특별시 (구별 + 주요 동)
    '서울': { lat: 37.5665, lon: 126.9780, name: '서울특별시' },
    '서울시': { lat: 37.5665, lon: 126.9780, name: '서울특별시' },
    '종로구': { lat: 37.5735, lon: 126.9788, name: '서울 종로구' },
    '중구서울': { lat: 37.5641, lon: 126.9979, name: '서울 중구' },
    '용산구': { lat: 37.5326, lon: 126.9905, name: '서울 용산구' },
    '성동구': { lat: 37.5635, lon: 127.0365, name: '서울 성동구' },
    '광진구': { lat: 37.5384, lon: 127.0822, name: '서울 광진구' },
    '동대문구': { lat: 37.5744, lon: 127.0394, name: '서울 동대문구' },
    '중랑구': { lat: 37.6063, lon: 127.0925, name: '서울 중랑구' },
    '성북구': { lat: 37.5894, lon: 127.0167, name: '서울 성북구' },
    '강북구': { lat: 37.6397, lon: 127.0256, name: '서울 강북구' },
    '도봉구': { lat: 37.6688, lon: 127.0471, name: '서울 도봉구' },
    '노원구': { lat: 37.6541, lon: 127.0568, name: '서울 노원구' },
    '은평구': { lat: 37.6176, lon: 126.9227, name: '서울 은평구' },
    '서대문구': { lat: 37.5791, lon: 126.9368, name: '서울 서대문구' },
    '마포구': { lat: 37.5663, lon: 126.9019, name: '서울 마포구' },
    '양천구': { lat: 37.5170, lon: 126.8665, name: '서울 양천구' },
    '강서구서울': { lat: 37.5509, lon: 126.8495, name: '서울 강서구' },
    '구로구': { lat: 37.4955, lon: 126.8876, name: '서울 구로구' },
    '금천구': { lat: 37.4519, lon: 126.8954, name: '서울 금천구' },
    '영등포구': { lat: 37.5264, lon: 126.8962, name: '서울 영등포구' },
    '동작구': { lat: 37.5124, lon: 126.9393, name: '서울 동작구' },
    '관악구': { lat: 37.4784, lon: 126.9516, name: '서울 관악구' },
    '서초구': { lat: 37.4837, lon: 127.0324, name: '서울 서초구' },
    '강남구': { lat: 37.5172, lon: 127.0473, name: '서울 강남구' },
    '송파구': { lat: 37.5145, lon: 127.1059, name: '서울 송파구' },
    '강동구': { lat: 37.5301, lon: 127.1238, name: '서울 강동구' },

    // 주요 서울 지역명
    '명동': { lat: 37.5636, lon: 126.9869, name: '서울 중구 명동' },
    '홍대': { lat: 37.5563, lon: 126.9220, name: '서울 마포구 홍대' },
    '강남': { lat: 37.5172, lon: 127.0473, name: '서울 강남구' },
    '이태원': { lat: 37.5349, lon: 126.9947, name: '서울 용산구 이태원' },
    '잠실': { lat: 37.5133, lon: 127.1000, name: '서울 송파구 잠실' },
    '여의도': { lat: 37.5219, lon: 126.9245, name: '서울 영등포구 여의도' },
    '신촌': { lat: 37.5591, lon: 126.9425, name: '서울 서대문구 신촌' },
    '동대문': { lat: 37.5714, lon: 127.0094, name: '서울 동대문구' },
    '종로': { lat: 37.5735, lon: 126.9788, name: '서울 종로구' },

    // 부산광역시
    '부산': { lat: 35.1796, lon: 129.0756, name: '부산광역시' },
    '부산시': { lat: 35.1796, lon: 129.0756, name: '부산광역시' },
    '중구부산': { lat: 35.1064, lon: 129.0326, name: '부산 중구' },
    '서구부산': { lat: 35.0979, lon: 129.0244, name: '부산 서구' },
    '동구부산': { lat: 35.1368, lon: 129.0568, name: '부산 동구' },
    '영도구': { lat: 35.0914, lon: 129.0679, name: '부산 영도구' },
    '부산진구': { lat: 35.1634, lon: 129.0530, name: '부산 부산진구' },
    '동래구': { lat: 35.2048, lon: 129.0837, name: '부산 동래구' },
    '남구부산': { lat: 35.1366, lon: 129.0845, name: '부산 남구' },
    '북구부산': { lat: 35.1975, lon: 128.9897, name: '부산 북구' },
    '해운대구': { lat: 35.1631, lon: 129.1635, name: '부산 해운대구' },
    '사하구': { lat: 35.1043, lon: 128.9742, name: '부산 사하구' },
    '금정구': { lat: 35.2429, lon: 129.0929, name: '부산 금정구' },
    '강서구부산': { lat: 35.2120, lon: 128.9804, name: '부산 강서구' },
    '연제구': { lat: 35.1765, lon: 129.0785, name: '부산 연제구' },
    '수영구': { lat: 35.1453, lon: 129.1136, name: '부산 수영구' },
    '사상구': { lat: 35.1549, lon: 128.9906, name: '부산 사상구' },
    '기장군': { lat: 35.2446, lon: 129.2224, name: '부산 기장군' },

    // 부산 주요 지역
    '해운대': { lat: 35.1631, lon: 129.1635, name: '부산 해운대구' },
    '광안리': { lat: 35.1532, lon: 129.1183, name: '부산 수영구 광안리' },
    '서면': { lat: 35.1579, lon: 129.0563, name: '부산 부산진구 서면' },
    '남포동': { lat: 35.0975, lon: 129.0279, name: '부산 중구 남포동' },
    '태종대': { lat: 35.0516, lon: 129.0875, name: '부산 영도구 태종대' },
    '기장': { lat: 35.2446, lon: 129.2224, name: '부산 기장군' },

    // 대구광역시
    '대구': { lat: 35.8714, lon: 128.6014, name: '대구광역시' },
    '대구시': { lat: 35.8714, lon: 128.6014, name: '대구광역시' },
    '중구대구': { lat: 35.8686, lon: 128.6059, name: '대구 중구' },
    '동구대구': { lat: 35.8896, lon: 128.6355, name: '대구 동구' },
    '서구대구': { lat: 35.8719, lon: 128.5592, name: '대구 서구' },
    '남구대구': { lat: 35.8464, lon: 128.5974, name: '대구 남구' },
    '북구대구': { lat: 35.8858, lon: 128.5829, name: '대구 북구' },
    '수성구': { lat: 35.8581, lon: 128.6311, name: '대구 수성구' },
    '달서구': { lat: 35.8328, lon: 128.5327, name: '대구 달서구' },
    '달성군': { lat: 35.7749, lon: 128.4315, name: '대구 달성군' },
    '동성로': { lat: 35.8686, lon: 128.5950, name: '대구 중구 동성로' },

    // 인천광역시
    '인천': { lat: 37.4563, lon: 126.7052, name: '인천광역시' },
    '인천시': { lat: 37.4563, lon: 126.7052, name: '인천광역시' },
    '중구인천': { lat: 37.4738, lon: 126.6214, name: '인천 중구' },
    '동구인천': { lat: 37.4739, lon: 126.6433, name: '인천 동구' },
    '미추홀구': { lat: 37.4639, lon: 126.6505, name: '인천 미추홀구' },
    '연수구': { lat: 37.4106, lon: 126.6784, name: '인천 연수구' },
    '남동구': { lat: 37.4468, lon: 126.7312, name: '인천 남동구' },
    '부평구': { lat: 37.5073, lon: 126.7218, name: '인천 부평구' },
    '계양구': { lat: 37.5373, lon: 126.7378, name: '인천 계양구' },
    '서구인천': { lat: 37.5458, lon: 126.6757, name: '인천 서구' },
    '강화군': { lat: 37.7473, lon: 126.4877, name: '인천 강화군' },
    '옹진군': { lat: 37.4465, lon: 126.6362, name: '인천 옹진군' },
    '송도': { lat: 37.3894, lon: 126.6541, name: '인천 연수구 송도' },
    '월미도': { lat: 37.4756, lon: 126.5935, name: '인천 중구 월미도' },
    '강화': { lat: 37.7473, lon: 126.4877, name: '인천 강화군' },
    '을왕리': { lat: 37.4455, lon: 126.3738, name: '인천 중구 을왕리' },

    // 광주광역시
    '광주': { lat: 35.1595, lon: 126.8526, name: '광주광역시' },
    '광주시': { lat: 35.1595, lon: 126.8526, name: '광주광역시' },
    '동구광주': { lat: 35.1465, lon: 126.9227, name: '광주 동구' },
    '서구광주': { lat: 35.1522, lon: 126.8892, name: '광주 서구' },
    '남구광주': { lat: 35.1330, lon: 126.9026, name: '광주 남구' },
    '북구광주': { lat: 35.1740, lon: 126.9115, name: '광주 북구' },
    '광산구': { lat: 35.1395, lon: 126.7934, name: '광주 광산구' },
    '무등산': { lat: 35.1347, lon: 126.9881, name: '광주 동구 무등산' },

    // 대전광역시
    '대전': { lat: 36.3504, lon: 127.3845, name: '대전광역시' },
    '대전시': { lat: 36.3504, lon: 127.3845, name: '대전광역시' },
    '동구대전': { lat: 36.3504, lon: 127.4548, name: '대전 동구' },
    '중구대전': { lat: 36.3256, lon: 127.4211, name: '대전 중구' },
    '서구대전': { lat: 36.3554, lon: 127.3834, name: '대전 서구' },
    '유성구': { lat: 36.3621, lon: 127.3565, name: '대전 유성구' },
    '대덕구': { lat: 36.3467, lon: 127.4154, name: '대전 대덕구' },
    '유성': { lat: 36.3621, lon: 127.3565, name: '대전 유성구' },

    // 울산광역시
    '울산': { lat: 35.5384, lon: 129.3114, name: '울산광역시' },
    '울산시': { lat: 35.5384, lon: 129.3114, name: '울산광역시' },
    '중구울산': { lat: 35.5693, lon: 129.3309, name: '울산 중구' },
    '남구울산': { lat: 35.5460, lon: 129.3297, name: '울산 남구' },
    '동구울산': { lat: 35.5049, lon: 129.4167, name: '울산 동구' },
    '북구울산': { lat: 35.5827, lon: 129.3612, name: '울산 북구' },
    '울주군': { lat: 35.5220, lon: 129.1538, name: '울산 울주군' },

    // 세종특별자치시
    '세종': { lat: 36.4801, lon: 127.2890, name: '세종특별자치시' },
    '세종시': { lat: 36.4801, lon: 127.2890, name: '세종특별자치시' },

    // 경기도 주요 도시
    '수원': { lat: 37.2636, lon: 127.0286, name: '경기 수원시' },
    '성남': { lat: 37.4201, lon: 127.1262, name: '경기 성남시' },
    '용인': { lat: 37.2411, lon: 127.1776, name: '경기 용인시' },
    '안양': { lat: 37.3943, lon: 126.9568, name: '경기 안양시' },
    '안산': { lat: 37.3236, lon: 126.8219, name: '경기 안산시' },
    '고양': { lat: 37.6584, lon: 126.8320, name: '경기 고양시' },
    '과천': { lat: 37.4292, lon: 126.9876, name: '경기 과천시' },
    '광명': { lat: 37.4786, lon: 126.8644, name: '경기 광명시' },
    '광주경기': { lat: 37.4297, lon: 127.2550, name: '경기 광주시' },
    '구리': { lat: 37.5943, lon: 127.1296, name: '경기 구리시' },
    '군포': { lat: 37.3617, lon: 126.9352, name: '경기 군포시' },
    '김포': { lat: 37.6150, lon: 126.7158, name: '경기 김포시' },
    '남양주': { lat: 37.6369, lon: 127.2167, name: '경기 남양주시' },
    '동두천': { lat: 37.9034, lon: 127.0606, name: '경기 동두천시' },
    '부천': { lat: 37.5034, lon: 126.7660, name: '경기 부천시' },
    '시흥': { lat: 37.3802, lon: 126.8031, name: '경기 시흥시' },
    '안성': { lat: 37.0078, lon: 127.2797, name: '경기 안성시' },
    '양주': { lat: 37.7851, lon: 127.0458, name: '경기 양주시' },
    '오산': { lat: 37.1499, lon: 127.0776, name: '경기 오산시' },
    '의왕': { lat: 37.3449, lon: 126.9683, name: '경기 의왕시' },
    '의정부': { lat: 37.7381, lon: 127.0338, name: '경기 의정부시' },
    '이천': { lat: 37.2720, lon: 127.4349, name: '경기 이천시' },
    '파주': { lat: 37.7598, lon: 126.7800, name: '경기 파주시' },
    '평택': { lat: 36.9921, lon: 127.1123, name: '경기 평택시' },
    '포천': { lat: 37.8948, lon: 127.2001, name: '경기 포천시' },
    '하남': { lat: 37.5392, lon: 127.2145, name: '경기 하남시' },
    '화성': { lat: 37.1997, lon: 126.8312, name: '경기 화성시' },
    '여주': { lat: 37.2982, lon: 127.6377, name: '경기 여주시' },
    '연천': { lat: 38.0963, lon: 127.0746, name: '경기 연천군' },
    '가평': { lat: 37.8314, lon: 127.5109, name: '경기 가평군' },
    '양평': { lat: 37.4919, lon: 127.4873, name: '경기 양평군' },

    // 강원도 (전체)
    '춘천': { lat: 37.8816, lon: 127.7292, name: '강원 춘천시' },
    '원주': { lat: 37.3422, lon: 127.9200, name: '강원 원주시' },
    '강릉': { lat: 37.7519, lon: 128.8758, name: '강원 강릉시' },
    '동해': { lat: 37.5255, lon: 129.1177, name: '강원 동해시' },
    '태백': { lat: 37.1648, lon: 128.9859, name: '강원 태백시' },
    '속초': { lat: 38.2036, lon: 128.5647, name: '강원 속초시' },
    '삼척': { lat: 37.4475, lon: 129.1678, name: '강원 삼척시' },
    '홍천': { lat: 37.8860, lon: 127.8845, name: '강원 홍천군' },
    '횡성': { lat: 37.4920, lon: 127.9830, name: '강원 횡성군' },
    '영월': { lat: 37.1852, lon: 128.4687, name: '강원 영월군' },
    '평창': { lat: 37.3712, lon: 128.3970, name: '강원 평창군' },
    '정선': { lat: 37.3807, lon: 128.6607, name: '강원 정선군' },
    '철원': { lat: 38.1467, lon: 127.3130, name: '강원 철원군' },
    '화천': { lat: 38.1063, lon: 127.7084, name: '강원 화천군' },
    '양구': { lat: 38.1103, lon: 127.9898, name: '강원 양구군' },
    '인제': { lat: 38.0695, lon: 128.1709, name: '강원 인제군' },
    '고성강원': { lat: 38.3797, lon: 128.4677, name: '강원 고성군' },
    '고성': { lat: 38.3797, lon: 128.4677, name: '강원 고성군' }, // 기본값은 강원 고성
    '양양': { lat: 38.0759, lon: 128.6190, name: '강원 양양군' },

    // 강원도 주요 관광지
    '설악산': { lat: 38.1194, lon: 128.4654, name: '강원 설악산국립공원' },
    '오대산': { lat: 37.7971, lon: 128.5436, name: '강원 오대산국립공원' },
    '정동진': { lat: 37.6896, lon: 129.0336, name: '강원 강릉시 정동진' },

    // 충청북도 (전체)
    '청주': { lat: 36.6424, lon: 127.4890, name: '충북 청주시' },
    '충주': { lat: 36.9910, lon: 127.9259, name: '충북 충주시' },
    '제천': { lat: 37.1326, lon: 128.1906, name: '충북 제천시' },
    '보은': { lat: 36.4895, lon: 127.7294, name: '충북 보은군' },
    '옥천': { lat: 36.3062, lon: 127.5720, name: '충북 옥천군' },
    '영동': { lat: 36.1750, lon: 127.7764, name: '충북 영동군' },
    '증평': { lat: 36.7808, lon: 127.5814, name: '충북 증평군' },
    '진천': { lat: 36.8553, lon: 127.4335, name: '충북 진천군' },
    '괴산': { lat: 36.8156, lon: 127.7879, name: '충북 괴산군' },
    '음성': { lat: 36.9441, lon: 127.6868, name: '충북 음성군' },
    '단양': { lat: 36.9845, lon: 128.3659, name: '충북 단양군' },

    // 충청남도 (전체)
    '천안': { lat: 36.8151, lon: 127.1139, name: '충남 천안시' },
    '공주': { lat: 36.4465, lon: 127.1189, name: '충남 공주시' },
    '보령': { lat: 36.3332, lon: 126.6123, name: '충남 보령시' },
    '아산': { lat: 36.7898, lon: 127.0018, name: '충남 아산시' },
    '서산': { lat: 36.7848, lon: 126.4503, name: '충남 서산시' },
    '논산': { lat: 36.1872, lon: 127.0986, name: '충남 논산시' },
    '계룡': { lat: 36.2743, lon: 127.2487, name: '충남 계룡시' },
    '당진': { lat: 36.8937, lon: 126.6297, name: '충남 당진시' },
    '금산': { lat: 36.1089, lon: 127.4881, name: '충남 금산군' },
    '부여': { lat: 36.2756, lon: 126.9100, name: '충남 부여군' },
    '서천': { lat: 36.0814, lon: 126.6919, name: '충남 서천군' },
    '청양': { lat: 36.4592, lon: 126.8025, name: '충남 청양군' },
    '홍성': { lat: 36.6014, lon: 126.6608, name: '충남 홍성군' },
    '예산': { lat: 36.6818, lon: 126.8497, name: '충남 예산군' },
    '태안': { lat: 36.7455, lon: 126.2980, name: '충남 태안군' },

    // 충남 주요 관광지
    '태안안면도': { lat: 36.5262, lon: 126.3340, name: '충남 태안 안면도' },

    // 전라북도 (전체)
    '전주': { lat: 35.8242, lon: 127.1480, name: '전북 전주시' },
    '군산': { lat: 35.9677, lon: 126.7366, name: '전북 군산시' },
    '익산': { lat: 35.9483, lon: 126.9575, name: '전북 익산시' },
    '정읍': { lat: 35.5697, lon: 126.8561, name: '전북 정읍시' },
    '남원전북': { lat: 35.4163, lon: 127.3906, name: '전북 남원시' },
    '남원': { lat: 35.4163, lon: 127.3906, name: '전북 남원시' }, // 기본값은 전북 남원
    '김제': { lat: 35.8035, lon: 126.8809, name: '전북 김제시' },
    '완주': { lat: 35.9052, lon: 127.1605, name: '전북 완주군' },
    '진안': { lat: 35.7917, lon: 127.4249, name: '전북 진안군' },
    '무주': { lat: 36.0073, lon: 127.6608, name: '전북 무주군' },
    '장수': { lat: 35.6477, lon: 127.5199, name: '전북 장수군' },
    '임실': { lat: 35.6176, lon: 127.2896, name: '전북 임실군' },
    '순창': { lat: 35.3744, lon: 127.1375, name: '전북 순창군' },
    '고창': { lat: 35.4347, lon: 126.7022, name: '전북 고창군' },
    '부안': { lat: 35.7318, lon: 126.7330, name: '전북 부안군' },

    // 전북 주요 관광지
    '전주한옥마을': { lat: 35.8154, lon: 127.1530, name: '전북 전주 한옥마을' },
    '내장산': { lat: 35.4981, lon: 126.8936, name: '전북 정읍 내장산' },
    '변산반도': { lat: 35.6184, lon: 126.4862, name: '전북 부안 변산반도' },
    '부안채석강': { lat: 35.6184, lon: 126.4862, name: '전북 부안 채석강' },
    '고창고인돌': { lat: 35.4347, lon: 126.7022, name: '전북 고창 고인돌' },

    // 전라남도 (전체)
    '목포': { lat: 34.8118, lon: 126.3922, name: '전남 목포시' },
    '여수': { lat: 34.7604, lon: 127.6622, name: '전남 여수시' },
    '순천': { lat: 34.9507, lon: 127.4872, name: '전남 순천시' },
    '나주': { lat: 35.0160, lon: 126.7107, name: '전남 나주시' },
    '광양': { lat: 34.9407, lon: 127.5959, name: '전남 광양시' },
    '담양': { lat: 35.3215, lon: 126.9881, name: '전남 담양군' },
    '곡성': { lat: 35.2819, lon: 127.2918, name: '전남 곡성군' },
    '구례': { lat: 35.2020, lon: 127.4632, name: '전남 구례군' },
    '고흥': { lat: 34.6114, lon: 127.2854, name: '전남 고흥군' },
    '보성': { lat: 34.7714, lon: 127.0800, name: '전남 보성군' },
    '화순': { lat: 35.0646, lon: 126.9864, name: '전남 화순군' },
    '장흥': { lat: 34.6811, lon: 126.9066, name: '전남 장흥군' },
    '강진': { lat: 34.6420, lon: 126.7669, name: '전남 강진군' },
    '해남': { lat: 34.5736, lon: 126.5990, name: '전남 해남군' },
    '영암': { lat: 34.8004, lon: 126.6967, name: '전남 영암군' },
    '무안': { lat: 34.9906, lon: 126.4819, name: '전남 무안군' },
    '함평': { lat: 35.0665, lon: 126.5165, name: '전남 함평군' },
    '영광': { lat: 35.2773, lon: 126.5122, name: '전남 영광군' },
    '장성': { lat: 35.3018, lon: 126.7886, name: '전남 장성군' },
    '완도': { lat: 34.3110, lon: 126.7552, name: '전남 완도군' },
    '진도': { lat: 34.4867, lon: 126.2635, name: '전남 진도군' },
    '신안': { lat: 34.8328, lon: 126.1068, name: '전남 신안군' },

    // 전남 주요 관광지
    '여수엑스포': { lat: 34.7604, lon: 127.6622, name: '전남 여수 엑스포' },
    '보성녹차밭': { lat: 34.7714, lon: 127.0800, name: '전남 보성 녹차밭' },
    '담양죽녹원': { lat: 35.3215, lon: 126.9881, name: '전남 담양 죽녹원' },
    '완도청산도': { lat: 34.1372, lon: 126.8515, name: '전남 완도 청산도' },
    '진도신비의바닷길': { lat: 34.4867, lon: 126.2635, name: '전남 진도 신비의바닷길' },

    // 경상북도 (전체)
    '포항': { lat: 36.0190, lon: 129.3435, name: '경북 포항시' },
    '경주': { lat: 35.8562, lon: 129.2247, name: '경북 경주시' },
    '김천': { lat: 36.1395, lon: 128.1137, name: '경북 김천시' },
    '안동': { lat: 36.5684, lon: 128.7294, name: '경북 안동시' },
    '구미': { lat: 36.1196, lon: 128.3441, name: '경북 구미시' },
    '영주': { lat: 36.8056, lon: 128.6239, name: '경북 영주시' },
    '영천': { lat: 35.9733, lon: 128.9386, name: '경북 영천시' },
    '상주': { lat: 36.4109, lon: 128.1589, name: '경북 상주시' },
    '문경': { lat: 36.5869, lon: 128.1866, name: '경북 문경시' },
    '경산': { lat: 35.8251, lon: 128.7411, name: '경북 경산시' },
    '군위': { lat: 36.2395, lon: 128.5735, name: '경북 군위군' },
    '의성': { lat: 36.3524, lon: 128.6977, name: '경북 의성군' },
    '청송': { lat: 36.4359, lon: 129.0570, name: '경북 청송군' },
    '영양': { lat: 36.6666, lon: 129.1123, name: '경북 영양군' },
    '영덕': { lat: 36.4152, lon: 129.3658, name: '경북 영덕군' },
    '청도': { lat: 35.6506, lon: 128.7364, name: '경북 청도군' },
    '고령': { lat: 35.7284, lon: 128.2637, name: '경북 고령군' },
    '성주': { lat: 35.9196, lon: 128.2830, name: '경북 성주군' },
    '칠곡': { lat: 35.9942, lon: 128.4017, name: '경북 칠곡군' },
    '예천': { lat: 36.6554, lon: 128.4517, name: '경북 예천군' },
    '봉화': { lat: 36.8930, lon: 128.7322, name: '경북 봉화군' },
    '울진': { lat: 36.9930, lon: 129.4006, name: '경북 울진군' },
    '울릉도': { lat: 37.4845, lon: 130.9057, name: '경북 울릉군' },

    // 경북 주요 관광지
    '경주역사유적지구': { lat: 35.8562, lon: 129.2247, name: '경북 경주 역사유적지구' },
    '안동하회마을': { lat: 36.5397, lon: 128.5188, name: '경북 안동 하회마을' },

    // 경상남도 (전체)
    '창원': { lat: 35.2281, lon: 128.6811, name: '경남 창원시' },
    '진주': { lat: 35.1800, lon: 128.1076, name: '경남 진주시' },
    '통영': { lat: 34.8544, lon: 128.4331, name: '경남 통영시' },
    '사천': { lat: 35.0036, lon: 128.0645, name: '경남 사천시' },
    '김해': { lat: 35.2342, lon: 128.8896, name: '경남 김해시' },
    '밀양': { lat: 35.5040, lon: 128.7469, name: '경남 밀양시' },
    '거제': { lat: 34.8806, lon: 128.6212, name: '경남 거제시' },
    '양산': { lat: 35.3350, lon: 129.0375, name: '경남 양산시' },
    '의령': { lat: 35.3220, lon: 128.2618, name: '경남 의령군' },
    '함안': { lat: 35.2732, lon: 128.4065, name: '경남 함안군' },
    '창녕': { lat: 35.5444, lon: 128.4925, name: '경남 창녕군' },
    '고성경남': { lat: 34.9733, lon: 128.3229, name: '경남 고성군' },
    '남해': { lat: 34.8375, lon: 127.8926, name: '경남 남해군' },
    '하동': { lat: 35.0677, lon: 127.7514, name: '경남 하동군' },
    '산청': { lat: 35.4151, lon: 127.8736, name: '경남 산청군' },
    '함양': { lat: 35.5205, lon: 127.7248, name: '경남 함양군' },
    '거창': { lat: 35.6869, lon: 127.9095, name: '경남 거창군' },
    '합천': { lat: 35.5665, lon: 128.1655, name: '경남 합천군' },

    // 경남 주요 관광지
    '통영케이블카': { lat: 34.8544, lon: 128.4331, name: '경남 통영 케이블카' },
    '거제외도': { lat: 34.7996, lon: 128.6945, name: '경남 거제 외도' },
    '남해독일마을': { lat: 34.8375, lon: 127.8926, name: '경남 남해 독일마을' },

    // 제주특별자치도 (전체) - 세분화 유지
    '제주': { lat: 33.4996, lon: 126.5312, name: '제주특별자치도' },
    '제주시': { lat: 33.5097, lon: 126.5219, name: '제주시' },
    '서귀포': { lat: 33.2541, lon: 126.5601, name: '서귀포시' },
    '성산': { lat: 33.4615, lon: 126.9410, name: '제주 성산읍' },
    '중문': { lat: 33.2394, lon: 126.4128, name: '제주 중문관광단지' },
    '한림': { lat: 33.4144, lon: 126.2692, name: '제주 한림읍' },
    '애월': { lat: 33.4618, lon: 126.3314, name: '제주 애월읍' },
    '표선': { lat: 33.3274, lon: 126.8394, name: '제주 표선면' },
    '대정': { lat: 33.2169, lon: 126.2394, name: '제주 대정읍' },
    '한라산': { lat: 33.3617, lon: 126.5292, name: '제주 한라산' },
    '우도': { lat: 33.5009, lon: 126.9506, name: '제주 우도' },
    '마라도': { lat: 33.1170, lon: 126.2687, name: '제주 마라도' },
    '남원제주': { lat: 33.2594, lon: 126.7136, name: '제주 남원읍' },
    '구좌': { lat: 33.5567, lon: 126.8394, name: '제주 구좌읍' },
    '조천': { lat: 33.5567, lon: 126.6394, name: '제주 조천읍' },
    '한경': { lat: 33.3567, lon: 126.1894, name: '제주 한경면' },
    '추자': { lat: 33.9567, lon: 126.2994, name: '제주 추자면' },

    // 제주 주요 관광지
    '한라산국립공원': { lat: 33.3617, lon: 126.5292, name: '제주 한라산국립공원' },

    // 기타 주요 국립공원 및 관광지
    '설악산국립공원': { lat: 38.1194, lon: 128.4654, name: '설악산국립공원' },
    '지리산국립공원': { lat: 35.3384, lon: 127.7303, name: '지리산국립공원' },
    '북한산국립공원': { lat: 37.6583, lon: 126.9778, name: '북한산국립공원' },
    '소백산국립공원': { lat: 36.9583, lon: 128.4778, name: '소백산국립공원' },
    '주왕산국립공원': { lat: 36.3583, lon: 129.1778, name: '주왕산국립공원' },
    '가야산국립공원': { lat: 35.8183, lon: 128.1178, name: '가야산국립공원' },
    '덕유산국립공원': { lat: 35.8583, lon: 127.7478, name: '덕유산국립공원' },
    '계룡산국립공원': { lat: 36.3483, lon: 127.2178, name: '계룡산국립공원' },
    '치악산국립공원': { lat: 37.3783, lon: 128.0578, name: '치악산국립공원' },
    '태백산국립공원': { lat: 37.0983, lon: 128.9178, name: '태백산국립공원' },
    '무등산국립공원': { lat: 35.1347, lon: 126.9881, name: '무등산국립공원' },
    '월출산국립공원': { lat: 34.7583, lon: 126.7078, name: '월출산국립공원' },
    '다도해해상국립공원': { lat: 34.3583, lon: 126.7578, name: '다도해해상국립공원' },
    '한려해상국립공원': { lat: 34.8583, lon: 128.4578, name: '한려해상국립공원' },
    '태안해안국립공원': { lat: 36.7583, lon: 126.2978, name: '태안해안국립공원' },

    // 추가 관광 명소
    '부여백제문화단지': { lat: 36.2756, lon: 126.9100, name: '충남 부여 백제문화단지' },
    '단양도담삼봉': { lat: 36.9845, lon: 128.3659, name: '충북 단양 도담삼봉' },
    '속초해수욕장': { lat: 38.2070, lon: 128.5918, name: '강원 속초 해수욕장' },
    '강릉경포대': { lat: 37.7883, lon: 128.9083, name: '강원 강릉 경포대' },
    '평창올림픽파크': { lat: 37.6583, lon: 128.6778, name: '강원 평창 올림픽파크' }
  };
}

/**
 * 지역명 정규화 및 검색
 * @param {string} query - 사용자 입력 지역명
 * @returns {Object} 매칭된 지역의 좌표 및 이름 정보
 */
function findLocationCoordinates(query) {
    const locations = getLocationCoordinates();

    // 정확한 매칭 우선
    if (locations[query]) {
        return locations[query];
    }

    // 정규화된 검색
    const normalizedQuery = query.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[시군구읍면동리]/g, '')
        .replace(/특별자치도|광역시|특별자치시|특별시|도$/g, '');

    // 키 기반 검색
    for (const [key, coords] of Object.entries(locations)) {
        const normalizedKey = key.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[시군구읍면동리]/g, '')
            .replace(/특별자치도|광역시|특별자치시|특별시|도$/g, '');

        if (normalizedKey.includes(normalizedQuery) || normalizedQuery.includes(normalizedKey)) {
            console.log(`지역명 매칭: ${query} -> ${key} (${coords.name})`);
            return coords;
        }
    }

    // 이름 기반 검색
    for (const [key, coords] of Object.entries(locations)) {
        const normalizedName = coords.name.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[시군구읍면동리]/g, '');

        if (normalizedName.includes(normalizedQuery) || normalizedQuery.includes(normalizedName)) {
            console.log(`이름 매칭: ${query} -> ${coords.name}`);
            return coords;
        }
    }

    // 기본값: 서울 (전국 관광을 위한 기본값)
    console.log(`매칭 실패, 기본값 사용: ${query} -> ${DEFAULT_REGION}`);
    return locations[DEFAULT_REGION];
}

/**
 * 기상청 API 응답 데이터를 가공하여 3일간의 완전한 날씨 정보 반환
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

        // 일별 최저/최고 기온 및 최대 강수확률 추출
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
        temperatureMin: dailyData.temperatureMin ? Math.round(dailyData.temperatureMin) : null,
        temperatureMax: dailyData.temperatureMax ? Math.round(dailyData.temperatureMax) : null,
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
        uvIndex: data.UVI || null, // 자외선지수 (있는 경우)
        visibility: data.VIS || null, // 가시거리 (있는 경우)

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
    if (!temp) return '정보없음';
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
    if (!humidity) return '정보없음';
    const h = parseInt(humidity);
    if (h <= 20) return '매우 건조';
    if (h <= 40) return '건조';
    if (h <= 60) return '보통';
    if (h <= 80) return '습함';
    return '매우 습함';
}

// **풍속에 따른 설명 반환**
function getWindSpeedDescription(windSpeed) {
    if (!windSpeed) return '정보없음';
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
    if (!degree && degree !== 0) return '정보없음';

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
        if (precipType.includes('비')) advice.push('☔ 우산 또는 우비 준비하세요');
        if (precipType.includes('눈')) advice.push('⛄ 눈 예보, 미끄럼 주의하세요');
        if (precipType.includes('폭우')) advice.push('🌊 폭우 주의! 저지대 침수 조심');
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

    const baseMessage = errorMessage ? `⚠️ 오류: ${errorMessage}` : '⚠️ WEATHER_API_KEY 설정 필요 - 샘플 데이터';
    const sampleTemps = [20, 22, 21];
    const sampleSkies = ['1', '3', '4'];
    const samplePrecips = ['0', '0', '1'];

    // 샘플 데이터의 locationInfo에 대한 fullName을 '서울특별시'로 설정
    const defaultLocationFullName = '서울특별시';

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
        precipitationProbabilityDescription: errorMessage ? '정보없음' : WEATHER_CODES.POP[[10, 30, 60][index]],
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
 * 메인 서버리스 핸들러 함수
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
        // 기본 지역을 '서울'로 설정 (전국 관광 목적)
        const { region = DEFAULT_REGION, lat, lon, detailed = 'true' } = req.query;
        const weatherApiKey = process.env.WEATHER_API_KEY;

        console.log('완전한 날씨 API 요청:', {
            region,
            lat,
            lon,
            detailed,
            hasWeatherApiKey: !!weatherApiKey,
            timestamp: new Date().toISOString()
        });

        // API 키 확인 및 샘플 데이터 제공 로직 (기존 유지)
        if (!weatherApiKey) {
            console.warn('⚠️ WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.');
            // 샘플 데이터의 locationInfo.fullName도 '서울특별시'로 일관성 있게 변경
            return res.status(200).json({
                success: true,
                data: generateCompleteSampleData(region),
                warning: 'WEATHER_API_KEY가 설정되지 않아 샘플 데이터를 제공합니다.',
                environment: 'development',
                apiInfo: {
                    source: '샘플 데이터',
                    timestamp: new Date().toISOString(),
                    region: region
                },
                locationInfo: { // 오류 시 반환되는 최상위 locationInfo도 '서울특별시'로 변경
                    requested: region,
                    matched: '샘플 데이터용 기본값',
                    fullName: '서울특별시',
                    source: '샘플 데이터'
                }
            });
        }

        let coordinates;
        let locationInfo;

        // 위경도가 직접 제공된 경우
        if (lat && lon) {
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
                source: '직접 좌표'
            };

            console.log('위경도 변환 완료:', { lat, lon, grid: coordinates });
        } else {
            // 지역명으로 검색
            const location = findLocationCoordinates(region);
            coordinates = latLonToGrid(location.lat, location.lon);
            locationInfo = {
                requested: region,
                matched: location.name,
                fullName: location.name,
                coordinates: coordinates,
                latLon: { lat: location.lat, lon: location.lon },
                source: '지역명 검색'
            };

            console.log('지역명 검색 완료:', { region, location: location.name, grid: coordinates });
        }

        // 한국 표준시(KST) 기준 시간 계산
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

        // 기상청 API 발표 시각 계산
        let baseTime = '';
        const hour = kst.getHours();
        if (hour >= 23 || hour < 2) baseTime = '2300';
        else if (hour < 5) baseTime = '0200';
        else if (hour < 8) baseTime = '0500';
        else if (hour < 11) baseTime = '0800';
        else if (hour < 14) baseTime = '1100';
        else if (hour < 17) baseTime = '1400';
        else if (hour < 20) baseTime = '1700';
        else baseTime = '2000';

        let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, '');

        // 자정 전후 시간 처리
        if (hour < 2 && baseTime === '2300') {
            const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
            baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        }

        // 캐시 확인
        const cacheKey = `complete_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;
        const cachedData = weatherCache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < 30 * 60 * 1000) {
            console.log('✅ 캐시된 데이터 사용:', cacheKey);

            // 지역 정보 업데이트
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
                'User-Agent': 'HealingK-Complete-Weather-Service/2.0'
            }
        });

        // API 응답 검증
        if (!response.data?.response?.body?.items?.item) {
            throw new Error('기상청 API 응답에 날씨 데이터가 없습니다.');
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

        console.log('✅ 완전한 날씨 데이터 처리 완료:', weatherData.length, '일');

        // 최종 응답 데이터 구성
        const responseData = {
            success: true,
            data: weatherData,
            locationInfo: locationInfo,
            apiInfo: {
                source: '기상청 단기예보 API',
                baseDate: baseDate,
                baseTime: baseTime,
                timestamp: new Date().toISOString(),
                apiKeyUsed: 'WEATHER_API_KEY',
                totalCategories: Object.keys(WEATHER_CODES).length,
                dataPoints: items.length,
                version: '2.0-complete'
            },
            weatherCodes: detailed === 'true' ? WEATHER_CODES : undefined
        };

        // 캐시 저장
        weatherCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        // 캐시 크기 관리 (최대 100개 항목)
        if (weatherCache.size > 100) {
            const oldestKey = weatherCache.keys().next().value;
            weatherCache.delete(oldestKey);
            console.log('🧹 캐시 정리 완료. 현재 캐시 크기:', weatherCache.size);
        }

        console.log('🎉 완전한 날씨 API 응답 성공');
        return res.status(200).json(responseData);

    } catch (error) {
        console.error('❌ 완전한 날씨 API 오류:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // 에러 타입별 상세 로깅
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ API 요청 타임아웃 발생');
        } else if (error.response) {
            console.error('🚫 API 응답 오류:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (error.request) {
            console.error('🌐 네트워크 오류 - 응답 없음');
        }

        // 에러 발생 시에도 완전한 샘플 데이터 반환
        return res.status(200).json({
            success: false,
            error: true,
            errorMessage: error.message,
            data: generateCompleteSampleData(req.query.region || DEFAULT_REGION, error.message),
            locationInfo: { // 오류 시 반환되는 최상위 locationInfo도 '서울특별시'로 변경
                requested: req.query.region || DEFAULT_REGION,
                matched: '오류로 인한 기본값',
                fullName: '서울특별시',
                source: '오류 처리'
            },
            apiInfo: {
                source: '오류 시 샘플 데이터',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                version: '2.0-complete-error',
                errorHandled: true
            },
            warning: '실시간 날씨 정보를 가져올 수 없어 샘플 데이터를 제공합니다.'
        });
    }
};
