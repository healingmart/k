**죄송합니다! WEATHER_API_KEY 환경변수를 제대로 사용하도록 수정하겠습니다:**

```javascript
const axios = require('axios');

// Vercel 서버리스 환경용 메모리 캐시 (글로벌 변수로 설정)
let cache = new Map();

// 상수 정의
const WEATHER_API_CONFIG = {
    BASE_URL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
    TIMEOUT: 10000, // Vercel 환경에서는 더 짧은 타임아웃 권장
    CACHE_DURATION: 30 * 60 * 1000, // 30분
    MAX_CACHE_SIZE: 50 // Vercel 메모리 제한 고려하여 축소
};

const WEATHER_CODES = {
    SKY: { '1': '맑음', '3': '구름많음', '4': '흐림' },
    PTY: { '0': '없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기' }
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

// 지역명 정규화 함수
function normalizeRegionName(region) {
    return region
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')  // 모든 공백 제거
        .replace(/[시군구청]/g, '') // 행정구역 단위 제거
        .replace(/광역시|특별시|특별자치시|특별자치도/g, ''); // 광역 단위 제거
}

// 샘플 데이터 생성 함수
function generateSampleData(region) {
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000); // KST 변환
    
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
            temperatureUnit: '°C',
            sky: '맑음',
            skyCode: '1',
            precipitation: '없음',
            precipitationCode: '0',
            humidity: 60,
            humidityUnit: '%',
            windSpeed: 2.5,
            windSpeedUnit: 'm/s',
            message: '🌟 오늘의 날씨 (샘플 데이터)',
            timestamp: new Date().toISOString(),
            region: region
        },
        {
            date: tomorrowStr,
            dateFormatted: tomorrow.toISOString().slice(0, 10),
            temperature: 22,
            temperatureUnit: '°C',
            sky: '구름많음',
            skyCode: '3',
            precipitation: '없음',
            precipitationCode: '0',
            humidity: 70,
            humidityUnit: '%',
            windSpeed: 3.0,
            windSpeedUnit: 'm/s',
            message: '🗓️ 내일의 날씨 (샘플 데이터)',
            timestamp: new Date().toISOString(),
            region: region
        },
        {
            date: dayAfterTomorrowStr,
            dateFormatted: dayAfterTomorrow.toISOString().slice(0, 10),
            temperature: 21,
            temperatureUnit: '°C',
            sky: '흐림',
            skyCode: '4',
            precipitation: '비',
            precipitationCode: '1',
            humidity: 80,
            humidityUnit: '%',
            windSpeed: 3.5,
            windSpeedUnit: 'm/s',
            message: '🗓️ 모레의 날씨 (샘플 데이터)',
            timestamp: new Date().toISOString(),
            region: region
        }
    ];
}

// Vercel 서버리스 함수 핸들러
export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=1800'); // Vercel CDN 캐시 30분

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed',
            message: 'GET 요청만 지원됩니다.'
        });
    }

    try {
        const region = req.query.region || '제주';
        
        // ✅ WEATHER_API_KEY 환경변수 사용
        const weatherApiKey = process.env.WEATHER_API_KEY;

        console.log('🌤️ 날씨 API 요청:', {
            region,
            weatherApiKeyExists: !!weatherApiKey,
            timestamp: new Date().toISOString(),
            vercelRegion: process.env.VERCEL_REGION || 'unknown'
        });

        // ✅ WEATHER_API_KEY 확인
        if (!weatherApiKey) {
            console.warn('⚠️ WEATHER_API_KEY 환경 변수가 설정되지 않았습니다.');
            return res.status(200).json({
                success: true,
                data: generateSampleData(region),
                warning: 'WEATHER_API_KEY가 설정되지 않아 샘플 데이터를 제공합니다.',
                environment: 'development'
            });
        }

        // 전국 관광지 좌표 매핑 (중복 지역명 해결)
        const coordinates = {
            // 서울특별시
            '서울': { nx: 60, ny: 127, fullName: '서울특별시' },
            '서울시': { nx: 60, ny: 127, fullName: '서울특별시' },
            '강남': { nx: 61, ny: 126, fullName: '서울 강남구' },
            '명동': { nx: 60, ny: 127, fullName: '서울 중구 명동' },
            '홍대': { nx: 59, ny: 127, fullName: '서울 마포구 홍대' },
            '이태원': { nx: 60, ny: 126, fullName: '서울 용산구 이태원' },
            '동대문': { nx: 61, ny: 127, fullName: '서울 동대문구' },
            '종로': { nx: 60, ny: 127, fullName: '서울 종로구' },
            '잠실': { nx: 62, ny: 126, fullName: '서울 송파구 잠실' },
            '여의도': { nx: 58, ny: 126, fullName: '서울 영등포구 여의도' },
            
            // 부산광역시
            '부산': { nx: 98, ny: 76, fullName: '부산광역시' },
            '부산시': { nx: 98, ny: 76, fullName: '부산광역시' },
            '해운대': { nx: 100, ny: 76, fullName: '부산 해운대구' },
            '광안리': { nx: 99, ny: 75, fullName: '부산 수영구 광안리' },
            '서면': { nx: 97, ny: 75, fullName: '부산 부산진구 서면' },
            '남포동': { nx: 97, ny: 74, fullName: '부산 중구 남포동' },
            '태종대': { nx: 96, ny: 74, fullName: '부산 영도구 태종대' },
            '기장': { nx: 100, ny: 77, fullName: '부산 기장군' },
            '감천': { nx: 96, ny: 75, fullName: '부산 사하구 감천' },
            
            // 대구광역시
            '대구': { nx: 89, ny: 90, fullName: '대구광역시' },
            '대구시': { nx: 89, ny: 90, fullName: '대구광역시' },
            '동성로': { nx: 89, ny: 90, fullName: '대구 중구 동성로' },
            '수성구': { nx: 91, ny: 90, fullName: '대구 수성구' },
            '달성': { nx: 86, ny: 88, fullName: '대구 달성군' },
            
            // 인천광역시
            '인천': { nx: 55, ny: 124, fullName: '인천광역시' },
            '인천시': { nx: 55, ny: 124, fullName: '인천광역시' },
            '송도': { nx: 54, ny: 123, fullName: '인천 연수구 송도' },
            '월미도': { nx: 54, ny: 125, fullName: '인천 중구 월미도' },
            '강화': { nx: 51, ny: 130, fullName: '인천 강화군' },
            '을왕리': { nx: 54, ny: 124, fullName: '인천 중구 을왕리' },
            
            // 광주광역시
            '광주': { nx: 58, ny: 74, fullName: '광주광역시' },
            '광주시': { nx: 58, ny: 74, fullName: '광주광역시' },
            '무등산': { nx: 59, ny: 75, fullName: '광주 북구 무등산' },
            
            // 대전광역시
            '대전': { nx: 67, ny: 100, fullName: '대전광역시' },
            '대전시': { nx: 67, ny: 100, fullName: '대전광역시' },
            '유성': { nx: 68, ny: 100, fullName: '대전 유성구' },
            
            // 울산광역시
            '울산': { nx: 102, ny: 84, fullName: '울산광역시' },
            '울산시': { nx: 102, ny: 84, fullName: '울산광역시' },
            '울주': { nx: 101, ny: 84, fullName: '울산 울주군' },
            
            // 세종특별자치시
            '세종': { nx: 66, ny: 103, fullName: '세종특별자치시' },
            '세종시': { nx: 66, ny: 103, fullName: '세종특별자치시' },
            
            // 경기도
            '수원': { nx: 60, ny: 121, fullName: '경기 수원시' },
            '용인': { nx: 64, ny: 119, fullName: '경기 용인시' },
            '성남': { nx: 63, ny: 124, fullName: '경기 성남시' },
            '부천': { nx: 56, ny: 125, fullName: '경기 부천시' },
            '안산': { nx: 58, ny: 121, fullName: '경기 안산시' },
            '안양': { nx: 59, ny: 123, fullName: '경기 안양시' },
            '평택': { nx: 62, ny: 114, fullName: '경기 평택시' },
            '시흥': { nx: 57, ny: 123, fullName: '경기 시흥시' },
            '김포': { nx: 55, ny: 128, fullName: '경기 김포시' },
            '광명': { nx: 58, ny: 125, fullName: '경기 광명시' },
            '군포': { nx: 59, ny: 122, fullName: '경기 군포시' },
            '하남': { nx: 64, ny: 125, fullName: '경기 하남시' },
            '오산': { nx: 62, ny: 118, fullName: '경기 오산시' },
            '이천': { nx: 68, ny: 121, fullName: '경기 이천시' },
            '안성': { nx: 65, ny: 115, fullName: '경기 안성시' },
            '의왕': { nx: 60, ny: 122, fullName: '경기 의왕시' },
            '양평': { nx: 69, ny: 125, fullName: '경기 양평군' },
            '여주': { nx: 71, ny: 121, fullName: '경기 여주시' },
            '과천': { nx: 60, ny: 124, fullName: '경기 과천시' },
            '고양': { nx: 57, ny: 128, fullName: '경기 고양시' },
            '남양주': { nx: 64, ny: 128, fullName: '경기 남양주시' },
            '파주': { nx: 56, ny: 131, fullName: '경기 파주시' },
            '의정부': { nx: 61, ny: 130, fullName: '경기 의정부시' },
            '양주': { nx: 61, ny: 131, fullName: '경기 양주시' },
            '구리': { nx: 62, ny: 127, fullName: '경기 구리시' },
            '포천': { nx: 64, ny: 134, fullName: '경기 포천시' },
            '동두천': { nx: 61, ny: 134, fullName: '경기 동두천시' },
            '가평': { nx: 69, ny: 133, fullName: '경기 가평군' },
            '연천': { nx: 61, ny: 138, fullName: '경기 연천군' },
            
            // 강원도
            '춘천': { nx: 73, ny: 134, fullName: '강원 춘천시' },
            '원주': { nx: 76, ny: 122, fullName: '강원 원주시' },
            '강릉': { nx: 92, ny: 131, fullName: '강원 강릉시' },
            '동해': { nx: 97, ny: 127, fullName: '강원 동해시' },
            '태백': { nx: 95, ny: 119, fullName: '강원 태백시' },
            '속초': { nx: 87, ny: 141, fullName: '강원 속초시' },
            '삼척': { nx: 98, ny: 125, fullName: '강원 삼척시' },
            '홍천': { nx: 75, ny: 133, fullName: '강원 홍천군' },
            '횡성': { nx: 77, ny: 125, fullName: '강원 횡성군' },
            '영월': { nx: 86, ny: 119, fullName: '강원 영월군' },
            '평창': { nx: 84, ny: 123, fullName: '강원 평창군' },
            '정선': { nx: 89, ny: 123, fullName: '강원 정선군' },
            '철원': { nx: 65, ny: 139, fullName: '강원 철원군' },
            '화천': { nx: 72, ny: 140, fullName: '강원 화천군' },
            '양구': { nx: 77, ny: 139, fullName: '강원 양구군' },
            '인제': { nx: 80, ny: 138, fullName: '강원 인제군' },
            '고성강원': { nx: 85, ny: 145, fullName: '강원 고성군' },
            '고성': { nx: 85, ny: 145, fullName: '강원 고성군' }, // 기본값을 강원도로
            '양양': { nx: 88, ny: 138, fullName: '강원 양양군' },
            '설악산': { nx: 85, ny: 141, fullName: '강원 설악산' },
            '오대산': { nx: 84, ny: 130, fullName: '강원 오대산' },
            
            // 충청북도
            '청주': { nx: 69, ny: 106, fullName: '충북 청주시' },
            '충주': { nx: 76, ny: 114, fullName: '충북 충주시' },
            '제천': { nx: 81, ny: 118, fullName: '충북 제천시' },
            '보은': { nx: 73, ny: 103, fullName: '충북 보은군' },
            '옥천': { nx: 71, ny: 99, fullName: '충북 옥천군' },
            '영동': { nx: 74, ny: 97, fullName: '충북 영동군' },
            '증평': { nx: 71, ny: 110, fullName: '충북 증평군' },
            '진천': { nx: 68, ny: 111, fullName: '충북 진천군' },
            '괴산': { nx: 74, ny: 111, fullName: '충북 괴산군' },
            '음성': { nx: 72, ny: 113, fullName: '충북 음성군' },
            '단양': { nx: 84, ny: 115, fullName: '충북 단양군' },
            
            // 충청남도
            '천안': { nx: 63, ny: 110, fullName: '충남 천안시' },
            '공주': { nx: 60, ny: 103, fullName: '충남 공주시' },
            '보령': { nx: 54, ny: 100, fullName: '충남 보령시' },
            '아산': { nx: 60, ny: 110, fullName: '충남 아산시' },
            '서산': { nx: 51, ny: 110, fullName: '충남 서산시' },
            '논산': { nx: 62, ny: 97, fullName: '충남 논산시' },
            '계룡': { nx: 65, ny: 99, fullName: '충남 계룡시' },
            '당진': { nx: 54, ny: 112, fullName: '충남 당진시' },
            '금산': { nx: 69, ny: 95, fullName: '충남 금산군' },
            '부여': { nx: 59, ny: 99, fullName: '충남 부여군' },
            '서천': { nx: 55, ny: 94, fullName: '충남 서천군' },
            '청양': { nx: 57, ny: 103, fullName: '충남 청양군' },
            '홍성': { nx: 55, ny: 106, fullName: '충남 홍성군' },
            '예산': { nx: 58, ny: 107, fullName: '충남 예산군' },
            '태안': { nx: 48, ny: 109, fullName: '충남 태안군' },
            
            // 전라북도
            '전주': { nx: 63, ny: 89, fullName: '전북 전주시' },
            '군산': { nx: 56, ny: 92, fullName: '전북 군산시' },
            '익산': { nx: 60, ny: 91, fullName: '전북 익산시' },
            '정읍': { nx: 58, ny: 83, fullName: '전북 정읍시' },
            '남원전북': { nx: 68, ny: 80, fullName: '전북 남원시' },
            '남원': { nx: 68, ny: 80, fullName: '전북 남원시' }, // 기본값을 전북으로
            '김제': { nx: 59, ny: 88, fullName: '전북 김제시' },
            '완주': { nx: 63, ny: 89, fullName: '전북 완주군' },
            '진안': { nx: 68, ny: 88, fullName: '전북 진안군' },
            '무주': { nx: 72, ny: 93, fullName: '전북 무주군' },
            '장수': { nx: 70, ny: 85, fullName: '전북 장수군' },
            '임실': { nx: 66, ny: 84, fullName: '전북 임실군' },
            '순창': { nx: 63, ny: 79, fullName: '전북 순창군' },
            '고창': { nx: 56, ny: 80, fullName: '전북 고창군' },
            '부안': { nx: 56, ny: 87, fullName: '전북 부안군' },
            
            // 전라남도
            '목포': { nx: 50, ny: 67, fullName: '전남 목포시' },
            '여수': { nx: 73, ny: 66, fullName: '전남 여수시' },
            '순천': { nx: 70, ny: 70, fullName: '전남 순천시' },
            '나주': { nx: 56, ny: 71, fullName: '전남 나주시' },
            '광양': { nx: 73, ny: 70, fullName: '전남 광양시' },
            '담양': { nx: 61, ny: 78, fullName: '전남 담양군' },
            '곡성': { nx: 66, ny: 77, fullName: '전남 곡성군' },
            '구례': { nx: 69, ny: 75, fullName: '전남 구례군' },
            '고흥': { nx: 66, ny: 62, fullName: '전남 고흥군' },
            '보성': { nx: 62, ny: 66, fullName: '전남 보성군' },
            '화순': { nx: 61, ny: 72, fullName: '전남 화순군' },
            '장흥': { nx: 59, ny: 64, fullName: '전남 장흥군' },
            '강진': { nx: 57, ny: 63, fullName: '전남 강진군' },
            '해남': { nx: 54, ny: 61, fullName: '전남 해남군' },
            '영암': { nx: 56, ny: 66, fullName: '전남 영암군' },
            '무안': { nx: 52, ny: 71, fullName: '전남 무안군' },
            '함평': { nx: 52, ny: 72, fullName: '전남 함평군' },
            '영광': { nx: 52, ny: 77, fullName: '전남 영광군' },
            '장성': { nx: 57, ny: 77, fullName: '전남 장성군' },
            '완도': { nx: 57, ny: 56, fullName: '전남 완도군' },
            '진도': { nx: 48, ny: 59, fullName: '전남 진도군' },
            '신안': { nx: 50, ny: 66, fullName: '전남 신안군' },
            '남원제주': { nx: 52, ny: 31, fullName: '제주 남원읍' },
            
            // 경상북도
            '포항': { nx: 102, ny: 94, fullName: '경북 포항시' },
            '경주': { nx: 100, ny: 91, fullName: '경북 경주시' },
            '김천': { nx: 80, ny: 96, fullName: '경북 김천시' },
            '안동': { nx: 91, ny: 106, fullName: '경북 안동시' },
            '구미': { nx: 84, ny: 96, fullName: '경북 구미시' },
            '영주': { nx: 89, ny: 111, fullName: '경북 영주시' },
            '영천': { nx: 95, ny: 93, fullName: '경북 영천시' },
            '상주': { nx: 81, ny: 102, fullName: '경북 상주시' },
            '문경': { nx: 81, ny: 106, fullName: '경북 문경시' },
            '경산': { nx: 91, ny: 90, fullName: '경북 경산시' },
            '군위': { nx: 88, ny: 99, fullName: '경북 군위군' },
            '의성': { nx: 90, ny: 101, fullName: '경북 의성군' },
            '청송': { nx: 96, ny: 103, fullName: '경북 청송군' },
            '영양': { nx: 97, ny: 108, fullName: '경북 영양군' },
            '영덕': { nx: 102, ny: 103, fullName: '경북 영덕군' },
            '청도': { nx: 91, ny: 86, fullName: '경북 청도군' },
            '고령': { nx: 83, ny: 87, fullName: '경북 고령군' },
            '성주': { nx: 83, ny: 91, fullName: '경북 성주군' },
            '칠곡': { nx: 85, ny: 93, fullName: '경북 칠곡군' },
            '예천': { nx: 86, ny: 107, fullName: '경북 예천군' },
            '봉화': { nx: 90, ny: 113, fullName: '경북 봉화군' },
            '울진': { nx: 102, ny: 115, fullName: '경북 울진군' },
            '울릉도': { nx: 127, ny: 127, fullName: '경북 울릉군' },
            
            // 경상남도
            '창원': { nx: 90, ny: 77, fullName: '경남 창원시' },
            '진주': { nx: 90, ny: 75, fullName: '경남 진주시' },
            '통영': { nx: 87, ny: 68, fullName: '경남 통영시' },
            '사천': { nx: 80, ny: 71, fullName: '경남 사천시' },
            '김해': { nx: 95, ny: 77, fullName: '경남 김해시' },
            '밀양': { nx: 92, ny: 83, fullName: '경남 밀양시' },
            '거제': { nx: 90, ny: 69, fullName: '경남 거제시' },
            '양산': { nx: 97, ny: 79, fullName: '경남 양산시' },
            '의령': { nx: 83, ny: 78, fullName: '경남 의령군' },
            '함안': { nx: 86, ny: 77, fullName: '경남 함안군' },
            '창녕': { nx: 87, ny: 83, fullName: '경남 창녕군' },
            '고성경남': { nx: 85, ny: 71, fullName: '경남 고성군' },
            '남해': { nx: 77, ny: 68, fullName: '경남 남해군' },
            '하동': { nx: 74, ny: 73, fullName: '경남 하동군' },
            '산청': { nx: 76, ny: 80, fullName: '경남 산청군' },
            '함양': { nx: 74, ny: 82, fullName: '경남 함양군' },
            '거창': { nx: 77, ny: 86, fullName: '경남 거창군' },
            '합천': { nx: 81, ny: 84, fullName: '경남 합천군' },
            
                      // 제주특별자치도
            '제주': { nx: 52, ny: 38, fullName: '제주특별자치도' },
            '제주시': { nx: 52, ny: 38, fullName: '제주시' },
            '서귀포': { nx: 52, ny: 33, fullName: '서귀포시' },
            '성산': { nx: 56, ny: 36, fullName: '제주 성산읍' },
            '중문': { nx: 51, ny: 32, fullName: '제주 중문관광단지' },
            '한림': { nx: 50, ny: 37, fullName: '제주 한림읍' },
            '애월': { nx: 51, ny: 38, fullName: '제주 애월읍' },
            '표선': { nx: 55, ny: 33, fullName: '제주 표선면' },
            '대정': { nx: 48, ny: 35, fullName: '제주 대정읍' },
            '한라산': { nx: 52, ny: 35, fullName: '제주 한라산' },
            '우도': { nx: 57, ny: 36, fullName: '제주 우도' },
            '마라도': { nx: 48, ny: 27, fullName: '제주 마라도' },
            
            // 주요 관광지 추가
            '설악산국립공원': { nx: 85, ny: 141, fullName: '설악산국립공원' },
            '지리산국립공원': { nx: 76, ny: 80, fullName: '지리산국립공원' },
            '한라산국립공원': { nx: 52, ny: 35, fullName: '한라산국립공원' },
            '경주역사유적지구': { nx: 100, ny: 91, fullName: '경주역사유적지구' },
            '부여백제문화단지': { nx: 59, ny: 99, fullName: '부여백제문화단지' },
            '안동하회마을': { nx: 91, ny: 106, fullName: '안동하회마을' },
            '전주한옥마을': { nx: 63, ny: 89, fullName: '전주한옥마을' },
            '보성녹차밭': { nx: 62, ny: 66, fullName: '보성녹차밭' },
            '담양죽녹원': { nx: 61, ny: 78, fullName: '담양죽녹원' },
            '여수엑스포': { nx: 73, ny: 66, fullName: '여수엑스포' },
            '통영케이블카': { nx: 87, ny: 68, fullName: '통영케이블카' },
            '거제외도': { nx: 90, ny: 69, fullName: '거제외도' },
            '남해독일마을': { nx: 77, ny: 68, fullName: '남해독일마을' },
            '태안안면도': { nx: 48, ny: 109, fullName: '태안안면도' },
            '속초해수욕장': { nx: 87, ny: 141, fullName: '속초해수욕장' },
            '강릉경포대': { nx: 92, ny: 131, fullName: '강릉경포대' },
            '정동진': { nx: 92, ny: 131, fullName: '정동진' },
            '평창올림픽파크': { nx: 84, ny: 123, fullName: '평창올림픽파크' },
            '단양도담삼봉': { nx: 84, ny: 115, fullName: '단양도담삼봉' },
            '부안채석강': { nx: 56, ny: 87, fullName: '부안채석강' },
            '고창고인돌': { nx: 56, ny: 80, fullName: '고창고인돌' },
            '완도청산도': { nx: 57, ny: 56, fullName: '완도청산도' },
            '진도신비의바닷길': { nx: 48, ny: 59, fullName: '진도신비의바닷길' }
        };

        // 지역명 정규화 및 좌표 찾기
        const normalizedRegion = normalizeRegionName(region);
        let coord = coordinates[region]; // 먼저 원본 지역명으로 시도
        let matchedRegionName = region;
        
        // 원본으로 찾지 못했을 경우 정규화된 이름으로 시도
        if (!coord) {
            coord = coordinates[normalizedRegion];
            if (coord) {
                matchedRegionName = normalizedRegion;
            }
        }
        
        // 정확한 매칭이 없을 경우 유사한 지역명 검색
        if (!coord) {
            const regionKeys = Object.keys(coordinates);
            const similarRegion = regionKeys.find(key => {
                const normalizedKey = normalizeRegionName(key);
                return normalizedKey.includes(normalizedRegion) || 
                       normalizedRegion.includes(normalizedKey) ||
                       key.includes(region) || 
                       region.includes(key);
            });
            
            if (similarRegion) {
                coord = coordinates[similarRegion];
                matchedRegionName = similarRegion;
                console.log(`🔍 지역명 매칭: ${region} -> ${similarRegion} (${coordinates[similarRegion].fullName})`);
            }
        }
        
        // 기본값으로 제주 좌표 사용
        if (!coord) {
            coord = coordinates['제주'];
            matchedRegionName = '제주';
            console.log(`🏝️ 기본 좌표 사용 (제주): ${region}`);
        }

        console.log('📍 좌표 정보:', { 
            originalRegion: region, 
            matchedRegion: matchedRegionName,
            fullName: coord.fullName,
            coord: { nx: coord.nx, ny: coord.ny }
        });

        // 한국 표준시(KST) 기준 날짜/시간 설정
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
        
        // 발표 시각 계산 (기상청은 3시간마다 발표: 02, 05, 08, 11, 14, 17, 20, 23시)
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
        // 자정 전후 발표시각이 전날인 경우 처리
        if (currentHour < 2 && baseTime === '2300') {
            const yesterday = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
            baseDate = yesterday.toISOString().slice(0, 10).replace(/-/g, '');
        }

        // Vercel 서버리스 환경용 캐시 확인
        const cacheKey = `${matchedRegionName}-${baseDate}-${baseTime}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < WEATHER_API_CONFIG.CACHE_DURATION) {
            console.log('🗂️ 캐시된 데이터 사용:', cacheKey);
            return res.status(200).json(cachedData.data);
        }

        console.log('🌐 기상청 API 요청 파라미터:', {
            baseDate,
            baseTime,
            nx: coord.nx,
            ny: coord.ny,
            region: coord.fullName,
            weatherApiKey: weatherApiKey.substring(0, 10) + '...' // 보안을 위해 일부만 로깅
        });

        // ✅ 기상청 API 요청 (WEATHER_API_KEY 사용)
        const response = await axios.get(WEATHER_API_CONFIG.BASE_URL, {
            params: {
                serviceKey: weatherApiKey, // ✅ WEATHER_API_KEY 환경변수 사용
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

        // API 응답 상태 확인
        if (!response.data?.response?.body?.items?.item) {
            throw new Error('기상청 API 응답에 데이터가 없습니다.');
        }

        const resultCode = response.data.response.header.resultCode;
        if (resultCode !== '00') {
            const errorMsg = ERROR_MESSAGES[resultCode] || `알 수 없는 오류 (코드: ${resultCode})`;
            throw new Error(`기상청 API 오류: ${errorMsg}`);
        }

        const items = response.data.response.body.items.item || [];
        console.log('📊 받은 데이터 항목 수:', items.length);

        const dailyForecasts = {}; // 날짜별 예보 데이터를 저장할 객체

        // 오늘, 내일, 모레 날짜 계산 (KST 기준)
        const todayStr = kst.toISOString().slice(0, 10).replace(/-/g, '');
        const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10).replace(/-/g, '');
        const dayAfterTomorrow = new Date(kst.getTime() + 2 * 24 * 60 * 60 * 1000);
        const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().slice(0, 10).replace(/-/g, '');

        // 기상청 데이터 처리 로직
        items.forEach(item => {
            const fcstDate = item.fcstDate;
            const fcstTime = item.fcstTime;
            const category = item.category;
            const value = item.fcstValue;

            if (!dailyForecasts[fcstDate]) {
                dailyForecasts[fcstDate] = {
                    date: fcstDate,
                    temperature: null,
                    sky: null,
                    precipitation: null,
                    humidity: null,
                    windSpeed: null,
                    dataPoints: {} // 시간대별 데이터 저장
                };
            }

            // 각 카테고리별로 시간대별 데이터 저장
            const timeKey = fcstTime;
            if (!dailyForecasts[fcstDate].dataPoints[timeKey]) {
                dailyForecasts[fcstDate].dataPoints[timeKey] = {};
            }
            
            dailyForecasts[fcstDate].dataPoints[timeKey][category] = value;
        });

        // 각 날짜별로 대표값 선택 (오후 시간대 우선)
        Object.keys(dailyForecasts).forEach(date => {
            const forecast = dailyForecasts[date];
            const preferredTimes = ['1400', '1200', '1500', '1100', '1600', '1000', '1700']; // 선호 시간 순서
            
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
                    selectedTime = availableTimes[0]; // 첫 번째 사용 가능한 시간
                }
            }
            
            if (selectedTime && forecast.dataPoints[selectedTime]) {
                const data = forecast.dataPoints[selectedTime];
                forecast.temperature = data.TMP ? parseFloat(data.TMP) : null;
                forecast.sky = data.SKY || null;
                forecast.precipitation = data.PTY || null;
                forecast.humidity = data.REH ? parseFloat(data.REH) : null;
                forecast.windSpeed = data.WSD ? parseFloat(data.WSD) : null;
            }
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
                    temperatureUnit: '°C',
                    sky: skyDescription,
                    skyCode: forecast.sky,
                    precipitation: precipitationDescription,
                    precipitationCode: forecast.precipitation,
                    humidity: forecast.humidity !== null ? Math.round(forecast.humidity) : null,
                    humidityUnit: '%',
                    windSpeed: forecast.windSpeed !== null ? parseFloat(forecast.windSpeed).toFixed(1) : null,
                    windSpeedUnit: 'm/s',
                    message: message,
                    timestamp: new Date().toISOString(),
                    region: coord.fullName || matchedRegionName,
                    originalRegion: region
                });
            }
        });

        console.log('✅ 최종 날씨 데이터 생성 완료:', weatherResults.length, '건');

        const responseData = {
            success: true,
            data: weatherResults,
            regionInfo: {
                requested: region,
                matched: matchedRegionName,
                fullName: coord.fullName
            },
            apiInfo: {
                source: '기상청 단기예보',
                baseDate: baseDate,
                baseTime: baseTime,
                timestamp: new Date().toISOString(),
                apiKeyUsed: 'WEATHER_API_KEY' // ✅ 사용된 환경변수명 표시
            }
        };

        // Vercel 환경용 캐시 저장
        cache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        // 캐시 크기 관리 (Vercel 메모리 제한 고려)
        if (cache.size > WEATHER_API_CONFIG.MAX_CACHE_SIZE) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
            console.log('🗑️ 캐시 정리 완료. 현재 캐시 크기:', cache.size);
        }

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('❌ 날씨 API 오류:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // 에러 타입별 상세 로깅
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ API 요청 타임아웃 발생');
        } else if (error.response) {
            console.error('🌐 API 응답 오류:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        } else if (error.request) {
            console.error('📡 네트워크 오류 - 응답 없음');
        } else {
            console.error('🔧 기타 오류:', error.message);
        }

        // 에러 발생 시에도 사용 가능한 샘플 데이터 반환
        return res.status(200).json({
            success: false,
            error: true,
            errorMessage: error.message,
            data: generateSampleData(req.query.region || '제주'),
            warning: '실시간 날씨 정보를 가져올 수 없어 샘플 데이터를 제공합니다.',
            regionInfo: {
                requested: req.query.region || '제주',
                matched: '제주',
                fullName: '제주특별자치도'
            },
            apiInfo: {
                source: '샘플 데이터',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                apiKeyUsed: 'WEATHER_API_KEY' // ✅ 환경변수명 표시
            }
        });
    }
}
