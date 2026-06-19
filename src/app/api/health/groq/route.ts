import { NextResponse } from "next/server";

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({ configured: false, status: "GROQ_API_KEY not set" });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${groqKey}` },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ configured: true, status: "error", statusCode: res.status, body: text.slice(0, 500) });
    }

    const data = await res.json();
    const models = (data.data || []).map((m: { id: string }) => m.id);
    const hasModel = models.includes("llama-3.3-70b-versatile");

    return NextResponse.json({
      configured: true,
      status: "ok",
      modelsAvailable: models.length,
      llamaModelAvailable: hasModel,
      sampleModels: models.slice(0, 10),
    });
  } catch (e) {
    return NextResponse.json({ configured: true, status: "fetch_error", error: String(e).slice(0, 500) });
  }
}