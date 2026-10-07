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
  test("the first tick primes the scroll without a velocity kick", () => {
    const s = fresh();
    advance(s, 2400, 0, DT);
    expect(s.velocity).toBe(0);
    expect(s.coast.v).toBe(0);
  });
  test("velocity is in px/s and clamped", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    advance(s, 10, 0, DT);
    expect(s.velocity).toBeCloseTo(600);
    advance(s, 310, 0, DT);
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
