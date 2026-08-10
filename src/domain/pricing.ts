import type { OfferActionType } from "./types";

export interface PricingInput {
  regularPriceCents: number;
  actionType: OfferActionType;
  actionPriceCents?: number;
  discountPercentage?: number;
  minimumQuantity?: number;
}

export interface EffectivePricing {
  minimumQuantity: number;
  payableTotalCents: number;
  effectiveUnitPriceCents: number;
  savingsCents: number;
}

const positiveInteger = (value: number | undefined, fallback: number) =>
  value && Number.isInteger(value) && value > 0 ? value : fallback;

export function calculateEffectivePricing(input: PricingInput): EffectivePricing {
  if (!Number.isInteger(input.regularPriceCents) || input.regularPriceCents < 0) {
    throw new Error("De normale prijs moet een positief aantal eurocenten zijn.");
  }

  const regular = input.regularPriceCents;
  let minimumQuantity = positiveInteger(input.minimumQuantity, 1);
  let payableTotalCents = regular * minimumQuantity;

  switch (input.actionType) {
    case "none":
      minimumQuantity = 1;
      payableTotalCents = input.actionPriceCents ?? regular;
      break;
    case "percentage": {
      const percentage = input.discountPercentage ?? 0;
      if (percentage < 0 || percentage > 100) throw new Error("Kortingspercentage moet tussen 0 en 100 liggen.");
      const unitPrice = input.actionPriceCents ?? Math.round(regular * (1 - percentage / 100));
      payableTotalCents = unitPrice * minimumQuantity;
      break;
    }
    case "buy_one_get_one":
    case "second_free":
      minimumQuantity = Math.max(2, minimumQuantity);
      payableTotalCents = regular * Math.ceil(minimumQuantity / 2);
      break;
    case "second_half_price":
      minimumQuantity = Math.max(2, minimumQuantity);
      payableTotalCents = Math.round(regular * 1.5);
      break;
    case "multibuy_fixed":
    case "multipack":
      minimumQuantity = Math.max(2, minimumQuantity);
      payableTotalCents = input.actionPriceCents ?? regular * minimumQuantity;
      break;
    case "loyalty":
    case "unknown":
      payableTotalCents = (input.actionPriceCents ?? regular) * minimumQuantity;
      break;
  }

  const regularTotal = regular * minimumQuantity;
  return {
    minimumQuantity,
    payableTotalCents,
    effectiveUnitPriceCents: Math.round(payableTotalCents / minimumQuantity),
    savingsCents: Math.max(0, regularTotal - payableTotalCents),
  };
}

export const actionLabels: Record<OfferActionType, string> = {
  none: "Normale prijs",
  percentage: "Percentage korting",
  buy_one_get_one: "1+1 gratis",
  multibuy_fixed: "Meerdere voor vaste prijs",
  second_half_price: "2e halve prijs",
  second_free: "2e gratis",
  multipack: "Multipack",
  loyalty: "Klantenkaartactie",
  unknown: "Onbekende actie",
};
