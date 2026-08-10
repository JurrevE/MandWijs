import { describe, expect, it } from "vitest";
import { renderWeeklyEmail } from "./weekly-email";
import type { ShoppingPlan } from "@/domain/types";

const plan: ShoppingPlan = {
  id: "balance",
  label: "Beste balans",
  description: "Test",
  totalCents: 398,
  scoreCents: 398,
  storeCount: 1,
  savingsCents: 100,
  unmatchedProductIds: ["missing"],
  options: [{
    id: "option-1",
    productId: "melk",
    productName: "Melk <vol>",
    storeId: "store-1",
    storeName: "Albert Heijn",
    chainId: "albert-heijn",
    priceCents: 398,
    payableQuantity: 2,
    requestedQuantity: 2,
    matchType: "comparable",
    actionLabel: "1+1 gratis",
    warning: "Controleer verpakking",
  }],
};

describe("renderWeeklyEmail", () => {
  it("maakt een volledige, HTML-veilige weekmail", () => {
    const result = renderWeeklyEmail({
      name: "Jur<re>",
      preference: "full",
      plan,
      unmatchedProductNames: ["Brood & boter"],
      validFrom: "maandag 10 augustus",
      validUntil: "zondag 16 augustus",
      dashboardUrl: "https://mandwijs.nl/dashboard",
      unsubscribeUrl: "https://mandwijs.nl/instellingen",
    });

    expect(result.subject).toContain("3,98");
    expect(result.html).toContain("Melk &lt;vol&gt;");
    expect(result.html).toContain("Brood &amp; boter");
    expect(result.html).not.toContain("Jur<re>");
    expect(result.text).toContain("2× Melk <vol> bij Albert Heijn");
  });

  it("laat productregels weg bij de samenvattingsvariant", () => {
    const result = renderWeeklyEmail({
      name: "Jurre",
      preference: "summary",
      plan,
      unmatchedProductNames: [],
      validFrom: "maandag",
      validUntil: "zondag",
      dashboardUrl: "https://mandwijs.nl/dashboard",
      unsubscribeUrl: "https://mandwijs.nl/instellingen",
    });

    expect(result.html).not.toContain("Je boodschappen</h2>");
    expect(result.html).toContain("Open je dashboard");
  });
});
