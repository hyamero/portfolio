// The body alone, for the CSS sky's stills (spec §7.1): an empty sky behind it, no stars, trail or
// grain, into a float target. rgb: the live sky's linear light there; a: how much of the pixel the
// moon or the ground covers, where the CSS puts its own disc or ground.
import { Body, bodyLight } from "./body.wgsl";
import { sunGlare, sunPulse } from "./lens.wgsl";
import { BG } from "./light.wgsl";

struct Params {
  resolution: vec2f,
  dpr: f32,
  // The layout width the frame models; the still may be rendered at a higher dpr.
  W: f32,
  time: f32,
  beads: f32,
  // C.x, C.y, R, vis
  body: vec4f,
  // B.x, B.y, morph, the diamond's strength
  sun: vec4f,
  // sunFrame: core, glare, horizontal and vertical streak decay
  glare: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.resolution / params.dpr;
  let B = params.sun.xy;
  let m = params.sun.z;
  let b = Body(params.body.xy, params.body.z, params.body.w, B, m, params.beads, params.W, params.dpr, params.time,
               0.0, vec2f(-1e5), 0.0, -1.0, 1.0, 1.0);
  let bl = bodyLight(p, b, 0.0, 0.0);
  var col = mix(BG + bl.front, bl.night, bl.inside) + bl.limb;
  let k = params.sun.w * sunPulse(params.time, m) * params.body.w;
  if (k > 0.001) {
    col += sunGlare(p - B, m, bl.d, params.glare) * k;
  }
  return vec4f(col, bl.inside);
}
