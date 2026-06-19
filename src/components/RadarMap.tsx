"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import { MapPin, Navigation, Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";

function getWeatherColor(condition?: string): string {
  const c = (condition || "").toLowerCase();
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "#3b82f6";
  if (c.includes("storm") || c.includes("thunder") || c.includes("lightning")) return "#dc2626";
  if (c.includes("snow") || c.includes("ice") || c.includes("sleet")) return "#e2e8f0";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "#94a3b8";
  if (c.includes("clear") || c.includes("sunny")) return "#d97706";
  if (c.includes("cloud")) return "#94a3b8";
  return "#38bdf8";
}

function getWeatherEmoji(condition?: string): string {
  const c = (condition || "").toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) return "🌧️";
  if (c.includes("storm") || c.includes("thunder")) return "⛈️";
  if (c.includes("snow")) return "❄️";
  if (c.includes("fog") || c.includes("mist")) return "🌫️";
  if (c.includes("clear") || c.includes("sunny")) return "☀️";
  if (c.includes("cloud")) return "☁️";
  return "🌡️";
}

function createWeatherIcon(condition?: string) {
  const color = getWeatherColor(condition);
  return L.divIcon({
    className: "weather-pin",
    html: `<div style="background:${color};width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 14px ${color}99"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const userIcon = L.divIcon({
  className: "user-dot",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 0 0 4px #22c55e66"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface RadarMapProps {
  lat: number;
  lon: number;
  city: string;
  condition?: string;
  rainProbability?: number;
  windSpeed?: number;
}

function MapController({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  const prevRef = useRef({ lat, lon });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.lat !== lat || prev.lon !== lon) {
      map.flyTo([lat, lon], map.getZoom(), { duration: 1 });
      prevRef.current = { lat, lon };
    }
  }, [lat, lon, map]);

  return null;
}

function Locator({ onLocated }: { onLocated?: (pos: [number, number]) => void }) {
  const map = useMap();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const go = useCallback(() => {
    setBusy(true);
    setFailed(false);
    map.locate({ setView: true, maxZoom: 12, enableHighAccuracy: true })
      .on("locationfound", (e) => {
        setBusy(false);
        onLocated?.([e.latlng.lat, e.latlng.lng]);
      })
      .on("locationerror", () => {
        setBusy(false);
        setFailed(true);
        setTimeout(() => setFailed(false), 3000);
      });
  }, [map, onLocated]);

  return (
    <button
      onClick={go}
      disabled={busy}
      className="absolute bottom-4 right-4 z-[1000] bg-black/60 backdrop-blur-md border border-white/15 rounded-xl p-2.5 shadow-lg hover:bg-black/80 transition-all disabled:opacity-50"
      title="Show my location"
    >
      {failed ? (
        <Crosshair className="w-5 h-5 text-red-400" />
      ) : (
        <Navigation className={`w-5 h-5 text-white ${busy ? "animate-spin" : ""}`} />
      )}
    </button>
  );
}

export default function RadarMap({
  lat, lon, city, condition = "Clear", rainProbability = 0, windSpeed = 0,
}: RadarMapProps) {
  const [ready] = useState(() => true);
  const [myPos, setMyPos] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState("");

  const geoInitRef = useRef(false);
  useEffect(() => {
    if (geoInitRef.current) return;
    geoInitRef.current = true;
    if (!navigator.geolocation) {
      setTimeout(() => setGeoError("Geo-location unavailable"), 0);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => { setMyPos([p.coords.latitude, p.coords.longitude]); setGeoError(""); },
      (err) => { setGeoError(err.code === 1 ? "Location denied" : "Location unavailable"); },
      { timeout: 5000, enableHighAccuracy: true }
    );
  }, []);

  const markerIcon = createWeatherIcon(condition);

  if (!ready) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl h-[360px] flex items-center justify-center">
        <p className="text-sm opacity-50">Loading map…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-white/10 shadow-xl relative"
    >
      <div className="absolute top-3 left-3 z-[1000] bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-white text-sm flex items-center gap-2 shadow-lg">
        <MapPin className="w-4 h-4 text-sky-400" />
        <span className="font-medium truncate max-w-[160px]">{city}</span>
        <span className="text-base ml-1">{getWeatherEmoji(condition)}</span>
      </div>

      {geoError && (
        <div className="absolute top-3 right-3 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs text-yellow-300 shadow-lg flex items-center gap-1.5">
          <Navigation className="w-3 h-3" />
          {geoError}
        </div>
      )}

      <MapContainer
        center={[lat, lon]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: 360, width: "100%" }}
        key={`map-${lat}-${lon}`}
      >
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[lat, lon]} icon={markerIcon}>
          <Popup>
            <div className="text-sm font-medium flex items-center gap-1.5">
              <span>{getWeatherEmoji(condition)}</span>
              <span>{city}</span>
            </div>
            <div className="text-xs mt-0.5 opacity-75">
              Rain {rainProbability}% · Wind {Math.round(windSpeed)} km/h
            </div>
          </Popup>
        </Marker>

        {myPos && (
          <Marker position={myPos} icon={userIcon}>
            <Popup>
              <div className="text-sm font-medium">📍 You are here</div>
              <div className="text-xs opacity-75">
                {myPos[0].toFixed(4)}, {myPos[1].toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        <MapController lat={lat} lon={lon} />
        <Locator onLocated={(p) => setMyPos(p)} />
      </MapContainer>
    </motion.div>
  );
}
