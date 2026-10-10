import { describe, expect, test } from "bun:test";

import { brightStars, cellHash, fbm, pcg, starMapSvg, starTint, u01 } from "./star-field";

// Pinned from one vgpu/node run of noise.wgsl: index i, pcg(7919 i + 1), u01(cellHash(i − 8, 3 − i, 101)) and fbm(0.37 i, 1.3, 3, 7).
const GPU = [
  [0, 2831084092, 0.8332586884498596, 0.48246878385543823],
  [5, 1953814019, 0.38231366872787476, 0.5852159261703491],
  [11, 2418778161, 0.0745166540145874, 0.5071955919265747],
  [15, 2276300552, 0.8150473833084106, 0.2821023166179657],
] as const;

describe("the hash port", () => {
  for (const [i, hash, cell, noise] of GPU) {
    test(`matches the GPU at ${i}`, () => {
      expect(pcg(7919 * i + 1)).toBe(hash);
      expect(u01(cellHash(i - 8, 3 - i, 101))).toBe(cell);
      expect(fbm(Math.fround(Math.fround(0.37) * i), Math.fround(1.3), 3, 7)).toBeCloseTo(noise, 5);
    });
  }
});

describe("starTint", () => {
  test("has luminance 1 from K to B", () => {
    for (const r of [0, 0.2, 0.5, 0.9]) {
      const [cr, cg, cb] = starTint(r, 0.55);
      expect(0.2126 * cr + 0.7152 * cg + 0.0722 * cb).toBeCloseTo(1, 9);
    }
    expect(starTint(0, 0.55)[0]).toBeGreaterThan(starTint(0, 0.55)[2]);
    expect(starTint(0.95, 0.55)[2]).toBeGreaterThan(starTint(0.95, 0.55)[0]);
  });
});

describe("brightStars", () => {
  test("is the same on every call", () => {
    expect(brightStars(1440, 900)).toEqual(brightStars(1440, 900));
  });
  test("keeps every star inside its cell's jitter box", () => {
    for (const s of brightStars(1440, 900)) {
      const cell = s.halo === 0.1 ? 240 : 60;
      const [lo, hi] = cell === 240 ? [0.3, 0.7] : [0.22, 0.78];
      const fx = s.x / cell - Math.floor(s.x / cell);
      const fy = s.y / cell - Math.floor(s.y / cell);
      for (const v of [fx, fy]) {
        expect(v).toBeGreaterThanOrEqual(lo - 1e-6);
        expect(v).toBeLessThanOrEqual(hi + 1e-6);
      }
    }
  });
  test("gives 40 to 120 stars at 1440 × 900", () => {
    const n = brightStars(1440, 900).length;
    expect(n).toBeGreaterThanOrEqual(40);
    expect(n).toBeLessThanOrEqual(120);
  });
});

describe("starMapSvg", () => {
  test("draws one circle per star", () => {
    const svg = starMapSvg(2560, 1600);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.match(/<circle /g)?.length).toBe(brightStars(2560, 1600).length);
  });
  test("is 16 KB or less, gzipped", () => {
    expect(Bun.gzipSync(new TextEncoder().encode(starMapSvg(2560, 1600))).length).toBeLessThanOrEqual(16384);
  });
});
