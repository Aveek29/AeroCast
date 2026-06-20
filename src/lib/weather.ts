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

const countryBounds: { code: string; name: string; timezone: number; latMin: number; latMax: number; lonMin: number; lonMax: number }[] = [
  { code: "US", name: "United States", timezone: -18000, latMin: 24, latMax: 49, lonMin: -125, lonMax: -66 },
  { code: "CA", name: "Canada", timezone: -18000, latMin: 41, latMax: 83, lonMin: -141, lonMax: -52 },
  { code: "MX", name: "Mexico", timezone: -21600, latMin: 14, latMax: 33, lonMin: -118, lonMax: -86 },
  { code: "BR", name: "Brazil", timezone: -10800, latMin: -34, latMax: 5, lonMin: -74, lonMax: -34 },
  { code: "AR", name: "Argentina", timezone: -10800, latMin: -55, latMax: -22, lonMin: -74, lonMax: -54 },
  { code: "GB", name: "United Kingdom", timezone: 0, latMin: 49, latMax: 61, lonMin: -8, lonMax: 2 },
  { code: "IE", name: "Ireland", timezone: 0, latMin: 51, latMax: 55, lonMin: -10, lonMax: -5 },
  { code: "FR", name: "France", timezone: 3600, latMin: 41, latMax: 52, lonMin: -5, lonMax: 9 },
  { code: "ES", name: "Spain", timezone: 3600, latMin: 35, latMax: 44, lonMin: -10, lonMax: 4 },
  { code: "PT", name: "Portugal", timezone: 0, latMin: 36, latMax: 42, lonMin: -10, lonMax: -6 },
  { code: "DE", name: "Germany", timezone: 3600, latMin: 47, latMax: 55, lonMin: 5, lonMax: 15 },
  { code: "NL", name: "Netherlands", timezone: 3600, latMin: 50, latMax: 53, lonMin: 3, lonMax: 7 },
  { code: "BE", name: "Belgium", timezone: 3600, latMin: 49, latMax: 52, lonMin: 2, lonMax: 6 },
  { code: "CH", name: "Switzerland", timezone: 3600, latMin: 45, latMax: 48, lonMin: 5, lonMax: 11 },
  { code: "AT", name: "Austria", timezone: 3600, latMin: 46, latMax: 49, lonMin: 9, lonMax: 17 },
  { code: "SE", name: "Sweden", timezone: 3600, latMin: 55, latMax: 69, lonMin: 11, lonMax: 25 },
  { code: "NO", name: "Norway", timezone: 3600, latMin: 57, latMax: 71, lonMin: 4, lonMax: 31 },
  { code: "DK", name: "Denmark", timezone: 3600, latMin: 54, latMax: 58, lonMin: 8, lonMax: 15 },
  { code: "FI", name: "Finland", timezone: 7200, latMin: 59, latMax: 70, lonMin: 20, lonMax: 31 },
  { code: "PL", name: "Poland", timezone: 3600, latMin: 49, latMax: 55, lonMin: 14, lonMax: 24 },
  { code: "CZ", name: "Czech Republic", timezone: 3600, latMin: 48, latMax: 51, lonMin: 12, lonMax: 19 },
  { code: "HU", name: "Hungary", timezone: 3600, latMin: 45, latMax: 49, lonMin: 16, lonMax: 23 },
  { code: "RO", name: "Romania", timezone: 7200, latMin: 43, latMax: 48, lonMin: 20, lonMax: 30 },
  { code: "GR", name: "Greece", timezone: 7200, latMin: 34, latMax: 42, lonMin: 19, lonMax: 30 },
  { code: "IT", name: "Italy", timezone: 3600, latMin: 35, latMax: 47, lonMin: 6, lonMax: 19 },
  { code: "RU", name: "Russia", timezone: 10800, latMin: 41, latMax: 82, lonMin: 19, lonMax: 180 },
  { code: "TR", name: "Turkey", timezone: 10800, latMin: 35, latMax: 42, lonMin: 25, lonMax: 45 },
  { code: "UA", name: "Ukraine", timezone: 7200, latMin: 44, latMax: 52, lonMin: 22, lonMax: 40 },
  { code: "IN", name: "India", timezone: 19800, latMin: 6, latMax: 37, lonMin: 68, lonMax: 97 },
  { code: "CN", name: "China", timezone: 28800, latMin: 18, latMax: 54, lonMin: 73, lonMax: 135 },
  { code: "JP", name: "Japan", timezone: 32400, latMin: 30, latMax: 46, lonMin: 129, lonMax: 146 },
  { code: "KR", name: "South Korea", timezone: 32400, latMin: 33, latMax: 39, lonMin: 124, lonMax: 130 },
  { code: "TH", name: "Thailand", timezone: 25200, latMin: 5, latMax: 21, lonMin: 97, lonMax: 106 },
  { code: "VN", name: "Vietnam", timezone: 25200, latMin: 8, latMax: 24, lonMin: 102, lonMax: 110 },
  { code: "ID", name: "Indonesia", timezone: 25200, latMin: -11, latMax: 6, lonMin: 95, lonMax: 141 },
  { code: "MY", name: "Malaysia", timezone: 28800, latMin: 1, latMax: 8, lonMin: 99, lonMax: 120 },
  { code: "SG", name: "Singapore", timezone: 28800, latMin: 1, latMax: 2, lonMin: 103, lonMax: 105 },
  { code: "PH", name: "Philippines", timezone: 28800, latMin: 4, latMax: 21, lonMin: 116, lonMax: 127 },
  { code: "PK", name: "Pakistan", timezone: 18000, latMin: 23, latMax: 38, lonMin: 60, lonMax: 77 },
  { code: "BD", name: "Bangladesh", timezone: 21600, latMin: 20, latMax: 27, lonMin: 88, lonMax: 93 },
  { code: "AU", name: "Australia", timezone: 36000, latMin: -44, latMax: -10, lonMin: 112, lonMax: 155 },
  { code: "NZ", name: "New Zealand", timezone: 43200, latMin: -48, latMax: -33, lonMin: 166, lonMax: 179 },
  { code: "ZA", name: "South Africa", timezone: 7200, latMin: -35, latMax: -22, lonMin: 16, lonMax: 33 },
  { code: "EG", name: "Egypt", timezone: 7200, latMin: 22, latMax: 32, lonMin: 24, lonMax: 37 },
  { code: "NG", name: "Nigeria", timezone: 3600, latMin: 4, latMax: 14, lonMin: 2, lonMax: 15 },
  { code: "KE", name: "Kenya", timezone: 10800, latMin: -5, latMax: 5, lonMin: 33, lonMax: 42 },
  { code: "SA", name: "Saudi Arabia", timezone: 10800, latMin: 16, latMax: 32, lonMin: 34, lonMax: 56 },
  { code: "AE", name: "UAE", timezone: 14400, latMin: 22, latMax: 27, lonMin: 51, lonMax: 57 },
  { code: "IL", name: "Israel", timezone: 7200, latMin: 29, latMax: 33, lonMin: 34, lonMax: 36 },
];

function coordsToCountry(lat: number, lon: number): { code: string; name: string; timezone: number } {
  for (const c of countryBounds) {
    if (lat >= c.latMin && lat <= c.latMax && lon >= c.lonMin && lon <= c.lonMax) {
      return { code: c.code, name: c.name, timezone: c.timezone };
    }
  }
  return { code: "US", name: "United States", timezone: -18000 };
}

function generateMockCurrent(city: string, coordLat?: number, coordLon?: number): WeatherData {
  const cond = pickRandom(conditions);
  const temp = randBetween(18, 38);
  const lat = coordLat ?? hashCoord(city, 13);
  const lon = coordLon ?? hashCoord(city, 7);
  const ct = coordsToCountry(lat, lon);
  return {
    location: city,
    country: ct.code,
    timezone: ct.timezone,
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
