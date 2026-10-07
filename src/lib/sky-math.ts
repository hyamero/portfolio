/** A rect in page space: CSS pixels from the document's top-left. */
export type Rect = { left: number; top: number; width: number; height: number };

export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));

/** Smoothstep from `a` to `b`. */
export function ease(a: number, b: number, x: number) {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
}

// A pixel budget, not a fixed ratio: the sky covers the whole viewport on every frame.
const PIXEL_BUDGET = 2.2e6;
const MAX_DPR = 1.25;
const INTRO_MS = 2400;

export function skyDpr(deviceDpr: number, width: number, height: number) {
  return Math.min(
    deviceDpr || 1,
    MAX_DPR,
    Math.sqrt(PIXEL_BUDGET / Math.max(width * height, 1)),
  );
}

/** How far the page has scrolled through the hero, 0..1. */
export function departure(scrollY: number, hero: Rect) {
  return clamp((scrollY - hero.top) / Math.max(hero.height, 1));
}

/** How far Contact has come up into the viewport, 0..1. */
export function rise(scrollY: number, viewportHeight: number, contact: Rect) {
  return clamp(
    (viewportHeight - (contact.top - scrollY)) / Math.max(contact.height, 1),
  );
}

/** The orb's page-in, eased out (cubic) over 2.4 s. */
export function introProgress(elapsedMs: number) {
  return 1 - (1 - clamp(elapsedMs / INTRO_MS)) ** 3;
}

/**
 * The hero orb: `apex` is the top of its limb. It rises into place with the intro, then sinks
 * twice as fast as the page scrolls, so the departing copy never sits on the bright limb.
 */
export function orbFrame(hero: Rect, intro: number, dep: number) {
  const { width: W, height: H } = hero;
  return {
    cx: hero.left + W / 2,
    apex: hero.top + H * (0.68 + 0.1 * (1 - intro)) + dep * H * 2,
    radius: Math.max(0.62 * W, 0.95 * H) * (0.97 + 0.03 * intro),
    vis: H > 0 ? intro * (1 - ease(0.2, 0.8, dep)) : 0,
  };
}

/** The closing horizon behind Contact: a wide arc whose top climbs with `rise`. */
export function horizonFrame(contact: Rect, rise: number) {
  return {
    cx: contact.left + contact.width / 2,
    top: contact.top + contact.height - (0.02 + 0.13 * rise) * contact.height,
    radius: Math.max(contact.width * 2.2, 2600),
    halfWidth: contact.width * 0.37,
  };
}

/** Where the light rests without a pointer: above the hero, a little left of center. */
export function restingLight(hero: Rect) {
  return {
    x: hero.left + hero.width * 0.42,
    y: hero.top - hero.height * 0.25,
  };
}

/** Frame-rate independent exponential approach. */
export function approach(current: number, target: number, dt: number, rate = 3) {
  return current + (target - current) * (1 - Math.exp(-dt * rate));
}
