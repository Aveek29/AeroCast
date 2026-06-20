const BASE = "http://localhost:3000";

async function httpGet(url) {
  const res = await fetch(url);
  const data = await res.json();
  return { status: res.status, data };
}

const CITY_COUNTRY_MAP = {
  "Tokyo": "JP", "Delhi": "IN", "Shanghai": "CN", "Sao Paulo": "BR",
  "Mumbai": "IN", "Beijing": "CN", "Cairo": "EG", "Dhaka": "BD",
  "Osaka": "JP", "New York": "US", "Karachi": "PK", "Buenos Aires": "AR",
  "Istanbul": "TR", "Kolkata": "IN", "Manila": "PH", "Lagos": "NG",
  "Rio de Janeiro": "BR", "Tianjin": "CN", "Kinshasa": "CD",
  "Guangzhou": "CN", "Los Angeles": "US", "Moscow": "RU",
  "Shenzhen": "CN", "Lahore": "PK", "Bangalore": "IN",
  "Paris": "FR", "Bogota": "CO", "Jakarta": "ID",
  "Chennai": "IN", "Lima": "PE", "Bangkok": "TH",
  "Seoul": "KR", "Nagoya": "JP", "Hyderabad": "IN",
  "London": "GB", "Tehran": "IR", "Chicago": "US",
  "Chengdu": "CN", "Nanjing": "CN", "Wuhan": "CN",
  "Ho Chi Minh City": "VN", "Luanda": "AO", "Ahmedabad": "IN",
  "Kuala Lumpur": "MY", "Hong Kong": "HK", "Berlin": "DE",
  "Madrid": "ES", "Riyadh": "SA", "Baghdad": "IQ",
  "Singapore": "SG", "Toronto": "CA", "Sydney": "AU",
  "Rome": "IT", "Mexico City": "MX", "Nairobi": "KE",
  "Cape Town": "ZA", "Dubai": "AE", "Vienna": "AT",
  "Stockholm": "SE", "Athens": "GR", "Lisbon": "PT",
  "Warsaw": "PL", "Prague": "CZ", "Budapest": "HU",
};

const TEST_COUNTRIES = [
  "Germany", "France", "Japan", "India", "United States",
  "United Kingdom", "Brazil", "Canada", "Australia", "South Africa",
  "Egypt", "Nigeria", "Thailand", "Turkey", "Russia",
];

let passed = 0;
let failed = 0;
let errors = [];

function check(ok, msg, detail) {
  if (ok) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    errors.push(`${msg}: ${detail}`);
    console.log(`  FAIL: ${msg} => ${detail}`);
  }
}

function isInBounds(v, min, max, label) {
  if (v === undefined || v === null) return `${label} is undefined`;
  if (v < min || v > max) return `${label} ${v} out of bounds [${min},${max}]`;
  return null;
}

