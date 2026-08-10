import type { SupermarketDataProvider } from "./supermarket-data-provider";

/**
 * Bewuste configuratiegrens voor PrijsProfeet.
 *
 * Er worden geen endpoints of responsevelden aangenomen. Implementeer de adapter pas
 * nadat officiële API-documentatie, gebruiksvoorwaarden en rate limits zijn ontvangen.
 */
export class PrijsProfeetProvider implements SupermarketDataProvider {
  readonly name = "prijsprofeet";

  isConfigured() {
    return Boolean(process.env.PRIJSPROFEET_API_KEY && process.env.PRIJSPROFEET_BASE_URL);
  }

  private unavailable(): never {
    throw new Error(
      "PrijsProfeet is nog niet aangesloten: officiële endpoint- en schemaspecificaties ontbreken.",
    );
  }

  async getChains() {
    return this.unavailable();
  }

  async getStores() {
    return this.unavailable();
  }

  async syncOffers() {
    return this.unavailable();
  }
}
