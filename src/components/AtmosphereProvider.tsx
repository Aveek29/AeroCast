"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { deriveAtmosphere, detectPerformanceTier, type AtmosphereState, type PerformanceTier } from "@/lib/atmosphere";

interface WeatherDataForAtmo {
  temperature: number;
  condition: string;
  conditionCode: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  lat: number;
}

interface AtmosphereContextType {
  atmosphere: AtmosphereState;
  updateWeather: (data: WeatherDataForAtmo) => void;
}

const defaultAtmo: AtmosphereState = {
  skyGradient: ["#0f172a", "#1e293b"],
  particleType: "none",
  particleIntensity: 0,
  windVector: { x: 0, y: 0 },
  lightningEnabled: false,
  lightningFrequency: 0,
  fogDensity: 0,
  cssVars: {
    "--background": "#0f172a",
    "--foreground": "#f1f5f9",
    "--card-bg": "rgba(30,41,59,0.75)",
    "--card-border": "rgba(255,255,255,0.08)",
    "--accent": "#38bdf8",
    "--accent-glow": "rgba(56,189,248,0.2)",
    "--bg-gradient-start": "#0f172a",
    "--bg-gradient-end": "#1e293b",
  },
  timePhase: "day",
  season: "summer",
  overlayOpacity: 0,
  performanceTier: "high",
  conditionLabel: "Loading…",
  conditionIcon: "",
};

const AtmosphereContext = createContext<AtmosphereContextType | undefined>(undefined);

export function AtmosphereProvider({ children }: { children: React.ReactNode }) {
  const [atmosphere, setAtmosphere] = useState<AtmosphereState>(defaultAtmo);
  const [tier] = useState<PerformanceTier>(() => detectPerformanceTier());

  const updateWeather = useCallback((data: WeatherDataForAtmo) => {
    const atmo = deriveAtmosphere(
      {
        temperature: data.temperature,
        condition: data.condition,
        conditionCode: data.conditionCode,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        windDirection: data.windDirection,
        uvIndex: data.uvIndex,
      },
      { sunrise: data.sunrise, sunset: data.sunset },
      data.lat
    );
    atmo.performanceTier = tier;
    setAtmosphere(atmo);
  }, [tier]);

  useEffect(() => {
    const root = document.documentElement;
    const vars = atmosphere.cssVars;
    Object.entries(vars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
    root.style.setProperty("--atmo-opacity", String(atmosphere.overlayOpacity));
  }, [atmosphere]);

  return (
    <AtmosphereContext.Provider value={{ atmosphere, updateWeather }}>
      {children}
    </AtmosphereContext.Provider>
  );
}

export function useAtmosphere() {
  const ctx = useContext(AtmosphereContext);
  if (!ctx) throw new Error("useAtmosphere must be used within AtmosphereProvider");
  return ctx;
}
