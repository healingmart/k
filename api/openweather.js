export default async function handler(req, res) {
    const { city } = req.query;
    // OPENWEATHER_API_KEY 환경변수에서 API 키를 가져옵니다.
    // 이 방식은 Vercel과 같은 배포 환경에서 자동으로 적용됩니다.
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    // API 키가 설정되어 있는지 확인합니다.
    if (!apiKey) {
        console.error("OPENWEATHER_API_KEY 환경변수가 설정되지 않았습니다.");
        return res.status(500).json({ error: '서버 설정 오류: API 키가 없습니다.' });
    }

    try {
        // OpenWeatherMap API 호출
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=kr`
        );
        
        // 응답 상태가 성공적인지 확인합니다.
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`OpenWeatherMap API 오류: ${response.status} - ${JSON.stringify(errorData)}`);
            // OpenWeatherMap에서 반환하는 오류 메시지를 클라이언트에 전달
            return res.status(response.status).json({ error: errorData.message || '날씨 정보를 가져올 수 없습니다.' });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("날씨 정보를 가져오는 중 오류 발생:", error);
        res.status(500).json({ error: '날씨 정보를 가져올 수 없습니다.' });
    }
}
