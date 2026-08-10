import { demoChains, demoOffers, demoProducts, demoProfile, demoShoppingOptions, demoStores } from "./demo";
import type { PersistedState } from "@/domain/app-state";
import { addNationalPriceLocations } from "@/domain/market-data";

export function createDemoState(userEmail = "demo@mandwijs.app"): PersistedState {
  return {
    products: structuredClone(demoProducts),
    list: demoProducts
      .filter((product) => product.active)
      .map((product) => ({ productId: product.id, quantity: 1, checked: false })),
    profile: structuredClone(demoProfile),
    chains: structuredClone(demoChains),
    stores: addNationalPriceLocations(structuredClone(demoChains), structuredClone(demoStores)),
    offers: structuredClone(demoOffers),
    shoppingOptions: structuredClone(demoShoppingOptions),
    mode: "demo",
    userEmail,
    databaseReady: false,
    dataSource: "demo",
    dataUpdatedAt: new Date().toISOString(),
    dataWarnings: ["Demo-data actief; dit zijn geen actuele winkelprijzen."],
  };
}
