import { describe, expect, it } from "vitest";
import { demoOffers } from "@/data/demo";
import { mergeOfferImport } from "./imports";

describe("idempotente imports", () => {
  it("voegt dezelfde aanbieding bij herimport niet dubbel toe", () => {
    const offer = demoOffers[0];
    const first = mergeOfferImport([], [offer]);
    const second = mergeOfferImport(first.records, [offer]);
    expect(first).toMatchObject({ imported: 1, updated: 0 });
    expect(second).toMatchObject({ imported: 0, updated: 1 });
    expect(second.records).toHaveLength(1);
  });
});
