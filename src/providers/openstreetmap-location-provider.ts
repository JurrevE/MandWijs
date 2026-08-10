import { z } from "zod";
import { haversineDistanceKm } from "@/domain/distance";
import type { StoreLocation } from "@/domain/types";

const locationInputSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  radiusKm: z.number().finite().positive().max(25),
});

const nominatimResultSchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lon: z.coerce.number().finite().min(-180).max(180),
  display_name: z.string().min(1),
  address: z.record(z.string(), z.string()).optional().default({}),
});

const overpassElementSchema = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number().int().positive(),
  lat: z.number().finite().optional(),
  lon: z.number().finite().optional(),
  center: z.object({ lat: z.number().finite(), lon: z.number().finite() }).optional(),
  tags: z.record(z.string(), z.string()).optional().default({}),
});

const overpassResponseSchema = z.object({ elements: z.array(overpassElementSchema) });

const chainAliases: Array<{ chainId: string; names: string[] }> = [
  { chainId: "albert-heijn", names: ["albert heijn", "ah"] },
  { chainId: "jumbo", names: ["jumbo"] },
  { chainId: "aldi", names: ["aldi"] },
  { chainId: "lidl", names: ["lidl"] },
  { chainId: "plus", names: ["plus"] },
  { chainId: "dirk", names: ["dirk", "dirk van den broek"] },
  { chainId: "ekoplaza", names: ["ekoplaza", "eko plaza"] },
  { chainId: "hoogvliet", names: ["hoogvliet"] },
  { chainId: "dekamarkt", names: ["dekamarkt", "deka markt"] },
  { chainId: "vomar", names: ["vomar"] },
];

const chainNames = new Map(chainAliases.map(({ chainId, names }) => [chainId, names[0]
  .split(" ")
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(" ")]));

const normalize = (value: string) => value
  .normalize("NFKD")
  .replace(/\p{Diacritic}/gu, "")
  .toLocaleLowerCase("nl-NL")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export function resolveSupportedChain(tags: Record<string, string>) {
  const candidates = [tags.brand, tags.name, tags.operator]
    .filter((value): value is string => Boolean(value))
    .map(normalize);
  for (const { chainId, names } of chainAliases) {
    if (candidates.some((candidate) => names.some((name) => {
      const alias = normalize(name);
      return candidate === alias || candidate.startsWith(`${alias} `) || candidate.endsWith(` ${alias}`);
    }))) return chainId;
  }
  return undefined;
}

const locationLabel = (result: z.infer<typeof nominatimResultSchema>) => {
  const address = result.address;
  const city = address.city ?? address.town ?? address.village ?? address.municipality;
  const street = [address.road, address.house_number].filter(Boolean).join(" ");
  const compact = [street, address.postcode, city].filter(Boolean).join(", ");
  return compact || result.display_name.split(",").slice(0, 3).join(",").trim();
};

const isSecureUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

let nominatimQueue: Promise<void> = Promise.resolve();
let lastNominatimRequestAt = 0;
let preferredOverpassEndpoint: string | undefined;

async function respectNominatimLimit<T>(operation: () => Promise<T>) {
  const previous = nominatimQueue;
  let release = () => {};
  nominatimQueue = new Promise<void>((resolve) => { release = resolve; });
  await previous;
  try {
    const waitMs = Math.max(0, 1_000 - (Date.now() - lastNominatimRequestAt));
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastNominatimRequestAt = Date.now();
    return await operation();
  } finally {
    release();
  }
}

interface OpenStreetMapLocationProviderOptions {
  nominatimBaseUrl?: string;
  overpassUrl?: string;
  overpassFallbackUrl?: string;
  userAgent?: string;
  fetchImpl?: typeof fetch;
}

export interface GeocodedLocation {
  label: string;
  latitude: number;
  longitude: number;
  attribution: "© OpenStreetMap contributors";
}

