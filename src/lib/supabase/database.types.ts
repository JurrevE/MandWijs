export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert, Update> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: [];
};

export interface ProfileRow {
  id: string;
  display_name: string;
  role: "user" | "admin";
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  max_stores: number | null;
  email_preference: "none" | "summary" | "full";
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PersonalProductRow {
  id: string;
  user_id: string;
  name: string;
  search_term: string;
  kind: "exact" | "category";
  preferred_brand: string | null;
  allow_house_brand: boolean;
  desired_quantity: number;
  unit: "piece" | "gram" | "kilogram" | "milliliter" | "liter";
  category_id: string | null;
  category_label: string;
  expected_ean: string | null;
  expected_source_product_id: string | null;
  active: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListRow {
  id: string;
  user_id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItemRow {
  id: string;
  list_id: string;
  personal_product_id: string;
  desired_quantity: number;
  selected_offer_id: string | null;
  note: string | null;
  checked: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChainRow {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  brand_color: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreRow {
  id: string;
  chain_id: string;
  external_id: string | null;
  name: string;
  address: string;
  postcode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Json | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChainPreferenceRow {
  user_id: string;
  chain_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorePreferenceRow {
  user_id: string;
  store_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExternalStorePreferenceRow {
  user_id: string;
  external_store_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Partial<ProfileRow> & Pick<ProfileRow, "id">, Partial<ProfileRow>>;
      personal_products: Table<PersonalProductRow, Partial<PersonalProductRow> & Pick<PersonalProductRow, "id" | "user_id" | "name" | "search_term" | "kind" | "desired_quantity" | "unit" | "category_label">, Partial<PersonalProductRow>>;
      shopping_lists: Table<ShoppingListRow, Partial<ShoppingListRow> & Pick<ShoppingListRow, "user_id">, Partial<ShoppingListRow>>;
      shopping_list_items: Table<ShoppingListItemRow, Partial<ShoppingListItemRow> & Pick<ShoppingListItemRow, "list_id" | "personal_product_id" | "desired_quantity">, Partial<ShoppingListItemRow>>;
      supermarket_chains: Table<ChainRow, Partial<ChainRow> & Pick<ChainRow, "slug" | "name" | "short_name">, Partial<ChainRow>>;
      stores: Table<StoreRow, Partial<StoreRow> & Pick<StoreRow, "chain_id" | "name" | "address" | "postcode" | "city">, Partial<StoreRow>>;
      user_chain_preferences: Table<ChainPreferenceRow, Pick<ChainPreferenceRow, "user_id" | "chain_id" | "enabled">, Partial<ChainPreferenceRow>>;
      user_store_preferences: Table<StorePreferenceRow, Pick<StorePreferenceRow, "user_id" | "store_id" | "enabled">, Partial<StorePreferenceRow>>;
      user_external_store_preferences: Table<ExternalStorePreferenceRow, Pick<ExternalStorePreferenceRow, "user_id" | "external_store_id" | "enabled">, Partial<ExternalStorePreferenceRow>>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      current_user_role: { Args: Record<PropertyKey, never>; Returns: "user" | "admin" };
    };
    Enums: {
      app_role: "user" | "admin";
      product_kind: "exact" | "category";
      product_unit: "piece" | "gram" | "kilogram" | "milliliter" | "liter";
      email_preference: "none" | "summary" | "full";
    };
    CompositeTypes: Record<string, never>;
  };
};
