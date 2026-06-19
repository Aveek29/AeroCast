import { NextRequest, NextResponse } from "next/server";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama3-70b-8192"];

export async function POST(request: NextRequest) {
  try {
    const { message, city, weather, history, lang: rawLang } = await request.json() as { message: string; city?: string; weather?: BasicWeather; history?: { role: string; content: string }[]; lang?: string };
    const lang = rawLang || "en";
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return basicReply(message, city, weather);
    }

    const langName: Record<string, string> = { en: "English", hi: "Hindi", es: "Spanish", fr: "French", de: "German", zh: "Chinese", ar: "Arabic", ja: "Japanese" };
    const temp = weather?.temperature ?? "N/A";
    const cond = weather?.condition ?? "N/A";

    const systemPrompt = `You are SkyPulse AI, a multilingual weather-intelligent travel assistant for AeroCast.

Current weather context:
- Location: ${city || "Unknown"}
- Temperature: ${temp}°C
- Condition: ${cond}

CRITICAL: Respond in ${langName[lang] || "English"}. Use the language code "${lang}" to decide.

Your role:
- ALWAYS respond with helpful weather advice. Never refuse or say you can't understand.
- If the user's message seems unclear, assume they are asking about the current weather and provide a concise update.
- Give concise, practical advice (2-4 sentences unless asked for detail)
- Suggest activities, packing tips, best times, and safety warnings based on weather
- Keep responses friendly and helpful
- For travel plans: recommend best time windows, items to carry, and risk warnings`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-6),
      { role: "user", content: message },
    ];

    let lastErr = "";
    for (const model of MODELS) {
      try {
        const res = await fetch(GROQ_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!res.ok) {
          lastErr = `Groq ${model} returned ${res.status}`;
          continue;
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || "";
        if (reply) return NextResponse.json({ success: true, reply });
      } catch (e) {
        lastErr = `Groq ${model} fetch failed: ${e}`;
      }
    }

    if (lastErr) console.error("Chatbot fallback to basicReply:", lastErr);
    return basicReply(message, city, weather);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to process chat" },
      { status: 500 }
    );
  }
}

interface BasicWeather { temperature: number; condition: string; humidity: number; windSpeed: number; uvIndex: number; rainProbability: number; }

