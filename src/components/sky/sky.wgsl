// The page's one sky, drawn behind everything in page space: nebula, the body (board 09's eclipse,
// which the camera flies into until it is board 02's horizon), stars and grain. Lengths are CSS
// pixels; y grows down the page.
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
  // 1 for the front pass, which draws only the ground over the content (spec §5.6), else 0.
  layer: f32,
  // The front canvas's top in the viewport, CSS px; 0 for the back canvas.
  origin: f32,
  // The viewport's height: the shed's scale.
  viewHeight: f32,
  // The body (spec §5.3): centre x, centre y (page), radius, visibility.
  body: vec4f,
  // The bead, which becomes the sun: x, y (page), morph (0 eclipse .. 1 horizon), brightness.
  sun: vec4f,
  // Reach past the edge of the edge ring, inner glow and outer haze (px), and the rays' strength.
  halo: vec4f,
  // The bead's glare in px: core radius, glare radius, horizontal and vertical streak half-lengths.
  glare: vec4f,
  // How far the horizon has settled toward its rest line, 0..1.
  settle: f32,
  // Where the trail's ribbon runs, in page y: the top of Work and the top of Contact.
  span: vec2f,
  // The trail (shed, carry, gather; 0..1) and, in w, the stars' virtual scroll (scroll + coast).
  trail: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;

const NEBULA = 1.0;
const GRAIN = 1.0;
const TAU = 6.2831853;

