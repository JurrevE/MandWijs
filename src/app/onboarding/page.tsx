import type { Metadata } from "next";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Persoonlijke instellingen" };

export default function OnboardingPage() {
  return <AppStateProvider><OnboardingFlow /></AppStateProvider>;
}
