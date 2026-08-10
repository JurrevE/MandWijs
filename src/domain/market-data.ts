import { actionLabels } from "./pricing";
import { isWithinRadius } from "./distance";
import { matchProduct } from "./matching";
import type { AppProfile } from "./app-state";
import type { Offer, PersonalProduct, ProductMatch, ShoppingOption, StoreLocation, SupermarketChain } from "./types";

export function addNationalPriceLocations(chains: SupermarketChain[], stores: StoreLocation[]) {
  const national = chains.map<StoreLocation>((chain) => ({
    id: `national:${chain.id}`,
    chainId: chain.id,
    name: `Landelijke prijs · ${chain.name}`,
    address: "Filiaalbeschikbaarheid niet geleverd door prijsprovider",
    postcode: "",
    city: "Nederland",
    latitude: null,
    longitude: null,
    active: true,
  }));
  return [...stores, ...national.filter((item) => !stores.some((store) => store.id === item.id))];
}

export function buildShoppingOptions(
  products: PersonalProduct[],
  offers: Offer[],
  chains: SupermarketChain[],
): ShoppingOption[] {
  const options: ShoppingOption[] = [];
  for (const product of products) {
    const directMatches = new Map<string, ProductMatch>();
    const indicativeEans = new Set<string>();
    for (const offer of offers) {
      const match = matchProduct({
        personalProduct: product,
        providerProduct: offer.product,
        expectedEan: product.expectedEan,
        expectedSourceProductId: product.expectedSourceProductId,
      });
      directMatches.set(offer.id, match);
      if (match.matchType !== "none" && offer.product.ean) indicativeEans.add(offer.product.ean);
    }

    for (const offer of offers) {
      let match = directMatches.get(offer.id)!;
      if (match.matchType === "none" && offer.product.ean && indicativeEans.has(offer.product.ean)) {
        match = {
          userProductId: product.id,
          providerProductId: offer.product.id,
          matchType: "comparable",
          confidence: 0.9,
          source: "provider",
          reason: "Dezelfde EAN als een indicatieve naam-match bij een andere supermarkt",
          updatedAt: new Date().toISOString(),
        };
      }
      if (match.matchType === "none") continue;
      const chain = chains.find((item) => item.id === offer.chainId);
      const indicative = match.matchType !== "exact";
      options.push({
        id: `${offer.id}:${product.id}`,
        productId: product.id,
        productName: product.name,
        storeId: offer.storeId ?? `national:${offer.chainId}`,
        storeName: offer.storeId ? (chain?.name ?? offer.chainId) : `Landelijke prijs · ${chain?.name ?? offer.chainId}`,
        chainId: offer.chainId,
        priceCents: offer.payableTotalCents,
        payableQuantity: offer.minimumQuantity,
        requestedQuantity: 1,
        matchType: match.matchType,
        actionLabel: offer.actionType === "none" ? undefined : actionLabels[offer.actionType],
        warning: indicative
          ? `${match.reason}. Controleer verpakking en product voordat je koopt.`
          : offer.minimumQuantity > 1
            ? `Deze actie vereist minimaal ${offer.minimumQuantity} stuks.`
            : undefined,
      });
    }
  }
  return options;
}

export function localizeShoppingOptions(
  options: ShoppingOption[],
  stores: StoreLocation[],
  profile: Pick<AppProfile, "latitude" | "longitude" | "radiusKm">,
) {
  if (profile.latitude == null || profile.longitude == null) return options;
  const origin = { latitude: profile.latitude, longitude: profile.longitude };
  const nearbyStores = stores.filter((store) =>
    !store.id.startsWith("national:") &&
    store.latitude != null &&
    store.longitude != null &&
    isWithinRadius(origin, store, profile.radiusKm));

  return options.flatMap((option) => {
    if (!option.storeId.startsWith("national:")) {
      return nearbyStores.some((store) => store.id === option.storeId) ? [option] : [];
    }
    return nearbyStores
      .filter((store) => store.chainId === option.chainId)
      .map((store) => ({ ...option, id: `${option.id}:${store.id}`, storeId: store.id, storeName: store.name }));
  });
}
