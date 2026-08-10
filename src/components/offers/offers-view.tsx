"use client";

import { useMemo, useState } from "react";
import { BadgePercent, CalendarRange, CircleAlert, CreditCard, Search, SlidersHorizontal } from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { demoChains, demoOffers, demoShoppingOptions } from "@/data/demo";
import { actionLabels } from "@/domain/pricing";
import { formatEuro } from "@/config/site";

export function OffersView() {
  const { products, list, profile } = useAppState();
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState("all");
  const [dealsOnly, setDealsOnly] = useState(false);
  const listIds = list.map((item) => item.productId);
  const offers = useMemo(() => demoOffers.filter((offer) => {
    const option = demoShoppingOptions.find((item) => item.id === offer.id);
    const onList = option && listIds.includes(option.productId);
    const allowed = profile.enabledChainIds.includes(offer.chainId);
    const matchesQuery = `${offer.product.name} ${offer.product.brand ?? ""}`.toLocaleLowerCase("nl-NL").includes(query.toLocaleLowerCase("nl-NL"));
    return onList && allowed && matchesQuery && (chain === "all" || offer.chainId === chain) && (!dealsOnly || offer.actionType !== "none");
  }), [chain, dealsOnly, listIds, profile.enabledChainIds, query]);

  return (
    <>
      <PageHeading eyebrow="Prijsvergelijking" title="Aanbiedingen & prijzen" description="Normale prijzen en acties voor producten op jouw lijst. We tonen altijd de effectieve stukprijs." />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" /><input className="input-field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek in jouw aanbiedingen" /></label>
        <label className="relative sm:w-52"><select className="input-field appearance-none pr-9" value={chain} onChange={(event) => setChain(event.target.value)}><option value="all">Alle supermarkten</option>{demoChains.filter((item) => profile.enabledChainIds.includes(item.id)).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><SlidersHorizontal className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" /></label>
        <button onClick={() => setDealsOnly(!dealsOnly)} className={`min-h-12 rounded-xl border px-4 text-sm font-bold ${dealsOnly ? "border-mandwijs-deep bg-mandwijs-deep text-white" : "border-mandwijs-line bg-white text-mandwijs-muted"}`}><BadgePercent className="mr-2 inline size-4" />Alleen acties</button>
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0d9b9] bg-[#fff8ed] px-4 py-3 text-xs text-[#87531c]"><span className="flex items-center gap-2"><CircleAlert className="size-4 shrink-0" />Demo-prijzen — geen actuele winkelclaim</span><span className="flex items-center gap-1.5 font-bold"><CalendarRange className="size-4" /> Geldig 10–16 augustus</span></div>

      {offers.length === 0 ? <Card className="grid place-items-center px-5 py-16 text-center shadow-none"><Search className="size-8 text-mandwijs-muted" /><h2 className="mt-3 font-black">Geen resultaten</h2><p className="mt-1 text-sm text-mandwijs-muted">Pas je filters of zoekterm aan.</p></Card> : <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {offers.map((offer) => {
          const chainInfo = demoChains.find((item) => item.id === offer.chainId)!;
          const option = demoShoppingOptions.find((item) => item.id === offer.id)!;
          const ownProduct = products.find((item) => item.id === option.productId);
          const isDeal = offer.actionType !== "none";
          return <Card key={offer.id} className="overflow-hidden shadow-none">
            <div className="flex items-start gap-3 p-5 pb-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-xs font-black text-white" style={{ background: chainInfo.color }}>{chainInfo.shortName}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-1.5">{isDeal && <Badge tone="deal">{actionLabels[offer.actionType]}</Badge>}{option.matchType === "house_brand" ? <Badge tone="warning">Huismerk alternatief</Badge> : <Badge tone="success">{option.matchType === "exact" ? "Exact product" : "Vergelijkbaar product"}</Badge>}</div><h2 className="mt-2 line-clamp-2 text-sm font-extrabold leading-5">{offer.product.name}</h2><p className="mt-1 text-xs text-mandwijs-muted">voor jouw “{ownProduct?.name}”</p></div>
            </div>
            <div className="mx-5 rounded-2xl bg-[#f3f8f5] p-4">
              <div className="flex items-end justify-between"><span><small className="block text-xs font-bold text-mandwijs-muted">Effectief per stuk</small><strong className="mt-1 block text-2xl font-black tracking-[-.04em] text-mandwijs-deep">{formatEuro(offer.effectiveUnitPriceCents)}</strong></span>{isDeal && <span className="text-right"><small className="block text-[.68rem] text-mandwijs-muted">Normaal</small><span className="text-sm font-bold text-mandwijs-muted line-through">{formatEuro(offer.regularPriceCents)}</span></span>}</div>
              {offer.minimumQuantity > 1 && <div className="mt-3 grid grid-cols-2 gap-2 border-t border-mandwijs-line pt-3 text-xs"><span><span className="block text-mandwijs-muted">Je betaalt</span><strong>{formatEuro(offer.payableTotalCents)}</strong></span><span><span className="block text-mandwijs-muted">Minimaal kopen</span><strong>{offer.minimumQuantity} stuks</strong></span></div>}
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-4 text-xs text-mandwijs-muted"><span>{chainInfo.name}</span>{offer.loyaltyCardRequired && <span className="flex items-center gap-1 font-bold text-[#8a5718]"><CreditCard className="size-3.5" /> Klantenkaart vereist</span>}</div>
            {offer.minimumQuantity > 1 && <p className="border-t border-[#f0d9b9] bg-[#fff8ed] px-5 py-3 text-xs font-semibold leading-5 text-[#87531c]">Deze actie is alleen voordelig als je minstens {offer.minimumQuantity} stuks wilt kopen.</p>}
          </Card>;
        })}
      </div>}
    </>
  );
}
