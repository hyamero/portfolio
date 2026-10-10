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
const INTRO_MS = 3600;

export function skyDpr(deviceDpr: number, width: number, height: number) {
  return Math.min(
    deviceDpr || 1,
    MAX_DPR,
    Math.sqrt(PIXEL_BUDGET / Math.max(width * height, 1)),
  );
}

/** How far Contact has come up into the viewport, 0..1. */
export function rise(scrollY: number, viewportHeight: number, contact: Rect) {
  return clamp(
    (viewportHeight - (contact.top - scrollY)) / Math.max(contact.height, 1),
  );
}

/**
 * When the orb's intro starts. It waits for a visible tab, so it plays alongside the copy's page-in
 * instead of finishing unseen, and re-arms when the hero goes away (e.g. after the 404 page).
 */
export function armIntro(start: number | null, now: number, hasHero: boolean, visible: boolean) {
  if (!hasHero) return null;
  return start ?? (visible ? now : null);
}

/** The orb's page-in, eased out (cubic) over 3.6 s. */
export function introProgress(elapsedMs: number) {
  return 1 - (1 - clamp(elapsedMs / INTRO_MS)) ** 3;
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

/**
 * The horizon's trail (motion spec §4.1, eclipse spec §5.4): the planet's atmosphere sheds off the
 * rim from early in the camera's descent (`fall`, its zoom), just ahead of the planet losing its
 * colour, carries on as a ribbon of nebula through Work as the horizon settles (`dep` is how far it
 * has), and gathers back into it as Contact rises.
 */
export function trailFrame(fall: number, dep: number, up: number, reduced: boolean, hasWork: boolean) {
  if (reduced) return { shed: 0, carry: hasWork ? 1 : 0, gather: up };
  return {
    shed: ease(0.05, 0.9, fall),
    carry: hasWork ? ease(0, 0.35, dep) * (1 - 0.4 * up) : 0,
    gather: up,
  };
}

/** The stars' coast, in px/s of virtual scroll (spec §4.2). */
export const COAST = { gain: 0.5, max: 800, rise: 6, decay: 2, rest: 4 } as const;

/**
 * One step of the coast velocity. It picks up the scroll quickly and lets go slowly: Lenis already
 * eases the scroll to a stop, so a single fast rate would let go with it and leave no glide.
 */
export function coastStep(v: number, velocity: number, dt: number) {
  const target = clamp(velocity * COAST.gain, -COAST.max, COAST.max);
  const lettingGo = Math.abs(target) < Math.abs(v) && target * v >= 0;
  const next = approach(v, target, dt, lettingGo ? COAST.decay : COAST.rise);
  return Math.abs(velocity) < COAST.rest && Math.abs(next) < COAST.rest ? 0 : next;
}
