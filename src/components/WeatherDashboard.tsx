"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudRain, Wind, Droplets, Thermometer, Eye, Sun, Moon, Gauge,
  AlertTriangle, CloudSun, Cloud, Snowflake, CloudLightning, Search, MapPin, Clock,
  Loader2, Navigation, Check,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useAtmosphere } from "./AtmosphereProvider";
import type { WeatherData, ForecastData } from "@/lib/weather";
import type { LucideProps } from "lucide-react";

const RadarMap = dynamic(() => import("./RadarMap"), { ssr: false });
const Chatbot = dynamic(() => import("./Chatbot"), { ssr: false });
const ForecastGraph = dynamic(() => import("./ForecastGraph"), { ssr: false });

interface Suggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  displayName: string;
  isCapital: boolean;
}

interface StatTile {
  icon: React.ComponentType<LucideProps>;
  label: string;
  value: string;
  sub?: string;
  cls?: string;
}

function conditionIcon(condition?: string) {
  const c = (condition || "").toLowerCase();
  if (c.includes("storm") || c.includes("thunder")) return CloudLightning;
  if (c.includes("snow") || c.includes("ice")) return Snowflake;
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return CloudRain;
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return CloudRain;
  if (c.includes("clear") || c.includes("sunny")) return Sun;
  if (c.includes("cloud") && condition?.toLowerCase().includes("partly")) return CloudSun;
  if (c.includes("cloud")) return Cloud;
  return CloudSun;
}

function formatOffset(offsetSec: number): string {
  const sign = offsetSec >= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offsetSec) / 3600);
  const mins = Math.floor((Math.abs(offsetSec) % 3600) / 60);
  return `UTC${sign}${hours}${mins ? `:${String(mins).padStart(2, "0")}` : ""}`;
}

function displayLocalTime(offset: number): string {
  const utc = new Date();
  const local = new Date(utc.getTime() + offset * 1000);
  return local.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" });
}

function toCountryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(code.codePointAt(0)! - 65 + 127462, code.codePointAt(1)! - 65 + 127462);
}

function renderIcon(condition: string | undefined, className: string) {
  const Comp = conditionIcon(condition);
  return <Comp className={className} />;
}

