import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import type { Offer } from "@/domain/types";
import type { SupermarketDataProvider } from "@/providers/supermarket-data-provider";
import { runWeeklyEmailJob } from "./weekly-email-job";

type Row = Record<string, unknown>;
type QueryResult = { data: Row[]; error: null };

class FakeQuery implements PromiseLike<QueryResult> {
  private readonly filters: Array<{ column: string; value: unknown; equal: boolean }> = [];

  constructor(private readonly table: string, private readonly tables: Record<string, Row[]>) {}

  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push({ column, value, equal: true }); return this; }
  neq(column: string, value: unknown) { this.filters.push({ column, value, equal: false }); return this; }
  order() { return this; }
  private rows() {
    return (this.tables[this.table] ?? []).filter((row) => this.filters.every((filter) => filter.equal
      ? row[filter.column] === filter.value
      : row[filter.column] !== filter.value));
  }
  maybeSingle() { return Promise.resolve({ data: this.rows()[0] ?? null, error: null }); }
  upsert(value: Row) {
    const rows = this.tables[this.table] ?? (this.tables[this.table] = []);
    const existing = rows.findIndex((row) => row.idempotency_key === value.idempotency_key);
    if (existing >= 0) rows[existing] = { ...rows[existing], ...value };
    else rows.push(value);
    return Promise.resolve({ data: null, error: null });
  }
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: this.rows(), error: null } as QueryResult).then(onfulfilled, onrejected);
  }
}

const liveOffer: Offer = {
  id: "offer-1",
  provider: "prijsprofeet",
  sourceId: "milk-1",
  product: { id: "provider-milk", name: "Verse melk", category: "Zuivel" },
  chainId: "albert-heijn",
  regularPriceCents: 149,
  actionType: "none",
  minimumQuantity: 1,
  effectiveUnitPriceCents: 149,
  payableTotalCents: 149,
  validFrom: "2026-08-10",
  validUntil: "2026-08-16",
  lastSyncedAt: "2026-08-10T06:00:00.000Z",
  loyaltyCardRequired: false,
  confidence: "likely",
};

describe("runWeeklyEmailJob", () => {
  it("maakt eerst een preview, verstuurt daarna eenmaal en bewaart de verzending", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const tables: Record<string, Row[]> = {
      supermarket_chains: [{ id: "chain-uuid", slug: "albert-heijn", name: "Albert Heijn", short_name: "AH", brand_color: "#169bd5", active: true }],
      profiles: [{ id: userId, display_name: "Jurre", latitude: 52, longitude: 5, radius_km: 5, max_stores: 2, email_preference: "full", onboarding_completed: true }],
      personal_products: [{ id: "product-1", user_id: userId, name: "Melk", search_term: "melk", kind: "category", preferred_brand: null, allow_house_brand: true, desired_quantity: 1, unit: "liter", category_label: "Zuivel", active: true, notes: null, expected_ean: null, expected_source_product_id: null, sort_order: 0 }],
      shopping_lists: [{ id: "list-1", user_id: userId, active: true }],
      shopping_list_items: [{ id: "item-1", list_id: "list-1", personal_product_id: "product-1", desired_quantity: 2, note: null, checked: false, sort_order: 0 }],
      user_chain_preferences: [],
      user_store_preferences: [],
      user_external_store_preferences: [],
      weekly_email_deliveries: [],
    };
    const fakeClient = {
      from: (table: string) => new FakeQuery(table, tables),
      auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { email: "jurre@example.com" } }, error: null })) } },
    } as unknown as SupabaseClient<Database>;
    const provider: SupermarketDataProvider = {
      name: "prijsprofeet",
      isConfigured: () => true,
      getChains: vi.fn(async () => []),
      getStores: vi.fn(async () => []),
      syncOffers: vi.fn(async () => ({ provider: "prijsprofeet", offers: [liveOffer], imported: 1, failed: 0, completedAt: "2026-08-10T06:00:00.000Z", source: "live" as const, warnings: [] })),
    };
    const locationProvider = {
      findNearbyStores: vi.fn(async () => ({
        stores: [{ id: "osm:node:1", chainId: "albert-heijn", name: "AH dichtbij", address: "Straat 1", postcode: "1000 AA", city: "Test", latitude: 52, longitude: 5, active: true, distanceKm: 0 }],
        attribution: "© OpenStreetMap contributors" as const,
        completedAt: "2026-08-10T06:00:00.000Z",
      })),
    };
    const send = vi.fn(async () => ({ id: "resend-1" }));
    const base = { supabase: fakeClient, provider, locationProvider, appUrl: "https://mandwijs.nl", userId, now: new Date("2026-08-10T07:00:00.000Z") };

    const preview = await runWeeklyEmailJob({ ...base, dryRun: true });
    expect(preview).toMatchObject({ previewed: 1, sent: 0, failed: 0 });
    expect(preview.results[0]).toMatchObject({ status: "preview", totalCents: 298, matched: 1 });
    expect(send).not.toHaveBeenCalled();
    expect(tables.weekly_email_deliveries).toHaveLength(0);

    const live = await runWeeklyEmailJob({ ...base, dryRun: false, emailSender: { send } });
    expect(live).toMatchObject({ previewed: 0, sent: 1, failed: 0 });
    expect(send).toHaveBeenCalledOnce();
    expect(tables.weekly_email_deliveries[0]).toMatchObject({ user_id: userId, provider_message_id: "resend-1", variant: "full" });

    const duplicate = await runWeeklyEmailJob({ ...base, dryRun: false, emailSender: { send } });
    expect(duplicate).toMatchObject({ sent: 0, skipped: 1 });
    expect(send).toHaveBeenCalledOnce();
  });
});
