// The eclipse (spec §4.2, Appendix A.3), in linear light and the body's own frame, where the bead
// sits at the upper left. q is CSS px from the moon's centre.
import { overBg } from "./light.wgsl";
import { fbm } from "./noise.wgsl";

export fn angDiff(a: f32, b: f32) -> f32 {
  return atan2(sin(a - b), cos(a - b));
}

// Turns v anticlockwise on screen (y down) by a radians.
export fn turn(v: vec2f, a: f32) -> vec2f {
  let c = cos(a);
  let s = sin(a);
  return vec2f(v.x * c + v.y * s, -v.x * s + v.y * c);
}

// From x0 to x1, clamped: board 09's layers are ported stop by stop from its CSS gradients.
fn stop(x: f32, x0: f32, x1: f32) -> f32 {
  return clamp((x - x0) / (x1 - x0), 0.0, 1.0);
}

// Board 09's outer haze, x past the limb as a share of its reach. Its colours add in display space.
fn haze(x: f32) -> vec3f {
  if (x < 0.179) {
    let k = stop(x, 0.0, 0.179);
    return mix(vec3f(37.0, 55.0, 115.0), vec3f(30.0, 46.0, 100.0), k) / 255.0 * mix(0.116, 0.08, k);
  }
  let k = stop(x, 0.179, 1.0);
  return mix(vec3f(30.0, 46.0, 100.0), vec3f(12.0, 18.0, 40.0), k) / 255.0 * mix(0.08, 0.0, k);
}

// Board 09's inner glow.
fn glow(x: f32) -> vec3f {
  if (x < 0.0833) {
    let k = stop(x, 0.0, 0.0833);
    return mix(vec3f(214.0, 227.0, 255.0), vec3f(176.0, 200.0, 255.0), k) / 255.0 * mix(0.513, 0.24, k);
  }
  if (x < 0.303) {
    let k = stop(x, 0.0833, 0.303);
    return mix(vec3f(176.0, 200.0, 255.0), vec3f(130.0, 160.0, 236.0), k) / 255.0 * mix(0.24, 0.1, k);
  }
  if (x < 0.633) {
    let k = stop(x, 0.303, 0.633);
    return mix(vec3f(130.0, 160.0, 236.0), vec3f(96.0, 126.0, 214.0), k) / 255.0 * mix(0.1, 0.035, k);
  }
  return vec3f(96.0, 126.0, 214.0) / 255.0 * mix(0.035, 0.0, stop(x, 0.633, 1.0));
}

// Board 09's ring hugging the limb.
fn ring(x: f32) -> vec3f {
  if (x < 0.213) {
    let k = stop(x, 0.0, 0.213);
    return mix(vec3f(246.0, 249.0, 255.0), vec3f(214.0, 228.0, 255.0), k) / 255.0 * mix(0.9, 0.38, k);
  }
  if (x < 0.606) {
    let k = stop(x, 0.213, 0.606);
    return mix(vec3f(214.0, 228.0, 255.0), vec3f(201.0, 220.0, 255.0), k) / 255.0 * mix(0.38, 0.1, k);
  }
  return vec3f(201.0, 220.0, 255.0) / 255.0 * mix(0.1, 0.0, stop(x, 0.606, 1.0));
}

// One of board 09's streamers: up to its peak and back down, by CSS conic angle in degrees.
fn ray(deg: f32, a0: f32, peak: f32, a1: f32) -> f32 {
  return min(stop(deg, a0, peak), 1.0 - stop(deg, peak, a1));
}

// Board 09's seven streamers. Their angles run clockwise from 12 o'clock, as CSS conic angles do.
fn rays(deg: f32) -> f32 {
  var a = ray(deg, 0.0, 8.0, 18.0) * 0.16;
  a = max(a, ray(deg, 52.0, 61.0, 70.0) * 0.1);
  a = max(a, ray(deg, 95.0, 104.0, 116.0) * 0.18);
  a = max(a, ray(deg, 160.0, 172.0, 182.0) * 0.12);
  a = max(a, ray(deg, 236.0, 246.0, 258.0) * 0.15);
  a = max(a, ray(deg, 284.0, 292.0, 301.0) * 0.1);
  return max(a, ray(deg, 330.0, 340.0, 352.0) * 0.14);
}

