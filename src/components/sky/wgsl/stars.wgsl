// The star field and the Milky Way (spec §4.1, Appendix A.1–A.2), in linear light. src/lib/star-field.ts
// ports the near and bright layers' placement for the CSS sky's star map: keep them in step.
import { BG, LUMA } from "./light.wgsl";
import { cellHash, erf, fbm, pcg, u01, vnoise } from "./noise.wgsl";

// The streaks' exposure, s: a star smears over velocity × parallax × this.
const EXPOSURE = 0.05;

// A star's colour, warm K to blue-white B by r, at sat saturation and luminance 1.
export fn starTint(r: f32, sat: f32) -> vec3f {
  var c = vec3f(0.0);
  if (r < 0.1) {
    c = vec3f(1.0, 0.64, 0.4);
  } else if (r < 0.35) {
    c = mix(vec3f(1.0, 0.82, 0.64), vec3f(1.0, 0.94, 0.86), (r - 0.1) / 0.25);
  } else if (r < 0.75) {
    c = mix(vec3f(1.0, 0.97, 0.93), vec3f(0.92, 0.95, 1.0), (r - 0.35) / 0.4);
  } else {
    c = mix(vec3f(0.84, 0.89, 1.0), vec3f(0.68, 0.78, 1.0), (r - 0.75) / 0.25);
  }
  c = mix(vec3f(dot(c, LUMA)), c, sat);
  return c / dot(c, LUMA);
}

// A unit-flux Gaussian of sigma (device px), smeared over len px toward +y. The smear integrates
// it exactly, so a streak carries the still star's light. o = pixel − star, device px.
export fn psf(o: vec2f, sigma: f32, len: f32) -> f32 {
  let gx = exp(-0.5 * o.x * o.x / (sigma * sigma)) / (sigma * 2.5066283);
  if (len < 0.05) {
    return gx * exp(-0.5 * o.y * o.y / (sigma * sigma)) / (sigma * 2.5066283);
  }
  let k = 0.70710678 / sigma;
  return gx * 0.5 * (erf(o.y * k) - erf((o.y - len) * k)) / len;
}

// One depth of stars (Appendix A.1): cell size, odds, flux, the brightness cap, the halo's share, how
// much the Milky Way raises the odds, and the hash seed.
export struct Layer {
  cell: f32,
  odds: f32,
  flux: f32,
  cap: f32,
  halo: f32,
  boost: f32,
  seed: u32,
}

// The 60 px layer, which the CSS star map ports.
export fn nearLayer() -> Layer {
  return Layer(60.0, 0.16, 0.3, 16.0, 0.08, 0.0, 303u);
}

// The band's frame at s: its distance along the band, across it (with its wandering centre line), and its half-width.
fn bandFrame(s: vec2f, W: f32, H: f32) -> vec3f {
  let c0 = vec2f(0.62 * W, 0.42 * H);
  let ang = radians(26.0);
  let dir = vec2f(cos(ang), -sin(ang));
  let nrm = vec2f(-dir.y, dir.x);
  let along = dot(s - c0, dir);
  // It swells and narrows along its length, and its centre line wanders.
  let w = 0.2 * H * (0.8 + 0.4 * fbm(vec2f(along / 600.0, 6.1), 3, 13u));
  // Its edges wander on their own, so it never reads as a tube.
  let across = dot(s - c0, nrm) - w * 0.9 * (fbm(vec2f(along / 700.0, 1.3), 3, 11u) - 0.5) - w * 0.8 * (fbm(s / 280.0, 4, 19u) - 0.5);
  return vec3f(along, across, w);
}