export default function WeatherDashboard() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [cityImage, setCityImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const { updateWeather } = useAtmosphere();
  const topRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<string, string>>(new Map());
  const searchRef = useRef<HTMLDivElement>(null);
  const geoCache = useRef<Map<string, Suggestion[]>>(new Map());

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchCityImage = useCallback(async (city: string) => {
    if (!city) return;
    const cached = imageCache.current.get(city);
    if (cached) { setCityImage(cached); return; }
    setImageLoading(true);
    try {
      const res = await fetch(`/api/weather/image?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      if (data.imageUrl) {
        imageCache.current.set(city, data.imageUrl);
        setCityImage(data.imageUrl);
      } else {
        setCityImage(null);
      }
    } catch { setCityImage(null); }
    finally { setImageLoading(false); }
  }, []);

  const fetchByCoords = useCallback(async (lat: number, lon: number, label?: string) => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    setShowSuggestions(false);
    try {
      const [wr, fr] = await Promise.all([
        fetch(`/api/weather/current?lat=${lat}&lon=${lon}`),
        fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`),
      ]);
      const w = await wr.json();
      const f = await fr.json();
      if (w.success) {
        const cityName = label ? label.split(",")[0].trim() : null;
        const weatherData = cityName ? { ...w.data, location: `${cityName}, ${w.data.country}` } : w.data;
        setWeather(weatherData);
        updateWeather(weatherData);
        fetchCityImage(cityName || weatherData.location || `${lat},${lon}`);
      } else setError(w.error || "Could not load weather");
      if (f.success) setForecast(f.data);
    } catch { setError("Failed to fetch weather"); }
    finally { setLoading(false); }
  }, [updateWeather, fetchCityImage]);

  const fetchData = useCallback(async (c: string) => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    setShowSuggestions(false);
    try {
      const [wr, fr] = await Promise.all([
        fetch(`/api/weather/current?city=${encodeURIComponent(c)}`),
        fetch(`/api/weather/forecast?city=${encodeURIComponent(c)}`),
      ]);
      const w = await wr.json();
      const f = await fr.json();
      if (w.success) { setWeather(w.data); updateWeather(w.data); fetchCityImage(c); }
      else setError(w.error || "Could not load weather");
      if (f.success) setForecast(f.data);
    } catch { setError("Failed to fetch weather"); }
    finally { setLoading(false); }
  }, [updateWeather, fetchCityImage]);

  const geocode = useCallback(async (q: string): Promise<Suggestion[]> => {
    const cached = geoCache.current.get(q.toLowerCase().trim());
    if (cached) return cached;
    try {
      const res = await fetch(`/api/weather/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.matches?.length) {
        geoCache.current.set(q.toLowerCase().trim(), data.matches);
      }
      return data.matches || [];
    } catch { return []; }
  }, []);

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchData("Mumbai, India");
  }, [fetchData]);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setGeocoding(true);
    const matches = await geocode(q);
    setGeocoding(false);
    if (matches.length === 0) {
      fetchData(q);
    } else if (matches.length === 1) {
      const m = matches[0];
      if (m.lat && m.lon) {
        fetchByCoords(m.lat, m.lon, m.displayName);
      } else {
        fetchData(`${m.name}, ${m.country}`);
      }
    } else {
      const exact = matches.find((m) => m.name.toLowerCase() === q.toLowerCase() || m.displayName.toLowerCase() === q.toLowerCase());
      const capital = matches.find((m) => m.isCapital);
      if (exact && (exact.lat || exact.lon)) {
        if (exact.lat) { fetchByCoords(exact.lat, exact.lon, exact.displayName); } else { fetchData(exact.displayName); }
      } else if (capital && (capital.lat || capital.lon)) {
        if (capital.lat) { fetchByCoords(capital.lat, capital.lon, capital.displayName); } else { fetchData(capital.displayName); }
      } else {
        setSuggestions(matches);
        setShowSuggestions(true);
      }
    }
  }, [query, geocode, fetchByCoords, fetchData]);

  const selectSuggestion = useCallback((m: Suggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setQuery(m.displayName);
    if (m.lat && m.lon) {
      fetchByCoords(m.lat, m.lon, m.displayName);
    } else {
      fetchData(`${m.name}, ${m.country}`);
    }
  }, [fetchByCoords, fetchData]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) { setError("Geo-location not available on this device"); return; }
    setError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        fetchByCoords(p.coords.latitude, p.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setError(err.code === 1
          ? "Location blocked. Click the lock icon (🔒) in the address bar and enable Location."
          : "Could not detect location. Try again.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [fetchByCoords]);

  const localTime = useMemo(() => weather ? displayLocalTime(weather.timezone) : "", [weather]);

  const statTiles = useMemo(() => weather ? [
    { icon: Wind, label: "Wind", value: `${Math.round(weather.windSpeed)} km/h`, sub: weather.windDirection } as StatTile,
    { icon: Droplets, label: "Humidity", value: `${weather.humidity}%` } as StatTile,
    { icon: Thermometer, label: "Pressure", value: `${weather.pressure} hPa` } as StatTile,
    { icon: Eye, label: "Visibility", value: `${weather.visibility} km` } as StatTile,
    { icon: Sun, label: "UV", value: `${weather.uvIndex}`, cls: (weather.uvIndex ?? 0) > 6 ? "text-orange-400" : (weather.uvIndex ?? 0) > 3 ? "text-yellow-400" : "" } as StatTile,
    { icon: Gauge, label: "AQI", value: `${weather.aqi}`, cls: (weather.aqi ?? 0) > 100 ? "text-red-400" : (weather.aqi ?? 0) > 50 ? "text-yellow-400" : "text-emerald-400" } as StatTile,
    { icon: Sun, label: "Sunrise", value: weather.sunrise } as StatTile,
    { icon: Moon, label: "Sunset", value: weather.sunset } as StatTile,
  ] : [], [weather]);

  const handleErrorDismiss = useCallback(() => setError(""), []);

  return (
    <div ref={topRef} className="space-y-5">
      <div className="h-0.5 relative overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="absolute inset-0 bg-[var(--accent)]"
          animate={{ x: loading ? ["-100%", "100%"] : "100%" }}
          transition={{ repeat: loading ? Infinity : 0, duration: 1.5, ease: "linear" }}
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={handleErrorDismiss} className="text-xs opacity-50 hover:opacity-100 shrink-0">✕</button>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <MapPin className="w-7 h-7 text-[var(--accent)] shrink-0" />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight truncate max-w-[200px] sm:max-w-none">
              {weather?.location || "Mumbai, India"}
            </h1>
            <div className="flex items-center gap-2 text-sm mt-0.5 flex-wrap min-h-[24px]">
              <span className="flex items-center gap-1.5 shrink-0 opacity-90 font-medium">
                {renderIcon(weather?.condition, "w-4 h-4")}
                {weather ? `${Math.round(weather.temperature)}°C · ${weather.condition}` : "Loading..."}
              </span>
              {weather?.country && (
                <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-xs">
                  {toCountryFlag(weather.country)} {weather.country}
                </span>
              )}
              {localTime && (
                <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-xs">
                  <Clock className="w-3 h-3" />{localTime} {weather?.timezone ? formatOffset(weather.timezone) : ""}
                </span>
              )}
              {weather && (
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-xs font-mono opacity-60">
                  {weather.lat.toFixed(2)}°N, {weather.lon.toFixed(2)}°E
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
          <button type="button" onClick={handleMyLocation} disabled={locating}
            className="bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto"
            title="Detect my location">
            <Navigation className={`w-3.5 h-3.5 ${locating ? "animate-spin" : ""}`} />
            {locating ? "Locating…" : "My Location"}
          </button>
          <div ref={searchRef} className="relative w-full sm:w-auto">
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="City or country…"
                  className="w-full sm:w-44 bg-white/10 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm outline-none backdrop-blur-sm focus:border-[var(--accent)] transition-colors placeholder:text-white/30" />
              </div>
              <button type="submit" disabled={loading || geocoding}
                className="bg-[var(--accent)] text-white px-4 py-2 rounded-full text-sm font-medium hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-glow)] disabled:opacity-60 flex items-center gap-1.5">
                {(loading || geocoding) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Search
              </button>
            </form>
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-1 left-0 right-0 sm:right-auto sm:w-72 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-30">
                  {suggestions.map((m, i) => (
                    <button key={`${m.displayName}-${i}`} type="button" onClick={() => selectSuggestion(m)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                      <MapPin className="w-4 h-4 shrink-0 text-[var(--accent)]" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium block truncate">{m.name}</span>
                        <span className="text-[11px] opacity-50 flex items-center gap-1.5">
                          {toCountryFlag(m.country)} {m.country}{m.state ? ` · ${m.state}` : ""}
                          {m.isCapital && <span className="text-yellow-400/70 text-[10px]">★ Capital</span>}
                        </span>
                      </div>
                      <Check className="w-3.5 h-3.5 shrink-0 opacity-30" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 min-h-[300px] lg:min-h-[520px]">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-4 md:p-6 flex flex-row items-center justify-between relative overflow-hidden min-h-[120px] sm:min-h-[150px]">
            {cityImage && !imageLoading && (
              <img src={cityImage} alt="" className="absolute inset-0 w-full h-full object-cover"
                onError={() => setCityImage(null)} />
            )}
            {cityImage && !imageLoading && <div className="absolute inset-0 bg-gradient-to-r from-[var(--card-bg)]/95 via-[var(--card-bg)]/60 to-[var(--card-bg)]/30" />}
            <div className="glow-line" />
            <div className="relative z-10 text-center sm:text-left">
              <span className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none">
                {Math.round(weather?.temperature ?? 0)}°
              </span>
              <p className="text-xs sm:text-base opacity-90 mt-0.5 sm:mt-1 min-h-[18px] sm:min-h-[24px]">
                {weather ? `Feels like ${Math.round(weather.feelsLike)}°` : ""}
              </p>
            </div>
            <div className="relative z-10 text-center">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}>
                {renderIcon(weather?.condition, "w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]")}
              </motion.div>
              <p className="text-[10px] sm:text-sm font-medium mt-0.5 sm:mt-1 text-white/90 min-h-[14px] sm:min-h-[20px]">
                {weather?.condition ?? ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-2.5">
            {statTiles.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="stat-tile p-3 md:p-4 min-h-[96px] md:min-h-[112px]">
                <s.icon className={`w-5 h-5 md:w-6 md:h-6 ${s.cls || "text-[var(--accent)]"}`} />
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider opacity-50 font-medium mt-1">{s.label}</span>
                <span className="font-semibold text-xs md:text-sm mt-0.5">{s.value}</span>
                {s.sub && <span className="text-[9px] md:text-[10px] opacity-40 -mt-0.5">{s.sub}</span>}
              </motion.div>
            ))}
          </div>

          <div className="min-h-[100px]">
            {forecast?.hourly ? <ForecastGraph hourly={forecast.hourly} /> : <div className="h-[100px] flex items-center justify-center text-xs opacity-30">Loading forecast data...</div>}
          </div>
        </div>

        <div className="flex flex-col">
          <Chatbot city={weather?.location || "Mumbai, India"} weather={weather ?? undefined} rainProbability={forecast?.hourly?.[0]?.rainProbability} />
        </div>
      </div>

      <RadarMap lat={weather?.lat ?? 19.076} lon={weather?.lon ?? 72.8777} city={weather?.location || "Mumbai, India"} condition={weather?.condition} rainProbability={forecast?.hourly?.[0]?.rainProbability} windSpeed={weather?.windSpeed} />
    </div>
  );
}