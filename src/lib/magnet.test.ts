import { describe, expect, test } from "bun:test";

import { MAGNET_RADIUS, magnet } from "./magnet";

describe("magnet", () => {
  test("no pull with the pointer on the centre", () => {
    expect(magnet(0, 0)).toEqual({ x: 0, y: 0 });
  });
  test("no pull at or beyond the radius", () => {
    expect(magnet(MAGNET_RADIUS, 0)).toEqual({ x: 0, y: 0 });
    expect(magnet(0, -200)).toEqual({ x: 0, y: 0 });
  });
  test("pulls toward the pointer, proportionally near the centre", () => {
    expect(magnet(10, 0).x).toBeCloseTo(3);
    expect(magnet(0, -10).y).toBeCloseTo(-3);
  });
  test("is capped at max", () => {
    const { x, y } = magnet(30, 30);
    expect(Math.hypot(x, y)).toBeLessThanOrEqual(6);
    expect(magnet(30, 0, 90, 4).x).toBeCloseTo(4);
  });
  test("releases smoothly toward the edge", () => {
    expect(magnet(80, 0).x).toBeGreaterThan(0);
    expect(magnet(80, 0).x).toBeLessThan(magnet(50, 0).x);
  });
});
