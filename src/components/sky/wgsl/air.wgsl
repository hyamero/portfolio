// The horizon's air and ground (spec §4.3, Appendix A.4), in linear light. Heights are in hsc px
// (max(W / 1440, 0.6) CSS px); s is the arc length along the limb from the sun, + right.

// The night ground's base colour; src/lib/light.ts mirrors it for the CSS sky's ground.
export const GROUND = vec3f(0.0013, 0.0016, 0.0024);

// The air at height h. sl: s leaned toward the cursor, which moves the Rayleigh layers' light; the
// sunrise and the signal stay with the sun. age, travel: the signal's pulse (age < 0 for none).
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
  // The orbital sunrise: sunlight grazing the low air reddens, orange on the ground, amber above it.
  let ks = s / (0.11 * W);
  let ka = s / (0.2 * W);
  c += vec3f(1.0, 0.33, 0.07) * 1.6 * exp(-h / 3.5) * exp(-ks * ks)
     + vec3f(1.0, 0.6, 0.22) * 0.5 * exp(-h / 9.0) * exp(-ka * ka);
  // Airglow: a faint green thread high over the night side.
  let ag = (h - 92.0) / 4.0;
  c += vec3f(0.3, 1.0, 0.55) * 0.0035 * exp(-ag * ag) * (1.0 - lit);
  if (age >= 0.0) {
    // The signal (spec §5.6): a front running out both ways from the sun. Without travel the
    // whole rim lights at once.
    let e = (abs(s) - 0.55 * W * age) / (26.0 + 50.0 * age);
    let front = mix(1.0, exp(-e * e), travel);
    c += vec3f(0.8, 0.92, 1.0) * front * exp(-1.4 * age) * (2.2 * skin + 0.5 * band) * (1.0 - smoothstep(2.5, 3.5, age));
  }
  return c;
}

// Mie: sunlight scattered forward around the sun B, stretched along the limb. d: p's height above it.
export fn mie(p: vec2f, B: vec2f, W: f32, hsc: f32, d: f32) -> vec3f {
  let e = vec2f((p.x - B.x) / (0.2 * W), (p.y - B.y) / (70.0 * hsc));
  return vec3f(0.85, 0.92, 1.0) * 0.05 * exp(-dot(e, e)) * smoothstep(-2.0, 4.0, d);
}

// The night ground at depth (hsc px inside the edge): board 02's thin lit band, then near-black.
export fn groundNight(depth: f32) -> vec3f {
  return GROUND + vec3f(0.002, 0.003, 0.008) * exp(-depth / 6.0);
}