export class OpenStreetMapLocationProvider {
  private readonly nominatimBaseUrl: string;
  private readonly overpassUrls: string[];
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenStreetMapLocationProviderOptions = {}) {
    this.nominatimBaseUrl = (options.nominatimBaseUrl ?? process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org").replace(/\/$/, "");
    this.overpassUrls = [...new Set([
      options.overpassUrl ?? process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter",
      options.overpassFallbackUrl ?? process.env.OVERPASS_FALLBACK_API_URL ?? "https://overpass.private.coffee/api/interpreter",
    ].filter(Boolean))];
    this.userAgent = options.userAgent ?? process.env.LOCATION_PROVIDER_USER_AGENT ?? "MandWijs/0.1 (contact: hallo@mandwijs.app)";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isConfigured() {
    return isSecureUrl(this.nominatimBaseUrl) && this.overpassUrls.length > 0 && this.overpassUrls.every(isSecureUrl) && this.userAgent.length >= 8;
  }

  async geocode(query: string): Promise<GeocodedLocation | null> {
    const normalizedQuery = z.string().trim().min(2).max(255).parse(query);
    if (!this.isConfigured()) throw new Error("De locatieprovider is niet geldig geconfigureerd.");
    const params = new URLSearchParams({
      q: normalizedQuery,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "nl",
      limit: "1",
      "accept-language": "nl",
    });

    const response = await respectNominatimLimit(() => this.fetchImpl(`${this.nominatimBaseUrl}/search?${params}`, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": this.userAgent },
      cache: "force-cache",
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(8_000),
    }));
    if (response.status === 429) throw new Error("De adreszoeker is tijdelijk te druk. Probeer het over een minuut opnieuw.");
    if (!response.ok) throw new Error(`Adreszoeker gaf HTTP ${response.status}.`);
    const parsed = z.array(nominatimResultSchema).parse(await response.json());
    const first = parsed[0];
    return first ? {
      label: locationLabel(first),
      latitude: first.lat,
      longitude: first.lon,
      attribution: "© OpenStreetMap contributors",
    } : null;
  }

  async findNearbyStores(input: z.input<typeof locationInputSchema>) {
    const location = locationInputSchema.parse(input);
    if (!this.isConfigured()) throw new Error("De locatieprovider is niet geldig geconfigureerd.");
    const queryRadiusKm = location.radiusKm <= 5 ? 5 : location.radiusKm;
    const radiusMeters = Math.round(queryRadiusKm * 1_000);
    const query = `[out:json][timeout:20];nwr["shop"="supermarket"](around:${radiusMeters},${location.latitude},${location.longitude});out tags center qt 600;`;
    let data: z.infer<typeof overpassResponseSchema> | undefined;
    let lastError: Error | undefined;
    const orderedEndpoints = preferredOverpassEndpoint && this.overpassUrls.includes(preferredOverpassEndpoint)
      ? [preferredOverpassEndpoint, ...this.overpassUrls.filter((endpoint) => endpoint !== preferredOverpassEndpoint)]
      : this.overpassUrls;
    for (const endpoint of orderedEndpoints) {
      try {
        const response = await this.fetchImpl(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": this.userAgent,
          },
          body: new URLSearchParams({ data: query }),
          cache: "force-cache",
          next: { revalidate: 60 * 60 * 24 },
          signal: AbortSignal.timeout(25_000),
        });
        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          const error = new Error(`Winkelzoeker gaf HTTP ${response.status}.`);
          if (!retryable) throw error;
          lastError = error;
          continue;
        }
        data = overpassResponseSchema.parse(await response.json());
        preferredOverpassEndpoint = endpoint;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Winkelzoeker is niet bereikbaar.");
      }
    }
    if (!data) throw new Error(lastError?.message ?? "De winkelzoeker is tijdelijk niet bereikbaar.");
    const origin = { latitude: location.latitude, longitude: location.longitude };
    const unique = new Map<string, StoreLocation & { distanceKm: number }>();

    for (const element of data.elements) {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      const chainId = resolveSupportedChain(element.tags);
      if (latitude == null || longitude == null || !chainId) continue;
      const distanceKm = haversineDistanceKm(origin, { latitude, longitude });
      if (distanceKm > location.radiusKm + 0.01) continue;
      const street = [element.tags["addr:street"], element.tags["addr:housenumber"]].filter(Boolean).join(" ");
      const name = element.tags.name ?? element.tags.brand ?? chainNames.get(chainId) ?? chainId;
      const postcode = element.tags["addr:postcode"] ?? "";
      const city = element.tags["addr:city"] ?? element.tags["addr:town"] ?? element.tags["addr:village"] ?? "Onbekende plaats";
      const address = street || element.tags["addr:full"] || "Adres niet beschikbaar";
      const store: StoreLocation & { distanceKm: number } = {
        id: `osm:${element.type}:${element.id}`,
        chainId,
        name,
        address,
        postcode,
        city,
        latitude,
        longitude,
        openingHours: element.tags.opening_hours,
        active: true,
        source: "openstreetmap",
        sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        distanceKm,
      };
      const dedupeKey = postcode && street
        ? `${chainId}:${normalize(postcode)}:${normalize(street)}`
        : `${chainId}:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
      const existing = unique.get(dedupeKey);
      if (!existing || store.distanceKm < existing.distanceKm) unique.set(dedupeKey, store);
    }

    return {
      stores: [...unique.values()].sort((left, right) => left.distanceKm - right.distanceKm),
      attribution: "© OpenStreetMap contributors" as const,
      completedAt: new Date().toISOString(),
    };
  }
}
