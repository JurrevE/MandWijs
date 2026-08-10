import { calculateEffectivePricing } from "@/domain/pricing";
import type {
  Offer,
  OfferActionType,
  PersonalProduct,
  ShoppingOption,
  StoreLocation,
  SupermarketChain,
} from "@/domain/types";

export const demoChains: SupermarketChain[] = [
  { id: "ah", name: "Albert Heijn", shortName: "AH", color: "#169bd5", active: true },
  { id: "jumbo", name: "Jumbo", shortName: "JU", color: "#f5c400", active: true },
  { id: "lidl", name: "Lidl", shortName: "LI", color: "#174b8b", active: true },
  { id: "aldi", name: "Aldi", shortName: "AL", color: "#193d84", active: true },
  { id: "plus", name: "PLUS", shortName: "PL", color: "#78a22f", active: true },
  { id: "dirk", name: "Dirk", shortName: "DI", color: "#de1f35", active: true },
  { id: "ekoplaza", name: "Ekoplaza", shortName: "EK", color: "#5a8e36", active: true },
  { id: "hoogvliet", name: "Hoogvliet", shortName: "HO", color: "#d71920", active: true },
  { id: "dekamarkt", name: "DekaMarkt", shortName: "DE", color: "#e3282d", active: true },
  { id: "vomar", name: "Vomar", shortName: "VO", color: "#f28021", active: true },
];

export const demoStores: StoreLocation[] = [
  { id: "ah-neude", chainId: "ah", name: "Albert Heijn Neude", address: "Neude 7", postcode: "3512 AD", city: "Utrecht", latitude: 52.0934, longitude: 5.1191, openingHours: "Vandaag open tot 23:00", active: true },
  { id: "jumbo-merelstraat", chainId: "jumbo", name: "Jumbo Merelstraat", address: "Merelstraat 46", postcode: "3514 CN", city: "Utrecht", latitude: 52.1026, longitude: 5.1304, openingHours: "Vandaag open tot 22:00", active: true },
  { id: "lidl-smaragdplein", chainId: "lidl", name: "Lidl Smaragdplein", address: "Smaragdplein 103", postcode: "3523 EA", city: "Utrecht", latitude: 52.0772, longitude: 5.1365, openingHours: "Vandaag open tot 21:00", active: true },
  { id: "aldi-admiraal", chainId: "aldi", name: "Aldi Admiraal Helfrichlaan", address: "Admiraal Helfrichlaan 6", postcode: "3527 KV", city: "Utrecht", latitude: 52.0855, longitude: 5.0939, openingHours: "Vandaag open tot 20:00", active: true },
  { id: "plus-voorstraat", chainId: "plus", name: "PLUS Voorstraat", address: "Voorstraat 61", postcode: "3512 AK", city: "Utrecht", latitude: 52.0942, longitude: 5.122, openingHours: "Vandaag open tot 22:00", active: true },
  { id: "dirk-roelantdreef", chainId: "dirk", name: "Dirk Roelantdreef", address: "Roelantdreef 252", postcode: "3562 KH", city: "Utrecht", latitude: 52.114, longitude: 5.095, openingHours: "Vandaag open tot 21:00", active: true },
  { id: "ekoplaza-amsterdamsestraatweg", chainId: "ekoplaza", name: "Ekoplaza Utrecht", address: "Amsterdamsestraatweg 166", postcode: "3551 CN", city: "Utrecht", latitude: 52.1043, longitude: 5.1083, active: true },
  { id: "hoogvliet-bunnik", chainId: "hoogvliet", name: "Hoogvliet Bunnik", address: "Van Hardenbroeklaan 2", postcode: "3981 EP", city: "Bunnik", latitude: 52.0673, longitude: 5.1994, active: true },
  { id: "deka-zeist", chainId: "dekamarkt", name: "DekaMarkt Zeist", address: "Slotlaan 145", postcode: "3701 GD", city: "Zeist", latitude: 52.0894, longitude: 5.2378, active: true },
  { id: "vomar-ijsselstein", chainId: "vomar", name: "Vomar IJsselstein", address: "Kronenburgplantsoen 12", postcode: "3401 BN", city: "IJsselstein", latitude: 52.0217, longitude: 5.0435, active: true },
];

