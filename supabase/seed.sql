insert into public.supermarket_chains (slug, name, short_name, brand_color) values
  ('albert-heijn', 'Albert Heijn', 'AH', '#169bd5'),
  ('jumbo', 'Jumbo', 'JU', '#f5c400'),
  ('aldi', 'Aldi', 'AL', '#193d84'),
  ('lidl', 'Lidl', 'LI', '#174b8b'),
  ('plus', 'PLUS', 'PL', '#78a22f'),
  ('dirk', 'Dirk', 'DI', '#de1f35'),
  ('ekoplaza', 'Ekoplaza', 'EK', '#5a8e36'),
  ('hoogvliet', 'Hoogvliet', 'HO', '#d71920'),
  ('dekamarkt', 'DekaMarkt', 'DE', '#e3282d'),
  ('vomar', 'Vomar', 'VO', '#f28021')
on conflict (slug) do update set name = excluded.name, short_name = excluded.short_name, brand_color = excluded.brand_color;

insert into public.product_categories (slug, name) values
  ('vlees', 'Vlees'), ('zuivel', 'Zuivel'), ('pasta', 'Pasta'), ('rijst', 'Rijst'),
  ('eieren', 'Eieren'), ('broodbeleg', 'Broodbeleg'), ('diepvries', 'Diepvries')
on conflict (slug) do update set name = excluded.name;

insert into public.stores (chain_id, external_id, name, address, postcode, city, latitude, longitude, opening_hours)
select c.id, v.external_id, v.name, v.address, v.postcode, v.city, v.latitude, v.longitude, v.opening_hours::jsonb
from (values
  ('albert-heijn', 'demo-ah-neude', 'Albert Heijn Neude', 'Neude 7', '3512 AD', 'Utrecht', 52.0934, 5.1191, '{"monday":"08:00-23:00"}'),
  ('jumbo', 'demo-jumbo-merelstraat', 'Jumbo Merelstraat', 'Merelstraat 46', '3514 CN', 'Utrecht', 52.1026, 5.1304, '{"monday":"08:00-22:00"}'),
  ('lidl', 'demo-lidl-smaragdplein', 'Lidl Smaragdplein', 'Smaragdplein 103', '3523 EA', 'Utrecht', 52.0772, 5.1365, '{"monday":"08:00-21:00"}'),
  ('aldi', 'demo-aldi-admiraal', 'Aldi Admiraal Helfrichlaan', 'Admiraal Helfrichlaan 6', '3527 KV', 'Utrecht', 52.0855, 5.0939, '{"monday":"08:00-20:00"}'),
  ('plus', 'demo-plus-voorstraat', 'PLUS Voorstraat', 'Voorstraat 61', '3512 AK', 'Utrecht', 52.0942, 5.1220, '{"monday":"08:00-22:00"}')
) as v(chain_slug, external_id, name, address, postcode, city, latitude, longitude, opening_hours)
join public.supermarket_chains c on c.slug = v.chain_slug
on conflict (chain_id, external_id) do update set name = excluded.name, address = excluded.address, postcode = excluded.postcode, city = excluded.city, latitude = excluded.latitude, longitude = excluded.longitude, opening_hours = excluded.opening_hours;
