// The near and bright star layers alone at scroll 0, for `bun run sky:stills --check`'s check of the
// CSS star map (spec §7.1). It's its own entry so editing the stars never invalidates the stills.
import { brightLayer, nearLayer, starLayer } from "./stars.wgsl";

struct Params {
  resolution: vec2f,
  dpr: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
// starLayer's band lookup. The near layer has no band boost, so it's never read.
@group(0) @binding(1) var milky: texture_2d<f32>;
@group(0) @binding(2) var milkySampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let css = uv * params.resolution / params.dpr;
  let near = starLayer(css, vec2f(0.0), nearLayer(), 0.0, params.dpr, 0.0, vec2f(0.0), milky, milkySampler, vec4f(0.0, 0.0, 1.0, 1.0));
  return vec4f(near + brightLayer(css, vec2f(0.0), 0.0, params.dpr, 0.0), 1.0);
}
