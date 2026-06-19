export type PerformanceTier = "high" | "mid" | "low";
export type TimePhase = "night" | "dawn" | "sunrise" | "morning" | "day" | "golden" | "sunset" | "dusk";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type ParticleType = "rain" | "snow" | "leaves" | "fog" | "dust" | "stars" | "fireflies" | "petals" | "none";

export interface AtmosphereState {
  skyGradient: string[];
  particleType: ParticleType;
  particleIntensity: number;
  windVector: { x: number; y: number };
  lightningEnabled: boolean;
  lightningFrequency: number;
  fogDensity: number;
  cssVars: Record<string, string>;
  timePhase: TimePhase;
  season: Season;
  overlayOpacity: number;
  performanceTier: PerformanceTier;
  conditionLabel: string;
  conditionIcon: string;
}

interface WeatherInput {
  temperature: number;
  condition: string;
  conditionCode: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  cloudCover?: number;
  uvIndex: number;
}

interface TimeInput {
  sunrise: string;
  sunset: string;
  now?: Date;
}

function parseTime(timeStr: string, base: Date): Date {
  const [t, mod] = timeStr.split(" ");
  const parts = t.split(":").map(Number);
  let h = parts[0];
  const m = parts[1];
  if (mod === "PM" && h !== 12) h += 12;
  if (mod === "AM" && h === 12) h = 0;
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function getTimePhase(
  now: Date,
  sunriseStr: string,
  sunsetStr: string
): TimePhase {
  const sunrise = parseTime(sunriseStr, now);
  const sunset = parseTime(sunsetStr, now);
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMinutes = h * 60 + m;

  const sunriseM = sunrise.getHours() * 60 + sunrise.getMinutes();
  const sunsetM = sunset.getHours() * 60 + sunset.getMinutes();

  if (totalMinutes < sunriseM - 60) return "night";
  if (totalMinutes < sunriseM - 15) return "dawn";
  if (totalMinutes < sunriseM + 30) return "sunrise";
  if (totalMinutes < 11 * 60) return "morning";
  if (totalMinutes < 16 * 60) return "day";
  if (totalMinutes < sunsetM - 30) return "golden";
  if (totalMinutes < sunsetM + 30) return "sunset";
  if (totalMinutes < sunsetM + 60) return "dusk";
  return "night";
}

export function getSeason(date: Date, lat: number): Season {
  const month = date.getMonth() + 1;
  const isNorth = lat >= 0;
  if (isNorth) {
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "autumn";
    return "winter";
  }
  if (month >= 3 && month <= 5) return "autumn";
  if (month >= 6 && month <= 8) return "winter";
  if (month >= 9 && month <= 11) return "spring";
  return "summer";
}

export function windDegToVector(speed: number, dir: string): { x: number; y: number } {
  const dirs: Record<string, number> = {
    N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315, "NNE": 22.5, "ENE": 67.5, "ESE": 112.5, "SSE": 157.5, "SSW": 202.5, "WSW": 247.5, "WNW": 292.5, "NNW": 337.5,
  };
  const deg = dirs[dir] ?? 0;
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * speed, y: Math.sin(rad) * speed };
}

function severityFromSpeed(speed: number): number {
  if (speed <= 5) return 0.1;
  if (speed <= 15) return 0.3;
  if (speed <= 30) return 0.5;
  if (speed <= 50) return 0.7;
  return 1.0;
}

