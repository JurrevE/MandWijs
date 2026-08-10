-- Kopert production schema — run with `supabase db reset` locally or `supabase db push` remotely.
create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'admin');
create type public.product_kind as enum ('exact', 'category');
create type public.product_unit as enum ('piece', 'gram', 'kilogram', 'milliliter', 'liter');
create type public.email_preference as enum ('none', 'summary', 'full');
create type public.match_type as enum ('exact', 'comparable', 'house_brand', 'none');
create type public.offer_action_type as enum ('none', 'percentage', 'buy_one_get_one', 'multibuy_fixed', 'second_half_price', 'second_free', 'multipack', 'loyalty', 'unknown');
create type public.confidence_status as enum ('verified', 'likely', 'uncertain');
create type public.sync_status as enum ('running', 'succeeded', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'user',
  location_label text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  radius_km integer not null default 5 check (radius_km in (1, 2, 5, 10, 25)),
  max_stores integer check (max_stores between 1 and 3),
  email_preference public.email_preference not null default 'summary',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supermarket_chains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  short_name text not null,
  brand_color text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.supermarket_chains(id) on delete cascade,
  external_id text,
  name text not null,
  address text not null,
  postcode text not null,
  city text not null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  opening_hours jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, external_id)
);
create index stores_chain_id_idx on public.stores(chain_id);
create index stores_coordinates_idx on public.stores(latitude, longitude) where latitude is not null and longitude is not null;

create table public.user_chain_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  chain_id uuid not null references public.supermarket_chains(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, chain_id)
);

create table public.user_store_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.personal_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  search_term text not null check (char_length(search_term) between 1 and 160),
  kind public.product_kind not null,
  preferred_brand text,
  allow_house_brand boolean not null default true,
  desired_quantity numeric(12, 3) not null check (desired_quantity > 0),
  unit public.product_unit not null,
  category_id uuid references public.product_categories(id) on delete set null,
  category_label text not null,
  expected_ean text check (expected_ean is null or expected_ean ~ '^[0-9]{8,14}$'),
  expected_source_product_id text,
  active boolean not null default true,
  notes text check (notes is null or char_length(notes) <= 1000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index personal_products_user_active_idx on public.personal_products(user_id, active, sort_order);
create index personal_products_search_idx on public.personal_products using gin (to_tsvector('simple', name || ' ' || search_term));

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Mijn boodschappenlijst',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_active_list_per_user on public.shopping_lists(user_id) where active;

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  personal_product_id uuid not null references public.personal_products(id) on delete cascade,
  desired_quantity numeric(12, 3) not null check (desired_quantity > 0),
  selected_offer_id uuid,
  note text check (note is null or char_length(note) <= 1000),
  checked boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, personal_product_id)
);
create index shopping_list_items_list_idx on public.shopping_list_items(list_id, checked, sort_order);

create table public.provider_products (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  source_product_id text not null,
  ean text,
  name text not null,
  brand text,
  category text not null,
  package_quantity numeric(12, 3),
  package_unit public.product_unit,
  is_house_brand boolean not null default false,
  raw_data jsonb,
  last_synced_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, source_product_id)
);
create index provider_products_ean_idx on public.provider_products(ean) where ean is not null;
create index provider_products_category_idx on public.provider_products(category);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  source_offer_id text not null,
  provider_product_id uuid not null references public.provider_products(id) on delete cascade,
  chain_id uuid not null references public.supermarket_chains(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  regular_price_cents integer not null check (regular_price_cents >= 0),
  action_price_cents integer check (action_price_cents >= 0),
  price_unit text not null default 'piece',
  package_unit text,
  action_type public.offer_action_type not null default 'none',
  discount_percentage numeric(5, 2) check (discount_percentage between 0 and 100),
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  effective_unit_price_cents integer not null check (effective_unit_price_cents >= 0),
  payable_total_cents integer not null check (payable_total_cents >= 0),
  valid_from date not null,
  valid_until date not null check (valid_until >= valid_from),
  source_url text,
  last_synced_at timestamptz not null,
  loyalty_card_required boolean not null default false,
  confidence public.confidence_status not null default 'likely',
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index offers_idempotency_idx on public.offers(provider, source_offer_id, chain_id, coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid), valid_from);
create index offers_active_lookup_idx on public.offers(chain_id, valid_from, valid_until);
create index offers_product_price_idx on public.offers(provider_product_id, effective_unit_price_cents);
alter table public.shopping_list_items add constraint shopping_list_items_selected_offer_fk foreign key (selected_offer_id) references public.offers(id) on delete set null;

create table public.product_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  personal_product_id uuid not null references public.personal_products(id) on delete cascade,
  provider_product_id uuid references public.provider_products(id) on delete cascade,
  match_type public.match_type not null,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  source text not null,
  reason text not null,
  admin_override boolean not null default false,
  corrected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (personal_product_id, provider_product_id)
);
create index product_matches_user_idx on public.product_matches(user_id, match_type, confidence desc);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  status public.sync_status not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  imported_count integer not null default 0 check (imported_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index sync_runs_provider_started_idx on public.sync_runs(provider, started_at desc);

create table public.weekly_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_key text not null,
  idempotency_key text not null unique,
  variant public.email_preference not null default 'summary' check (variant <> 'none'),
  provider_message_id text,
  sent_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_key)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$ select coalesce((select role from public.profiles where id = auth.uid()), 'user'::public.app_role); $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  insert into public.shopping_lists (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','supermarket_chains','stores','user_chain_preferences','user_store_preferences','product_categories','personal_products','shopping_lists','shopping_list_items','provider_products','offers','product_matches']
  loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', table_name, table_name); end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.supermarket_chains enable row level security;
alter table public.stores enable row level security;
alter table public.user_chain_preferences enable row level security;
alter table public.user_store_preferences enable row level security;
alter table public.product_categories enable row level security;
alter table public.personal_products enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.provider_products enable row level security;
alter table public.offers enable row level security;
alter table public.product_matches enable row level security;
alter table public.sync_runs enable row level security;
alter table public.weekly_email_deliveries enable row level security;

create policy "profiles own read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = public.current_user_role());

create policy "authenticated read chains" on public.supermarket_chains for select to authenticated using (true);
create policy "authenticated read stores" on public.stores for select to authenticated using (true);
create policy "authenticated read categories" on public.product_categories for select to authenticated using (true);
create policy "authenticated read provider products" on public.provider_products for select to authenticated using (true);
create policy "authenticated read offers" on public.offers for select to authenticated using (true);

create policy "admin manage chains" on public.supermarket_chains for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage stores" on public.stores for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage categories" on public.product_categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage provider products" on public.provider_products for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage offers" on public.offers for all using (public.is_admin()) with check (public.is_admin());

create policy "own chain preferences" on public.user_chain_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own store preferences" on public.user_store_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own products" on public.personal_products for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own lists" on public.shopping_lists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own list items" on public.shopping_list_items for all using (exists (select 1 from public.shopping_lists l where l.id = list_id and l.user_id = auth.uid())) with check (exists (select 1 from public.shopping_lists l where l.id = list_id and l.user_id = auth.uid()));
create policy "own matches read" on public.product_matches for select using (user_id = auth.uid() or public.is_admin());
create policy "admin manage matches" on public.product_matches for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read syncs" on public.sync_runs for select using (public.is_admin());
create policy "admin manage syncs" on public.sync_runs for all using (public.is_admin()) with check (public.is_admin());
create policy "own delivery history" on public.weekly_email_deliveries for select using (user_id = auth.uid() or public.is_admin());

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;
