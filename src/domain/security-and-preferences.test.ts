import { describe, expect, it } from "vitest";
import { canAccessUserResource, canManageGlobalData } from "./authorization";
import { currentWeekRange, isoWeek, shouldSendWeeklyEmail, weeklyEmailKey } from "./email";

describe("gebruikersautorisatie", () => {
  it("laat een gebruiker alleen de eigen resource lezen", () => {
    const user = { id: "user-a", role: "user" as const };
    expect(canAccessUserResource(user, "user-a")).toBe(true);
    expect(canAccessUserResource(user, "user-b")).toBe(false);
    expect(canManageGlobalData(user)).toBe(false);
  });

  it("laat een admin globale data beheren", () => {
    expect(canManageGlobalData({ id: "admin", role: "admin" })).toBe(true);
  });
});

describe("e-mailvoorkeuren", () => {
  it("stuurt alleen bij opt-in en actieve producten", () => {
    expect(shouldSendWeeklyEmail("summary", true)).toBe(true);
    expect(shouldSendWeeklyEmail("none", true)).toBe(false);
    expect(shouldSendWeeklyEmail("full", false)).toBe(false);
  });

  it("maakt een stabiele idempotentiesleutel per week", () => {
    expect(weeklyEmailKey("user-a", "2026-W33")).toBe(weeklyEmailKey("user-a", "2026-W33"));
  });

  it("berekent de ISO-week en Nederlandse maandag-zondagperiode", () => {
    const date = new Date("2026-08-10T07:00:00.000Z");
    expect(isoWeek(date)).toBe("2026-W33");
    expect(currentWeekRange(date)).toEqual({
      validFrom: "maandag 10 augustus 2026",
      validUntil: "zondag 16 augustus 2026",
    });
  });
});