async function basicReply(message: string, city?: string, weather?: BasicWeather) {
  const lower = message.toLowerCase();
  const temp = weather?.temperature ?? 28;
  const cond = weather?.condition ?? "Clear";
  const humid = weather?.humidity ?? 50;
  const wind = weather?.windSpeed ?? 10;
  const uv = weather?.uvIndex ?? 5;
  const rain = weather?.rainProbability ?? 20;
  let reply = "";

  if (lower.includes("umbrella") || lower.includes("rain")) {
    if (rain > 60) {
      reply = `Yes, definitely carry an umbrella! Rain probability is ${rain}% today in ${city || "your area"}. The ${cond.toLowerCase()} conditions suggest wet weather. Best to plan indoor activities.`;
    } else if (rain > 30) {
      reply = `There's a ${rain}% chance of rain today. A light umbrella or jacket wouldn't hurt, especially if you're out in the afternoon.`;
    } else {
      reply = `Low rain probability (${rain}%) today in ${city || "your area"}. No umbrella needed — enjoy the ${cond.toLowerCase()} weather!`;
    }
  } else if (lower.includes("jogging") || lower.includes("run") || lower.includes("walk") || lower.includes("outdoor")) {
    if (temp > 38) reply = "Extreme heat warning! Avoid outdoor activity between 11 AM and 4 PM. Best to exercise early morning (5-7 AM) or late evening. Stay hydrated!";
    else if (temp > 32) reply = `It's quite hot at ${temp}°C. Best for short jogs early morning or after sunset. Wear light clothing and carry water.`;
    else if (rain > 60) reply = `Rain expected (${rain}% chance) — indoor workout recommended. Try a home session or hit the gym.`;
    else if (wind > 30) reply = `Windy at ${Math.round(wind)} km/h. Outdoor jog is doable but might be challenging. Try a sheltered route or indoor option.`;
    else reply = `Perfect weather for outdoor activity! ${cond} at ${temp}°C, wind ${Math.round(wind)} km/h. Best time: 6-9 AM or 5-7 PM.`;
  } else if (lower.includes("sunscreen") || lower.includes("sunburn") || lower.includes("spf")) {
    if (uv > 7) reply = `UV index is very high (${uv})! SPF 50+ sunscreen required. Reapply every 2 hours. Wear a hat and sunglasses.`;
    else if (uv > 5) reply = `UV index is ${uv} — moderate to high. Apply SPF 30+ sunscreen and limit midday sun exposure.`;
    else reply = `UV levels are low (${uv}) today. Light sunscreen is fine if you're spending extended time outdoors.`;
  } else if (lower.includes("hello") || lower.includes("hi ") || lower.includes("hey") || lower.includes("namaste") || lower.includes("hola") || lower.includes("bonjour")) {
    reply = `Hello! I'm SkyPulse AI. Current weather in ${city || "your area"}: ${cond}, ${temp}°C. Humidity ${humid}%, wind ${Math.round(wind)} km/h, rain ${rain}%. Ask me about activities, packing tips, or travel plans!`;
  } else if (lower.includes("pack") || lower.includes("wear") || lower.includes("clothes") || lower.includes("dress")) {
    if (temp > 35) reply = `Extreme heat (${temp}°C)! Light cotton clothes, shorts, wide hat, sunscreen SPF 50, sunglasses. Avoid synthetics.`;
    else if (temp > 28) reply = `Warm weather (${temp}°C): light cotton t-shirts, shorts or skirts, sunscreen, sunglasses. A hat for sun protection.`;
    else if (temp > 20) reply = `Pleasant weather (${temp}°C): t-shirt and jeans, light jacket for evening. Comfortable walking shoes.`;
    else if (temp > 12) reply = `Cool (${temp}°C): long sleeves, jeans or trousers, light jacket or hoodie. Closed shoes recommended.`;
    else reply = `Cold (${temp}°C): warm jacket or coat, layers, scarf, closed shoes. Gloves if below 5°C.`;
    if (rain > 40) reply += ` Also pack an umbrella (${rain}% rain chance).`;
  } else if (lower.includes("today") || lower.includes("weather") || lower.includes("forecast") || /\b(?:how|what).*(?:weather|temp|climate|outside|today)\b/.test(lower)) {
    reply = `Currently in ${city || "your area"}: ${cond}, ${temp}°C. Feels like ${temp}°C. Humidity ${humid}%, wind ${Math.round(wind)} km/h, UV ${uv}, rain ${rain}%. ${rain > 50 ? "Rain expected — carry an umbrella." : "Decent weather for most plans."}`;
  } else if (lower.includes("travel") || lower.includes("trip") || lower.includes("visit") || lower.includes("plan")) {
    if (rain > 60) reply = `Travel planning in ${city || "your area"}: Rainy conditions (${rain}%) expected. Best for indoor attractions, museums, and cafes. Morning hours are usually drier.`;
    else if (temp > 35) reply = `Travel in ${city || "your area"}: Very hot (${temp}°C). Plan outdoor activities for early morning or evening. Stay in AC during midday. Hydrate often.`;
    else reply = `Travel in ${city || "your area"}: Good weather (${temp}°C, ${cond.toLowerCase()}). Great for sightseeing and outdoor activities.`;
  } else {
    reply = `I'm a weather assistant, so I can only help with weather, travel, and activity questions for ${city || "your area"}. Try: "should I carry an umbrella?", "packing tips", "best time to go out", or "plan a trip".`;
  }

  return NextResponse.json({ success: true, reply });
}
