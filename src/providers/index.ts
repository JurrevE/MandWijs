import { DemoDataProvider } from "./demo-data-provider";
import { PrijsProfeetProvider } from "./prijsprofeet-provider";
import type { SupermarketDataProvider } from "./supermarket-data-provider";

export function getSupermarketDataProvider(): SupermarketDataProvider {
  if (process.env.PRICE_PROVIDER === "prijsprofeet") {
    const provider = new PrijsProfeetProvider();
    if (provider.isConfigured()) return provider;
  }
  return new DemoDataProvider();
}
