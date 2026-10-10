import { cellHash, pcg, u01 } from "./star-field";

/*
 * The shooting stars' schedule, ported from meteors() in src/components/sky/wgsl/stars.wgsl: keep the
 * two in step. The sky draws frames at rest only while one is in flight.
 */

const SLOT = 5;
// One more frame after a meteor burns out, so the last one drawn is clear of it.
const TAIL = 0.1;

/** Whether a meteor is crossing the sky at `time`, the sky's clock in s. */
export function meteorInFlight(time: number) {
  const slot = Math.floor(time / SLOT);
  const h0 = cellHash(slot, 0, 505);
  if (slot < 1 || u01(h0) > 0.5) return false;
  const h1 = pcg(h0);
  const h2 = pcg(h1);
  const dur = 0.6 + 0.5 * u01(h1);
  const start = slot * SLOT + 0.4 + (SLOT - dur - 0.8) * u01(h2);
  return time > start && time < start + dur + TAIL;
}
