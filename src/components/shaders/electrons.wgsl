// Electrons for the atom icon: one per orbit, each trailing a brighter stretch of its stroke.
// Drawn over the icon's <img> and premultiplied, so the icon itself shows through untouched.
struct Params {
  resolution: vec2f,
  // Radians of orbit travelled; advances faster while the panel is hovered.
  phase: f32,
  // Eases to 1 while the "Powered by" panel is hovered.
  power: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var icon: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

// The icon draws its strokes white at up to half opacity, fading toward the bottom right.
fn shade(uv: vec2f) -> f32 {
  return clamp(textureSampleLevel(icon, samp, uv, 0.0).a * 2.0, 0.0, 1.0);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // Orbits fitted to atom-icon.png, in its 720px space: center, semi-axes, and rotation.
  var centers = array<vec2f, 4>(
    vec2f(345.69, 359.19),
    vec2f(350.5, 353.88),
    vec2f(346.0, 354.94),
    vec2f(353.06, 354.75),
  );
  var axes = array<vec2f, 4>(
    vec2f(338.88, 122.5),
    vec2f(338.0, 125.69),
    vec2f(338.56, 126.5),
    vec2f(338.38, 126.31),
  );
  var angles = array<f32, 4>(0.0, 1.5707963, 0.7853982, -0.7853982);
  // Per orbit: speed relative to the shared phase (signed for direction), and a starting offset.
  var speeds = array<f32, 4>(1.0, -0.82, 0.9, -0.74);
  var offsets = array<f32, 4>(0.4, 2.1, 3.9, 5.3);

  let p = uv * 720.0;
  let pixel = 720.0 / params.resolution.x;
  let power = params.power;
  var a = 0.0;

  for (var i = 0; i < 4; i++) {
    let c = cos(angles[i]);
    let s = sin(angles[i]);
    let ab = axes[i];
    // Into the orbit's own frame, where it's an axis-aligned ellipse.
    let rel = p - centers[i];
    let q = vec2f(rel.x * c + rel.y * s, -rel.x * s + rel.y * c);
    let n = q / ab;
    let len = length(n);
    // Distance to the ellipse, from its implicit form over the gradient's length.
    let grad = length(q / (ab * ab)) / max(len, 1e-4);
    let d = (len - 1.0) / max(grad, 1e-4);

    // Uniform motion in the ellipse's own angle is a circular orbit seen tilted: slow round the
    // tight ends, quick along the sides, like the real thing.
    let t = offsets[i] + speeds[i] * params.phase;
    let local = vec2f(ab.x * cos(t), ab.y * sin(t));
    let e = centers[i] + vec2f(local.x * c - local.y * s, local.x * s + local.y * c);
    // The near half of the orbit, as the icon would have it, is the half swinging downward.
    let depth = 0.6 + 0.4 * (0.5 + 0.5 * sin(t));

    // Trail: the stroke just behind the electron brightens and fades.
    if (abs(d) < 18.0) {
      let at = atan2(n.y, n.x);
      let behind = fract((t - at) * sign(speeds[i]) / 6.2831853) * 6.2831853;
      let reach = mix(0.9, 1.25, power);
      let fade = pow(max(1.0 - behind / reach, 0.0), 2.0);
      let width = mix(3.5, 1.5, behind / reach) * max(pixel, 1.0);
      a += exp(-d * d / (width * width)) * fade * shade(uv) * mix(0.35, 0.55, power);
    }

    // The electron: a bright point with a soft glow, lit like the stroke it rides.
    let r = length(p - e);
    let glow = exp(-r * r / 60.0) * 0.8 + exp(-r * r / 900.0) * 0.18;
    a += glow * depth * (0.3 + 0.7 * shade(e / 720.0)) * mix(0.8, 1.15, power);
  }

  a = min(a, 1.0);
  return vec4f(vec3f(0.92, 0.95, 1.0) * a, a);
}
