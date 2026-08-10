import type { Metadata } from "next";
import { StoresView } from "@/components/stores/stores-view";

export const metadata: Metadata = { title: "Locatie en winkels" };

export default function StoresPage() {
  return <StoresView />;
}
