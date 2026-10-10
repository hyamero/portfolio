// Integer hashes and value noise for the sky. Every hash is integer maths: float hashes amplify
// rounding, and some compilers (DXC, on Windows) refold `(i + 1) * k`, so neighbouring cells
// disagreed at their shared edge and the noise showed seams. src/lib/star-field.ts ports these.

export fn pcg(v: u32) -> u32 {
  let s = v * 747796405u + 2891336453u;
  let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}

export fn cellHash(c: vec2i, seed: u32) -> u32 {
  return pcg((bitcast<u32>(c.x) * 1597334677u) ^ pcg(bitcast<u32>(c.y) ^ seed));
}

// 24 bits of a hash as a float in 0..1.
export fn u01(h: u32) -> f32 {
  return f32(h >> 8u) * (1.0 / 16777216.0);
}

export fn vnoise(p: vec2f, seed: u32) -> f32 {
  let i = vec2i(floor(p));
  let f = fract(p);
  let w = f * f * (3.0 - 2.0 * f);
  let a = u01(cellHash(i, seed));
  let b = u01(cellHash(i + vec2i(1, 0), seed));
  let c = u01(cellHash(i + vec2i(0, 1), seed));
  let d = u01(cellHash(i + vec2i(1, 1), seed));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

// Octaves of value noise, normalised to 0..1.
export fn fbm(p0: vec2f, octaves: i32, seed: u32) -> f32 {
  var p = p0;
  var v = 0.0;
  var a = 0.5;
  var n = 0.0;
  for (var i = 0; i < octaves; i++) {
    v += a * vnoise(p, seed + u32(i) * 131u);
    n += a;
    p = p * 2.03 + vec2f(1.7, 9.2);
    a *= 0.5;
  }
  return v / n;
}

// A close fit to the error function, so a streak integrates a Gaussian exactly enough.
export fn erf(x: f32) -> f32 {
  let y = clamp(x, -4.0, 4.0);
  return tanh(1.12837917 * y + 0.10294324 * y * y * y);
}
