import type { EmailPreference } from "./email";
import type { Offer, PersonalProduct, ShoppingOption, StoreLocation, SupermarketChain } from "./types";

export interface GroceryListItem {
  productId: string;
  quantity: number;
  note?: string;
  checked: boolean;
}

export interface AppProfile {
  name: string;
  locationLabel: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  emailPreference: EmailPreference;
  maxStores: number | null;
  enabledChainIds: string[];
  disabledStoreIds: string[];
  onboardingCompleted: boolean;
}

export interface PersistedState {
  products: PersonalProduct[];
  list: GroceryListItem[];
  profile: AppProfile;
  chains: SupermarketChain[];
  stores: StoreLocation[];
  offers: Offer[];
  shoppingOptions: ShoppingOption[];
  mode: "demo" | "supabase";
  userEmail: string;
  databaseReady: boolean;
  dataSource: "demo" | "live";
  dataUpdatedAt: string;
  dataWarnings: string[];
  persistenceError?: string;
}
