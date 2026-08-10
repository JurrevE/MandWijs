-- Maak de initiële schema-migratie ook veilig voor Auth-gebruikers die al bestonden.
insert into public.profiles (id, display_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'name', '')
from auth.users u
on conflict (id) do nothing;

insert into public.shopping_lists (user_id)
select p.id
from public.profiles p
where not exists (
  select 1 from public.shopping_lists l where l.user_id = p.id and l.active
);
