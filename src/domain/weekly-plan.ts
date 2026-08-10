import type { AppProfile, GroceryListItem } from "./app-state";
import { buildShoppingOptions, prepareShoppingOptionsForList } from "./market-data";
import { optimizeShopping } from "./optimizer";
import type { Offer, PersonalProduct, StoreLocation, SupermarketChain } from "./types";

export interface WeeklyPlanInput {
  products: PersonalProduct[];
  items: GroceryListItem[];
  profile: Pick<AppProfile, "latitude" | "longitude" | "radiusKm" | "maxStores" | "enabledChainIds" | "disabledStoreIds">;
  chains: SupermarketChain[];
  stores: StoreLocation[];
  offers: Offer[];
  storePenaltyCents?: number;
}

export function buildWeeklyPlan(input: WeeklyPlanInput) {
  const activeProductIds = new Set(input.products.filter((product) => product.active).map((product) => product.id));
  const activeItems = input.items.filter((item) => !item.checked && activeProductIds.has(item.productId));
  const productIds = activeItems.map((item) => item.productId);
  const shoppingOptions = buildShoppingOptions(input.products, input.offers, input.chains);
  const options = prepareShoppingOptionsForList(shoppingOptions, activeItems, input.stores, input.profile);

  return optimizeShopping({
    productIds,
    options,
    strategy: "balance",
    storePenaltyCents: input.storePenaltyCents ?? 300,
    maxStores: input.profile.maxStores ?? undefined,
  });
}
