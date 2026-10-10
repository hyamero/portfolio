// The horizon's air and ground (spec §4.3, Appendix A.4), in linear light. Heights are in hsc px
// (max(W / 1440, 0.6) CSS px); s is the arc length along the limb from the sun, + right.
import { overBg } from "./light.wgsl";

// The night ground's base colour; src/lib/light.ts mirrors it for the CSS sky's ground.
export const GROUND = vec3f(0.0013, 0.0016, 0.0024);

// The air at height h. sl: s leaned toward the cursor, which moves the Rayleigh layers' light; the
// signal stays with the sun. age, travel: the signal's pulse (age < 0 for none).
export fn atmosphere(h: f32, s: f32, sl: f32, W: f32, age: f32, travel: f32) -> vec3f {
  let k = sl / select(0.24 * W, 0.2 * W, sl < 0.0);
  let lit = exp(-k * k);
  let litWide = exp(-0.2 * k * k);
  // Rayleigh: a cyan-white skin on the limb, a blue band, a deep-blue glow fading to space. The
  // floors keep a thin skin on the night side.
  let skin = exp(-h / 2.6);
  let band = exp(-h / 13.0);
  var c = vec3f(0.75, 0.9, 1.0) * 0.9 * skin * (0.06 + 0.94 * lit)
        + vec3f(0.2, 0.42, 1.0) * 0.3 * band * (0.18 + 0.82 * lit)
        + vec3f(0.05, 0.12, 0.42) * 0.12 * exp(-h / 55.0) * litWide;
  if (age >= 0.0) {
    // The signal (spec §5.6): a front running out both ways from the sun. Without travel the
    // whole rim lights at once.
    let e = (abs(s) - 0.55 * W * age) / (26.0 + 50.0 * age);
    let front = mix(1.0, exp(-e * e), travel);
    c += vec3f(0.8, 0.92, 1.0) * front * exp(-1.4 * age) * (2.2 * skin + 0.5 * band) * (1.0 - smoothstep(2.5, 3.5, age));
  }
  return c;
}

// Board 02's blue band along the horizon, round its apex, and its bloom round the sun B. d: p's
// height above the limb.
export fn bandBloom(p: vec2f, apex: vec2f, B: vec2f, hsc: f32, d: f32) -> vec3f {
  let eb = length(vec2f((p.x - apex.x) / (1400.0 * hsc), (p.y - apex.y) / 100.0));
  var c = vec3f(96.0, 136.0, 224.0) / 255.0 * 0.13 * max(1.0 - eb, 0.0);
  let e = length(vec2f((p.x - B.x) / (700.0 * hsc), (p.y - B.y) / 170.0));
  if (e < 0.42) {
    let k = clamp(e / 0.42, 0.0, 1.0);
    c += mix(vec3f(150.0, 184.0, 248.0), vec3f(84.0, 120.0, 206.0), k) / 255.0 * mix(0.3, 0.12, k);
  } else if (e < 0.7) {
    let k = (e - 0.42) / 0.28;
    c += mix(vec3f(84.0, 120.0, 206.0), vec3f(40.0, 60.0, 120.0), k) / 255.0 * mix(0.12, 0.04, k);
  } else if (e < 1.0) {
    c += vec3f(40.0, 60.0, 120.0) / 255.0 * 0.04 * (1.0 - e) / 0.3;
  }
  return overBg(c) * smoothstep(-2.0, 4.0, d);
}

// The night ground at depth (hsc px inside the edge): board 02's thin lit band, then near-black.
export fn groundNight(depth: f32) -> vec3f {
  return GROUND + vec3f(0.002, 0.003, 0.008) * exp(-depth / 6.0);
}
