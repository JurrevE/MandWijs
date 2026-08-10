import { describe, expect, it } from "vitest";
import { haversineDistanceKm, isWithinRadius } from "./distance";

describe("radiusberekening", () => {
  it("berekent de afstand Utrecht–Amsterdam realistisch", () => {
    const distance = haversineDistanceKm(
      { latitude: 52.0907, longitude: 5.1214 },
      { latitude: 52.3676, longitude: 4.9041 },
    );
    expect(distance).toBeGreaterThan(34);
    expect(distance).toBeLessThan(36);
  });

  it("negeert locaties zonder coördinaten", () => {
    expect(isWithinRadius({ latitude: 52.09, longitude: 5.12 }, { latitude: null, longitude: null }, 5)).toBe(false);
  });
});