// The Milky Way at band-space s (viewport W × H): rgb its light before gain, a its core profile
// exp(−a²) less its dust, which raises the faint layers' odds in the band. The sky caches it (spec §3.5).
export fn milky(s: vec2f, W: f32, H: f32) -> vec4f {
  let f = bandFrame(s, W, H);
  let along = f.x;
  let a = f.y / f.z;
  let core = exp(-a * a);
  // A faint skirt, so the band fades into the sky rather than stop at an edge.
  let skirt = exp(-a * a / 3.0);
  let lengthwise = 0.6 + 0.6 * fbm(vec2f(along / 520.0, 4.7), 3, 17u);
  let bx = (along - 0.12 * W) / (0.5 * W);
  let bulge = exp(-bx * bx);
  // Two rounds of domain warp, with no preferred direction, so nothing in it runs straight.
  let q = s + (vec2f(fbm(s / 420.0, 3, 43u), fbm(s / 420.0 + vec2f(5.2, 1.3), 3, 47u)) - 0.5) * 140.0;
  let r = q + (vec2f(fbm(q / 150.0, 3, 71u), fbm(q / 150.0 + vec2f(3.7, 8.1), 3, 73u)) - 0.5) * 60.0;
  // Starlight: one continuous glow, brightest down the middle, lumpier where the star clouds bunch.
  let clouds = smoothstep(0.25, 0.85, fbm(r / 130.0, 5, 23u));
  let mottle = fbm(s / 14.0, 3, 29u);
  // Unresolved stars: a dust of specks a couple of px across, densest in the clouds.
  let specks = pow(vnoise(s / 1.6, 59u), 10.0) * 12.0;
  let starlight = core * (0.4 + 0.75 * clouds) * (0.7 + 0.6 * mottle * mottle) * (1.0 + 0.18 * specks * (0.4 + clouds));
  // Dust: soft patches with ragged edges, lying along the middle in stretches. It dims
  // only the band's own light, never the sky behind it.
  let lies = exp(-pow((a + 0.12) / 0.45, 2.0)) * smoothstep(0.3, 0.6, fbm(vec2f(along / 360.0, 7.3), 3, 37u));
  let patches = smoothstep(0.4, 0.74, 0.7 * fbm(r / 90.0, 4, 83u) + 0.3 * fbm(r / 22.0, 3, 89u));
  let dust = patches * lies;
  let glow = (starlight * (1.0 - 0.7 * dust) + 0.035 * skirt * (0.5 + 0.5 * clouds)) * lengthwise * (0.75 + 0.7 * bulge);
  // Blue starlight, paler in the clouds and faintly warm at the core, with dust edges lit brown and
  // faint rose knots of glowing gas. The encode flattens dim colour, so the tints are far stronger
  // than they read.
  var tint = mix(vec3f(0.2, 0.28, 1.0), vec3f(0.45, 0.58, 1.0), smoothstep(0.1, 0.8, core) * clouds);
  tint = mix(tint, vec3f(1.0, 0.82, 0.66), 0.4 * core * bulge * clouds);
  let rim = smoothstep(0.08, 0.4, dust) * (1.0 - smoothstep(0.4, 0.85, dust));
  tint = mix(tint, vec3f(1.0, 0.72, 0.48), 0.35 * rim);
  let knots = smoothstep(0.66, 0.86, fbm(r / 70.0, 4, 41u)) * core * clouds;
  let light = tint * glow + vec3f(0.9, 0.3, 0.8) * knots * 0.3 * (1.0 - dust);
  return vec4f(light, core * (1.0 - 0.7 * dust));
}

