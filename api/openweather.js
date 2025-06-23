export default async function handler(req, res) {
    const { city } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=kr`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: '날씨 정보를 가져올 수 없습니다' });
    }
} 
