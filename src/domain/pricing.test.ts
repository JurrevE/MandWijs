import { describe, expect, it } from "vitest";
import { calculateEffectivePricing } from "./pricing";

describe("calculateEffectivePricing", () => {
  it("berekent 1+1 gratis inclusief minimumaantal", () => {
    expect(calculateEffectivePricing({ regularPriceCents: 300, actionType: "buy_one_get_one" })).toEqual({
      minimumQuantity: 2,
      payableTotalCents: 300,
      effectiveUnitPriceCents: 150,
      savingsCents: 300,
    });
  });

  it("berekent 2 voor een vaste prijs", () => {
    expect(calculateEffectivePricing({ regularPriceCents: 250, actionType: "multibuy_fixed", actionPriceCents: 400, minimumQuantity: 2 })).toMatchObject({
      payableTotalCents: 400,
      effectiveUnitPriceCents: 200,
    });
  });

  it("berekent tweede halve prijs", () => {
    expect(calculateEffectivePricing({ regularPriceCents: 300, actionType: "second_half_price" })).toMatchObject({
      minimumQuantity: 2,
      payableTotalCents: 450,
      effectiveUnitPriceCents: 225,
    });
  });

  it("berekent percentagekorting", () => {
    expect(calculateEffectivePricing({ regularPriceCents: 400, actionType: "percentage", discountPercentage: 25 })).toMatchObject({
      payableTotalCents: 300,
      effectiveUnitPriceCents: 300,
      savingsCents: 100,
    });
  });

  it("behoudt een opgegeven minimumaantal", () => {
    expect(calculateEffectivePricing({ regularPriceCents: 100, actionType: "percentage", discountPercentage: 10, minimumQuantity: 3 })).toMatchObject({
      minimumQuantity: 3,
      payableTotalCents: 270,
    });
  });
});
