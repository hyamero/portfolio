// The page's one sky, in page space and linear light (sky polish spec §3): the star field and the
// Milky Way, the body the camera flies from the hero's planet down to the resting horizon, and
// the trail. Lengths are CSS px; y grows down the page.
import { Body, bodyLight } from "./wgsl/body.wgsl";
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
  // The sun, just behind the limb where the rim is brightest: x, y (page); and the morph (0 planet .. 1 horizon).
  sun: vec3f,
  // Page y where the body ends, fading out over the 200 px above.
  foot: f32,
  // How far the horizon has settled toward its rest line, 0..1.
  settle: f32,
  // Where the trail's ribbon runs, page y: the tops of Work and Contact.
  span: vec2f,
  // The trail (shed, carry, gather) and, in w, the stars' virtual scroll.
  trail: vec4f,
  // The stars' scroll speed, px/s.
  velocity: f32,
  // How far the intro has lit the planet.
  dawn: f32,
  // A hovered or focused Contact link's lift on the rim's light, 0..1.
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
  let vis = params.body.w * (1.0 - smoothstep(params.foot - 200.0, params.foot, page.y));
  let B = params.sun.xy;
  let m = params.sun.z;
  let motion = params.pulse.y;

  // The front pass keeps only the ground and the rim; above them it's clear.
  let front = params.layer > 0.5;
  if (front && (vis <= 0.001 || length(page - params.body.xy) - max(params.body.z, 1.0) > 3.0)) {
    return vec4f(0.0);
  }

  let quiet = max(max(textMask(page, params.textA, 80.0) * params.textK.x, textMask(page, params.textB, 80.0) * params.textK.y),
                  textMask(page, params.textC, 80.0) * params.textK.z);
  // The planet's halo spans the hero, so it eases off round the copy far more gently.
  let hush = textMask(page, params.textA, 320.0) * params.textK.x;
  // The cursor's light (spec §5.5), dimmed behind text.
  let lp = page - params.light;
  let pl = params.hover * motion * exp(-dot(lp, lp) / 80000.0) * (1.0 - 0.92 * quiet);

  let gathered = params.trail.z;
  let b = Body(params.body.xy, params.body.z, vis, B, m, params.dawn, W, params.dpr, t, params.hover, params.light,
               params.settle, params.pulse.x, params.pulse.y,
               (1.0 + 0.25 * gathered * smoothstep(0.6, 1.0, gathered)) * (1.0 + 0.6 * params.lift));
  let bl = bodyLight(page, b, hush, quiet);
  // Where the halo or the air is bright, the stars wash out.
  let ext = 1.0 - 0.9 * smoothstep(0.003, 0.06, dot(bl.front, LUMA));
  let sf = StarFrame(params.trail.w, params.velocity, params.dpr, t, (params.pointer - 0.5) * 8.0 * params.hover, pl, ext,
                     quiet, params.band, params.bandDrift);
  let tr = Trail(W, params.scroll, t, params.trail.x, params.trail.y, gathered, params.span.x, params.span.y,
                 params.viewHeight, B, vis, params.settle);

  var col = skyField(css, sf, milky, milkySampler) + nebula(page, css, tr, bl.d, params.body.z, m, quiet) + ribbon(page, css, tr, quiet) + bl.front;
  // The planet and the ground are opaque.
  col = mix(col, bl.night, bl.inside);
  col += shed(page, bl.d, tr) + gather(page, bl.d, tr);

  let encoded = encode(shoulder(max(col, vec3f(0.0))));
  let rgb = max(encoded + grain(screen, dot(encoded, LUMA), t), vec3f(0.0));
  if (front) {
    // Opaque up to 1.5 px above the rim, so the rim line sits over the content; clear by 3 px.
    let a = 1.0 - smoothstep(1.5, 3.0, bl.d);
    return vec4f(rgb * a, a);
  }
  return vec4f(rgb, 1.0);
}
