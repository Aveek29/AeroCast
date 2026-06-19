export interface WeatherData {
  location: string;
  country: string;
  timezone: number;
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode: string;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  uvIndex: number;
  aqi: number;
  sunrise: string;
  sunset: string;
  icon: string;
  lat: number;
  lon: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  feelsLike: number;
  rainProbability: number;
  condition: string;
  windSpeed: number;
  humidity: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  rainProbability: number;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
}

export interface ForecastData {
  location: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

const conditions = [
  { code: "clear", label: "Clear Sky", icon: "sun" },
  { code: "partly-cloudy", label: "Partly Cloudy", icon: "cloud-sun" },
  { code: "cloudy", label: "Cloudy", icon: "cloud" },
  { code: "rainy", label: "Light Rain", icon: "cloud-rain" },
  { code: "stormy", label: "Thunderstorm", icon: "cloud-lightning" },
  { code: "snowy", label: "Snow", icon: "snowflake" },
  { code: "foggy", label: "Fog", icon: "cloud-fog" },
  { code: "windy", label: "Windy", icon: "wind" },
];

const windDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function randBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hashCoord(s: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h % 360) - 180;
}

function generateMockCurrent(city: string, coordLat?: number, coordLon?: number): WeatherData {
  const cond = pickRandom(conditions);
  const temp = randBetween(18, 38);
  const lat = coordLat ?? hashCoord(city, 13);
  const lon = coordLon ?? hashCoord(city, 7);
  return {
    location: city,
    country: "IN",
    timezone: 19800,
    temperature: temp,
    feelsLike: temp + randBetween(-2, 4),
    condition: cond.label,
    conditionCode: cond.code,
    humidity: Math.round(randBetween(30, 90)),
    pressure: Math.round(randBetween(1005, 1025)),
    windSpeed: randBetween(3, 35),
    windDirection: pickRandom(windDirections),
    visibility: Math.round(randBetween(5, 20)),
    uvIndex: Math.round(randBetween(1, 11)),
    aqi: Math.round(randBetween(1, 5)),
    sunrise: "06:15 AM",
    sunset: "06:45 PM",
    icon: cond.icon,
    lat,
    lon,
  };
}

