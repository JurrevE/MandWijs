-- Repair profiles that completed the required location step before onboarding writes were awaited.
-- New profiles still start at false and are marked complete only after the final step is saved.
update public.profiles
set onboarding_completed = true,
    updated_at = now()
where onboarding_completed = false
  and location_label is not null
  and latitude is not null
  and longitude is not null;
