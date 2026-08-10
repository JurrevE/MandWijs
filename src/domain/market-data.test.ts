import { describe, expect, it } from "vitest";
import { buildShoppingOptions, localizeShoppingOptions } from "./market-data";
import type { Offer, PersonalProduct, StoreLocation, SupermarketChain } from "./types";

const chain: SupermarketChain = { id: "jumbo", name: "Jumbo", shortName: "JU", color: "#f5c400", active: true };
const product: PersonalProduct = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "De Ruijter hagelslag",
  searchTerm: "De Ruijter hagelslag",
  kind: "exact",
  preferredBrand: "De Ruijter",
  allowHouseBrand: false,
  quantity: 380,
  unit: "gram",
  category: "ontbijt",
  active: true,
};
const offer: Offer = {
  id: "offer",
  provider: "prijsprofeet",
  sourceId: "source",
  product: { id: "provider-product", sourceProductId: "source", name: "De Ruijter hagelslag", brand: "De Ruijter", category: "ontbijt", packageQuantity: 380, packageUnit: "gram" },
  chainId: "jumbo",
  regularPriceCents: 300,
  actionPriceCents: 250,
  actionType: "percentage",
  minimumQuantity: 1,
  effectiveUnitPriceCents: 250,
  payableTotalCents: 250,
  validFrom: "2026-08-10",
  validUntil: "2026-08-16",
  lastSyncedAt: "2026-08-10T08:00:00Z",
  loyaltyCardRequired: false,
  confidence: "likely",
};

describe("buildShoppingOptions", () => {
  it("labelt een naam-/merkmatch zonder EAN als indicatief", () => {
    const [option] = buildShoppingOptions([product], [offer], [chain]);
    expect(option.matchType).toBe("comparable");
    expect(option.warning).toContain("zonder EAN-bevestiging");
  });

  it("classificeert alleen dezelfde verwachte EAN als exact", () => {
    const [option] = buildShoppingOptions(
      [{ ...product, expectedEan: "8710496979880" }],
      [{ ...offer, product: { ...offer.product, ean: "8710496979880" } }],
      [chain],
    );
    expect(option.matchType).toBe("exact");
    expect(option.warning).toBeUndefined();
  });

  it("accepteert nooit alleen een brede categorie als productmatch", () => {
    const unrelated = {
      ...offer,
      product: { ...offer.product, name: "Serranoham", brand: "Voorbeeld", category: "ontbijt" },
    };
    expect(buildShoppingOptions([product], [unrelated], [chain])).toEqual([]);
  });

  it("koppelt een anders benoemd supermarktproduct via dezelfde gevonden EAN, maar blijft indicatief", () => {
    const direct = { ...offer, id: "direct", product: { ...offer.product, ean: "8720181627071", name: "De Ruijter hagelslag" } };
    const renamed = { ...offer, id: "renamed", sourceId: "renamed", product: { ...offer.product, id: "renamed", sourceProductId: "renamed", ean: "8720181627071", name: "Chocoladevlokken onder andere naam" } };
    const options = buildShoppingOptions([product], [direct, renamed], [chain]);

    expect(options).toHaveLength(2);
    expect(options.find((option) => option.id.startsWith("renamed"))).toMatchObject({ matchType: "comparable" });
    expect(options.find((option) => option.id.startsWith("renamed"))?.warning).toContain("Dezelfde EAN");
  });

  it("zet een landelijke prijs alleen op een fysiek filiaal binnen de gekozen radius", () => {
    const stores: StoreLocation[] = [
      { id: "near", chainId: "jumbo", name: "Jumbo dichtbij", address: "Dichtbij 1", postcode: "3511 AA", city: "Utrecht", latitude: 52.091, longitude: 5.122, active: true },
      { id: "far", chainId: "jumbo", name: "Jumbo ver weg", address: "Verweg 1", postcode: "1011 AA", city: "Amsterdam", latitude: 52.3676, longitude: 4.9041, active: true },
    ];
    const national = buildShoppingOptions([product], [offer], [chain]);
    const localized = localizeShoppingOptions(national, stores, { latitude: 52.0907, longitude: 5.1214, radiusKm: 5 });

    expect(localized.map((option) => option.storeId)).toEqual(["near"]);
  });
});
