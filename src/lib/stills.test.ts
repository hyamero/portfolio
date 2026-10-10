import { describe, expect, test } from "bun:test";

import { horizonStill, PLANET } from "./stills";

describe("horizonStill", () => {
  test("picks the 1440 still from 864 px, scaled by W / 1440 with no stretch", () => {
    for (const W of [864, 1440, 2560]) {
      const s = horizonStill(W);
      expect(s.src).toBe("/sky/horizon-1440.avif");
      expect(s.scale).toBeCloseTo(W / 1440, 12);
      expect(s.stretch).toBe(1);
      expect(s.apex).toBeCloseTo(320 * (W / 1440), 9);
      expect(s.ground.rx).toBeCloseTo(2.2 * W, 6);
      expect(s.ground.ry).toBeCloseTo(2.2 * W, 6);
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
      expect(s.ground.rx).toBeCloseTo(2.2 * W, 6);
      expect(s.ground.ry).toBeCloseTo(858, 6);
    }
  });
});

describe("PLANET", () => {
  // The box is 2 R wide; the still is 2 R × 1.2 R from 0.4 R over the apex.
  const pct = (s: string) => Number.parseFloat(s) / 100;
  test("spans the box's width, from 0.4 R over its apex to 0.8 R under it", () => {
    expect(pct(PLANET.box.left)).toBe(0);
    expect(pct(PLANET.box.width)).toBe(1);
    expect(pct(PLANET.box.top)).toBeCloseTo(-0.2, 12);
    expect(pct(PLANET.box.height)).toBeCloseTo(0.6, 12);
  });
  test("is rendered at its radius's scale both ways", () => {
    expect(PLANET.size[0]).toBeCloseTo(2 * PLANET.R, 9);
    expect(PLANET.size[1]).toBeCloseTo(1.2 * PLANET.R, 9);
  });
});
