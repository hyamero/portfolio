// Hero backdrop: a dark planet with a lit atmosphere, anchored bottom-right.
// Colors are authored in display (sRGB) space — the canvas applies no conversion.
struct Params {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
  scroll: f32,
  intro: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
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

fn fbm(p: vec2f) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var q = p;
  for (var i = 0; i < 4; i++) {
    value += amplitude * noise(q);
    q = q * 2.03 + vec2f(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

fn stars(p: vec2f, time: f32) -> f32 {
  let grid = p * 90.0;
  let cell = floor(grid);
  let seed = hash21(cell);
  let jitter = vec2f(hash21(cell + 11.0), hash21(cell + 23.0)) * 0.6 + 0.2;
  let dist = length(fract(grid) - jitter);
  let twinkle = 0.55 + 0.45 * sin(time * (0.6 + seed * 1.8) + seed * 40.0);
  return step(0.982, seed) * smoothstep(0.09, 0.0, dist) * twinkle;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.resolution.x / params.resolution.y;
  // Height-normalized space so the planet stays round at any aspect ratio.
  let p = vec2f(uv.x * aspect, uv.y);
  let time = params.time;
  let intro = params.intro;

  let radius = 0.70 * (0.94 + 0.06 * intro);
  // Portrait screens stack the copy taller, so the limb sinks below it there.
  let sink = max(1.0 - aspect, 0.0) * 0.5;
  let center = vec2f(max(aspect - 0.333, aspect * 0.72), 1.06 + sink - params.scroll * 0.2);

  let rel = p - center;
  let dist = length(rel);
  let outward = rel / max(dist, 1e-4);
  // Signed distance to the limb in planet radii: < 0 inside, > 0 outside.
  let d = (dist - radius) / radius;

  let lightPos = vec2f(params.pointer.x * aspect, params.pointer.y);
  let facing = dot(outward, normalize(lightPos - center)) * 0.5 + 0.5;

  // Turbulence streams along the limb. Sampled on a circle rather than by atan2 angle, whose
  // wrap from +pi to -pi would split the noise along a horizontal line through the center.
  let spin = time * 0.01;
  let around = vec2f(outward.x * cos(spin) - outward.y * sin(spin), outward.x * sin(spin) + outward.y * cos(spin));
  let flow = fbm(around * 4.0 + vec2f(0.0, d * 7.0 - time * 0.06));

  let background = vec3f(0.043);
  let inside = 1.0 - smoothstep(-0.003, 0.003, d);

  let halo = exp(-max(d, 0.0) * 6.0) * (0.3 + 0.7 * facing) * (0.75 + 0.5 * flow);
  let haloColor = vec3f(0.30, 0.38, 0.43) * halo * 0.6;

  let starMask = smoothstep(0.02, 0.3, d);
  let parallax = (params.pointer - 0.5) * 0.015;
  let starLight = stars(p + parallax, time) * starMask * 0.7;

  let depth = max(-d, 0.0);
  let sky = vec3f(0.47, 0.70, 0.96);
  let deep = vec3f(0.02, 0.04, 0.14);
  let band = mix(deep, sky, 1.0 - smoothstep(0.015, 0.3, depth));
  let bandFade = 1.0 - 0.92 * smoothstep(0.2, 0.62, depth);
  let atmosphere = band * bandFade * (0.45 + 0.55 * facing) * (0.8 + 0.4 * flow);
  let core = vec3f(0.012, 0.012, 0.03);

  let outside = background + (haloColor + vec3f(starLight)) * intro;
  let planet = mix(background, max(atmosphere, core), intro);
  var color = mix(outside, planet, inside);

  let rim = exp(-abs(d) * 110.0) * (0.35 + 0.65 * facing) * intro;
  color += vec3f(0.78, 0.87, 1.0) * rim * 0.85;

  // The DOM layers this replaces, in their original paint order: the canvas sat at 90% over the
  // near-black poster, then a 35% black overlay blend, then soft-light grain.
  color = color * 0.9 + 0.1 * background;
  color = mix(color, overlayBlack(color), 0.35);

  // Grain is keyed to the canvas pixel, so it scrolls with the page instead of re-rolling.
  let pixel = vec2u(uv * params.resolution);
  let grain = vec3f(pixelHash(pixel, 1u), pixelHash(pixel, 2u), pixelHash(pixel, 3u));
  let grainAlpha = 0.7 + 0.5 * (pixelHash(pixel, 4u) - 0.5);
  // CSS `radial-gradient(ellipse at bottom, white, transparent 80%)`: farthest-corner radii.
  let ellipse = length(vec2f((uv.x - 0.5) / 0.7071, (uv.y - 1.0) / 1.4142));
  let grainMask = 0.75 * clamp(1.0 - ellipse / 0.8, 0.0, 1.0);
  // feTurbulence renders in linearRGB, so its mid-grey noise reaches the blend as ~0.73 in sRGB.
  let grainTone = pow(clamp(0.5 + (grain - 0.5) * 1.0, vec3f(0.0), vec3f(1.0)), vec3f(1.0 / 2.2));
  color = mix(color, softLight(color, grainTone), grainMask * grainAlpha);

  // Dither against banding in the long dark gradients.
  color += (pixelHash(pixel, 5u + u32(fract(time) * 97.0)) - 0.5) / 255.0;
  return vec4f(color, 1.0);
}

// Integer PCG hash for per-pixel noise. hash21's float math loses precision at large pixel
// coordinates, which quantizes the grain in bands and shifts its soft-light brightness.
fn pcg(v: u32) -> u32 {
  let state = v * 747796405u + 2891336453u;
  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

fn pixelHash(pixel: vec2u, salt: u32) -> f32 {
  return f32(pcg(pixel.x ^ pcg(pixel.y ^ pcg(salt)))) / 4294967295.0;
}

// `mix-blend-mode: overlay` with a black source.
fn overlayBlack(base: vec3f) -> vec3f {
  return select(vec3f(0.0), 2.0 * base - 1.0, base > vec3f(0.5));
}

// `mix-blend-mode: soft-light`, per the W3C compositing spec.
fn softLight(base: vec3f, blend: vec3f) -> vec3f {
  let lift = select(sqrt(base), ((16.0 * base - 12.0) * base + 4.0) * base, base <= vec3f(0.25));
  let darken = base - (1.0 - 2.0 * blend) * base * (1.0 - base);
  let lighten = base + (2.0 * blend - 1.0) * (lift - base);
  return select(lighten, darken, blend <= vec3f(0.5));
}
