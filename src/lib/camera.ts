import { clamp, ease, type Rect } from "./sky-math";

/** A point in viewport CSS pixels, y down. */
export type Vec = readonly [number, number];

/** The hero's camera, each channel 0..1, scrubbed by the timeline in motion.tsx (spec §4.1). */
export type Camera = { zoom: number; pan: number; morph: number };

/** The body: its centre, its radius and the sun at the top of its edge, unseen but where the rim is brightest. */
export type Body = { C: Vec; R: number; B: Vec };

/** The horizon's rest line, as a share of the viewport's height (spec §5.2). */
export const REST = 0.86;
const HOLD = 0.64;
/** The horizon's radius per px of viewport width: main's closing horizon, 2.2 × the width. */
export const RADIUS_PER_WIDTH = 2.2;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const withSun = (C: Vec, R: number): Body => ({ C, R, B: [C[0], C[1] - R] });

/** The hero's planet, from its box's page rect, placed as it is when the hero's top meets the viewport's. */
export function startFrame(box: Rect, heroTop: number): Body {
  const R = box.width / 2;
  return withSun([box.left + R, box.top - heroTop + box.height / 2], R);
}

/** The resting horizon: its apex at 64% of the viewport. */
export function endFrame(W: number, H: number): Body {
  const R = RADIUS_PER_WIDTH * W;
  return withSun([W / 2, HOLD * H + R], R);
}

/**
 * The camera's view of the body (spec §5.2): the radius grows on a log scale, the apex travels to
 * the horizon's, and the centre hangs R under it.
 */
export function bodyFrame(cam: Camera, start: Body, end: Body): Body {
  // A page without a planet box has R 0, which the log scale can't start from.
  const r0 = Math.max(start.R, 1);
  const R = r0 * (end.R / r0) ** cam.zoom;
  const B: Vec = [mix(start.B[0], end.B[0], cam.pan), mix(start.B[1], end.B[1], cam.pan)];
  return { C: [B[0], B[1] + R], R, B };
}

/**
 * Past the runway's end the horizon eases from the hold line down to REST over one screen of
 * scroll, starting at 0.44× the scroll's speed, then stays (spec §5.2). `s` runs 0..1 over that screen.
 */
export function settleFrame(body: Body, scroll: number, end: number, H: number): { body: Body; s: number } {
  const s = clamp((scroll - end) / Math.max(H, 1));
  const shift = (REST - HOLD) * H * (1 - (1 - s) ** 2);
  return { body: { C: [body.C[0], body.C[1] + shift], R: body.R, B: [body.B[0], body.B[1] + shift] }, s };
}

/**
 * Reduced motion has no camera: the planet stays in the hero, in page space, until the viewport's
 * middle passes Work's; then the horizon rests where Contact's horizon ends (spec §5.2).
 */
export function stillFrame(
  start: Body,
  rects: { hero: Rect; work: Rect; contact: Rect },
  W: number,
  H: number,
  scroll: number,
): { body: Body; morph: number } {
  const { hero, work, contact } = rects;
  if (scroll + H / 2 < work.top + work.height / 2) {
    const dy = hero.top - scroll;
    return { body: { C: [start.C[0], start.C[1] + dy], R: start.R, B: [start.B[0], start.B[1] + dy] }, morph: 0 };
  }
  const R = RADIUS_PER_WIDTH * W;
  const apex = contact.top + contact.height * 0.85 - scroll;
  const cx = contact.left + contact.width / 2;
  return { body: withSun([cx, apex + R], R), morph: 1 };
}

/** The body's opacity over the intro: it fades in from nothing, rather than pop in, before it's fully lit. */
export function planetAppear(intro: number) {
  return ease(0, 0.85, intro);
}

/** How far the intro has lit the planet: from 15% of it to its end. The shader lights the rim first, then the air. */
export function planetDawn(intro: number) {
  return ease(0.15, 1, intro);
}

/** Where each camera channel runs on the hero's timeline (0..1), and its ease (spec §4.1). */
export const CAMERA_KEYS = {
  zoom: { start: 0, end: 0.85, ease: "power1.inOut" },
  pan: { start: 0.12, end: 0.85, ease: "sine.inOut" },
  morph: { start: 0.25, end: 0.85, ease: "power1.inOut" },
} as const satisfies Record<keyof Camera, { start: number; end: number; ease: string }>;

/** The copy's exit on the same timeline: gone by 30% of it, 90 px higher (spec §4.1). */
export const COPY_OUT = { end: 0.3, lift: 90 } as const;

type Timeline = { to(target: object, vars: Record<string, unknown>, position?: number): unknown };

/** Adds the camera's tweens to a timeline whose length is 1, so positions read as its progress. */
export function addCameraTweens(tl: Timeline, cam: Camera) {
  for (const [channel, key] of Object.entries(CAMERA_KEYS)) {
    tl.to(cam, { [channel]: 1, ease: key.ease, duration: key.end - key.start }, key.start);
  }
  // Pads the timeline to 1, so the hold runs from 0.85 to the end.
  tl.to({}, { duration: 1 }, 0);
}
