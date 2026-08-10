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

export async function syncOffersWithFallback(queries: string[]) {
  const provider = getSupermarketDataProvider();
  try {
    return await provider.syncOffers({ queries, currentOnly: true });
  } catch (error) {
    const fallback = await new DemoDataProvider().syncOffers();
    return {
      ...fallback,
      warnings: [
        `Live provider niet beschikbaar: ${error instanceof Error ? error.message : "onbekende fout"}`,
        ...fallback.warnings,
      ],
    };
  }
}
