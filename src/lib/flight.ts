import gsap from "gsap";
import type Lenis from "lenis";

import { approach, clamp, coastStep, restingLight, type Rect } from "./sky-math";

export const EMPTY_RECT: Rect = { left: 0, top: 0, width: 0, height: 0 };
const VELOCITY_MAX = 6000;

export function createFlight() {
  return {
    primed: false,
    scroll: 0,
    /** px/s */
    velocity: 0,
    pointer: { x: 0, y: 0, nx: 0.5, ny: 0.5, active: false },
    /** The eased light in page space, heading for (tx, ty); `hover` fades it in over the pointer. */
    light: { x: 0, y: 0, tx: 0, ty: 0, hover: 0, ready: false },
    /** The stars' coast: a velocity and the virtual scroll it has added. */
    coast: { v: 0, offset: 0 },
    hero: EMPTY_RECT,
    reduced: false,
    lenis: null as Lenis | null,
  };
}

export type Flight = ReturnType<typeof createFlight>;

/** The page's shared motion state, read by the sky, the edge light and the scroll helpers. */
export const flight = createFlight();

/** Advances `s` by one tick: scroll and velocity, the eased light, and the stars' coast. */
export function advance(s: Flight, scroll: number, scrollX: number, dt: number) {
  // The first tick only primes: loading mid-page is not a scroll.
  s.velocity =
    s.primed && dt > 0 ? clamp((scroll - s.scroll) / dt, -VELOCITY_MAX, VELOCITY_MAX) : 0;
  s.scroll = scroll;
  s.primed = true;

  const { light, pointer } = s;
  const rest = restingLight(s.hero);
  light.tx = pointer.active ? pointer.x + scrollX : rest.x;
  light.ty = pointer.active ? pointer.y + scroll : rest.y;
  if (!light.ready || s.reduced) {
    light.x = light.tx;
    light.y = light.ty;
    light.ready = true;
  }
  light.x = approach(light.x, light.tx, dt);
  light.y = approach(light.y, light.ty, dt);
  const hoverTarget = pointer.active ? 1 : 0;
  light.hover = s.reduced ? hoverTarget : approach(light.hover, hoverTarget, dt);

  s.coast.v = s.reduced ? 0 : coastStep(s.coast.v, s.velocity, dt);
  s.coast.offset += s.coast.v * dt;
}

/** True while the light, its hover or the coast is still easing. */
export function settling(s: Flight) {
  return (
    Math.abs(s.light.hover - (s.pointer.active ? 1 : 0)) > 0.002 ||
    Math.hypot(s.light.tx - s.light.x, s.light.ty - s.light.y) > 0.5 ||
    s.coast.v !== 0
  );
}

type TickFn = (now: number, dt: number) => void;
const subscribers = new Set<TickFn>();
let users = 0;
let stopListening = () => {};

/** Runs `fn` every tick, after Lenis and the state update. */
export function onTick(fn: TickFn) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/** Starts the shared tick and its listeners; the last caller to stop ends them. */
export function startFlight() {
  if (users++ === 0) stopListening = listen();
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    if (--users === 0) stopListening();
  };
}

function listen() {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  flight.reduced = motion.matches;
  const onMotion = (event: MediaQueryListEvent) => {
    flight.reduced = event.matches;
    flight.light.ready = false;
  };
  const onPointer = (event: PointerEvent) => {
    const p = flight.pointer;
    p.x = event.clientX;
    p.y = event.clientY;
    p.nx = event.clientX / Math.max(window.innerWidth, 1);
    p.ny = event.clientY / Math.max(window.innerHeight, 1);
    p.active = event.pointerType !== "touch";
  };
  const onLeave = () => {
    flight.pointer.active = false;
  };
  // One callback so the order is fixed: Lenis scrolls, the state reads it, subscribers draw.
  const tick = (time: number, deltaMs: number) => {
    const now = time * 1000;
    flight.lenis?.raf(now);
    const dt = Math.min(deltaMs / 1000, 0.1);
    advance(flight, window.scrollY, window.scrollX, dt);
    subscribers.forEach((fn) => fn(now, dt));
  };
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add(tick);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  motion.addEventListener("change", onMotion);
  return () => {
    gsap.ticker.remove(tick);
    window.removeEventListener("pointermove", onPointer);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    motion.removeEventListener("change", onMotion);
    flight.primed = false;
  };
}

/** An element's rect in page space. It reads layout, so call it only when measuring. */
export function pageRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
}

export function anchorRect(name: string): Rect {
  const el = document.querySelector(`[data-sky-anchor="${name}"]`);
  return el ? pageRect(el) : EMPTY_RECT;
}