// One depth of stars at css (viewport px). off: the layer's scroll and parallax offset; trail: its
// streak this frame (CSS px, + while the page scrolls down). mwOff: the band's offset, and cache/map
// the Milky Way cache and the band-space rect it covers, for the layers it raises.
export fn starLayer(css: vec2f, off: vec2f, L: Layer, trail: f32, dpr: f32, time: f32, mwOff: vec2f,
                    cache: texture_2d<f32>, samp: sampler, map: vec4f) -> vec3f {
  let p = css + off;
  let base = vec2i(floor(p / L.cell));
  // A streak reaches back over the cells its stars have crossed.
  let reach = i32(ceil(abs(trail) / L.cell));
  let len = abs(trail) * dpr;
  var col = vec3f(0.0);
  for (var j = -reach; j <= reach; j++) {
    let c = base + vec2i(0, j);
    let h0 = cellHash(c, L.seed);
    let mid = (vec2f(c) + 0.5) * L.cell;
    // Clusters and voids.
    var odds = L.odds * (0.45 + 1.1 * fbm(mid / 380.0, 3, L.seed + 7u));
    if (L.boost > 0.0) {
      let core = textureSampleLevel(cache, samp, (mid - off + mwOff - map.xy) / map.zw, 0.0).a;
      odds *= 1.0 + L.boost * core;
    }
    if (u01(h0) > odds) {
      continue;
    }
    let h1 = pcg(h0);
    let h2 = pcg(h1);
    let h3 = pcg(h2);
    let h4 = pcg(h3);
    let h5 = pcg(h4);
    let star = (vec2f(c) + vec2f(u01(h1), u01(h2)) * 0.56 + 0.22) * L.cell - off;
    var o = (css - star) * dpr;
    if (trail < 0.0) {
      o.y = -o.y;
    }
    // A Euclidean count: most stars faint, a few bright.
    let F = L.flux * min(pow(max(u01(h3), 1e-5), -2.0 / 3.0), L.cap);
    let bright = smoothstep(0.25, 1.0, F / (L.flux * L.cap));
    let twinkle = 1.0 + 0.16 * bright * sin(time * (0.8 + 1.7 * u01(h5)) + 6.2831853 * u01(h4));
    var e = (1.0 - L.halo) * psf(o, 0.62, len);
    if (L.halo > 0.0) {
      e += L.halo * psf(o, 2.6, len);
    }
    col += starTint(u01(h4), 0.55) * F * twinkle * e;
  }
  return col;
}

// The few bright stars, with diffraction spikes that vanish once they streak.
export fn brightLayer(css: vec2f, off: vec2f, trail: f32, dpr: f32, time: f32) -> vec3f {
  let cell = 240.0;
  let c = vec2i(floor((css + off) / cell));
  let h0 = cellHash(c, 404u);
  if (u01(h0) > 0.12) {
    return vec3f(0.0);
  }
  let h1 = pcg(h0);
  let h2 = pcg(h1);
  let h3 = pcg(h2);
  let h4 = pcg(h3);
  let h5 = pcg(h4);
  let star = (vec2f(c) + vec2f(u01(h1), u01(h2)) * 0.4 + 0.3) * cell - off;
  var o = (css - star) * dpr;
  let len = abs(trail) * dpr;
  if (trail < 0.0) {
    o.y = -o.y;
  }
  let F = 1.6 + 2.4 * u01(h3);
  let twinkle = 1.0 + 0.12 * sin(time * (0.6 + 1.2 * u01(h5)) + 6.2831853 * u01(h4));
  var e = 0.9 * psf(o, 0.62, len) + 0.1 * psf(o, 2.6, len);
  let L = 9.0 * sqrt(F);
  let w2 = 2.0 * 0.45 * 0.45;
  let spike = exp(-abs(o.x) / L) * exp(-o.y * o.y / w2) + 0.8 * exp(-abs(o.y) / L) * exp(-o.x * o.x / w2);
  e += 0.012 * spike * (1.0 - smoothstep(1.0, 8.0, len));
  return starTint(0.5 + 0.5 * u01(h4), 0.5) * F * twinkle * e;
}

// What the sky behind everything reads this frame.
export struct StarFrame {
  // The stars' virtual scroll (scroll plus the coast) and its speed, px/s.
  scroll: f32,
  vel: f32,
  dpr: f32,
  time: f32,
  // The pointer's parallax, (pointer − 0.5) · 8 · hover.
  par: vec2f,
  // The cursor's light here, 0..1.
  pl: f32,
  // How much of the sky shows through the light in front of it.
  ext: f32,
  // The text mask here.
  quiet: f32,
  // The band-space rect the Milky Way cache covers: origin, size.
  map: vec4f,
  // The band's drift down band space (6% of the virtual scroll, held inside the cache).
  drift: f32,
}

