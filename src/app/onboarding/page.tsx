import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { loadInitialAppState } from "@/lib/app-state/server";

export const metadata: Metadata = { title: "Persoonlijke instellingen" };

export default async function OnboardingPage() {
  const initialState = await loadInitialAppState();
  if (initialState.mode === "supabase" && initialState.profile.onboardingCompleted) redirect("/dashboard");
  return <AppStateProvider initialState={initialState}><OnboardingFlow /></AppStateProvider>;
}
