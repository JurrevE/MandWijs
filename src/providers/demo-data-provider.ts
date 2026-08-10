import { demoChains, demoOffers, demoStores } from "@/data/demo";
import type { SupermarketDataProvider } from "./supermarket-data-provider";

export class DemoDataProvider implements SupermarketDataProvider {
  readonly name = "demo";

  isConfigured() {
    return true;
  }

  async getChains() {
    return structuredClone(demoChains);
  }

  async getStores() {
    return structuredClone(demoStores);
  }

  async syncOffers() {
    return {
      provider: this.name,
      offers: structuredClone(demoOffers),
      imported: demoOffers.length,
      failed: 0,
      completedAt: new Date().toISOString(),
      source: "demo" as const,
      warnings: ["Demo-data actief; dit zijn geen actuele winkelprijzen."],
    };
  }
}
