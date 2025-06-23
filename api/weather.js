const axios = require('axios');

// Vercel 서버리스용 캐시
let weatherCache = new Map();

// 완전한 기상청 날씨 코드 매핑 (이 부분은 기상청 데이터 해석에 필요하므로 유지합니다.)
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
 * 필수 지역명에 대한 하드코딩된 좌표 (API 실패 시 폴백용)
 * 이 목록은 최소한으로 유지하며, 대부분의 검색은 Kakao API를 통해 이루어집니다.
 */
function getFallbackLocationCoordinates() {
    return {
        '서울': { lat: 37.5665, lon: 126.9780, name: '서울특별시' },
        '제주': { lat: 33.4996, lon: 126.5312, name: '제주특별자치도' },
        '제주시': { lat: 33.5097, lon: 126.5219, name: '제주시' },
        '서귀포': { lat: 33.2541, lon: 126.5601, name: '서귀포시' },
        '산방산': { lat: 33.2764, lon: 126.3197, name: '제주 산방산' }, // 사용자 요청에 따라 명시적 추가
        '구리시': { lat: 37.5943, lon: 127.1296, name: '경기 구리시' }, // 사용자 요청에 따라 명시적 추가
        '제주올레여행자센터': { lat: 33.2483, lon: 126.5649, name: '제주올레여행자센터' },
        '서귀포버스터미널': { lat: 33.2546, lon: 126.5685, name: '서귀포버스터미널' }
    };
}

/**
 * 지역명을 위경도 좌표로 변환 (우선적으로 Kakao Local 검색 API 사용, 실패 시 하드코딩된 폴백 사용)
 * @param {string} query - 사용자 입력 지역명
 * @returns {Promise<Object>} 매칭된 지역의 좌표 및 이름 정보 {lat, lon, name}
 */
