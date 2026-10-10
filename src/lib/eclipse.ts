import { clamp, ease, type Rect } from "./sky-math";

/** A point in viewport CSS pixels, y down. */
export type Vec = readonly [number, number];

/** The hero's camera, each channel 0..1, scrubbed by the timeline in motion.tsx (spec §4.1). */
export type Camera = { zoom: number; pan: number; level: number; morph: number };

/** The body: its centre, its radius and the bead on its edge (the sun, once it has leveled). */
export type Body = { C: Vec; R: number; B: Vec };

/** Board 02's horizon at the hold, with the sun's angle on it. */
export type End = Body & { phi: number };

/** Where the bead sits on board 09's eclipse: 135°, its upper left. */
export const PHI0 = (3 * Math.PI) / 4;
/** The horizon's rest line, as a share of the viewport's height (spec §5.2). */
export const REST = 0.86;
const HOLD = 0.64;
const SUN_X = 0.38;
/** The horizon's radius per px of viewport width: 02's 12,000 px circle at 1440 px wide. */
export const RADIUS_PER_WIDTH = 25 / 6;

/** The on-screen unit vector for an angle measured anticlockwise from +x with y up. */
const unit = (phi: number): Vec => [Math.cos(phi), -Math.sin(phi)];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const geo = (a: number, b: number, t: number) => a * (b / a) ** t;

/** Board 09's eclipse, from the eclipse box's page rect, placed as it is when the hero's top meets the viewport's. */
export function startFrame(box: Rect, heroTop: number): Body {
  const R = box.width / 2;
  const C: Vec = [box.left + R, box.top - heroTop + box.height / 2];
  const [ux, uy] = unit(PHI0);
  return { C, R, B: [C[0] + R * ux, C[1] + R * uy] };
}

/** Board 02's horizon: its apex at 64% of the viewport, the sun on it at 38% across. */
export function endFrame(W: number, H: number): End {
  const R = RADIUS_PER_WIDTH * W;
  const C: Vec = [W / 2, HOLD * H + R];
  const dx = (SUN_X - 0.5) * W;
  const B: Vec = [C[0] + dx, C[1] - Math.sqrt(R * R - dx * dx)];
  return { C, R, B, phi: Math.atan2(C[1] - B[1], B[0] - C[0]) };
}

/**
 * The camera's view of the body (spec §5.2): the radius grows on a log scale, the bead travels to
 * the sun's place and slides round the edge to its angle, and the centre follows from the bead.
 */
export function bodyFrame(cam: Camera, start: Body, end: End): Body {
  // A page without an eclipse box has R 0, which the log scale can't start from.
  const r0 = Math.max(start.R, 1);
  const R = r0 * (end.R / r0) ** cam.zoom;
  const phi = PHI0 + (end.phi - PHI0) * cam.level;
  const B: Vec = [mix(start.B[0], end.B[0], cam.pan), mix(start.B[1], end.B[1], cam.pan)];
  const [ux, uy] = unit(phi);
  return { C: [B[0] - R * ux, B[1] - R * uy], R, B };
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
 * Reduced motion has no camera: the eclipse stays in the hero, in page space, until the viewport's
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
  const dx = (SUN_X - 0.5) * W;
  return { body: { C: [cx, apex + R], R, B: [cx + dx, apex + R - Math.sqrt(R * R - dx * dx)] }, morph: 1 };
}

/**
 * The sun's glare in px, a camera effect that doesn't scale with the zoom: 09's diamond at m 0, 02's
 * sun at m 1 (sky polish spec §4.4). The streaks' sizes are exponential decay lengths.
 */
export function sunFrame(m: number, W: number) {
  return { core: geo(2, 1.75, m), glare: geo(120, 60, m), streakH: geo(85, (140 * W) / 1440, m), streakV: geo(60, 24, m) };
}

/** How far Baily's beads are open over the intro: shut until 0.45, closed into the diamond by 0.8 (sky polish spec §6). */
export function beadOpen(intro: number) {
  return mix(-2, 0.12, ease(0.45, 0.8, intro));
}

/** The bead's brightness over the intro: dark until halfway, a 1.5× flash at 0.8, then 1 (spec §5.3). */
export function beadFlash(intro: number) {
  return ease(0.5, 0.8, intro) + 0.5 * Math.exp(-(((intro - 0.8) / 0.08) ** 2));
}

/** Where each camera channel runs on the hero's timeline (0..1), and its ease (spec §4.1). */
export const CAMERA_KEYS = {
  zoom: { start: 0, end: 0.85, ease: "power1.inOut" },
  pan: { start: 0.12, end: 0.85, ease: "sine.inOut" },
  level: { start: 0.12, end: 0.85, ease: "sine.inOut" },
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
