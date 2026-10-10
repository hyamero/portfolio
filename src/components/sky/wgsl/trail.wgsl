// The trail (eclipse spec §5.4–5.5, sky polish spec §4.5): the margin nebula, the shed, the ribbon
// through Work and the gather into the resting horizon, in linear light. Their shapes and
// choreography are unchanged; each was tuned as display colour over the page, so lift() keeps
// its on-screen value.
import { BG, decode } from "./light.wgsl";
import { fbm, vnoise } from "./noise.wgsl";

export struct Trail {
  W: f32,
  scroll: f32,
  time: f32,
  // shed, carry, gather, 0..1
  shed: f32,
  carry: f32,
  gather: f32,
  // Where the ribbon runs, page y: the tops of Work and Contact.
  workTop: f32,
  contactTop: f32,
  viewHeight: f32,
  // The sun, the body's visibility and how far the horizon has settled.
  B: vec2f,
  vis: f32,
  settle: f32,
}

// The old fbm's octave sums, at their old amplitude.
fn fbm4(p: vec2f) -> f32 {
  return fbm(p, 4, 41u) * 0.9375;
}
fn fbm3(p: vec2f) -> f32 {
  return fbm(p, 3, 43u) * 0.875;
}

// Display-space colour added over the page background, as linear light.
fn lift(add: vec3f) -> vec3f {
  return decode(vec3f(0.0235, 0.0275, 0.0392) + add) - BG;
}

// Domain-warped fbm gathering round the planet, along the page margins and above the horizon,
// drifting on its own and lagging the scroll. d: p's height above the body's limb; R, m: its radius and
// morph; quiet: the text mask, which keeps the horizon's clouds off the text.
export fn nebula(page: vec2f, css: vec2f, tr: Trail, d: f32, R: f32, m: f32, quiet: f32) -> vec3f {
  var side = smoothstep(0.26, 0.5, abs(css.x - tr.W * 0.5) / tr.W);
  side *= 0.3 + 0.7 * vnoise(vec2f(page.y * 0.0012, step(tr.W * 0.5, css.x) * 5.0), 47u);
  let around = (1.0 - m) * exp(-max(d, 0.0) / (max(R, 1.0) * 0.5)) * step(-60.0, d);
  let above = m * exp(-max(d, 0.0) / 300.0) * step(-40.0, d) * 0.9 * (1.0 - 0.85 * quiet);
  let env = side * 0.55 + (around + above) * tr.vis;
  if (env <= 0.003) {
    return vec3f(0.0);
  }
  let q = vec2f(page.x, page.y - tr.scroll * 0.55) / 560.0;
  let tt = tr.time * 0.02;
  let w = vec2f(fbm3(q + vec2f(0.0, tt)), fbm3(q + vec2f(5.2, 1.3) + vec2f(-tt * 0.8, tt * 0.3)));
  let n = fbm4(q * 1.3 + (w - 0.45) * 2.4 + vec2f(tt * 0.6, -tt * 0.25));
  var cloud = smoothstep(0.4, 0.8, n);
  cloud *= cloud;
  let x = max(n - 0.52, 0.0) * 2.6;
  let hue = fbm3(q * 0.7 + w * 1.5 + 3.7);
  var neb = mix(vec3f(0.16, 0.24, 0.52), vec3f(0.27, 0.2, 0.5), smoothstep(0.35, 0.65, hue));
  neb = mix(neb, vec3f(0.15, 0.32, 0.38), smoothstep(0.5, 0.75, w.x));
  return lift(neb * (cloud * 0.17 + x * x * x * 0.12) * min(env, 1.4));
}

// Carry: the shed atmosphere winds down through Work as a ribbon of nebula. quiet, the text mask,
// dims it behind the text.
export fn ribbon(page: vec2f, css: vec2f, tr: Trail, quiet: f32) -> vec3f {
  if (tr.carry <= 0.003 || page.y < tr.workTop - 400.0 || page.y > tr.contactTop + 200.0) {
    return vec3f(0.0);
  }
  let deep = page.y - tr.scroll * 0.55;
  // Near Contact it bends into the resting horizon's sun.
  let bend = tr.gather * smoothstep(tr.contactTop - 900.0, tr.contactTop, page.y);
  let path = tr.W * (0.5 + 0.3 * sin(deep / 900.0 + 1.1) + 0.08 * sin(deep / 310.0));
  let off = abs(page.x - mix(path, tr.B.x, bend));
  if (off >= tr.W * 0.5) {
    return vec3f(0.0);
  }
  let width = tr.W * mix(0.22, 0.08, bend);
  let q = vec2f(page.x, deep) / 420.0;
  let w = vec2f(fbm3(q + vec2f(2.1, tr.time * 0.02)), fbm3(q + vec2f(7.3, 3.9)));
  let n = fbm3(q * 1.6 + (w - 0.45) * 2.0);
  let body = exp(-(off * off) / (width * width));
  let ends = smoothstep(tr.workTop - 400.0, tr.workTop + 300.0, page.y) * (1.0 - smoothstep(tr.contactTop, tr.contactTop + 200.0, page.y));
  return lift(vec3f(0.2, 0.34, 0.7) * smoothstep(0.3, 0.75, n) * body * ends * (1.0 - 0.45 * quiet) * tr.carry * 0.3);
}

// Shed: as the horizon settles, its atmosphere peels off the rim around the sun and streams up the
// page, then fades as the ribbon takes over. Its root keeps the sunrise's amber. d: height above the limb.
export fn shed(page: vec2f, d: f32, tr: Trail) -> vec3f {
  let k = tr.shed * (1.0 - 0.5 * tr.vis) * smoothstep(0.0, 0.15, tr.vis) * (1.0 - smoothstep(0.5, 1.0, tr.settle));
  let Rs = 0.95 * tr.viewHeight;
  let len = Rs * mix(0.15, 0.9, tr.shed);
  if (k <= 0.001 || d <= 0.0 || d >= len) {
    return vec3f(0.0);
  }
  let lat = (page.x - tr.B.x) / Rs;
  let along = d / len;
  let q = vec2f(lat * 14.0, along * 1.6 - tr.shed * 2.5 - tr.time * 0.03);
  let n = fbm4(q + vec2f(fbm3(q * 0.8) * 1.2, 0.0));
  let streak = smoothstep(0.42, 0.8, n) * exp(-along * 1.6) * (1.0 - smoothstep(0.7, 1.0, along));
  let crown = 1.0 - smoothstep(0.6, 1.1, abs(lat));
  let blue = mix(vec3f(0.47, 0.7, 0.96), vec3f(0.16, 0.24, 0.52), smoothstep(0.0, 0.8, along));
  let tint = mix(blue, vec3f(1.0, 0.6, 0.22), 0.25 * (1.0 - smoothstep(0.0, 0.33, along)));
  return lift(tint * streak * crown * k * 0.45);
}

// Gather: the ribbon's wisps run along the resting rim into the sun.
export fn gather(page: vec2f, d: f32, tr: Trail) -> vec3f {
  if (tr.gather <= 0.001 || tr.vis <= 0.001 || d <= 0.0 || d >= 400.0) {
    return vec3f(0.0);
  }
  let inward = abs(page.x - tr.B.x) / (0.37 * tr.W);
  let wq = vec2f(inward * 2.5 + tr.time * 0.04 + tr.gather * 1.5, d / 90.0);
  let wisp = smoothstep(0.55, 0.85, fbm3(wq)) * exp(-d / 180.0);
  return lift(vec3f(0.3, 0.45, 0.85) * wisp * tr.gather * 0.12 * tr.vis);
}
