// The body (spec §4.2–4.3): the hero's planet, which the camera flies down to until it's the resting
// horizon. Shared by sky.wgsl and stills.wgsl, so the CSS sky's stills can't drift from the live sky.
import { horizonLight } from "./air.wgsl";
import { planetLight } from "./planet.wgsl";

// One frame of the body. Positions share the caller's space.
export struct Body {
  C: vec2f,
  R: f32,
  vis: f32,
  // The sun; morph, 0 planet .. 1 horizon; how far the intro has lit the planet.
  B: vec2f,
  m: f32,
  dawn: f32,
  W: f32,
  dpr: f32,
  time: f32,
  hover: f32,
  // The eased pointer light.
  light: vec2f,
  settle: f32,
  // The signal's pulse: its age (s, < 0 for none) and travel.
  age: f32,
  travel: f32,
  // The rim's brightening as the trail gathers into it and a Contact link lifts it.
  arrive: f32,
}

// What the body adds at p.
export struct BodyLight {
  // The planet's halo and the air: light in front of the sky, which washes the stars out.
  front: vec3f,
  // The planet's or the ground's own colour, and how much of p it covers.
  night: vec3f,
  inside: f32,
  // p's height above the limb, px.
  d: f32,
}

// hush: the hero copy's soft mask at p, which dims the planet's halo; quiet: the text mask, which dims
// the horizon's air.
export fn bodyLight(p: vec2f, b: Body, hush: f32, quiet: f32) -> BodyLight {
  var out = BodyLight(vec3f(0.0), vec3f(0.0), 0.0, 1e6);
  if (b.vis <= 0.001) {
    return out;
  }
  let R = max(b.R, 1.0);
  let m = b.m;
  let rel = p - b.C;
  let dist = max(length(rel), 1e-4);
  let d = dist - R;
  out.d = d;
  out.inside = (1.0 - smoothstep(-0.6, 0.6, d * b.dpr)) * b.vis;
  // The planet gives way to the horizon as the camera nears. The intro lights its rim first, then its air.
  let planetK = (1.0 - m) * (1.0 - m);
  let horizonK = smoothstep(0.2, 0.95, m);
  var face = vec3f(0.0);
  if (m < 1.0 && d < 1.4 * R + 330.0) {
    let lit = vec2f(smoothstep(0.0, 0.6, b.dawn), smoothstep(0.25, 1.0, b.dawn));
    let pl = planetLight(p, b.C, R, b.light, b.time, b.W, max(0.7, 0.8 / b.dpr), lit, hush);
    out.front += pl.halo * planetK;
    face = pl.face;
  }
  var ground = vec3f(0.0);
  if (m > 0.0 && d < 560.0) {
    let ub = (b.B - b.C) / R;
    let n = rel / dist;
    let s = R * atan2(ub.x * n.y - ub.y * n.x, dot(ub, n));
    // Once the horizon rests, its lit lobe leans toward the cursor.
    let lobe = mix(b.B.x, b.light.x, b.hover * b.settle);
    // Heights scale with the width from 1440 down to 864 px, then hold, as the CSS sky's stills do.
    let hl = horizonLight(p, d / max(b.W / 1440.0, 0.6), b.C.x, lobe, b.W, b.time, s, b.arrive, b.age, b.travel, quiet);
    out.front += hl.air * horizonK;
    ground = hl.ground;
  }
  out.front *= (1.0 - out.inside) * b.vis;
  if (out.inside > 0.0) {
    out.night = mix(ground, face, planetK);
  }
  return out;
}
