// The body (spec §4.2–4.3): board 09's eclipse, which the camera flies into until it's board 02's
// horizon. Shared by sky.wgsl and stills.wgsl, so the CSS sky's stills can't drift from the live sky.
import { atmosphere, bandBloom, groundNight } from "./air.wgsl";
import { corona, limbLight, moon, prom, turn } from "./corona.wgsl";

// One frame of the body. Positions share the caller's space.
export struct Body {
  C: vec2f,
  R: f32,
  vis: f32,
  // The bead, which becomes the sun; morph, 0 eclipse .. 1 horizon; how far Baily's beads are open.
  B: vec2f,
  m: f32,
  beads: f32,
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
  // The rim's brightening as the trail gathers into it.
  arrive: f32,
}

// What the body adds at p.
export struct BodyLight {
  // The corona and the air: light in front of the sky, which washes the stars out.
  front: vec3f,
  // The moon's or the ground's own colour, and how much of p it covers.
  night: vec3f,
  inside: f32,
  // Baily's beads and the prominences, over everything.
  limb: vec3f,
  // p's height above the limb, px.
  d: f32,
}

// pl: the cursor's light at p; quiet: the text mask at p.
export fn bodyLight(p: vec2f, b: Body, pl: f32, quiet: f32) -> BodyLight {
  var out = BodyLight(vec3f(0.0), vec3f(0.0), 0.0, vec3f(0.0), 1e6);
  if (b.vis <= 0.001) {
    return out;
  }
  let R = max(b.R, 1.0);
  let m = b.m;
  let rel = p - b.C;
  let dist = max(length(rel), 1e-4);
  let d = dist - R;
  out.d = d;
  let ub = (b.B - b.C) / R;
  let n = rel / dist;
  let s = R * atan2(ub.x * n.y - ub.y * n.x, dot(ub, n));
  // The body's own frame, turned so the bead sits where board 09 has it: its upper left.
  let rest = vec2f(-0.70710678, -0.70710678);
  let spin = atan2(ub.x * rest.y - ub.y * rest.x, dot(ub, rest));
  let q = turn(rel, -spin);
  let hsc = max(b.W / 1440.0, 0.6);
  // The corona folds onto the limb as the camera nears: drawn as if the moon's radius were Rc, from
  // R down to ~60 px, keeping each pixel's height above the limb. It turns the air's blue and fades.
  let fadeC = (1.0 - m) * (1.0 - m) * (1.0 - m);
  let Rc = R * pow(60.0 / R, sqrt(m));
  if (fadeC > 0.001 && d > -2.0 && d < 2.4 * Rc) {
    out.front += corona(q / dist * (Rc + max(d, 0.0)), Rc, b.time, quiet) * mix(vec3f(1.0), vec3f(0.55, 0.7, 1.0), m) * fadeC;
  }
  let airK = smoothstep(0.2, 0.95, m);
  if (airK > 0.001 && d > -2.0 && d < 420.0 * hsc) {
    // Once the horizon rests, the lit stretch leans toward the cursor.
    let sl = s - 0.5 * b.hover * b.settle * (b.light.x - b.B.x);
    let air = atmosphere(max(d, 0.0) / hsc, s, sl, b.W, b.age, b.travel) * (1.0 + 0.9 * pl) * b.arrive;
    out.front += (air + bandBloom(p, b.C - vec2f(0.0, R), b.B, hsc, d)) * airK;
  }
  out.inside = (1.0 - smoothstep(-0.6, 0.6, d * b.dpr)) * b.vis;
  out.front *= (1.0 - out.inside) * b.vis;
  // Only where the body covers the pixel: the moon's noise is too costly to spend on the open sky.
  if (out.inside > 0.0) {
    out.night = groundNight(max(-d, 0.0) / hsc);
    if (m < 1.0) {
      out.night = mix(moon(q, R, rest), out.night, m);
    }
  }
  let feature = (1.0 - smoothstep(0.0, 0.35, m)) * b.vis;
  if (feature > 0.001 && abs(d) < 40.0) {
    let flames = prom(q, R, rest, 65.0, 7.5, 9.5, 3u, b.time) + prom(q, R, rest, -167.0, 5.5, 7.0, 5u, b.time);
    out.limb = (limbLight(q, R, rest, b.beads) + flames * (1.0 - out.inside)) * feature;
  }
  return out;
}
