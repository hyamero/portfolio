/**
 * The sky's light (spec §3.2), mirrored from src/components/sky/wgsl/light.wgsl, air.wgsl and planet.wgsl for the
 * CSS sky's star map and stills. Keep in step with those files.
 */
export type Rgb = readonly [number, number, number];

/** The page background, #06070a, in linear light. */
export const BG: Rgb = [0.00182, 0.00212, 0.00304];
/** The night ground's base colour in linear light, the page's at 80% (air.wgsl's GROUND). */
export const GROUND: Rgb = [0.00149, 0.00167, 0.00241];
/** The hero planet's darkest, under its band, in linear light (planet.wgsl's CORE). */
export const CORE: Rgb = [0.000774, 0.000929, 0.00232];
const KNEE = 0.62;

/** Highlights roll off toward 1 above the knee, the colour scaled as one so its hue is kept. */
export function shoulder(c: Rgb): Rgb {
  const peak = Math.max(c[0], c[1], c[2]);
  if (peak <= KNEE) return c;
  const d = 1 - KNEE;
  const k = (1 - (d * d) / (peak + d - KNEE)) / peak;
  return [c[0] * k, c[1] * k, c[2] * k];
}

const srgb = (x: number) => (x <= 0.0031308 ? Math.max(x, 0) * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055);

/** Linear light to sRGB, 0..1. */
export function encode(c: Rgb): Rgb {
  return [srgb(c[0]), srgb(c[1]), srgb(c[2])];
}

/** An encoded colour as #rrggbb. */
export function hex(c: Rgb) {
  const byte = (x: number) => Math.round(Math.min(Math.max(x, 0), 1) * 255).toString(16).padStart(2, "0");
  return `#${byte(c[0])}${byte(c[1])}${byte(c[2])}`;
}
