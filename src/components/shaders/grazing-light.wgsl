// Tools grid overlay: the pointer as a light held just above the cards. Their 1px borders catch it
// like a bevel, and their faces take a faint wash. Premultiplied, so anything unlit shows through.
struct Params {
  resolution: vec2f,
  // Canvas pixels per CSS pixel. Lengths below are CSS pixels from the canvas's top-left.
  scale: f32,
  radius: f32,
  light: vec2f,
  // Fades the light in and out as the pointer arrives and leaves (0-1).
  strength: f32,
  // Falloff distance of the light across the grid.
  reach: f32,
  // Per card: x, y, width, height. Unused slots have no size.
  cards: array<vec4f, 4>,
}

@group(0) @binding(0) var<uniform> params: Params;

// How high the light floats above the cards, which sets how evenly nearby borders catch it.
const HEIGHT = 90.0;

// Box-filtered coverage of a stroke `width` wide at signed offset `e`, for pixels `pix` wide.
fn stroke(e: f32, width: f32, pix: f32) -> f32 {
  let lo = max(e - 0.5 * pix, -0.5 * width);
  let hi = min(e + 0.5 * pix, 0.5 * width);
  return max(hi - lo, 0.0) / pix;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.resolution / params.scale;
  let pix = 1.0 / params.scale;

  // The nearest card's rounded rect: signed distance (negative inside) and outward normal.
  var d = 1e5;
  var normal = vec2f(0.0);
  for (var i = 0; i < 4; i++) {
    let card = params.cards[i];
    if (card.z <= 0.0) {
      continue;
    }
    let half = card.zw * 0.5;
    let rel = p - (card.xy + half);
    let q = abs(rel) - (half - params.radius);
    let dist = length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - params.radius;
    if (dist < d) {
      d = dist;
      let corner = max(q, vec2f(0.0));
      let side = select(vec2f(0.0, 1.0), vec2f(1.0, 0.0), q.x > q.y);
      normal = sign(rel) * select(side, normalize(corner), corner.x > 0.0 && corner.y > 0.0);
    }
  }
  if (d > 2.0) {
    return vec4f(0.0);
  }

  let toLight = vec3f(params.light - p, HEIGHT);
  let dist = length(toLight.xy);
  let falloff = pow(1.0 + dist * dist / (params.reach * params.reach), -1.5);

  // The border reads as a bevel tilted outward, so edges facing the light catch more of it.
  let bevel = normalize(vec3f(normal * 0.6, 0.8));
  let facing = max(dot(bevel, normalize(toLight)), 0.0);
  let border = stroke(d + 0.5, 1.0, pix) * facing * 0.34;
  let face = (1.0 - smoothstep(-1.0, 0.0, d)) * 0.03;

  let a = (border + face) * falloff * params.strength;
  return vec4f(vec3f(0.9, 0.94, 1.0) * a, a);
}