const conditionPalettes: Record<string, { sky: string[]; accent: string; fg: string; bg: string; card: string; border: string; glow: string }> = {
  "clear-day": {
    sky: ["#3b82f6", "#60a5fa", "#bfdbfe"],
    accent: "#d97706", fg: "#1e293b", bg: "#fef9e7", card: "rgba(255,255,255,0.85)", border: "rgba(0,0,0,0.06)", glow: "rgba(217,119,6,0.18)"
  },
  "clear-night": {
    sky: ["#020617", "#0f172a", "#1e1b4b"],
    accent: "#a855f7", fg: "#f8fafc", bg: "#020617", card: "rgba(15,23,42,0.8)", border: "rgba(255,255,255,0.06)", glow: "rgba(168,85,247,0.18)"
  },
  "clear-golden": {
    sky: ["#f59e0b", "#fb923c", "#fbbf24"],
    accent: "#ea580c", fg: "#1e293b", bg: "#fff7ed", card: "rgba(255,255,255,0.85)", border: "rgba(0,0,0,0.08)", glow: "rgba(234,88,12,0.18)"
  },
  "cloudy-day": {
    sky: ["#64748b", "#94a3b8", "#cbd5e1"],
    accent: "#64748b", fg: "#f1f5f9", bg: "#334155", card: "rgba(51,65,85,0.75)", border: "rgba(255,255,255,0.07)", glow: "rgba(100,116,139,0.18)"
  },
  "cloudy-night": {
    sky: ["#0f172a", "#1e293b", "#334155"],
    accent: "#818cf8", fg: "#f8fafc", bg: "#020617", card: "rgba(15,23,42,0.8)", border: "rgba(255,255,255,0.06)", glow: "rgba(129,140,248,0.18)"
  },
  "rainy-day": {
    sky: ["#334155", "#475569", "#64748b"],
    accent: "#3b82f6", fg: "#f1f5f9", bg: "#1e293b", card: "rgba(15,23,42,0.7)", border: "rgba(255,255,255,0.07)", glow: "rgba(59,130,246,0.18)"
  },
  "rainy-night": {
    sky: ["#020617", "#0f172a", "#1e293b"],
    accent: "#60a5fa", fg: "#f8fafc", bg: "#020617", card: "rgba(15,23,42,0.8)", border: "rgba(255,255,255,0.06)", glow: "rgba(96,165,250,0.18)"
  },
  "stormy": {
    sky: ["#1e1b4b", "#312e81", "#020617"],
    accent: "#7c3aed", fg: "#e2e8f0", bg: "#0f172a", card: "rgba(0,0,0,0.65)", border: "rgba(255,255,255,0.05)", glow: "rgba(124,58,237,0.2)"
  },
  "snowy-day": {
    sky: ["#e0f2fe", "#bae6fd", "#f0f9ff"],
    accent: "#0284c7", fg: "#1e293b", bg: "#f8fafc", card: "rgba(255,255,255,0.9)", border: "rgba(0,0,0,0.05)", glow: "rgba(2,132,199,0.15)"
  },
  "snowy-night": {
    sky: ["#1e293b", "#334155", "#475569"],
    accent: "#38bdf8", fg: "#f8fafc", bg: "#0f172a", card: "rgba(30,41,59,0.8)", border: "rgba(255,255,255,0.07)", glow: "rgba(56,189,248,0.18)"
  },
  "foggy": {
    sky: ["#64748b", "#94a3b8", "#cbd5e1"],
    accent: "#94a3b8", fg: "#f1f5f9", bg: "#334155", card: "rgba(51,65,85,0.8)", border: "rgba(255,255,255,0.06)", glow: "rgba(148,163,184,0.15)"
  },
};

function getConditionGroup(code: string): string {
  const c = code.toLowerCase();
  if (c.includes("storm") || c.includes("thunder") || c.includes("lightning")) return "storm";
  if (c.includes("snow") || c.includes("ice") || c.includes("sleet")) return "snow";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "rain";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "fog";
  if (c.includes("clear") || c.includes("sunny")) return "clear";
  if (c.includes("cloud") || c.includes("overcast")) return "cloud";
  return "clear";
}

function getPaletteKey(conditionCode: string, timePhase: TimePhase): string {
  const group = getConditionGroup(conditionCode);
  const isNight = ["night", "dusk", "dawn"].includes(timePhase);
  const isGolden = timePhase === "golden";
  const isSunset = timePhase === "sunset";

  if (group === "storm") return "stormy";
  if (group === "fog") return "foggy";
  if (group === "snow") return isNight ? "snowy-night" : "snowy-day";

  if (group === "rain") return isNight ? "rainy-night" : "rainy-day";
  if (group === "cloud") return isNight ? "cloudy-night" : "cloudy-day";
  if (group === "clear") {
    if (isGolden || isSunset) return "clear-golden";
    if (isNight) return "clear-night";
    return "clear-day";
  }
  return isNight ? "clear-night" : "clear-day";
}

function getParticleType(conditionCode: string, season: Season, timePhase: TimePhase, windSpeed: number): ParticleType {
  const group = getConditionGroup(conditionCode);
  const isNight = ["night", "dusk", "dawn"].includes(timePhase);

  if (group === "rain" || group === "storm") {
    if (windSpeed > 60) return "dust";
    return "rain";
  }
  if (group === "snow") return "snow";
  if (group === "fog") return "fog";

  if (season === "spring" && group === "clear") return "petals";
  if (season === "autumn" && windSpeed > 10) return "leaves";
  if (isNight && group === "clear") return "stars";
  if (season === "summer" && isNight && group === "clear") return "fireflies";

  return "none";
}

