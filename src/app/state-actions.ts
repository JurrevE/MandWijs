"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

const productSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(160),
  searchTerm: z.string().trim().min(1).max(160),
  kind: z.enum(["exact", "category"]),
  preferredBrand: z.string().trim().max(160).optional(),
  allowHouseBrand: z.boolean(),
  quantity: z.number().positive(),
  unit: z.enum(["piece", "gram", "kilogram", "milliliter", "liter"]),
  category: z.string().trim().min(1).max(160),
  active: z.boolean(),
  notes: z.string().max(1000).optional(),
  expectedEan: z.string().regex(/^\d{8,14}$/).optional(),
  expectedSourceProductId: z.string().max(255).optional(),
});

const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  locationLabel: z.string().trim().min(1).max(255).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  radiusKm: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(10), z.literal(25)]).optional(),
  emailPreference: z.enum(["none", "summary", "full"]).optional(),
  maxStores: z.union([z.literal(1), z.literal(2), z.literal(3), z.null()]).optional(),
  onboardingCompleted: z.boolean().optional(),
}).strict();

async function withUser<T>(operation: (context: { supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>; userId: string }) => Promise<T>): Promise<T> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is niet geconfigureerd.");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Je sessie is verlopen.");
  return operation({ supabase, userId: data.user.id });
}

const run = async (operation: () => Promise<void>): Promise<ActionResult> => {
  try {
    await operation();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Opslaan is mislukt." };
  }
};

async function activeListId() {
  return withUser(async ({ supabase, userId }) => {
    const existing = await supabase.from("shopping_lists").select("id").eq("active", true).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data.id;
    const created = await supabase.from("shopping_lists").insert({ user_id: userId }).select("id").single();
    if (created.error) throw created.error;
    return created.data.id;
  });
}

export async function persistProductAction(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const product = productSchema.parse(input);
    await withUser(async ({ supabase, userId }) => {
      const { error } = await supabase.from("personal_products").upsert({
        id: product.id,
        user_id: userId,
        name: product.name,
        search_term: product.searchTerm,
        kind: product.kind,
        preferred_brand: product.preferredBrand || null,
        allow_house_brand: product.allowHouseBrand,
        desired_quantity: product.quantity,
        unit: product.unit,
        category_label: product.category,
        expected_ean: product.expectedEan || null,
        expected_source_product_id: product.expectedSourceProductId || null,
        active: product.active,
        notes: product.notes || null,
      }, { onConflict: "id" });
      if (error) throw error;
    });
  });
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  return run(async () => withUser(async ({ supabase }) => {
    z.uuid().parse(id);
    const { error } = await supabase.from("personal_products").delete().eq("id", id);
    if (error) throw error;
  }));
}

export async function persistListItemAction(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const item = z.object({ productId: z.uuid(), quantity: z.number().positive(), note: z.string().max(1000).optional(), checked: z.boolean() }).parse(input);
    const listId = await activeListId();
    await withUser(async ({ supabase }) => {
      const { error } = await supabase.from("shopping_list_items").upsert({
        list_id: listId,
        personal_product_id: item.productId,
        desired_quantity: item.quantity,
        note: item.note || null,
        checked: item.checked,
      }, { onConflict: "list_id,personal_product_id" });
      if (error) throw error;
    });
  });
}

export async function deleteListItemAction(productId: string): Promise<ActionResult> {
  return run(async () => {
    z.uuid().parse(productId);
    const listId = await activeListId();
    await withUser(async ({ supabase }) => {
      const { error } = await supabase.from("shopping_list_items").delete().eq("list_id", listId).eq("personal_product_id", productId);
      if (error) throw error;
    });
  });
}

export async function clearListAction(): Promise<ActionResult> {
  return run(async () => {
    const listId = await activeListId();
    await withUser(async ({ supabase }) => {
      const { error } = await supabase.from("shopping_list_items").delete().eq("list_id", listId);
      if (error) throw error;
    });
  });
}

export async function persistProfileAction(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const patch = profilePatchSchema.parse(input);
    await withUser(async ({ supabase, userId }) => {
      const update = {
        ...(patch.name !== undefined && { display_name: patch.name }),
        ...(patch.locationLabel !== undefined && { location_label: patch.locationLabel }),
        ...(patch.latitude !== undefined && { latitude: patch.latitude }),
        ...(patch.longitude !== undefined && { longitude: patch.longitude }),
        ...(patch.radiusKm !== undefined && { radius_km: patch.radiusKm }),
        ...(patch.emailPreference !== undefined && { email_preference: patch.emailPreference }),
        ...(patch.maxStores !== undefined && { max_stores: patch.maxStores }),
        ...(patch.onboardingCompleted !== undefined && { onboarding_completed: patch.onboardingCompleted }),
      };
      const { error } = await supabase.from("profiles").update(update).eq("id", userId);
      if (error) throw error;
    });
  });
}

export async function persistChainPreferenceAction(chainSlug: string, enabled: boolean): Promise<ActionResult> {
  return run(async () => withUser(async ({ supabase, userId }) => {
    const slug = z.string().trim().min(1).max(100).parse(chainSlug);
    const chain = await supabase.from("supermarket_chains").select("id").eq("slug", slug).single();
    if (chain.error) throw chain.error;
    const { error } = await supabase.from("user_chain_preferences").upsert({ user_id: userId, chain_id: chain.data.id, enabled }, { onConflict: "user_id,chain_id" });
    if (error) throw error;
  }));
}

export async function persistStorePreferenceAction(storeId: string, enabled: boolean): Promise<ActionResult> {
  return run(async () => withUser(async ({ supabase, userId }) => {
    z.uuid().parse(storeId);
    const { error } = await supabase.from("user_store_preferences").upsert({ user_id: userId, store_id: storeId, enabled }, { onConflict: "user_id,store_id" });
    if (error) throw error;
  }));
}
