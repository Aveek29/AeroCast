# AeroCast — Weather Intelligence Platform

Real-time weather, interactive radar map, Groq-powered AI travel assistant.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS, Framer Motion |
| Maps | Leaflet + OpenStreetMap (free, no API key) |
| Graphs | Recharts |
| Weather API | OpenWeather (free tier) |
| AI Chatbot | Groq API (Llama 3.3 70B, free tier) |

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Add API keys** — edit `.env` in the project root:
   ```
   NEXT_PUBLIC_WEATHER_API_KEY=your_openweather_key
   NEXT_PUBLIC_GROQ_API_KEY=your_groq_key
   ```

   - OpenWeather key (one key for everything): https://openweathermap.org/api
   - Groq key: https://console.groq.com

   The app works without keys (uses mock data + keyword fallback).

3. **Run**
   ```
   npm run dev
   ```

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/weather/current?city=Mumbai` | Current weather |
| `GET /api/weather/forecast?city=Mumbai` | 5-day forecast |
| `POST /api/ai/chat` | AI chatbot (Groq) |
| `POST /api/ai/travel-plan` | Travel planner (Groq) |
| `GET /api/health` | Health check |

## Features

- Real-time weather dashboard with 8 stat cards
- 12-hour forecast graph (temp + rain probability)
- Interactive Leaflet map with precipitation overlay
- Weather-themed UI (sunny, rainy, stormy, snowy, night)
- Geo-location auto-detect + manual locate button
- Multilingual AI assistant via Groq API
- Travel planner with day-by-day itinerary
- No Mapbox billing — fully free map stack
