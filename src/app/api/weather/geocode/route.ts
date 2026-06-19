import { NextRequest, NextResponse } from "next/server";

const countryCapitals: Record<string, { city: string; country: string }> = {
  IT: { city: "Rome", country: "Italy" },
  FR: { city: "Paris", country: "France" },
  JP: { city: "Tokyo", country: "Japan" },
  IN: { city: "New Delhi", country: "India" },
  US: { city: "Washington D.C.", country: "United States" },
  GB: { city: "London", country: "United Kingdom" },
  DE: { city: "Berlin", country: "Germany" },
  ES: { city: "Madrid", country: "Spain" },
  PT: { city: "Lisbon", country: "Portugal" },
  NL: { city: "Amsterdam", country: "Netherlands" },
  BE: { city: "Brussels", country: "Belgium" },
  CH: { city: "Bern", country: "Switzerland" },
  AT: { city: "Vienna", country: "Austria" },
  SE: { city: "Stockholm", country: "Sweden" },
  NO: { city: "Oslo", country: "Norway" },
  DK: { city: "Copenhagen", country: "Denmark" },
  FI: { city: "Helsinki", country: "Finland" },
  PL: { city: "Warsaw", country: "Poland" },
  CZ: { city: "Prague", country: "Czech Republic" },
  HU: { city: "Budapest", country: "Hungary" },
  RO: { city: "Bucharest", country: "Romania" },
  GR: { city: "Athens", country: "Greece" },
  IE: { city: "Dublin", country: "Ireland" },
  RU: { city: "Moscow", country: "Russia" },
  CN: { city: "Beijing", country: "China" },
  KR: { city: "Seoul", country: "South Korea" },
  BR: { city: "Brasília", country: "Brazil" },
  AR: { city: "Buenos Aires", country: "Argentina" },
  MX: { city: "Mexico City", country: "Mexico" },
  CA: { city: "Ottawa", country: "Canada" },
  AU: { city: "Canberra", country: "Australia" },
  NZ: { city: "Wellington", country: "New Zealand" },
  ZA: { city: "Pretoria", country: "South Africa" },
  EG: { city: "Cairo", country: "Egypt" },
  NG: { city: "Abuja", country: "Nigeria" },
  KE: { city: "Nairobi", country: "Kenya" },
  TH: { city: "Bangkok", country: "Thailand" },
  VN: { city: "Hanoi", country: "Vietnam" },
  ID: { city: "Jakarta", country: "Indonesia" },
  MY: { city: "Kuala Lumpur", country: "Malaysia" },
  SG: { city: "Singapore", country: "Singapore" },
  PH: { city: "Manila", country: "Philippines" },
  PK: { city: "Islamabad", country: "Pakistan" },
  BD: { city: "Dhaka", country: "Bangladesh" },
  TR: { city: "Istanbul", country: "Turkey" },
  SA: { city: "Riyadh", country: "Saudi Arabia" },
  AE: { city: "Abu Dhabi", country: "UAE" },
  IL: { city: "Tel Aviv", country: "Israel" },
  UA: { city: "Kyiv", country: "Ukraine" },
};

const commonCountries: Record<string, string> = {
  italy: "IT", france: "FR", japan: "JP", india: "IN",
  germany: "DE", spain: "ES", portugal: "PT", netherlands: "NL",
  belgium: "BE", switzerland: "CH", austria: "AT", sweden: "SE",
  norway: "NO", denmark: "DK", finland: "FI", poland: "PL",
  czech: "CZ", hungary: "HU", romania: "RO", greece: "GR",
  ireland: "IE", russia: "RU", china: "CN", "south korea": "KR",
  brazil: "BR", argentina: "AR", mexico: "MX", canada: "CA",
  australia: "AU", uk: "GB", "united kingdom": "GB", usa: "US",
  "united states": "US", uae: "AE", thailand: "TH", vietnam: "VN",
  indonesia: "ID", malaysia: "MY", philippines: "PH", pakistan: "PK",
  bangladesh: "BD", turkey: "TR", "saudi arabia": "SA", egypt: "EG",
  nigeria: "NG", kenya: "KE", "new zealand": "NZ",
};

interface GeoMatch {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  displayName: string;
  isCapital: boolean;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ matches: [] });

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  if (!apiKey) return NextResponse.json({ matches: [] });

  const lower = q.toLowerCase().trim();
  const matchedCountryCode = commonCountries[lower];

  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=6&appid=${apiKey}`
    );
    if (!res.ok) return NextResponse.json({ matches: [] });

    const data = await res.json();
    let matches: GeoMatch[] = data.map((m: { name: string; country: string; state?: string; lat: number; lon: number }) => {
      const code = m.country;
      const capital = countryCapitals[code];
      const isCapital = capital !== undefined && m.name.toLowerCase() === capital.city.toLowerCase();
      return {
        name: m.name,
        country: m.country,
        state: m.state,
        lat: m.lat,
        lon: m.lon,
        displayName: [m.name, m.state, m.country].filter(Boolean).join(", "),
        isCapital,
      };
    });

    if (matchedCountryCode && countryCapitals[matchedCountryCode]) {
      const cap = countryCapitals[matchedCountryCode];
      matches = matches.filter((m) => m.country === matchedCountryCode);
      const hasCapital = matches.some((m) => m.isCapital);
      if (!hasCapital) {
        matches.unshift({
          name: cap.city,
          country: matchedCountryCode,
          lat: 0, lon: 0,
          displayName: `${cap.city}, ${cap.country}`,
          isCapital: true,
        });
      }
    }

    return NextResponse.json({ matches }, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    });
  } catch {
    return NextResponse.json({ matches: [] });
  }
}
