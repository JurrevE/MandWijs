"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  ListPlus,
  MailCheck,
  MapPinned,
  Route,
  Store,
  TrendingDown,
} from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { DataAttribution } from "@/components/app/data-attribution";
import { LocationAttribution } from "@/components/app/location-attribution";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { optimizeShopping, type Strategy } from "@/domain/optimizer";
import { actionLabels } from "@/domain/pricing";
import { localizeShoppingOptions } from "@/domain/market-data";
import { formatEuro } from "@/config/site";

const strategies: Strategy[] = ["cheapest", "max_two", "fewest", "balance"];

export function DashboardView() {
  const { products, list, profile, chains, stores, offers, shoppingOptions, dataSource, dataUpdatedAt, dataWarnings, storeDataSource } = useAppState();
  const activeItems = list.filter((item) => !item.checked && products.some((product) => product.id === item.productId));
  const productIds = activeItems.map((item) => item.productId);
  const hasPreciseLocation = profile.latitude != null && profile.longitude != null;
  const allowedOptions = localizeShoppingOptions(shoppingOptions, stores, profile, profile.disabledStoreIds)
    .filter((option) => productIds.includes(option.productId))
    .filter((option) => profile.enabledChainIds.includes(option.chainId) && !profile.disabledStoreIds.includes(option.storeId))
    .map((option) => {
      const requested = activeItems.find((item) => item.productId === option.productId)?.quantity ?? 1;
      const bundles = Math.ceil(requested / option.payableQuantity);
      return { ...option, requestedQuantity: requested, priceCents: option.priceCents * bundles };
    });
  const plans = strategies.map((strategy) => optimizeShopping({ productIds, options: allowedOptions, strategy, storePenaltyCents: 300 }));
  const balance = plans.find((plan) => plan.id === "balance")!;
  const relevantStores = new Set(allowedOptions.map((option) => option.storeId)).size;
  const activeDeals = offers.filter((offer) => offer.actionType !== "none" && allowedOptions.some((option) => option.id === offer.id || option.id.startsWith(`${offer.id}:`)));

  return (
    <>
      <PageHeading
        eyebrow="Maandag 10 augustus"
        title={`Goedemiddag, ${profile.name}`}
        description="Dit is je voordeligste route op basis van de prijzen en aanbiedingen die we nu kennen."
        actions={<ButtonLink href="/producten" variant="secondary"><ListPlus className="size-4" /> Product toevoegen</ButtonLink>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: ListPlus, label: "Op je lijst", value: `${activeItems.length} producten`, detail: `${list.filter((item) => item.checked).length} afgevinkt` },
          { icon: TrendingDown, label: "Laagste schatting", value: formatEuro(plans[0]?.totalCents ?? 0), detail: `tot ${formatEuro(plans[0]?.savingsCents ?? 0)} verschil` },
          { icon: Store, label: hasPreciseLocation ? "Winkels in je buurt" : "Prijsdekking", value: `${relevantStores} in beeld`, detail: hasPreciseLocation ? `binnen ${profile.radiusKm} km` : "landelijke ketenprijzen" },
          { icon: MailCheck, label: "Maandagmail", value: profile.emailPreference === "none" ? "Uitgeschakeld" : "Ingeschakeld", detail: profile.emailPreference === "full" ? "volledige lijst" : "korte samenvatting" },
        ].map(({ icon: Icon, label, value, detail }) => (
          <Card key={label} className="flex items-start gap-4 p-5 shadow-none">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3ee] text-mandwijs-deep"><Icon className="size-5" /></span>
            <span><span className="block text-xs font-bold text-mandwijs-muted">{label}</span><strong className="mt-1 block text-lg tracking-[-.02em]">{value}</strong><span className="mt-0.5 block text-xs text-mandwijs-muted">{detail}</span></span>
          </Card>
        ))}
      </div>

      <Card className="mb-7 overflow-hidden border-0 bg-mandwijs-deep text-white shadow-[0_20px_55px_rgba(23,61,50,.18)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[.8fr_1.2fr] lg:p-10">
          <div>
            <Badge tone="deal"><CheckCircle2 className="mr-1 size-3" /> Aanbevolen</Badge>
            <h2 className="mt-4 text-2xl font-black tracking-[-.04em] sm:text-3xl">Beste balans voor jouw week</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/65">{balance.description} De € 3,00 penalty is een voorkeursscore, geen echte reiskostenberekening.</p>
            <div className="mt-7 flex items-end gap-6">
              <span><small className="block text-xs font-bold text-white/50">GESCHAT TOTAAL</small><strong className="mt-1 block text-4xl font-black tracking-[-.05em]">{formatEuro(balance.totalCents)}</strong></span>
              <span className="mb-1 border-l border-white/15 pl-6"><small className="block text-xs text-white/50">Winkels</small><strong className="text-xl">{balance.storeCount}</strong></span>
            </div>
            <ButtonLink href="/boodschappenlijst" variant="soft" className="mt-7">Bekijk volledig winkelplan <ArrowRight className="size-4" /></ButtonLink>
          </div>
          <div className="grid content-center gap-3">
            {[...new Set(balance.options.map((option) => option.storeId))].map((storeId, index) => {
              const options = balance.options.filter((option) => option.storeId === storeId);
              const store = stores.find((item) => item.id === storeId);
              const chain = chains.find((item) => item.id === store?.chainId);
              if (!store || !chain) return null;
              return (
                <Link href="/boodschappenlijst" key={storeId} className="flex items-center gap-3 rounded-2xl bg-white/8 p-3.5 transition hover:bg-white/12">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/20 text-xs font-black">{index + 1}</span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl text-xs font-black text-white" style={{ background: chain.color }}>{chain.shortName}</span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{store.name}</strong><span className="text-xs text-white/55">{options.length} {options.length === 1 ? "product" : "producten"}</span></span>
                  <strong className="text-sm">{formatEuro(options.reduce((sum, option) => sum + option.priceCents, 0))}</strong>
                  <ChevronRight className="size-4 text-white/45" />
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      <section className="mb-7">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black tracking-[-.03em]">Vergelijk strategieën</h2><p className="mt-1 text-sm text-mandwijs-muted">Wat past deze week bij je tijd en budget?</p></div><Link href="/boodschappenlijst" className="hidden text-sm font-bold text-mandwijs-deep hover:underline sm:block">Details bekijken</Link></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={`p-5 shadow-none ${plan.id === "balance" ? "border-mandwijs-primary ring-2 ring-mandwijs-primary/10" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-10 place-items-center rounded-xl bg-[#edf5f2] text-mandwijs-deep">{plan.id === "fewest" ? <MapPinned className="size-5" /> : plan.id === "balance" ? <Route className="size-5" /> : <TrendingDown className="size-5" />}</span>
                {plan.id === "cheapest" && <Badge tone="deal">Beste prijs</Badge>}
                {plan.id === "balance" && <Badge tone="dark">Aanbevolen</Badge>}
              </div>
              <h3 className="mt-5 text-sm font-extrabold">{plan.label}</h3>
              <p className="mt-2 text-2xl font-black tracking-[-.04em]">{formatEuro(plan.totalCents)}</p>
              <p className="mt-1 text-xs text-mandwijs-muted">{plan.storeCount} {plan.storeCount === 1 ? "winkel" : "winkels"} · {plan.options.length} matches</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5 shadow-none sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Nu voordelig</h2><p className="mt-1 text-xs text-mandwijs-muted">Aanbiedingen voor producten op jouw lijst</p></div><ButtonLink href="/aanbiedingen" variant="ghost" className="px-2">Alles <ArrowRight className="size-4" /></ButtonLink></div>
          <div className="mt-4 divide-y divide-mandwijs-line">
            {activeDeals.slice(0, 4).map((offer) => {
              const chain = chains.find((item) => item.id === offer.chainId);
              if (!chain) return null;
              return <Link href="/aanbiedingen" key={offer.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl text-xs font-black text-white" style={{ background: chain.color }}>{chain.shortName}</span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{offer.product.name}</strong><span className="mt-0.5 block text-xs text-mandwijs-muted">{chain.name} · {actionLabels[offer.actionType]}</span></span>
                <span className="text-right"><strong className="block text-sm">{formatEuro(offer.effectiveUnitPriceCents)}</strong><span className="text-[.68rem] text-mandwijs-muted">per stuk</span></span>
                <ChevronRight className="size-4 text-mandwijs-muted" />
              </Link>;
            })}
          </div>
        </Card>

        <Card className="p-5 shadow-none sm:p-6">
          <h2 className="text-lg font-black">Datastatus</h2>
          <div className="mt-5 space-y-4">
            <div className="flex gap-3"><Clock3 className="mt-0.5 size-5 text-mandwijs-primary" /><span><strong className="block text-sm">Bijgewerkt {new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit" }).format(new Date(dataUpdatedAt))}</strong><span className="text-xs text-mandwijs-muted">{offers.length} prijzen verwerkt</span></span></div>
            <div className="flex gap-3"><CalendarDays className="mt-0.5 size-5 text-mandwijs-primary" /><span><strong className="block text-sm">Alleen huidige acties in berekening</strong><span className="text-xs text-mandwijs-muted">Aankomende en historische prijzen tellen niet mee</span></span></div>
            <div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 text-[#b9691e]" /><span><strong className="block text-sm">{dataSource === "live" ? "PrijsProfeet live" : "Demo-fallback actief"}</strong><span className="text-xs leading-5 text-mandwijs-muted">{dataWarnings[0] ?? (dataSource === "live" ? "Actuele providerdata; controleer altijd de winkel." : "Geen actuele winkelclaim.")}</span></span></div>
            <DataAttribution source={dataSource} className="inline-block text-xs text-mandwijs-deep" />
            <LocationAttribution source={storeDataSource} className="inline-block text-xs text-mandwijs-deep" />
          </div>
        </Card>
      </div>
    </>
  );
}
