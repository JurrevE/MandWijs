import type { Metadata } from "next";
import { OffersView } from "@/components/offers/offers-view";

export const metadata: Metadata = { title: "Aanbiedingen en prijzen" };

export default function OffersPage() {
  return <OffersView />;
}
