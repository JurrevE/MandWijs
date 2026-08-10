import { describe, expect, it } from "vitest";
import { demoProducts } from "@/data/demo";
import { matchProduct } from "./matching";
import type { ProviderProduct } from "./types";

const skyr = demoProducts.find((product) => product.id === "skyr")!;

describe("matchProduct", () => {
  it("geeft EAN altijd de hoogste prioriteit", () => {
    const candidate: ProviderProduct = { id: "a", ean: "871234", name: "Onbekende naam", category: "Overig" };
    expect(matchProduct({ personalProduct: skyr, providerProduct: candidate, expectedEan: "871234" }).matchType).toBe("exact");
  });

  it("herkent een toegestaan huismerk-alternatief", () => {
    const candidate: ProviderProduct = { id: "b", name: "AH Skyr naturel", category: "Zuivel", isHouseBrand: true };
    expect(matchProduct({ personalProduct: skyr, providerProduct: candidate })).toMatchObject({ matchType: "house_brand", confidence: 0.72 });
  });

  it("weigert een onbetrouwbare match", () => {
    const candidate: ProviderProduct = { id: "c", name: "Cola zero", category: "Frisdrank" };
    expect(matchProduct({ personalProduct: skyr, providerProduct: candidate })).toMatchObject({ matchType: "none", confidence: 0 });
  });
});
