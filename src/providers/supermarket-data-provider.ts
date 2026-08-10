import type { Offer, StoreLocation, SupermarketChain } from "@/domain/types";

export interface ProviderSyncResult {
  provider: string;
  offers: Offer[];
  imported: number;
  failed: number;
  completedAt: string;
  source: "live" | "demo";
  warnings: string[];
}

export interface ProviderSyncOptions {
  queries?: string[];
  currentOnly?: boolean;
}

export interface SupermarketDataProvider {
  readonly name: string;
  isConfigured(): boolean;
  getChains(): Promise<SupermarketChain[]>;
  getStores(): Promise<StoreLocation[]>;
  syncOffers(options?: ProviderSyncOptions): Promise<ProviderSyncResult>;
}
