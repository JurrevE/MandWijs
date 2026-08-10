import type { Metadata } from "next";
import { ShoppingListView } from "@/components/list/shopping-list-view";

export const metadata: Metadata = { title: "Boodschappenlijst" };

export default function ShoppingListPage() {
  return <ShoppingListView />;
}
