// A glass lens that follows the pointer over a project thumbnail.
// At strength 0 it samples the image 1:1, so the canvas is indistinguishable from the <img>.
struct Params {
  resolution: vec2f,
  pointer: vec2f,
  strength: f32,
  radius: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var image: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.resolution.x / params.resolution.y;
  let fromCenter = uv - params.pointer;
  let local = fromCenter * vec2f(aspect, 1.0) / params.radius;
  let r = length(local);
  let s = params.strength * (1.0 - smoothstep(0.97, 1.0, r));

  // Magnify toward the center, easing back to 1:1 at the rim like a convex lens.
  let magnify = mix(1.0, 0.7 + 0.3 * r * r, s);
  let base = params.pointer + fromCenter * magnify;

  let fringe = fromCenter * 0.04 * smoothstep(0.5, 1.0, r) * s;
  let red = textureSampleLevel(image, samp, base + fringe, 0.0).r;
  let green = textureSampleLevel(image, samp, base, 0.0).g;
  let blue = textureSampleLevel(image, samp, base - fringe, 0.0).b;
  var color = vec3f(red, green, blue);

  let facing = max(dot(local / max(r, 1e-4), normalize(vec2f(-0.6, -0.8))), 0.0);
  let rim = smoothstep(0.84, 0.96, r) * (1.0 - smoothstep(0.96, 1.0, r));
  color += rim * (0.06 + 0.3 * facing) * s;

  let shadow = (1.0 - smoothstep(1.0, 1.35, r)) * step(1.0, r) * 0.3 * params.strength;
  color *= 1.0 - shadow;
  return vec4f(color, 1.0);
}