async function findLocationCoordinates(query) {
    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY; // Vercel 환경 변수에서 Kakao REST API 키 로드

    const fallbackLocations = getFallbackLocationCoordinates();

    // 1. 하드코딩된 폴백에서 정확한 매칭이 있는지 먼저 확인 (API 키가 없거나 API 호출 실패 시를 대비)
    const exactFallbackMatch = fallbackLocations[query];
    if (exactFallbackMatch) {
        console.log(`✅ 폴백에서 정확한 지역 매칭: ${query} -> ${exactFallbackMatch.name}`);
        return exactFallbackMatch;
    }

    // 2. Kakao REST API 키가 설정되어 있다면 API 호출 시도
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
                response: error.response?.data,
                query: query
            });
            console.warn(`⚠️ Kakao Geocoding API 오류로 인해 폴백 사용 시도.`);
        }
    } else {
        console.warn('⚠️ KAKAO_REST_API_KEY 환경 변수가 설정되지 않았습니다. Kakao Geocoding API를 사용할 수 없습니다. 폴백 사용 시도.');
    }

    // 3. Kakao API 실패 또는 키 부재 시, 폴백 목록에서 유사 매칭 시도
    const normalizedQuery = query.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[시군구읍면동리]/g, '')
        .replace(/특별자치도|광역시|특별자치시|특별시|도$/g, '');

    for (const [key, coords] of Object.entries(fallbackLocations)) {
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
    console.warn(`❌ "${query}"에 대한 위치를 찾을 수 없습니다. 기본값 "${DEFAULT_REGION}" 사용.`);
    return fallbackLocations[DEFAULT_REGION];
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
            // TMN은 첫 날 0600에만 존재하며, 그 이후는 TMX만 존재.
            // 유효한 TMN 값만 사용.
            const tmnValue = parseFloat(value);
            if (forecasts[date].dailyData.temperatureMin === null || tmnValue < forecasts[date].dailyData.temperatureMin) {
                forecasts[date].dailyData.temperatureMin = tmnValue;
            }
        }
        if (category === 'TMX' && value) {
            // TMX는 첫 날 1500에만 존재.
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
        // TMN, TMX는 일별 데이터에서 가져옴 (보통 새벽/오후 값으로만 존재)
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
        if (precipType && precipType.includes('비')) advice.push('☔ 우산 또는 우비 준비하세요');
        if (precipType && precipType.includes('눈')) advice.push('⛄ 눈 예보, 미끄럼 주의하세요');
        if (precipType && precipType.includes('폭우')) advice.push('� 폭우 주의! 저지대 침수 조심');
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
        const { region = DEFAULT_REGION, lat, lon, nx, ny, detailed = 'true' } = req.query;
        const weatherApiKey = process.env.WEATHER_API_KEY;

        console.log('완전한 날씨 API 요청:', {
            region, lat, lon, nx, ny, detailed,
            hasWeatherApiKey: !!weatherApiKey,
            timestamp: new Date().toISOString()
        });

        // API 키 확인 및 샘플 데이터 제공 로직
        if (!weatherApiKey) {
            console.warn('⚠️ WEATHER_API_KEY 환경 변수가 설정되지 않았습니다. 샘플 데이터를 제공합니다.');
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
        let targetLat, targetLon;

        // 1. nx, ny가 직접 제공된 경우 (최우선)
        if (nx && ny) {
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
            console.log('격자 좌표 직접 사용:', coordinates);
        } 
        // 2. 위경도가 직접 제공된 경우
        else if (lat && lon) {
            targetLat = parseFloat(lat);
            targetLon = parseFloat(lon);

            if (isNaN(targetLat) || isNaN(targetLon)) {
                throw new Error('잘못된 위경도 형식입니다.');
            }
            coordinates = latLonToGrid(targetLat, targetLon);
            locationInfo = {
                requested: `${lat}, ${lon}`,
                matched: `위경도 (${lat}, ${lon})`,
                fullName: `위도 ${lat}, 경도 ${lon}`,
                coordinates: coordinates,
                latLon: { lat: targetLat, lon: targetLon },
                source: '직접 위경도'
            };
            console.log('위경도 변환 완료:', { lat, lon, grid: coordinates });
        } 
        // 3. 지역명으로 검색 (새로운 findLocationCoordinates 사용)
        else {
            const locationResult = await findLocationCoordinates(region);
            targetLat = locationResult.lat;
            targetLon = locationResult.lon;
            coordinates = latLonToGrid(targetLat, targetLon);
            locationInfo = {
                requested: region,
                matched: locationResult.name,
                fullName: locationResult.name,
                coordinates: coordinates,
                latLon: { lat: targetLat, lon: targetLon },
                source: '지역명 검색 (Kakao API/Fallback)'
            };
            console.log('지역명 검색 완료:', { region, location: locationResult.name, grid: coordinates });
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
        // 발표 후 약 10분 정도 지나야 데이터가 안정적으로 올라옴
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

        if (cachedData && Date.now() - cachedData.timestamp < 30 * 60 * 1000) { // 30분 캐시 유효
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
                numOfRows: 300, // 충분한 데이터 로드
                pageNo: 1,
                dataType: 'JSON',
                base_date: baseDate,
                base_time: baseTime,
                nx: coordinates.nx,
                ny: coordinates.ny
            },
            timeout: 10000, // 10초 타임아웃
            headers: {
                'User-Agent': 'HealingK-Complete-Weather-Service/2.0'
            }
        });

        // API 응답 검증
        if (!response.data?.response?.body?.items?.item) {
            const resultCode = response.data?.response?.header?.resultCode || 'UNKNOWN';
            const resultMsg = response.data?.response?.header?.resultMsg || '응답 데이터 없음';
            throw new Error(`기상청 API 응답에 날씨 데이터가 없거나 형식이 올바르지 않습니다. (코드: ${resultCode}, 메시지: ${resultMsg})`);
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

        // weatherData가 비어있을 경우 (데이터가 없거나 파싱 오류)
        if (!weatherData || weatherData.length === 0) {
            throw new Error('기상청 API 데이터 파싱 실패 또는 유효한 날씨 정보 없음.');
        }

        console.log('✅ 완전한 날씨 데이터 처리 완료:', weatherData.length, '일');

        // 현재 날씨 데이터 추출 (첫 번째 요소가 오늘)
        const currentWeather = weatherData[0];

        // 간단한 응답 형식 (프론트엔드 요구사항에 맞춤)
        const simpleResponse = {
            success: true,
            temperature: currentWeather.temperature,
            weather: currentWeather.weatherStatus,
            humidity: currentWeather.humidity,
            windSpeed: currentWeather.windSpeed,
            locationInfo: locationInfo,
            timestamp: new Date().toISOString(),
            fullData: detailed === 'true' ? weatherData : undefined // 상세 정보도 포함 (필요시 사용)
        };

        // 캐시 저장
        weatherCache.set(cacheKey, {
            data: simpleResponse,
            timestamp: Date.now()
        });

        // 캐시 크기 관리 (최대 100개 항목)
        if (weatherCache.size > 100) {
            const oldestKey = weatherCache.keys().next().value;
            weatherCache.delete(oldestKey);
            console.log('🧹 캐시 정리 완료. 현재 캐시 크기:', weatherCache.size);
        }

        console.log('🎉 완전한 날씨 API 응답 성공');
        return res.status(200).json(simpleResponse);

    } catch (error) {
        console.error('❌ 완전한 날씨 API 오류 발생:', {
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

        // 에러 발생 시 샘플 데이터 반환 (오류 메시지 포함)
        return res.status(200).json({
            success: false, // 실패로 표시
            error: true,
            errorMessage: error.message,
            data: generateCompleteSampleData(req.query.region || DEFAULT_REGION, error.message), // 샘플 데이터 반환
            locationInfo: {
                requested: req.query.region || req.query.nx || req.query.lat || DEFAULT_REGION,
                matched: '오류 발생',
                fullName: '오류로 정보 없음',
                source: '오류 처리 (샘플 데이터)'
            },
            timestamp: new Date().toISOString(),
            warning: '실시간 날씨 정보를 가져오는 데 실패하여 샘플 데이터를 표시합니다.'
        });
    }
};
