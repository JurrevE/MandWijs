import "server-only";

import { cookies } from "next/headers";
import { createDemoState } from "@/data/initial-state";
import { demoChains, demoStores } from "@/data/demo";
import { addNationalPriceLocations } from "@/domain/market-data";
import type { PersistedState } from "@/domain/app-state";
import type { PersonalProduct, StoreLocation, SupermarketChain } from "@/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const openingHoursLabel = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const monday = (value as Record<string, unknown>).monday;
  return typeof monday === "string" ? `Maandag ${monday}` : undefined;
};

export async function loadInitialAppState(): Promise<PersistedState> {
  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("mandwijs_demo_session")?.value;
  const supabase = await createSupabaseServerClient();
  const { data: authData } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const user = authData.user;
  if (!supabase || !user) return createDemoState(demoEmail);

  const [profileResult, productsResult, listResult, chainsResult, storesResult, chainPreferencesResult, storePreferencesResult, externalStorePreferencesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("personal_products").select("*").order("sort_order").order("created_at"),
    supabase.from("shopping_lists").select("*").eq("active", true).maybeSingle(),
    supabase.from("supermarket_chains").select("*").eq("active", true).order("name"),
    supabase.from("stores").select("*").eq("active", true).order("name"),
    supabase.from("user_chain_preferences").select("*"),
    supabase.from("user_store_preferences").select("*"),
    supabase.from("user_external_store_preferences").select("*"),
  ]);

  const databaseReady = !profileResult.error && Boolean(profileResult.data);
  const profileRow = profileResult.data;
  const chainRows = chainsResult.data ?? [];
  const chainSlugById = new Map(chainRows.map((row) => [row.id, row.slug]));
  const chains: SupermarketChain[] = chainRows.length
    ? chainRows.map((row) => ({
        id: row.slug,
        name: row.name,
        shortName: row.short_name,
        color: row.brand_color ?? "#2f6c59",
        active: row.active,
      }))
    : structuredClone(demoChains);
  const stores: StoreLocation[] = (storesResult.data ?? []).map((row) => ({
    id: row.id,
    chainId: chainSlugById.get(row.chain_id) ?? row.chain_id,
    name: row.name,
    address: row.address,
    postcode: row.postcode,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    openingHours: openingHoursLabel(row.opening_hours),
    active: row.active,
  }));
  const resolvedStores = addNationalPriceLocations(chains, stores.length ? stores : structuredClone(demoStores));

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

  const listId = listResult.data?.id;
  const listItemsResult = listId
    ? await supabase.from("shopping_list_items").select("*").eq("list_id", listId).order("sort_order").order("created_at")
    : { data: [], error: null };
  const disabledChainIds = new Set((chainPreferencesResult.data ?? [])
    .filter((row) => !row.enabled)
    .map((row) => chainSlugById.get(row.chain_id) ?? row.chain_id));

  const fallbackName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "MandWijs-gebruiker";
  const warnings = [
    ...(!databaseReady ? ["Supabase-tabellen ontbreken nog. Voer eerst de migratie uit."] : []),
    ...(chainsResult.error || storesResult.error ? ["Supabase-seeddata is niet volledig beschikbaar; interne filialen worden tijdelijk getoond."] : []),
  ];

  return {
    products,
    list: (listItemsResult.data ?? []).map((row) => ({
      productId: row.personal_product_id,
      quantity: Number(row.desired_quantity),
      note: row.note ?? undefined,
      checked: row.checked,
    })),
    profile: {
      name: profileRow?.display_name || fallbackName,
      locationLabel: profileRow?.location_label ?? "Nog niet ingesteld",
      latitude: profileRow?.latitude ?? null,
      longitude: profileRow?.longitude ?? null,
      radiusKm: profileRow?.radius_km ?? 5,
      emailPreference: profileRow?.email_preference ?? "summary",
      maxStores: profileRow?.max_stores ?? null,
      enabledChainIds: chains.map((chain) => chain.id).filter((id) => !disabledChainIds.has(id)),
      disabledStoreIds: [
        ...(storePreferencesResult.data ?? []).filter((row) => !row.enabled).map((row) => row.store_id),
        ...(externalStorePreferencesResult.data ?? []).filter((row) => !row.enabled).map((row) => row.external_store_id),
      ],
      onboardingCompleted: profileRow?.onboarding_completed ?? false,
    },
    chains,
    stores: resolvedStores,
    offers: [],
    shoppingOptions: [],
    mode: "supabase",
    userEmail: user.email ?? "",
    databaseReady,
    dataSource: "demo",
    dataUpdatedAt: new Date().toISOString(),
    dataWarnings: warnings,
    storeDataSource: "seed",
    storeDataUpdatedAt: new Date().toISOString(),
    storeWarnings: [
      ...(externalStorePreferencesResult.error ? ["Voer de migratie voor externe winkelvoorkeuren uit."] : []),
      "Winkels worden na het laden voor jouw locatie ververst.",
    ],
  };
}
