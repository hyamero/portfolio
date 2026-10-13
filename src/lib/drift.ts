import { clamp } from "./sky-math";

/*
 * The 404's lost orb (lost-orb.tsx): where it drifts, how it shies away from a cursor, and its flight
 * home into the wordmark. Viewport px throughout.
 */

export type Point = { x: number; y: number };
export type Box = { left: number; top: number; right: number; bottom: number };
export type Region = { x0: number; x1: number; y0: number; y1: number };
export type Path = readonly [Point, Point, Point, Point];

/** From this width the copy sits at left and the orb drifts right of it, as at md in the CSS. */
export const WIDE = 768;
/** How far past its rim a cursor may come before the orb shies away. */
export const SHY = 70;
/** How much of its sway the orb keeps once it has given up dodging. */
export const TIRED = 0.45;

/** How far the orb sways either way of its anchor at this viewport size. */
export const reach = (width: number, height: number): Point => ({
  x: Math.min(70, width * 0.06),
  y: Math.min(44, height * 0.05),
});

/**
 * Where the orb's anchor may go, so the orb (`radius`) and its sway stay in open sky, clear of the
 * `copy` and of the header above `top`: right of the copy on wide screens, between the header and
 * the copy on phones, and in the middle band of the sky. A screen too small for that gets the middle
 * of what room there is.
 */
export function driftRegion(width: number, height: number, radius: number, copy: Box, top: number): Region {
  const r = reach(width, height);
  const air = 24;
  const x = r.x + radius;
  const y = r.y + radius;
  const region =
    width >= WIDE
      ? { x0: copy.right + air + x, x1: width - air - x, y0: Math.max(top + air + y, 0.22 * height), y1: Math.min(height - air - y, 0.75 * height) }
      : { x0: air + x, x1: width - air - x, y0: top + air + y, y1: copy.top - air - y };
  if (region.x0 > region.x1) region.x0 = region.x1 = (region.x0 + region.x1) / 2;
  if (region.y0 > region.y1) region.y0 = region.y1 = (region.y0 + region.y1) / 2;
  return region;
}

/**
 * The orb's weightless sway around its anchor at `t` s: two sines out of step, so the path rarely
 * repeats. `amount` scales it, down to TIRED once the orb has given up dodging.
 */
export function sway(t: number, width: number, height: number, amount = 1): Point {
  const r = reach(width, height);
  return {
    x: r.x * amount * Math.sin((2 * Math.PI * t) / 14 + 0.6),
    y: r.y * amount * Math.sin((2 * Math.PI * t) / 9.5),
  };
}

/**
 * Where the anchor hops when a cursor closes in on the orb (centre `orb`, `radius`): `hop` px straight
 * away from it, kept inside `region`. Pinned against an edge, it slips sideways to whichever side has
 * more room. Null while the cursor keeps its distance.
 */
export function dodge(anchor: Point, orb: Point, pointer: Point, radius: number, region: Region, hop: number): Point | null {
  const dx = orb.x - pointer.x;
  const dy = orb.y - pointer.y;
  const dist = Math.hypot(dx, dy);
  if (dist > radius + SHY) return null;
  const ux = dist ? dx / dist : 1;
  const uy = dist ? dy / dist : 0;
  const to = (x: number, y: number) => ({ x: clamp(x, region.x0, region.x1), y: clamp(y, region.y0, region.y1) });
  const moved = (p: Point) => Math.hypot(p.x - anchor.x, p.y - anchor.y);
  const away = to(anchor.x + ux * hop, anchor.y + uy * hop);
  if (moved(away) >= hop / 2) return away;
  const left = to(anchor.x - uy * hop, anchor.y + ux * hop);
  const right = to(anchor.x + uy * hop, anchor.y - ux * hop);
  return moved(left) >= moved(right) ? left : right;
}

/** The way home: up off the drift first, then gliding in to the orb's place in the wordmark. */
export function homePath(from: Point, to: Point): Path {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  return [
    from,
    { x: from.x - 0.06 * dist, y: Math.max(60, from.y - 0.4 * dist) },
    { x: to.x + 0.42 * dist, y: to.y + 0.1 * dist },
    to,
  ];
}

/** The point `t` (0–1) of the way along a cubic Bézier `path`. */
export function pathPoint([a, b, c, d]: Path, t: number): Point {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return { x: w0 * a.x + w1 * b.x + w2 * c.x + w3 * d.x, y: w0 * a.y + w1 * b.y + w2 * c.y + w3 * d.y };
}

/** The flight's length in ms: longer the farther it flies, within reason. */
export const flightMs = (dist: number) => clamp(dist * 1.05, 750, 1200);
