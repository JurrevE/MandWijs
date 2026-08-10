import {
  ArrowRight,
  BadgeEuro,
  Check,
  ChevronRight,
  MailCheck,
  MapPin,
  Route,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store,
  TrendingDown,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEuro } from "@/config/site";

const steps = [
  { icon: ShoppingBasket, label: "Jouw vaste producten", text: "Voeg toe wat je écht koopt, inclusief merk- en huismerkvoorkeur." },
  { icon: MapPin, label: "Winkels in de buurt", text: "Kies je locatie, radius en de supermarkten waar je wilt komen." },
  { icon: Route, label: "Een helder winkelplan", text: "Vergelijk de laagste prijs met één, twee of meer winkels." },
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Logo />
        <nav aria-label="Hoofdnavigatie" className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">Inloggen</ButtonLink>
          <ButtonLink href="/register">Gratis proberen <ArrowRight className="size-4" /></ButtonLink>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-28 lg:pt-20">
        <div className="fade-up max-w-3xl">
          <Badge tone="success" className="mb-6 px-3 py-2 text-xs">
            <Sparkles className="mr-1.5 size-3.5" /> Slimmer kiezen, elke week opnieuw
          </Badge>
          <h1 className="max-w-3xl text-balance text-[clamp(2.8rem,7vw,5.7rem)] font-black leading-[0.96] tracking-[-0.065em] text-mandwijs-deep">
            Je boodschappen.
            <span className="block text-mandwijs-primary">Minder betalen.</span>
          </h1>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-mandwijs-muted sm:text-xl">
            MandWijs vergelijkt jouw persoonlijke lijst met actuele prijzen en aanbiedingen. Jij kiest hoeveel winkels je wilt bezoeken.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" className="min-h-14 px-6 text-base">
              Maak je eerste lijst <ArrowRight className="size-5" />
            </ButtonLink>
            <ButtonLink href="/demo" variant="secondary" className="min-h-14 px-6 text-base">
              Bekijk de demo
            </ButtonLink>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mandwijs-muted">
            {["Gratis starten", "Geen betaalgegevens", "Nederlandse supermarkten"].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5"><Check className="size-4 text-mandwijs-primary" />{item}</span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="absolute -inset-10 -z-10 rounded-full bg-mandwijs-secondary/20 blur-3xl" />
          <Card className="overflow-hidden p-3 shadow-[0_30px_90px_rgba(23,61,50,.15)] sm:p-5">
            <div className="rounded-2xl bg-[#f1f7f4] p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-mandwijs-muted">Beste balans deze week</p>
                  <p className="mt-2 text-4xl font-black tracking-[-.04em] text-mandwijs-deep">{formatEuro(2837)}</p>
                  <p className="mt-1 text-sm text-mandwijs-muted">8 producten · 2 winkels</p>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-mandwijs-primary shadow-sm">
                  <TrendingDown className="size-6" />
                </span>
              </div>
              <div className="mt-6 grid gap-3">
                {[
                  { name: "Lidl", count: "5 producten", price: 1712, color: "bg-[#17513d]" },
                  { name: "Albert Heijn", count: "3 producten", price: 1125, color: "bg-[#28a9e0]" },
                ].map((store) => (
                  <div key={store.name} className="flex items-center gap-3 rounded-xl border border-white bg-white/90 p-3.5">
                    <span className={`grid size-10 place-items-center rounded-xl text-xs font-black text-white ${store.color}`}>{store.name.slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0 flex-1"><strong className="block text-sm">{store.name}</strong><span className="text-xs text-mandwijs-muted">{store.count}</span></span>
                    <strong className="text-sm">{formatEuro(store.price)}</strong>
                    <ChevronRight className="size-4 text-mandwijs-muted" />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 px-1 pb-1 pt-4 text-center">
              <div><span className="block text-xs text-mandwijs-muted">Je bespaart</span><strong className="text-sm text-mandwijs-deep">{formatEuro(846)}</strong></div>
              <div className="border-x border-mandwijs-line"><span className="block text-xs text-mandwijs-muted">Aanbiedingen</span><strong className="text-sm">4 actief</strong></div>
              <div><span className="block text-xs text-mandwijs-muted">Bijgewerkt</span><strong className="text-sm">08:15</strong></div>
            </div>
          </Card>
          <div className="absolute -bottom-6 -left-3 flex items-center gap-3 rounded-2xl border border-mandwijs-line bg-white px-4 py-3 shadow-xl sm:-left-10">
            <span className="grid size-9 place-items-center rounded-xl bg-[#e0f6ed] text-[#1d7055]"><BadgeEuro className="size-5" /></span>
            <span><strong className="block text-xs">1+1 gratis herkend</strong><span className="text-[.68rem] text-mandwijs-muted">Effectief {formatEuro(149)} per stuk</span></span>
          </div>
        </div>
      </section>

      <section id="zo-werkt-het" className="border-y border-mandwijs-line bg-white/75 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <span className="eyebrow">Zo werkt het</span>
            <h2 className="mt-4 text-3xl font-black tracking-[-.045em] text-mandwijs-deep sm:text-5xl">Van lijstje naar slim winkelplan.</h2>
            <p className="mt-4 text-lg leading-8 text-mandwijs-muted">Geen folders doorspitten. MandWijs maakt de voorwaarden achter aanbiedingen zichtbaar en rekent eerlijk door.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, label, text }, index) => (
              <Card key={label} className="relative p-6 shadow-none">
                <span className="absolute right-5 top-5 font-mono text-xs font-bold text-mandwijs-muted/60">0{index + 1}</span>
                <span className="grid size-12 place-items-center rounded-2xl bg-[#e5f3ed] text-mandwijs-deep"><Icon className="size-6" /></span>
                <h3 className="mt-8 text-lg font-extrabold">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-mandwijs-muted">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:px-10">
        <div>
          <span className="eyebrow">Eerlijk vergelijken</span>
          <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-.045em] text-mandwijs-deep sm:text-5xl">De echte prijs, zonder kleine lettertjes.</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-mandwijs-muted">We tonen normale prijs, actieprijs, verplichte aantallen en hoe betrouwbaar een match is. Zo bepaal jij wat écht voordeel is.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              [ShieldCheck, "Transparante matches", "Exact, vergelijkbaar of huismerk"],
              [Store, "Jouw winkels", "Keten of filiaal uitschakelen"],
              [MailCheck, "Maandagmail", "Alleen als jij dat wilt"],
              [BadgeEuro, "Normaal én actie", "Altijd effectief doorgerekend"],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof ShieldCheck;
              return <div key={String(title)} className="flex gap-3 rounded-2xl p-3"><FeatureIcon className="mt-0.5 size-5 shrink-0 text-mandwijs-primary" /><span><strong className="block text-sm">{String(title)}</strong><span className="text-xs text-mandwijs-muted">{String(text)}</span></span></div>;
            })}
          </div>
        </div>
        <Card className="bg-mandwijs-deep p-6 text-white sm:p-8">
          <div className="flex items-center justify-between">
            <div><Badge tone="deal">1+1 gratis</Badge><h3 className="mt-3 text-xl font-extrabold">Arla Skyr naturel</h3><p className="text-sm text-white/60">1 kg · Albert Heijn</p></div>
            <span className="text-right"><span className="block text-xs text-white/60">per stuk</span><strong className="text-3xl">{formatEuro(199)}</strong></span>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2 rounded-2xl bg-white/8 p-4 text-center">
            <span><small className="block text-white/55">Normaal</small><strong className="text-sm line-through">{formatEuro(398)}</strong></span>
            <span className="border-x border-white/10"><small className="block text-white/55">Je betaalt</small><strong className="text-sm">{formatEuro(398)}</strong></span>
            <span><small className="block text-white/55">Minimaal</small><strong className="text-sm">2 stuks</strong></span>
          </div>
          <p className="mt-4 rounded-xl bg-[#ffedcf] px-4 py-3 text-xs font-semibold leading-5 text-[#7c480d]">Deze actie is alleen voordelig als je minstens 2 stuks wilt kopen.</p>
        </Card>
      </section>

      <section className="px-5 pb-8 sm:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-mandwijs-deep px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-black tracking-[-.045em] sm:text-5xl">Klaar om je boodschappen slimmer te plannen?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/65">Maak een echt account of ontdek eerst de demo. Live prijsdata valt automatisch veilig terug als de provider niet bereikbaar is.</p>
          <ButtonLink href="/register" variant="soft" className="mt-8 min-h-14 px-7 text-base">Gratis beginnen <ArrowRight className="size-5" /></ButtonLink>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 text-sm text-mandwijs-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <Logo className="text-mandwijs-text" />
        <p>Prijsvergelijkingen zijn schattingen op basis van beschikbare data.</p>
        <div className="flex gap-5"><a href="#zo-werkt-het" className="hover:text-mandwijs-text">Hoe het werkt</a><a href="mailto:hallo@mandwijs.app" className="hover:text-mandwijs-text">Contact</a></div>
      </footer>
    </main>
  );
}
