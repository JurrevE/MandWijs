"use client";

import { useState } from "react";
import { BellRing, Check, CircleUserRound, KeyRound, Mail, Route, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EmailPreference } from "@/domain/email";

type Tab = "profile" | "comparison" | "email" | "security";

export function SettingsView() {
  const { profile, updateProfile } = useAppState();
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(profile.name);

  const save = () => {
    updateProfile({ name: name.trim() || profile.name });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const tabs: { id: Tab; label: string; icon: typeof CircleUserRound }[] = [
    { id: "profile", label: "Profiel", icon: CircleUserRound },
    { id: "comparison", label: "Vergelijking", icon: SlidersHorizontal },
    { id: "email", label: "E-mail", icon: Mail },
    { id: "security", label: "Beveiliging", icon: ShieldCheck },
  ];

  return (
    <>
      <PageHeading eyebrow="Voorkeuren" title="Instellingen" description="Pas je profiel, winkelstrategie en communicatievoorkeuren aan." />
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <Card className="h-fit p-2 shadow-none"><nav aria-label="Instellingensecties" className="flex gap-1 overflow-x-auto lg:flex-col">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-bold lg:w-full ${tab === id ? "bg-[#e4f2ec] text-mandwijs-deep" : "text-mandwijs-muted hover:bg-[#f2f5f4]"}`}><Icon className="size-[1.1rem]" />{label}</button>)}</nav></Card>
        <Card className="overflow-hidden shadow-none">
          {tab === "profile" && <section><div className="border-b border-mandwijs-line p-5 sm:p-7"><h2 className="text-xl font-black">Profielgegevens</h2><p className="mt-1 text-sm text-mandwijs-muted">De naam gebruiken we in je dashboard en weekmail.</p></div><div className="grid gap-5 p-5 sm:max-w-2xl sm:grid-cols-2 sm:p-7"><label className="block text-sm font-bold">Naam<input value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-2" /></label><label className="block text-sm font-bold">E-mailadres<input value="demo@mandwijs.app" disabled className="input-field mt-2 bg-[#f4f6f5] text-mandwijs-muted" /></label><div className="sm:col-span-2"><h3 className="text-sm font-bold">Actieve locatie</h3><p className="mt-2 rounded-xl border border-mandwijs-line bg-[#f8faf9] p-4 text-sm">{profile.locationLabel} · {profile.radiusKm} km radius</p></div></div></section>}

          {tab === "comparison" && <section><div className="border-b border-mandwijs-line p-5 sm:p-7"><h2 className="text-xl font-black">Winkelvoorkeur</h2><p className="mt-1 text-sm text-mandwijs-muted">Bepaal hoeveel winkelstops je acceptabel vindt.</p></div><div className="p-5 sm:p-7"><span className="text-sm font-bold">Maximaal aantal winkels</span><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{([1, 2, 3, null] as const).map((value) => <button key={String(value)} onClick={() => updateProfile({ maxStores: value })} className={`min-h-12 rounded-xl border text-sm font-bold ${profile.maxStores === value ? "border-mandwijs-deep bg-mandwijs-deep text-white" : "border-mandwijs-line"}`}>{value ?? "Geen maximum"}</button>)}</div><div className="mt-7 rounded-2xl bg-[#f1f7f4] p-5"><h3 className="flex items-center gap-2 text-sm font-black"><Route className="size-4 text-mandwijs-primary" /> Balansscore</h3><p className="mt-2 text-sm leading-6 text-mandwijs-muted">MandWijs gebruikt € 3,00 voorkeurspenalty per extra winkel: <code className="rounded bg-white px-1.5 py-0.5 text-xs text-mandwijs-text">score = totaal + (winkels − 1) × € 3,00</code>. Dit zijn geen reiskosten.</p></div></div></section>}

          {tab === "email" && <section><div className="border-b border-mandwijs-line p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">Maandagmail</h2><p className="mt-1 text-sm text-mandwijs-muted">Ontvang iedere maandagochtend je persoonlijke weekadvies.</p></div><Badge tone={profile.emailPreference === "none" ? "neutral" : "success"}>{profile.emailPreference === "none" ? "Uit" : "Ingeschakeld"}</Badge></div></div><div className="grid gap-3 p-5 sm:p-7">{(["none", "summary", "full"] as EmailPreference[]).map((value) => <button key={value} onClick={() => updateProfile({ emailPreference: value })} className={`flex items-start gap-4 rounded-2xl border p-4 text-left ${profile.emailPreference === value ? "border-mandwijs-primary bg-[#f2f9f6] ring-2 ring-mandwijs-primary/10" : "border-mandwijs-line"}`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-mandwijs-primary"><BellRing className="size-5" /></span><span className="flex-1"><strong className="block text-sm">{value === "none" ? "Geen e-mail" : value === "summary" ? "Alleen samenvatting" : "Volledige boodschappenlijst"}</strong><span className="mt-1 block text-xs leading-5 text-mandwijs-muted">{value === "none" ? "Je ontvangt geen wekelijkse e-mails." : value === "summary" ? "Totaalprijs, strategie, winkels en opvallende aanbiedingen." : "Winkelvolgorde, alle producten, prijzen, voorwaarden en unmatched items."}</span></span>{profile.emailPreference === value && <Check className="mt-2 size-5 text-mandwijs-primary" />}</button>)}</div></section>}

          {tab === "security" && <section><div className="border-b border-mandwijs-line p-5 sm:p-7"><h2 className="text-xl font-black">Accountbeveiliging</h2><p className="mt-1 text-sm text-mandwijs-muted">Auth wordt beheerd door Supabase zodra het project is gekoppeld.</p></div><div className="space-y-3 p-5 sm:p-7"><div className="flex items-center gap-4 rounded-2xl border border-mandwijs-line p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#edf4f1]"><KeyRound className="size-5 text-mandwijs-primary" /></span><span className="flex-1"><strong className="block text-sm">Wachtwoord</strong><span className="text-xs text-mandwijs-muted">Stuur een herstelmail via het inlogscherm.</span></span><Badge tone="neutral">Demo</Badge></div><div className="rounded-2xl border border-[#f1d3d6] bg-[#fff7f8] p-4"><strong className="text-sm text-[#943941]">Account verwijderen</strong><p className="mt-1 text-xs leading-5 text-mandwijs-muted">In productie vereist dit een nieuwe authenticatie en server-side verwijdering. Deze demo wist nooit je Supabase-account.</p></div></div></section>}
          <div className="flex items-center justify-between border-t border-mandwijs-line bg-[#fbfcfb] px-5 py-4 sm:px-7"><span aria-live="polite" className="text-xs font-bold text-mandwijs-primary">{saved ? "Wijzigingen opgeslagen" : "Demo-instellingen worden lokaal bewaard"}</span><Button onClick={save}><Save className="size-4" /> Opslaan</Button></div>
        </Card>
      </div>
    </>
  );
}
