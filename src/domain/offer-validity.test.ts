import { describe, expect, it } from "vitest";
import {
  calendarDateInTimeZone,
  isDateWithinOfferWindow,
  isOfferCurrentOnDate,
} from "./offer-validity";

describe("offer validity", () => {
  it("behandelt de eerste en laatste actiedag als geldig", () => {
    expect(isDateWithinOfferWindow("2026-08-10", "2026-08-10", "2026-08-16")).toBe(true);
    expect(isDateWithinOfferWindow("2026-08-16", "2026-08-10", "2026-08-16")).toBe(true);
  });

  it("weigert verlopen en toekomstige acties", () => {
    expect(isDateWithinOfferWindow("2026-08-17", "2026-08-10", "2026-08-16")).toBe(false);
    expect(isDateWithinOfferWindow("2026-08-09", "2026-08-10", "2026-08-16")).toBe(false);
  });

  it("gebruikt de Nederlandse kalenderdag rond UTC-middernacht", () => {
    expect(calendarDateInTimeZone(new Date("2026-08-16T22:30:00.000Z"))).toBe("2026-08-17");
  });

  it("laat gewone prijzen staan en filtert alleen verlopen acties", () => {
    const asOf = new Date("2026-08-17T07:00:00.000Z");
    expect(isOfferCurrentOnDate({ actionType: "none", validFrom: "2026-08-10", validUntil: "2026-08-16" }, asOf)).toBe(true);
    expect(isOfferCurrentOnDate({ actionType: "percentage", validFrom: "2026-08-10", validUntil: "2026-08-16" }, asOf)).toBe(false);
  });
});
