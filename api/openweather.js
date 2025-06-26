/**
 * @file openweather.js (Enhanced Version)
 * @description OpenWeatherMap API를 기상청 API와 동일한 형태로 변환하는 서버리스 함수
 * @version Enhanced 1.0
 */

export default async function handler(req, res) {
    const { lat, lon, city, region } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!apiKey) {
        console.error("OPENWEATHER_API_KEY 환경변수가 설정되지 않았습니다.");
        return res.status(500).json({ 
            success: false,
            error: 'API 키가 설정되지 않았습니다.',
            code: 'API_KEY_MISSING'
        });
    }

    try {
        console.log('🌤️ OpenWeatherMap API 호출 시작:', { lat, lon, city, region });

        // 좌표 또는 도시명 결정
        const location = determineLocation(lat, lon, city, region);
        
        // 현재 날씨와 5일 예보 동시 호출
        const [currentWeather, forecastData] = await Promise.all([
            getCurrentWeather(location, apiKey),
            getForecastData(location, apiKey)
        ]);

        console.log('✅ OpenWeatherMap 데이터 수신 완료');

        // 기상청 API 형태로 변환
        const processedData = convertToKMAFormat(currentWeather, forecastData, location);
        
        console.log('🔄 데이터 변환 완료');
        
        res.json(processedData);

    } catch (error) {
        console.error("OpenWeatherMap API 오류:", error);
        
        // 에러 시에도 샘플 데이터 제공
        const fallbackData = generateFallbackData(city || region || '알 수 없는 지역', error.message);
        
        res.status(500).json({
            success: false,
            data: fallbackData,
            error: error.message || '날씨 정보를 가져올 수 없습니다.',
            code: error.code || 'OPENWEATHER_ERROR'
        });
    }
}

// 위치 정보 결정
function determineLocation(lat, lon, city, region) {
    if (lat && lon) {
        return { 
            type: 'coordinates', 
            lat: parseFloat(lat), 
            lon: parseFloat(lon),
            name: region || city || `${lat}, ${lon}`
        };
    } else if (city) {
        return { 
            type: 'city', 
            query: city,
            name: city
        };
    } else if (region) {
        return { 
            type: 'city', 
            query: region,
            name: region
        };
    } else {
        // 기본값: 서울
        return { 
            type: 'city', 
            query: 'Seoul,KR',
            name: '서울'
        };
    }
}

// 현재 날씨 조회
async function getCurrentWeather(location, apiKey) {
    const query = location.type === 'coordinates' 
        ? `lat=${location.lat}&lon=${location.lon}`
        : `q=${location.query}`;
        
    const url = `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=metric&lang=kr`;
    
    console.log('📡 현재 날씨 API 호출:', url.replace(apiKey, 'API_KEY'));
    
    const response = await fetch(url);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`현재 날씨 조회 실패: ${errorData.message || response.statusText}`);
    }
    
    return response.json();
}

// 5일 예보 조회
async function getForecastData(location, apiKey) {
    const query = location.type === 'coordinates' 
        ? `lat=${location.lat}&lon=${location.lon}`
        : `q=${location.query}`;
        
    const url = `https://api.openweathermap.org/data/2.5/forecast?${query}&appid=${apiKey}&units=metric&lang=kr`;
    
    console.log('📡 예보 데이터 API 호출:', url.replace(apiKey, 'API_KEY'));
    
    const response = await fetch(url);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`예보 데이터 조회 실패: ${errorData.message || response.statusText}`);
    }
    
    return response.json();
}

