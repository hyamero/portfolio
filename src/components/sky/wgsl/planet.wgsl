// The hero's planet: main's orb, its lit limb, flowing atmosphere band, dark body, orbital paths and
// their two flares. Its colours were tuned in display space over the page, so they're mixed there and
// converted to linear light.
import { decode, overBg } from "./light.wgsl";
import { fbm } from "./noise.wgsl";

// The body's darkest, under its band; src/lib/light.ts mirrors it for the CSS sky's disc.
const CORE = vec3f(0.01, 0.012, 0.03);

// A four-point sparkle, d px from its centre.
fn flare(d: vec2f, t: f32, phase: f32) -> f32 {
  let tw = 0.7 + 0.3 * sin(t * 1.3 + phase);
  let ax = abs(d.x);
  let ay = abs(d.y);
  let spikes = exp(-ay / 0.8) * exp(-ax / 13.0) + exp(-ax / 0.8) * exp(-ay / 13.0);
  return (spikes * 0.55 + exp(-length(d) / 2.0) * 0.9) * tw;
}

export struct PlanetLight {
  // Added over the sky past the limb, and the body's own colour inside it.
  halo: vec3f,
  face: vec3f,
}

// p, C, light: page px; R: the radius; W: the viewport's width; lw: a hairline's width; lit: the rim's
// and the air's share of their light over the intro; quiet: the text mask.
export fn planetLight(p: vec2f, C: vec2f, R: f32, light: vec2f, t: f32, W: f32, lw: f32, lit: vec2f, quiet: f32) -> PlanetLight {
  let rel = p - C;
  let dist = max(length(rel), 1e-4);
  let dOrb = dist - R;
  let d = dOrb / R;
  let outward = rel / dist;
  // The limb and the band face the light, which follows the pointer.
  let facing = dot(outward, normalize(light - C)) * 0.5 + 0.5;
  let spin = t * 0.01;
  let around = vec2f(outward.x * cos(spin) - outward.y * sin(spin), outward.x * sin(spin) + outward.y * cos(spin));
  var flow = 0.5;
  if (abs(d) < 0.8) {
    flow = fbm(around * 4.0 + vec2f(0.0, d * 7.0 - t * 0.06), 4, 83u) * 0.9375;
  }
  let rim = vec3f(0.78, 0.87, 1.0) * exp(-abs(dOrb) / 5.5) * (0.35 + 0.65 * facing) * 0.85 * lit.x;

  let halo = vec3f(0.3, 0.38, 0.43) * exp(-max(d, 0.0) * 6.0) * (0.3 + 0.7 * facing) * (0.75 + 0.5 * flow) * 0.6;
  // Orbital paths: two hairlines on the shoulders, clear of the copy, and a flare on each.
  let shoulder = smoothstep(0.27, 0.36, abs(p.x - C.x) / W) * (1.0 - smoothstep(-0.3, 0.0, outward.y));
  let r1 = R + 110.0;
  let r2 = R + 310.0;
  let rings = exp(-abs(dist - r1) / lw) * 0.085 + exp(-abs(dist - r2) / lw) * 0.065;
  let f1 = C + vec2f(sin(0.38), -cos(0.38)) * r2;
  let f2 = C + vec2f(sin(-0.62), -cos(-0.62)) * r1;
  let sparkle = flare(p - f1, t, 0.0) + flare(p - f2, t, 2.2) * 0.75;
  let paths = vec3f(0.79, 0.86, 1.0) * rings * shoulder + vec3f(0.86, 0.92, 1.0) * sparkle;

  let depth = max(-d, 0.0);
  let band = mix(vec3f(0.02, 0.04, 0.14), vec3f(0.47, 0.7, 0.96), 1.0 - smoothstep(0.012, 0.28, depth));
  let bandFade = 1.0 - 0.92 * smoothstep(0.18, 0.6, depth);
  let atmos = band * bandFade * (0.45 + 0.55 * facing) * (0.8 + 0.4 * flow) * 0.85;
  let face = mix(CORE, max(atmos, CORE), lit.y) + rim;

  return PlanetLight(overBg((halo + paths) * lit.y * (1.0 - 0.85 * quiet) + rim), decode(min(face, vec3f(1.0))));
}