// The sky behind everything, in linear light: the background, the cached Milky Way and four depths of stars.
export fn skyField(css: vec2f, f: StarFrame, cache: texture_2d<f32>, samp: sampler) -> vec3f {
  let mwOff = vec2f(0.0, f.drift) + f.par * 0.8;
  let band = textureSampleLevel(cache, samp, (css + mwOff - f.map.xy) / f.map.zw, 0.0).rgb;
  // The cursor's light lifts the band's dust like a lamp in fog; text dims both.
  var col = (band * 0.012 * (1.0 + 2.5 * f.pl) + vec3f(0.5, 0.65, 1.0) * 0.0016 * f.pl) * (1.0 - 0.92 * f.quiet);
  let T = f.vel * EXPOSURE;
  col += starLayer(css, vec2f(0.0, f.scroll * 0.04) + f.par * 0.6, Layer(8.0, 0.006, 0.035, 10.0, 0.0, 7.0, 101u),
                   T * 0.04, f.dpr, f.time, mwOff, cache, samp, f.map);
  col += starLayer(css, vec2f(0.0, f.scroll * 0.08) + f.par * 1.2, Layer(24.0, 0.03, 0.09, 14.0, 0.0, 2.0, 202u),
                   T * 0.08, f.dpr, f.time, mwOff, cache, samp, f.map);
  col += starLayer(css, vec2f(0.0, f.scroll * 0.17) + f.par * 2.0, nearLayer(), T * 0.17, f.dpr, f.time, mwOff, cache, samp, f.map);
  col += brightLayer(css, vec2f(0.0, f.scroll * 0.12) + f.par * 1.6, T * 0.12, f.dpr, f.time);
  return BG + col * f.ext;
}

// Occasional shooting stars, in viewport px: at most one in each 5 s slot, a white head drawing out a
// blue trail. src/lib/meteors.ts ports the schedule, so the sky draws frames while one is in flight:
// keep them in step. Reduced motion stops the clock, so callers gate them off there, where a frozen
// one would hang in the sky.
export fn meteors(css: vec2f, W: f32, H: f32, time: f32, dpr: f32) -> vec3f {
  let P = 5.0;
  let slot = floor(time / P);
  let h0 = cellHash(vec2i(i32(slot), 0), 505u);
  if (slot < 1.0 || u01(h0) > 0.5) {
    return vec3f(0.0);
  }
  let h1 = pcg(h0);
  let h2 = pcg(h1);
  let h3 = pcg(h2);
  let h4 = pcg(h3);
  let h5 = pcg(h4);
  let h6 = pcg(h5);
  let h7 = pcg(h6);
  let dur = 0.6 + 0.5 * u01(h1);
  let u = (time - slot * P - 0.4 - (P - dur - 0.8) * u01(h2)) / dur;
  if (u <= 0.0 || u >= 1.0) {
    return vec3f(0.0);
  }
  // Down and across, 15–40° below level, from the side it heads away from.
  let side = select(1.0, -1.0, u01(h3) < 0.5);
  let ang = radians(15.0 + 25.0 * u01(h4));
  let dir = vec2f(side * cos(ang), sin(ang));
  let p0 = vec2f(W * (0.5 - side * (0.05 + 0.35 * u01(h5))), H * (0.04 + 0.36 * u01(h6)));
  let span = (0.3 + 0.25 * u01(h7)) * max(W, 700.0);
  let q = css - (p0 + dir * span * u);
  let behind = -dot(q, dir);
  let across = dot(q, vec2f(-dir.y, dir.x));
  // The trail draws out behind the head, then shortens as it burns out.
  let len = span * 0.45 * min(u * 3.0, 1.0) * (1.0 - 0.5 * u);
  let k = clamp(behind / len, 0.0, 1.0);
  let sig = max(0.5, 0.75 / dpr);
  let body = exp(-0.5 * across * across / (sig * sig)) + 0.12 * exp(-0.5 * across * across / (16.0 * sig * sig));
  let tail = select(0.0, (1.0 - k) * (1.0 - k), behind > 0.0 && behind < len);
  let trail = mix(vec3f(0.8, 0.9, 1.0), vec3f(0.22, 0.45, 1.0), smoothstep(0.0, 0.35, k)) * body * tail * 0.5;
  let head = vec3f(0.95, 0.97, 1.0) * exp(-0.5 * dot(q, q) / (1.4 * sig * sig)) * 1.6;
  // In, flaring, and out.
  let life = smoothstep(0.0, 0.15, u) * (1.0 - smoothstep(0.6, 1.0, u));
  return (trail + head) * life;
}
