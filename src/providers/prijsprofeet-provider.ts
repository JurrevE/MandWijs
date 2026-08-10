import { z } from "zod";
import { calculateEffectivePricing } from "@/domain/pricing";
import type { Offer, OfferActionType, ProductUnit, SupermarketChain } from "@/domain/types";
import { DemoDataProvider } from "./demo-data-provider";
import type {
  ProviderSyncOptions,
  ProviderSyncResult,
  SupermarketDataProvider,
} from "./supermarket-data-provider";

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().finite().nullable().optional();
const promotionStatusSchema = z.enum(["active", "upcoming", "expired", "historical"]);
const providerTierSchema = z.enum(["free", "pro"]);

const productSearchResultSchema = z.object({
  product_id: z.string().min(1),
  base_product_id: nullableString,
  name: nullableString,
  title: nullableString,
  brand: nullableString,
  ean: nullableString,
  price: nullableNumber,
  original_price: nullableNumber,
  quantity: nullableString,
  unit: nullableString,
  unit_price: nullableNumber,
  effective_unit_price: nullableNumber,
  unit_normalized: nullableString,
  product_url: nullableString,
  image_url: nullableString,
  retailer: z.string().min(1),
  unified_category: nullableString,
  dietary_tags: z.array(z.string()).nullable().optional(),
  is_promotional: z.boolean().default(false),
  promotional_keywords: z.array(z.string()).nullable().optional(),
  promotional_labels: z.array(z.string()).nullable().optional(),
  promotion: nullableString,
  promotion_status: promotionStatusSchema.nullable().optional(),
  promotion_type: nullableString,
  savings_percentage: nullableNumber,
  savings_amount: nullableNumber,
  multi_buy_quantity: z.number().int().positive().nullable().optional(),
  multi_buy_price: nullableNumber,
  valid_from: nullableString,
  valid_until: nullableString,
  score: z.number().finite(),
  match_type: nullableString,
  match_confidence: nullableNumber,
});

const searchResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  query: z.string(),
  results: z.array(productSearchResultSchema),
});

const productResponseSchema = z.object({
  product_id: z.string().min(1),
  name: z.string().min(1),
  brand: nullableString,
  ean: nullableString,
  image_url: nullableString,
  price: z.number().finite().nonnegative(),
  original_price: nullableNumber,
  discount_percentage: nullableNumber,
  savings_amount: nullableNumber,
  savings_percentage: nullableNumber,
  currency: z.string().default("EUR"),
  quantity: nullableString,
  unit: nullableString,
  unit_price: nullableNumber,
  retailer_category: nullableString,
  unified_category: nullableString,
  dietary_tags: z.array(z.string()).default([]),
  private_label: z.boolean().nullable().optional(),
  nutriscore: nullableString,
  product_url: nullableString,
  retailer: z.string().min(1),
  folder_id: nullableString,
  page_number: z.number().int().nullable().optional(),
  is_promotional: z.boolean().default(false),
  promotion_type: nullableString,
  promotion_status: promotionStatusSchema.nullable().optional(),
  promotional_keywords: z.array(z.string()).default([]),
  valid_from: nullableString,
  valid_until: nullableString,
  extracted_at: z.string().min(1),
});

const productListResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  products: z.array(productResponseSchema),
});

const filterStatsSchema = z.object({
  retailers: z.record(z.string(), z.unknown()),
  statuses: z.record(z.string(), z.unknown()),
  categories: z.record(z.string(), z.unknown()),
  dietary: z.record(z.string(), z.unknown()).default({}),
  total: z.number().int().nonnegative(),
});
const opaqueMatchResponseSchema = z.record(z.string(), z.unknown());

type SearchProduct = z.infer<typeof productSearchResultSchema>;
type ProductResponse = z.infer<typeof productResponseSchema>;

const retailerPresentation: Record<string, Omit<SupermarketChain, "id">> = {
  "albert-heijn": { name: "Albert Heijn", shortName: "AH", color: "#169bd5", active: true },
  jumbo: { name: "Jumbo", shortName: "JU", color: "#f5c400", active: true },
  aldi: { name: "Aldi", shortName: "AL", color: "#193d84", active: true },
  lidl: { name: "Lidl", shortName: "LI", color: "#174b8b", active: true },
  plus: { name: "PLUS", shortName: "PL", color: "#78a22f", active: true },
  dirk: { name: "Dirk", shortName: "DI", color: "#de1f35", active: true },
  ekoplaza: { name: "Ekoplaza", shortName: "EK", color: "#5a8e36", active: true },
  hoogvliet: { name: "Hoogvliet", shortName: "HO", color: "#d71920", active: true },
  dekamarkt: { name: "DekaMarkt", shortName: "DE", color: "#e3282d", active: true },
  vomar: { name: "Vomar", shortName: "VO", color: "#f28021", active: true },
};

