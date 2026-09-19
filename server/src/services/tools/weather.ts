interface GeocodeResult {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

async function geocodeLocation(query: string): Promise<GeocodeResult> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }

  const data = (await response.json()) as { results?: GeocodeResult[] };
  const result = data.results?.[0];
  if (!result) {
    throw new Error(`Could not find a location matching "${query}"`);
  }
  return result;
}

export async function getCurrentWeather(location: string) {
  const place = await geocodeLocation(location);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(place.latitude));
  url.searchParams.set("longitude", String(place.longitude));
  url.searchParams.set("current", "temperature_2m,wind_speed_10m,weather_code");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather lookup failed (${response.status})`);
  }

  const data = (await response.json()) as {
    current?: { temperature_2m: number; wind_speed_10m: number; weather_code: number };
  };
  if (!data.current) {
    throw new Error("Weather service did not return current conditions");
  }

  return {
    location: [place.name, place.country].filter(Boolean).join(", "),
    temperature_celsius: data.current.temperature_2m,
    wind_speed_kmh: data.current.wind_speed_10m,
    weather_code: data.current.weather_code,
  };
}
