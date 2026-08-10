import { AppShell } from "@/components/app/app-shell";
import { AppStateProvider } from "@/components/providers/app-state-provider";

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return <AppStateProvider><AppShell>{children}</AppShell></AppStateProvider>;
}