export const demoProducts: PersonalProduct[] = [
  { id: "kip", name: "Kipfilet", searchTerm: "kipfilet", kind: "category", allowHouseBrand: true, quantity: 1, unit: "kilogram", category: "Vlees", active: true },
  { id: "skyr", name: "Skyr naturel", searchTerm: "skyr naturel", kind: "category", preferredBrand: "Arla", allowHouseBrand: true, quantity: 1, unit: "kilogram", category: "Zuivel", active: true },
  { id: "pasta", name: "Pasta penne", searchTerm: "penne", kind: "category", allowHouseBrand: true, quantity: 500, unit: "gram", category: "Pasta", active: true },
  { id: "eieren", name: "Scharreleieren", searchTerm: "scharreleieren", kind: "category", allowHouseBrand: true, quantity: 10, unit: "piece", category: "Eieren", active: true },
  { id: "hagelslag", name: "De Ruijter hagelslag puur", searchTerm: "De Ruijter hagelslag puur", kind: "exact", preferredBrand: "De Ruijter", allowHouseBrand: false, quantity: 390, unit: "gram", category: "Broodbeleg", active: true },
  { id: "rijst", name: "Basmati rijst", searchTerm: "basmati rijst", kind: "category", allowHouseBrand: true, quantity: 1, unit: "kilogram", category: "Rijst", active: true },
  { id: "hamburgers", name: "Runderhamburgers", searchTerm: "runderhamburgers", kind: "category", allowHouseBrand: true, quantity: 4, unit: "piece", category: "Vlees", active: false },
  { id: "piccolinis", name: "Dr. Oetker Piccolinis", searchTerm: "Dr Oetker Piccolinis", kind: "exact", preferredBrand: "Dr. Oetker", allowHouseBrand: false, quantity: 270, unit: "gram", category: "Diepvries", active: false },
];

type DemoOfferInput = {
  id: string;
  productId: string;
  productName: string;
  brand?: string;
  category: string;
  chainId: string;
  storeId: string;
  regular: number;
  action?: number;
  actionType?: OfferActionType;
  minimum?: number;
  discount?: number;
  houseBrand?: boolean;
};

const demoOffer = (input: DemoOfferInput): Offer => {
  const pricing = calculateEffectivePricing({
    regularPriceCents: input.regular,
    actionType: input.actionType ?? "none",
    actionPriceCents: input.action,
    minimumQuantity: input.minimum,
    discountPercentage: input.discount,
  });
  return {
    id: input.id,
    provider: "demo",
    sourceId: input.id,
    product: { id: input.productId, sourceProductId: input.productId, name: input.productName, brand: input.brand, category: input.category, isHouseBrand: input.houseBrand },
    chainId: input.chainId,
    storeId: input.storeId,
    regularPriceCents: input.regular,
    actionPriceCents: input.action,
    actionType: input.actionType ?? "none",
    discountPercentage: input.discount,
    minimumQuantity: pricing.minimumQuantity,
    effectiveUnitPriceCents: pricing.effectiveUnitPriceCents,
    payableTotalCents: pricing.payableTotalCents,
    validFrom: "2026-08-10",
    validUntil: "2026-08-16",
    lastSyncedAt: "2026-08-10T06:15:00.000Z",
    loyaltyCardRequired: input.actionType === "loyalty",
    confidence: "verified",
  };
};

