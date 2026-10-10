// The page's one sky, in page space and linear light (sky polish spec §3): the star field and the
// Milky Way, the body the camera flies from board 09's eclipse to board 02's horizon, the sun, and
// the trail. Lengths are CSS px; y grows down the page.
import { Body, bodyLight } from "./wgsl/body.wgsl";
import { sunGlare, sunPulse } from "./wgsl/lens.wgsl";
import { encode, grain, LUMA, shoulder, textMask } from "./wgsl/light.wgsl";
import { skyField, StarFrame } from "./wgsl/stars.wgsl";
import { gather, nebula, ribbon, shed, Trail } from "./wgsl/trail.wgsl";

struct Params {
  resolution: vec2f,
  // The light, in page space: the pointer while hovering, else resting above the hero.
  light: vec2f,
  // The pointer in 0..1 of the viewport, for the star parallax.
  pointer: vec2f,
  // Canvas pixels per CSS pixel.
  dpr: f32,
  scroll: f32,
  hover: f32,
  time: f32,
  // 1 for the front pass, which draws only the ground over the content, else 0.
  layer: f32,
  // The front canvas's top in the viewport, CSS px; 0 for the back canvas.
  origin: f32,
  viewHeight: f32,
  // The body: centre x, y (page), radius, visibility.
  body: vec4f,
  // The bead, which becomes the sun: x, y (page), morph (0 eclipse .. 1 horizon), the diamond's strength.
  sun: vec4f,
  // sunFrame: core radius, glare radius, horizontal and vertical streak decay (px).
  glare: vec4f,
  // How far the horizon has settled toward its rest line, 0..1.
  settle: f32,
  // Where the trail's ribbon runs, page y: the tops of Work and Contact.
  span: vec2f,
  // The trail (shed, carry, gather) and, in w, the stars' virtual scroll.
  trail: vec4f,
  // The stars' scroll speed, px/s.
  velocity: f32,
  // How far Baily's beads are open.
  beads: f32,
  // A hovered or focused Contact link's lift on the sun, 0..1.
  lift: f32,
  // The signal's pulse: age (s, < 0 for none), and travel (0 under reduced motion, which also stops
  // the cursor's light).
  pulse: vec2f,
  // Page rects of the hero statement, Work's list and Contact's block (w 0 for none), and their strengths.
  textA: vec4f,
  textB: vec4f,
  textC: vec4f,
  textK: vec4f,
  // The band-space rect the Milky Way cache covers: origin, size.
  band: vec4f,
  // The Milky Way's drift down band space, held inside its cache.
  bandDrift: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var milky: texture_2d<f32>;
@group(0) @binding(2) var milkySampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let frag = uv * params.resolution;
  let css = frag / params.dpr + vec2f(0.0, params.origin);
  // The same screen pixel in both passes, so the grain matches across the rim.
  let screen = frag + vec2f(0.0, params.origin * params.dpr);
  let page = css + vec2f(0.0, params.scroll);
  let W = params.resolution.x / params.dpr;
  let t = params.time;
  let vis = params.body.w;
  let B = params.sun.xy;
  let m = params.sun.z;
  let motion = params.pulse.y;

  // The front pass keeps only the ground and the rim; above them it's clear.
  let front = params.layer > 0.5;
  if (front && (vis <= 0.001 || length(page - params.body.xy) - max(params.body.z, 1.0) > 3.0)) {
    return vec4f(0.0);
  }

  let quiet = max(max(textMask(page, params.textA) * params.textK.x, textMask(page, params.textB) * params.textK.y),
                  textMask(page, params.textC) * params.textK.z);
  // The cursor's light (spec §5.5), dimmed behind text.
  let lp = page - params.light;
  let pl = params.hover * motion * exp(-dot(lp, lp) / 80000.0) * (1.0 - 0.92 * quiet);

  let gathered = params.trail.z;
  let b = Body(params.body.xy, params.body.z, vis, B, m, params.beads, W, params.dpr, t, params.hover, params.light,
               params.settle, params.pulse.x, params.pulse.y, 1.0 + 0.25 * gathered * smoothstep(0.6, 1.0, gathered));
  let bl = bodyLight(page, b, pl, quiet);
  // Where the corona or the air is bright, the stars wash out.
  let ext = 1.0 - 0.9 * smoothstep(0.003, 0.06, dot(bl.front, LUMA));
  let sf = StarFrame(params.trail.w, params.velocity, params.dpr, t, (params.pointer - 0.5) * 8.0 * params.hover, pl, ext,
                     quiet, params.band, params.bandDrift);
  let tr = Trail(W, params.scroll, t, params.trail.x, params.trail.y, gathered, params.span.x, params.span.y,
                 params.viewHeight, B, vis, params.settle);

  var col = skyField(css, sf, milky, milkySampler) + nebula(page, css, tr) + ribbon(page, css, tr, quiet) + bl.front;
  // The moon and the ground are opaque.
  col = mix(col, bl.night, bl.inside);
  col += bl.limb + shed(page, bl.d, tr) + gather(page, bl.d, tr);

  // The sun brightens for a hovered link and flashes as a signal leaves.
  var k = params.sun.w * sunPulse(t, m) * (1.0 + 0.6 * params.lift) * vis;
  if (params.pulse.x >= 0.0) {
    k *= 1.0 + 1.2 * exp(-5.0 * params.pulse.x);
  }
  if (k > 0.001 && length(page - B) < max(700.0, 4.0 * params.glare.z)) {
    col += sunGlare(page - B, m, bl.d, params.glare) * k;
  }

  let encoded = encode(shoulder(max(col, vec3f(0.0))));
  let rgb = max(encoded + grain(screen, dot(encoded, LUMA), t), vec3f(0.0));
  if (front) {
    // Opaque up to 1.5 px above the rim, so the rim line sits over the content; clear by 3 px.
    let a = 1.0 - smoothstep(1.5, 3.0, bl.d);
    return vec4f(rgb * a, a);
  }
  return vec4f(rgb, 1.0);
}
