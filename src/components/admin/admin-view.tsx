"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, DatabaseBackup, MailCheck, RefreshCcw, RotateCcw, ShieldCheck, Store, Tags } from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoChains, demoOffers, demoProducts } from "@/data/demo";
import { formatEuro } from "@/config/site";

export function AdminView() {
  const { resetDemo } = useAppState();
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const simulateSync = () => {
    setSyncing(true);
    setMessage(null);
    window.setTimeout(() => { setSyncing(false); setMessage(`${demoOffers.length} records idempotent verwerkt; 0 mislukt.`); }, 800);
  };

  const reset = () => {
    resetDemo();
    setMessage("Demo-data opnieuw geladen.");
  };

  return (
    <>
      <PageHeading eyebrow="Beveiligde omgeving" title="Datacontrole" description="Controleer imports, productmatches en globale brondata. Alleen zichtbaar voor admins." actions={<Badge tone="dark"><ShieldCheck className="mr-1 size-3.5" /> Admin</Badge>} />
      {message && <div aria-live="polite" className="mb-5 flex items-center gap-2 rounded-xl border border-[#cbe5da] bg-[#eef8f4] px-4 py-3 text-sm font-bold text-[#2c6956]"><CheckCircle2 className="size-4" /> {message}</div>}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { icon: DatabaseBackup, label: "Aanbiedingen", value: demoOffers.length, detail: "18 actief" },
        { icon: Tags, label: "Persoonlijke producten", value: demoProducts.length, detail: "6 actief" },
        { icon: Store, label: "Supermarktketens", value: demoChains.length, detail: "alle fysiek" },
        { icon: AlertTriangle, label: "Importfouten", value: 0, detail: "laatste 7 dagen" },
      ].map(({ icon: Icon, label, value, detail }) => <Card key={label} className="flex items-center gap-4 p-5 shadow-none"><span className="grid size-10 place-items-center rounded-xl bg-[#e7f3ee] text-kopert-deep"><Icon className="size-5" /></span><span><span className="block text-xs font-bold text-kopert-muted">{label}</span><strong className="text-2xl font-black">{value}</strong><span className="ml-2 text-xs text-kopert-muted">{detail}</span></span></Card>)}</div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kopert-line p-5"><div><h2 className="font-black">Synchronisaties</h2><p className="mt-1 text-xs text-kopert-muted">Logging, retries en importresultaten</p></div><Button variant="secondary" onClick={simulateSync} disabled={syncing}><RefreshCcw className={`size-4 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Bezig…" : "Demo-sync starten"}</Button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="bg-[#f7faf8] text-xs text-kopert-muted"><tr><th className="px-5 py-3 font-bold">Provider</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3 font-bold">Gestart</th><th className="px-5 py-3 font-bold">Geïmporteerd</th><th className="px-5 py-3 font-bold">Mislukt</th></tr></thead><tbody><tr className="border-t border-kopert-line"><td className="px-5 py-4 font-bold">DemoDataProvider</td><td className="px-5 py-4"><Badge tone="success">Geslaagd</Badge></td><td className="px-5 py-4 text-kopert-muted">10 aug, 08:15</td><td className="px-5 py-4">{demoOffers.length}</td><td className="px-5 py-4">0</td></tr><tr className="border-t border-kopert-line"><td className="px-5 py-4 font-bold">PrijsProfeetProvider</td><td className="px-5 py-4"><Badge tone="neutral">Niet geconfigureerd</Badge></td><td className="px-5 py-4 text-kopert-muted">—</td><td className="px-5 py-4">—</td><td className="px-5 py-4">—</td></tr></tbody></table></div>
        </Card>

        <Card className="p-5 shadow-none"><h2 className="font-black">Beheeracties</h2><p className="mt-1 text-xs leading-5 text-kopert-muted">Deze acties zijn in productie dubbel beschermd met een adminrol en server-side validatie.</p><div className="mt-5 grid gap-2"><Button variant="secondary" onClick={reset} className="justify-start"><RotateCcw className="size-4" /> Demo-data opnieuw laden</Button><Button variant="secondary" onClick={() => setMessage("Testmail-preview aangemaakt; echte verzending vereist Resend.")} className="justify-start"><MailCheck className="size-4" /> Testmail naar admin</Button><Button variant="secondary" onClick={() => setMessage("Alle 10 supermarktketens zijn actief in de demo.")} className="justify-start"><Store className="size-4" /> Supermarktketens beheren</Button></div><div className="mt-5 rounded-xl bg-[#fff8ed] p-4 text-xs leading-5 text-[#85511b]"><strong>Externe provider uit</strong><br />Er zijn bewust geen PrijsProfeet-endpoints of responsevelden aangenomen.</div></Card>
      </div>

      <Card className="mt-5 overflow-hidden shadow-none"><div className="border-b border-kopert-line p-5"><h2 className="font-black">Productmatches</h2><p className="mt-1 text-xs text-kopert-muted">Voorbeeld van de uitlegbare matchkwaliteit</p></div><div className="overflow-x-auto"><table className="w-full min-w-[45rem] text-left text-sm"><thead className="bg-[#f7faf8] text-xs text-kopert-muted"><tr><th className="px-5 py-3">Persoonlijk product</th><th className="px-5 py-3">Bronproduct</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Zekerheid</th><th className="px-5 py-3">Effectieve prijs</th></tr></thead><tbody>{demoOffers.slice(0, 6).map((offer, index) => <tr key={offer.id} className="border-t border-kopert-line"><td className="px-5 py-4 font-bold">{demoProducts[index % demoProducts.length].name}</td><td className="px-5 py-4 text-kopert-muted">{offer.product.name}</td><td className="px-5 py-4"><Badge tone={offer.product.isHouseBrand ? "warning" : "success"}>{offer.product.isHouseBrand ? "Huismerk alternatief" : "Exact product"}</Badge></td><td className="px-5 py-4">{offer.product.isHouseBrand ? "72%" : "96%"}</td><td className="px-5 py-4 font-bold">{formatEuro(offer.effectiveUnitPriceCents)}</td></tr>)}</tbody></table></div></Card>
    </>
  );
}
