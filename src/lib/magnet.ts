import { ease } from "./sky-math";

export const MAGNET_RADIUS = 90;

/** A magnetic pull toward the pointer: proportional near the centre, capped, released at the edge. */
export function magnet(dx: number, dy: number, radius = MAGNET_RADIUS, max = 6) {
  const d = Math.hypot(dx, dy);
  if (d === 0 || d >= radius) return { x: 0, y: 0 };
  const length = Math.min(d * 0.3, max) * (1 - ease(0.6 * radius, radius, d));
  return { x: (dx / d) * length, y: (dy / d) * length };
}
