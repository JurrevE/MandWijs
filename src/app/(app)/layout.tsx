import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { loadInitialAppState } from "@/lib/app-state/server";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const initialState = await loadInitialAppState();
  if (initialState.mode === "supabase" && !initialState.profile.onboardingCompleted) redirect("/onboarding");
  return <AppStateProvider initialState={initialState}><AppShell>{children}</AppShell></AppStateProvider>;
}
