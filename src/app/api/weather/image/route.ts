import { NextRequest, NextResponse } from "next/server";

interface CacheEntry {
  imageUrl: string | null;
  description: string | null;
}

const metaCache = new Map<string, CacheEntry>();
const META_TTL = 1000 * 60 * 60;
const MAX_CACHE = 200;

function trimCache() {
  if (metaCache.size > MAX_CACHE) {
    const keys = [...metaCache.keys()];
    for (let i = 0; i < keys.length - MAX_CACHE; i++) metaCache.delete(keys[i]);
  }
}

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AeroCast/1.0", Referer: "https://en.wikipedia.org/" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) return NextResponse.json({ imageUrl: null }, { status: 400 });

  const cached = metaCache.get(city);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=300", "X-Cache": "HIT" },
    });
  }

  const cityName = city.split(",")[0].trim();
  const searchNames = [cityName, `${cityName} city`, `${cityName}, ${cityName.replace(/\s\(.*\)/, "")}`].filter((n, i, a) => a.indexOf(n) === i);

  async function tryPage(name: string): Promise<{ rawUrl: string; description: string | null } | null> {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
        { headers: { "User-Agent": "AeroCast/1.0" }, signal: AbortSignal.timeout(3000) }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data) return null;
      const rawUrl = data?.originalimage?.source || data?.thumbnail?.source || null;
      if (!rawUrl) return null;
      return { rawUrl, description: data?.description || data?.extract || null };
    } catch { return null; }
  }

  for (const name of searchNames) {
    const page = await tryPage(name);
    if (!page) continue;
    const dataUrl = await fetchAsBase64(page.rawUrl);
    if (!dataUrl) continue;
    const result: CacheEntry = { imageUrl: dataUrl, description: page.description };
    metaCache.set(city, result);
    trimCache();
    setTimeout(() => metaCache.delete(city), META_TTL);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=300", "X-Cache": "MISS" },
    });
  }

  if (cityName.length > 2) {
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase())}`,
        { headers: { "User-Agent": "AeroCast/1.0" }, signal: AbortSignal.timeout(3000) }
      );
      if (searchRes.ok) {
        const data = await searchRes.json();
        const rawUrl = data?.originalimage?.source || data?.thumbnail?.source || null;
        if (rawUrl) {
          const dataUrl = await fetchAsBase64(rawUrl);
          if (dataUrl) {
            const result: CacheEntry = { imageUrl: dataUrl, description: data?.description || null };
            metaCache.set(city, result);
            trimCache();
            setTimeout(() => metaCache.delete(city), META_TTL);
            return NextResponse.json(result, {
              headers: { "Cache-Control": "private, max-age=300", "X-Cache": "MISS" },
            });
          }
        }
      }
    } catch { }
  }

  return NextResponse.json({ imageUrl: null });
}
