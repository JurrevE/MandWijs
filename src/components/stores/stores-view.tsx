"use client";

import { useMemo, useState } from "react";
import { Check, LocateFixed, MapPin, Navigation, Search, StoreIcon } from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { demoChains, demoStores } from "@/data/demo";
import { haversineDistanceKm, isWithinRadius } from "@/domain/distance";

export function StoresView() {
  const { profile, updateProfile, toggleChain, toggleStore } = useAppState();
  const [manualLocation, setManualLocation] = useState(profile.locationLabel);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const stores = useMemo(() => demoStores
    .filter((store) => isWithinRadius({ latitude: profile.latitude, longitude: profile.longitude }, store, profile.radiusKm))
    .map((store) => ({ ...store, distance: haversineDistanceKm({ latitude: profile.latitude, longitude: profile.longitude }, { latitude: store.latitude!, longitude: store.longitude! }) }))
    .filter((store) => `${store.name} ${store.address}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.distance - b.distance), [profile.latitude, profile.longitude, profile.radiusKm, query]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Je browser ondersteunt geen locatie. Vul hieronder een plaats of postcode in.");
      return;
    }
    setLocationStatus("Locatie wordt opgehaald…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateProfile({ latitude: coords.latitude, longitude: coords.longitude, locationLabel: "Huidige locatie" });
        setManualLocation("Huidige locatie");
        setLocationStatus("Locatie bijgewerkt. We bewaren alleen wat nodig is voor je afstandsfilter.");
      },
      () => setLocationStatus("Geen probleem — gebruik hieronder een plaats, postcode of adres."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const saveManual = () => {
    if (!manualLocation.trim()) return;
    // Demo-geocoding blijft bewust op Utrecht gecentreerd; echte geocoding hoort server-side.
    updateProfile({ locationLabel: manualLocation.trim(), latitude: 52.0907, longitude: 5.1214 });
    setLocationStatus("Locatie opgeslagen. In demo-modus gebruiken we het centrum van Utrecht als coördinaat.");
  };

  return (
    <>
      <PageHeading eyebrow="Jouw omgeving" title="Locatie & winkels" description="Bepaal welke fysieke filialen MandWijs mag meenemen in je persoonlijke vergelijking." />
      <div className="grid gap-5 xl:grid-cols-[23rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card className="p-5 shadow-none">
            <h2 className="flex items-center gap-2 font-black"><MapPin className="size-5 text-mandwijs-primary" /> Actieve locatie</h2>
            <p className="mt-2 text-xs leading-5 text-mandwijs-muted">Een plaats of postcode is genoeg. Een exacte locatie is niet verplicht.</p>
            <Button onClick={requestLocation} variant="soft" className="mt-5 w-full"><LocateFixed className="size-4" /> Gebruik browserlocatie</Button>
            <div className="my-4 flex items-center gap-3 text-[.65rem] font-bold uppercase tracking-widest text-mandwijs-muted before:h-px before:flex-1 before:bg-mandwijs-line after:h-px after:flex-1 after:bg-mandwijs-line">of</div>
            <label className="block text-xs font-bold">Plaats, postcode of adres<input value={manualLocation} onChange={(event) => setManualLocation(event.target.value)} className="input-field mt-2" /></label>
            <Button onClick={saveManual} variant="secondary" className="mt-3 w-full">Locatie opslaan</Button>
            {locationStatus && <p aria-live="polite" className="mt-3 rounded-xl bg-[#f3f7f5] p-3 text-xs leading-5 text-mandwijs-muted">{locationStatus}</p>}
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="font-black">Zoekradius</h2>
            <p className="mt-1 text-xs text-mandwijs-muted">Standaard gebruiken we 5 kilometer.</p>
            <div className="mt-4 grid grid-cols-3 gap-2">{siteConfig.radiusOptionsKm.map((radius) => <button key={radius} onClick={() => updateProfile({ radiusKm: radius })} className={`min-h-10 rounded-xl text-xs font-bold ${profile.radiusKm === radius ? "bg-mandwijs-deep text-white" : "border border-mandwijs-line bg-white text-mandwijs-muted"}`}>{radius} km</button>)}</div>
          </Card>

          <Card className="p-5 shadow-none">
            <div className="flex items-center justify-between"><h2 className="font-black">Supermarktketens</h2><Badge tone="neutral">{profile.enabledChainIds.length} actief</Badge></div>
            <div className="mt-4 space-y-1">{demoChains.map((chain) => { const enabled = profile.enabledChainIds.includes(chain.id); return <button key={chain.id} onClick={() => toggleChain(chain.id)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-[#f3f7f5]"><span className="grid size-8 place-items-center rounded-lg text-[.65rem] font-black text-white" style={{ background: chain.color }}>{chain.shortName}</span><span className="flex-1 text-sm font-bold">{chain.name}</span><span className={`grid size-6 place-items-center rounded-lg border ${enabled ? "border-mandwijs-primary bg-mandwijs-primary text-white" : "border-[#b9c6c1] text-transparent"}`}><Check className="size-4" /></span></button>; })}</div>
          </Card>
        </aside>

        <Card className="overflow-hidden shadow-none">
          <div className="border-b border-mandwijs-line p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black">Filialen binnen {profile.radiusKm} km</h2><p className="mt-1 text-xs text-mandwijs-muted">{stores.length} fysieke winkels gevonden rond {profile.locationLabel}</p></div><label className="relative sm:w-64"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-field pl-10" placeholder="Zoek een filiaal" /></label></div>
          </div>
          {stores.length === 0 ? <div className="grid place-items-center px-5 py-20 text-center"><StoreIcon className="size-10 text-mandwijs-muted" /><h3 className="mt-4 font-black">Geen filialen in deze radius</h3><p className="mt-1 text-sm text-mandwijs-muted">Vergroot je radius of pas je locatie aan.</p></div> : <div className="divide-y divide-mandwijs-line">{stores.map((store) => {
            const chain = demoChains.find((item) => item.id === store.chainId)!;
            const chainEnabled = profile.enabledChainIds.includes(chain.id);
            const enabled = chainEnabled && !profile.disabledStoreIds.includes(store.id);
            return <article key={store.id} className={`flex items-center gap-3 p-4 sm:p-5 ${!enabled ? "bg-[#fafbfb] opacity-60" : ""}`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-xs font-black text-white" style={{ background: chain.color }}>{chain.shortName}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-extrabold">{store.name}</h3>{!chainEnabled && <Badge tone="warning">Keten uit</Badge>}</div><p className="mt-1 truncate text-xs text-mandwijs-muted">{store.address}, {store.city}</p>{store.openingHours && <p className="mt-1 text-[.68rem] font-semibold text-[#38735f]">{store.openingHours}</p>}</div>
              <span className="hidden items-center gap-1 text-xs font-bold text-mandwijs-muted sm:flex"><Navigation className="size-3.5" /> {store.distance.toFixed(1).replace(".", ",")} km</span>
              <button disabled={!chainEnabled} onClick={() => toggleStore(store.id)} role="switch" aria-checked={enabled} aria-label={`${store.name} ${enabled ? "uitschakelen" : "inschakelen"}`} className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-mandwijs-primary" : "bg-[#cbd3d0]"}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} /></button>
            </article>;
          })}</div>}
          <div className="border-t border-mandwijs-line bg-[#fbfcfb] px-5 py-3 text-xs text-mandwijs-muted">Filialen zonder betrouwbare coördinaten worden veilig overgeslagen.</div>
        </Card>
      </div>
    </>
  );
}