export const demoOffers: Offer[] = [
  demoOffer({ id: "ah-kip", productId: "ah-kipfilet", productName: "AH Kipfilet ca. 800 g", category: "Vlees", chainId: "ah", storeId: "ah-neude", regular: 899, action: 674, actionType: "percentage", discount: 25, houseBrand: true }),
  demoOffer({ id: "lidl-kip", productId: "lidl-kipfilet", productName: "Lidl Kipfilet 1 kg", category: "Vlees", chainId: "lidl", storeId: "lidl-smaragdplein", regular: 829, houseBrand: true }),
  demoOffer({ id: "jumbo-kip", productId: "jumbo-kipfilet", productName: "Jumbo Kipfilet 800 g", category: "Vlees", chainId: "jumbo", storeId: "jumbo-merelstraat", regular: 875, action: 699, actionType: "loyalty", houseBrand: true }),
  demoOffer({ id: "ah-skyr", productId: "arla-skyr", productName: "Arla Skyr naturel 1 kg", brand: "Arla", category: "Zuivel", chainId: "ah", storeId: "ah-neude", regular: 398, actionType: "buy_one_get_one", minimum: 2 }),
  demoOffer({ id: "jumbo-skyr", productId: "jumbo-skyr", productName: "Jumbo Skyr naturel 1 kg", category: "Zuivel", chainId: "jumbo", storeId: "jumbo-merelstraat", regular: 229, houseBrand: true }),
  demoOffer({ id: "lidl-skyr", productId: "milbona-skyr", productName: "Milbona Skyr naturel 1 kg", brand: "Milbona", category: "Zuivel", chainId: "lidl", storeId: "lidl-smaragdplein", regular: 219, houseBrand: true }),
  demoOffer({ id: "ah-pasta", productId: "ah-penne", productName: "AH Penne 500 g", category: "Pasta", chainId: "ah", storeId: "ah-neude", regular: 109, action: 180, actionType: "multibuy_fixed", minimum: 2, houseBrand: true }),
  demoOffer({ id: "lidl-pasta", productId: "lidl-penne", productName: "Combino Penne 500 g", category: "Pasta", chainId: "lidl", storeId: "lidl-smaragdplein", regular: 89, houseBrand: true }),
  demoOffer({ id: "plus-pasta", productId: "plus-penne", productName: "PLUS Penne 500 g", category: "Pasta", chainId: "plus", storeId: "plus-voorstraat", regular: 99, houseBrand: true }),
  demoOffer({ id: "ah-eieren", productId: "ah-eieren", productName: "AH Scharreleieren M 10 stuks", category: "Eieren", chainId: "ah", storeId: "ah-neude", regular: 319, action: 255, actionType: "percentage", discount: 20, houseBrand: true }),
  demoOffer({ id: "aldi-eieren", productId: "aldi-eieren", productName: "Aldi Scharreleieren 10 stuks", category: "Eieren", chainId: "aldi", storeId: "aldi-admiraal", regular: 289, houseBrand: true }),
  demoOffer({ id: "jumbo-eieren", productId: "jumbo-eieren", productName: "Jumbo Scharreleieren 10 stuks", category: "Eieren", chainId: "jumbo", storeId: "jumbo-merelstraat", regular: 309, houseBrand: true }),
  demoOffer({ id: "ah-hagel", productId: "deruijter-hagel", productName: "De Ruijter Chocoladehagel puur 390 g", brand: "De Ruijter", category: "Broodbeleg", chainId: "ah", storeId: "ah-neude", regular: 439, actionType: "second_half_price", minimum: 2 }),
  demoOffer({ id: "jumbo-hagel", productId: "deruijter-hagel-j", productName: "De Ruijter Chocoladehagel puur 390 g", brand: "De Ruijter", category: "Broodbeleg", chainId: "jumbo", storeId: "jumbo-merelstraat", regular: 425 }),
  demoOffer({ id: "plus-hagel", productId: "deruijter-hagel-p", productName: "De Ruijter Hagelslag puur 390 g", brand: "De Ruijter", category: "Broodbeleg", chainId: "plus", storeId: "plus-voorstraat", regular: 429, action: 350, actionType: "loyalty" }),
  demoOffer({ id: "lidl-rijst", productId: "golden-sun-basmati", productName: "Golden Sun Basmati rijst 1 kg", category: "Rijst", chainId: "lidl", storeId: "lidl-smaragdplein", regular: 229, houseBrand: true }),
  demoOffer({ id: "aldi-rijst", productId: "aldi-basmati", productName: "Aldi Basmati rijst 1 kg", category: "Rijst", chainId: "aldi", storeId: "aldi-admiraal", regular: 239, houseBrand: true }),
  demoOffer({ id: "plus-rijst", productId: "plus-basmati", productName: "PLUS Basmati rijst 1 kg", category: "Rijst", chainId: "plus", storeId: "plus-voorstraat", regular: 279, action: 223, actionType: "percentage", discount: 20, houseBrand: true }),
];

const matchFor = (offer: Offer, productId: string) => {
  if (productId === "hagelslag") return "exact" as const;
  if (offer.product.isHouseBrand) return "house_brand" as const;
  return "comparable" as const;
};

const productByOfferId: Record<string, string> = {
  "ah-kip": "kip", "lidl-kip": "kip", "jumbo-kip": "kip",
  "ah-skyr": "skyr", "jumbo-skyr": "skyr", "lidl-skyr": "skyr",
  "ah-pasta": "pasta", "lidl-pasta": "pasta", "plus-pasta": "pasta",
  "ah-eieren": "eieren", "aldi-eieren": "eieren", "jumbo-eieren": "eieren",
  "ah-hagel": "hagelslag", "jumbo-hagel": "hagelslag", "plus-hagel": "hagelslag",
  "lidl-rijst": "rijst", "aldi-rijst": "rijst", "plus-rijst": "rijst",
};

export const demoShoppingOptions: ShoppingOption[] = demoOffers.map((offer) => {
  const productId = productByOfferId[offer.id];
  const requestedQuantity = 1;
  const store = demoStores.find((item) => item.id === offer.storeId)!;
  return {
    id: offer.id,
    productId,
    productName: demoProducts.find((product) => product.id === productId)?.name ?? offer.product.name,
    storeId: store.id,
    storeName: store.name,
    chainId: offer.chainId,
    priceCents: offer.payableTotalCents,
    payableQuantity: offer.minimumQuantity,
    requestedQuantity,
    matchType: matchFor(offer, productId),
    actionLabel: offer.actionType === "none" ? undefined : offer.actionType,
    warning: offer.minimumQuantity > requestedQuantity ? `Deze actie is alleen voordelig als je minstens ${offer.minimumQuantity} stuks wilt kopen.` : undefined,
  };
});

export const demoProfile = {
  id: "demo-user",
  name: "Sanne",
  locationLabel: "Utrecht Centrum",
  latitude: 52.0907,
  longitude: 5.1214,
  radiusKm: 5,
  emailPreference: "summary" as const,
  maxStores: 2 as number | null,
  enabledChainIds: ["ah", "jumbo", "lidl", "aldi", "plus", "dirk"],
  disabledStoreIds: [] as string[],
  onboardingCompleted: true,
  role: "admin" as const,
};
