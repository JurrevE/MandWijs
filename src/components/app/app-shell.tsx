"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeEuro,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
  PackageSearch,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  Store,
} from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { Logo } from "@/components/logo";
import { useAppState } from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
  { href: "/boodschappenlijst", label: "Boodschappenlijst", icon: ListChecks },
  { href: "/producten", label: "Mijn producten", icon: PackageSearch },
  { href: "/aanbiedingen", label: "Aanbiedingen", icon: BadgeEuro },
  { href: "/winkels", label: "Winkels", icon: Store },
];

const secondary = [
  { href: "/instellingen", label: "Instellingen", icon: Settings },
  { href: "/admin", label: "Datacontrole", icon: ShieldCheck },
];

function NavLink({ item, mobile = false }: { item: (typeof navigation)[number]; mobile?: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        mobile
          ? "flex min-w-[4rem] flex-1 flex-col items-center gap-1 py-2 text-[.65rem] font-bold"
          : "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold",
        active ? (mobile ? "text-mandwijs-deep" : "bg-[#e5f1ec] text-mandwijs-deep") : "text-mandwijs-muted hover:bg-[#f0f5f3] hover:text-mandwijs-text",
      )}
    >
      <Icon className={cn(mobile ? "size-5" : "size-[1.1rem]", active && "stroke-[2.5]")} />
      <span>{mobile && item.label === "Boodschappenlijst" ? "Lijst" : mobile && item.label === "Mijn producten" ? "Producten" : item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, list, mode, dataSource, userEmail, databaseReady, persistenceError } = useAppState();
  return (
    <div className="min-h-screen bg-[#f7faf8] lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-mandwijs-line bg-white px-4 py-5 lg:flex lg:flex-col">
        <Logo href="/dashboard" className="px-2" />
        <nav aria-label="Appnavigatie" className="mt-8 space-y-1">
          {navigation.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>
        <div className="my-5 h-px bg-mandwijs-line" />
        <nav aria-label="Secundaire navigatie" className="space-y-1">
          {secondary.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-2xl bg-mandwijs-deep p-4 text-white">
            <CircleHelp className="size-5 text-mandwijs-accent" />
            <p className="mt-3 text-xs font-bold">{dataSource === "live" ? "PrijsProfeet live" : "Demo-fallback actief"}</p>
            <p className="mt-1 text-[.7rem] leading-5 text-white/60">{persistenceError ?? (mode === "supabase" ? (databaseReady ? "Accountgegevens worden veilig opgeslagen." : "Voer de Supabase-migratie nog uit.") : "Je gebruikt een lokale demosessie.")}</p>
          </div>
          <form action={logoutAction}>
            <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-mandwijs-muted hover:bg-[#f0f5f3] hover:text-mandwijs-text">
              <LogOut className="size-[1.1rem]" /> Uitloggen
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[4.5rem] items-center justify-between border-b border-mandwijs-line bg-white/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <Logo href="/dashboard" className="lg:hidden" />
          <div className="hidden items-center gap-2 text-sm text-mandwijs-muted sm:flex">
            <MapPin className="size-4 text-mandwijs-primary" />
            <strong className="text-mandwijs-text">{profile.locationLabel}</strong>
            <span>· {profile.radiusKm} km</span>
          </div>
          <Link href="/boodschappenlijst" aria-label={`Boodschappenlijst, ${list.length} producten`} className="relative ml-auto mr-3 grid size-10 place-items-center rounded-xl bg-[#edf5f2] text-mandwijs-deep hover:bg-[#e2f0ea] lg:hidden">
            <ShoppingBasket className="size-5" />
            {list.length > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-mandwijs-deep text-[.62rem] font-black text-white">{list.length}</span>}
          </Link>
          <button className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-[#f1f5f3]" aria-label="Accountmenu">
            <span className="grid size-9 place-items-center rounded-xl bg-mandwijs-secondary text-sm font-black text-mandwijs-deep">{profile.name.slice(0, 1).toUpperCase()}</span>
            <span className="hidden text-left sm:block"><strong className="block text-xs">{profile.name}</strong><span className="block max-w-40 truncate text-[.65rem] text-mandwijs-muted">{mode === "supabase" ? (userEmail || "Supabase-account") : "Demo-account"}</span></span>
            <ChevronDown className="hidden size-4 text-mandwijs-muted sm:block" />
          </button>
        </header>
        <main className="mx-auto max-w-[95rem] px-4 pb-28 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-12">{children}</main>
      </div>

      <nav aria-label="Mobiele navigatie" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-mandwijs-line bg-white/95 px-2 pb-[max(.35rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        {navigation.slice(0, 4).map((item) => <NavLink key={item.href} item={item} mobile />)}
        <NavLink item={{ href: "/instellingen", label: "Meer", icon: Settings }} mobile />
      </nav>
    </div>
  );
}
