import gsap from "gsap";
import type Lenis from "lenis";

import { liftStep } from "./signal";
import { approach, arrive, clamp, coastStep, restingLight, type Rect } from "./sky-math";

export const EMPTY_RECT: Rect = { left: 0, top: 0, width: 0, height: 0 };
const VELOCITY_MAX = 6000;
// px in one tick; a 1.2 s glide across the page moves ~250 px in its first tick even at 30fps.
const JUMP = 400;
const LIGHT_EPSILON = 0.5;
const HOVER_RATE = 3;
const HOVER_EPSILON = 0.002;
// Most of the way to the scroll in ~80 ms: enough to even out a native scroll's steps, too short to read as lag.
const FOLLOW_RATE = 12;
const FOLLOW_EPSILON = 0.5;

export function createFlight() {
  return {
    primed: false,
    scroll: 0,
    /**
     * The scroll the sky moves by. iOS hands the page its native scroll in uneven steps, and a sky
     * drawn straight from them stutters, so this follows `scroll` a few px behind. Lenis eases its
     * own scrolls, which pass straight through.
     */
    smooth: 0,
    /** `smooth`'s speed, px/s. */
    velocity: 0,
    pointer: { x: 0, y: 0, nx: 0.5, ny: 0.5, active: false },
    /** The eased light in page space, heading for (tx, ty); `hover` fades it in over the pointer. */
    light: { x: 0, y: 0, tx: 0, ty: 0, hover: 0, ready: false },
    /** The stars' coast: a velocity and the virtual scroll it has added. */
    coast: { v: 0, offset: 0 },
    hero: EMPTY_RECT,
    /**
     * The hero's runway (spec §4.1), which the sky flies its camera along: the scroll positions where
     * it starts and ends, written by motion.tsx on refresh. Until then the camera stays on the planet
     * and nothing settles. `copy` is how much of the hero copy still shows, 1 → 0 as it lifts away;
     * the sky's text mask follows it.
     */
    camera: { start: 0, end: Number.POSITIVE_INFINITY, copy: 1 },
    /**
     * Contact's signal (sky polish spec §5.6): a hovered or focused link's lift on the sun, easing
     * toward `target`, and the last click's time in ms on the tick's clock.
     */
    signal: { lift: 0, target: 0, at: Number.NEGATIVE_INFINITY },
    reduced: false,
    lenis: null as Lenis | null,
  };
}

export type Flight = ReturnType<typeof createFlight>;

/** The page's shared motion state, read by the sky, the edge light and the scroll helpers. */
export const flight = createFlight();

/**
 * Advances `s` by one tick: scroll and velocity, the eased light, and the stars' coast. `eased` says
 * Lenis is gliding this scroll, so it needs no easing here.
 */
export function advance(s: Flight, scroll: number, scrollX: number, dt: number, eased = false) {
  // The first tick only primes: loading mid-page is not a scroll. Nor is a jump (End, a late scroll
  // restore, a hash): Lenis never moves this far in one tick.
  const delta = scroll - s.scroll;
  const scrolled = s.primed && Math.abs(delta) <= JUMP;
  // Only a native scroll's steps fall behind; a glide, a jump and reduced motion move `smooth` at once.
  // What is already behind keeps closing either way, so a glide that takes over mid-scroll doesn't pop.
  const behind = !s.primed || s.reduced ? 0 : s.scroll - s.smooth + (scrolled && !eased ? delta : 0);
  const smooth = scroll - arrive(behind, 0, dt, FOLLOW_RATE, FOLLOW_EPSILON);
  s.velocity = scrolled && dt > 0 ? clamp((smooth - s.smooth) / dt, -VELOCITY_MAX, VELOCITY_MAX) : 0;
  s.scroll = scroll;
  s.smooth = smooth;
  s.primed = true;

  const { light, pointer } = s;
  const rest = restingLight(s.hero);
  light.tx = pointer.active ? pointer.x + scrollX : rest.x;
  light.ty = pointer.active ? pointer.y + scroll : rest.y;
  // Until the hero is measured there is no resting place to ease from.
  if (!light.ready || s.reduced) {
    light.x = light.tx;
    light.y = light.ty;
    light.ready = pointer.active || s.hero.height > 0;
  }
  light.x = approach(light.x, light.tx, dt);
  light.y = approach(light.y, light.ty, dt);
  const hoverTarget = pointer.active ? 1 : 0;
  light.hover = s.reduced ? hoverTarget : arrive(light.hover, hoverTarget, dt, HOVER_RATE, HOVER_EPSILON);
  // The approach is only asymptotic: land once settled, so a still light stops changing the frame.
  if (Math.hypot(light.tx - light.x, light.ty - light.y) <= LIGHT_EPSILON) {
    light.x = light.tx;
    light.y = light.ty;
  }

  s.coast.v = s.reduced ? 0 : coastStep(s.coast.v, s.velocity, dt);
  s.coast.offset += s.coast.v * dt;
  s.signal.lift = liftStep(s.signal.lift, s.signal.target, dt, s.reduced);
}

/** True while the light, its hover or the coast is still easing. */
export function settling(s: Flight) {
  return (
    Math.abs(s.light.hover - (s.pointer.active ? 1 : 0)) > HOVER_EPSILON ||
    Math.hypot(s.light.tx - s.light.x, s.light.ty - s.light.y) > LIGHT_EPSILON ||
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
  // Contact's links send a signal (sky polish spec §5.6). Delegated, so it holds across routes.
  const signals = (target: EventTarget | null) => target instanceof Element && !!target.closest("[data-sky-signal]");
  let hovered = false;
  let focused = false;
  const aim = () => {
    flight.signal.target = hovered || focused ? 1 : 0;
  };
  const onOver = (event: PointerEvent) => {
    hovered = signals(event.target);
    aim();
  };
  const onOut = (event: PointerEvent) => {
    hovered = signals(event.relatedTarget);
    aim();
  };
  const onFocusIn = (event: FocusEvent) => {
    focused = signals(event.target);
    aim();
  };
  const onFocusOut = (event: FocusEvent) => {
    focused = signals(event.relatedTarget);
    aim();
  };
  // Enter on a focused link clicks it too. The link still follows its href.
  const onClick = (event: MouseEvent) => {
    if (signals(event.target)) flight.signal.at = gsap.ticker.time * 1000;
  };
  // One callback so the order is fixed: Lenis scrolls, the state reads it, subscribers draw.
  const tick = (time: number, deltaMs: number) => {
    const now = time * 1000;
    flight.lenis?.raf(now);
    const dt = Math.min(deltaMs / 1000, 0.1);
    advance(flight, window.scrollY, window.scrollX, dt, flight.lenis?.isScrolling === "smooth");
    subscribers.forEach((fn) => fn(now, dt));
  };
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add(tick);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  document.addEventListener("pointerover", onOver);
  document.addEventListener("pointerout", onOut);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  document.addEventListener("click", onClick);
  motion.addEventListener("change", onMotion);
  return () => {
    gsap.ticker.remove(tick);
    window.removeEventListener("pointermove", onPointer);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("click", onClick);
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

/** A `data-sky-text` block's rect in page space: text the sky keeps quiet behind. Layout too. */
export function textRect(name: string): Rect {
  const el = document.querySelector(`[data-sky-text="${name}"]`);
  return el ? pageRect(el) : EMPTY_RECT;
}