function getIntensity(conditionCode: string, windSpeed: number, humidity: number): number {
  const group = getConditionGroup(conditionCode);
  if (group === "storm") return 0.9 + severityFromSpeed(windSpeed) * 0.1;
  if (group === "rain") return 0.3 + severityFromSpeed(windSpeed) * 0.4 + (humidity > 80 ? 0.2 : 0);
  if (group === "snow") return 0.2 + severityFromSpeed(windSpeed) * 0.3;
  if (group === "fog") return 0.3 + (humidity > 80 ? 0.4 : 0);
  if (group === "clear") return 0.1;
  return 0.1;
}

function getLightningConfig(conditionCode: string): { enabled: boolean; frequency: number } {
  const c = conditionCode.toLowerCase();
  if (c.includes("storm") || c.includes("thunder") || c.includes("lightning")) {
    return { enabled: true, frequency: 0.008 + (c.includes("severe") ? 0.015 : 0) };
  }
  return { enabled: false, frequency: 0 };
}

export function deriveAtmosphere(
  weather: WeatherInput,
  time: TimeInput,
  lat: number
): AtmosphereState {
  const now = time.now ?? new Date();
  const timePhase = getTimePhase(now, time.sunrise, time.sunset);
  const season = getSeason(now, lat);
  const paletteKey = getPaletteKey(weather.conditionCode, timePhase);
  const palette = conditionPalettes[paletteKey] ?? conditionPalettes["clear-day"];

  const wind = windDegToVector(weather.windSpeed, weather.windDirection);
  const intensity = getIntensity(weather.conditionCode, weather.windSpeed, weather.humidity);
  const particleType = getParticleType(weather.conditionCode, season, timePhase, weather.windSpeed);
  const lightning = getLightningConfig(weather.conditionCode);
  const fogDensity = getConditionGroup(weather.conditionCode) === "fog" ? 0.3 + (weather.humidity / 100) * 0.5 : 0;

  const group = getConditionGroup(weather.conditionCode);

  return {
    skyGradient: palette.sky,
    particleType,
    particleIntensity: Math.min(intensity, 1),
    windVector: wind,
    lightningEnabled: lightning.enabled,
    lightningFrequency: lightning.frequency,
    fogDensity: Math.min(fogDensity, 1),
    cssVars: {
      "--background": palette.bg,
      "--foreground": palette.fg,
      "--card-bg": palette.card,
      "--card-border": palette.border,
      "--accent": palette.accent,
      "--accent-glow": palette.glow,
      "--bg-gradient-start": palette.sky[0],
      "--bg-gradient-end": palette.sky[palette.sky.length - 1],
    },
    timePhase,
    season,
    overlayOpacity: group === "storm" ? 0.15 : group === "rain" ? 0.08 : 0,
    performanceTier: "high",
    conditionLabel: weather.condition,
    conditionIcon: weather.conditionCode,
  };
}

const conditionEmoji: Record<string, string> = {
  storm: "⛈️", thunder: "⛈️", lightning: "⚡", snow: "❄️", ice: "❄️", sleet: "🌨️",
  rain: "🌧️", drizzle: "🌦️", shower: "🌧️", fog: "🌫️", mist: "🌫️", haze: "🌫️",
  clear: "☀️", sunny: "☀️", cloud: "☁️", overcast: "☁️",
};

export function conditionToEmoji(code: string): string {
  const c = code.toLowerCase();
  for (const [key, emoji] of Object.entries(conditionEmoji)) {
    if (c.includes(key)) return emoji;
  }
  return "🌡️";
}

export function detectPerformanceTier(): PerformanceTier {
  if (typeof window === "undefined") return "high";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "low";
  const cores = navigator.hardwareConcurrency;
  if (!cores || cores >= 4) return "high";
  if (cores >= 2) return "mid";
  return "low";
}

export function getTimeEmoji(phase: TimePhase): string {
  switch (phase) {
    case "night": return "🌙";
    case "dawn": return "🌅";
    case "sunrise": return "🌄";
    case "morning": return "☀️";
    case "day": return "☀️";
    case "golden": return "🌇";
    case "sunset": return "🌆";
    case "dusk": return "🌆";
  }
}
