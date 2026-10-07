import { describe, expect, test } from "bun:test";

import {
  approach,
  clamp,
  departure,
  ease,
  horizonFrame,
  introProgress,
  orbFrame,
  restingLight,
  rise,
  skyDpr,
  type Rect,
} from "./sky-math";

const hero: Rect = { left: 0, top: 0, width: 1440, height: 960 };
const contact: Rect = { left: 0, top: 3000, width: 1440, height: 820 };

describe("clamp and ease", () => {
  test("clamp bounds to 0..1 by default", () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(clamp(0.3)).toBe(0.3);
    expect(clamp(5, 0.16, 1)).toBe(1);
  });
  test("ease is smoothstep", () => {
    expect(ease(0.2, 0.8, 0.2)).toBe(0);
    expect(ease(0.2, 0.8, 0.5)).toBeCloseTo(0.5);
    expect(ease(0.2, 0.8, 0.9)).toBe(1);
  });
});

describe("skyDpr", () => {
  test("caps at 1.25", () => {
    expect(skyDpr(2, 1440, 900)).toBe(1.25);
  });
  test("keeps big screens within 2.2M device pixels", () => {
    const dpr = skyDpr(2, 3840, 2160);
    expect(3840 * 2160 * dpr * dpr).toBeLessThanOrEqual(2.2e6 + 1);
  });
  test("never upscales a 1x screen", () => {
    expect(skyDpr(1, 390, 844)).toBe(1);
  });
  test("treats a missing ratio as 1", () => {
    expect(skyDpr(0, 390, 844)).toBe(1);
  });
});

describe("departure and rise", () => {
  test("departure runs 0..1 across the hero", () => {
    expect(departure(0, hero)).toBe(0);
    expect(departure(480, hero)).toBe(0.5);
    expect(departure(5000, hero)).toBe(1);
  });
  test("rise starts when Contact's top meets the viewport bottom", () => {
    expect(rise(3000 - 900, 900, contact)).toBe(0);
    expect(rise(3000 - 900 + 410, 900, contact)).toBeCloseTo(0.5);
    expect(rise(9000, 900, contact)).toBe(1);
  });
  test("a missing anchor never divides by zero", () => {
    const none: Rect = { left: 0, top: 0, width: 0, height: 0 };
    expect(Number.isFinite(departure(100, none))).toBe(true);
    expect(Number.isFinite(rise(100, 900, none))).toBe(true);
  });
});

describe("introProgress", () => {
  test("eases out over 2.4 s", () => {
    expect(introProgress(-100)).toBe(0);
    expect(introProgress(1200)).toBeCloseTo(0.875);
    expect(introProgress(2400)).toBe(1);
  });
});

describe("orbFrame", () => {
  test("rests at 68% of the hero once the intro is done", () => {
    const orb = orbFrame(hero, 1, 0);
    expect(orb.cx).toBe(720);
    expect(orb.apex).toBeCloseTo(960 * 0.68);
    expect(orb.radius).toBeCloseTo(Math.max(0.62 * 1440, 0.95 * 960));
    expect(orb.vis).toBe(1);
  });
  test("starts 10% lower and 3% smaller during the intro", () => {
    const orb = orbFrame(hero, 0, 0);
    expect(orb.apex).toBeCloseTo(960 * 0.78);
    expect(orb.radius).toBeCloseTo(0.97 * 912);
    expect(orb.vis).toBe(0);
  });
  test("sinks twice as fast as the page scrolls and is gone by 80% departure", () => {
    const half = orbFrame(hero, 1, 0.5);
    expect(half.apex).toBeCloseTo(960 * 0.68 + 960);
    expect(half.vis).toBeCloseTo(0.5);
    expect(orbFrame(hero, 1, 0.8).vis).toBe(0);
  });
  test("is invisible without a hero", () => {
    expect(orbFrame({ left: 0, top: 0, width: 0, height: 0 }, 1, 0).vis).toBe(0);
  });
});

describe("horizonFrame", () => {
  test("sits 2% above Contact's bottom at rest and 15% when risen", () => {
    expect(horizonFrame(contact, 0).top).toBeCloseTo(3820 - 0.02 * 820);
    expect(horizonFrame(contact, 1).top).toBeCloseTo(3820 - 0.15 * 820);
  });
  test("is a wide arc centered on Contact", () => {
    const h = horizonFrame(contact, 1);
    expect(h.cx).toBe(720);
    expect(h.radius).toBe(Math.max(1440 * 2.2, 2600));
    expect(h.halfWidth).toBeCloseTo(1440 * 0.37);
  });
});

describe("restingLight and approach", () => {
  test("rests above the hero, a little left of center", () => {
    expect(restingLight(hero)).toEqual({ x: 1440 * 0.42, y: -240 });
  });
  test("approach eases by 1 - e^(-rate*dt)", () => {
    expect(approach(0, 10, 1, 3)).toBeCloseTo(10 * (1 - Math.exp(-3)));
    expect(approach(5, 5, 0.1)).toBe(5);
  });
});
