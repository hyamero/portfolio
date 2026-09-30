// Footer backdrop: the hero planet's limb seen again, rising from the bottom edge.
// Output is premultiplied so the footer's own background shows through where nothing is lit.
struct Params {
  resolution: vec2f,
  pointer: vec2f,
  time: f32,
  rise: f32,
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

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.resolution.x / params.resolution.y;
  let p = vec2f(uv.x * aspect, uv.y);

  // A planet much wider than the footer, so only a shallow arc of its limb shows.
  let radius = max(aspect, 1.0) * 2.4;
  let center = vec2f(aspect * 0.5, 1.0 + radius - mix(-0.05, 0.08, params.rise));
  let rel = p - center;
  let dist = length(rel);
  let d = (dist - radius) / radius * 60.0;

  // Light follows the pointer along the arc, falling off toward the far side.
  let lightX = params.pointer.x * aspect;
  let lit = exp(-pow((p.x - lightX) / max(aspect * 0.35, 0.5), 2.0));
  let facing = 0.25 + 0.75 * lit;

  let flow = noise(vec2f(p.x * 6.0 - params.time * 0.08, d * 0.4));
  let rim = exp(-abs(d) * 9.0) * facing;
  let atmosphere = exp(-max(d, 0.0) * 0.9) * step(0.0, d) * facing * (0.75 + 0.5 * flow);
  let inner = exp(min(d, 0.0) * 1.4) * (1.0 - step(0.0, d)) * facing;

  var color = vec3f(0.78, 0.87, 1.0) * rim * 0.9;
  color += vec3f(0.30, 0.42, 0.62) * atmosphere * 0.5;
  color += vec3f(0.18, 0.30, 0.55) * inner * 0.45;
  color *= params.rise;

  // Dither against banding in the long, dim glow.
  color += (hash21(uv * params.resolution + fract(params.time) * 91.0) - 0.5) / 255.0;
  let alpha = clamp(max(color.r, max(color.g, color.b)), 0.0, 1.0);
  return vec4f(max(color, vec3f(0.0)), alpha);
}