function generateMockForecast(city: string): ForecastData {
  const cond = pickRandom(conditions);
  const baseTemp = randBetween(18, 35);
  const hourly: HourlyForecast[] = [];
  for (let i = 0; i < 24; i++) {
    const hour = (i + 6) % 24;
    const tempVariation = Math.sin((i / 24) * Math.PI * 2) * 6;
    const temp = Math.round((baseTemp + tempVariation) * 10) / 10;
    hourly.push({
      time: `${hour.toString().padStart(2, "0")}:00`,
      temperature: temp,
      feelsLike: temp + randBetween(-2, 3),
      rainProbability: Math.round(randBetween(0, 100)),
      condition: cond.label,
      windSpeed: randBetween(3, 25),
      humidity: Math.round(randBetween(35, 85)),
    });
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daily: DailyForecast[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    daily.push({
      date: date.toISOString().split("T")[0],
      dayName: i === 0 ? "Today" : dayNames[date.getDay()],
      tempHigh: Math.round(baseTemp + randBetween(2, 8)),
      tempLow: Math.round(baseTemp - randBetween(4, 10)),
      condition: pickRandom(conditions).label,
      rainProbability: Math.round(randBetween(0, 100)),
      windSpeed: randBetween(5, 30),
      humidity: Math.round(randBetween(35, 85)),
      uvIndex: Math.round(randBetween(1, 11)),
    });
  }

  return { location: city, hourly, daily };
}

function owConditionToCode(owId: number): string {
  if (owId >= 200 && owId < 300) return "stormy";
  if (owId >= 300 && owId < 400) return "rainy";
  if (owId >= 500 && owId < 600) return "rainy";
  if (owId >= 600 && owId < 700) return "snowy";
  if (owId >= 700 && owId < 800) return "foggy";
  if (owId === 800) return "clear";
  if (owId === 801) return "partly-cloudy";
  return "cloudy";
}

function owIdToLabel(owId: number): string {
  if (owId >= 200 && owId < 300) return "Thunderstorm";
  if (owId >= 300 && owId < 400) return "Drizzle";
  if (owId >= 500 && owId < 600) return "Rain";
  if (owId >= 600 && owId < 700) return "Snow";
  if (owId >= 700 && owId < 800) return "Foggy";
  if (owId === 800) return "Clear Sky";
  if (owId === 801) return "Partly Cloudy";
  if (owId === 802) return "Cloudy";
  return "Overcast";
}

function formatTimeWithOffset(epochSeconds: number, offsetSeconds: number): string {
  const d = new Date((epochSeconds + offsetSeconds) * 1000);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

async function fetchAQI(lat: number, lon: number): Promise<number> {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  if (!apiKey) return -1;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    if (!res.ok) return -1;
    const data = await res.json();
    return data.list?.[0]?.main?.aqi ?? -1;
  } catch {
    return -1;
  }
}

async function fetchUV(lat: number, lon: number): Promise<number> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&timezone=auto`
    );
    if (!res.ok) return -1;
    const data = await res.json();
    return data.daily?.uv_index_max?.[0] ?? -1;
  } catch {
    return -1;
  }
}

export async function fetchCurrentWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      if (res.ok) {
        const data = await res.json();
        const [aqi, uv] = await Promise.all([fetchAQI(lat, lon), fetchUV(lat, lon)]);
        return {
          location: `${data.name}, ${data.sys.country}`,
          country: data.sys.country,
          timezone: data.timezone,
          temperature: data.main.temp,
          feelsLike: data.main.feels_like,
          condition: owIdToLabel(data.weather[0].id),
          conditionCode: owConditionToCode(data.weather[0].id),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed * 3.6,
          windDirection: windDirections[Math.round((data.wind.deg || 0) / 45) % 8],
          visibility: (data.visibility || 10000) / 1000,
          uvIndex: uv,
          aqi,
          sunrise: formatTimeWithOffset(data.sys.sunrise, data.timezone),
          sunset: formatTimeWithOffset(data.sys.sunset, data.timezone),
          icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
          lat: data.coord.lat,
          lon: data.coord.lon,
        };
      }
    } catch {}
  }
  return generateMockCurrent(`${lat}, ${lon}`, lat, lon);
}

export async function fetchCurrentWeather(city: string): Promise<WeatherData> {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
      );
      if (res.ok) {
        const data = await res.json();
        const [aqi, uv] = await Promise.all([fetchAQI(data.coord.lat, data.coord.lon), fetchUV(data.coord.lat, data.coord.lon)]);
        return {
          location: `${data.name}, ${data.sys.country}`,
          country: data.sys.country,
          timezone: data.timezone,
          temperature: data.main.temp,
          feelsLike: data.main.feels_like,
          condition: owIdToLabel(data.weather[0].id),
          conditionCode: owConditionToCode(data.weather[0].id),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed * 3.6,
          windDirection: windDirections[Math.round((data.wind.deg || 0) / 45) % 8],
          visibility: (data.visibility || 10000) / 1000,
          uvIndex: uv,
          aqi,
          sunrise: formatTimeWithOffset(data.sys.sunrise, data.timezone),
          sunset: formatTimeWithOffset(data.sys.sunset, data.timezone),
          icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
          lat: data.coord.lat,
          lon: data.coord.lon,
        };
      }
    } catch {}
  }
  return generateMockCurrent(city);
}

export async function fetchForecastByCoords(lat: number, lon: number): Promise<ForecastData> {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      if (res.ok) {
        const data = await res.json();
        const hourly: HourlyForecast[] = data.list
          .slice(0, 24)
            .map((h: { dt_txt: string; main: { temp: number; feels_like: number; humidity: number }; pop: number; weather: { id: number }[]; wind: { speed: number } }) => ({
            time: h.dt_txt.split(" ")[1].slice(0, 5),
            temperature: h.main.temp,
            feelsLike: h.main.feels_like,
            rainProbability: Math.round(h.pop * 100),
            condition: owIdToLabel(h.weather[0].id),
            windSpeed: h.wind.speed * 3.6,
            humidity: h.main.humidity,
          }));
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dailyMap = new Map<string, DailyForecast>();
        for (const item of data.list) {
          const dateStr = item.dt_txt.split(" ")[0];
          if (!dailyMap.has(dateStr)) {
            const dateObj = new Date(dateStr);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            dailyMap.set(dateStr, {
              date: dateStr, dayName: isToday ? "Today" : dayNames[dateObj.getDay()],
              tempHigh: item.main.temp, tempLow: item.main.temp,
              condition: owIdToLabel(item.weather[0].id),
              rainProbability: Math.round(item.pop * 100),
              windSpeed: item.wind.speed * 3.6, humidity: item.main.humidity, uvIndex: 5,
            });
          } else {
            const d = dailyMap.get(dateStr)!;
            d.tempHigh = Math.max(d.tempHigh, item.main.temp);
            d.tempLow = Math.min(d.tempLow, item.main.temp);
            d.rainProbability = Math.max(d.rainProbability, Math.round(item.pop * 100));
            d.windSpeed = Math.max(d.windSpeed, item.wind.speed * 3.6);
          }
        }
        return { location: `${data.city.name}, ${data.city.country}`, hourly, daily: Array.from(dailyMap.values()).slice(0, 7) };
      }
    } catch {}
  }
  return generateMockForecast(`${lat}, ${lon}`);
}

export async function fetchForecast(city: string): Promise<ForecastData> {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
      );
      if (res.ok) {
        const data = await res.json();
        const hourly: HourlyForecast[] = data.list
          .slice(0, 24)
          .map((h: { dt_txt: string; main: { temp: number; feels_like: number; humidity: number }; pop: number; weather: { id: number; description: string }[]; wind: { speed: number } }) => ({
            time: h.dt_txt.split(" ")[1].slice(0, 5),
            temperature: h.main.temp,
            feelsLike: h.main.feels_like,
            rainProbability: Math.round(h.pop * 100),
            condition: owIdToLabel(h.weather[0].id),
            windSpeed: h.wind.speed * 3.6,
            humidity: h.main.humidity,
          }));

        const dailyMap = new Map<string, DailyForecast>();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        for (const item of data.list) {
          const dateStr = item.dt_txt.split(" ")[0];
          if (!dailyMap.has(dateStr)) {
            const dateObj = new Date(dateStr);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            dailyMap.set(dateStr, {
              date: dateStr,
              dayName: isToday ? "Today" : dayNames[dateObj.getDay()],
              tempHigh: item.main.temp,
              tempLow: item.main.temp,
              condition: owIdToLabel(item.weather[0].id),
              rainProbability: Math.round(item.pop * 100),
              windSpeed: item.wind.speed * 3.6,
              humidity: item.main.humidity,
              uvIndex: 5,
            });
          } else {
            const d = dailyMap.get(dateStr)!;
            d.tempHigh = Math.max(d.tempHigh, item.main.temp);
            d.tempLow = Math.min(d.tempLow, item.main.temp);
            d.rainProbability = Math.max(d.rainProbability, Math.round(item.pop * 100));
            d.windSpeed = Math.max(d.windSpeed, item.wind.speed * 3.6);
          }
        }

        return {
          location: `${data.city.name}, ${data.city.country}`,
          hourly,
          daily: Array.from(dailyMap.values()).slice(0, 7),
        };
      }
    } catch {}
  }
  return generateMockForecast(city);
}
