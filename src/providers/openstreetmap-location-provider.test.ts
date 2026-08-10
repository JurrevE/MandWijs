import { describe, expect, it, vi } from "vitest";
import { OpenStreetMapLocationProvider, resolveSupportedChain } from "./openstreetmap-location-provider";

const jsonResponse = (value: unknown) => new Response(JSON.stringify(value), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

describe("OpenStreetMapLocationProvider", () => {
  it("herkent uitsluitend ondersteunde supermarktketens", () => {
    expect(resolveSupportedChain({ brand: "Albert Heijn" })).toBe("albert-heijn");
    expect(resolveSupportedChain({ name: "Dirk van den Broek Leeuwarden" })).toBe("dirk");
    expect(resolveSupportedChain({ name: "Lokale buurtsuper" })).toBeUndefined();
  });

  it("geocodeert een Nederlands adres via de gedocumenteerde Nominatim-velden", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      expect(String(input)).toContain("countrycodes=nl");
      expect(new Headers(init?.headers).get("User-Agent")).toContain("MandWijs");
      return jsonResponse([{
        lat: "53.2144",
        lon: "5.8010",
        display_name: "8913 HA, Leeuwarden, Fryslân, Nederland",
        address: { postcode: "8913 HA", city: "Leeuwarden" },
      }]);
    });
    const provider = new OpenStreetMapLocationProvider({ fetchImpl });

    await expect(provider.geocode("8913HA")).resolves.toMatchObject({
      label: "8913 HA, Leeuwarden",
      latitude: 53.2144,
      longitude: 5.801,
    });
  });

  it("filtert, dedupliceert en sorteert echte OSM-filialen binnen de straal", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const body = String(init?.body);
      expect(body).toContain("shop%22%3D%22supermarket");
      expect(body).toContain("around%3A5000");
      return jsonResponse({ elements: [
        { type: "node", id: 1, lat: 53.215, lon: 5.802, tags: { brand: "Jumbo", name: "Jumbo Centrum", "addr:street": "Voorstraat", "addr:housenumber": "1", "addr:postcode": "8913 AA", "addr:city": "Leeuwarden" } },
        { type: "way", id: 2, center: { lat: 53.2151, lon: 5.8021 }, tags: { brand: "Jumbo", name: "Jumbo dubbel", "addr:street": "Voorstraat", "addr:housenumber": "1", "addr:postcode": "8913 AA", "addr:city": "Leeuwarden" } },
        { type: "node", id: 3, lat: 53.22, lon: 5.81, tags: { name: "Lidl", "addr:city": "Leeuwarden" } },
        { type: "node", id: 4, lat: 53.3, lon: 5.9, tags: { brand: "ALDI" } },
        { type: "node", id: 5, lat: 53.216, lon: 5.803, tags: { name: "Onbekende supermarkt" } },
      ] });
    });
    const provider = new OpenStreetMapLocationProvider({ fetchImpl });
    const result = await provider.findNearbyStores({ latitude: 53.2144, longitude: 5.801, radiusKm: 5 });

    expect(result.stores).toHaveLength(2);
    expect(result.stores.map((store) => store.chainId)).toEqual(["jumbo", "lidl"]);
    expect(result.stores[0]).toMatchObject({ id: "osm:node:1", postcode: "8913 AA", source: "openstreetmap" });
  });

  it("probeert een configureerbare mirror na een tijdelijke Overpass-fout", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => String(input).includes("primary")
      ? new Response("busy", { status: 429 })
      : jsonResponse({ elements: [] }));
    const provider = new OpenStreetMapLocationProvider({
      overpassUrl: "https://primary.example/api/interpreter",
      overpassFallbackUrl: "https://fallback.example/api/interpreter",
      fetchImpl,
    });

    await expect(provider.findNearbyStores({ latitude: 53.2144, longitude: 5.801, radiusKm: 5 })).resolves.toMatchObject({ stores: [] });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("deelt voor 1, 2 en 5 kilometer dezelfde cachevriendelijke gebiedsquery", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      expect(String(init?.body)).toContain("around%3A5000");
      return jsonResponse({ elements: [] });
    });
    const provider = new OpenStreetMapLocationProvider({ fetchImpl });

    await provider.findNearbyStores({ latitude: 53.2144, longitude: 5.801, radiusKm: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
