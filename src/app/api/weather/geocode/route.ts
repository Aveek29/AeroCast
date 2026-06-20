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
  BR: { city: "Brasilia", country: "Brazil" },
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
  TR: { city: "Ankara", country: "Turkey" },
  SA: { city: "Riyadh", country: "Saudi Arabia" },
  AE: { city: "Abu Dhabi", country: "UAE" },
  IL: { city: "Tel Aviv", country: "Israel" },
  UA: { city: "Kyiv", country: "Ukraine" },
  CO: { city: "Bogota", country: "Colombia" },
  CL: { city: "Santiago", country: "Chile" },
  PE: { city: "Lima", country: "Peru" },
  VE: { city: "Caracas", country: "Venezuela" },
  ZW: { city: "Harare", country: "Zimbabwe" },
  TZ: { city: "Dodoma", country: "Tanzania" },
  GH: { city: "Accra", country: "Ghana" },
  DZ: { city: "Algiers", country: "Algeria" },
  MA: { city: "Rabat", country: "Morocco" },
  IR: { city: "Tehran", country: "Iran" },
  IQ: { city: "Baghdad", country: "Iraq" },
  MM: { city: "Naypyidaw", country: "Myanmar" },
  NP: { city: "Kathmandu", country: "Nepal" },
  LK: { city: "Colombo", country: "Sri Lanka" },
  TW: { city: "Taipei", country: "Taiwan" },
  CU: { city: "Havana", country: "Cuba" },
  UY: { city: "Montevideo", country: "Uruguay" },
  EC: { city: "Quito", country: "Ecuador" },
  GT: { city: "Guatemala City", country: "Guatemala" },
  HR: { city: "Zagreb", country: "Croatia" },
  RS: { city: "Belgrade", country: "Serbia" },
  BG: { city: "Sofia", country: "Bulgaria" },
  SK: { city: "Bratislava", country: "Slovakia" },
  SI: { city: "Ljubljana", country: "Slovenia" },
  LT: { city: "Vilnius", country: "Lithuania" },
  LV: { city: "Riga", country: "Latvia" },
  EE: { city: "Tallinn", country: "Estonia" },
  IS: { city: "Reykjavik", country: "Iceland" },
  LU: { city: "Luxembourg", country: "Luxembourg" },
  MT: { city: "Valletta", country: "Malta" },
  CY: { city: "Nicosia", country: "Cyprus" },
  GE: { city: "Tbilisi", country: "Georgia" },
  AM: { city: "Yerevan", country: "Armenia" },
  AZ: { city: "Baku", country: "Azerbaijan" },
  KZ: { city: "Astana", country: "Kazakhstan" },
  UZ: { city: "Tashkent", country: "Uzbekistan" },
  AF: { city: "Kabul", country: "Afghanistan" },
  KH: { city: "Phnom Penh", country: "Cambodia" },
  LA: { city: "Vientiane", country: "Laos" },
  MN: { city: "Ulaanbaatar", country: "Mongolia" },
  BO: { city: "Sucre", country: "Bolivia" },
  PY: { city: "Asuncion", country: "Paraguay" },
  CR: { city: "San Jose", country: "Costa Rica" },
  PA: { city: "Panama City", country: "Panama" },
  DO: { city: "Santo Domingo", country: "Dominican Republic" },
  JM: { city: "Kingston", country: "Jamaica" },
  TT: { city: "Port of Spain", country: "Trinidad and Tobago" },
  LB: { city: "Beirut", country: "Lebanon" },
  JO: { city: "Amman", country: "Jordan" },
  KW: { city: "Kuwait City", country: "Kuwait" },
  QA: { city: "Doha", country: "Qatar" },
  OM: { city: "Muscat", country: "Oman" },
  YE: { city: "Sanaa", country: "Yemen" },
  SY: { city: "Damascus", country: "Syria" },
  KG: { city: "Bishkek", country: "Kyrgyzstan" },
  TJ: { city: "Dushanbe", country: "Tajikistan" },
  TM: { city: "Ashgabat", country: "Turkmenistan" },
  BY: { city: "Minsk", country: "Belarus" },
  MD: { city: "Chisinau", country: "Moldova" },
  BA: { city: "Sarajevo", country: "Bosnia and Herzegovina" },
  MK: { city: "Skopje", country: "North Macedonia" },
  AL: { city: "Tirana", country: "Albania" },
  ME: { city: "Podgorica", country: "Montenegro" },
  SN: { city: "Dakar", country: "Senegal" },
  CM: { city: "Yaounde", country: "Cameroon" },
  CI: { city: "Yamoussoukro", country: "Cote d'Ivoire" },
  ET: { city: "Addis Ababa", country: "Ethiopia" },
  SO: { city: "Mogadishu", country: "Somalia" },
  UG: { city: "Kampala", country: "Uganda" },
  ZM: { city: "Lusaka", country: "Zambia" },
  AO: { city: "Luanda", country: "Angola" },
  MZ: { city: "Maputo", country: "Mozambique" },
  MG: { city: "Antananarivo", country: "Madagascar" },
  SD: { city: "Khartoum", country: "Sudan" },
  TN: { city: "Tunis", country: "Tunisia" },
  LY: { city: "Tripoli", country: "Libya" },
  MR: { city: "Nouakchott", country: "Mauritania" },
  BW: { city: "Gaborone", country: "Botswana" },
  NA: { city: "Windhoek", country: "Namibia" },
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
  colombia: "CO", chile: "CL", peru: "PE", venezuela: "VE",
  cuba: "CU", "costa rica": "CR", panama: "PA", "dominican republic": "DO",
  jamaica: "JM", puerto: "PR", uruguay: "UY", ecuador: "EC",
  guatemala: "GT", bolivia: "BO", paraguay: "PY",
  croatia: "HR", serbia: "RS", bulgaria: "BG", slovakia: "SK",
  slovenia: "SI", lithuania: "LT", latvia: "LV", estonia: "EE",
  iceland: "IS", luxembourg: "LU", malta: "MT", cyprus: "CY",
  georgia: "GE", armenia: "AM", azerbaijan: "AZ", kazakhstan: "KZ",
  uzbekistan: "UZ", afghanistan: "AF", cambodia: "KH", laos: "LA",
  mongolia: "MN", nepal: "NP", "sri lanka": "LK", taiwan: "TW",
  myanmar: "MM", iran: "IR", iraq: "IQ", lebanon: "LB",
  jordan: "JO", kuwait: "KW", qatar: "QA", oman: "OM",
  yemen: "YE", syria: "SY", algeria: "DZ", morocco: "MA",
  tunisia: "TN", libya: "LY", sudan: "SD", ethiopia: "ET",
  somalia: "SO", uganda: "UG", ghana: "GH", tanzania: "TZ",
  zimbabwe: "ZW", zambia: "ZM", angola: "AO", mozambique: "MZ",
  madagascar: "MG", "south africa": "ZA", senegal: "SN",
  cameroon: "CM", "cote d'ivoire": "CI", belarus: "BY",
  moldova: "MD", bosnia: "BA", "north macedonia": "MK",
  albania: "AL", montenegro: "ME", kyrgyzstan: "KG",
  tajikistan: "TJ", turkmenistan: "TM", mauritania: "MR",
  botswana: "BW", namibia: "NA",
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

async function geocodeCity(city: string, apiKey: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: data[0].lat, lon: data[0].lon };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const isReverse = request.nextUrl.searchParams.get("reverse") === "1";
  if (!q || q.length < 2) return NextResponse.json({ matches: [] });

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  if (!apiKey) return NextResponse.json({ matches: [] });

  if (isReverse) {
    const parts = q.split(",");
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        try {
          const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
          );
          if (res.ok) {
            const data = await res.json();
            const matches = data.map((m: { name: string; country: string; state?: string; lat: number; lon: number }) => ({
              name: m.name, country: m.country, state: m.state,
              lat: m.lat, lon: m.lon,
              displayName: [m.name, m.state, m.country].filter(Boolean).join(", "),
              isCapital: false,
            }));
            return NextResponse.json({ matches });
          }
        } catch {}
      }
    }
    return NextResponse.json({ matches: [] });
  }

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
        const coords = await geocodeCity(`${cap.city},${matchedCountryCode}`, apiKey);
        matches.unshift({
          name: cap.city,
          country: matchedCountryCode,
          lat: coords?.lat ?? 0,
          lon: coords?.lon ?? 0,
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
