// The page's one sky, drawn behind everything in page space: nebula, the hero orb with its orbital
// paths, stars, the closing horizon and grain. Lengths are CSS pixels; y grows down the page.
struct Params {
  resolution: vec2f,
  // The light, in page space: the pointer while hovering, else resting above the hero.
  light: vec2f,
  // Pointer in 0..1 of the viewport, for the star parallax.
  pointer: vec2f,
  // Canvas pixels per CSS pixel.
  dpr: f32,
  scroll: f32,
  hover: f32,
  time: f32,
  // Hero orb: center x, apex y (top of the limb), radius, visibility.
  orb: vec4f,
  // Contact horizon: center x, top y, radius, rise.
  foot: vec4f,
  footWidth: f32,
  heroHeight: f32,
  // Where the trail's ribbon runs, in page y: the top of Work and the top of Contact.
  span: vec2f,
  // The orb's trail (shed, carry, gather; 0..1) and, in w, the stars' virtual scroll (scroll + coast).
  trail: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;

const GLOW = 1.0;
const NEBULA = 1.0;
const GRAIN = 1.0;

fn hash21(q: vec2f) -> f32 {
  var p = fract(q * vec2f(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(q: vec2f) -> f32 {
  var p = q;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2f(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

fn fbm3(q: vec2f) -> f32 {
  var p = q;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.07 + vec2f(4.1, 2.3);
    a *= 0.5;
  }
  return v;
}

fn stars(p: vec2f, t: f32, density: f32, size: f32) -> f32 {
  let cell = floor(p);
  let s = hash21(cell);
  let j = vec2f(hash21(cell + 11.0), hash21(cell + 23.0)) * 0.6 + 0.2;
  let d = length(fract(p) - j);
  let tw = 0.55 + 0.45 * sin(t * (0.6 + s * 1.8) + s * 40.0);
  return step(density, s) * (1.0 - smoothstep(0.0, size, d)) * tw;
}

fn flare(d: vec2f, t: f32, phase: f32) -> f32 {
  let tw = 0.7 + 0.3 * sin(t * 1.3 + phase);
  let ax = abs(d.x);
  let ay = abs(d.y);
  let spikes = exp(-ay / 0.8) * exp(-ax / 13.0) + exp(-ax / 0.8) * exp(-ay / 13.0);
  let core = exp(-length(d) / 2.0);
  return (spikes * 0.55 + core * 0.9) * tw;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let frag = uv * params.resolution;
  let css = frag / params.dpr;
  let page = css + vec2f(0.0, params.scroll);
  let W = params.resolution.x / params.dpr;
  let H = max(params.heroHeight, 1.0);
  let t = params.time;
  let bg = vec3f(0.024, 0.027, 0.039);
  var col = bg;
  var occ = 1.0;

  let C = vec2f(params.orb.x, params.orb.y + params.orb.z);
  let R = max(params.orb.z, 1.0);
  let vis = params.orb.w;
  let rel = page - C;
  let dist = length(rel);
  let dOrb = dist - R;

  let fc = vec2f(params.foot.x, params.foot.y + params.foot.z);
  let dFoot = length(page - fc) - params.foot.z;
  let rise = params.foot.w;

  // Nebula: domain-warped fbm that drifts on its own and lags the scroll (it moves at 45%),
  // gathering around the orb, along the page margins and above the horizon.
  var side = smoothstep(0.26, 0.5, abs(css.x - W * 0.5) / W);
  side *= 0.3 + 0.7 * noise(vec2f(page.y * 0.0012, step(W * 0.5, css.x) * 5.0));
  var env = vis * exp(-max(dOrb, 0.0) / (R * 0.5)) * step(-60.0, dOrb)
          + side * 0.55
          + rise * exp(-max(dFoot, 0.0) / 300.0) * step(-40.0, dFoot) * 0.9;
  env *= NEBULA;
  if (env > 0.003) {
    let q = vec2f(page.x, page.y - params.scroll * 0.55) / 560.0;
    let tt = t * 0.02;
    let w = vec2f(fbm3(q + vec2f(0.0, tt)), fbm3(q + vec2f(5.2, 1.3) + vec2f(-tt * 0.8, tt * 0.3)));
    let n = fbm(q * 1.3 + (w - 0.45) * 2.4 + vec2f(tt * 0.6, -tt * 0.25));
    var cloud = smoothstep(0.4, 0.8, n);
    cloud *= cloud;
    // Cubed by hand: pow() is undefined for a zero base.
    let x = max(n - 0.52, 0.0) * 2.6;
    let wisp = x * x * x;
    let hue = fbm3(q * 0.7 + w * 1.5 + 3.7);
    var neb = mix(vec3f(0.16, 0.24, 0.52), vec3f(0.27, 0.2, 0.5), smoothstep(0.35, 0.65, hue));
    neb = mix(neb, vec3f(0.15, 0.32, 0.38), smoothstep(0.5, 0.75, w.x));
    col += neb * (cloud * 0.17 + wisp * 0.12) * min(env, 1.4);
  }

  // The orb: a lit limb, a flowing atmosphere band and a dark body that occludes the sky.
  if (vis > 0.001 && dOrb < R * 1.2) {
    let v = vis * (1.0 - smoothstep(-0.02 * H, 0.34 * H, rel.y));
    let d = dOrb / R;
    let outward = rel / max(dist, 0.0001);
    let facing = dot(outward, normalize(params.light - C)) * 0.5 + 0.5;
    let spin = t * 0.01;
    let around = vec2f(
      outward.x * cos(spin) - outward.y * sin(spin),
      outward.x * sin(spin) + outward.y * cos(spin),
    );
    var flow = 0.5;
    if (abs(d) < 0.8) {
      flow = fbm(around * 4.0 + vec2f(0.0, d * 7.0 - t * 0.06));
    }
    let inside = 1.0 - smoothstep(-0.0025, 0.0025, d);
    let halo = exp(-max(d, 0.0) * 6.0) * (0.3 + 0.7 * facing) * (0.75 + 0.5 * flow);
    let depth = max(-d, 0.0);
    let band = mix(vec3f(0.02, 0.04, 0.14), vec3f(0.47, 0.7, 0.96), 1.0 - smoothstep(0.012, 0.28, depth));
    let bandFade = 1.0 - 0.92 * smoothstep(0.18, 0.6, depth);
    let atmos = band * bandFade * (0.45 + 0.55 * facing) * (0.8 + 0.4 * flow) * 0.85 * (0.6 + 0.4 * GLOW);
    let body = max(atmos, vec3f(0.01, 0.012, 0.03));
    let outside = col + vec3f(0.3, 0.38, 0.43) * halo * 0.6 * GLOW;
    var planet = mix(outside, body, inside);
    planet += vec3f(0.78, 0.87, 1.0) * exp(-abs(dOrb) / 5.5) * (0.35 + 0.65 * facing) * 0.85 * GLOW;
    col = mix(col, planet, v);
    occ *= mix(1.0, smoothstep(0.02, 0.3, d), v);

    // Orbital paths: two hairlines on the orb's shoulders, clear of the headline, and two flares.
    let lw = max(0.7, 0.8 / params.dpr);
    let r1 = R + 110.0;
    let r2 = R + 310.0;
    let shoulder = smoothstep(0.27, 0.36, abs(page.x - C.x) / W) * (1.0 - smoothstep(-0.3, 0.0, outward.y));
    let rings = exp(-abs(dist - r1) / lw) * 0.085 + exp(-abs(dist - r2) / lw) * 0.065;
    col += vec3f(0.79, 0.86, 1.0) * rings * shoulder * vis;
    let f1 = C + vec2f(sin(0.55), -cos(0.55)) * r2;
    let f2 = C + vec2f(sin(-0.62), -cos(-0.62)) * r1;
    col += vec3f(0.86, 0.92, 1.0) * (flare(page - f1, t, 0.0) + flare(page - f2, t, 2.2) * 0.75) * vis;
  }

  // The closing horizon: the orb again, low and wide, its lit arc leaning toward the pointer.
  if (rise > 0.001 && dFoot < 560.0 && dFoot > -400.0) {
    let hw = max(params.footWidth, 1.0);
    let a = (page.x - mix(params.foot.x, params.light.x, params.hover)) / (hw * 0.95);
    let b = (page.x - params.foot.x) / (hw * 1.3);
    let facing = (0.3 + 0.7 * exp(-a * a)) * exp(-b * b);
    let flow = noise(vec2f(page.x * 0.0045 - t * 0.08, dFoot * 0.02));
    let above = step(0.0, dFoot);
    let rim = exp(-abs(dFoot) / 6.4);
    let atmo = exp(-max(dFoot, 0.0) / 64.0) * above * (0.75 + 0.5 * flow);
    let inner = exp(min(dFoot, 0.0) / 41.0) * (1.0 - above);
    let ground = (1.0 - above) * (1.0 - smoothstep(-24.0, 0.0, dFoot)) * rise;
    col = mix(col, bg * 0.8, ground);
    let h = vec3f(0.78, 0.87, 1.0) * rim * 0.95 + vec3f(0.3, 0.42, 0.62) * (atmo * 0.55 + inner * 0.32);
    col += h * facing * rise * GLOW;
    occ *= mix(1.0, smoothstep(0.0, 14.0, dFoot), rise);
  }

  // Stars in three depths. Each layer moves at its own share of the stars' virtual scroll, so
  // scrolling reads as travel and the field glides on for a moment after a stop.
  let ss = params.trail.w;
  let par = (params.pointer - 0.5) * 8.0 * params.hover;
  let st = stars((css + vec2f(0.0, ss * 0.04) + par * 0.6) / 9.0, t, 0.988, 0.08) * 0.4
         + stars((css + vec2f(0.0, ss * 0.08) + par * 1.2) / 23.0 + 17.0, t * 0.8, 0.98, 0.07) * 0.65
         + stars((css + vec2f(0.0, ss * 0.17) + par * 2.0) / 47.0 + 41.0, t * 0.6, 0.975, 0.09) * 0.95;
  col += vec3f(st * occ);

  let lum = dot(col, vec3f(0.2126, 0.7152, 0.0722));
  let g = hash21(floor(frag) * 0.7311 + 13.17) - 0.5;
  col += g * GRAIN * (0.02 + 0.07 * lum);
  col += (hash21(frag + fract(t) * 91.0) - 0.5) / 255.0;
  return vec4f(max(col, vec3f(0.0)), 1.0);
}