fn hash21(q: vec2f) -> f32 {
  var p = fract(q * vec2f(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// The noise lattice's hash, in integers. hash21 amplifies rounding, and some compilers (DXC, on
// Windows) fold `(i + 1) * k` into `i * k + k`: neighbouring cells then disagree at their shared
// edge and the noise shows seams. Integer maths is exact on every backend.
fn hashCell(c: vec2f) -> f32 {
  let i = bitcast<vec2u>(vec2i(c));
  var h = (i.x * 1597334677u) ^ (i.y * 3812015801u);
  h = (h ^ (h >> 16u)) * 0x7feb352du;
  h = (h ^ (h >> 15u)) * 0x846ca68bu;
  h = h ^ (h >> 16u);
  return f32(h >> 8u) / 16777215.0;
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hashCell(i);
  let b = hashCell(i + vec2f(1.0, 0.0));
  let c = hashCell(i + vec2f(0.0, 1.0));
  let d = hashCell(i + vec2f(1.0, 1.0));
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

// Interpolation between two CSS gradient stops at x0 and x1: the boards' layers are ported stop by stop.
fn stop(x: f32, x0: f32, x1: f32) -> f32 {
  return clamp((x - x0) / (x1 - x0), 0.0, 1.0);
}

// From a to b on a log scale: a reach that shrinks from a share of R to a few px does so evenly.
fn geo(a: f32, b: f32, m: f32) -> f32 {
  return a * pow(b / a, m);
}

// A CSS box-shadow's falloff past its spread. The blurred edge is a normal CDF; this is its logistic fit.
fn shadow(d: f32, spread: f32, blur: f32) -> f32 {
  return 1.0 / (1.0 + exp(clamp(1.702 * (d - spread) / max(blur * 0.5, 0.001), -30.0, 30.0)));
}

// Turns v anticlockwise on screen (y down) by a radians.
fn turn(v: vec2f, a: f32) -> vec2f {
  let c = cos(a);
  let s = sin(a);
  return vec2f(v.x * c + v.y * s, -v.x * s + v.y * c);
}

// Board 09's outer haze, x past the edge as a share of its reach.
fn haze09(x: f32) -> vec3f {
  if (x < 0.179) {
    let k = stop(x, 0.0, 0.179);
    return mix(vec3f(37.0, 55.0, 115.0), vec3f(30.0, 46.0, 100.0), k) / 255.0 * mix(0.116, 0.08, k);
  }
  let k = stop(x, 0.179, 1.0);
  return mix(vec3f(30.0, 46.0, 100.0), vec3f(12.0, 18.0, 40.0), k) / 255.0 * mix(0.08, 0.0, k);
}

// Board 09's inner glow.
fn glow09(x: f32) -> vec3f {
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

// Board 09's ring hugging the edge.
fn ring09(x: f32) -> vec3f {
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
fn rays09(deg: f32) -> f32 {
  var a = ray(deg, 0.0, 8.0, 18.0) * 0.16;
  a = max(a, ray(deg, 52.0, 61.0, 70.0) * 0.1);
  a = max(a, ray(deg, 95.0, 104.0, 116.0) * 0.18);
  a = max(a, ray(deg, 160.0, 172.0, 182.0) * 0.12);
  a = max(a, ray(deg, 236.0, 246.0, 258.0) * 0.15);
  a = max(a, ray(deg, 284.0, 292.0, 301.0) * 0.1);
  return max(a, ray(deg, 330.0, 340.0, 352.0) * 0.14);
}

// Board 09's dark disc, lit a little from its upper left; q is in the body's own frame.
fn disc09(q: vec2f, R: f32) -> vec3f {
  let f = length(q - vec2f(-0.28, -0.36) * R) / (1.8676 * R);
  if (f < 0.52) {
    return mix(vec3f(12.0, 15.0, 24.0), vec3f(5.0, 6.0, 10.0), stop(f, 0.0, 0.52)) / 255.0;
  }
  return mix(vec3f(5.0, 6.0, 10.0), vec3f(2.0, 2.0, 3.0), stop(f, 0.52, 1.0)) / 255.0;
}

// Board 02's ground: flat, with a thin lit band just inside the edge. depth is px inside it.
fn ground02(depth: f32) -> vec3f {
  if (depth < 6.0) {
    return mix(vec3f(8.0, 12.0, 24.0), vec3f(5.0, 8.0, 15.0), stop(depth, 0.0, 6.0)) / 255.0;
  }
  return mix(vec3f(5.0, 8.0, 15.0), vec3f(2.0, 3.0, 5.0), stop(depth, 6.0, 36.0)) / 255.0;
}

// Board 02's band along the horizon, centred on its apex.
fn band02(p: vec2f, apex: vec2f, sx: f32) -> vec3f {
  let e = length(vec2f((p.x - apex.x) / (1400.0 * sx), (p.y - apex.y) / 100.0));
  return vec3f(96.0, 136.0, 224.0) / 255.0 * 0.13 * max(1.0 - e, 0.0);
}

// Board 02's bloom around the sun.
fn bloom02(p: vec2f, sun: vec2f, sx: f32) -> vec3f {
  let e = length(vec2f((p.x - sun.x) / (700.0 * sx), (p.y - sun.y) / 170.0));
  if (e < 0.42) {
    let k = stop(e, 0.0, 0.42);
    return mix(vec3f(150.0, 184.0, 248.0), vec3f(84.0, 120.0, 206.0), k) / 255.0 * mix(0.3, 0.12, k);
  }
  if (e < 0.7) {
    let k = stop(e, 0.42, 0.7);
    return mix(vec3f(84.0, 120.0, 206.0), vec3f(40.0, 60.0, 120.0), k) / 255.0 * mix(0.12, 0.04, k);
  }
  return vec3f(40.0, 60.0, 120.0) / 255.0 * mix(0.04, 0.0, stop(e, 0.7, 1.0));
}

// Board 02's rim mask (spec §5.3): full near the sun, about a tenth at the screen's edges. s is the
// arc length from the sun, positive to the right.
fn rimMask(s: f32, W: f32) -> f32 {
  let sigma = select(0.21 * W, 0.18 * W, s < 0.0);
  let k = max(abs(s) - 0.05 * W, 0.0) / sigma;
  return 0.1 + 0.9 * exp(-k * k);
}

// One of Baily's beads, on the edge `deg` degrees anticlockwise from the bead.
fn baily(p: vec2f, C: vec2f, R: f32, ub: vec2f, deg: f32, r: f32, spread: f32, blur: f32, a: f32) -> vec3f {
  let d = length(p - (C + turn(ub, radians(deg)) * R)) - r;
  return vec3f(1.0 - smoothstep(-0.5, 0.5, d)) + vec3f(236.0, 243.0, 255.0) / 255.0 * a * shadow(d, spread, blur);
}

// A pink prominence licking up from the edge, `deg` degrees anticlockwise from the bead: colour and
// alpha, painted over the ring as the board paints it.
fn prominence(p: vec2f, C: vec2f, R: f32, ub: vec2f, deg: f32, along: f32, up: f32) -> vec4f {
  let dir = turn(ub, radians(deg));
  let local = p - (C + dir * (R + 2.5));
  let e = length(vec2f(dot(local, vec2f(-dir.y, dir.x)) / along, dot(local, dir) / up));
  if (e >= 1.0) {
    return vec4f(0.0);
  }
  if (e < 0.6) {
    let k = stop(e, 0.0, 0.6);
    return vec4f(mix(vec3f(255.0, 150.0, 170.0), vec3f(255.0, 110.0, 140.0), k) / 255.0, mix(0.9, 0.35, k));
  }
  return vec4f(vec3f(255.0, 110.0, 140.0) / 255.0, mix(0.35, 0.0, stop(e, 0.6, 1.0)));
}

// The bead's glare (spec §5.3): a camera effect sized in px, from board 09's diamond to board 02's
// sun as m goes 0 to 1. g is the pixel's offset from the bead.
fn glareAt(g: vec2f, m: f32) -> vec3f {
  let core = params.glare.x;
  let reach = params.glare.y;
  let r = length(g);
  var c = vec3f(0.0);
  if (r < reach) {
    let x = r / reach;
    var a09 = mix(0.07, 0.0, stop(x, 0.44, 1.0));
    var c09 = vec3f(201.0, 220.0, 255.0) / 255.0;
    if (x < 0.05) {
      let k = stop(x, 0.0, 0.05);
      a09 = mix(0.95, 0.7, k);
      c09 = mix(vec3f(255.0), vec3f(240.0, 246.0, 255.0), k) / 255.0;
    } else if (x < 0.18) {
      let k = stop(x, 0.05, 0.18);
      a09 = mix(0.7, 0.26, k);
      c09 = mix(vec3f(240.0, 246.0, 255.0), vec3f(201.0, 220.0, 255.0), k) / 255.0;
    } else if (x < 0.44) {
      a09 = mix(0.26, 0.07, stop(x, 0.18, 0.44));
    }
    let k02 = stop(x, 0.0, 0.22);
    var a02 = mix(0.9, 0.35, k02);
    var c02 = mix(vec3f(255.0), vec3f(214.0, 228.0, 255.0), k02) / 255.0;
    if (x >= 0.22) {
      let k = stop(x, 0.22, 1.0);
      a02 = mix(0.35, 0.0, k);
      c02 = mix(vec3f(214.0, 228.0, 255.0), vec3f(201.0, 220.0, 255.0), k) / 255.0;
    }
    c += c09 * a09 * (1.0 - m) + c02 * a02 * m;
  }
  // The streaks: 1 px lines, brightest at the bead and gone at their ends.
  let streak = vec3f(240.0, 246.0, 255.0) / 255.0;
  c += streak * mix(0.8, 0.85, m) * max(1.0 - abs(g.x) / params.glare.z, 0.0) * clamp(1.0 - abs(g.y), 0.0, 1.0);
  c += streak * mix(0.65, 0.6, m) * max(1.0 - abs(g.y) / params.glare.w, 0.0) * clamp(1.0 - abs(g.x), 0.0, 1.0);
  // The core and its two glows (box-shadows on the boards).
  let d = r - core;
  c += vec3f(1.0 - smoothstep(-0.5, 0.5, d));
  c += vec3f(0.85) * shadow(d, mix(5.0, 3.0, m), mix(14.0, 10.0, m));
  c += vec3f(201.0, 220.0, 255.0) / 255.0 * mix(0.45, 0.4, m) * shadow(d, mix(14.0, 10.0, m), mix(44.0, 34.0, m));
  return c;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let frag = uv * params.resolution;
  let css = frag / params.dpr + vec2f(0.0, params.origin);
  // The same screen pixel in both passes, so the grain and dither match across the rim.
  let screen = frag + vec2f(0.0, params.origin * params.dpr);
  let page = css + vec2f(0.0, params.scroll);
  let W = params.resolution.x / params.dpr;
  let sx = W / 1440.0;
  let t = params.time;
  let bg = vec3f(0.024, 0.027, 0.039);
  var col = bg;
  var occ = 1.0;

  // The body (spec §5.3). m blends every layer from board 09's eclipse to board 02's horizon.
  let C = params.body.xy;
  let R = max(params.body.z, 1.0);
  let vis = params.body.w;
  let B = params.sun.xy;
  let m = params.sun.z;
  let rel = page - C;
  let dist = length(rel);
  let d = dist - R;

  // The front pass keeps only the ground and the rim; above them it is clear.
  let front = params.layer > 0.5;
  if (front && (vis <= 0.001 || d > 3.0)) {
    return vec4f(0.0);
  }
  // Deep in the ground the nebula and the ribbon are hidden anyway.
  let buried = front && d < -2.0 && vis > 0.999;

  // Nebula: domain-warped fbm that drifts on its own and lags the scroll (it moves at 45%),
  // gathering along the page margins.
  var side = smoothstep(0.26, 0.5, abs(css.x - W * 0.5) / W);
  side *= 0.3 + 0.7 * noise(vec2f(page.y * 0.0012, step(W * 0.5, css.x) * 5.0));
  let env = side * 0.55 * NEBULA;
  if (!buried && env > 0.003) {
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

  // Carry: the shed atmosphere becomes a ribbon of nebula winding down through Work. It sits deep
  // (its path moves at 45% of the scroll) and is dimmed behind the text column for legibility.
  let carry = params.trail.y;
  let gather = params.trail.z;
  let workTop = params.span.x;
  let contactTop = params.span.y;
  if (!buried && carry > 0.003 && page.y > workTop - 400.0 && page.y < contactTop + 200.0) {
    let deep = page.y - params.scroll * 0.55;
    // Near Contact the ribbon bends into the resting horizon's sun (spec §5.5).
    let bend = gather * smoothstep(contactTop - 900.0, contactTop, page.y);
    let path = W * (0.5 + 0.3 * sin(deep / 900.0 + 1.1) + 0.08 * sin(deep / 310.0));
    let cx = mix(path, B.x, bend);
    let off = abs(page.x - cx);
    if (off < W * 0.5) {
      let width = W * mix(0.22, 0.08, bend);
      let q = vec2f(page.x, deep) / 420.0;
      let w = vec2f(fbm3(q + vec2f(2.1, t * 0.02)), fbm3(q + vec2f(7.3, 3.9)));
      let n = fbm3(q * 1.6 + (w - 0.45) * 2.0);
      let body = exp(-(off * off) / (width * width));
      let ends = smoothstep(workTop - 400.0, workTop + 300.0, page.y)
               * (1.0 - smoothstep(contactTop, contactTop + 200.0, page.y));
      // Dimmed across the whole text column, which reaches ~0.44 W from the centre.
      let readability = mix(0.55, 1.0, smoothstep(0.44, 0.5, abs(css.x - W * 0.5) / W));
      // At most ~0.10 added luminance.
      col += vec3f(0.2, 0.34, 0.7) * smoothstep(0.3, 0.75, n) * body * ends * readability * carry * 0.3;
    }
  }

  if (vis > 0.001 && d < max(params.halo.z, 170.0 * m) + 4.0) {
    // The body's own frame, turned so the bead sits where board 09 has it: its upper left.
    let ub = (B - C) / R;
    let rest = vec2f(-0.70710678, -0.70710678);
    let spin = atan2(ub.x * rest.y - ub.y * rest.x, dot(ub, rest));
    let q = vec2f(rel.x * cos(spin) - rel.y * sin(spin), rel.x * sin(spin) + rel.y * cos(spin));

    // Past the edge, board 09's haze, glow, rays and ring fade out as board 02's band and bloom
    // fade in. Their reaches shrink from 09's (a share of R) to 02's (px) as the camera nears.
    if (d > -2.0) {
      let x = max(d, 0.0);
      let breathe = 0.93 - 0.07 * cos(t * TAU / 7.0);
      var halo = haze09(x / params.halo.z) + glow09(x / params.halo.y) * breathe + ring09(x / params.halo.x);
      if (params.halo.w > 0.001) {
        // Undo the streamers' CSS transform, scale(1.35, 0.92) rotate(-16deg), to find the conic angle.
        let a = radians(16.0);
        let s = vec2f(q.x / 1.35, q.y / 0.92);
        let l = vec2f(s.x * cos(a) - s.y * sin(a), s.x * sin(a) + s.y * cos(a));
        var deg = degrees(atan2(l.x, -l.y));
        if (deg < 0.0) {
          deg += 360.0;
        }
        let rx = (length(l) - R) / params.halo.z;
        let fade = select(1.0 - 0.55 * stop(rx, 0.0, 0.1775), 0.45 * (1.0 - stop(rx, 0.1775, 0.617)), rx > 0.1775);
        halo += vec3f(201.0, 220.0, 255.0) / 255.0 * rays09(deg) * fade * params.halo.w;
      }
      col += (halo * (1.0 - m) + (band02(page, vec2f(C.x, C.y - R), sx) + bloom02(page, B, sx)) * m) * vis;
    }

    // The ground is opaque, so it hides the nebula, the ribbon and the stars behind it.
    let inside = (1.0 - smoothstep(-0.75, 0.75, d)) * vis;
    col = mix(col, mix(disc09(q, R), ground02(max(-d, 0.0)), m), inside);
    occ *= mix(1.0, smoothstep(0.0, 2.0, d), vis);

    // The edge: board 09's even ring of light gathers into board 02's rim, brightest near the sun.
    // Once the horizon rests, the bright stretch leans toward the cursor, as Contact's horizon did.
    if (d > -1.5 && d < 120.0) {
      let n = rel / max(dist, 0.0001);
      let lean = 0.5 * params.hover * params.settle * (params.light.x - B.x);
      let arc = R * atan2(ub.x * n.y - ub.y * n.x, dot(ub, n)) - lean;
      let mask = mix(1.0, rimMask(arc, W), m);
      let line = clamp(1.0 - abs(d - 0.5), 0.0, 1.0);
      let g1 = 0.7 * shadow(d, 1.0, geo(9.0, 4.0, m));
      let g2 = mix(0.22, 0.4, m) * shadow(d, mix(5.0, 6.0, m), geo(30.0, 22.0, m));
      // Gather: as the ribbon's wisps arrive, the rim lights up (spec §5.5).
      let arrive = 1.0 + 0.25 * gather * smoothstep(0.6, 1.0, gather);
      let edge = mix(vec3f(246.0, 249.0, 255.0), vec3f(240.0, 246.0, 255.0), m) / 255.0 * mix(0.92, 0.95, m) * line
               + mix(vec3f(226.0, 236.0, 255.0), vec3f(214.0, 228.0, 255.0), m) / 255.0 * g1
               + mix(vec3f(160.0, 190.0, 255.0), vec3f(130.0, 168.0, 244.0), m) / 255.0 * g2;
      let faint = vec3f(150.0, 180.0, 240.0) / 255.0 * 0.28 * m * line;
      col += (edge * mask * arrive + faint) * smoothstep(-0.5, 0.5, d) * vis;
    }

    // Board 09's Baily's beads and pink prominences, placed from the bead so they turn with it.
    let feature = (1.0 - smoothstep(0.0, 0.35, m)) * vis;
    if (feature > 0.001 && d > -14.0 && d < 16.0) {
      for (var i = 0; i < 2; i++) {
        let pr = prominence(page, C, R, ub, select(65.0, -167.0, i == 0), select(4.5, 7.0, i == 0), select(2.6, 4.0, i == 0));
        col = mix(col, pr.rgb, pr.a * feature);
      }
      var beads = baily(page, C, R, ub, 13.0, 1.5, 2.0, 6.0, 0.75);
      beads += baily(page, C, R, ub, -13.0, 1.5, 2.0, 6.0, 0.75);
      beads += baily(page, C, R, ub, -22.0, 1.0, 1.0, 5.0, 0.65);
      col += beads * feature;
    }
  }

  // The bead's glare sits over everything. It pulses as board 09's diamond, then as 02's glint.
  if (vis > 0.001 && length(page - B) < max(params.glare.y, max(params.glare.z, params.glare.w)) + 80.0) {
    let pulse = mix(0.91 - 0.09 * cos(t * TAU / 5.2), 0.89 - 0.11 * cos(t * TAU / 6.0), m);
    col += glareAt(page - B, m) * params.sun.w * pulse * vis;
  }

  // Shed: as the horizon settles, its atmosphere peels off the rim around the sun and streams up
  // the page, then fades as it comes to rest and the ribbon takes over (spec §5.4).
  let shed = params.trail.x;
  let shedK = shed * (1.0 - 0.5 * vis) * smoothstep(0.0, 0.15, vis) * (1.0 - smoothstep(0.5, 1.0, params.settle));
  let Rs = 0.95 * params.viewHeight;
  let shedLen = Rs * mix(0.15, 0.9, shed);
  if (shedK > 0.001 && d > 0.0 && d < shedLen) {
    let lat = (page.x - B.x) / Rs;
    let along = d / shedLen;
    let q = vec2f(lat * 14.0, along * 1.6 - shed * 2.5 - t * 0.03);
    let n = fbm(q + vec2f(fbm3(q * 0.8) * 1.2, 0.0));
    let streak = smoothstep(0.42, 0.8, n) * exp(-along * 1.6) * (1.0 - smoothstep(0.7, 1.0, along));
    let crown = 1.0 - smoothstep(0.6, 1.1, abs(lat));
    let tint = mix(vec3f(0.47, 0.7, 0.96), vec3f(0.16, 0.24, 0.52), smoothstep(0.0, 0.8, along));
    // At most ~0.3 added luminance, at the rim.
    col += tint * streak * crown * shedK * 0.45;
  }

  // Gather: the ribbon's wisps run along the resting rim into the sun (spec §5.5).
  if (gather > 0.001 && vis > 0.001 && d > 0.0 && d < 400.0) {
    let inward = abs(page.x - B.x) / (0.37 * W);
    let wq = vec2f(inward * 2.5 + t * 0.04 + gather * 1.5, d / 90.0);
    let wisp = smoothstep(0.55, 0.85, fbm3(wq)) * exp(-d / 180.0);
    // At most ~0.08 added luminance.
    col += vec3f(0.3, 0.45, 0.85) * wisp * gather * 0.12 * vis;
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
  let g = hash21(floor(screen) * 0.7311 + 13.17) - 0.5;
  col += g * GRAIN * (0.02 + 0.07 * lum);
  col += (hash21(screen + fract(t) * 91.0) - 0.5) / 255.0;
  let rgb = max(col, vec3f(0.0));
  if (front) {
    // Opaque up to 1.5 px above the rim, so the rim line sits over the content; clear by 3 px.
    let a = 1.0 - smoothstep(1.5, 3.0, d);
    return vec4f(rgb * a, a);
  }
  return vec4f(rgb, 1.0);
}
