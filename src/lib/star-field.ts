import { BG, encode, hex, shoulder, type Rgb } from "./light";

/*
 * The sky's star hash and the two star layers that don't depend on the viewport's size or the Milky
 * Way (the 60 px layer and the bright layer), ported from src/components/sky/wgsl/noise.wgsl and
 * stars.wgsl with exact u32 maths and f32 rounding, so the CSS sky's stars sit on the live sky's
 * (spec §7.2). Keep in step with those files.
 */

const f = Math.fround;

export function pcg(v: number) {
  const s = (Math.imul(v >>> 0, 747796405) + 2891336453) >>> 0;
  const w = Math.imul((s >>> ((s >>> 28) + 4)) ^ s, 277803737) >>> 0;
  return ((w >>> 22) ^ w) >>> 0;
}

export function cellHash(x: number, y: number, seed: number) {
  return pcg(Math.imul(x, 1597334677) ^ pcg((y ^ seed) >>> 0));
}

export const u01 = (h: number) => (h >>> 8) / 16777216;

export function vnoise(px: number, py: number, seed: number) {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = f(px - ix);
  const fy = f(py - iy);
  const wx = f(fx * fx * (3 - 2 * fx));
  const wy = f(fy * fy * (3 - 2 * fy));
  const a = u01(cellHash(ix, iy, seed));
  const b = u01(cellHash(ix + 1, iy, seed));
  const c = u01(cellHash(ix, iy + 1, seed));
  const d = u01(cellHash(ix + 1, iy + 1, seed));
  const ab = a + (b - a) * wx;
  const cd = c + (d - c) * wx;
  return ab + (cd - ab) * wy;
}

/** Octaves of value noise, normalised to 0..1. */
export function fbm(x: number, y: number, octaves: number, seed: number) {
  let v = 0;
  let a = 0.5;
  let n = 0;
  for (let i = 0; i < octaves; i++) {
    v += a * vnoise(x, y, (seed + i * 131) >>> 0);
    n += a;
    x = f(x * 2.03 + 1.7);
    y = f(y * 2.03 + 9.2);
    a *= 0.5;
  }
  return v / n;
}

const lum = (c: Rgb) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const lerp = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A star's colour, warm K to blue-white B by `r`, at `sat` saturation and luminance 1 (Appendix A.1). */
export function starTint(r: number, sat: number): Rgb {
  let c: Rgb;
  if (r < 0.1) c = [1, 0.64, 0.4];
  else if (r < 0.35) c = lerp([1, 0.82, 0.64], [1, 0.94, 0.86], (r - 0.1) / 0.25);
  else if (r < 0.75) c = lerp([1, 0.97, 0.93], [0.92, 0.95, 1], (r - 0.35) / 0.4);
  else c = lerp([0.84, 0.89, 1], [0.68, 0.78, 1], (r - 0.75) / 0.25);
  const y = lum(c);
  const s = lerp([y, y, y], c, sat);
  const n = lum(s);
  return [s[0] / n, s[1] / n, s[2] / n];
}

/** A star on the CSS sky's map: its position (CSS px from the viewport's top left), flux, halo share and tint. */
export type MapStar = { x: number; y: number; flux: number; halo: number; tint: Rgb };

/** The near layer and the bright layer at scroll 0 with no hover: every star whose centre falls inside width × height. */
export function brightStars(width: number, height: number): MapStar[] {
  const stars: MapStar[] = [];
  for (let cy = 0; cy * 60 < height; cy++) {
    for (let cx = 0; cx * 60 < width; cx++) {
      const h0 = cellHash(cx, cy, 303);
      const odds = 0.16 * (0.45 + 1.1 * fbm(f(((cx + 0.5) * 60) / 380), f(((cy + 0.5) * 60) / 380), 3, 310));
      if (u01(h0) > odds) continue;
      const h1 = pcg(h0);
      const h2 = pcg(h1);
      const h3 = pcg(h2);
      const h4 = pcg(h3);
      const x = f(f(cx + f(f(u01(h1) * 0.56) + 0.22)) * 60);
      const y = f(f(cy + f(f(u01(h2) * 0.56) + 0.22)) * 60);
      if (x >= width || y >= height) continue;
      const flux = 0.3 * Math.min(Math.max(u01(h3), 1e-5) ** (-2 / 3), 16);
      stars.push({ x, y, flux, halo: 0.08, tint: starTint(u01(h4), 0.55) });
    }
  }
  for (let cy = 0; cy * 240 < height; cy++) {
    for (let cx = 0; cx * 240 < width; cx++) {
      const h0 = cellHash(cx, cy, 404);
      if (u01(h0) > 0.12) continue;
      const h1 = pcg(h0);
      const h2 = pcg(h1);
      const h3 = pcg(h2);
      const h4 = pcg(h3);
      const x = f(f(cx + f(f(u01(h1) * 0.4) + 0.3)) * 240);
      const y = f(f(cy + f(f(u01(h2) * 0.4) + 0.3)) * 240);
      if (x >= width || y >= height) continue;
      stars.push({ x, y, flux: 1.6 + 2.4 * u01(h3), halo: 0.1, tint: starTint(0.5 + 0.5 * u01(h4), 0.5) });
    }
  }
  return stars;
}

/** A star's peak light on a 1× screen: its core and halo Gaussians (σ 0.62 and 2.6 px) at their centre. */
export function starPeak(s: MapStar) {
  return s.flux * ((1 - s.halo) / (2 * Math.PI * 0.62 ** 2) + s.halo / (2 * Math.PI * 2.6 ** 2));
}

/** The CSS sky's star map (spec §7.2): one circle per star, filled so its peak matches the live star's. */
export function starMapSvg(width: number, height: number) {
  const circles = brightStars(width, height).map((s) => {
    const p = starPeak(s);
    const fill = hex(encode(shoulder([BG[0] + s.tint[0] * p, BG[1] + s.tint[1] * p, BG[2] + s.tint[2] * p])));
    return `<circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="0.73" fill="${fill}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${circles.join("")}</svg>`;
}
