import type { ShoppingOption, ShoppingPlan } from "./types";

export type Strategy = "cheapest" | "max_two" | "fewest" | "balance";

interface OptimizeInput {
  productIds: string[];
  options: ShoppingOption[];
  strategy: Strategy;
  storePenaltyCents?: number;
  maxStores?: number;
}

const strategyMeta: Record<Strategy, { label: string; description: string }> = {
  cheapest: { label: "Goedkoopste totaalprijs", description: "De laagste productprijs, ongeacht het aantal winkels." },
  max_two: { label: "Maximaal twee winkels", description: "De laagste prijs met hoogstens twee winkelstops." },
  fewest: { label: "Minste winkels", description: "Eerst zo min mogelijk winkels, daarna de laagste prijs." },
  balance: { label: "Beste balans", description: "Prijs plus € 3,00 voorkeurspenalty per extra winkel." },
};

function cartesian<T>(groups: T[][]): T[][] {
  return groups.reduce<T[][]>(
    (combinations, group) => combinations.flatMap((combination) => group.map((item) => [...combination, item])),
    [[]],
  );
}

export function optimizeShopping(input: OptimizeInput): ShoppingPlan {
  const penalty = input.storePenaltyCents ?? 300;
  const unmatchedProductIds = input.productIds.filter(
    (productId) => !input.options.some((option) => option.productId === productId),
  );
  const matchedProductIds = input.productIds.filter((id) => !unmatchedProductIds.includes(id));
  const optionGroups = matchedProductIds.map((productId) =>
    input.options.filter((option) => option.productId === productId),
  );
  const combinations = cartesian(optionGroups).filter((combination) => {
    const stores = new Set(combination.map((option) => option.storeId)).size;
    const strategyLimit = input.strategy === "max_two" ? 2 : input.maxStores;
    return !strategyLimit || stores <= strategyLimit;
  });

  if (combinations.length === 0) {
    const meta = strategyMeta[input.strategy];
    return { id: input.strategy, ...meta, totalCents: 0, scoreCents: 0, storeCount: 0, savingsCents: 0, options: [], unmatchedProductIds: input.productIds };
  }

  const ranked = combinations.map((options) => {
    const totalCents = options.reduce((sum, option) => sum + option.priceCents, 0);
    const storeCount = new Set(options.map((option) => option.storeId)).size;
    const scoreCents = totalCents + Math.max(0, storeCount - 1) * penalty;
    return { options, totalCents, storeCount, scoreCents };
  });

  ranked.sort((a, b) => {
    if (input.strategy === "fewest" && a.storeCount !== b.storeCount) return a.storeCount - b.storeCount;
    if (input.strategy === "balance" && a.scoreCents !== b.scoreCents) return a.scoreCents - b.scoreCents;
    return a.totalCents - b.totalCents || a.storeCount - b.storeCount;
  });

  const winner = ranked[0];
  const mostExpensive = matchedProductIds.reduce((sum, productId) => {
    const prices = input.options.filter((option) => option.productId === productId).map((option) => option.priceCents);
    return sum + Math.max(...prices);
  }, 0);
  const meta = strategyMeta[input.strategy];

  return {
    id: input.strategy,
    ...meta,
    ...winner,
    savingsCents: Math.max(0, mostExpensive - winner.totalCents),
    unmatchedProductIds,
  };
}