const toRetailerSlug = (retailer: string) => retailer.trim().toLowerCase().replace(/_/g, "-");
const euroToCents = (value: number) => Math.round(value * 100);
const broaderSearchQuery = (query: string) => {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return undefined;
  const candidate = words[0].replace(/[^\p{L}\p{N}.-]/gu, "").length >= 4
    ? words[0]
    : words.slice(0, 2).join(" ");
  return candidate.length >= 3 && candidate.toLocaleLowerCase("nl-NL") !== query.toLocaleLowerCase("nl-NL")
    ? candidate
    : undefined;
};
const isoDate = (value: string | null | undefined) => {
  if (!value) return undefined;
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value);
  return match?.[0];
};

const toProductUnit = (value: string | null | undefined): ProductUnit | undefined => {
  switch (value?.trim().toLowerCase()) {
    case "kg": return "kilogram";
    case "g": return "gram";
    case "l": return "liter";
    case "ml": return "milliliter";
    case "stuk": return "piece";
    default: return undefined;
  }
};

const parsePackage = (quantity: string | null | undefined, normalizedUnit: string | null | undefined) => {
  const match = quantity?.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|stuks?|stuk)$/i);
  const unit = toProductUnit(match?.[2] ?? normalizedUnit);
  if (!match || !unit) return { packageUnit: unit };
  return { packageQuantity: Number(match[1].replace(",", ".")), packageUnit: unit };
};

const toActionType = (isPromotional: boolean, type: string | null | undefined): OfferActionType => {
  if (!isPromotional) return "none";
  switch (type) {
    case "percentage": return "percentage";
    case "one_plus_one": return "buy_one_get_one";
    case "multi_buy": return "multibuy_fixed";
    case "volume": return "multipack";
    case "limited":
    case "starting":
    default: return "unknown";
  }
};

interface OfferFields {
  productId: string;
  name: string;
  brand?: string;
  ean?: string;
  retailer: string;
  category?: string;
  quantity?: string;
  normalizedUnit?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isPromotional: boolean;
  promotionType?: string;
  promotionStatus?: z.infer<typeof promotionStatusSchema>;
  minimumQuantity?: number;
  multiBuyPrice?: number;
  validFrom?: string;
  validUntil?: string;
  extractedAt?: string;
  productUrl?: string;
  privateLabel?: boolean;
}

function mapOffer(fields: OfferFields, currentOnly: boolean): Offer | null {
  if (fields.isPromotional && currentOnly && fields.promotionStatus !== "active") return null;
  if (fields.isPromotional && fields.promotionStatus && !["active", "upcoming"].includes(fields.promotionStatus)) return null;

  const extractedDate = isoDate(fields.extractedAt);
  const validFrom = isoDate(fields.validFrom) ?? extractedDate;
  const validUntil = isoDate(fields.validUntil) ?? validFrom;
  if (!validFrom || !validUntil || validUntil < validFrom) return null;

  const actionType = toActionType(fields.isPromotional, fields.promotionType);
  const regularPriceCents = euroToCents(fields.originalPrice ?? fields.price);
  const actionPriceCents = actionType === "buy_one_get_one"
    ? undefined
    : euroToCents(fields.multiBuyPrice ?? fields.price);
  const pricing = calculateEffectivePricing({
    regularPriceCents,
    actionType,
    actionPriceCents,
    discountPercentage: fields.discountPercentage,
    minimumQuantity: fields.minimumQuantity,
  });
  const chainId = toRetailerSlug(fields.retailer);
  const packageInfo = parsePackage(fields.quantity, fields.normalizedUnit);

  return {
    id: `prijsprofeet:${fields.productId}:${validFrom}`,
    provider: "prijsprofeet",
    sourceId: fields.productId,
    product: {
      id: `prijsprofeet:${fields.productId}`,
      sourceProductId: fields.productId,
      ean: fields.ean ?? undefined,
      name: fields.name,
      brand: fields.brand ?? undefined,
      category: fields.category ?? "overig",
      packageQuantity: packageInfo.packageQuantity,
      packageUnit: packageInfo.packageUnit,
      isHouseBrand: fields.privateLabel,
    },
    chainId,
    regularPriceCents,
    actionPriceCents: fields.isPromotional ? actionPriceCents : undefined,
    actionType,
    discountPercentage: fields.discountPercentage,
    minimumQuantity: pricing.minimumQuantity,
    effectiveUnitPriceCents: pricing.effectiveUnitPriceCents,
    payableTotalCents: pricing.payableTotalCents,
    validFrom,
    validUntil,
    sourceUrl: fields.productUrl ?? undefined,
    lastSyncedAt: fields.extractedAt ?? new Date().toISOString(),
    loyaltyCardRequired: false,
    confidence: fields.ean ? "verified" : "likely",
  };
}

