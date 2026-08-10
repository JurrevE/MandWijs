"use client";

import { useMemo, useState } from "react";
import { Archive, Check, ListPlus, MoreHorizontal, PackageOpen, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeading } from "@/components/app/page-heading";
import { useAppState } from "@/components/providers/app-state-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PersonalProduct, ProductKind, ProductUnit } from "@/domain/types";

const unitLabels: Record<ProductUnit, string> = { piece: "stuk", gram: "gram", kilogram: "kilogram", milliliter: "milliliter", liter: "liter" };

const emptyForm: Omit<PersonalProduct, "id"> = {
  name: "",
  searchTerm: "",
  kind: "category",
  preferredBrand: "",
  allowHouseBrand: true,
  quantity: 1,
  unit: "piece",
  category: "Overig",
  active: true,
  notes: "",
};

function ProductDialog({ product, onClose }: { product?: PersonalProduct; onClose: () => void }) {
  const { addProduct, updateProduct, addToList } = useAppState();
  const [form, setForm] = useState<Omit<PersonalProduct, "id">>(product ? { ...product } : emptyForm);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = { ...form, searchTerm: form.searchTerm || form.name, category: form.category || "Overig" };
    if (product) updateProduct(product.id, normalized);
    else {
      const id = addProduct(normalized);
      addToList(id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#0b1f18]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-label={product ? "Product bewerken" : "Product toevoegen"}>
      <form onSubmit={submit} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-[1.75rem] sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black tracking-[-.04em]">{product ? "Product bewerken" : "Nieuw product"}</h2><p className="mt-1 text-sm text-mandwijs-muted">Vertel MandWijs wat voor jou een goede match is.</p></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-[#f0f4f2]" aria-label="Sluiten"><X className="size-5" /></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold sm:col-span-2">Productnaam<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input-field mt-2" placeholder="Bijvoorbeeld skyr naturel" /></label>
          <label className="block text-sm font-bold">Type<select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value as ProductKind })} className="input-field mt-2"><option value="category">Productcategorie</option><option value="exact">Specifiek product</option></select></label>
          <label className="block text-sm font-bold">Categorie<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="input-field mt-2" placeholder="Zuivel" /></label>
          <label className="block text-sm font-bold">Zoekterm<input value={form.searchTerm} onChange={(event) => setForm({ ...form, searchTerm: event.target.value })} className="input-field mt-2" placeholder="Leeg = productnaam" /></label>
          <label className="block text-sm font-bold">Voorkeursmerk<input value={form.preferredBrand ?? ""} onChange={(event) => setForm({ ...form, preferredBrand: event.target.value })} className="input-field mt-2" placeholder="Optioneel" /></label>
          <label className="block text-sm font-bold">Hoeveelheid<input required min="0.01" step="0.01" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} className="input-field mt-2" /></label>
          <label className="block text-sm font-bold">Eenheid<select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value as ProductUnit })} className="input-field mt-2">{Object.entries(unitLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="flex min-h-13 items-center justify-between gap-4 rounded-xl border border-mandwijs-line px-4 sm:col-span-2"><span><strong className="block text-sm">Huismerken toestaan</strong><span className="text-xs text-mandwijs-muted">We labelen alternatieven altijd duidelijk.</span></span><input type="checkbox" checked={form.allowHouseBrand} onChange={(event) => setForm({ ...form, allowHouseBrand: event.target.checked })} className="size-5 accent-[#2f6c59]" /></label>
          <label className="block text-sm font-bold sm:col-span-2">Notitie<textarea value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="input-field mt-2 min-h-20 resize-y" placeholder="Optioneel, bijvoorbeeld: zonder toegevoegde suiker" /></label>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={onClose}>Annuleren</Button><Button type="submit"><Check className="size-4" /> {product ? "Wijzigingen opslaan" : "Toevoegen aan mijn lijst"}</Button></div>
      </form>
    </div>
  );
}

