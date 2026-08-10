import type { Offer, StoreLocation, SupermarketChain } from "@/domain/types";

export interface ProviderSyncResult {
  provider: string;
  offers: Offer[];
  imported: number;
  failed: number;
  completedAt: string;
}

export interface SupermarketDataProvider {
  readonly name: string;
  isConfigured(): boolean;
  getChains(): Promise<SupermarketChain[]>;
  getStores(): Promise<StoreLocation[]>;
  syncOffers(): Promise<ProviderSyncResult>;
}
