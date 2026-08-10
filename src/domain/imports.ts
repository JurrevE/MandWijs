import type { Offer } from "./types";

export interface ImportResult {
  records: Offer[];
  imported: number;
  updated: number;
  failed: number;
}

const uniqueKey = (offer: Offer) =>
  [offer.provider, offer.sourceId, offer.chainId, offer.storeId ?? "national", offer.validFrom].join(":");

export function mergeOfferImport(existing: Offer[], incoming: Offer[]): ImportResult {
  const records = new Map(existing.map((offer) => [uniqueKey(offer), offer]));
  let imported = 0;
  let updated = 0;
  let failed = 0;

  for (const offer of incoming) {
    if (!offer.sourceId || offer.effectiveUnitPriceCents < 0 || !offer.product?.id) {
      failed += 1;
      continue;
    }
    const key = uniqueKey(offer);
    if (records.has(key)) updated += 1;
    else imported += 1;
    records.set(key, offer);
  }

  return { records: [...records.values()], imported, updated, failed };
}
