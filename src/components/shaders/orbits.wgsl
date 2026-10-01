// Contact card overlay: comet trails behind the orbiting social icons, the orbit of a hovered icon,
// and the ping it sends. Premultiplied, so the card shows through wherever nothing is lit.
struct Params {
  resolution: vec2f,
  // Canvas pixels per CSS pixel. Lengths below are CSS pixels from the card center, y down.
  scale: f32,
  // How fast the orbits currently run, from 0 (held still) to 1.
  pace: f32,
  // Per icon: orbit radius, angle (0 is below the center, growing clockwise like the orbit
  // keyframe), trail length in radians (negative for counter-clockwise orbits), icon radius.
  bodies: array<vec4f, 4>,
  // Per icon: trail tint, then how lit its orbit is while the icon is hovered (0-1).
  looks: array<vec4f, 4>,
  // Per ping: center, progress from 0 to 1 (outside that when unused), starting radius.
  pings: array<vec4f, 4>,
  pingTints: array<vec4f, 4>,
}

@group(0) @binding(0) var<uniform> params: Params;

const TAU = 6.2831853;
const PING_REACH = 110.0;

// Box-filtered coverage of a stroke `width` wide at signed offset `e`, for pixels `pix` wide.
fn stroke(e: f32, width: f32, pix: f32) -> f32 {
  let lo = max(e - 0.5 * pix, -0.5 * width);
  let hi = min(e + 0.5 * pix, 0.5 * width);
  return max(hi - lo, 0.0) / pix;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = (uv - 0.5) * params.resolution / params.scale;
  let pix = 1.0 / params.scale;
  let rho = length(p);
  let phi = atan2(-p.x, p.y);

  var color = vec3f(0.0);
  var alpha = 0.0;

  for (var i = 0; i < 4; i++) {
    let body = params.bodies[i];
    let dr = rho - body.x;
    if (body.x <= 0.0 || abs(dr) > 24.0) {
      continue;
    }
    let look = params.looks[i];
    let len = abs(body.z);
    // Radians from this pixel forward to the icon, along its direction of travel.
    let behind = fract((body.y - phi) * select(sign(body.z), 1.0, body.z == 0.0) / TAU) * TAU;

    // Starts at the icon's edge: its disc is translucent, and a line through it reads as a skewer.
    let edge = body.w / body.x;
    if (len > edge) {
      let t = clamp((behind - edge) / (len - edge), 0.0, 1.0);
      let fade = (1.0 - t) * (1.0 - t) * smoothstep(edge * 0.9, edge * 1.15, behind) * step(behind, len);
      // Thins as it fades, like a comet's tail.
      let core = stroke(dr, mix(1.4, 0.5, t), pix);
      let haze = exp(-dr * dr / 18.0);
      let a = (core * 0.45 + haze * 0.12) * fade * sqrt(params.pace);
      color += look.rgb * a;
      alpha += a;
    }

    if (look.a > 0.001) {
      // The hovered icon's whole orbit lights up, most of all around the icon itself.
      let around = min(behind, TAU - behind);
      let near = 0.4 + 0.6 * exp(-around * around * 1.5);
      let a = (stroke(dr, 1.0, pix) * 0.13 + exp(-dr * dr / 24.0) * 0.04) * near * look.a;
      color += look.rgb * a;
      alpha += a;
    }
  }

  for (var j = 0; j < 4; j++) {
    let ping = params.pings[j];
    let q = ping.z;
    if (q < 0.0 || q > 1.0) {
      continue;
    }
    let radius = ping.w + (1.0 - pow(1.0 - q, 3.0)) * PING_REACH;
    let d = length(p - ping.xy) - radius;
    if (abs(d) > 40.0) {
      continue;
    }
    let life = (1.0 - q) * (1.0 - q);
    let a = (stroke(d, mix(1.3, 0.5, q), pix) * 0.38 + exp(-d * d / mix(24.0, 220.0, q)) * 0.08) * life;
    color += params.pingTints[j].rgb * a;
    alpha += a;
  }

  alpha = min(alpha, 1.0);
  return vec4f(min(color, vec3f(alpha)), alpha);
}