// 기상청 API 형태로 변환
function convertToKMAFormat(current, forecast, location) {
    const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
    
    // 일별 데이터 그룹화
    const dailyForecasts = groupForecastByDay(forecast.list, kst);
    
    return {
        success: true,
        data: [
            processDayData(dailyForecasts.today, '오늘', 0, current, kst),
            processDayData(dailyForecasts.tomorrow, '내일', 1, null, kst),
            processDayData(dailyForecasts.dayAfter, '모레', 2, null, kst)
        ],
        locationInfo: {
            requested: location.name,
            matched: current.name,
            fullName: `${current.name}, ${current.sys.country}`,
            coordinates: {
                lat: current.coord.lat,
                lon: current.coord.lon
            },
            source: 'OpenWeatherMap'
        },
        apiInfo: {
            source: 'OpenWeatherMap API',
            note: 'OpenWeatherMap 데이터를 기상청 형태로 변환했습니다.',
            timestamp: new Date().toISOString(),
            version: 'Enhanced 1.0',
            provider: 'OpenWeatherMap',
            dataPoints: forecast.list.length
        },
        weatherCodes: getWeatherCodes()
    };
}

// 예보 데이터를 일별로 그룹화
function groupForecastByDay(forecastList, kst) {
    const today = kst.toISOString().slice(0, 10);
    const tomorrow = new Date(kst.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dayAfter = new Date(kst.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
        today: forecastList.filter(item => {
            const itemDate = new Date(item.dt * 1000).toISOString().slice(0, 10);
            return itemDate === today;
        }),
        tomorrow: forecastList.filter(item => {
            const itemDate = new Date(item.dt * 1000).toISOString().slice(0, 10);
            return itemDate === tomorrow;
        }),
        dayAfter: forecastList.filter(item => {
            const itemDate = new Date(item.dt * 1000).toISOString().slice(0, 10);
            return itemDate === dayAfter;
        })
    };
}

// 일별 데이터 처리
function processDayData(dayForecasts, dayLabel, dayIndex, currentWeather = null, kst) {
    const dateObj = new Date(kst.getTime() + dayIndex * 24 * 60 * 60 * 1000);
    const dateString = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const dateFormatted = dateObj.toISOString().slice(0, 10);
    
    // 데이터가 없는 경우 빈 데이터 반환
    if (!dayForecasts || dayForecasts.length === 0) {
        return createEmptyDayData(dateString, dateFormatted, dayLabel, dayIndex);
    }

    // 대표 데이터 선택 (현재 날씨 우선, 없으면 첫 번째 예보)
    const representative = currentWeather || dayForecasts[0];
    
    // 온도 범위 계산
    const temperatures = dayForecasts.map(f => Math.round(f.main.temp));
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    
    // 강수확률 최대값 계산
    const precipitationProbs = dayForecasts.map(f => Math.round((f.pop || 0) * 100));
    const maxPrecipitationProb = Math.max(...precipitationProbs, 0);
    
    // 현재 날씨 데이터 처리
    const mainData = currentWeather ? {
        temperature: Math.round(currentWeather.main.temp),
        humidity: currentWeather.main.humidity,
        windSpeed: currentWeather.wind.speed,
        windDirection: currentWeather.wind.deg,
        weather: currentWeather.weather[0]
    } : {
        temperature: Math.round(representative.main.temp),
        humidity: representative.main.humidity,
        windSpeed: representative.wind.speed,
        windDirection: representative.wind.deg,
        weather: representative.weather[0]
    };

    return {
        date: dateString,
        dateFormatted: dateFormatted,
        representativeTime: currentWeather ? 
            new Date().toTimeString().slice(0, 5).replace(':', '') : 
            new Date(representative.dt * 1000).toTimeString().slice(0, 5).replace(':', ''),
        
        // 온도 정보
        temperature: mainData.temperature,
        temperatureMin: minTemp,
        temperatureMax: maxTemp,
        temperatureUnit: '°C',
        temperatureDescription: getTemperatureDescription(mainData.temperature),
        sensoryTemperature: Math.round(currentWeather ? currentWeather.main.feels_like : representative.main.feels_like),
        sensoryTemperatureDescription: getTemperatureDescription(Math.round(currentWeather ? currentWeather.main.feels_like : representative.main.feels_like)),
        temperatureCompareYesterday: null,
        
        // 하늘 상태
        sky: convertWeatherToSky(mainData.weather.main, mainData.weather.id),
        skyCode: convertWeatherToSkyCode(mainData.weather.main, mainData.weather.id),
        skyDescription: mainData.weather.description,
        
        // 강수 정보
        precipitation: convertWeatherToPrecipitation(mainData.weather.main, mainData.weather.id),
        precipitationCode: convertWeatherToPrecipitationCode(mainData.weather.main, mainData.weather.id),
        precipitationDescription: convertWeatherToPrecipitation(mainData.weather.main, mainData.weather.id),
        precipitationProbability: currentWeather ? 0 : Math.round((representative.pop || 0) * 100),
        precipitationProbabilityMax: maxPrecipitationProb,
        precipitationProbabilityDescription: `${maxPrecipitationProb}% ${getProbabilityText(maxPrecipitationProb)}`,
        precipitationAmount: calculatePrecipitationAmount(representative),
        precipitationAmountDescription: calculatePrecipitationAmount(representative),
        snowAmount: calculateSnowAmount(representative),
        snowAmountDescription: calculateSnowAmount(representative),
        
        // 기타 기상 정보
        humidity: mainData.humidity,
        humidityUnit: '%',
        humidityDescription: getHumidityDescription(mainData.humidity),
        windSpeed: mainData.windSpeed.toFixed(1),
        windSpeedUnit: 'm/s',
        windSpeedDescription: getWindSpeedDescription(mainData.windSpeed),
        windSpeedRange: getWindSpeedRange(mainData.windSpeed),
        windDirection: convertWindDirection(mainData.windDirection),
        windDirectionDegree: Math.round(mainData.windDirection),
        windDirectionDescription: `${convertWindDirection(mainData.windDirection)} (${Math.round(mainData.windDirection)}도)`,
        
        waveHeight: null,
        waveHeightDescription: '정보없음',
        uvIndex: null,
        visibility: currentWeather ? Math.round(currentWeather.visibility / 1000) : null,
        
        weatherStatus: getOverallWeatherStatus(mainData),
        weatherAdvice: getWeatherAdvice(mainData, dayLabel),
        
        // 시간별 데이터
        hourlyData: dayForecasts.map(forecast => ({
            time: new Date(forecast.dt * 1000).toTimeString().slice(0, 5).replace(':', ''),
            timeFormatted: new Date(forecast.dt * 1000).toTimeString().slice(0, 5),
            temperature: Math.round(forecast.main.temp),
            sensoryTemperature: Math.round(forecast.main.feels_like),
            sky: convertWeatherToSky(forecast.weather[0].main, forecast.weather[0].id),
            precipitation: convertWeatherToPrecipitation(forecast.weather[0].main, forecast.weather[0].id),
            precipitationProbability: Math.round((forecast.pop || 0) * 100),
            humidity: forecast.main.humidity,
            windSpeed: forecast.wind.speed.toFixed(1),
            windSpeedRange: getWindSpeedRange(forecast.wind.speed),
            windDirection: convertWindDirection(forecast.wind.deg),
            windDirectionDegree: Math.round(forecast.wind.deg)
        })),
        
        dayLabel: dayLabel,
        dayIndex: dayIndex
    };
}

// OpenWeatherMap 날씨 코드 → 기상청 하늘 상태 변환
function convertWeatherToSky(main, id) {
    // OpenWeatherMap 날씨 ID 기반 정확한 변환
    if (id >= 200 && id < 300) return '흐림'; // 뇌우
    if (id >= 300 && id < 400) return '흐림'; // 이슬비
    if (id >= 500 && id < 600) return '흐림'; // 비
    if (id >= 600 && id < 700) return '흐림'; // 눈
    if (id >= 700 && id < 800) return '흐림'; // 안개 등
    if (id === 800) return '맑음'; // 맑음
    if (id === 801) return '구름조금'; // 구름 조금
    if (id === 802) return '구름많음'; // 구름 많음
    if (id >= 803) return '흐림'; // 흐림
    
    return '구름많음'; // 기본값
}

function convertWeatherToSkyCode(main, id) {
    const sky = convertWeatherToSky(main, id);
    const skyCodeMap = {
        '맑음': '1',
        '구름조금': '2',
        '구름많음': '3',
        '흐림': '4'
    };
    return skyCodeMap[sky] || '3';
}

// OpenWeatherMap → 기상청 강수 형태 변환
function convertWeatherToPrecipitation(main, id) {
    if (id >= 200 && id < 300) return '소나기'; // 뇌우
    if (id >= 300 && id < 400) return '비'; // 이슬비
    if (id >= 500 && id < 600) return '비'; // 비
    if (id >= 600 && id < 700) return '눈'; // 눈
    return '없음';
}

function convertWeatherToPrecipitationCode(main, id) {
    const precip = convertWeatherToPrecipitation(main, id);
    const precipCodeMap = {
        '없음': '0',
        '비': '1',
        '비/눈': '2',
        '눈': '3',
        '소나기': '4'
    };
    return precipCodeMap[precip] || '0';
}

// 강수량 계산
function calculatePrecipitationAmount(forecast) {
    if (forecast.rain && forecast.rain['3h']) {
        const amount = forecast.rain['3h'];
        if (amount < 1) return '1mm 미만';
        if (amount >= 100) return '100mm 이상';
        return `${Math.round(amount)}mm`;
    }
    return '0mm';
}

// 적설량 계산
function calculateSnowAmount(forecast) {
    if (forecast.snow && forecast.snow['3h']) {
        const amount = forecast.snow['3h'] / 10; // mm를 cm로 변환 (대략)
        if (amount < 1) return '1cm 미만';
        if (amount >= 30) return '30cm 이상';
        return `${Math.round(amount)}cm`;
    }
    return '0cm';
}

// 풍향 변환
function convertWindDirection(degree) {
    if (!degree && degree !== 0) return '정보없음';
    
    const directions = [
        '북', '북북동', '북동', '동북동',
        '동', '동남동', '남동', '남남동',
        '남', '남남서', '남서', '서남서',
        '서', '서북서', '북서', '북북서'
    ];
    
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
}

// 기타 설명 함수들
function getTemperatureDescription(temp) {
    if (temp === null || isNaN(temp)) return '정보없음';
    if (temp <= -20) return '혹한 (매우 추움)';
    if (temp <= -10) return '한파 (매우 추움)';
    if (temp <= 0) return '추위 (추움)';
    if (temp <= 9) return '쌀쌀 (쌀쌀함)';
    if (temp <= 15) return '서늘 (서늘함)';
    if (temp <= 20) return '선선 (선선함)';
    if (temp <= 25) return '적당 (쾌적함)';
    if (temp <= 28) return '따뜻 (따뜻함)';
    if (temp <= 32) return '더위 (더움)';
    if (temp <= 35) return '폭염 (매우 더움)';
    return '극심한폭염 (위험)';
}

function getHumidityDescription(humidity) {
    if (humidity >= 90) return '매우 습함';
    if (humidity >= 70) return '습함';
    if (humidity >= 50) return '적당';
    if (humidity >= 30) return '약간 건조';
    return '매우 건조';
}

function getWindSpeedDescription(windSpeed) {
    const ws = parseFloat(windSpeed);
    if (ws < 0.5) return '0.0m/s (고요)';
    if (ws < 1.6) return '0.5~1.5m/s (실바람)';
    if (ws < 3.4) return '1.6~3.3m/s (남실바람)';
    if (ws < 5.5) return '3.4~5.4m/s (산들바람)';
    if (ws < 8.0) return '5.5~7.9m/s (건들바람)';
    if (ws < 10.8) return '8.0~10.7m/s (흔들바람)';
    if (ws < 13.9) return '10.8~13.8m/s (된바람)';
    return '13.9m/s 이상 (센바람)';
}

function getWindSpeedRange(windSpeed) {
    const ws = parseFloat(windSpeed);
    const min = Math.max(0, ws - 1).toFixed(1);
    const max = (ws + 2).toFixed(1);
    return `${min}~${max}m/s`;
}

function getProbabilityText(prob) {
    if (prob === 0) return '(강수 없음)';
    if (prob <= 20) return '(낮음)';
    if (prob <= 40) return '(보통)';
    if (prob <= 60) return '(높음)';
    if (prob <= 80) return '(매우 높음)';
    return '(확실)';
}

function getOverallWeatherStatus(data) {
    const temp = data.temperature;
    const weather = data.weather.main;
    
    if (weather === 'Rain' || weather === 'Drizzle') return '비, 우산 필요';
    if (weather === 'Snow') return '눈, 미끄럼 주의';
    if (weather === 'Thunderstorm') return '뇌우, 실내 대피';
    if (weather === 'Clear' && temp >= 30) return '맑음, 더위 주의';
    if (weather === 'Clear') return '맑음, 쾌적';
    if (weather === 'Clouds') return '구름많음, 적당';
    return '보통';
}

function getWeatherAdvice(data, dayLabel) {
    const temp = data.temperature;
    const weather = data.weather.main;
    const advice = [];
    
    if (temp >= 35) advice.push('🌡️ 폭염 경보! 야외활동 자제');
    else if (temp >= 30) advice.push('☀️ 더운 날씨, 충분한 수분 섭취');
    else if (temp <= 0) advice.push('🧊 추위 주의, 따뜻한 복장');
    else if (temp <= 10) advice.push('🧥 쌀쌀한 날씨, 외투 준비');
    
    if (weather === 'Rain' || weather === 'Drizzle') advice.push('☔ 우산 필수');
    if (weather === 'Snow') advice.push('⛄ 눈길 미끄럼 주의');
    if (weather === 'Thunderstorm') advice.push('⛈️ 뇌우 주의, 실내 대피');
    
    return advice.length > 0 ? advice.join(' | ') : '쾌적한 날씨입니다';
}

// 빈 데이터 생성
function createEmptyDayData(dateString, dateFormatted, dayLabel, dayIndex) {
    return {
        date: dateString,
        dateFormatted: dateFormatted,
        dayLabel: dayLabel,
        dayIndex: dayIndex,
        temperature: null,
        temperatureMin: null,
        temperatureMax: null,
        temperatureUnit: '°C',
        temperatureDescription: '정보없음',
        sensoryTemperature: null,
        sensoryTemperatureDescription: '정보없음',
        sky: '정보없음',
        precipitation: '정보없음',
        precipitationProbability: 0,
        humidity: null,
        windSpeed: null,
        weatherStatus: '정보없음',
        weatherAdvice: '날씨 정보를 확인할 수 없습니다',
        hourlyData: []
    };
}

// 폴백 데이터 생성
function generateFallbackData(locationName, errorMessage) {
    const today = new Date();
    const kst = new Date(today.getTime() + 9 * 60 * 60 * 1000);
    
    return [
        {
            date: kst.toISOString().slice(0, 10).replace(/-/g, ''),
            dateFormatted: kst.toISOString().slice(0, 10),
            dayLabel: '오늘',
            dayIndex: 0,
            temperature: 22,
            temperatureMin: 18,
            temperatureMax: 26,
            sky: '구름많음',
            precipitation: '없음',
            precipitationProbability: 20,
            humidity: 65,
            windSpeed: '2.5',
            weatherStatus: '구름많음, 쾌적',
            weatherAdvice: `⚠️ 오류: ${errorMessage}`,
            hourlyData: [],
            message: `OpenWeatherMap API 오류로 샘플 데이터를 표시합니다. 지역: ${locationName}`
        }
    ];
}

// 날씨 코드 정의
function getWeatherCodes() {
    return {
        SKY: {
            '1': '맑음',
            '2': '구름조금', 
            '3': '구름많음',
            '4': '흐림'
        },
        PTY: {
            '0': '없음',
            '1': '비',
            '2': '비/눈',
            '3': '눈',
            '4': '소나기'
        }
    };
}
