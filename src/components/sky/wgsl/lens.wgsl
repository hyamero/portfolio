// The sun (spec §4.4, Appendix A.5), in linear light.

// The sun's glare, one glare from 09's diamond (m 0) to 02's sun on the horizon (m 1). g: px from the
// sun; d: the pixel's height above the limb; size: sunFrame's core radius, glare radius, and
// horizontal and vertical streak decay lengths (px).
export fn sunGlare(g: vec2f, m: f32, d: f32, size: vec4f) -> vec3f {
  let r = length(g);
  let ks = size.y / 120.0;
  // On the horizon the limb hides the core's lower half.
  let core = (1.0 - smoothstep(0.8 * size.x, 1.6 * size.x, r)) * mix(1.0, smoothstep(-2.0, 1.0, d), m);
  let bloom = exp(-r * r / (50.0 * ks * ks)) + 0.3 * exp(-r * r / (512.0 * ks * ks));
  let k = r / (24.0 * ks);
  let veil = 0.07 / pow(1.0 + k * k, 1.25);
  // A straight streak across the curved ground reads as a cut in it, so the ground keeps 15% of it.
  let over = 1.0 - 0.85 * m * (1.0 - smoothstep(-1.0, 1.5, d));
  let lx = g.x / (3.0 * size.z);
  let hx = exp(-abs(g.x) / size.z - lx * lx) * exp(-g.y * g.y / 0.6) * over;
  let vy = exp(-abs(g.y) / size.w) * exp(-g.x * g.x / 0.6) * over;
  // A faint dispersion ring, red outside and blue inside, that the diamond has and the sun doesn't.
  let rr = vec3f(r - 47.5 * ks, r - 46.0 * ks, r - 44.5 * ks);
  let ring = exp(-(rr * rr) / 7.0) * 0.018 * (1.0 - m);
  return vec3f(6.0 * core + 2.2 * bloom) + vec3f(0.8, 0.88, 1.0) * veil + vec3f(0.88, 0.93, 1.0) * (0.9 * hx + 0.65 * vy) + ring;
}

// The sun's slow pulse: 09's diamond breathing over 5.2 s, crossfading into 02's 6 s glint.
export fn sunPulse(t: f32, m: f32) -> f32 {
  return mix(0.91 - 0.09 * cos(t * 6.2831853 / 5.2), 0.89 - 0.11 * cos(t * 6.2831853 / 6.0), m);
}
