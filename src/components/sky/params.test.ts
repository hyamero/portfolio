import { describe, expect, test } from "bun:test";

import { endFrame } from "@/lib/camera";
import { EMPTY_RECT } from "@/lib/flight";
import type { Rect } from "@/lib/sky-math";

import { bandExtent, diffKey, sameKey, skyParams, type SkyInput } from "./params";

const hero: Rect = { left: 120, top: 300, width: 700, height: 260 };
const work: Rect = { left: 96, top: 2400, width: 1248, height: 1800 };
const contact: Rect = { left: 96, top: 4600, width: 1248, height: 500 };

const input = (over: Partial<SkyInput> = {}): SkyInput => ({
  resolution: [1800, 1125],
  W: 1440,
  H: 900,
  scroll: 0,
  starScroll: 0,
  velocity: 0,
  coast: 0,
  light: { x: 600, y: 200, hover: 0 },
  pointer: { nx: 0.5, ny: 0.5 },
  reduced: false,
  now: 10_000,
  time: 0,
  body: endFrame(1440, 900),
  morph: 1,
  foot: null,
  settle: 0,
  intro: 1,
  trail: { shed: 0, carry: 0, gather: 0 },
  span: [2400, 4600],
  text: { hero, work, contact },
  copy: 1,
  signal: { lift: 0, at: Number.NEGATIVE_INFINITY },
  band: bandExtent(1440, 900, 6000),
  frontOn: false,
  frontTop: 558,
  ...over,
});

describe("skyParams", () => {
  test("velocity is the scroll's and the coast's speed together", () => {
    expect(skyParams(input({ velocity: 1200, coast: 300 })).params.velocity).toBe(1500);
  });
  test("velocity is 0 under reduced motion, and the signal doesn't travel", () => {
    const { params } = skyParams(input({ velocity: 1200, coast: 300, reduced: true }));
    expect(params.velocity).toBe(0);
    expect(params.pulse[1]).toBe(0);
  });
  test("passes the text rects in page space, with w 0 for a missing one", () => {
    const { params } = skyParams(input({ text: { hero, work, contact: EMPTY_RECT } }));
    expect(params.textA).toEqual([120, 300, 700, 260]);
    expect(params.textB).toEqual([96, 2400, 1248, 1800]);
    expect(params.textC[2]).toBe(0);
  });
  test("the hero's strength follows the copy", () => {
    expect(skyParams(input({ copy: 0.25 })).params.textK).toEqual([0.25, 1, 1, 0]);
  });
  test("the body fades in over the intro, rather than appear at full strength", () => {
    expect(skyParams(input({ intro: 0 })).params.body[3]).toBe(0);
    const mid = skyParams(input({ intro: 0.4 })).params.body[3];
    expect(mid).toBeGreaterThan(0.2);
    expect(mid).toBeLessThan(0.9);
    expect(skyParams(input({ intro: 1 })).params.body[3]).toBe(1);
    expect(skyParams(input({ body: null })).params.body[3]).toBe(0);
  });
  test("the intro lights the planet", () => {
    expect(skyParams(input({ intro: 0 })).params.dawn).toBe(0);
    expect(skyParams(input({ intro: 1 })).params.dawn).toBe(1);
  });
  test("the body's foot passes through, or sits past any page", () => {
    expect(skyParams(input({ foot: 960 })).params.foot).toBe(960);
    expect(skyParams(input()).params.foot).toBeGreaterThan(1e8);
  });
  test("the body moves to page space with the scroll", () => {
    const e = endFrame(1440, 900);
    const { params } = skyParams(input({ scroll: 3000 }));
    expect(params.body[1]).toBeCloseTo(e.C[1] + 3000, 9);
    expect(params.sun[1]).toBeCloseTo(e.B[1] + 3000, 9);
  });
  test("a pulse runs 3.5 s from its click, then stops changing the frame", () => {
    expect(skyParams(input({ now: 10_000, signal: { lift: 0, at: 9_000 } })).params.pulse[0]).toBeCloseTo(1, 9);
    const a = skyParams(input({ now: 13_600, signal: { lift: 0, at: 10_000 } }));
    const b = skyParams(input({ now: 20_000, signal: { lift: 0, at: 10_000 } }));
    expect(a.params.pulse[0]).toBe(-1);
    expect(sameKey(diffKey(a.params), diffKey(b.params))).toBe(true);
  });
  test("a page without the body stays finite", () => {
    const { params, frontKey } = skyParams(input({ body: null, text: { hero: EMPTY_RECT, work: EMPTY_RECT, contact: EMPTY_RECT } }));
    expect(diffKey(params).every(Number.isFinite)).toBe(true);
    expect(frontKey.every(Number.isFinite)).toBe(true);
  });
});

describe("bandDrift", () => {
  test("follows 2.5% of the stars' virtual scroll", () => {
    expect(skyParams(input({ starScroll: 3000 })).params.bandDrift).toBeCloseTo(75, 9);
  });
  test("keeps the band inside its cache however far the coast wanders", () => {
    const band = bandExtent(1440, 900, 6000);
    for (const starScroll of [-1e6, -5000, 0, 3000, 9000, 1e6]) {
      const drift = skyParams(input({ starScroll, band })).params.bandDrift;
      expect(drift - 8).toBeGreaterThanOrEqual(band.origin[1]);
      expect(drift + 900 + 8).toBeLessThanOrEqual(band.origin[1] + band.size[1]);
    }
  });
});

describe("frontKey", () => {
  test("ignores the scroll while the body holds still on screen", () => {
    const a = skyParams(input({ scroll: 5000, frontOn: true })).frontKey;
    const b = skyParams(input({ scroll: 5400, starScroll: 5400, frontOn: true })).frontKey;
    expect(sameKey(a, b)).toBe(true);
  });
  test("changes with the lift and the pulse", () => {
    const a = skyParams(input({ frontOn: true })).frontKey;
    expect(sameKey(a, skyParams(input({ frontOn: true, signal: { lift: 0.5, at: Number.NEGATIVE_INFINITY } })).frontKey)).toBe(false);
    expect(sameKey(a, skyParams(input({ frontOn: true, signal: { lift: 0, at: 9_500 } })).frontKey)).toBe(false);
  });
});

describe("diffKey", () => {
  test("ignores time and nothing else", () => {
    const a = skyParams(input()).params;
    expect(sameKey(diffKey(a), diffKey(skyParams(input({ time: 5 })).params))).toBe(true);
    expect(sameKey(diffKey(a), diffKey(skyParams(input({ scroll: 1 })).params))).toBe(false);
  });
});

describe("bandExtent", () => {
  test("covers the viewport and the band's whole drift down the page, 8 px past each edge", () => {
    const { origin, size } = bandExtent(1440, 900, 6000);
    expect(origin[0]).toBeLessThanOrEqual(-8);
    expect(origin[1]).toBeLessThanOrEqual(-8);
    expect(origin[0] + size[0]).toBeGreaterThanOrEqual(1448);
    expect(origin[1] + size[1]).toBeGreaterThanOrEqual(900 + 0.025 * 6000 + 8);
  });
  test("leaves room for the coast to wander 2000 px past either end", () => {
    const { origin, size } = bandExtent(1440, 900, 6000);
    expect(origin[1]).toBeLessThanOrEqual(-0.025 * 2000);
    expect(origin[1] + size[1]).toBeGreaterThanOrEqual(900 + 0.025 * 8000);
  });
});
