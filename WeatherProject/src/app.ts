import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "../public")));

type WeatherResp = {
  coord: { lon: number; lat: number };
  main: { temp: number };
  weather: { description: string; icon: string }[];
};

type PollutionResp = {
  list: {
    main: { aqi: number };
    components: { pm2_5: number; pm10: number };
  }[];
};

app.get("/api/weather", async (req: Request, res: Response) => {
  const city = (req.query.city as string) || "London";
  const appKey = process.env.OPENWEATHER_KEY;

  if (!appKey)
    return res.status(500).json({
      message: "Missing OPENWEATHER_KEY",
    });
  try {
    // 1. Call Weather endpoint to get temp, description, icon, and lat/lon
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${appKey}&units=metric`
    );
    const weatherData: WeatherResp = await weatherRes.json();

    // 2. Extract values from weather response
    const temp = weatherData.main.temp;
    const desc = weatherData.weather[0].description;
    const icon = weatherData.weather[0].icon;
    const { lat, lon } = weatherData.coord;

    // 3. Call Air pollution endpoint using lat and lon
    const pollutionRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${appKey}`
    );
    const pollutionData: PollutionResp = await pollutionRes.json();

    // 4. Extract air quality values
    const aqi = pollutionData.list[0].main.aqi;
    const pm25 = pollutionData.list[0].components.pm2_5;
    const pm10 = pollutionData.list[0].components.pm10;

    // 5. Return JSON in the required format
    res.json({
      city,
      temp,
      desc,
      iconUrl: `https://openweathermap.org/img/wn/${icon}@2x.png`,
      aqi,
      pm25,
      pm10,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching weather data" });
  }
});

app.listen(port, () => console.log(`http://localhost:${port}`));
