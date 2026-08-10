"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, CircleAlert, Minus, Plus, RotateCcw, ShoppingBasket, Store, Trash2, X } from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { DataAttribution } from "@/components/app/data-attribution";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { optimizeShopping, type Strategy } from "@/domain/optimizer";
import { formatEuro } from "@/config/site";
import { localizeShoppingOptions } from "@/domain/market-data";

const strategyLabels: Record<Strategy, string> = {
  cheapest: "Beste prijs",
  max_two: "Max. 2 winkels",
  fewest: "Minste winkels",
  balance: "Beste balans",
};

export function ShoppingListView() {
  const { products, list, profile, chains, stores, shoppingOptions, dataSource, updateListItem, removeFromList, clearList } = useAppState();
  const [strategy, setStrategy] = useState<Strategy>("balance");
  const activeItems = list.filter((item) => !item.checked);
  const checkedItems = list.filter((item) => item.checked);

  const adjustedOptions = useMemo(() => localizeShoppingOptions(shoppingOptions, stores, profile)
    .filter((option) => activeItems.some((item) => item.productId === option.productId))
    .filter((option) => profile.enabledChainIds.includes(option.chainId) && !profile.disabledStoreIds.includes(option.storeId))
    .map((option) => {
      const requested = activeItems.find((item) => item.productId === option.productId)?.quantity ?? 1;
      return { ...option, requestedQuantity: requested, priceCents: option.priceCents * Math.ceil(requested / option.payableQuantity) };
    }), [activeItems, profile, stores, shoppingOptions]);

  const plan = optimizeShopping({
    productIds: activeItems.map((item) => item.productId),
    options: adjustedOptions,
    strategy,
    storePenaltyCents: 300,
  });
  const storeIds = [...new Set(plan.options.map((option) => option.storeId))];

  if (list.length === 0) {
    return (
      <>
        <PageHeading eyebrow="Weeklijst" title="Boodschappenlijst" description="Stel je lijst samen en laat MandWijs de slimste winkelverdeling berekenen." />
        <Card className="grid place-items-center px-5 py-20 text-center shadow-none"><span className="grid size-16 place-items-center rounded-2xl bg-[#e5f3ed] text-mandwijs-deep"><ShoppingBasket className="size-8" /></span><h2 className="mt-5 text-xl font-black">Je lijst is nog leeg</h2><p className="mt-2 max-w-md text-sm leading-6 text-mandwijs-muted">Kies producten uit je persoonlijke assortiment. We vergelijken daarna meteen de beschikbare winkelopties.</p><ButtonLink href="/producten" className="mt-6"><Plus className="size-4" /> Producten kiezen</ButtonLink></Card>
      </>
    );
  }

  return (
    <>
      <PageHeading eyebrow="Weeklijst" title="Boodschappenlijst" description={`${activeItems.length} producten om te halen · ${checkedItems.length} al afgevinkt`} actions={<Button variant="ghost" onClick={clearList}><Trash2 className="size-4" /> Lijst leegmaken</Button>} />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Winkelstrategie">
        {(Object.keys(strategyLabels) as Strategy[]).map((value) => (
          <button key={value} role="tab" aria-selected={strategy === value} onClick={() => setStrategy(value)} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold ${strategy === value ? "bg-mandwijs-deep text-white shadow-md" : "border border-mandwijs-line bg-white text-mandwijs-muted hover:text-mandwijs-text"}`}>{strategyLabels[value]}</button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card className="overflow-hidden shadow-none">
            <div className="flex flex-col gap-4 bg-mandwijs-deep p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div><Badge tone="deal"><CheckCircle2 className="mr-1 size-3" /> {strategyLabels[strategy]}</Badge><h2 className="mt-3 text-xl font-black">{plan.label}</h2><p className="mt-1 max-w-xl text-xs leading-5 text-white/60">{plan.description}</p></div>
              <div className="sm:text-right"><span className="block text-xs font-bold uppercase tracking-wider text-white/50">Geschat totaal</span><strong className="mt-1 block text-3xl font-black">{formatEuro(plan.totalCents)}</strong><span className="text-xs text-white/60">{plan.storeCount} {plan.storeCount === 1 ? "winkel" : "winkels"}</span></div>
            </div>

            {storeIds.map((storeId, index) => {
              const store = stores.find((item) => item.id === storeId);
              const chain = chains.find((item) => item.id === store?.chainId);
              if (!store || !chain) return null;
              const options = plan.options.filter((option) => option.storeId === storeId);
              return <section key={storeId} className="border-b border-mandwijs-line last:border-0">
                <div className="flex items-center gap-3 bg-[#f7faf8] px-4 py-4 sm:px-6">
                  <span className="grid size-7 place-items-center rounded-full bg-mandwijs-deep text-xs font-black text-white">{index + 1}</span>
                  <span className="grid size-10 place-items-center rounded-xl text-xs font-black text-white" style={{ background: chain.color }}>{chain.shortName}</span>
                  <span className="min-w-0 flex-1"><h3 className="truncate text-sm font-extrabold">{store.name}</h3><p className="truncate text-xs text-mandwijs-muted">{store.address}, {store.city}</p></span>
                  <span className="text-right"><strong className="block text-sm">{formatEuro(options.reduce((sum, option) => sum + option.priceCents, 0))}</strong><span className="text-[.68rem] text-mandwijs-muted">{options.length} producten</span></span>
                </div>
                <div className="divide-y divide-mandwijs-line px-4 sm:px-6">
                  {options.map((option) => {
                    const item = activeItems.find((entry) => entry.productId === option.productId)!;
                    return <article key={option.id} className="flex gap-3 py-4">
                      <button onClick={() => updateListItem(option.productId, { checked: true })} className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 border-[#b6c9c1] text-white hover:border-mandwijs-primary hover:bg-mandwijs-primary" aria-label={`${option.productName} afvinken`}><Check className="size-3.5" /></button>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-extrabold">{option.productName}</h4>{option.matchType === "house_brand" && <Badge tone="warning">Huismerk alternatief</Badge>}{option.actionLabel && <Badge tone="deal">Aanbieding</Badge>}</div><p className="mt-1 text-xs text-mandwijs-muted">{item.quantity}× gevraagd · {option.payableQuantity > 1 ? `${option.payableQuantity}× betalen per actiebundel` : "prijs per stuk"}</p>{option.warning && <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold leading-5 text-[#9a5616]"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />{option.warning}</p>}</div>
                      <strong className="shrink-0 text-sm">{formatEuro(option.priceCents)}</strong>
                    </article>;
                  })}
                </div>
              </section>;
            })}

            {plan.unmatchedProductIds.length > 0 && <div className="bg-[#fff9ef] p-5 sm:p-6"><h3 className="flex items-center gap-2 text-sm font-extrabold text-[#86501a]"><CircleAlert className="size-4" /> Geen betrouwbare match</h3><ul className="mt-3 space-y-2">{plan.unmatchedProductIds.map((productId) => <li key={productId} className="text-sm text-[#86501a]">{products.find((product) => product.id === productId)?.name ?? "Onbekend product"}</li>)}</ul></div>}
          </Card>

          {checkedItems.length > 0 && <Card className="overflow-hidden shadow-none"><div className="flex items-center justify-between border-b border-mandwijs-line px-5 py-4"><h2 className="text-sm font-black">Afgevinkt ({checkedItems.length})</h2><button onClick={() => checkedItems.forEach((item) => updateListItem(item.productId, { checked: false }))} className="text-xs font-bold text-mandwijs-deep hover:underline"><RotateCcw className="mr-1 inline size-3.5" />Herstellen</button></div><div className="divide-y divide-mandwijs-line">{checkedItems.map((item) => <div key={item.productId} className="flex items-center gap-3 px-5 py-3 opacity-55"><button onClick={() => updateListItem(item.productId, { checked: false })} className="grid size-6 place-items-center rounded-lg bg-mandwijs-primary text-white"><Check className="size-4" /></button><span className="flex-1 text-sm line-through">{products.find((product) => product.id === item.productId)?.name}</span><button onClick={() => removeFromList(item.productId)} aria-label="Verwijderen"><X className="size-4" /></button></div>)}</div></Card>}
        </div>

        <aside className="space-y-4">
          <Card className="p-5 shadow-none"><h2 className="text-sm font-black">Hoeveelheden</h2><div className="mt-4 space-y-4">{activeItems.map((item) => { const product = products.find((entry) => entry.id === item.productId); return <div key={item.productId}><div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-xs font-bold">{product?.name}</span><button onClick={() => removeFromList(item.productId)} className="text-mandwijs-muted hover:text-[#a53b43]" aria-label="Verwijderen"><Trash2 className="size-3.5" /></button></div><div className="flex items-center rounded-xl border border-mandwijs-line bg-white"><button onClick={() => updateListItem(item.productId, { quantity: Math.max(1, item.quantity - 1) })} className="grid size-10 place-items-center" aria-label="Minder"><Minus className="size-4" /></button><span className="flex-1 text-center text-sm font-black">{item.quantity}</span><button onClick={() => updateListItem(item.productId, { quantity: item.quantity + 1 })} className="grid size-10 place-items-center" aria-label="Meer"><Plus className="size-4" /></button></div></div>; })}</div><ButtonLink href="/producten" variant="soft" className="mt-5 w-full"><Plus className="size-4" /> Product toevoegen</ButtonLink></Card>
          <Card className="p-5 shadow-none"><h2 className="flex items-center gap-2 text-sm font-black"><Store className="size-4 text-mandwijs-primary" />Prijsuitleg</h2><p className="mt-3 text-xs leading-5 text-mandwijs-muted">Het totaal bevat verplichte actie-aantallen. De balansscore telt € 3,00 per extra winkel op om gemak mee te wegen; dat bedrag betaal je niet echt.</p><DataAttribution source={dataSource} className="mt-3 inline-block text-xs text-mandwijs-deep" /></Card>
        </aside>
      </div>
    </>
  );
}
