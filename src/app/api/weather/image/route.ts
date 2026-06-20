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

const UA = "AeroCast/1.0";

async function searchAndThumb(query: string): Promise<{ url: string; desc: string | null } | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "5",
    prop: "pageimages|pageprops",
    piprop: "thumbnail",
    pithumbsize: "600",
    format: "json",
  });
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = await res.json() as any;
  const pages = data?.query?.pages;
  if (!pages) return null;

  const sorted = Object.values(pages).sort((a: any, b: any) => a.index - b.index);
  for (const raw of sorted) {
    const p = raw as { pageprops?: { disambiguation?: string }; thumbnail?: { source?: string }; description?: string; index?: number };
    if (p.pageprops?.disambiguation) continue;
    const src = p.thumbnail?.source;
    if (!src) continue;
    return { url: src, desc: p.description || null };
  }
  return null;
}

async function summaryThumb(title: string): Promise<{ url: string; desc: string | null } | null> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(5000) }
  );
  if (!res.ok) return null;
  const data = await res.json() as any;
  if (data.type === "disambiguation") return null;
  const src: string | undefined = data?.thumbnail?.source || data?.originalimage?.source || undefined;
  if (!src) return null;
  return { url: src, desc: data.description || data.extract || null };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const country = searchParams.get("country");

  if (!city) return NextResponse.json({ imageUrl: null }, { status: 400 });

  const cacheKey = country ? `${city}|${country}` : city;
  const cached = metaCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=300", "X-Cache": "HIT" },
    });
  }

  const cityName = city.split(",")[0].trim();
  const countryName = country?.split(",")[0].trim();
  const queries = [cityName];
  if (countryName && !cityName.toLowerCase().includes(countryName.toLowerCase())) {
    queries.push(`${cityName}, ${countryName}`);
  }

  for (const q of queries) {
    const hit = await searchAndThumb(q);
    if (hit) {
      const result: CacheEntry = { imageUrl: hit.url, description: hit.desc };
      metaCache.set(cacheKey, result);
      trimCache();
      setTimeout(() => metaCache.delete(cacheKey), META_TTL);
      return NextResponse.json(result, {
        headers: { "Cache-Control": "private, max-age=300", "X-Cache": "MISS" },
      });
    }
  }

  for (const q of queries) {
    const hit = await summaryThumb(q);
    if (hit) {
      const result: CacheEntry = { imageUrl: hit.url, description: hit.desc };
      metaCache.set(cacheKey, result);
      trimCache();
      setTimeout(() => metaCache.delete(cacheKey), META_TTL);
      return NextResponse.json(result, {
        headers: { "Cache-Control": "private, max-age=300", "X-Cache": "MISS" },
      });
    }
  }

  return NextResponse.json({ imageUrl: null });
}
