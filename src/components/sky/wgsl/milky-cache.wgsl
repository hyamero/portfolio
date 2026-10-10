// Renders the Milky Way into its cache (spec §3.5): one texel per uv over the band-space rect `map`.
import { milky } from "./stars.wgsl";

struct Params {
  // The viewport, CSS px: the band's frame scales with it.
  size: vec2f,
  // The band-space rect this cache covers: origin, size (CSS px).
  map: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  return milky(params.map.xy + uv * params.map.zw, params.size.x, params.size.y);
}
