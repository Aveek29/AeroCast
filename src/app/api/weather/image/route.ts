import { NextRequest, NextResponse } from "next/server";

const metaCache = new Map<string, { imageUrl: string | null; description: string | null }>();
const META_TTL = 1000 * 60 * 60;
const MAX_CACHE = 200;

function trimCache() {
  if (metaCache.size > MAX_CACHE) {
    const keys = [...metaCache.keys()];
    for (let i = 0; i < keys.length - MAX_CACHE; i++) metaCache.delete(keys[i]);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const mode = searchParams.get("mode");

  if (!city) return NextResponse.json({ imageUrl: null }, { status: 400 });

  if (mode === "proxy" && searchParams.has("url")) {
    const imgUrl = searchParams.get("url")!;
    try {
      const imgRes = await fetch(imgUrl, {
        headers: { "User-Agent": "AeroCast/1.0", Referer: "https://en.wikipedia.org/" },
        signal: AbortSignal.timeout(6000),
      });
      if (!imgRes.ok) return new NextResponse(null, { status: imgRes.status });
      const blob = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      return new NextResponse(blob, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      return new NextResponse(null, { status: 502 });
    }
  }

  const cached = metaCache.get(city);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=300", "X-Cache": "HIT" },
    });
  }

  const cityName = city.split(",")[0].trim();
  const searchNames = [cityName, `${cityName} city`, cityName.replace(/\s\(.*\)/, "")].filter((n, i, a) => a.indexOf(n) === i);
  const origin = request.nextUrl.origin;

  for (const name of searchNames) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
        { headers: { "User-Agent": "AeroCast/1.0" }, signal: AbortSignal.timeout(3000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (!data) continue;
      const rawUrl = data?.originalimage?.source || data?.thumbnail?.source || null;
      if (rawUrl) {
        const proxyUrl = `${origin}/api/weather/image?city=${encodeURIComponent(city)}&mode=proxy&url=${encodeURIComponent(rawUrl)}`;
        const description = data?.description || data?.extract || null;
        const result = { imageUrl: proxyUrl, description };
        metaCache.set(city, result);
        trimCache();
        setTimeout(() => metaCache.delete(city), META_TTL);
        return NextResponse.json(result, {
          headers: { "Cache-Control": "private, max-age=300", "X-Cache": "MISS" },
        });
      }
    } catch { }
  }

  return NextResponse.json({ imageUrl: null });
}
