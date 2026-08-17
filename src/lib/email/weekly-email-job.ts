import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { addNationalPriceLocations } from "@/domain/market-data";
import { currentWeekRange, isoWeek, shouldSendWeeklyEmail, weeklyEmailKey, type EmailPreference } from "@/domain/email";
import { buildWeeklyPlan } from "@/domain/weekly-plan";
import { isOfferCurrentOnDate } from "@/domain/offer-validity";
import { renderWeeklyEmail } from "@/emails/weekly-email";
import type { AppProfile, GroceryListItem } from "@/domain/app-state";
import type { Offer, PersonalProduct, SupermarketChain } from "@/domain/types";
import type { Database, ProfileRow } from "@/lib/supabase/database.types";
import type { EmailSender } from "./resend-client";
import type { SupermarketDataProvider } from "@/providers/supermarket-data-provider";
import type { OpenStreetMapLocationProvider } from "@/providers/openstreetmap-location-provider";

type LocationProvider = Pick<OpenStreetMapLocationProvider, "findNearbyStores">;
type WeeklyProfile = Pick<ProfileRow, "id" | "display_name" | "latitude" | "longitude" | "radius_km" | "max_stores" | "email_preference">;

interface WeeklyContext {
  userId: string;
  name: string;
  preference: Exclude<EmailPreference, "none">;
  products: PersonalProduct[];
  items: GroceryListItem[];
  profile: Pick<AppProfile, "latitude" | "longitude" | "radiusKm" | "maxStores" | "enabledChainIds" | "disabledStoreIds">;
}

export interface WeeklyEmailJobOptions {
  supabase: SupabaseClient<Database>;
  provider: SupermarketDataProvider;
  locationProvider: LocationProvider;
  emailSender?: EmailSender;
  appUrl: string;
  dryRun: boolean;
  userId?: string;
  now?: Date;
  storePenaltyCents?: number;
}

const appUrlSchema = z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol));

const chunk = <T>(values: T[], size: number) => Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size));

async function loadWeeklyContext(
  supabase: SupabaseClient<Database>,
  profile: WeeklyProfile,
  chainSlugById: Map<string, string>,
  chains: SupermarketChain[],
): Promise<WeeklyContext> {
  const [productsResult, listResult, chainPreferencesResult, storePreferencesResult, externalStorePreferencesResult] = await Promise.all([
    supabase.from("personal_products").select("*").eq("user_id", profile.id).eq("active", true).order("sort_order"),
    supabase.from("shopping_lists").select("*").eq("user_id", profile.id).eq("active", true).maybeSingle(),
    supabase.from("user_chain_preferences").select("*").eq("user_id", profile.id),
    supabase.from("user_store_preferences").select("*").eq("user_id", profile.id),
    supabase.from("user_external_store_preferences").select("*").eq("user_id", profile.id),
  ]);
  const firstError = productsResult.error ?? listResult.error ?? chainPreferencesResult.error ?? storePreferencesResult.error ?? externalStorePreferencesResult.error;
  if (firstError) throw new Error("Accountdata voor de weekmail kon niet worden gelezen.");

  const listId = listResult.data?.id;
  const listItemsResult = listId
    ? await supabase.from("shopping_list_items").select("*").eq("list_id", listId).eq("checked", false).order("sort_order")
    : { data: [], error: null };
  if (listItemsResult.error) throw new Error("De actieve boodschappenlijst kon niet worden gelezen.");

  const products: PersonalProduct[] = (productsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    searchTerm: row.search_term,
    kind: row.kind,
    preferredBrand: row.preferred_brand ?? undefined,
    allowHouseBrand: row.allow_house_brand,
    quantity: Number(row.desired_quantity),
    unit: row.unit,
    category: row.category_label,
    active: row.active,
    notes: row.notes ?? undefined,
    expectedEan: row.expected_ean ?? undefined,
    expectedSourceProductId: row.expected_source_product_id ?? undefined,
  }));
  const items: GroceryListItem[] = (listItemsResult.data ?? []).map((row) => ({
    productId: row.personal_product_id,
    quantity: Number(row.desired_quantity),
    note: row.note ?? undefined,
    checked: row.checked,
  }));
  const disabledChainIds = new Set((chainPreferencesResult.data ?? [])
    .filter((row) => !row.enabled)
    .map((row) => chainSlugById.get(row.chain_id) ?? row.chain_id));

  if (profile.email_preference === "none") throw new Error("De maandagmail staat uit.");
  return {
    userId: profile.id,
    name: profile.display_name || "daar",
    preference: profile.email_preference,
    products,
    items,
    profile: {
      latitude: profile.latitude,
      longitude: profile.longitude,
      radiusKm: profile.radius_km,
      maxStores: profile.max_stores,
      enabledChainIds: chains.map((chain) => chain.id).filter((id) => !disabledChainIds.has(id)),
      disabledStoreIds: [
        ...(storePreferencesResult.data ?? []).filter((row) => !row.enabled).map((row) => row.store_id),
        ...(externalStorePreferencesResult.data ?? []).filter((row) => !row.enabled).map((row) => row.external_store_id),
      ],
    },
  };
}

