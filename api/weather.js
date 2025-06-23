const axios = require('axios');

// Vercel 서버리스용 캐시 (메모리 캐시, Vercel 인스턴스가 재시작되면 초기화됨)
let weatherCache = new Map();

// 완전한 기상청 날씨 코드 매핑 (기상청 데이터 해석에 필요)
const WEATHER_CODES = {
  // 하늘상태 (SKY) - 기상청 공식 전체 코드
  SKY: {
    '1': '맑음', '2': '구름조금', '3': '구름많음', '4': '흐림', '5': '매우흐림',
    '6': '흐리고비', '7': '흐리고눈', '8': '흐리고비/눈', '9': '흐리고소나기', '10': '안개'
  },
  // 강수형태 (PTY) - 기상청 공식 전체 코드
  PTY: {
    '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기',
    '5': '빗방울', '6': '빗방울/눈날림', '7': '눈날림', '8': '진눈개비', // '진눈깨비' 오타 수정
    '9': '우박', '10': '이슬비', '11': '뇌우', '12': '폭우', '13': '폭설'
  },
  // 강수확률 (POP) - 단계별 설명
  POP: {
    '0': '0% (강수 없음)', '10': '10% (거의 없음)', '20': '20% (낮음)', '30': '30% (약간 있음)',
    '40': '40% (보통)', '50': '50% (보통)', '60': '60% (높음)', '70': '70% (높음)',
    '80': '80% (매우 높음)', '90': '90% (매우 높음)', '100': '100% (확실)'
  },
  // 강수량 (PCP) - 세부 단계
  PCP: {
    '강수없음': '0mm', '1mm 미만': '1mm 미만 (이슬비)', '1': '1mm (약한 비)', '2': '2mm (약한 비)',
    '3': '3mm (약한 비)', '4': '4mm (약한 비)', '5': '5mm (보통 비)', '10': '10mm (강한 비)',
    '15': '15mm (강한 비)', '20': '20mm (강한 비)', '25': '25mm (매우 강한 비)',
    '30': '30mm (매우 강한 비)', '40': '40mm (폭우)', '50': '50mm (폭우)', '60': '60mm (폭우)',
    '70': '70mm (폭우)', '80': '80mm (폭우)', '90': '90mm (폭우)', '100': '100mm 이상 (폭우)'
  },
  // 적설량 (SNO) - 세부 단계
  SNO: {
    '적설없음': '0cm', '1cm 미만': '1cm 미만 (가벼운 눈)', '1': '1cm (가벼운 눈)',
    '2': '2cm (가벼운 눈)', '3': '3cm (가벼운 눈)', '4': '4cm (가벼운 눈)', '5': '5cm (보통 눈)',
    '10': '10cm (많은 눈)', '15': '15cm (많은 눈)', '20': '20cm (많은 눈)', '25': '25cm (폭설)',
    '30': '30cm (폭설)', '40': '40cm (폭설)', '50': '50cm 이상 (폭설)'
  },
  // 파고 (WAV) - 완전한 파도 높이 매핑
  WAV: {
    '0': '0m (잔잔)', '0.5': '0.5m 미만 (낮음)', '1.0': '0.5~1.0m (보통)',
    '1.5': '1.0~1.5m (약간 높음)', '2.0': '1.5~2.0m (높음)', '2.5': '2.0~2.5m (높음)',
    '3.0': '2.5~3.0m (매우 높음)', '4.0': '3.0~4.0m (위험)', '5.0': '4.0m 이상 (매우 위험)'
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

// 기본 지역 설정 (일관성을 위해 상수로 정의)
const DEFAULT_REGION = '서울';

/**
 * 위경도 좌표를 기상청 격자 좌표(nx, ny)로 변환합니다.
 * 이 함수는 기상청에서 제공하는 공식 변환 알고리즘을 사용합니다.
 * @param {number} lat - 위도 (예: 33.4589)
 * @param {number} lon - 경도 (예: 126.9427)
 * @returns {Object} 격자 좌표 {nx, ny}
 */
function latLonToGrid(lat, lon) {
  const RE = 6371.00877; // 지구 반지름 (km)
  const GRID = 5.0; // 격자 간격 (km)
  const SLAT1 = 30.0; // 표준 위도 1 (도)
  const SLAT2 = 60.0; // 표준 위도 2 (도)
  const OLON = 126.0; // 기준 경도 (도)
  const OLAT = 38.0; // 기준 위도 (도)
  const XO = 43; // 기준점 X 격자
  const YO = 136; // 기준점 Y 격자

  const DEGRAD = Math.PI / 180.0; // 도를 라디안으로 변환
  const re = RE / GRID; // 격자 단위로 변환된 지구 반지름

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

  const nxResult = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const nyResult = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  console.log(`🔎 latLonToGrid(${lat}, ${lon}) => nx: ${nxResult}, ny: ${nyResult}`); // 격자 변환 결과 로그
  return { nx: nxResult, ny: nyResult };
}

/**
 * 주요 지역 및 법정동에 대한 하드코딩된 좌표 목록 (카카오 API 실패 시 또는 특정 지역 우선 매칭용).
 * 이 목록은 카카오 API보다 먼저 검색되어 특정 지역의 정확도를 보장합니다.
 *
 * 중요: 실제 운영 환경에서는 이 데이터를 Firestore와 같은 데이터베이스나
 * 외부 설정 파일에서 동적으로 불러오는 것이 좋습니다.
 * 데이터가 많아질 경우 서버리스 함수 번들 크기에 영향을 덜 주고
 * 코드 수정 없이 지역 데이터를 업데이트할 수 있습니다.
 */
function getFallbackLocationCoordinates() {
    return {
        '서울': { lat: 37.5665, lon: 126.9780, name: '서울특별시' },
        '제주': { lat: 33.4996, lon: 126.5312, name: '제주특별자치도' },
        '제주시': { lat: 33.5097, lon: 126.5219, name: '제주시' },
        '서귀포': { lat: 33.2541, lon: 126.5601, name: '서귀포시' },
        
        // 제주 주요 관광지 (정확한 좌표 명시 - 이전에 발생했던 오매칭 문제 해결)
        '성산일출봉': { lat: 33.4589, lon: 126.9427, name: '제주 성산일출봉' },
        '성산': { lat: 33.4589, lon: 126.9427, name: '제주 성산일출봉' }, // '성산' 입력 시 성산일출봉으로 매핑
        '송악산': { lat: 33.2185, lon: 126.3044, name: '제주 송악산' },
        '산방산': { lat: 33.2764, lon: 126.3197, name: '제주 산방산' }, 
        '한라산': { lat: 33.3617, lon: 126.5292, name: '제주 한라산' },
        '중문관광단지': { lat: 33.2498, lon: 126.4172, name: '제주 중문관광단지' },
        
        // 경기도 및 기타 지역 주요 도시/법정동
        '구리시': { lat: 37.5943, lon: 127.1296, name: '경기 구리시' }, 
        '성남시': { lat: 37.4200, lon: 127.1265, name: '경기 성남시' },
        '수원시': { lat: 37.2635, lon: 127.0286, name: '경기 수원시' },
        '인천': { lat: 37.4563, lon: 126.7052, name: '인천광역시' },
        '부산': { lat: 35.1796, lon: 129.0756, name: '부산광역시' },
        '대구': { lat: 35.8722, lon: 128.6019, name: '대구광역시' },
        
        // 제주 법정동 추가 (사용자가 명확한 법정동명 입력 시 우선 매칭)
        '제주특별자치도 제주시 애월읍': { lat: 33.4618, lon: 126.3314, name: '제주 애월읍' },
        '제주특별자치도 제주시 한림읍': { lat: 33.4140, lon: 126.2687, name: '제주 한림읍' },
        '제주특별자치도 서귀포시 성산읍': { lat: 33.4357, lon: 126.9189, name: '제주 성산읍' },
        '제주특별자치도 서귀포시 대정읍': { lat: 33.2169, lon: 126.2394, name: '제주 대정읍' },

        // 특정 건물/장소
        '제주올레여행자센터': { lat: 33.2483, lon: 126.5649, name: '제주올레여행자센터' },
        '서귀포버스터미널': { lat: 33.2546, lon: 126.5685, name: '서귀포버스터미널' }
    };
}

/**
 * 지역명을 위경도 좌표로 변환합니다.
 * 1. 하드코딩된 폴백에서 정확한 매칭을 우선 확인합니다. (주요 관광지/법정동 정확도 보장)
 * 2. Kakao Local 검색 API를 사용하여 일반적인 지역명(법정동 포함)을 검색합니다.
 * 3. Kakao API 실패 시, 폴백 목록에서 유사 매칭을 시도합니다.
 * 4. 모든 시도 실패 시 기본 지역을 반환합니다.
 * @param {string} query - 사용자 입력 지역명 (예: "성산일출봉", "서울", "강남구", "제주특별자치도 서귀포시 성산읍")
 * @returns {Promise<Object>} 매칭된 지역의 좌표 및 이름 정보 {lat, lon, name}
 */
async function findLocationCoordinates(query) {
    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY; // Vercel 환경 변수에서 Kakao REST API 키 로드

    const fallbackLocations = getFallbackLocationCoordinates();

    // 1. 하드코딩된 폴백에서 정확한 매칭이 있는지 먼저 확인 (가장 높은 우선순위)
    // 이 단계에서 '성산일출봉', '송악산', 정확한 법정동명이 매칭됩니다.
    if (fallbackLocations[query]) {
        console.log(`✅ 폴백에서 정확한 지역 매칭 (쿼리 키 일치): ${query} -> ${fallbackLocations[query].name}`);
        return fallbackLocations[query];
    }

    // 2. Kakao REST API 키가 설정되어 있다면 API 호출 시도
    // 카카오 API는 법정동 명칭을 포함한 다양한 키워드 검색을 지원합니다.
    if (KAKAO_REST_API_KEY) {
        try {
            console.log(`🌐 Kakao Geocoding API로 "${query}" 검색 시도...`);
            const kakaoResponse = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
                headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
                params: { query: query, size: 1 } // 가장 정확한 결과 1개만 요청
            });

            if (kakaoResponse.data && kakaoResponse.data.documents && kakaoResponse.data.documents.length > 0) {
                const doc = kakaoResponse.data.documents[0];
                const lat = parseFloat(doc.y);
                const lon = parseFloat(doc.x);
                const name = doc.place_name;
                console.log(`✅ Kakao Geocoding API 성공: ${query} -> ${name} (위도: ${lat}, 경도: ${lon})`);
                return { lat, lon, name };
            } else {
                console.warn(`⚠️ Kakao Geocoding API 결과 없음 for "${query}". 폴백 사용 시도.`);
            }
        } catch (error) {
            console.error('❌ Kakao Geocoding API 호출 중 오류 발생:', {
                message: error.message,
                response: error.response?.data, // 카카오 API 오류 응답 상세 로그 포함
                query: query
            });
            console.warn(`⚠️ Kakao Geocoding API 오류로 인해 폴백 사용 시도.`);
        }
    } else {
        console.warn('⚠️ KAKAO_REST_API_KEY 환경 변수가 설정되지 않았습니다. Kakao Geocoding API를 사용할 수 없습니다. 폴백 사용 시도.');
    }

    // 3. Kakao API 실패 또는 키 부재 시, 폴백 목록에서 유사 매칭 시도
    // (너무 광범위한 유사 매칭은 오작동의 원인이 될 수 있으므로 주의)
    const normalizedQuery = query.toLowerCase()
        .replace(/\s+/g, '') // 모든 공백 제거
        .replace(/[시군구읍면동리]/g, '') // 행정구역 단위 제거
        .replace(/특별자치도|광역시|특별자치시|특별시|도$/g, ''); // 광역자치단체명 제거

    for (const [key, coords] of Object.entries(fallbackLocations)) {
        // 폴백 키도 동일하게 정규화하여 비교
        const normalizedKey = key.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[시군구읍면동리]/g, '')
            .replace(/특별자치도|광역시|특별자치시|특별시|도$/g, '');

        if (normalizedKey.includes(normalizedQuery) || normalizedQuery.includes(normalizedKey)) {
            console.log(`⚠️ 폴백 지역명으로 유사 매칭: ${query} -> ${key} (${coords.name})`);
            return coords;
        }
    }

    // 4. 모든 시도 실패 시 기본 지역 반환
    console.warn(`❌ "${query}"에 대한 유효한 위치를 찾을 수 없습니다. 기본값 "${DEFAULT_REGION}" 사용.`);
    return fallbackLocations[DEFAULT_REGION];
}

