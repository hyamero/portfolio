import { describe, expect, test } from "bun:test";

import { BG, encode, hex, shoulder } from "./light";

describe("shoulder", () => {
  test("passes colour below the knee through unchanged", () => {
    expect(shoulder([0.5, 0.3, 0.1])).toEqual([0.5, 0.3, 0.1]);
  });
  test("is continuous at the knee", () => {
    expect(shoulder([0.62 + 1e-9, 0, 0])[0]).toBeCloseTo(0.62, 6);
  });
  test("maps a peak of 1 to 0.81 and keeps the hue", () => {
    const s = shoulder([1, 0.5, 0.25]);
    expect(s[0]).toBeCloseTo(0.81, 6);
    expect(s[1] / s[0]).toBeCloseTo(0.5, 9);
    expect(s[2] / s[0]).toBeCloseTo(0.25, 9);
  });
  test("never reaches 1", () => {
    expect(shoulder([1000, 0, 0])[0]).toBeLessThan(1);
  });
});

describe("encode", () => {
  test("is the sRGB curve", () => {
    expect(encode([0, 0.0031308, 1])[0]).toBe(0);
    expect(encode([0, 0.0031308, 1])[1]).toBeCloseTo(0.0404, 4);
    expect(encode([0, 0.0031308, 1])[2]).toBeCloseTo(1, 9);
  });
  test("turns the linear background back into the page's #06070a", () => {
    expect(hex(encode(BG))).toBe("#06070a");
  });
});
