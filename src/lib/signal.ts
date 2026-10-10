import { approach, ease } from "./sky-math";

/** How long a signal's pulse runs, s: its envelope lands at exactly 0 here (spec §5.6). */
export const PULSE_S = 3.5;
const LIFT_RATE = 6;
const LIFT_EPSILON = 0.002;

/** One step of a hovered or focused Contact link's lift on the sun. Reduced motion jumps. */
export function liftStep(lift: number, target: number, dt: number, reduced: boolean) {
  if (reduced) return target;
  const next = approach(lift, target, dt, LIFT_RATE);
  return Math.abs(next - target) <= LIFT_EPSILON ? target : next;
}

/** The pulse's age in s at `now` for a click at `at` (both ms on the tick's clock), or −1 with none running. */
export function pulseAge(now: number, at: number) {
  const age = (now - at) / 1000;
  return age >= 0 && age < PULSE_S ? age : -1;
}

/** The pulse's strength at `age`, as air.wgsl draws it: e^(−1.4 age), cut to 0 between 2.5 and 3.5 s. */
export function pulseEnvelope(age: number) {
  if (age < 0 || age >= PULSE_S) return 0;
  return Math.exp(-1.4 * age) * (1 - ease(2.5, PULSE_S, age));
}