/**
 * 기상청 API 응답 데이터를 가공하여 3일간의 완전한 날씨 정보 반환합니다.
 * @param {Array} items - 기상청 API에서 반환된 날씨 데이터 항목 배열
 * @param {Date} kst - 한국 표준시 Date 객체 (현재 시간을 기준으로 오늘, 내일, 모레를 계산하기 위함)
 * @returns {Array} 가공된 3일간의 날씨 데이터 배열
 */
function processCompleteWeatherData(items, kst) {
    const forecasts = {};

    // 오늘, 내일, 모레 날짜 계산 (YYYYMMDD 형식)
    const today = kst.toISOString().slice(0, 10).replace(/-/g, '');
    const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const dayAfter = new Date(kst.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

    // 모든 기상 데이터 분류 (날짜-시간-카테고리별로 데이터 재구성)
    items.forEach(item => {
        const date = item.fcstDate;
        const time = item.fcstTime;
        const category = item.category;
        const value = item.fcstValue;

        if (!forecasts[date]) {
            forecasts[date] = {
                times: {},
                dailyData: {
                    temperatureMin: null, // 일별 최저기온 초기화
                    temperatureMax: null, // 일별 최고기온 초기화
                    precipitationProbabilityMax: 0 // 일별 최대 강수확률 초기화
                }
            };
        }

        if (!forecasts[date].times[time]) {
            forecasts[date].times[time] = {};
        }

        forecasts[date].times[time][category] = value;

        // 일별 최저/최고 기온 및 최대 강수확률 추출 (TMN, TMX, POP 카테고리만 직접 처리)
        if (category === 'TMN' && value) {
            const tmnValue = parseFloat(value);
            // TMN은 해당 날짜의 최저 기온으로, 첫 발견 시 또는 더 낮은 값 발견 시 업데이트
            if (forecasts[date].dailyData.temperatureMin === null || tmnValue < forecasts[date].dailyData.temperatureMin) {
                forecasts[date].dailyData.temperatureMin = tmnValue;
            }
        }
        if (category === 'TMX' && value) {
            const tmxValue = parseFloat(value);
            // TMX는 해당 날짜의 최고 기온으로, 첫 발견 시 또는 더 높은 값 발견 시 업데이트
            if (forecasts[date].dailyData.temperatureMax === null || tmxValue > forecasts[date].dailyData.temperatureMax) {
                forecasts[date].dailyData.temperatureMax = tmxValue;
            }
        }
        if (category === 'POP' && value) {
            const pop = parseFloat(value);
            // POP은 해당 날짜의 최대 강수확률로 업데이트
            if (pop > forecasts[date].dailyData.precipitationProbabilityMax) {
                forecasts[date].dailyData.precipitationProbabilityMax = pop;
            }
        }
    });

    // TMN/TMX 값이 없는 날짜에 대해 TMP(시간별 기온) 데이터를 활용하여 보완
    Object.keys(forecasts).forEach(date => {
        const dailyData = forecasts[date].dailyData;
        const hourlyTemps = Object.values(forecasts[date].times)
            .filter(timeData => timeData.TMP)
            .map(timeData => parseFloat(timeData.TMP));

        if (hourlyTemps.length > 0) {
            // TMN이 누락된 경우, 시간별 TMP의 최저값으로 설정
            if (dailyData.temperatureMin === null) {
                dailyData.temperatureMin = Math.min(...hourlyTemps);
                console.log(`⚠️ ${date} TMN 누락, TMP 기반 최저 기온 보완: ${dailyData.temperatureMin}°C`);
            }
            // TMX가 누락된 경우, 시간별 TMP의 최고값으로 설정
            if (dailyData.temperatureMax === null) {
                dailyData.temperatureMax = Math.max(...hourlyTemps);
                console.log(`⚠️ ${date} TMX 누락, TMP 기반 최고 기온 보완: ${dailyData.temperatureMax}°C`);
            }
        }
    });

    // 3일간 완전한 날씨 데이터 생성 및 반환
    const result = [];
    [today, tomorrow, dayAfter].forEach((date, index) => {
        if (forecasts[date]) {
            const dayData = extractCompleteWeatherData(forecasts[date], date);
            dayData.dayLabel = index === 0 ? '오늘' : index === 1 ? '내일' : '모레';
            dayData.dayIndex = index;
            result.push(dayData);
        } else {
            // 해당 날짜의 데이터가 아예 없는 경우, 빈 데이터 또는 샘플 데이터 추가 고려
            console.warn(`⚠️ ${date}에 대한 기상 데이터가 충분하지 않아 날씨 정보를 생성할 수 없습니다.`);
            // 필요하다면 여기에 기본값 또는 부분 샘플 데이터 로직을 추가할 수 있습니다.
        }
    });

    return result;
}

/**
 * 일별 날씨 데이터에서 필요한 정보 추출 및 가공합니다.
 * @param {Object} dayForecast - 특정 일자의 날씨 예측 데이터 (processCompleteWeatherData에서 가공된 형태)
 * @param {string} date - 날짜 (YYYYMMDD 형식)
 * @returns {Object} 가공된 일별 날씨 데이터 (프론트엔드에 전달될 최종 형식)
 */
function extractCompleteWeatherData(dayForecast, date) {
    const times = dayForecast.times;
    const dailyData = dayForecast.dailyData;

    // 대표 시간 선택: 14시(오후 2시) 우선, 없으면 12시-15시 사이, 그 다음 가장 가까운 시간.
    // 이는 하루 중 가장 일반적인 날씨 상태를 대표하기 위함입니다.
    const timeKeys = Object.keys(times).sort(); // 시간 키를 오름차순으로 정렬
    let representativeTime = timeKeys.find(t => t === '1400') ||
        timeKeys.find(t => t >= '1200' && t <= '1500') ||
        (timeKeys.length > 0 ? timeKeys[0] : null); // 없으면 첫 번째 시간대, 아예 없으면 null

    const data = representativeTime ? times[representativeTime] : {}; // 대표 시간대의 날씨 데이터

    // 최종 날씨 정보 객체 생성
    return {
        date: date,
        dateFormatted: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`, // YYYY-MM-DD 형식
        representativeTime: representativeTime,

        // 기온 정보
        temperature: data.TMP ? Math.round(parseFloat(data.TMP)) : null,
        temperatureMin: dailyData.temperatureMin !== null ? Math.round(dailyData.temperatureMin) : null,
        temperatureMax: dailyData.temperatureMax !== null ? Math.round(dailyData.temperatureMax) : null,
        temperatureUnit: '°C',
        temperatureDescription: getTemperatureDescription(data.TMP),

        // 하늘 상태 (SKY)
        sky: getSkyDescription(data.SKY),
        skyCode: data.SKY,
        skyDescription: WEATHER_CODES.SKY[data.SKY] || '정보없음',

        // 강수 정보 (PTY: 강수형태, POP: 강수확률, PCP: 강수량)
        precipitation: getPrecipitationDescription(data.PTY),
        precipitationCode: data.PTY,
        precipitationDescription: WEATHER_CODES.PTY[data.PTY] || '없음',
        precipitationProbability: data.POP ? parseInt(data.POP) : 0,
        precipitationProbabilityMax: Math.round(dailyData.precipitationProbabilityMax),
        precipitationProbabilityDescription: WEATHER_CODES.POP[data.POP] || '0% (강수 없음)',
        precipitationAmount: processPrecipitationAmount(data.PCP),
        precipitationAmountDescription: WEATHER_CODES.PCP[data.PCP] || '0mm',

        // 적설 정보 (SNO)
        snowAmount: processSnowAmount(data.SNO),
        snowAmountDescription: WEATHER_CODES.SNO[data.SNO] || '0cm',

        // 습도 정보 (REH)
        humidity: data.REH ? parseInt(data.REH) : null,
        humidityUnit: '%',
        humidityDescription: getHumidityDescription(data.REH),

        // 풍속/풍향 정보 (WSD: 풍속, VEC: 풍향)
        windSpeed: data.WSD ? parseFloat(data.WSD).toFixed(1) : null,
        windSpeedUnit: 'm/s',
        windSpeedDescription: getWindSpeedDescription(data.WSD),
        windDirection: getWindDirectionFromDegree(data.VEC),
        windDirectionDegree: data.VEC ? parseFloat(data.VEC) : null,
        windDirectionDescription: data.VEC ? `${getWindDirectionFromDegree(data.VEC)} (${data.VEC}°)` : '정보없음',

        // 파고 정보 (WAV) - 해상 날씨에 해당, 내륙 지역은 정보없음
        waveHeight: data.WAV || null,
        waveHeightDescription: WEATHER_CODES.WAV[data.WAV] || '정보없음',

        // 추가 상세 정보 (기상청 API가 제공하는 경우에만)
        uvIndex: data.UVI || null, // 자외선지수
        visibility: data.VIS || null, // 가시거리

        // 종합 날씨 상태 및 조언 (커스텀 로직)
        weatherStatus: getOverallWeatherStatus(data),
        weatherAdvice: getWeatherAdvice(data),

        // 시간별 상세 데이터 (프론트엔드에서 시간별 표시 시 유용)
        hourlyData: Object.keys(times).map(time => ({
            time: time,
            timeFormatted: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
            temperature: times[time].TMP ? Math.round(parseFloat(times[time].TMP)) : null,
            sky: WEATHER_CODES.SKY[times[time].SKY] || '정보없음',
            precipitation: WEATHER_CODES.PTY[times[time].PTY] || '없음',
            precipitationProbability: times[time].POP ? parseInt(times[time].POP) : 0,
            humidity: times[time].REH ? parseInt(times[time].REH) : null,
            windSpeed: times[time].WSD ? parseFloat(times[time].WSD).toFixed(1) : null
        })).sort((a, b) => a.time.localeCompare(b.time)) // 시간 순서로 정렬
    };
}

// **기온에 따른 설명 반환 함수**
function getTemperatureDescription(temp) {
    if (temp === null || temp === undefined) return '정보없음'; // null/undefined 처리
    const t = parseFloat(temp);
    if (isNaN(t)) return '정보없음'; // 숫자가 아닌 경우 처리

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

// **하늘 상태 코드에 따른 설명 반환 함수**
function getSkyDescription(code) {
    return WEATHER_CODES.SKY[code] || '정보없음';
}

// **강수 형태 코드에 따른 설명 반환 함수**
function getPrecipitationDescription(code) {
    return WEATHER_CODES.PTY[code] || '없음';
}

// **강수량 값 처리 및 설명 반환 함수**
function processPrecipitationAmount(pcp) {
    if (!pcp || pcp === '강수없음' || pcp === '0') return '0mm';
    if (pcp === '1mm 미만') return '1mm 미만';
    if (String(pcp).includes('mm')) return pcp; // 이미 'mm'가 포함된 경우 그대로 반환
    return `${pcp}mm`;
}

// **적설량 값 처리 및 설명 반환 함수**
function processSnowAmount(sno) {
    if (!sno || sno === '적설없음' || sno === '0') return '0cm';
    if (sno === '1cm 미만') return '1cm 미만';
    if (String(sno).includes('cm')) return sno; // 이미 'cm'가 포함된 경우 그대로 반환
    return `${sno}cm`;
}

// **습도에 따른 설명 반환 함수**
function getHumidityDescription(humidity) {
    if (humidity === null || humidity === undefined) return '정보없음';
    const h = parseInt(humidity);
    if (isNaN(h)) return '정보없음';

    if (h <= 20) return '매우 건조';
    if (h <= 40) return '건조';
    if (h <= 60) return '보통';
    if (h <= 80) return '습함';
    return '매우 습함';
}

// **풍속에 따른 설명 반환 함수**
function getWindSpeedDescription(windSpeed) {
    if (windSpeed === null || windSpeed === undefined) return '정보없음';
    const ws = parseFloat(windSpeed);
    if (isNaN(ws)) return '정보없음';

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

// **풍향 각도에 따른 16방위 설명 반환 함수**
function getWindDirectionFromDegree(degree) {
    if (degree === null || degree === undefined || isNaN(parseFloat(degree))) return '정보없음';

    const deg = parseFloat(degree);
    const normalizedDeg = ((deg % 360) + 360) % 360; // 0-360도 범위로 정규화

    const directions = [
        '북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
        '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'
    ];

    const index = Math.round(normalizedDeg / 22.5) % 16; // 22.5도 단위로 인덱스 계산
    return directions[index];
}

// **주요 날씨 요소 기반 종합 날씨 상태 반환 함수**
function getOverallWeatherStatus(data) {
    const temp = data.TMP ? parseFloat(data.TMP) : null;
    const sky = data.SKY;
    const pty = data.PTY;
    const pop = data.POP ? parseInt(data.POP) : 0;

    // 강수 여부가 있을 경우 강수 형태 우선
    if (pty && pty !== '0') {
        const precipType = WEATHER_CODES.PTY[pty] || '강수';
        if (pop >= 80) return `${precipType} 확실`;
        if (pop >= 60) return `${precipType} 가능성 높음`;
        return `${precipType} 가능성 있음`;
    }

    // 강수 형태는 없지만 강수확률이 높을 경우
    if (pop >= 60) {
        return '강수 가능성 높음';
    }

    const skyDesc = WEATHER_CODES.SKY[sky] || '정보없음';

    // 기온에 따른 날씨 상태 (기온 정보가 있을 경우)
    if (temp !== null) {
        if (temp >= 33) return `${skyDesc}, 폭염 주의`;
        if (temp >= 28) return `${skyDesc}, 더움`;
        if (temp >= 21) return `${skyDesc}, 쾌적`;
        if (temp >= 10) return `${skyDesc}, 선선`;
        if (temp >= 0) return `${skyDesc}, 쌀쌀`;
        return `${skyDesc}, 추움`;
    }

    // 기온 정보가 없을 경우 하늘 상태만 반환
    return skyDesc;
}

// **현재 날씨 데이터 기반 맞춤형 조언 반환 함수**
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
        else if (temp <= -10) advice.push('� 한파 주의! 방한용품 필수');
        else if (temp <= 0) advice.push('❄️ 추운 날씨, 따뜻한 복장 필요');
        else if (temp <= 10) advice.push('🧥 쌀쌀한 날씨, 외투 준비하세요');
    }

    // 강수 관련 조언
    if (pty && pty !== '0') {
        const precipType = WEATHER_CODES.PTY[pty];
        if (precipType && precipType.includes('비')) advice.push('☔ 우산 또는 우비 준비하세요');
        if (precipType && precipType.includes('눈')) advice.push('⛄ 눈 예보, 미끄럼 주의하세요');
        if (precipType && precipType.includes('폭우')) advice.push('폭우 주의! 저지대 침수 조심');
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
 * API 키가 없거나 오류 발생 시 완전한 샘플 데이터를 생성합니다.
 * @param {string} region - 요청된 지역명
 * @param {string} [errorMessage=null] - 발생한 오류 메시지 (선택 사항)
 * @returns {Array} 샘플 날씨 데이터 배열 (3일치)
 */
function generateCompleteSampleData(region, errorMessage = null) {
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000); // 한국 표준시

    const dates = [];
    for (let i = 0; i < 3; i++) {
        const date = new Date(kst.getTime() + i * 24 * 60 * 60 * 1000);
        dates.push(date);
    }

    const baseMessage = errorMessage ? `⚠️ 오류: ${errorMessage}` : '⚠️ API 키 설정 또는 네트워크 문제 - 샘플 데이터';
    const sampleTemps = [20, 22, 21]; // 대표 기온
    const sampleTempsMin = [15, 17, 16]; // 최저 기온
    const sampleTempsMax = [25, 27, 26]; // 최고 기온
    const sampleSkies = ['1', '3', '4']; // 맑음, 구름많음, 흐림
    const samplePrecips = ['0', '0', '1']; // 없음, 없음, 비
    const samplePOPs = [10, 30, 60]; // 강수확률
    const sampleHumidity = [60, 70, 80]; // 습도
    const sampleWindSpeeds = [2.5, 3.0, 3.5]; // 풍속
    const sampleWindDegrees = [45, 180, 270]; // 풍향 (각도)

    return dates.map((date, index) => ({
        date: date.toISOString().slice(0, 10).replace(/-/g, ''),
        dateFormatted: date.toISOString().slice(0, 10),
        dayLabel: index === 0 ? '오늘' : index === 1 ? '내일' : '모레',
        dayIndex: index,
        representativeTime: '1400',

        // 기온 정보
        temperature: errorMessage ? null : sampleTemps[index],
        temperatureMin: errorMessage ? null : sampleTempsMin[index],
        temperatureMax: errorMessage ? null : sampleTempsMax[index],
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
        precipitationProbability: errorMessage ? null : samplePOPs[index],
        precipitationProbabilityMax: errorMessage ? null : samplePOPs[index],
        precipitationProbabilityDescription: errorMessage ? '정보없음' : WEATHER_CODES.POP[samplePOPs[index]],
        precipitationAmount: errorMessage ? '정보없음' : index === 2 ? '5mm' : '0mm',
        precipitationAmountDescription: errorMessage ? '정보없음' : index === 2 ? '5mm (보통 비)' : '0mm',

        // 적설 정보
        snowAmount: '0cm', // 샘플에서는 적설 없음으로 가정
        snowAmountDescription: '0cm',

        // 습도 정보
        humidity: errorMessage ? null : sampleHumidity[index],
        humidityUnit: '%',
        humidityDescription: errorMessage ? '정보없음' : getHumidityDescription(sampleHumidity[index]),

        // 풍속/풍향 정보
        windSpeed: errorMessage ? null : sampleWindSpeeds[index].toFixed(1),
        windSpeedUnit: 'm/s',
        windSpeedDescription: errorMessage ? '정보없음' : getWindSpeedDescription(sampleWindSpeeds[index]),
        windDirection: errorMessage ? '정보없음' : getWindDirectionFromDegree(sampleWindDegrees[index]),
        windDirectionDegree: errorMessage ? null : sampleWindDegrees[index],
        windDirectionDescription: errorMessage ? '정보없음' : `${getWindDirectionFromDegree(sampleWindDegrees[index])} (${sampleWindDegrees[index]}°)`,

        // 파고 정보 (샘플에서는 없음으로 가정)
        waveHeight: null,
        waveHeightDescription: '정보없음',

        // 추가 정보 (샘플에서는 없음으로 가정)
        uvIndex: null,
        visibility: null,

        // 종합 상태
        weatherStatus: errorMessage ? '정보없음' : getOverallWeatherStatus({
            TMP: sampleTemps[index],
            SKY: sampleSkies[index],
            PTY: samplePrecips[index],
            POP: samplePOPs[index]
        }),
        weatherAdvice: errorMessage ? '정보를 확인할 수 없습니다' : getWeatherAdvice({
            TMP: sampleTemps[index],
            PTY: samplePrecips[index],
            POP: samplePOPs[index],
            WSD: sampleWindSpeeds[index]
        }),

        // 시간별 데이터 (샘플)
        hourlyData: errorMessage ? [] : [
            {
                time: '0600', timeFormatted: '06:00',
                temperature: sampleTemps[index] - 3,
                sky: WEATHER_CODES.SKY[sampleSkies[index]],
                precipitation: WEATHER_CODES.PTY[samplePrecips[index]],
                precipitationProbability: samplePOPs[index],
                humidity: sampleHumidity[index],
                windSpeed: sampleWindSpeeds[index].toFixed(1)
            },
            {
                time: '1200', timeFormatted: '12:00',
                temperature: sampleTemps[index],
                sky: WEATHER_CODES.SKY[sampleSkies[index]],
                precipitation: WEATHER_CODES.PTY[samplePrecips[index]],
                precipitationProbability: samplePOPs[index],
                humidity: sampleHumidity[index],
                windSpeed: sampleWindSpeeds[index].toFixed(1)
            },
            {
                time: '1800', timeFormatted: '18:00',
                temperature: sampleTemps[index] - 2,
                sky: WEATHER_CODES.SKY[sampleSkies[index]],
                precipitation: WEATHER_CODES.PTY[samplePrecips[index]],
                precipitationProbability: samplePOPs[index],
                humidity: sampleHumidity[index],
                windSpeed: sampleWindSpeeds[index].toFixed(1)
            }
        ],

        message: `${baseMessage} (${['오늘', '내일', '모레'][index]})`,
        timestamp: new Date().toISOString(),
        region: region
    }));
}

/**
 * 메인 서버리스 핸들러 함수입니다.
 * 클라이언트의 날씨 정보 요청을 처리하고, 기상청 및 카카오 API를 활용하여 응답을 반환합니다.
 * @param {Object} req - HTTP 요청 객체 (쿼리 파라미터: region, lat, lon, nx, ny, detailed)
 * @param {Object} res - HTTP 응답 객체
 */
module.exports = async function handler(req, res) {
    // CORS (Cross-Origin Resource Sharing) 설정: 모든 도메인에서의 요청을 허용
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // 허용할 HTTP 메서드
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // 허용할 요청 헤더
    // 캐시 제어 헤더: Vercel 엣지 캐시를 30분 동안 유지하고, 이후 1시간 동안 오래된 캐시 재사용 허용
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

    // OPTIONS 요청(Preflight Request) 처리: 실제 요청 전 CORS 사전 확인용
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
        console.warn(`❌ 허용되지 않는 HTTP 메서드: ${req.method}`);
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            message: 'GET 요청만 지원됩니다.'
        });
    }

    try {
        // 쿼리 파라미터 추출 및 기본값 설정
        const { region = DEFAULT_REGION, lat, lon, nx, ny, detailed = 'true' } = req.query;
        // 환경 변수에서 기상청 API 키 로드
        const weatherApiKey = process.env.WEATHER_API_KEY;

        console.log('--- 완전한 날씨 API 요청 시작 ---');
        console.log('요청 파라미터:', {
            requestedRegion: region, inputLat: lat, inputLon: lon, inputNx: nx, inputNy: ny, detailed: detailed,
            hasWeatherApiKey: !!weatherApiKey, // API 키 설정 여부 (보안상 실제 키 값은 로깅하지 않음)
            currentTimestamp: new Date().toISOString()
        });

        // WEATHER_API_KEY가 설정되지 않은 경우 샘플 데이터 반환
        if (!weatherApiKey) {
            console.warn('⚠️ WEATHER_API_KEY 환경 변수가 설정되지 않았습니다. 샘플 데이터를 제공합니다.');
            return res.status(200).json({
                success: true, // 샘플 데이터는 성공으로 처리 (오류 상황이 아님)
                data: generateCompleteSampleData(region, 'WEATHER_API_KEY 미설정'),
                warning: 'WEATHER_API_KEY가 설정되지 않아 실시간 날씨가 아닌 샘플 데이터를 제공합니다.',
                environment: 'development', // 개발 환경임을 명시
                apiInfo: {
                    source: '샘플 데이터',
                    timestamp: new Date().toISOString(),
                    region: region
                },
                locationInfo: {
                    requested: region,
                    matched: '샘플 데이터용 기본값',
                    fullName: '샘플 지역',
                    source: '샘플 데이터 (API 키 없음)'
                }
            });
        }

        let coordinates; // 최종적으로 기상청 API에 전달될 격자 좌표 {nx, ny}
        let locationInfo; // 클라이언트에 반환될 최종 위치 정보 객체
        let targetLat, targetLon; // Kakao API 또는 Fallback에서 얻은 위경도

        // 위치 정보 결정 로직: nx/ny -> lat/lon -> region (지역명 검색) 순서로 우선순위 부여
        // 1. nx, ny 격자 좌표가 직접 제공된 경우 (최우선)
        if (nx && ny) {
            const nxValue = parseInt(nx);
            const nyValue = parseInt(ny);

            if (isNaN(nxValue) || isNaN(nyValue)) {
                throw new Error('잘못된 격자 좌표 형식입니다. nx 또는 ny가 유효한 숫자가 아닙니다.');
            }
            coordinates = { nx: nxValue, ny: nyValue };
            locationInfo = {
                requested: `격자좌표 (${nx}, ${ny})`,
                matched: `격자좌표 (${nxValue}, ${nyValue})`,
                fullName: `격자 X:${nxValue}, Y:${nyValue}`,
                coordinates: coordinates,
                source: '직접 격자 좌표 사용'
            };
            console.log('🗺️ 격자 좌표 직접 사용:', coordinates);
        } 
        // 2. 위경도(lat, lon)가 직접 제공된 경우
        else if (lat && lon) {
            targetLat = parseFloat(lat);
            targetLon = parseFloat(lon);

            if (isNaN(targetLat) || isNaN(targetLon)) {
                throw new Error('잘못된 위경도 형식입니다. lat 또는 lon이 유효한 숫자가 아닙니다.');
            }
            coordinates = latLonToGrid(targetLat, targetLon); // 위경도를 기상청 격자 좌표로 변환
            locationInfo = {
                requested: `${lat}, ${lon}`,
                matched: `위경도 (${targetLat}, ${targetLon})`,
                fullName: `위도 ${targetLat}, 경도 ${targetLon}`,
                coordinates: coordinates,
                latLon: { lat: targetLat, lon: targetLon },
                source: '직접 위경도 사용'
            };
            console.log('🗺️ 위경도 변환 완료:', { lat, lon, grid: coordinates });
        } 
        // 3. 지역명(region)으로 검색하는 경우 (가장 일반적인 경우, findLocationCoordinates 호출)
        else {
            const locationResult = await findLocationCoordinates(region); // 지역명으로 위경도 찾기 (Kakao API 또는 Fallback)
            // findLocationCoordinates에서 유효한 결과를 반환했는지 검증
            if (!locationResult || typeof locationResult.lat !== 'number' || typeof locationResult.lon !== 'number') {
                throw new Error(`'${region}'에 대한 유효한 위치 정보를 찾을 수 없습니다. (Kakao API 및 폴백 실패)`);
            }
            targetLat = locationResult.lat;
            targetLon = locationResult.lon;
            coordinates = latLonToGrid(targetLat, targetLon); // 찾은 위경도를 기상청 격자 좌표로 변환
            locationInfo = {
                requested: region,
                matched: locationResult.name, // 카카오 API 또는 폴백에서 찾은 최종 지역명
                fullName: locationResult.name,
                coordinates: coordinates,
                latLon: { lat: targetLat, lon: targetLon },
                source: '지역명 검색 (Kakao API/Fallback)'
            };
            console.log('🗺️ 지역명 검색 완료:', { requested: region, matchedName: locationResult.name, finalLat: targetLat, finalLon: targetLon, finalGrid: coordinates });
        }

        // 한국 표준시(KST) 기준 현재 시간 계산 (기상청 API base_date/base_time 계산용)
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // KST = UTC + 9시간

        // 기상청 API 발표 시각(base_time) 계산: 매 3시간 간격 (02, 05, 08, 11, 14, 17, 20, 23시)
        // 발표 후 약 10분 정도 지나야 데이터가 안정적으로 올라옴을 고려
        let baseTime = '';
        let baseDate = kst.toISOString().slice(0, 10).replace(/-/g, ''); // 오늘 날짜 (YYYYMMDD)
        const currentHour = kst.getHours();
        const currentMinute = kst.getMinutes();

        const validBaseTimes = [2, 5, 8, 11, 14, 17, 20, 23];
        let foundBaseTime = false;

        // 현재 시각을 기준으로 가장 가까운 과거의 발표 시각을 찾습니다.
        for (let i = validBaseTimes.length - 1; i >= 0; i--) {
            const bt = validBaseTimes[i];
            if (currentHour > bt || (currentHour === bt && currentMinute >= 10)) {
                baseTime = String(bt).padStart(2, '0') + '00';
                foundBaseTime = true;
                break;
            }
        }

        // 만약 현재 시각이 당일 새벽 2시 발표 시간 이전이라면 (예: 00시~01시 59분), 전날 23시 데이터를 사용합니다.
        if (!foundBaseTime) {
            baseTime = '2300';
            const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000); // 어제 날짜 계산
            baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
            console.log(`⏰ 현재 시각(${kst.toLocaleTimeString('ko-KR')})이 02시 발표 전이므로, 전날 23시 데이터 사용. BaseDate: ${baseDate}, BaseTime: ${baseTime}`);
        } else {
             console.log(`⏰ 최종 기상청 API 호출 시각: BaseDate: ${baseDate}, BaseTime: ${baseTime}`);
        }

        // 캐시 키 생성: 격자 좌표와 발표 시간 기준으로 고유하게 생성
        const cacheKey = `complete_${coordinates.nx}_${coordinates.ny}_${baseDate}_${baseTime}`;
        const cachedData = weatherCache.get(cacheKey);

        // 캐시 유효성 확인 (30분 이내 데이터는 캐시 사용)
        if (cachedData && Date.now() - cachedData.timestamp < 30 * 60 * 1000) { 
            console.log(`✅ 캐시된 데이터 사용: ${cacheKey}`);
            const responseData = { ...cachedData.data };
            responseData.locationInfo = locationInfo; // 현재 요청에 맞는 locationInfo로 덮어쓰기
            responseData.timestamp = new Date().toISOString(); // 캐시 사용 시에도 현재 시간으로 업데이트
            return res.status(200).json(responseData);
        }

        console.log('🌤️ 기상청 API 호출 시작:', {
            baseDate,
            baseTime,
            nx: coordinates.nx,
            ny: coordinates.ny,
            location: locationInfo.fullName
        });

        // 기상청 단기예보 API 호출
        const response = await axios.get('http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst', {
            params: {
                serviceKey: weatherApiKey,
                numOfRows: 300, // 충분한 데이터 로드를 위해 충분한 행 수 요청 (최대 300)
                pageNo: 1,
                dataType: 'JSON',
                base_date: baseDate,
                base_time: baseTime,
                nx: coordinates.nx,
                ny: coordinates.ny
            },
            timeout: 10000, // 10초 타임아웃 설정
            headers: {
                'User-Agent': 'HealingK-Complete-Weather-Service/2.0' // 사용자 에이전트 명시
            }
        });

        // 기상청 API 응답 검증 (데이터가 없거나 형식이 올바르지 않은 경우)
        if (!response.data?.response?.body?.items?.item) {
            const resultCode = response.data?.response?.header?.resultCode || 'UNKNOWN';
            const resultMsg = response.data?.response?.header?.resultMsg || '응답 데이터 없음';
            throw new Error(`기상청 API 응답에 날씨 데이터가 없거나 형식이 올바르지 않습니다. (코드: ${resultCode}, 메시지: ${resultMsg})`);
        }

        // 기상청 API 결과 코드 확인 (00은 정상)
        const resultCode = response.data.response.header.resultCode;
        if (resultCode !== '00') {
            const errorMsg = ERROR_MESSAGES[resultCode] || `알 수 없는 오류 (코드: ${resultCode})`;
            throw new Error(`기상청 API 오류 발생: ${errorMsg}`);
        }

        const items = response.data.response.body.items.item || []; // API 응답의 실제 날씨 데이터 항목 배열
        console.log('📊 받은 기상 데이터 항목 수:', items.length);

        // 날씨 데이터 가공 함수 호출
        const weatherData = processCompleteWeatherData(items, kst);

        // 가공된 날씨 데이터가 비어있을 경우 (데이터 부족 또는 파싱 오류)
        if (!weatherData || weatherData.length === 0) {
            throw new Error('기상청 API 데이터 파싱 실패 또는 유효한 날씨 정보가 없습니다. (받은 항목 수: ' + items.length + ')');
        }

        console.log('✅ 완전한 날씨 데이터 처리 완료:', weatherData.length, '일치');

        // 클라이언트에 반환할 현재 날씨 데이터 (가공된 3일 데이터 중 첫 번째 날)
        const currentWeather = weatherData[0];

        // 최종 응답 형식 (프론트엔드 요구사항에 맞춤)
        const simpleResponse = {
            success: true,
            temperature: currentWeather.temperature,
            weather: currentWeather.weatherStatus,
            humidity: currentWeather.humidity,
            windSpeed: currentWeather.windSpeed,
            locationInfo: locationInfo, // 매칭된 위치 정보
            timestamp: new Date().toISOString(),
            fullData: detailed === 'true' ? weatherData : undefined // detailed 쿼리가 'true'일 때만 상세 데이터 포함
        };

        // 새로 가져온 데이터를 캐시에 저장
        weatherCache.set(cacheKey, {
            data: simpleResponse,
            timestamp: Date.now()
        });

        // 캐시 크기 관리 (최대 100개 항목 유지, 가장 오래된 항목 제거)
        if (weatherCache.size > 100) {
            const oldestKey = weatherCache.keys().next().value;
            weatherCache.delete(oldestKey);
            console.log('🧹 캐시 정리 완료. 현재 캐시 크기:', weatherCache.size);
        }

        console.log('🎉 완전한 날씨 API 응답 성공');
        return res.status(200).json(simpleResponse);

    } catch (error) {
        // 모든 종류의 오류를 잡아서 상세 로깅 및 사용자에게 에러 응답 반환
        console.error('❌ 완전한 날씨 API 오류 발생:', {
            message: error.message,
            code: error.code, // Axios 오류 코드 (예: ECONNABORTED)
            response: error.response?.data, // HTTP 응답 오류의 경우 상세 데이터
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined // 개발 모드에서만 스택 트레이스 포함
        });

        // 에러 타입별 상세 로깅
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ API 요청 타임아웃 발생');
        } else if (error.response) {
            console.error('🚫 API 응답 오류 (HTTP 상태 코드):', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (error.request) {
            console.error('🌐 네트워크 오류 - 응답 없음 (API 서버에 도달하지 못함)');
        }

        // 에러 발생 시 실패 응답과 함께 샘플 데이터 반환 (사용자 경험 저하 방지)
        return res.status(200).json({ // HTTP 200 OK를 반환하여 프론트엔드가 오류를 정상 응답으로 처리하도록 유도
            success: false, // 실패로 표시
            error: true,
            errorMessage: error.message, // 실제 발생한 오류 메시지
            // 에러 발생 시에도 fullData를 제공하되, 오류 메시지를 포함한 샘플 데이터를 반환
            fullData: generateCompleteSampleData(
                req.query.region || DEFAULT_REGION,
                error.message
            ),
            locationInfo: {
                requested: req.query.region || DEFAULT_REGION,
                matched: '오류 발생', // 오류로 인해 정확한 위치 정보 없음
                fullName: '오류로 정보 없음',
                source: '오류 처리 (샘플 데이터)'
            },
            timestamp: new Date().toISOString(),
            warning: '실시간 날씨 정보를 가져오는 데 실패하여 샘플 데이터를 표시합니다.' // 사용자에게 보여줄 경고 메시지
        });
    }
};
