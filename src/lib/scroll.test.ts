import { describe, expect, test } from "bun:test";

import { glide, glideDuration } from "./scroll";

describe("glideDuration", () => {
  test("a short hop still takes 1.6 s", () => {
    expect(glideDuration(0, 900)).toBe(1.6);
    expect(glideDuration(300, 900)).toBe(1.6);
  });
  test("adds 0.45 s per viewport travelled", () => {
    expect(glideDuration(2 * 900, 900)).toBeCloseTo(2.1, 9);
    expect(glideDuration(5 * 900, 900)).toBeCloseTo(3.45, 9);
  });
  test("reads distance in either direction", () => {
    expect(glideDuration(-5 * 900, 900)).toBeCloseTo(3.45, 9);
  });
  test("caps a long glide at 4.2 s", () => {
    expect(glideDuration(20 * 900, 900)).toBe(4.2);
  });
});

describe("glide", () => {
  test("runs from 0 to 1, symmetric about the middle", () => {
    expect(glide(0)).toBe(0);
    expect(glide(1)).toBeCloseTo(1, 12);
    expect(glide(0.5)).toBeCloseTo(0.5, 12);
    expect(glide(0.25) + glide(0.75)).toBeCloseTo(1, 12);
  });
  test("peaks at under 1.6× the average speed, so the sky never blurs past", () => {
    const h = 1e-4;
    let peak = 0;
    for (let t = 0; t <= 1 - h; t += 0.01) peak = Math.max(peak, (glide(t + h) - glide(t)) / h);
    expect(peak).toBeLessThan(1.6);
  });
});
