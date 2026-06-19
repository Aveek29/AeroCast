import { NextRequest, NextResponse } from "next/server";
import { fetchForecast, fetchForecastByCoords } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  try {
    let data;
    if (lat && lon) {
      data = await fetchForecastByCoords(parseFloat(lat), parseFloat(lon));
    } else {
      data = await fetchForecast(city || "Mumbai, India");
    }
    return NextResponse.json({ success: true, data }, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch forecast data" },
      { status: 500 }
    );
  }
}
