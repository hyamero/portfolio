import { describe, expect, test } from "bun:test";

import { eclipseStill, horizonStill } from "./stills";

describe("horizonStill", () => {
  test("picks the 1440 still from 864 px, scaled by W / 1440 with no stretch", () => {
    for (const W of [864, 1440, 2560]) {
      const s = horizonStill(W);
      expect(s.src).toBe("/sky/horizon-1440.avif");
      expect(s.scale).toBeCloseTo(W / 1440, 12);
      expect(s.stretch).toBe(1);
      expect(s.apex).toBeCloseTo(320 * (W / 1440), 9);
      expect(s.ground.rx).toBeCloseTo((25 / 6) * W, 6);
      expect(s.ground.ry).toBeCloseTo((25 / 6) * W, 6);
    }
  });
  test("below 864 it picks the 390 still, stretched across by W / 390 at scale 1", () => {
    for (const W of [320, 390, 863]) {
      const s = horizonStill(W);
      expect(s.src).toBe("/sky/horizon-390.avif");
      expect(s.scale).toBe(1);
      expect(s.stretch).toBeCloseTo(W / 390, 12);
      expect(s.height).toBe(232);
      expect(s.apex).toBe(192);
      expect(s.ground.rx).toBeCloseTo((25 / 6) * W, 6);
      expect(s.ground.ry).toBeCloseTo(1625, 6);
    }
  });
});

describe("eclipseStill", () => {
  test("sits at an inset of −150%, its radius on the box's", () => {
    const s = eclipseStill({ width: 403.2 });
    expect(s.inset).toBe("-150%");
    expect(s.size).toBeCloseTo(4 * 403.2, 9);
  });
});