// Board 09's conic angle (deg) and radius at q, undoing its streamers' scale(1.35, 0.92) rotate(−16deg).
fn boardFrame(q: vec2f) -> vec2f {
  let a = radians(16.0);
  let s = vec2f(q.x / 1.35, q.y / 0.92);
  let l = vec2f(s.x * cos(a) - s.y * sin(a), s.x * sin(a) + s.y * cos(a));
  var deg = degrees(atan2(l.x, -l.y));
  if (deg < 0.0) {
    deg += 360.0;
  }
  return vec2f(deg, length(l));
}

// The corona: board 09's ring, glow, haze and streamers, whose reaches are shares of R. quiet: the text mask.
export fn corona(q: vec2f, R: f32, t: f32, quiet: f32) -> vec3f {
  let d = max(length(q) - R, 0.0);
  let haloReach = 2.4 * R;
  let breathe = 0.93 - 0.07 * cos(t * 6.2831853 / 7.0);
  let b = boardFrame(q);
  let rx = (b.y - R) / haloReach;
  let fade = select(1.0 - 0.55 * stop(rx, 0.0, 0.1775), 0.45 * (1.0 - stop(rx, 0.1775, 0.617)), rx > 0.1775);
  let streamers = vec3f(201.0, 220.0, 255.0) / 255.0 * rays(b.x) * fade;
  let c = ring(d / (0.18 * R)) + (glow(d / (1.2 * R)) * breathe + haze(d / haloReach) + streamers) * (1.0 - 0.7 * quiet);
  return overBg(c);
}

// The moon's night side: earthshine on its maria, and a soft light from the bead's side (ub).
export fn moon(q: vec2f, R: f32, ub: vec2f) -> vec3f {
  let n = q / R;
  let z = sqrt(max(1.0 - dot(n, n), 0.0));
  let uv = n / (0.55 + 0.45 * z);
  let maria = smoothstep(0.44, 0.62, fbm(uv * 1.7 + vec2f(3.1, 7.7), 4, 61u));
  let albedo = (1.0 - 0.45 * maria) * (0.85 + 0.3 * fbm(uv * 6.0, 3, 62u));
  let toward = 0.5 + 0.5 * dot(n, ub);
  return vec3f(0.55, 0.66, 1.0) * 0.003 * albedo * (0.4 + 0.6 * z) + vec3f(0.6, 0.7, 1.0) * 0.004 * toward * toward * toward;
}

// Baily's beads: sunlight through the valleys of the moon's rough limb by the bead (ub). open > 0 lets
// light through; the intro raises it until they close into the diamond.
export fn limbLight(q: vec2f, R: f32, ub: vec2f, open: f32) -> vec3f {
  let d = length(q) - R;
  let ang = atan2(q.x, -q.y);
  let db = angDiff(ang, atan2(ub.x, -ub.y));
  let profile = fbm(vec2f(ang * 24.0, 0.37), 3, 71u);
  let gap = (0.5 - profile) * 2.4 - abs(db) * 4.2 + open;
  let e = d - 0.5;
  return vec3f(1.0, 0.97, 0.94) * smoothstep(0.0, 0.2, gap) * (3.0 * exp(-(e * e) / 1.1) + 0.35 * exp(-(e * e) / 9.0));
}

// A prominence: a ragged flame of hydrogen pink on the limb, deg anticlockwise from the bead.
export fn prom(q: vec2f, R: f32, ub: vec2f, deg: f32, bw: f32, ph: f32, seed: u32, t: f32) -> vec3f {
  let dir = turn(ub, radians(deg));
  let local = q - dir * R;
  let tt = dot(local, vec2f(-dir.y, dir.x));
  let h = dot(local, dir);
  if (h < -1.5 || h > ph * 1.8 || abs(tt) > bw * 1.8) {
    return vec3f(0.0);
  }
  let n = fbm(vec2f(tt, h) / 2.0 + vec2f(f32(seed) * 3.7, t * 0.04), 3, seed);
  let e = 1.0 - (tt * tt) / (bw * bw) - max(h, 0.0) / ph + (n - 0.5);
  let core = smoothstep(0.0, 0.5, e);
  let glow = exp(-max(-e, 0.0) * 4.0) * 0.3;
  return vec3f(1.0, 0.26, 0.42) * (core * 0.8 + glow) * smoothstep(-1.5, 0.5, h);
}