const mapSearchProduct = (product: SearchProduct, currentOnly: boolean) => {
  const name = product.name ?? product.title;
  if (!name || product.price == null) return null;
  return mapOffer({
    productId: product.product_id,
    name,
    brand: product.brand ?? undefined,
    ean: product.ean ?? undefined,
    retailer: product.retailer,
    category: product.unified_category ?? undefined,
    quantity: product.quantity ?? undefined,
    normalizedUnit: product.unit_normalized ?? product.unit ?? undefined,
    price: product.price,
    originalPrice: product.original_price ?? undefined,
    discountPercentage: product.savings_percentage ?? undefined,
    isPromotional: product.is_promotional,
    promotionType: product.promotion_type ?? undefined,
    promotionStatus: product.promotion_status ?? undefined,
    minimumQuantity: product.multi_buy_quantity ?? undefined,
    multiBuyPrice: product.multi_buy_price ?? undefined,
    validFrom: product.valid_from ?? undefined,
    validUntil: product.valid_until ?? undefined,
    productUrl: product.product_url ?? undefined,
  }, currentOnly);
};

const mapProduct = (product: ProductResponse, currentOnly: boolean) => mapOffer({
  productId: product.product_id,
  name: product.name,
  brand: product.brand ?? undefined,
  ean: product.ean ?? undefined,
  retailer: product.retailer,
  category: product.unified_category ?? undefined,
  quantity: product.quantity ?? undefined,
  normalizedUnit: product.unit ?? undefined,
  price: product.price,
  originalPrice: product.original_price ?? undefined,
  discountPercentage: product.discount_percentage ?? product.savings_percentage ?? undefined,
  isPromotional: product.is_promotional,
  promotionType: product.promotion_type ?? undefined,
  promotionStatus: product.promotion_status ?? undefined,
  validFrom: product.valid_from ?? undefined,
  validUntil: product.valid_until ?? undefined,
  extractedAt: product.extracted_at,
  productUrl: product.product_url ?? undefined,
  privateLabel: product.private_label ?? undefined,
}, currentOnly);

interface PrijsProfeetProviderOptions {
  baseUrl?: string;
  apiKey?: string;
  tier?: z.infer<typeof providerTierSchema>;
  fetchImpl?: typeof fetch;
}

export class PrijsProfeetProvider implements SupermarketDataProvider {
  readonly name = "prijsprofeet";
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly tier: z.infer<typeof providerTierSchema>;
  private readonly fetchImpl: typeof fetch;

  constructor(options: PrijsProfeetProviderOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.PRIJSPROFEET_BASE_URL ?? "").replace(/\/$/, "");
    this.apiKey = (options.apiKey ?? process.env.PRIJSPROFEET_API_KEY) || undefined;
    this.tier = options.tier ?? providerTierSchema.catch("free").parse(process.env.PRIJSPROFEET_TIER);
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private hasProAccess() {
    return Boolean(this.apiKey && this.tier === "pro");
  }

  isConfigured() {
    try {
      return Boolean(this.baseUrl && new URL(this.baseUrl).protocol === "https:");
    } catch {
      return false;
    }
  }

