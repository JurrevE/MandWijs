export interface GeocodedLocationResponse {
  label: string;
  latitude: number;
  longitude: number;
  attribution: string;
}

export async function geocodeLocation(query: string) {
  const response = await fetch("/api/locations/geocode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const body = await response.json() as Partial<GeocodedLocationResponse> & { error?: string };
  if (!response.ok || typeof body.label !== "string" || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    throw new Error(body.error ?? "Locatie zoeken is mislukt.");
  }
  return body as GeocodedLocationResponse;
}
