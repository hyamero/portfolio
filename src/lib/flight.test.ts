import { describe, expect, test } from "bun:test";

import { advance, createFlight, settling } from "./flight";
import { restingLight, type Rect } from "./sky-math";

const hero: Rect = { left: 0, top: 0, width: 1440, height: 960 };
const DT = 1 / 60;
const fresh = () => {
  const s = createFlight();
  s.hero = hero;
  return s;
};

describe("flight", () => {
  test("the hero's runway starts with no end yet, and the copy showing", () => {
    expect(createFlight().camera).toEqual({ start: 0, end: Number.POSITIVE_INFINITY, copy: 1 });
  });
  test("the signal starts unlit, with no pulse", () => {
    expect(createFlight().signal).toEqual({ lift: 0, target: 0, at: Number.NEGATIVE_INFINITY });
  });
  test("a hovered link's lift eases in and lets go", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    s.signal.target = 1;
    advance(s, 0, 0, DT);
    expect(s.signal.lift).toBeGreaterThan(0);
    expect(s.signal.lift).toBeLessThan(1);
    for (let i = 0; i < 120; i++) advance(s, 0, 0, DT);
    expect(s.signal.lift).toBe(1);
    s.signal.target = 0;
    for (let i = 0; i < 120; i++) advance(s, 0, 0, DT);
    expect(s.signal.lift).toBe(0);
  });
  test("under reduced motion the lift applies at once", () => {
    const s = fresh();
    s.reduced = true;
    s.signal.target = 1;
    advance(s, 0, 0, DT);
    expect(s.signal.lift).toBe(1);
  });
  test("the first tick primes the scroll without a velocity kick", () => {
    const s = fresh();
    advance(s, 2400, 0, DT);
    expect(s.velocity).toBe(0);
    expect(s.coast.v).toBe(0);
  });
  test("velocity is in px/s and clamped", () => {
    const s = fresh();
    advance(s, 0, 0, DT, true);
    advance(s, 10, 0, DT, true);
    expect(s.velocity).toBeCloseTo(600);
    advance(s, 310, 0, DT, true);
    expect(s.velocity).toBe(6000);
  });
  test("scrolling builds a coast that glides on after the scroll stops", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    let y = 0;
    for (let i = 0; i < 30; i++) advance(s, (y += 20), 0, DT);
    expect(s.coast.v).toBeGreaterThan(0);
    const offset = s.coast.offset;
    for (let i = 0; i < 30; i++) advance(s, y, 0, DT);
    expect(s.coast.offset).toBeGreaterThan(offset);
  });
  test("reduced motion holds the coast at 0", () => {
    const s = fresh();
    s.reduced = true;
    advance(s, 0, 0, DT);
    for (let i = 1; i <= 30; i++) advance(s, i * 20, 0, DT);
    expect(s.coast.v).toBe(0);
    expect(s.coast.offset).toBe(0);
  });
  test("the light rests above the hero, then eases to the pointer and settles", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    const rest = restingLight(hero);
    expect(s.light.x).toBeCloseTo(rest.x);
    expect(s.light.y).toBeCloseTo(rest.y);
    s.pointer = { x: 100, y: 200, nx: 0, ny: 0, active: true };
    advance(s, 50, 0, DT);
    expect(s.light.tx).toBe(100);
    expect(s.light.ty).toBe(250);
    expect(s.light.x).toBeGreaterThan(100);
    expect(settling(s)).toBe(true);
    for (let i = 0; i < 600; i++) advance(s, 50, 0, DT);
    expect(s.light.x).toBeCloseTo(100, 0);
    expect(s.light.hover).toBeCloseTo(1, 2);
    expect(settling(s)).toBe(false);
  });
  test("reduced motion snaps the light to the pointer", () => {
    const s = fresh();
    s.reduced = true;
    advance(s, 0, 0, DT);
    s.pointer = { x: 100, y: 200, nx: 0, ny: 0, active: true };
    advance(s, 0, 0, DT);
    expect(s.light.x).toBe(100);
    expect(s.light.hover).toBe(1);
    expect(settling(s)).toBe(false);
  });
  test("the light lands exactly on its target, so a settled light changes nothing", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    s.pointer = { x: 100, y: 200, nx: 0, ny: 0, active: true };
    for (let i = 0; i < 600; i++) advance(s, 50, 0, DT);
    expect(s.light.x).toBe(s.light.tx);
    expect(s.light.y).toBe(s.light.ty);
    expect(s.light.hover).toBe(1);
  });
  test("the light waits for the hero to be measured before taking its resting place", () => {
    const s = createFlight();
    advance(s, 0, 0, DT);
    s.hero = hero;
    advance(s, 0, 0, DT);
    const rest = restingLight(hero);
    expect(s.light.x).toBe(rest.x);
    expect(s.light.y).toBe(rest.y);
  });
  test("a jump in one tick is not a scroll, so it builds no coast", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    advance(s, 1200, 0, DT);
    expect(s.velocity).toBe(0);
    expect(s.coast.v).toBe(0);
    for (let i = 0; i < 30; i++) advance(s, 1200 + (i + 1) * 20, 0, DT);
    expect(s.coast.v).toBeGreaterThan(0);
  });
});

describe("the smooth scroll", () => {
  const at = (y: number) => {
    const s = fresh();
    advance(s, y, 0, DT);
    return s;
  };
  test("starts on the scroll, wherever the page loads", () => {
    expect(at(2400).smooth).toBe(2400);
  });
  test("evens out a native scroll's uneven steps", () => {
    // One tick with no new scroll, then one carrying two ticks' worth: the sky moves both times.
    const s = at(300);
    advance(s, 380, 0, DT);
    const a = s.smooth;
    advance(s, 380, 0, DT);
    const b = s.smooth;
    expect(a).toBeGreaterThan(300);
    expect(b).toBeGreaterThan(a);
    expect(b).toBeLessThan(380);
    expect(s.velocity).toBeCloseTo((b - a) / DT);
  });
  test("lands on the scroll once it stops, so a still sky stops redrawing", () => {
    const s = at(300);
    advance(s, 380, 0, DT);
    for (let i = 0; i < 60; i++) advance(s, 380, 0, DT);
    expect(s.smooth).toBe(380);
    expect(s.velocity).toBe(0);
  });
  test("passes a Lenis glide straight through", () => {
    const s = at(300);
    advance(s, 380, 0, DT, true);
    expect(s.smooth).toBe(380);
  });
  test("lands a jump at once", () => {
    const s = at(300);
    advance(s, 3000, 0, DT);
    expect(s.smooth).toBe(3000);
    expect(s.velocity).toBe(0);
  });
  test("keeps closing what it is behind by when a glide or a jump takes over", () => {
    for (const [to, eased] of [[430, true], [3000, false]] as const) {
      const s = at(300);
      advance(s, 380, 0, DT);
      const behind = s.scroll - s.smooth;
      advance(s, to, 0, DT, eased);
      expect(s.scroll - s.smooth).toBeGreaterThan(0);
      expect(s.scroll - s.smooth).toBeLessThan(behind);
    }
  });
  test("is the scroll itself under reduced motion", () => {
    const s = at(300);
    s.reduced = true;
    advance(s, 380, 0, DT);
    expect(s.smooth).toBe(380);
  });
});
