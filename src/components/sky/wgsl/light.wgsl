// The sky's one light (spec §3.2): every layer adds in linear light, then a highlight shoulder, the
// sRGB encode, and grain in display space. src/lib/light.ts mirrors BG, shoulder and encode.
import { cellHash, u01 } from "./noise.wgsl";

export const LUMA = vec3f(0.2126, 0.7152, 0.0722);

// The page background, #06070a, in linear light.
export const BG = vec3f(0.00182, 0.00212, 0.00304);

// Highlights roll off toward 1 above the knee, the colour scaled as one so its hue is kept.
export fn shoulder(c: vec3f) -> vec3f {
  let knee = 0.62;
  let peak = max(c.r, max(c.g, c.b));
  if (peak <= knee) {
    return c;
  }
  let d = 1.0 - knee;
  return c * ((1.0 - d * d / (peak + d - knee)) / peak);
}

export fn encode(c: vec3f) -> vec3f {
  let x = max(c, vec3f(0.0));
  return select(1.055 * pow(max(x, vec3f(1e-7)), vec3f(1.0 / 2.4)) - 0.055, x * 12.92, x <= vec3f(0.0031308));
}

export fn decode(c: vec3f) -> vec3f {
  let x = max(c, vec3f(0.0));
  return select(pow((x + 0.055) / 1.055, vec3f(2.4)), x / 12.92, x <= vec3f(0.04045));
}

// Light the boards' CSS adds in display space over the page background, in linear light.
export fn overBg(c: vec3f) -> vec3f {
  return max(decode(vec3f(6.0, 7.0, 10.0) / 255.0 + c) - BG, vec3f(0.0));
}

// Film grain and an 8-bit dither, in display space, hashed from the integer screen pixel so both
// canvases agree across the rim. The dither's seed moves with time, the grain's doesn't.
export fn grain(pixel: vec2f, lum: f32, time: f32) -> f32 {
  let p = vec2i(floor(pixel));
  let g = (u01(cellHash(p, 7u)) - 0.5) * (0.012 + 0.03 * lum);
  let dither = (u01(cellHash(p, 11u + u32(fract(time) * 4096.0))) - 0.5) / 255.0;
  return g + dither;
}

// How much a text rect (x, y, w, h; w 0 for none) covers p: 1 from 12 px inside, 0 by 80 px outside.
export fn textMask(p: vec2f, rect: vec4f) -> f32 {
  if (rect.z <= 0.0) {
    return 0.0;
  }
  let half = rect.zw * 0.5;
  let d = abs(p - (rect.xy + half)) - half;
  let outside = length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
  return 1.0 - smoothstep(-12.0, 80.0, outside);
}
