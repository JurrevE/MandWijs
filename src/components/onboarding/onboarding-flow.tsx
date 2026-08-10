"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, LocateFixed, Mail, MapPin, PackagePlus, Sparkles, Store, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAppState } from "@/components/providers/app-state-provider";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { EmailPreference } from "@/domain/email";

const steps = [
  { label: "Profiel", icon: UserRound },
  { label: "Locatie", icon: MapPin },
  { label: "Winkels", icon: Store },
  { label: "Eerste lijst", icon: PackagePlus },
];

export function OnboardingFlow() {
  const router = useRouter();
  const { profile, chains, mode, updateProfile, toggleChain, products, addProduct, addToList } = useAppState();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [location, setLocation] = useState(profile.locationLabel);
  const [firstProduct, setFirstProduct] = useState("");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const next = () => {
    if (step === 0) updateProfile({ name: name.trim() || "MandWijs-gebruiker" });
    if (step === 1) updateProfile({ locationLabel: location.trim() || "Utrecht Centrum" });
    if (step < steps.length - 1) setStep(step + 1);
  };

  const finish = () => {
    if (firstProduct.trim()) {
      const id = addProduct({ name: firstProduct.trim(), searchTerm: firstProduct.trim(), kind: "category", allowHouseBrand: true, quantity: 1, unit: "piece", category: "Overig", active: true });
      addToList(id);
    }
    updateProfile({ onboardingCompleted: true });
    router.push("/dashboard");
  };

  const useLocation = () => {
    if (!navigator.geolocation) return setLocationMessage("Gebruik hieronder een plaats of postcode.");
    setLocationMessage("Locatie wordt opgehaald…");
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      updateProfile({ latitude: coords.latitude, longitude: coords.longitude });
      setLocation("Huidige locatie");
      setLocationMessage("Gevonden. Je kunt hieronder ook een algemenere locatie invullen.");
    }, () => setLocationMessage("Geen probleem. Vul handmatig een plaats, postcode of adres in."), { timeout: 8000 });
  };

  return (
    <main className="min-h-screen bg-[#f7faf8]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"><Logo /><span className="text-xs font-bold text-mandwijs-muted">Stap {step + 1} van {steps.length}</span></header>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-12 pt-6 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:pt-14">
        <aside className="hidden lg:block"><ol className="space-y-2">{steps.map(({ label, icon: Icon }, index) => <li key={label} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${step === index ? "bg-[#e2f1eb] text-mandwijs-deep" : index < step ? "text-mandwijs-primary" : "text-mandwijs-muted"}`}><span className={`grid size-8 place-items-center rounded-lg ${index <= step ? "bg-white" : "bg-[#e9edeb]"}`}>{index < step ? <Check className="size-4" /> : <Icon className="size-4" />}</span>{label}</li>)}</ol></aside>
        <section className="surface-card mx-auto w-full max-w-2xl p-5 sm:p-9">
          <div className="mb-7 flex gap-2 lg:hidden">{steps.map((item, index) => <span key={item.label} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-mandwijs-primary" : "bg-[#dce4e0]"}`} />)}</div>

          {step === 0 && <div><span className="grid size-13 place-items-center rounded-2xl bg-[#e4f3ed] text-mandwijs-deep"><Sparkles className="size-6" /></span><h1 className="mt-5 text-3xl font-black tracking-[-.045em]">Welkom bij MandWijs</h1><p className="mt-3 leading-7 text-mandwijs-muted">We stemmen je vergelijking in een paar korte stappen af. Hoe mogen we je noemen?</p><label className="mt-7 block text-sm font-bold">Jouw naam<input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-2" placeholder="Bijvoorbeeld Sanne" /></label></div>}

          {step === 1 && <div><span className="grid size-13 place-items-center rounded-2xl bg-[#e4f3ed] text-mandwijs-deep"><MapPin className="size-6" /></span><h1 className="mt-5 text-3xl font-black tracking-[-.045em]">Waar doe je boodschappen?</h1><p className="mt-3 leading-7 text-mandwijs-muted">Gebruik browserlocatie als je echt op kilometers wilt filteren. Een plaats of postcode bewaren we zonder geocoding alleen als algemeen locatielabel.</p><Button onClick={useLocation} variant="soft" className="mt-6 w-full"><LocateFixed className="size-4" /> Gebruik browserlocatie</Button>{locationMessage && <p className="mt-3 rounded-xl bg-[#f2f6f4] p-3 text-xs text-mandwijs-muted">{locationMessage}</p>}<label className="mt-5 block text-sm font-bold">Plaats, postcode of adres<input value={location} onChange={(event) => setLocation(event.target.value)} className="input-field mt-2" /></label><div className="mt-6"><span className="text-sm font-bold">Zoekradius</span><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">{siteConfig.radiusOptionsKm.map((radius) => <button key={radius} onClick={() => updateProfile({ radiusKm: radius })} className={`min-h-11 rounded-xl text-xs font-bold ${profile.radiusKm === radius ? "bg-mandwijs-deep text-white" : "border border-mandwijs-line"}`}>{radius} km</button>)}</div></div></div>}

          {step === 2 && <div><span className="grid size-13 place-items-center rounded-2xl bg-[#e4f3ed] text-mandwijs-deep"><Store className="size-6" /></span><h1 className="mt-5 text-3xl font-black tracking-[-.045em]">Welke winkels passen bij jou?</h1><p className="mt-3 leading-7 text-mandwijs-muted">Schakel ketens uit waar je niet wilt komen. Specifieke filialen beheer je later bij Winkels.</p><div className="mt-6 grid gap-2 sm:grid-cols-2">{chains.map((chain) => { const enabled = profile.enabledChainIds.includes(chain.id); return <button key={chain.id} onClick={() => toggleChain(chain.id)} className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left ${enabled ? "border-mandwijs-primary bg-[#f1f8f5]" : "border-mandwijs-line bg-white opacity-65"}`}><span className="grid size-9 place-items-center rounded-xl text-[.65rem] font-black text-white" style={{ background: chain.color }}>{chain.shortName}</span><span className="flex-1 text-sm font-bold">{chain.name}</span><span className={`grid size-6 place-items-center rounded-lg ${enabled ? "bg-mandwijs-primary text-white" : "border border-[#b8c5c0] text-transparent"}`}><Check className="size-4" /></span></button>; })}</div></div>}

          {step === 3 && <div><span className="grid size-13 place-items-center rounded-2xl bg-[#e4f3ed] text-mandwijs-deep"><PackagePlus className="size-6" /></span><h1 className="mt-5 text-3xl font-black tracking-[-.045em]">Maak je eerste vergelijking</h1><p className="mt-3 leading-7 text-mandwijs-muted">Voeg een product toe{mode === "demo" ? ` of ga verder met de ${products.length} voorbeeldproducten uit de demo` : "; dit wordt veilig aan je account gekoppeld"}.</p><label className="mt-6 block text-sm font-bold">Eerste product<input value={firstProduct} onChange={(event) => setFirstProduct(event.target.value)} className="input-field mt-2" placeholder="Bijvoorbeeld kipfilet" /></label><div className="mt-6"><span className="text-sm font-bold">Maandagmail</span><div className="mt-3 grid gap-2">{(["none", "summary", "full"] as EmailPreference[]).map((value) => <button key={value} onClick={() => updateProfile({ emailPreference: value })} className={`flex items-center gap-3 rounded-xl border p-4 text-left ${profile.emailPreference === value ? "border-mandwijs-primary bg-[#f1f8f5]" : "border-mandwijs-line"}`}><Mail className="size-5 text-mandwijs-primary" /><span className="flex-1"><strong className="block text-sm">{value === "none" ? "Geen e-mail" : value === "summary" ? "Korte samenvatting" : "Volledige boodschappenlijst"}</strong><span className="text-xs text-mandwijs-muted">{value === "none" ? "Je kijkt wanneer het jou uitkomt" : value === "summary" ? "Totaal, winkels en beste acties" : "Alle producten, prijzen en winkelvolgorde"}</span></span>{profile.emailPreference === value && <Check className="size-5 text-mandwijs-primary" />}</button>)}</div></div></div>}

          <div className="mt-9 flex items-center justify-between border-t border-mandwijs-line pt-5"><Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="size-4" /> Terug</Button>{step < steps.length - 1 ? <Button onClick={next}>Verder <ArrowRight className="size-4" /></Button> : <Button onClick={finish}>Naar mijn overzicht <ArrowRight className="size-4" /></Button>}</div>
        </section>
      </div>
    </main>
  );
}
