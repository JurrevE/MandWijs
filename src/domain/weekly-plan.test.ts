import { describe, expect, it } from "vitest";
import { demoChains } from "@/data/demo";
import type { Offer, PersonalProduct, StoreLocation } from "./types";
import { buildWeeklyPlan } from "./weekly-plan";

const products: PersonalProduct[] = [
  { id: "melk", name: "Melk", searchTerm: "melk", kind: "category", allowHouseBrand: true, quantity: 1, unit: "liter", category: "Zuivel", active: true },
];

const stores: StoreLocation[] = [
  { id: "osm:node:1", chainId: "albert-heijn", name: "AH dichtbij", address: "Straat 1", postcode: "1000 AA", city: "Test", latitude: 52, longitude: 5, active: true },
  { id: "osm:node:2", chainId: "albert-heijn", name: "AH verder", address: "Straat 2", postcode: "1000 AB", city: "Test", latitude: 52.02, longitude: 5, active: true },
];

const offer: Offer = {
  id: "offer-1",
  provider: "prijsprofeet",
  sourceId: "milk-1",
  product: { id: "provider-melk", name: "Verse melk", category: "Zuivel" },
  chainId: "albert-heijn",
  regularPriceCents: 150,
  actionType: "none",
  minimumQuantity: 1,
  effectiveUnitPriceCents: 150,
  payableTotalCents: 150,
  validFrom: "2026-08-10",
  validUntil: "2026-08-16",
  lastSyncedAt: "2026-08-10T06:00:00.000Z",
  loyaltyCardRequired: false,
  confidence: "likely",
};

describe("buildWeeklyPlan", () => {
  it("gebruikt aantallen, straal en het dichtstbijzijnde ingeschakelde filiaal", () => {
    const plan = buildWeeklyPlan({
      products,
      items: [{ productId: "melk", quantity: 2, checked: false }],
      profile: { latitude: 52, longitude: 5, radiusKm: 5, maxStores: 2, enabledChainIds: ["albert-heijn"], disabledStoreIds: [] },
      chains: demoChains,
      stores,
      offers: [offer],
    });

    expect(plan.totalCents).toBe(300);
    expect(plan.options).toHaveLength(1);
    expect(plan.options[0]).toMatchObject({ storeId: "osm:node:1", requestedQuantity: 2 });
  });

  it("slaat afgevinkte producten en uitgeschakelde filialen over", () => {
    const plan = buildWeeklyPlan({
      products,
      items: [{ productId: "melk", quantity: 1, checked: true }],
      profile: { latitude: 52, longitude: 5, radiusKm: 5, maxStores: null, enabledChainIds: ["albert-heijn"], disabledStoreIds: ["osm:node:1"] },
      chains: demoChains,
      stores,
      offers: [offer],
    });

    expect(plan.options).toEqual([]);
    expect(plan.totalCents).toBe(0);
  });
});
