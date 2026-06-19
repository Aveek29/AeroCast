"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { memo } from "react";
import { motion } from "framer-motion";
import type { HourlyForecast } from "@/lib/weather";

interface ForecastGraphProps {
  hourly: HourlyForecast[];
}

function ForecastGraph({ hourly }: ForecastGraphProps) {
  const data = hourly.slice(0, 12).map((h) => ({
    time: h.time,
    temp: Math.round(h.temperature),
    rain: h.rainProbability,
    wind: Math.round(h.windSpeed),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-lg rounded-2xl p-6 shadow-xl"
    >
      <h3 className="text-xl font-bold mb-4">12-Hour Forecast</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
          <XAxis
            dataKey="time"
            stroke="var(--foreground)"
            opacity={0.6}
            fontSize={12}
          />
          <YAxis
            yAxisId="temp"
            stroke="var(--foreground)"
            opacity={0.6}
            fontSize={12}
            unit="°C"
          />
          <YAxis
            yAxisId="rain"
            orientation="right"
            stroke="var(--foreground)"
            opacity={0.6}
            fontSize={12}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              backdropFilter: "blur(12px)",
              color: "var(--foreground)",
            }}
          />
          <Legend />
          <Area
            yAxisId="temp"
            type="monotone"
            dataKey="temp"
            stroke="var(--accent)"
            fill="url(#tempGrad)"
            strokeWidth={2}
            name="Temperature (°C)"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Area
            yAxisId="rain"
            type="monotone"
            dataKey="rain"
            stroke="#60a5fa"
            fill="url(#rainGrad)"
            strokeWidth={2}
            name="Rain Probability (%)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default memo(ForecastGraph);
