import { describe, expect, it, vi } from "vitest";
import { PrijsProfeetProvider } from "./prijsprofeet-provider";

const jsonResponse = (value: unknown) => new Response(JSON.stringify(value), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

describe("PrijsProfeetProvider", () => {
  it("gebruikt alleen gedocumenteerde zoekendpoints en filtert op actieve acties", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      expect(new Headers(init?.headers).get("X-API-Key")).toBe("server-secret");
      expect(new Headers(init?.headers).get("User-Agent")).toContain("MandWijs/0.1");

      if (url.includes("/api/v1/search?")) {
        expect(url).toContain("q=melk");
        expect(url).toContain("promotion_status=active");
        return jsonResponse({
          total: 2,
          page: 1,
          page_size: 100,
          query: "melk",
          results: [
            {
              product_id: "ah-melk-active",
              name: "Halfvolle melk 1 liter",
              brand: "Voorbeeld",
              ean: "8712345678901",
              price: 1.49,
              original_price: 1.99,
              quantity: "1 l",
              unit_normalized: "l",
              retailer: "albert_heijn",
              unified_category: "zuivel-eieren",
              is_promotional: true,
              promotion_status: "active",
              promotion_type: "percentage",
              savings_percentage: 25,
              valid_from: "2026-08-10",
              valid_until: "2026-08-16",
              score: 12,
            },
            {
              product_id: "jumbo-melk-upcoming",
              name: "Melk volgende week",
              price: 0.99,
              retailer: "jumbo",
              is_promotional: true,
              promotion_status: "upcoming",
              promotion_type: "starting",
              valid_from: "2026-08-17",
              valid_until: "2026-08-23",
              score: 10,
            },
          ],
        });
      }

      if (url.includes("/api/v1/products/ah-melk-active")) {
        return jsonResponse({
          product_id: "ah-melk-active",
          name: "Halfvolle melk 1 liter",
          brand: "Voorbeeld",
          ean: "8712345678901",
          price: 1.49,
          original_price: 1.99,
          quantity: "1 l",
          unit: "l",
          retailer: "albert_heijn",
          unified_category: "zuivel-eieren",
          is_promotional: true,
          promotion_status: "active",
          promotion_type: "percentage",
          savings_percentage: 25,
          valid_from: "2026-08-10",
          valid_until: "2026-08-16",
          extracted_at: "2026-08-10T08:00:00Z",
        });
      }

      expect(url).toContain("/api/v1/products/search/melk?page=1&page_size=100");
      return jsonResponse({
        total: 1,
        page: 1,
        page_size: 100,
        products: [{
          product_id: "lidl-melk-normal",
          name: "Halfvolle melk",
          price: 1.09,
          retailer: "lidl",
          extracted_at: "2026-08-10T08:00:00Z",
          is_promotional: false,
        }],
      });
    });

    const provider = new PrijsProfeetProvider({
      baseUrl: "https://www.prijsprofeet.nl",
      apiKey: "server-secret",
      fetchImpl,
    });
    const result = await provider.syncOffers({ queries: ["melk"], currentOnly: true, asOf: new Date("2026-08-10T07:00:00.000Z") });

    expect(result.source).toBe("live");
    expect(result.offers).toHaveLength(2);
    expect(result.offers.some((offer) => offer.sourceId === "jumbo-melk-upcoming")).toBe(false);
    expect(result.offers.find((offer) => offer.sourceId === "ah-melk-active")).toMatchObject({
      chainId: "albert-heijn",
      actionType: "percentage",
      regularPriceCents: 199,
      actionPriceCents: 149,
      validFrom: "2026-08-10",
      validUntil: "2026-08-16",
      confidence: "verified",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("bouwt ketens uitsluitend uit de gedocumenteerde retailer-facetten", async () => {
    const provider = new PrijsProfeetProvider({
      baseUrl: "https://www.prijsprofeet.nl",
      fetchImpl: vi.fn(async () => jsonResponse({
        retailers: { albert_heijn: 10, jumbo: 8 },
        statuses: { active: 18 },
        categories: {},
        dietary: {},
        total: 18,
      })),
    });

    await expect(provider.getChains()).resolves.toEqual([
      expect.objectContaining({ id: "albert-heijn", name: "Albert Heijn" }),
      expect.objectContaining({ id: "jumbo", name: "Jumbo" }),
    ]);
  });

  it("verbreedt een meerwoordige zoekterm en neemt dezelfde EAN indicatief mee", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/api/v1/products/search/")) {
        return jsonResponse({ total: 0, page: 1, page_size: 100, products: [] });
      }
      const broad = url.includes("q=Biotex&");
      return jsonResponse({
        total: 1,
        page: 1,
        page_size: 100,
        query: broad ? "Biotex" : "Biotex Voorwas blauw",
        results: [{
          product_id: broad ? "ah-biotex" : "deka-biotex",
          name: broad ? "Biotex Wasmiddel waskrachtversterker waspoeder" : "Biotex Voorwas blauw",
          ean: "8720181627071",
          price: broad ? 3.25 : 2,
          original_price: broad ? 6.49 : 6.45,
          retailer: broad ? "albert_heijn" : "dekamarkt",
          is_promotional: true,
          promotion_status: "active",
          promotion_type: broad ? "one_plus_one" : "multi_buy",
          valid_from: "2026-08-10",
          valid_until: "2026-08-16",
          score: 100,
        }],
      });
    });
    const provider = new PrijsProfeetProvider({ baseUrl: "https://www.prijsprofeet.nl", fetchImpl });

    const result = await provider.syncOffers({ queries: ["Biotex Voorwas blauw"], currentOnly: true, asOf: new Date("2026-08-10T07:00:00.000Z") });

    expect(result.offers.map((offer) => offer.chainId)).toEqual(expect.arrayContaining(["dekamarkt", "albert-heijn"]));
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls.some(([input]) => String(input).includes("q=Biotex&"))).toBe(true);
  });

  it("weigert een verlopen actie ook wanneer PrijsProfeet de status nog actief noemt", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.includes("/api/v1/products/search/")) {
        return jsonResponse({ total: 0, page: 1, page_size: 100, products: [] });
      }
      return jsonResponse({
        total: 1,
        page: 1,
        page_size: 100,
        query: "melk",
        results: [{
          product_id: "expired-active-melk",
          name: "Melk actie vorige week",
          price: 0.99,
          original_price: 1.49,
          retailer: "albert_heijn",
          is_promotional: true,
          promotion_status: "active",
          promotion_type: "percentage",
          valid_from: "2026-08-10",
          valid_until: "2026-08-16",
          score: 10,
        }],
      });
    });
    const provider = new PrijsProfeetProvider({ baseUrl: "https://www.prijsprofeet.nl", fetchImpl });

    const result = await provider.syncOffers({
      queries: ["melk"],
      currentOnly: true,
      asOf: new Date("2026-08-17T07:00:00.000Z"),
    });

    expect(result.offers).toHaveLength(0);
  });

  it("stuurt current_only naar EAN-matching en valt zonder Pro-key veilig terug", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toBe("https://www.prijsprofeet.nl/api/v1/match/ean/8710496979880?current_only=true");
      return jsonResponse({ matches: [] });
    });
    const proProvider = new PrijsProfeetProvider({ baseUrl: "https://www.prijsprofeet.nl", apiKey: "pro-key", tier: "pro", fetchImpl });
    await expect(proProvider.matchByEan("8710496979880")).resolves.toEqual({ matches: [] });

    const freeProvider = new PrijsProfeetProvider({ baseUrl: "https://www.prijsprofeet.nl", apiKey: "free-key", tier: "free", fetchImpl });
    await expect(freeProvider.matchByEan("8710496979880")).resolves.toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
