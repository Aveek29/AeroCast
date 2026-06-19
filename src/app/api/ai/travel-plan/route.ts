import { NextRequest, NextResponse } from "next/server";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

interface TravelRequest {
  destination: string;
  duration: number;
  startDate?: string;
  preferences?: string[];
}

export async function POST(request: NextRequest) {
  let body: TravelRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!body.destination || !body.duration) {
    return NextResponse.json(
      { success: false, error: "destination and duration are required" },
      { status: 400 }
    );
  }

  const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!groqKey) {
    const plan = generateBasicPlan(body);
    return NextResponse.json({ success: true, data: plan });
  }

  const systemPrompt = `You are a travel planning AI for AeroCast weather app.

Generate a weather-optimized travel plan for:
- Destination: ${body.destination}
- Duration: ${body.duration} days
- Preferences: ${(body.preferences || []).join(", ") || "General tourism"}

Respond in the user's language. Output valid JSON only (no markdown, no code fences) with this structure:
{
  "suitabilityScore": <0-100>,
  "summary": "<1-2 sentence summary>",
  "overallRecommendation": "<brief recommendation>",
  "dayPlans": [
    {
      "day": <number>,
      "date": "<date string>",
      "bestTimeWindow": "<best hours to go out>",
      "avoidTime": "<hours to avoid with reason>",
      "recommendation": "<weather-aware daily plan>",
      "riskWarnings": ["<warning 1>", "<warning 2>"],
      "packingTips": ["<item 1>", "<item 2>"]
    }
  ]
}

Consider typical climate for the destination, seasonal weather patterns, and general travel safety. Keep it practical and concise.`;

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Plan a ${body.duration}-day trip to ${body.destination}${body.startDate ? ` starting ${body.startDate}` : ""}. Preferences: ${(body.preferences || []).join(", ") || "General tourism"}`,
    },
  ];

  try {
    const res = await fetch(GROQ_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ success: true, data: plan });
      }
    }
  } catch {}

  const plan = generateBasicPlan(body);
  return NextResponse.json({ success: true, data: plan });
}

function generateBasicPlan(req: TravelRequest) {
  const { destination, duration, preferences } = req;
  const plans = [];

  for (let d = 0; d < duration; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const temp = Math.round(26 + Math.random() * 8 - Math.random() * 4);
    const rainProb = Math.round(Math.random() * 70 + 10);
    const isRainy = rainProb > 50;

    const risks: string[] = [];
    if (temp > 35) risks.push("High heat index – stay hydrated");
    if (rainProb > 60) risks.push("High rain probability – pack rain gear");
    if (isWeekend) risks.push("Weekend crowds expected at popular spots");

    const packing: string[] = ["Comfortable walking shoes"];
    if (temp > 30) {
      packing.push("Light cotton clothing", "Sunscreen SPF 30+", "Sunglasses & hat", "Reusable water bottle");
    } else if (temp > 20) {
      packing.push("T-shirts & jeans", "Light jacket for evening", "Umbrella");
    } else {
      packing.push("Warm jacket", "Layered clothing", "Umbrella");
    }
    if (isRainy) packing.push("Raincoat or umbrella", "Waterproof bag cover");
    if (preferences?.includes("adventure") || preferences?.includes("trekking")) {
      packing.push("Trekking shoes", "First-aid kit");
    }

    plans.push({
      day: d + 1,
      date: date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      bestTimeWindow: isRainy
        ? `${8 + Math.round(Math.random() * 2)}:00 AM – ${12 + Math.round(Math.random() * 2)}:00 PM`
        : `${7 + Math.round(Math.random() * 2)}:00 AM – ${11 + Math.round(Math.random() * 3)}:00 AM`,
      avoidTime: temp > 32
        ? "12:00 PM – 4:00 PM (peak heat)"
        : isRainy
          ? "2:00 PM – 6:00 PM (expected rain)"
          : "No major restrictions",
      recommendation: isRainy
        ? `Day ${d + 1}: Mostly cloudy with ${rainProb}% rain chance. Best for indoor activities, local cafes, and shopping.`
        : `Day ${d + 1}: Pleasant weather at ${temp}°C. Perfect for outdoor exploration and sightseeing.`,
      riskWarnings: risks,
      packingTips: packing,
    });
  }

  return {
    destination,
    duration,
    suitabilityScore: Math.round(65 + Math.random() * 30),
    summary: `Your ${duration}-day trip to ${destination} looks promising.`,
    overallRecommendation: "Travel is possible with proper preparation.",
    dayPlans: plans,
  };
}