async function syncLiveOffers(provider: SupermarketDataProvider, queries: string[], asOf: Date) {
  if (!provider.isConfigured() || provider.name === "demo") throw new Error("Een live prijsprovider is vereist voor de maandagmail.");
  const offers = new Map<string, Offer>();
  const warnings: string[] = [];
  for (const queryChunk of chunk(queries, 25)) {
    const result = await provider.syncOffers({ queries: queryChunk, currentOnly: true, asOf });
    if (result.source !== "live") throw new Error("De prijsprovider schakelde terug naar demo-data; er wordt niets verzonden.");
    result.offers.forEach((offer) => offers.set(offer.id, offer));
    warnings.push(...result.warnings);
  }
  return {
    offers: [...offers.values()].filter((offer) => isOfferCurrentOnDate(offer, asOf)),
    warnings: [...new Set(warnings)],
  };
}

export async function runWeeklyEmailJob(options: WeeklyEmailJobOptions) {
  if (typeof window !== "undefined") throw new Error("De weekmailtaak mag alleen server-side worden uitgevoerd.");
  const appUrl = appUrlSchema.parse(options.appUrl).replace(/\/$/, "");
  const now = options.now ?? new Date();
  const week = isoWeek(now);
  const range = currentWeekRange(now);
  const results: Array<{ userId: string; status: "preview" | "sent" | "skipped" | "failed"; reason?: string; subject?: string; totalCents?: number; matched?: number; unmatched?: number }> = [];

  const [chainsResult, profilesResult, deliveriesResult] = await Promise.all([
    options.supabase.from("supermarket_chains").select("*").eq("active", true).order("name"),
    (() => {
      let query = options.supabase.from("profiles").select("id, display_name, latitude, longitude, radius_km, max_stores, email_preference").neq("email_preference", "none").eq("onboarding_completed", true);
      if (options.userId) query = query.eq("id", options.userId);
      return query;
    })(),
    options.supabase.from("weekly_email_deliveries").select("user_id").eq("week_key", week),
  ]);
  if (chainsResult.error) throw new Error("Supermarktketens konden niet worden gelezen.");
  if (profilesResult.error) throw new Error("Weekmailprofielen konden niet worden gelezen.");
  if (deliveriesResult.error) throw new Error("De verzendgeschiedenis kon niet worden gelezen.");

  const chainRows = chainsResult.data ?? [];
  if (!chainRows.length) throw new Error("Er zijn geen actieve supermarktketens geconfigureerd.");
  const chainSlugById = new Map(chainRows.map((row) => [row.id, row.slug]));
  const chains: SupermarketChain[] = chainRows.map((row) => ({
    id: row.slug,
    name: row.name,
    shortName: row.short_name,
    color: row.brand_color ?? "#2f6c59",
    active: row.active,
  }));
  const deliveredUserIds = new Set((deliveriesResult.data ?? []).map((row) => row.user_id));

  const contexts: WeeklyContext[] = [];
  for (const profile of profilesResult.data ?? []) {
    if (!options.dryRun && deliveredUserIds.has(profile.id)) {
      results.push({ userId: profile.id, status: "skipped", reason: "Deze week is al een mail verzonden." });
      continue;
    }
    try {
      const context = await loadWeeklyContext(options.supabase, profile, chainSlugById, chains);
      const activeProductIds = new Set(context.products.filter((product) => product.active).map((product) => product.id));
      const hasActiveItems = context.items.some((item) => !item.checked && activeProductIds.has(item.productId));
      if (!shouldSendWeeklyEmail(context.preference, hasActiveItems)) {
        results.push({ userId: profile.id, status: "skipped", reason: "Geen actieve producten op de boodschappenlijst." });
        continue;
      }
      contexts.push(context);
    } catch (error) {
      results.push({ userId: profile.id, status: "failed", reason: error instanceof Error ? error.message : "Accountdata laden is mislukt." });
    }
  }

  const queries = [...new Set(contexts.flatMap((context) => {
    const itemProductIds = new Set(context.items.map((item) => item.productId));
    return context.products.filter((product) => itemProductIds.has(product.id)).map((product) => product.searchTerm.trim());
  }).filter(Boolean))];
  const marketData = queries.length ? await syncLiveOffers(options.provider, queries, now) : { offers: [], warnings: [] };

  for (const context of contexts) {
    try {
      const physicalStores = context.profile.latitude != null && context.profile.longitude != null
        ? (await options.locationProvider.findNearbyStores({
            latitude: context.profile.latitude,
            longitude: context.profile.longitude,
            radiusKm: context.profile.radiusKm,
          })).stores
        : [];
      const stores = addNationalPriceLocations(chains, physicalStores);
      const plan = buildWeeklyPlan({
        products: context.products,
        items: context.items,
        profile: context.profile,
        chains,
        stores,
        offers: marketData.offers,
        storePenaltyCents: options.storePenaltyCents,
      });
      if (!plan.options.length) {
        results.push({ userId: context.userId, status: "skipped", reason: "Geen betrouwbare actuele prijs- en winkelmatches gevonden." });
        continue;
      }
      const productNameById = new Map(context.products.map((product) => [product.id, product.name]));
      const unmatchedProductNames = plan.unmatchedProductIds.map((id) => productNameById.get(id) ?? "Onbekend product");
      const email = renderWeeklyEmail({
        name: context.name,
        preference: context.preference,
        plan,
        unmatchedProductNames,
        ...range,
        dashboardUrl: `${appUrl}/dashboard`,
        unsubscribeUrl: `${appUrl}/instellingen`,
      });

      if (options.dryRun) {
        results.push({ userId: context.userId, status: "preview", subject: email.subject, totalCents: plan.totalCents, matched: plan.options.length, unmatched: plan.unmatchedProductIds.length });
        continue;
      }
      if (!options.emailSender) throw new Error("De e-mailprovider is niet geconfigureerd.");
      const { data: authUser, error: authError } = await options.supabase.auth.admin.getUserById(context.userId);
      if (authError || !authUser.user?.email) throw new Error("Het e-mailadres van dit account is niet beschikbaar.");
      const idempotencyKey = weeklyEmailKey(context.userId, week);
      const sent = await options.emailSender.send({
        to: authUser.user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        idempotencyKey,
      });
      const { error: deliveryError } = await options.supabase.from("weekly_email_deliveries").upsert({
        user_id: context.userId,
        week_key: week,
        idempotency_key: idempotencyKey,
        variant: context.preference,
        provider_message_id: sent.id,
        sent_at: new Date().toISOString(),
      }, { onConflict: "idempotency_key" });
      if (deliveryError) throw new Error("De mail is verzonden, maar de verzendgeschiedenis kon niet worden opgeslagen.");
      results.push({ userId: context.userId, status: "sent", subject: email.subject, totalCents: plan.totalCents, matched: plan.options.length, unmatched: plan.unmatchedProductIds.length });
    } catch (error) {
      results.push({ userId: context.userId, status: "failed", reason: error instanceof Error ? error.message : "Weekmail verwerken is mislukt." });
    }
  }

  return {
    week,
    dryRun: options.dryRun,
    selected: (profilesResult.data ?? []).length,
    previewed: results.filter((result) => result.status === "preview").length,
    sent: results.filter((result) => result.status === "sent").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
    providerWarnings: marketData.warnings,
    results,
  };
}