export function ProductsView() {
  const { products, list, updateProduct, deleteProduct, addToList } = useAppState();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [editing, setEditing] = useState<PersonalProduct | "new" | null>(null);
  const filtered = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.category} ${product.preferredBrand ?? ""}`.toLocaleLowerCase("nl-NL").includes(query.toLocaleLowerCase("nl-NL"));
    return matchesQuery && (filter === "all" || (filter === "active" ? product.active : !product.active));
  }), [products, query, filter]);

  return (
    <>
      <PageHeading eyebrow="Persoonlijk assortiment" title="Mijn producten" description="Beheer wat je volgt. MandWijs gebruikt je voorkeuren voor de prijsvergelijking." actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> Product toevoegen</Button>} />
      <Card className="overflow-hidden shadow-none">
        <div className="flex flex-col gap-3 border-b border-mandwijs-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block sm:max-w-sm sm:flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mandwijs-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="input-field pl-10" placeholder="Zoek producten of categorieën" /></label>
          <div className="flex rounded-xl bg-[#edf2f0] p-1">{(["all", "active", "paused"] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`min-h-9 rounded-lg px-3 text-xs font-bold ${filter === value ? "bg-white text-mandwijs-text shadow-sm" : "text-mandwijs-muted"}`}>{value === "all" ? "Alle" : value === "active" ? "Actief" : "Gepauzeerd"}</button>)}</div>
        </div>
        {filtered.length === 0 ? (
          <div className="grid place-items-center px-5 py-16 text-center"><span className="grid size-14 place-items-center rounded-2xl bg-[#eaf3ef]"><PackageOpen className="size-7 text-mandwijs-primary" /></span><h2 className="mt-4 font-extrabold">Geen producten gevonden</h2><p className="mt-1 max-w-sm text-sm text-mandwijs-muted">Pas je zoekterm aan of voeg een nieuw product toe.</p></div>
        ) : (
          <div className="divide-y divide-mandwijs-line">
            {filtered.map((product) => {
              const onList = list.some((item) => item.productId === product.id);
              return <article key={product.id} className={`flex flex-col gap-4 p-4 transition sm:flex-row sm:items-center sm:p-5 ${!product.active ? "bg-[#fafbfb] opacity-70" : ""}`}>
                <button onClick={() => updateProduct(product.id, { active: !product.active })} className={`grid size-11 shrink-0 place-items-center rounded-xl ${product.active ? "bg-[#e4f4ed] text-mandwijs-deep" : "bg-[#edf0ef] text-mandwijs-muted"}`} aria-label={product.active ? `${product.name} pauzeren` : `${product.name} activeren`}>{product.active ? <Check className="size-5" /> : <Archive className="size-5" />}</button>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-extrabold">{product.name}</h2><Badge tone={product.kind === "exact" ? "success" : "neutral"}>{product.kind === "exact" ? "Specifiek" : "Categorie"}</Badge>{!product.active && <Badge tone="warning">Gepauzeerd</Badge>}</div><p className="mt-1 text-xs text-mandwijs-muted">{product.quantity} {unitLabels[product.unit]} · {product.category}{product.preferredBrand ? ` · voorkeur ${product.preferredBrand}` : ""} · huismerk {product.allowHouseBrand ? "toegestaan" : "uit"}</p></div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {!onList && <Button variant="soft" onClick={() => addToList(product.id)} className="min-h-9 px-3"><ListPlus className="size-4" /> Op lijst</Button>}
                  <button onClick={() => setEditing(product)} className="grid size-10 place-items-center rounded-xl text-mandwijs-muted hover:bg-[#edf3f0] hover:text-mandwijs-text" aria-label={`${product.name} bewerken`}><Pencil className="size-4" /></button>
                  <button onClick={() => deleteProduct(product.id)} className="grid size-10 place-items-center rounded-xl text-mandwijs-muted hover:bg-[#fff0f1] hover:text-[#a73b43]" aria-label={`${product.name} verwijderen`}><Trash2 className="size-4" /></button>
                  <button className="grid size-10 place-items-center rounded-xl text-mandwijs-muted sm:hidden" aria-label="Meer opties"><MoreHorizontal className="size-5" /></button>
                </div>
              </article>;
            })}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-mandwijs-line bg-[#fbfcfb] px-5 py-3 text-xs text-mandwijs-muted"><span>{filtered.length} van {products.length} producten</span><span className="hidden sm:block">Wijzigingen worden automatisch opgeslagen</span></div>
      </Card>
      {editing && <ProductDialog product={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
