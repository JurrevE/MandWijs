export type ProductKind = "exact" | "category";
export type ProductUnit = "piece" | "gram" | "kilogram" | "milliliter" | "liter";
export type MatchType = "exact" | "comparable" | "house_brand" | "none";

export type OfferActionType =
  | "none"
  | "percentage"
  | "buy_one_get_one"
  | "multibuy_fixed"
  | "second_half_price"
  | "second_free"
  | "multipack"
  | "loyalty"
  | "unknown";

export interface PersonalProduct {
  id: string;
  name: string;
  searchTerm: string;
  kind: ProductKind;
  preferredBrand?: string;
  allowHouseBrand: boolean;
  quantity: number;
  unit: ProductUnit;
  category: string;
  active: boolean;
  notes?: string;
  expectedEan?: string;
  expectedSourceProductId?: string;
}

export interface SupermarketChain {
  id: string;
  name: string;
  shortName: string;
  color: string;
  active: boolean;
}

export interface StoreLocation {
  id: string;
  chainId: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  openingHours?: string;
  active: boolean;
}

export interface ProviderProduct {
  id: string;
  sourceProductId?: string;
  ean?: string;
  name: string;
  brand?: string;
  category: string;
  packageQuantity?: number;
  packageUnit?: ProductUnit;
  isHouseBrand?: boolean;
}

export interface Offer {
  id: string;
  provider: string;
  sourceId: string;
  product: ProviderProduct;
  chainId: string;
  storeId?: string;
  regularPriceCents: number;
  actionPriceCents?: number;
  actionType: OfferActionType;
  discountPercentage?: number;
  minimumQuantity: number;
  effectiveUnitPriceCents: number;
  payableTotalCents: number;
  validFrom: string;
  validUntil: string;
  sourceUrl?: string;
  lastSyncedAt: string;
  loyaltyCardRequired: boolean;
  confidence: "verified" | "likely" | "uncertain";
}

export interface ProductMatch {
  userProductId: string;
  providerProductId?: string;
  matchType: MatchType;
  confidence: number;
  source: string;
  reason: string;
  updatedAt: string;
  adminOverride?: boolean;
}

export interface ShoppingOption {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  chainId: string;
  priceCents: number;
  payableQuantity: number;
  requestedQuantity: number;
  matchType: MatchType;
  actionLabel?: string;
  warning?: string;
}

export interface ShoppingPlan {
  id: string;
  label: string;
  description: string;
  totalCents: number;
  scoreCents: number;
  storeCount: number;
  savingsCents: number;
  options: ShoppingOption[];
  unmatchedProductIds: string[];
}
