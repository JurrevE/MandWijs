"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BellRing,
  Check,
  CircleUserRound,
  KeyRound,
  Mail,
  Route,
  Save,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EmailPreference } from "@/domain/email";

type Tab = "profile" | "comparison" | "email" | "security";

const tabs: { id: Tab; label: string; icon: typeof CircleUserRound }[] = [
  { id: "profile", label: "Profiel", icon: CircleUserRound },
  { id: "comparison", label: "Vergelijking", icon: SlidersHorizontal },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "security", label: "Beveiliging", icon: ShieldCheck },
];

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-mandwijs-line p-4 sm:p-7">
      <h2 className="text-lg font-black sm:text-xl">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-mandwijs-muted">{description}</p>
    </div>
  );
}

export function SettingsView() {
  const { profile, mode, userEmail, databaseReady, persistenceError, updateProfile } = useAppState();
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(profile.name);

  const save = () => {
    updateProfile({ name: name.trim() || profile.name });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <PageHeading
        eyebrow="Voorkeuren"
        title="Instellingen"
        description="Pas je profiel, winkelstrategie en communicatievoorkeuren aan."
      />

      <div className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <Card className="h-fit min-w-0 rounded-2xl p-2 shadow-none sm:rounded-[1.25rem]">
          <nav aria-label="Instellingensecties" className="grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-4 lg:flex lg:flex-col">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-2.5 text-left text-xs font-bold sm:justify-center sm:text-sm lg:w-full lg:justify-start lg:gap-3 lg:px-3 ${
                  tab === id
                    ? "bg-[#e4f2ec] text-mandwijs-deep"
                    : "text-mandwijs-muted hover:bg-[#f2f5f4]"
                }`}
              >
                <Icon className="size-[1.1rem] shrink-0" />
                <span className="min-w-0 truncate">{label}</span>
              </button>
            ))}
          </nav>
        </Card>

        <Card className="min-w-0 overflow-hidden rounded-2xl shadow-none sm:rounded-[1.25rem]">
          {tab === "profile" && (
            <section>
              <SectionHeader title="Profielgegevens" description="De naam gebruiken we in je dashboard en weekmail." />
              <div className="grid min-w-0 gap-4 p-4 sm:max-w-2xl sm:grid-cols-2 sm:gap-5 sm:p-7">
                <label className="min-w-0 text-sm font-bold">
                  Naam
                  <input value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-2 min-w-0" />
                </label>
                <label className="min-w-0 text-sm font-bold">
                  E-mailadres
                  <input value={userEmail} disabled className="input-field mt-2 min-w-0 bg-[#f4f6f5] text-mandwijs-muted" />
                </label>
                <div className="min-w-0 sm:col-span-2">
                  <h3 className="text-sm font-bold">Actieve locatie</h3>
                  <p className="mt-2 break-words rounded-xl border border-mandwijs-line bg-[#f8faf9] p-3.5 text-sm sm:p-4">
                    {profile.locationLabel} · {profile.radiusKm} km radius
                  </p>
                </div>
              </div>
            </section>
          )}

          {tab === "comparison" && (
            <section>
              <SectionHeader title="Winkelvoorkeur" description="Bepaal hoeveel winkelstops je acceptabel vindt." />
              <div className="p-4 sm:p-7">
                <span className="text-sm font-bold">Maximaal aantal winkels</span>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([1, 2, 3, null] as const).map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => updateProfile({ maxStores: value })}
                      className={`min-h-12 rounded-xl border px-2 text-sm font-bold ${
                        profile.maxStores === value
                          ? "border-mandwijs-deep bg-mandwijs-deep text-white"
                          : "border-mandwijs-line"
                      }`}
                    >
                      {value ?? "Geen maximum"}
                    </button>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-[#f1f7f4] p-4 sm:mt-7 sm:p-5">
                  <h3 className="flex items-center gap-2 text-sm font-black"><Route className="size-4 text-mandwijs-primary" /> Balansscore</h3>
                  <p className="mt-2 text-sm leading-6 text-mandwijs-muted">
                    MandWijs gebruikt € 3,00 voorkeurspenalty per extra winkel:{" "}
                    <code className="break-words rounded bg-white px-1.5 py-0.5 text-xs text-mandwijs-text [overflow-wrap:anywhere]">
                      score = totaal + (winkels − 1) × € 3,00
                    </code>. Dit zijn geen reiskosten.
                  </p>
                </div>
              </div>
            </section>
          )}

          {tab === "email" && (
            <section>
              <div className="border-b border-mandwijs-line p-4 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-black sm:text-xl">Maandagmail</h2>
                    <p className="mt-1 text-sm leading-5 text-mandwijs-muted">Ontvang iedere maandagochtend je persoonlijke weekadvies.</p>
                  </div>
                  <Badge tone={profile.emailPreference === "none" ? "neutral" : "success"}>
                    {profile.emailPreference === "none" ? "Uit" : "Ingeschakeld"}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3 p-4 sm:p-7">
                {(["none", "summary", "full"] as EmailPreference[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateProfile({ emailPreference: value })}
                    className={`flex min-w-0 items-start gap-3 rounded-2xl border p-3.5 text-left sm:gap-4 sm:p-4 ${
                      profile.emailPreference === value
                        ? "border-mandwijs-primary bg-[#f2f9f6] ring-2 ring-mandwijs-primary/10"
                        : "border-mandwijs-line"
                    }`}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-mandwijs-primary sm:size-10"><BellRing className="size-5" /></span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm">{value === "none" ? "Geen e-mail" : value === "summary" ? "Alleen samenvatting" : "Volledige boodschappenlijst"}</strong>
                      <span className="mt-1 block text-xs leading-5 text-mandwijs-muted">
                        {value === "none" ? "Je ontvangt geen wekelijkse e-mails." : value === "summary" ? "Totaalprijs, strategie, winkels en opvallende aanbiedingen." : "Winkelvolgorde, alle producten, prijzen, voorwaarden en unmatched items."}
                      </span>
                    </span>
                    {profile.emailPreference === value && <Check className="mt-2 size-5 shrink-0 text-mandwijs-primary" />}
                  </button>
                ))}
              </div>
            </section>
          )}

          {tab === "security" && (
            <section>
              <SectionHeader
                title="Accountbeveiliging"
                description={mode === "supabase" ? "Authenticatie en sessies worden beheerd door Supabase." : "Dit is een lokale demosessie zonder echt account."}
              />
              <div className="space-y-3 p-4 sm:p-7">
                <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-mandwijs-line p-3.5 sm:items-center sm:gap-4 sm:p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf4f1] sm:size-10"><KeyRound className="size-5 text-mandwijs-primary" /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm">Wachtwoord</strong>
                    <span className="text-xs leading-5 text-mandwijs-muted">
                      {mode === "supabase" ? <Link href="/forgot-password" className="font-bold text-mandwijs-deep hover:underline">Stuur een beveiligde herstelmail</Link> : "Niet beschikbaar voor de demo."}
                    </span>
                  </span>
                  <Badge tone={mode === "supabase" ? "success" : "neutral"}>{mode === "supabase" ? "Supabase" : "Demo"}</Badge>
                </div>
                <div className="rounded-2xl border border-[#f1d3d6] bg-[#fff7f8] p-4">
                  <strong className="text-sm text-[#943941]">Account verwijderen</strong>
                  <p className="mt-1 text-xs leading-5 text-mandwijs-muted">Definitieve accountverwijdering vereist herauthenticatie en een aparte server-side beheeractie; deze knop is daarom nog niet geactiveerd.</p>
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-col items-stretch gap-3 border-t border-mandwijs-line bg-[#fbfcfb] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <span aria-live="polite" className={`text-xs font-bold leading-5 ${persistenceError ? "text-[#a43d45]" : "text-mandwijs-primary"}`}>
              {persistenceError ?? (saved ? "Wijzigingen opgeslagen" : mode === "supabase" ? (databaseReady ? "Wijzigingen worden aan je account gekoppeld" : "Supabase-migratie vereist") : "Demo-instellingen worden lokaal bewaard")}
            </span>
            <Button onClick={save} className="w-full sm:w-auto"><Save className="size-4" /> Opslaan</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
