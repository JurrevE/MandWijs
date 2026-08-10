"use client";

import { useMemo, useState } from "react";
import { Check, ExternalLink, LoaderCircle, LocateFixed, MapPin, Navigation, RefreshCw, Search, StoreIcon } from "lucide-react";
import { LocationAttribution } from "@/components/app/location-attribution";
import { PageHeading } from "@/components/app/page-heading";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { haversineDistanceKm, isWithinRadius } from "@/domain/distance";
import { geocodeLocation } from "@/lib/location/client";

export function StoresView() {
  const {
    profile,
    chains,
    stores: allStores,
    storeDataSource,
    storeDataUpdatedAt,
    storeWarnings,
    storesLoading,
    updateProfile,
    toggleChain,
    toggleStore,
    refreshNearbyStores,
  } = useAppState();
  const [manualLocation, setManualLocation] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [query, setQuery] = useState("");
  const hasCoordinates = profile.latitude != null && profile.longitude != null;
  const manualLocationValue = manualLocation ?? (profile.locationLabel === "Nog niet ingesteld" ? "" : profile.locationLabel);

  const stores = useMemo(() => {
    if (!hasCoordinates) return [];
    const origin = { latitude: profile.latitude!, longitude: profile.longitude! };
    return allStores
      .filter((store) => store.active && !store.id.startsWith("national:"))
      .filter((store) => store.latitude != null && store.longitude != null)
      .filter((store) => isWithinRadius(origin, store, profile.radiusKm))
      .map((store) => ({
        ...store,
        distance: haversineDistanceKm(origin, { latitude: store.latitude!, longitude: store.longitude! }),
      }))
      .filter((store) => `${store.name} ${store.address} ${store.postcode} ${store.city}`.toLocaleLowerCase("nl-NL").includes(query.toLocaleLowerCase("nl-NL")))
      .sort((left, right) => left.distance - right.distance);
  }, [allStores, hasCoordinates, profile.latitude, profile.longitude, profile.radiusKm, query]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Je browser ondersteunt geen locatie. Vul een adres of postcode in.");
      return;
    }
    setLocationStatus("Locatie wordt opgehaald…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateProfile({ latitude: coords.latitude, longitude: coords.longitude, locationLabel: "Huidige locatie" });
        setManualLocation(null);
        setLocationStatus("Locatie bijgewerkt. De filialen binnen je straal worden nu opgehaald.");
      },
      () => setLocationStatus("Geen probleem — vul hieronder een plaats, postcode of adres in."),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
    );
  };

  const saveManual = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = manualLocationValue.trim();
    if (!value) return;
    setLocationLoading(true);
    setLocationStatus("Adres wordt gecontroleerd…");
    try {
      const location = await geocodeLocation(value);
      updateProfile({ locationLabel: location.label, latitude: location.latitude, longitude: location.longitude });
      setManualLocation(null);
      setLocationStatus("Locatie gevonden. De filialen binnen je straal worden nu opgehaald.");
    } catch (error) {
      setLocationStatus(error instanceof Error ? error.message : "Locatie zoeken is mislukt.");
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <>
      <PageHeading eyebrow="Jouw omgeving" title="Locatie & winkels" description="MandWijs gebruikt echte OpenStreetMap-filialen en controleert de afstand opnieuw in de app." />
      <div className="grid gap-5 xl:grid-cols-[23rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card id="locatie" className="scroll-mt-24 p-5 shadow-none">
            <h2 className="flex items-center gap-2 font-black"><MapPin className="size-5 text-mandwijs-primary" /> Actieve locatie</h2>
            <p className="mt-2 text-xs leading-5 text-mandwijs-muted">Gebruik je browserlocatie of zoek één Nederlands adres of postcode. Geen autocomplete of achtergrondtracking.</p>
            <Button onClick={requestLocation} variant="soft" className="mt-5 w-full"><LocateFixed className="size-4" /> Gebruik browserlocatie</Button>
            <div className="my-4 flex items-center gap-3 text-[.65rem] font-bold uppercase tracking-widest text-mandwijs-muted before:h-px before:flex-1 before:bg-mandwijs-line after:h-px after:flex-1 after:bg-mandwijs-line">of</div>
            <form onSubmit={saveManual}>
              <label className="block text-xs font-bold">Plaats, postcode of adres<input value={manualLocationValue} onChange={(event) => setManualLocation(event.target.value)} className="input-field mt-2" placeholder="Bijvoorbeeld 8913 HA" /></label>
              <Button type="submit" disabled={locationLoading || !manualLocationValue.trim()} variant="secondary" className="mt-3 w-full">{locationLoading ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />} Locatie zoeken</Button>
            </form>
            {locationStatus && <p aria-live="polite" className="mt-3 rounded-xl bg-[#f3f7f5] p-3 text-xs leading-5 text-mandwijs-muted">{locationStatus}</p>}
            <p className="mt-3 text-[.68rem] leading-5 text-mandwijs-muted">Bij handmatig zoeken wordt je invoer server-side naar Nominatim gestuurd. Coördinaten worden gebruikt om via Overpass filialen in de gekozen straal te vinden.</p>
          </Card>

          <Card className="p-5 shadow-none">
            <div className="flex items-center justify-between"><h2 className="font-black">Zoekradius</h2>{storesLoading && <LoaderCircle className="size-4 animate-spin text-mandwijs-primary" />}</div>
            <p className="mt-1 text-xs text-mandwijs-muted">Hemelsbrede afstand vanaf je gekozen locatie.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">{siteConfig.radiusOptionsKm.map((radius) => <button key={radius} onClick={() => updateProfile({ radiusKm: radius })} className={`min-h-10 rounded-xl text-xs font-bold ${profile.radiusKm === radius ? "bg-mandwijs-deep text-white" : "border border-mandwijs-line bg-white text-mandwijs-muted"}`}>{radius} km</button>)}</div>
          </Card>

          <Card className="p-5 shadow-none">
            <div className="flex items-center justify-between"><h2 className="font-black">Supermarktketens</h2><Badge tone="neutral">{profile.enabledChainIds.length} actief</Badge></div>
            <div className="mt-4 space-y-1">{chains.map((chain) => { const enabled = profile.enabledChainIds.includes(chain.id); return <button key={chain.id} onClick={() => toggleChain(chain.id)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-[#f3f7f5]"><span className="grid size-8 place-items-center rounded-lg text-[.65rem] font-black text-white" style={{ background: chain.color }}>{chain.shortName}</span><span className="flex-1 text-sm font-bold">{chain.name}</span><span className={`grid size-6 place-items-center rounded-lg border ${enabled ? "border-mandwijs-primary bg-mandwijs-primary text-white" : "border-[#b9c6c1] text-transparent"}`}><Check className="size-4" /></span></button>; })}</div>
          </Card>
        </aside>

        <Card className="overflow-hidden shadow-none">
          <div className="border-b border-mandwijs-line p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-black">Ondersteunde filialen binnen {profile.radiusKm} km</h2><p className="mt-1 text-xs text-mandwijs-muted">{storesLoading ? "Filialen worden opgehaald…" : `${stores.length} fysieke winkels gevonden rond ${profile.locationLabel}`}</p></div>
              <div className="flex gap-2"><label className="relative min-w-0 flex-1 sm:w-64"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-field input-field-with-icon" placeholder="Zoek een filiaal" /></label><button onClick={refreshNearbyStores} disabled={!hasCoordinates || storesLoading} className="grid size-12 shrink-0 place-items-center rounded-xl border border-mandwijs-line text-mandwijs-muted disabled:opacity-50" aria-label="Filialen opnieuw ophalen"><RefreshCw className={`size-4 ${storesLoading ? "animate-spin" : ""}`} /></button></div>
            </div>
            {storeWarnings[0] && <p className="mt-3 rounded-xl bg-[#fff8ed] px-3 py-2 text-xs text-[#87531c]">{storeWarnings[0]}</p>}
          </div>

          {storesLoading && stores.length === 0 ? <div className="grid place-items-center px-5 py-20 text-center"><LoaderCircle className="size-9 animate-spin text-mandwijs-primary" /><h3 className="mt-4 font-black">Filialen binnen je straal zoeken</h3></div> : stores.length === 0 ? <div className="grid place-items-center px-5 py-20 text-center"><StoreIcon className="size-10 text-mandwijs-muted" /><h3 className="mt-4 font-black">{hasCoordinates ? "Geen ondersteunde filialen in deze straal" : "Kies eerst een precieze locatie"}</h3><p className="mt-1 max-w-md text-sm leading-6 text-mandwijs-muted">{hasCoordinates ? "Vergroot de radius of controleer je locatie. We verzinnen geen filialen die niet door OpenStreetMap zijn geleverd." : "Zoek een adres of postcode, of geef toestemming voor je browserlocatie."}</p></div> : <div className="divide-y divide-mandwijs-line">{stores.map((store) => {
            const chain = chains.find((item) => item.id === store.chainId);
            if (!chain) return null;
            const chainEnabled = profile.enabledChainIds.includes(chain.id);
            const enabled = chainEnabled && !profile.disabledStoreIds.includes(store.id);
            return <article key={store.id} className={`flex items-center gap-3 p-4 sm:p-5 ${!enabled ? "bg-[#fafbfb] opacity-60" : ""}`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-xs font-black text-white" style={{ background: chain.color }}>{chain.shortName}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-extrabold">{store.name}</h3>{!chainEnabled && <Badge tone="warning">Keten uit</Badge>}{store.sourceUrl && <a href={store.sourceUrl} target="_blank" rel="noreferrer" className="text-mandwijs-muted hover:text-mandwijs-deep" aria-label={`${store.name} op OpenStreetMap`}><ExternalLink className="size-3.5" /></a>}</div><p className="mt-1 truncate text-xs text-mandwijs-muted">{store.address}{store.postcode ? `, ${store.postcode}` : ""}, {store.city}</p>{store.openingHours && <p className="mt-1 text-[.68rem] font-semibold text-[#38735f]">Openingstijden: {store.openingHours}</p>}</div>
              <span className="hidden items-center gap-1 text-xs font-bold text-mandwijs-muted sm:flex"><Navigation className="size-3.5" /> {store.distance.toFixed(1).replace(".", ",")} km</span>
              <button disabled={!chainEnabled} onClick={() => toggleStore(store.id)} role="switch" aria-checked={enabled} aria-label={`${store.name} ${enabled ? "uitschakelen" : "inschakelen"}`} className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-mandwijs-primary" : "bg-[#cbd3d0]"}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} /></button>
            </article>;
          })}</div>}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mandwijs-line bg-[#fbfcfb] px-5 py-3 text-xs text-mandwijs-muted"><span>{storeDataSource === "openstreetmap" ? `Bijgewerkt ${new Intl.DateTimeFormat("nl-NL", { dateStyle: "short", timeStyle: "short" }).format(new Date(storeDataUpdatedAt))}` : "Nog geen actuele locatiebron geladen"}</span><LocationAttribution source={storeDataSource} className="text-mandwijs-deep" /></div>
        </Card>
      </div>
    </>
  );
}
