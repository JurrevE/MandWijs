import { describe, expect, it } from "vitest";
import { optimizeShopping } from "./optimizer";
import type { ShoppingOption } from "./types";

const option = (id: string, productId: string, storeId: string, priceCents: number): ShoppingOption => ({
  id,
  productId,
  productName: productId,
  storeId,
  storeName: storeId,
  chainId: storeId,
  priceCents,
  payableQuantity: 1,
  requestedQuantity: 1,
  matchType: "exact",
});

const options = [
  option("a1", "a", "store-1", 100),
  option("a2", "a", "store-2", 130),
  option("a3", "a", "store-3", 95),
  option("b1", "b", "store-1", 200),
  option("b2", "b", "store-2", 100),
  option("b3", "b", "store-3", 260),
  option("c1", "c", "store-1", 150),
  option("c2", "c", "store-2", 155),
  option("c3", "c", "store-3", 90),
];

describe("optimizeShopping", () => {
  it("vindt de goedkoopste éénwinkeloplossing", () => {
    const plan = optimizeShopping({ productIds: ["a", "b", "c"], options, strategy: "cheapest", maxStores: 1 });
    expect(plan.storeCount).toBe(1);
    expect(plan.totalCents).toBe(385);
  });

  it("vindt de goedkoopste oplossing met maximaal twee winkels", () => {
    const plan = optimizeShopping({ productIds: ["a", "b", "c"], options, strategy: "max_two" });
    expect(plan.storeCount).toBe(2);
    expect(plan.totalCents).toBe(285);
  });

  it("minimaliseert eerst het aantal winkels", () => {
    const plan = optimizeShopping({ productIds: ["a", "b", "c"], options, strategy: "fewest" });
    expect(plan.storeCount).toBe(1);
    expect(plan.totalCents).toBe(385);
  });

  it("past een transparante balanspenalty toe", () => {
    const plan = optimizeShopping({ productIds: ["a", "b", "c"], options, strategy: "balance", storePenaltyCents: 300 });
    expect(plan.storeCount).toBe(1);
    expect(plan.scoreCents).toBe(385);
  });

  it("schaalt naar een grotere weeklijst zonder alle productcombinaties uit te schrijven", () => {
    const productIds = Array.from({ length: 30 }, (_, index) => `product-${index}`);
    const manyOptions = productIds.flatMap((productId, productIndex) =>
      Array.from({ length: 10 }, (_, storeIndex) => option(
        `${productId}-${storeIndex}`,
        productId,
        `store-${storeIndex}`,
        100 + productIndex + storeIndex,
      )),
    );

    const plan = optimizeShopping({ productIds, options: manyOptions, strategy: "balance", storePenaltyCents: 300, maxStores: 3 });
    expect(plan.options).toHaveLength(30);
    expect(plan.storeCount).toBe(1);
  });
});