async function testCity(search, expectedCC) {
  console.log(`\n--- ${search} ---`);

  // 1. Geocode
  let geo;
  try {
    const r = await httpGet(`${BASE}/api/weather/geocode?q=${encodeURIComponent(search)}`);
    geo = r.data;
    if (!r.data || !r.data.matches || r.data.matches.length === 0) {
      check(false, "geocode", `No matches for "${search}"`);
      return;
    }
    check(true, `geocode returned ${r.data.matches.length} match(es)`);
  } catch (e) {
    check(false, "geocode", `HTTP error: ${e.message}`);
    return;
  }

  const top = geo.matches[0];

  // 2. Check coordinates are NOT 0,0
  if (top.lat === 0 && top.lon === 0) {
    check(false, "coords not (0,0)", `${top.name} has (0, 0) coordinates`);
  } else {
    check(true, `coords (${top.lat.toFixed(2)}, ${top.lon.toFixed(2)})`);
  }

  // 3. Check coordinate bounds
  let latErr = isInBounds(top.lat, -90, 90, "lat");
  let lonErr = isInBounds(top.lon, -180, 180, "lon");
  if (latErr || lonErr) {
    check(false, "coord bounds", [latErr, lonErr].filter(Boolean).join(", "));
  } else {
    check(true, "coord in bounds");
  }

  // 4. Check displayName is non-empty
  if (!top.displayName) {
    check(false, "displayName", "empty");
  } else {
    check(true, `displayName: "${top.displayName}"`);
  }

  // 5. Country code check
  const cc = top.country;
  if (expectedCC && cc !== expectedCC) {
    check(false, "country code", `expected ${expectedCC}, got ${cc}`);
  } else if (cc.length !== 2) {
    check(false, "country code format", `"${cc}" not a 2-letter code`);
  } else {
    check(true, `country: ${cc}`);
  }

  // 6. Current weather
  try {
    const wr = await httpGet(`${BASE}/api/weather/current?lat=${top.lat}&lon=${top.lon}`);
    if (!wr.data || !wr.data.success) {
      check(false, "current weather", wr.data?.error || "API error");
    } else {
      const w = wr.data.data;
      let okW = true;
      let errW = [];

      // country matches geocode
      if (w.country !== cc) {
        okW = false;
        errW.push(`country mismatch: geocode=${cc}, weather=${w.country}`);
      }
      if (w.country === "IN" && cc !== "IN") {
        okW = false;
        errW.push(`country stuck at IN (mock data) — expected ${cc}`);
      }
      // temp & feelsLike
      let tErr = isInBounds(w.temperature, -50, 60, "temp");
      let fErr = isInBounds(w.feelsLike, -50, 60, "feelsLike");
      if (tErr) { okW = false; errW.push(tErr); }
      if (fErr) { okW = false; errW.push(fErr); }

      // humidity, pressure
      if (w.humidity !== undefined && (w.humidity < 0 || w.humidity > 100)) {
        okW = false; errW.push(`humidity ${w.humidity} out of range`);
      }
      if (w.pressure !== undefined && (w.pressure < 800 || w.pressure > 1100)) {
        okW = false; errW.push(`pressure ${w.pressure} out of range`);
      }

      // sunrise/sunset format
      if (w.sunrise && !/^\d{2}:\d{2}/.test(w.sunrise)) {
        okW = false; errW.push(`sunrise format: "${w.sunrise}"`);
      }
      if (w.sunset && !/^\d{2}:\d{2}/.test(w.sunset)) {
        okW = false; errW.push(`sunset format: "${w.sunset}"`);
      }

      // conditionCode is valid
      const validCodes = ["clear","partly-cloudy","cloudy","rainy","stormy","snowy","foggy","windy"];
      if (!validCodes.includes(w.conditionCode)) {
        okW = false; errW.push(`conditionCode: "${w.conditionCode}"`);
      }

      check(okW, "current weather", errW.join("; "));
    }
  } catch (e) {
    check(false, "current weather HTTP", e.message);
  }

  // 7. Forecast
  try {
    const fr = await httpGet(`${BASE}/api/weather/forecast?lat=${top.lat}&lon=${top.lon}`);
    if (!fr.data || !fr.data.success) {
      check(false, "forecast", fr.data?.error || "API error");
    } else {
      const f = fr.data.data;
      let okF = true;
      let errF = [];

      if (!f.hourly || f.hourly.length === 0) {
        okF = false; errF.push("no hourly data");
      }
      if (!f.daily || f.daily.length === 0) {
        okF = false; errF.push("no daily data");
      }
      if (f.hourly && f.hourly.length > 0) {
        const h = f.hourly[0];
        let htErr = isInBounds(h.temperature, -50, 60, "hourly.temp");
        if (htErr) { okF = false; errF.push(htErr); }
      }

      check(okF, "forecast", errF.join("; "));
    }
  } catch (e) {
    check(false, "forecast HTTP", e.message);
  }

  // 8. City Image
  try {
    const ir = await httpGet(`${BASE}/api/weather/image?city=${encodeURIComponent(top.name)}&country=${encodeURIComponent(cc)}`);
    if (ir.data && ir.data.imageUrl) {
      check(true, "city image found");
    } else {
      check(true, "city image (none — acceptable)");
    }
  } catch (e) {
    check(false, "city image HTTP", e.message);
  }
}

async function testCountry(countryName) {
  console.log(`\n========================================`);
  console.log(`TEST COUNTRY: ${countryName}`);
  console.log(`========================================`);
  try {
    const r = await httpGet(`${BASE}/api/weather/geocode?q=${encodeURIComponent(countryName)}`);
    if (!r.data || !r.data.matches || r.data.matches.length === 0) {
      check(false, `geocode country "${countryName}"`, "no matches");
      return;
    }
    const matches = r.data.matches;
    check(true, `geocode returned ${matches.length} match(es)`);

    // First match should be the capital (injected if not present)
    const first = matches[0];
    if (first.lat === 0 && first.lon === 0) {
      check(false, `capital "${first.name}" coords`, "(0, 0) — still injecting zeros!");
    } else {
      check(true, `capital "${first.name}" at (${first.lat.toFixed(2)}, ${first.lon.toFixed(2)})`);
    }
    if (!first.isCapital) {
      check(false, `first result capital flag`, `${first.name} not marked as capital`);
    } else {
      check(true, `first result is capital`);
    }
  } catch (e) {
    check(false, `country "${countryName}" HTTP`, e.message);
  }
}

async function main() {
  console.log("========================================");
  console.log("   AeroCast — 50-City Test Suite");
  console.log("========================================");

  // Test cities
  const cities = Object.entries(CITY_COUNTRY_MAP);
  console.log(`\nTesting ${cities.length} cities...`);
  for (const [city, cc] of cities) {
    await testCity(city, cc);
  }

  // Test country searches (capital injection, territory accuracy)
  console.log(`\n\nTesting ${TEST_COUNTRIES.length} country searches...`);
  for (const country of TEST_COUNTRIES) {
    await testCountry(country);
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`   RESULTS`);
  console.log(`========================================`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total:  ${passed + failed}`);
  console.log(`   Score:  ${Math.round(passed / (passed + failed) * 100)}%`);
  if (errors.length > 0) {
    console.log(`\n   ERRORS:`);
    for (const e of errors) {
      console.log(`     - ${e}`);
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
