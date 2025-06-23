**맞습니다! 위경도 변환 방식이 훨씬 효율적입니다!**

3500개 좌표를 다 하드코딩하는 건 비현실적이죠. 위경도 → 기상청 격자 좌표 변환 함수를 사용하면 전국 어디든 자동으로 처리할 수 있습니다.

```javascript
const axios = require('axios');

// Vercel 서버리스 환경용 메모리 캐시
let cache = new Map();

// 상수 정의
const WEATHER_API_CONFIG = {
    BASE_URL: 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst',
    TIMEOUT: 10000,
    CACHE_DURATION: 30 * 60 * 1000, // 30분
    MAX_CACHE_SIZE: 50
};

// 완전한 기상청 날씨 코드 매핑 (이전에 작성한 것 그대로 사용)
const WEATHER_CODES = {
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
    }
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
    const RADDEG = 180.0 / Math.PI;

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

// 주요 지역 위경도 데이터베이스 (대표 지역만)
const REGION_COORDINATES = {
    // 광역시/도 대표 좌표
    '서울': { lat: 37.5665, lon: 126.9780, fullName: '서울특별시' },
    '부산': { lat: 35.1796, lon: 129.0756, fullName: '부산광역시' },
    '대구': { lat: 35.8714, lon: 128.6014, fullName: '대구광역시' },
    '인천': { lat: 37.4563, lon: 126.7052, fullName: '인천광역시' },
    '광주': { lat: 35.1595, lon: 126.8526, fullName: '광주광역시' },
    '대전': { lat: 36.3504, lon: 127.3845, fullName: '대전광역시' },
    '울산': { lat: 35.5384, lon: 129.3114, fullName: '울산광역시' },
    '세종': { lat: 36.4800, lon: 127.2890, fullName: '세종특별자치시' },
    
    // 경기도 주요 도시
    '수원': { lat: 37.2636, lon: 127.0286, fullName: '경기도 수원시' },
    '고양': { lat: 37.6584, lon: 126.8320, fullName: '경기도 고양시' },
    '용인': { lat: 37.2411, lon: 127.1776, fullName: '경기도 용인시' },
    '성남': { lat: 37.4201, lon: 127.1262, fullName: '경기도 성남시' },
    '부천': { lat: 37.5034, lon: 126.7660, fullName: '경기도 부천시' },
    
    // 강원도
    '춘천': { lat: 37.8813, lon: 127.7298, fullName: '강원도 춘천시' },
    '강릉': { lat: 37.7519, lon: 128.8761, fullName: '강원도 강릉시' },
    '속초': { lat: 38.2070, lon: 128.5918, fullName: '강원도 속초시' },
    '원주': { lat: 37.3422, lon: 127.9202, fullName: '강원도 원주시' },
    
    // 충청도
    '청주': { lat: 36.6424, lon: 127.4890, fullName: '충청북도 청주시' },
    '천안': { lat: 36.8151, lon: 127.1139, fullName: '충청남도 천안시' },
    '충주': { lat: 36.9910, lon: 127.9259, fullName: '충청북도 충주시' },
    
    // 전라도
    '전주': { lat: 35.8242, lon: 127.1480, fullName: '전라북도 전주시' },
    '여수': { lat: 34.7604, lon: 127.6622, fullName: '전라남도 여수시' },
    '목포': { lat: 34.8118, lon: 126.3922, fullName: '전라남도 목포시' },
    '순천': { lat: 34.9506, lon: 127.4872, fullName: '전라남도 순천시' },
    
    // 경상도
    '포항': { lat: 36.0190, lon: 129.3435, fullName: '경상북도 포항시' },
    '경주': { lat: 35.8562, lon: 129.2247, fullName: '경상북도 경주시' },
    '창원': { lat: 35.2281, lon: 128.6811, fullName: '경상남도 창원시' },
    '진주': { lat: 35.1800, lon: 128.1076, fullName: '경상남도 진주시' },
    '통영': { lat: 34.8546, lon: 128.4331, fullName: '경상남도 통영시' },
    
    // 제주도
    '제주': { lat: 33.4996, lon: 126.5312, fullName: '제주특별자치도 제주시' },
    '서귀포': { lat: 33.2542, lon: 126.5603, fullName: '제주특별자치도 서귀포시' },
    
    // 주요 관광지
    '설악산': { lat: 38.1199, lon: 128.4655, fullName: '설악산국립공원' },
    '지리산': { lat: 35.3384, lon: 127.7289, fullName: '지리산국립공원' },
    '한라산': { lat: 33.3617, lon: 126.5292, fullName: '한라산국립공원' },
    '경복궁': { lat: 37.5788, lon: 126.9770, fullName: '서울 경복궁' },
    '해운대': { lat: 35.1587, lon: 129.1603, fullName: '부산 해운대구' },
    '명동': { lat: 37.5636, lon: 126.9834, fullName: '서울 명동' },
    '홍대': { lat: 37.5563, lon: 126.9236, fullName: '서울 홍대' },
    '이태원': { lat: 37.5347, lon: 126.9947, fullName: '서울 이태원' },
    '강남': { lat: 37.4979, lon: 127.0276, fullName: '서울 강남구' },
    '잠실': { lat: 37.5133, lon: 127.1000, fullName: '서울 잠실' }
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
            const errorMessages = {
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
            const errorMsg = errorMessages[resultCode] || `알 수 없는 오류 (코드: ${resultCode})`;
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
                forecast.precipitationAmount = data.PCP || null;
                forecast.humidity = data.REH ? parseFloat(data.REH) : null;
                forecast.windSpeed = data.WSD ? parseFloat(data.WSD) : null;
                forecast.windDirection = data.VEC ? getWindDirection(parseFloat(data.VEC)) : null;
                forecast.windDirectionDegree = data.VEC ? parseFloat(data.VEC) : null;
                forecast.snowAmount = data.SNO || null;
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

