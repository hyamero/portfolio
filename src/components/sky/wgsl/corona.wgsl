// The eclipse (spec §4.2, Appendix A.3), in linear light and the body's own frame, where the bead
// sits at the upper left. q is CSS px from the moon's centre.
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

fn lobe(deg: f32, c: f32, w: f32) -> f32 {
  var d = abs(deg - c);
  d = min(d, 360.0 - d);
  return exp(-(d * d) / (w * w));
}

// Board 09's seven streamers, wide at the base and narrowing outward like helmet streamers.
fn streamers(deg: f32, x: f32) -> f32 {
  let widen = 0.5 + 0.8 / x;
  var s = 0.16 * lobe(deg, 8.0, 9.0 * widen);
  s += 0.10 * lobe(deg, 61.0, 8.0 * widen);
  s += 0.18 * lobe(deg, 104.0, 10.0 * widen);
  s += 0.12 * lobe(deg, 172.0, 10.0 * widen);
  s += 0.15 * lobe(deg, 246.0, 10.0 * widen);
  s += 0.10 * lobe(deg, 292.0, 8.0 * widen);
  s += 0.14 * lobe(deg, 340.0, 10.0 * widen);
  return s / 0.18;
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

// The corona. lean: the pointer's direction from the centre (xy) and its pull (z); quiet: the text mask.
export fn corona(q: vec2f, R: f32, lean: vec3f, t: f32, quiet: f32) -> vec3f {
  let r = length(q);
  let x = max(r / R, 1.0);
  let ang = atan2(q.x, -q.y);
  let dp = angDiff(atan2(lean.x, -lean.y), ang);
  // Farther out, features bend toward the pointer's side, as if it drew them.
  let sa = ang + 0.2 * lean.z * (x - 1.0) * sin(dp) * exp(-(dp * dp) / 1.2);
  let sdir = vec2f(sin(sa), -cos(sa));
  let lx = log(x);
  // Fine radial filaments, sampled round a circle so they have no seam, drifting very slowly.
  let f1 = fbm(sdir * (58.0 + 2.4 * lx) + vec2f(t * 0.004, 0.0), 3, 91u);
  let f2 = fbm(sdir * (17.0 + 1.5 * lx) + vec2f(0.0, t * 0.003), 3, 92u);
  // Near the limb the glow smooths them.
  let grain = 0.45 + 0.75 * smoothstep(1.0, 1.8, x);
  let fine = clamp(1.0 + grain * (1.1 * (f1 - 0.5) + 0.6 * (f2 - 0.5)), 0.1, 1.8);
  let b = boardFrame(sdir * r);
  let env = 0.08 + 2.2 * streamers(b.x, max(b.y / R, 1.0));
  let inner = pow(x, -20.0) + 0.1 * pow(x, -6.0);
  let outer = 0.022 * pow(x, -2.6) * (1.0 - smoothstep(2.6, 4.0, x)) * (1.0 - 0.7 * quiet);
  var I = inner * (0.85 + 0.15 * fine) + outer * env * fine;
  I *= 1.0 + 0.45 * lean.z * exp(-(dp * dp) / 0.2);
  return mix(vec3f(0.93, 0.96, 1.0), vec3f(0.58, 0.7, 1.0), smoothstep(1.02, 2.4, x)) * I;
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

// The chromosphere's pink arc by the bead, and Baily's beads: sunlight through the valleys of the
// moon's rough limb. open > 0 lets light through; the intro raises it until they close into the diamond.
export fn limbLight(q: vec2f, R: f32, ub: vec2f, open: f32) -> vec3f {
  let d = length(q) - R;
  let ang = atan2(q.x, -q.y);
  let db = angDiff(ang, atan2(ub.x, -ub.y));
  let ch = exp(-(db * db) / 0.13);
  let th = 0.7 + 2.4 * ch;
  let hc = (d - 0.5 * th) / (0.5 * th + 0.35);
  var c = vec3f(1.0, 0.24, 0.38) * 0.9 * ch * exp(-hc * hc);
  let profile = fbm(vec2f(ang * 24.0, 0.37), 3, 71u);
  let gap = (0.5 - profile) * 2.4 - abs(db) * 4.2 + open;
  let e = d - 0.5;
  c += vec3f(1.0, 0.97, 0.94) * smoothstep(0.0, 0.2, gap) * (3.0 * exp(-(e * e) / 1.1) + 0.35 * exp(-(e * e) / 9.0));
  return c;
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
