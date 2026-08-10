"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, DatabaseBackup, MailCheck, RefreshCcw, RotateCcw, ShieldCheck, Store, Tags } from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { useAppState } from "@/components/providers/app-state-provider";
import { DataAttribution } from "@/components/app/data-attribution";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEuro } from "@/config/site";

export function AdminView() {
  const { resetDemo, refreshMarketData, chains, offers, products, dataSource, dataUpdatedAt, dataWarnings } = useAppState();
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = () => {
    setSyncing(true);
    setMessage(null);
    refreshMarketData();
    window.setTimeout(() => {
      setSyncing(false);
      setMessage("Prijsdata opnieuw opgevraagd. Bij een providerfout blijft de veilige demo-fallback beschikbaar.");
    }, 800);
  };

  const reset = () => {
    resetDemo();
    setMessage("Lokale demo-data opnieuw geladen.");
  };

  return (
    <>
      <PageHeading eyebrow="Beveiligde omgeving" title="Datacontrole" description="Controleer imports, productmatches en globale brondata. Alleen zichtbaar voor admins." actions={<Badge tone="dark"><ShieldCheck className="mr-1 size-3.5" /> Admin</Badge>} />
      {message && <div aria-live="polite" className="mb-5 flex items-center gap-2 rounded-xl border border-[#cbe5da] bg-[#eef8f4] px-4 py-3 text-sm font-bold text-[#2c6956]"><CheckCircle2 className="size-4" /> {message}</div>}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { icon: DatabaseBackup, label: "Aanbiedingen", value: offers.length, detail: dataSource === "live" ? "live" : "fallback" },
        { icon: Tags, label: "Persoonlijke producten", value: products.length, detail: `${products.filter((product) => product.active).length} actief` },
        { icon: Store, label: "Supermarktketens", value: chains.length, detail: "geconfigureerd" },
        { icon: AlertTriangle, label: "Waarschuwingen", value: dataWarnings.length, detail: "laatste run" },
      ].map(({ icon: Icon, label, value, detail }) => <Card key={label} className="flex items-center gap-4 p-5 shadow-none"><span className="grid size-10 place-items-center rounded-xl bg-[#e7f3ee] text-mandwijs-deep"><Icon className="size-5" /></span><span><span className="block text-xs font-bold text-mandwijs-muted">{label}</span><strong className="text-2xl font-black">{value}</strong><span className="ml-2 text-xs text-mandwijs-muted">{detail}</span></span></Card>)}</div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="overflow-hidden shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mandwijs-line p-5"><div><h2 className="font-black">Synchronisaties</h2><p className="mt-1 text-xs text-mandwijs-muted">Server-side providerstatus en fallback</p></div><Button variant="secondary" onClick={refresh} disabled={syncing}><RefreshCcw className={`size-4 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Bezig…" : "Prijsdata vernieuwen"}</Button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="bg-[#f7faf8] text-xs text-mandwijs-muted"><tr><th className="px-5 py-3 font-bold">Provider</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3 font-bold">Bijgewerkt</th><th className="px-5 py-3 font-bold">Verwerkt</th><th className="px-5 py-3 font-bold">Waarschuwingen</th></tr></thead><tbody><tr className="border-t border-mandwijs-line"><td className="px-5 py-4 font-bold">{dataSource === "live" ? "PrijsProfeetProvider" : "DemoDataProvider"}</td><td className="px-5 py-4"><Badge tone={dataSource === "live" ? "success" : "warning"}>{dataSource === "live" ? "Live" : "Fallback"}</Badge></td><td className="px-5 py-4 text-mandwijs-muted">{new Intl.DateTimeFormat("nl-NL", { dateStyle: "short", timeStyle: "short" }).format(new Date(dataUpdatedAt))}</td><td className="px-5 py-4">{offers.length}</td><td className="px-5 py-4">{dataWarnings.length}</td></tr></tbody></table></div>
        </Card>

        <Card className="p-5 shadow-none"><h2 className="font-black">Beheeracties</h2><p className="mt-1 text-xs leading-5 text-mandwijs-muted">Deze acties zijn server-side beschermd met een adminrol.</p><div className="mt-5 grid gap-2"><Button variant="secondary" onClick={reset} className="justify-start"><RotateCcw className="size-4" /> Lokale demo opnieuw laden</Button><Button variant="secondary" onClick={() => setMessage("Testmail-preview aangemaakt; echte verzending vereist Resend.")} className="justify-start"><MailCheck className="size-4" /> Testmail naar admin</Button><Button variant="secondary" onClick={() => setMessage(`${chains.length} supermarktketens zijn geconfigureerd.`)} className="justify-start"><Store className="size-4" /> Supermarktketens controleren</Button></div><div className="mt-5 rounded-xl bg-[#fff8ed] p-4 text-xs leading-5 text-[#85511b]"><strong>{dataSource === "live" ? "Gedocumenteerde provider actief" : "Veilige fallback actief"}</strong><br />Niet-EAN-matches blijven indicatief; aankomende en historische prijzen tellen niet mee.<br /><DataAttribution source={dataSource} className="mt-2 inline-block text-[#85511b]" /></div></Card>
      </div>

      <Card className="mt-5 overflow-hidden shadow-none"><div className="border-b border-mandwijs-line p-5"><h2 className="font-black">Providerproducten</h2><p className="mt-1 text-xs text-mandwijs-muted">EAN bepaalt verificatie; overige resultaten zijn indicatief</p></div><div className="overflow-x-auto"><table className="w-full min-w-[45rem] text-left text-sm"><thead className="bg-[#f7faf8] text-xs text-mandwijs-muted"><tr><th className="px-5 py-3">Bronproduct</th><th className="px-5 py-3">Keten</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Geldig</th><th className="px-5 py-3">Effectieve prijs</th></tr></thead><tbody>{offers.slice(0, 6).map((offer) => <tr key={offer.id} className="border-t border-mandwijs-line"><td className="px-5 py-4 font-bold">{offer.product.name}</td><td className="px-5 py-4 text-mandwijs-muted">{chains.find((chain) => chain.id === offer.chainId)?.name ?? offer.chainId}</td><td className="px-5 py-4"><Badge tone={offer.product.ean ? "success" : "warning"}>{offer.product.ean ? "EAN beschikbaar" : "Indicatief"}</Badge></td><td className="px-5 py-4">{offer.validFrom} – {offer.validUntil}</td><td className="px-5 py-4 font-bold">{formatEuro(offer.effectiveUnitPriceCents)}</td></tr>)}</tbody></table></div></Card>
    </>
  );
}
