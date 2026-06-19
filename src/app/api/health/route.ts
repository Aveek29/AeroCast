import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    groqConfigured: !!process.env.GROQ_API_KEY,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "AeroCast Weather Intelligence",
    version: "1.0.0",
  });
}