  private async request<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    if (!this.isConfigured()) throw new Error("PRIJSPROFEET_BASE_URL ontbreekt of is ongeldig.");
    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "MandWijs/0.1 (+https://mandwijs.app)",
    };
    if (this.apiKey) headers["X-API-Key"] = this.apiKey;

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`PrijsProfeet gaf HTTP ${response.status}.`);
    return schema.parse(await response.json());
  }

  async getChains() {
    const data = await this.request("/api/v1/filter-stats", filterStatsSchema);
    return Object.keys(data.retailers).map((retailer) => {
      const id = toRetailerSlug(retailer);
      const presentation = retailerPresentation[id];
      return presentation
        ? { id, ...presentation }
        : { id, name: id.replace(/-/g, " "), shortName: id.slice(0, 2).toUpperCase(), color: "#2f6c59", active: true };
    });
  }

  async getStores() {
    // De OpenAPI-specificatie bevat geen filialenendpoint. We gebruiken daarom
    // uitsluitend de interne Supabase-/demo-filialen en claimen geen providerlocaties.
    return new DemoDataProvider().getStores();
  }

  async matchByEan(ean: string, currentOnly = true): Promise<Readonly<Record<string, unknown>> | null> {
    if (!this.hasProAccess()) return null;
    if (!/^\d{8,13}$/.test(ean)) throw new Error("EAN moet uit 8 tot 13 cijfers bestaan.");
    const params = new URLSearchParams({ current_only: String(currentOnly) });
    return this.request(`/api/v1/match/ean/${ean}?${params}`, opaqueMatchResponseSchema);
  }

  async syncOffers(options: ProviderSyncOptions = {}): Promise<ProviderSyncResult> {
    const queries = [...new Set((options.queries?.length ? options.queries : ["*"])
      .map((query) => query.trim())
      .filter(Boolean))].slice(0, 25);
    const currentOnly = options.currentOnly ?? true;
    const offers = new Map<string, Offer>();
    const verificationCandidateIds = new Set<string>();
    const warnings: string[] = [];
    if (this.tier !== "pro") {
      warnings.push(this.apiKey
        ? "PrijsProfeet Gratis actief; productdetails worden gecontroleerd, maar Pro /match/* en prijsgeschiedenis blijven uitgeschakeld."
        : "PrijsProfeet Gratis zonder key; publieke endpoints delen de IP-limiet en Pro /match/* blijft uitgeschakeld.");
    }
    let failed = 0;
    let successfulRequests = 0;

    for (const query of queries) {
      const encoded = encodeURIComponent(query);
      const searchQueries = [query, broaderSearchQuery(query)].filter((value): value is string => Boolean(value));

      for (const searchQuery of searchQueries) {
        const searchParams = new URLSearchParams({ q: searchQuery, page: "1", page_size: "100" });
        if (currentOnly) searchParams.set("promotion_status", "active");

        try {
          const search = await this.request(`/api/v1/search?${searchParams}`, searchResponseSchema);
          successfulRequests += 1;
          for (const product of search.results) {
            const offer = mapSearchProduct(product, currentOnly);
            if (offer) {
              offers.set(offer.id, offer);
              if (this.apiKey && offer.product.ean) verificationCandidateIds.add(offer.sourceId);
            }
            else failed += 1;
          }
        } catch (error) {
          failed += 1;
          warnings.push(`Actiezoekopdracht voor “${searchQuery}” is overgeslagen: ${error instanceof Error ? error.message : "onbekende fout"}`);
        }
      }

      try {
        const products = await this.request(`/api/v1/products/search/${encoded}?page=1&page_size=100`, productListResponseSchema);
        successfulRequests += 1;
        for (const product of products.products) {
          const offer = mapProduct(product, currentOnly);
          if (offer && !offers.has(offer.id)) offers.set(offer.id, offer);
          else if (!offer) failed += 1;
        }
      } catch (error) {
        failed += 1;
        warnings.push(`Productzoekopdracht voor “${query}” is overgeslagen: ${error instanceof Error ? error.message : "onbekende fout"}`);
      }
    }

    // Een gratis key geeft geen extra endpoints, maar wel genoeg eigen capaciteit
    // om de belangrijkste zoekhits via het gedocumenteerde productdetail te bevestigen.
    for (const productId of [...verificationCandidateIds].slice(0, 12)) {
      try {
        const detail = await this.request(`/api/v1/products/${encodeURIComponent(productId)}`, productResponseSchema);
        successfulRequests += 1;
        for (const [offerId, existing] of offers) {
          if (existing.sourceId === productId) offers.delete(offerId);
        }
        const verified = mapProduct(detail, currentOnly);
        if (verified) offers.set(verified.id, verified);
        else failed += 1;
      } catch (error) {
        failed += 1;
        warnings.push(`Productdetail voor “${productId}” kon niet worden bevestigd: ${error instanceof Error ? error.message : "onbekende fout"}`);
      }
    }

    if (successfulRequests === 0) throw new Error("Geen enkel gedocumenteerd PrijsProfeet-endpoint was bereikbaar.");
    return {
      provider: this.name,
      offers: [...offers.values()],
      imported: offers.size,
      failed,
      completedAt: new Date().toISOString(),
      source: "live",
      warnings,
    };
  }
}
