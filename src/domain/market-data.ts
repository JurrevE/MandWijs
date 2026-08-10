import { actionLabels } from "./pricing";
import { haversineDistanceKm, isWithinRadius } from "./distance";
import { matchProduct } from "./matching";
import type { AppProfile, GroceryListItem } from "./app-state";
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
  disabledStoreIds: string[] = [],
) {
  if (profile.latitude == null || profile.longitude == null) return options;
  const origin = { latitude: profile.latitude, longitude: profile.longitude };
  const nearbyStores = stores.filter((store) =>
    !store.id.startsWith("national:") &&
    !disabledStoreIds.includes(store.id) &&
    store.latitude != null &&
    store.longitude != null &&
    isWithinRadius(origin, store, profile.radiusKm));
  const nearestStoreByChain = new Map<string, StoreLocation>();
  for (const store of nearbyStores) {
    const existing = nearestStoreByChain.get(store.chainId);
    if (!existing || isCloser(store, existing, origin)) nearestStoreByChain.set(store.chainId, store);
  }

  return options.flatMap((option) => {
    if (!option.storeId.startsWith("national:")) {
      return nearbyStores.some((store) => store.id === option.storeId) ? [option] : [];
    }
    const store = nearestStoreByChain.get(option.chainId);
    return store ? [{ ...option, id: `${option.id}:${store.id}`, storeId: store.id, storeName: store.name }] : [];
  });
}

export function prepareShoppingOptionsForList(
  options: ShoppingOption[],
  items: GroceryListItem[],
  stores: StoreLocation[],
  profile: Pick<AppProfile, "latitude" | "longitude" | "radiusKm" | "enabledChainIds" | "disabledStoreIds">,
) {
  const activeItems = items.filter((item) => !item.checked);
  const prepared = localizeShoppingOptions(options, stores, profile, profile.disabledStoreIds)
    .filter((option) => activeItems.some((item) => item.productId === option.productId))
    .filter((option) => profile.enabledChainIds.includes(option.chainId) && !profile.disabledStoreIds.includes(option.storeId))
    .map((option) => {
      const requested = activeItems.find((item) => item.productId === option.productId)?.quantity ?? 1;
      const bundles = Math.ceil(requested / option.payableQuantity);
      return { ...option, requestedQuantity: requested, priceCents: option.priceCents * bundles };
    });

  const cheapestPerProductAndStore = new Map<string, ShoppingOption>();
  for (const option of prepared) {
    const key = `${option.productId}\u0000${option.storeId}`;
    const existing = cheapestPerProductAndStore.get(key);
    if (!existing || option.priceCents < existing.priceCents) cheapestPerProductAndStore.set(key, option);
  }
  return [...cheapestPerProductAndStore.values()];
}

function isCloser(candidate: StoreLocation, current: StoreLocation, origin: { latitude: number; longitude: number }) {
  if (candidate.latitude == null || candidate.longitude == null || current.latitude == null || current.longitude == null) return false;
  return haversineDistanceKm(origin, { latitude: candidate.latitude, longitude: candidate.longitude }) <
    haversineDistanceKm(origin, { latitude: current.latitude, longitude: current.longitude });
}
