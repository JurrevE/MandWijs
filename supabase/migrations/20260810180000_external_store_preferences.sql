-- Bewaar voorkeuren voor dynamische OpenStreetMap-filialen zonder externe data
-- als globale store-records te hoeven importeren.
create table if not exists public.user_external_store_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  external_store_id text not null check (external_store_id ~ '^osm:(node|way|relation):[0-9]+$'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, external_store_id)
);

drop trigger if exists set_user_external_store_preferences_updated_at on public.user_external_store_preferences;
create trigger set_user_external_store_preferences_updated_at
before update on public.user_external_store_preferences
for each row execute procedure public.set_updated_at();

alter table public.user_external_store_preferences enable row level security;

drop policy if exists "own external store preferences" on public.user_external_store_preferences;
create policy "own external store preferences"
on public.user_external_store_preferences
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
