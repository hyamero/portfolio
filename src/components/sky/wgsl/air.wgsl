// The resting horizon: main's closing horizon, a lit rim over a dark ground with a short atmosphere
// above and a glow just inside, brightest round a lobe that leans toward the pointer. Its colours were
// tuned in display space over the page, so they're mixed there and converted to linear light.
import { decode, overBg } from "./light.wgsl";
import { vnoise } from "./noise.wgsl";

// The ground's base colour, the page's at 80%; src/lib/light.ts mirrors it for the CSS sky's ground.
export const GROUND = vec3f(0.00149, 0.00167, 0.00241);
const GROUND_DISPLAY = vec3f(0.0192, 0.0216, 0.0312);

export struct HorizonLight {
  // Added over the sky above the limb, and the ground's own colour below it.
  air: vec3f,
  ground: vec3f,
}

// p: page px; d: its height above the limb, in px at 1440 wide. cx: the arc's centre x; lobe: where its
// light centres; s: the arc length from the sun, + right; arrive: the rim's brightening as the trail
// gathers and a link lifts it; age, travel: the signal's pulse (age < 0 for none); quiet: the text mask,
// which dims the broad glow behind text but leaves the rim and the signal on it.
export fn horizonLight(p: vec2f, d: f32, cx: f32, lobe: f32, W: f32, t: f32, s: f32, arrive: f32, age: f32, travel: f32, quiet: f32) -> HorizonLight {
  let hw = 0.37 * W;
  let a = (p.x - lobe) / (hw * 0.95);
  let b = (p.x - cx) / (hw * 1.3);
  let facing = (0.3 + 0.7 * exp(-a * a)) * exp(-b * b);
  let flow = vnoise(vec2f(p.x * 0.0045 - t * 0.08, d * 0.02), 89u);
  let rim = vec3f(0.78, 0.87, 1.0) * exp(-abs(d) / 6.4) * 0.95 * arrive;
  var air = rim + vec3f(0.3, 0.42, 0.62) * exp(-max(d, 0.0) / 64.0) * (0.75 + 0.5 * flow) * 0.55 * (1.0 - 0.7 * quiet);
  var ground = rim + vec3f(0.3, 0.42, 0.62) * exp(min(d, 0.0) / 41.0) * 0.32;
  if (age >= 0.0) {
    // The signal (sky polish spec §5.6): a front running out both ways from the sun along the rim.
    // Without travel the whole rim lights at once.
    let e = (abs(s) - 0.55 * W * age) / (26.0 + 50.0 * age);
    let front = mix(1.0, exp(-e * e), travel) * exp(-1.4 * age) * (1.0 - smoothstep(2.5, 3.5, age));
    let flash = vec3f(0.8, 0.92, 1.0) * front * exp(-abs(d) / 6.4);
    air += flash * (1.0 + 0.4 * exp(-max(d, 0.0) / 30.0));
    ground += flash;
  }
  return HorizonLight(overBg(air * facing), decode(min(GROUND_DISPLAY + ground * facing, vec3f(1.0))));
}
