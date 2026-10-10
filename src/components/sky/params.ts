import { planetAppear, planetDawn, type Body } from "@/lib/camera";
import { pulseAge } from "@/lib/signal";
import { clamp, type Rect } from "@/lib/sky-math";

/** The band-space rect the Milky Way cache covers (spec §3.5): origin and size, CSS px. */
export type BandMap = { origin: readonly [number, number]; size: readonly [number, number] };

/** Everything one frame of the sky is drawn from. Positions are viewport px unless noted. */
export type SkyInput = {
  /** The back canvas's size in device px. */
  resolution: readonly [number, number];
  /** The viewport, CSS px. */
  W: number;
  H: number;
  scroll: number;
  /** The stars' virtual scroll: scroll plus the coast's offset. */
  starScroll: number;
  /** flight.velocity and flight.coast.v, px/s. */
  velocity: number;
  coast: number;
  /** The eased light, page space. */
  light: { x: number; y: number; hover: number };
  pointer: { nx: number; ny: number };
  reduced: boolean;
  /** ms, the tick's clock. */
  now: number;
  /** s; it advances only while something ambient runs. */
  time: number;
  /** The body, or null on a page without a planet box. */
  body: Body | null;
  morph: number;
  /** Page y where the body ends, fading out over the 200 px above: the hero's foot while the
   * reduced-motion sky shows the planet in it; null for none. */
  foot: number | null;
  settle: number;
  intro: number;
  trail: { shed: number; carry: number; gather: number };
  /** Page y: the tops of Work and Contact. */
  span: readonly [number, number];
  /** The data-sky-text rects, page space. */
  text: { hero: Rect; work: Rect; contact: Rect };
  /** How much of the hero copy still shows, 1 → 0 across its exit. */
  copy: number;
  signal: { lift: number; at: number };
  band: BandMap;
  /** Whether the front canvas shows, and its top in the viewport. */
  frontOn: boolean;
  frontTop: number;
};

const NO_BODY: Body = { C: [0, -1e5], R: 1, B: [0, -1e5] };
// A foot no page reaches; WGSL has no infinity to pass.
const NO_FOOT = 1e9;
// The Milky Way drifts at 2.5% of the virtual scroll; the coast's offset can wander ~2000 px past the page's ends.
const DRIFT = 0.025;
const COAST_MARGIN = DRIFT * 2000;

/** The cache's extent: the viewport and the band's whole drift down the page, plus the pointer's parallax. */
export function bandExtent(W: number, H: number, maxScroll: number): BandMap {
  return {
    origin: [-8, -8 - COAST_MARGIN],
    size: [W + 16, H + DRIFT * Math.max(maxScroll, 0) + 16 + 2 * COAST_MARGIN],
  };
}

const rect = (r: Rect) => [r.left, r.top, r.width, r.height] as const;

/** The sky's uniforms for one frame (spec §3.3), and what the front canvas is drawn from. */
export function skyParams(s: SkyInput) {
  const body = s.body ?? NO_BODY;
  const vis = s.body ? planetAppear(s.intro) : 0;
  const age = pulseAge(s.now, s.signal.at);
  const dawn = planetDawn(s.intro);
  const params = {
    resolution: s.resolution,
    light: [s.light.x, s.light.y],
    pointer: [s.pointer.nx, s.pointer.ny],
    dpr: s.resolution[0] / s.W,
    scroll: s.scroll,
    hover: s.light.hover,
    time: s.time,
    layer: 0,
    origin: 0,
    viewHeight: s.H,
    body: [body.C[0], body.C[1] + s.scroll, body.R, vis],
    sun: [body.B[0], body.B[1] + s.scroll, s.morph],
    foot: s.foot ?? NO_FOOT,
    settle: s.settle,
    span: s.span,
    trail: [s.trail.shed, s.trail.carry, s.trail.gather, s.starScroll],
    velocity: s.reduced ? 0 : s.velocity + s.coast,
    dawn,
    lift: s.signal.lift,
    pulse: [age, s.reduced ? 0 : 1],
    textA: rect(s.text.hero),
    textB: rect(s.text.work),
    textC: rect(s.text.contact),
    textK: [s.copy, 1, 1, 0],
    band: [...s.band.origin, ...s.band.size],
    // The coast's offset grows with every scroll, so the band stops drifting at its cache's edge
    // rather than smear the edge across the sky. At 2.5% of the scroll the stop can't be seen.
    bandDrift: clamp(DRIFT * s.starScroll, s.band.origin[1] + 8, s.band.origin[1] + s.band.size[1] - s.H - 8),
  };
  // The front canvas holds still on screen, so it reads the body in viewport px and ignores the scroll.
  const lit = s.light.hover > 0;
  const frontKey = [
    s.frontOn ? 1 : 0, body.C[0], body.C[1], body.R, body.B[0], body.B[1], s.morph, vis, dawn, s.settle,
    s.light.hover, lit ? s.light.x : 0, lit ? s.light.y - s.scroll : 0, s.time, s.W, s.H, s.frontTop, s.signal.lift, age,
  ];
  return { params, frontKey };
}

export type SkyParams = ReturnType<typeof skyParams>["params"];

/** Every uniform but `time`, flat: a frame whose key matches the last one's draws nothing new (spec §3.6). */
export function diffKey(params: SkyParams) {
  const key: number[] = [];
  for (const [name, value] of Object.entries(params)) {
    if (name === "time") continue;
    if (typeof value === "number") key.push(value);
    else key.push(...value);
  }
  return key;
}

export function sameKey(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
