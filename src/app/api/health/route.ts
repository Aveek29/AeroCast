import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    groqConfigured: !!process.env.NEXT_PUBLIC_GROQ_API_KEY,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "AeroCast Weather Intelligence",
    version: "1.0.1",
    nodeEnv: process.env.NODE_ENV,
  });
}
