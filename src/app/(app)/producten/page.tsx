import type { Metadata } from "next";
import { ProductsView } from "@/components/products/products-view";

export const metadata: Metadata = { title: "Mijn producten" };

export default function ProductsPage() {
  return <ProductsView />;
}
