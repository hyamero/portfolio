# Motion and Light Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the one sky a voyage: Lenis smooth scroll, three coasting star layers, the orb shedding a trail that carries through Work into the horizon, a cursor light that glints on the page's edges, and four micro-interactions.

**Architecture:**
- **Shared state:** `src/lib/flight.ts` owns the page's motion state: scroll, velocity, pointer, the eased light, and the star coast. It runs one `gsap.ticker` callback, which advances Lenis, then the state, then its subscribers.
- **Subscribers:** the vgpu sky (`renderer.ts`) and the edge light (`edge-light.tsx`). Both stay on-demand.
- **Pure math:** in `sky-math.ts`, `flight.ts` (`advance`/`settling`), `magnet.ts` and `sections.ts`, all unit-tested with `bun test`.
- **Browser behaviour:** checked with Playwright scripts in the scratchpad.

**Tech Stack:** Next.js 16.3, React 19.3, Tailwind CSS 4, GSAP 3.15 (ScrollTrigger, `@gsap/react`), Lenis 1.3, vgpu 0.5 (WGSL), bun 1.3 (`bun test`), TypeScript 5.9, oxlint, Playwright 1.63 (scratchpad only).

**Spec:** `docs/superpowers/specs/2026-10-07-motion-and-light-design.md`. Read it first, together with the redesign spec it builds on (`docs/superpowers/specs/2026-10-07-portfolio-redesign-design.md`).

## Global Constraints

- **Tooling:** bun 1.3.14, Node 24.x, TypeScript 5.9. Don't upgrade TypeScript.
- **Dependencies:** the only new runtime dependency is `lenis@^1.3.26`. No other dependencies.
- **Git:**
  - Work on `feat/redesign`.
  - Commits are Conventional Commits with a subject line only: no body, no `Co-Authored-By`.
  - After each commit, say what was committed and to which branch.
  - Never push without the owner's explicit yes to "push to `feat/redesign`?".
- **Code comments:** technical and necessary only. Comment the non-obvious why.
- **No layout reads in a tick:** the sky and the edge light never read layout inside a tick. They measure only on resize, refresh, load and font load.
- **Sky budget:** unchanged, at most 2.2 M device pixels and a DPR of 1.25 or less (`skyDpr`).
- **Scroll changes** only `transform`, `opacity`, the sky's uniforms, and the edge light's custom properties.
  - Every scroll effect stays scrubbed, except the one-shot "Send a signal." blur-in (spec §6.4).
- **Reduced motion:**
  - No Lenis, no coast, no shed animation, no magnets, no blur-in and no row slide.
  - The light follows the cursor unsmoothed.
  - The marker jumps.
- **Touch:** native momentum, no edge light and no magnets. Content never depends on hover.
- **No WebGPU:** the CSS sky as today. Lenis, the edge light and the micro-interactions still work.
- **No JS:** headline words are visible.
- **Shader check:** `bunx vgpu check src/components/sky/sky.wgsl --require-validation` passes.
- **End of every task:** `bun run lint`, `bun run typecheck`, `bun test` and `bun run build` pass.
- **Servers:**
  - The dev server runs in a herdr pane on the right, opened with `herdr pane split --current --direction right --ratio 0.4 --cwd <repo> --no-focus`.
  - Check readiness with `curl --retry`, not `wait-output`: old pane scrollback gives false matches.
  - Read panes with `--source visible`.
  - Close panes at the end.
- **Playwright home:** `PW=/private/tmp/claude-501/-Users-hyamero-Documents-Projects-personal-portfolio/4bb137b1-3a96-4a38-973b-8391f318066e/scratchpad/pw`.
  - It has `playwright@1.63`, `pngjs` and Chromium plus Firefox installed.
  - If it's missing, recreate it with `mkdir -p $PW && cd $PW && bun init -y && bun add playwright@1.63 pngjs && bunx playwright install chromium firefox`.
  - Run scripts with `cd $PW && node voyage.mjs <test names>`.

## Review Focus

1. **Loading mid-page** (a refresh partway down, or `/#omsimos`): no coast kick. The sky goes idle like any other stop.
   - Pinned by `flight` "first tick primes" (Task 2) and `test_hash_idle` (Task 3).
2. **Clicking a second nav link mid-glide:** it lands on the second target, not the first. Pinned by `test_nav_interrupt` (Task 2).
3. **Keyboard scrolling** (PageDown, and Tab to a link below the fold): it still scrolls with Lenis running, and the focused link ends up in view. Pinned by `test_keyboard` (Task 2).
4. **Resizing the window:** glints and magnets realign to the new layout. Pinned by `test_resize_realign` (Task 5).
5. **The pointer leaving the window:** glints fade to 0 and magnets release. Pinned by `test_pointer_leave` (Task 5).

---

### Task 1: Trail and coast math

**Files:**
- Modify: `src/lib/sky-math.ts`
- Test: `src/lib/sky-math.test.ts`

**Interfaces:**
- Consumes: the existing `clamp`, `ease` and `approach` in `sky-math.ts`.
- Produces:
  - `COAST: { gain: 0.5; max: 800; rise: 6; decay: 2; rest: 4 }`
  - `coastStep(v: number, velocity: number, dt: number): number`
  - `trailFrame(dep: number, up: number, reduced: boolean, hasWork: boolean): { shed: number; carry: number; gather: number }`

- [ ] **Step 1: Write the failing tests.** Append to `src/lib/sky-math.test.ts`, and add `COAST`, `coastStep` and `trailFrame` to its import list:

```ts
describe("trailFrame", () => {
  test("nothing sheds at the top, and the whole trail has shed as the orb finishes fading", () => {
    expect(trailFrame(0, 0, false, true).shed).toBe(0);
    expect(trailFrame(0.85, 0, false, true).shed).toBe(1);
    expect(trailFrame(1, 0, false, true).shed).toBe(1);
  });
  test("shed grows monotonically with departure", () => {
    let last = -1;
    for (let d = 0; d <= 1; d += 0.05) {
      const { shed } = trailFrame(d, 0, false, true);
      expect(shed).toBeGreaterThanOrEqual(last);
      last = shed;
    }
  });
  test("the ribbon appears as the orb leaves and dims as the horizon takes over", () => {
    expect(trailFrame(0, 0, false, true).carry).toBe(0);
    expect(trailFrame(0.35, 0, false, true).carry).toBe(1);
    expect(trailFrame(1, 1, false, true).carry).toBeCloseTo(0.6);
  });
  test("there is no ribbon without a Work section", () => {
    expect(trailFrame(1, 0, false, false).carry).toBe(0);
  });
  test("gather follows the horizon's rise", () => {
    expect(trailFrame(1, 0.4, false, true).gather).toBe(0.4);
  });
  test("reduced motion sheds nothing and holds the ribbon as still nebula", () => {
    expect(trailFrame(0.6, 1, true, true)).toEqual({ shed: 0, carry: 1, gather: 1 });
  });
});

describe("coastStep", () => {
  const DT = 1 / 60;
  const run = (v: number, velocity: number, seconds: number) => {
    for (let i = 0; i < Math.round(seconds / DT); i++) v = coastStep(v, velocity, DT);
    return v;
  };
  test("follows the scroll in its direction, at half its speed", () => {
    expect(run(0, 1000, 0.5)).toBeGreaterThan(450);
    expect(run(0, -1000, 0.5)).toBeLessThan(-450);
  });
  test("is capped", () => {
    const v = run(0, 6000, 2);
    expect(v).toBeLessThanOrEqual(COAST.max);
    expect(v).toBeGreaterThan(COAST.max - 10);
  });
  test("glides on after a stop and comes to rest within 3 s from the cap", () => {
    expect(run(COAST.max, 0, 1)).toBeGreaterThan(COAST.rest);
    let v = COAST.max;
    let t = 0;
    while (v !== 0 && t < 5) {
      v = coastStep(v, 0, DT);
      t += DT;
    }
    expect(v).toBe(0);
    expect(t).toBeLessThanOrEqual(3);
  });
  test("reverses quickly when the scroll does", () => {
    expect(run(400, -1000, 0.3)).toBeLessThan(0);
  });
  test("stays at rest without a scroll", () => {
    expect(coastStep(0, 0, DT)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail.**

Run: `bun test src/lib/sky-math.test.ts`
Expected: FAIL, because `trailFrame`, `coastStep` and `COAST` are not exported.

- [ ] **Step 3: Implement.** Append to `src/lib/sky-math.ts`:

```ts
/**
 * The orb's trail (spec §4.1): its atmosphere sheds off the limb as it sets, carries on as a
 * ribbon of nebula through Work, and gathers back into the horizon as Contact rises.
 */
export function trailFrame(dep: number, up: number, reduced: boolean, hasWork: boolean) {
  if (reduced) return { shed: 0, carry: hasWork ? 1 : 0, gather: up };
  return {
    shed: ease(0.12, 0.85, dep),
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
```

- [ ] **Step 4: Run the tests to verify they pass.**

Run: `bun test`
Expected: PASS, with every test green (31 existing plus 11 new).

- [ ] **Step 5: Run the checks and commit.**

```bash
bun run lint && bun run typecheck && bun run build
git add src/lib/sky-math.ts src/lib/sky-math.test.ts
git commit -m "feat(sky): add the trail and coast math"
```

---

### Task 2: Flight state, Lenis and section scrolling

**Files:**
- Create: `src/lib/flight.ts`, `src/lib/flight.test.ts`, `src/components/smooth-scroll.tsx`, `$PW/voyage.mjs`
- Modify: `src/lib/scroll.ts`, `src/app/layout.tsx`, `package.json` (via `bun add`)

**Interfaces:**
- Consumes: `coastStep`, `approach`, `clamp`, `restingLight` and `Rect` from `sky-math.ts`.
- Produces (`src/lib/flight.ts`):
  - `createFlight(): Flight`. `Flight` has these fields: `primed`, `scroll`, `velocity`, `pointer {x,y,nx,ny,active}`, `light {x,y,tx,ty,hover,ready}`, `coast {v,offset}`, `hero: Rect`, `reduced`, `lenis: Lenis | null`.
  - `flight: Flight`, the singleton.
  - `advance(s: Flight, scroll: number, scrollX: number, dt: number): void`
  - `settling(s: Flight): boolean`
  - `onTick(fn: (now: number, dt: number) => void): () => void`
  - `startFlight(): () => void`. It is ref-counted, and its stop is idempotent.
  - `pageRect(el: Element): Rect`, `anchorRect(name: string): Rect` and `EMPTY_RECT`.
- Produces (`$PW/voyage.mjs`): a harness with `open(opts?, init?)`, `settle(p)`, `shot(p)`, `diff(a, b)`, `lum(r, g, b)` and `report(name, ok, info)`, plus a `tests` registry run by name from argv.

- [ ] **Step 1: Install Lenis and confirm its stylesheet path.**

```bash
bun add lenis@^1.3.26 && ls node_modules/lenis/dist/lenis.css
```
Expected: the path is printed.

- [ ] **Step 2: Write the failing tests** in `src/lib/flight.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { advance, createFlight, settling } from "./flight";
import { restingLight, type Rect } from "./sky-math";

const hero: Rect = { left: 0, top: 0, width: 1440, height: 960 };
const DT = 1 / 60;
const fresh = () => {
  const s = createFlight();
  s.hero = hero;
  return s;
};

describe("flight", () => {
  test("the first tick primes the scroll without a velocity kick", () => {
    const s = fresh();
    advance(s, 2400, 0, DT);
    expect(s.velocity).toBe(0);
    expect(s.coast.v).toBe(0);
  });
  test("velocity is in px/s and clamped", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    advance(s, 10, 0, DT);
    expect(s.velocity).toBeCloseTo(600);
    advance(s, 10_000, 0, DT);
    expect(s.velocity).toBe(6000);
  });
  test("scrolling builds a coast that glides on after the scroll stops", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    let y = 0;
    for (let i = 0; i < 30; i++) advance(s, (y += 20), 0, DT);
    expect(s.coast.v).toBeGreaterThan(0);
    const offset = s.coast.offset;
    for (let i = 0; i < 30; i++) advance(s, y, 0, DT);
    expect(s.coast.offset).toBeGreaterThan(offset);
  });
  test("reduced motion holds the coast at 0", () => {
    const s = fresh();
    s.reduced = true;
    advance(s, 0, 0, DT);
    for (let i = 1; i <= 30; i++) advance(s, i * 20, 0, DT);
    expect(s.coast.v).toBe(0);
    expect(s.coast.offset).toBe(0);
  });
  test("the light rests above the hero, then eases to the pointer and settles", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    const rest = restingLight(hero);
    expect(s.light.x).toBeCloseTo(rest.x);
    expect(s.light.y).toBeCloseTo(rest.y);
    s.pointer = { x: 100, y: 200, nx: 0, ny: 0, active: true };
    advance(s, 50, 0, DT);
    expect(s.light.tx).toBe(100);
    expect(s.light.ty).toBe(250);
    expect(s.light.x).toBeGreaterThan(100);
    expect(settling(s)).toBe(true);
    for (let i = 0; i < 600; i++) advance(s, 50, 0, DT);
    expect(s.light.x).toBeCloseTo(100, 0);
    expect(s.light.hover).toBeCloseTo(1, 2);
    expect(settling(s)).toBe(false);
  });
  test("reduced motion snaps the light to the pointer", () => {
    const s = fresh();
    s.reduced = true;
    advance(s, 0, 0, DT);
    s.pointer = { x: 100, y: 200, nx: 0, ny: 0, active: true };
    advance(s, 0, 0, DT);
    expect(s.light.x).toBe(100);
    expect(s.light.hover).toBe(1);
    expect(settling(s)).toBe(false);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail.**

Run: `bun test src/lib/flight.test.ts`
Expected: FAIL, with "Cannot find module './flight'".

- [ ] **Step 4: Implement `src/lib/flight.ts`.**

```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass.**

Run: `bun test`
Expected: PASS, all green.

- [ ] **Step 6: Create `src/components/smooth-scroll.tsx`.**

```tsx
"use client";

import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { useEffect } from "react";

import { flight, startFlight } from "@/lib/flight";

gsap.registerPlugin(ScrollTrigger);

/** Lenis on flight's tick for wheel and trackpad; touch keeps native momentum. Off for reduced motion. */
export default function SmoothScroll() {
  useEffect(() => {
    const stop = startFlight();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    const sync = () => {
      if (motion.matches) {
        lenis?.destroy();
        lenis = flight.lenis = null;
        return;
      }
      if (lenis) return;
      lenis = new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, lerp: 0.1, anchors: false });
      lenis.on("scroll", ScrollTrigger.update);
      flight.lenis = lenis;
    };
    sync();
    motion.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      lenis?.destroy();
      flight.lenis = null;
      stop();
    };
  }, []);
  return null;
}
```

- [ ] **Step 7: Rewrite `src/lib/scroll.ts`.**

```ts
import { flight } from "@/lib/flight";

const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

/** Glides to a section with Lenis; without it (reduced motion), jumps there natively. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const { lenis } = flight;
  if (!lenis) return el.scrollIntoView();
  // A number target, so the header offset doesn't depend on Lenis reading scroll-margin.
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY - margin, {
    duration: 1.2,
    easing: easeOutQuint,
  });
}
```

- [ ] **Step 8: Mount it in `src/app/layout.tsx`.**
  - Add `import "lenis/dist/lenis.css";` above `import "./globals.css";`.
  - Add `import SmoothScroll from "@/components/smooth-scroll";`.
  - Render `<SmoothScroll />` right after `<Sky />`.

- [ ] **Step 9: Start the dev server in a right-hand pane.**

```bash
herdr pane split --current --direction right --ratio 0.4 --cwd /Users/hyamero/Documents/Projects/personal/portfolio --no-focus
# note the returned pane_id as $DEV
herdr pane run $DEV 'bun run dev'
curl -sf --retry 60 --retry-delay 1 --retry-connrefused -o /dev/null http://localhost:3000/ && echo up
```
Expected: `up`.

- [ ] **Step 10: Create `$PW/voyage.mjs`** with the harness and this task's tests. Later tasks insert their tests above the `// runner` line.

```js
import { chromium, firefox } from "playwright";
import { PNG } from "pngjs";

const URL = process.env.URL ?? "http://localhost:3000/";
const only = process.argv.slice(2);
const b = await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] });
let fail = 0;
const tests = {};
const report = (name, ok, info) => {
  console.log(name, ok ? "PASS" : "FAIL", JSON.stringify(info));
  if (!ok) fail++;
};
const open = async (opts = {}, init) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.addInitScript(() => {
    window.__submits = 0;
    if (!("gpu" in navigator)) return;
    const submit = GPUQueue.prototype.submit;
    GPUQueue.prototype.submit = function (...a) {
      window.__submits++;
      return submit.apply(this, a);
    };
  });
  if (init) await p.addInitScript(init);
  await p.goto(URL);
  await p.waitForTimeout(3500);
  return p;
};
const settle = async (p) => {
  let last = NaN;
  for (let i = 0; i < 100; i++) {
    const y = await p.evaluate(() => scrollY);
    if (y === last) return y;
    last = y;
    await p.waitForTimeout(150);
  }
  return last;
};
const shot = async (p, opts) => PNG.sync.read(await p.screenshot(opts));
const diff = (a, b) => {
  let n = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > 24) n++;
  }
  return n;
};
const lum = (r, g, b) => {
  const f = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

tests.test_lenis = async () => {
  const p = await open();
  const cls = await p.evaluate(() => document.documentElement.className);
  await p.mouse.move(720, 450);
  await p.mouse.wheel(0, 600);
  await p.waitForTimeout(120);
  const mid = await p.evaluate(() => scrollY);
  const end = await settle(p);
  report("test_lenis", cls.includes("lenis") && mid > 0 && mid < 560 && Math.abs(end - 600) < 2, { cls, mid, end, errors: p.errors });
  await p.context().close();
};

tests.test_nav_lands = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await p.click('header a[href="/#work"]');
    await p.waitForTimeout(250);
    const moving = await p.evaluate(() => scrollY);
    const end = await settle(p);
    const r = await p.evaluate(() => ({ top: document.querySelector("#work").getBoundingClientRect().top, hash: location.hash }));
    report(`test_nav_lands ${w}`, Math.abs(r.top) < 2 && r.hash === "#work" && moving > 0 && moving < end - 50, { ...r, moving, end });
    await p.context().close();
  }
};

tests.test_nav_interrupt = async () => {
  const p = await open();
  await p.click('header a[href="/#work"]');
  await p.waitForTimeout(250);
  await p.click('header a[href="/#contact"]');
  const y = await settle(p);
  const r = await p.evaluate(() => ({ top: document.querySelector("#contact").getBoundingClientRect().top, max: document.documentElement.scrollHeight - innerHeight }));
  report("test_nav_interrupt", Math.abs(r.top) < 2 || Math.abs(y - r.max) < 2, { y, ...r });
  await p.context().close();
};

tests.test_keyboard = async () => {
  const p = await open();
  await p.keyboard.press("PageDown");
  const paged = await settle(p);
  await p.evaluate(() => scrollTo(0, 0));
  await settle(p);
  for (let i = 0; i < 30; i++) {
    if (await p.evaluate(() => document.activeElement?.classList.contains("say"))) break;
    await p.keyboard.press("Tab");
  }
  await settle(p);
  const r = await p.$eval(".say", (e) => {
    const box = e.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, focused: document.activeElement === e };
  });
  report("test_keyboard", paged > 300 && r.focused && r.top >= 0 && r.bottom <= 900, { paged, ...r });
  await p.context().close();
};

tests.test_reduced_native = async () => {
  const p = await open({ reducedMotion: "reduce" });
  const cls = await p.evaluate(() => document.documentElement.className);
  await p.click('header a[href="/#work"]');
  await p.waitForTimeout(100);
  const y = await p.evaluate(() => scrollY);
  const end = await settle(p);
  report("test_reduced_native", !cls.includes("lenis") && y === end && end > 500, { cls, y, end });
  await p.context().close();
};

// runner
for (const [name, fn] of Object.entries(tests)) if (!only.length || only.includes(name)) await fn();
await b.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 11: Run the browser tests.**

Run: `cd $PW && node voyage.mjs`
Expected: these pass:
- `test_lenis`
- `test_nav_lands 1440`
- `test_nav_lands 390`
- `test_nav_interrupt`
- `test_keyboard`
- `test_reduced_native`

Also run the existing deep-link check, `cd $PW && node fixes.mjs`. Expected: `test_deep_link_clears_header` passes at both widths.

- [ ] **Step 12: Run the checks and commit.**

```bash
bun run lint && bun run typecheck && bun test && bun run build
git add package.json bun.lock src/lib/flight.ts src/lib/flight.test.ts src/components/smooth-scroll.tsx src/lib/scroll.ts src/app/layout.tsx
git commit -m "feat(motion): smooth scroll with Lenis on a shared flight loop"
```

---

### Task 3: The sky on the flight loop, with three coasting star layers

**Files:**
- Modify: `src/components/sky/renderer.ts` (full rewrite below), `src/components/sky/sky.wgsl` (Params, stars)
- Test: `$PW/voyage.mjs` (`test_coast`, `test_hash_idle`, `test_device_loss`)

**Interfaces:**
- Consumes:
  - from `flight.ts` (Task 2): `flight`, `onTick`, `startFlight`, `anchorRect` and `EMPTY_RECT`
  - from `sky-math.ts` (Task 1): `trailFrame`
- Produces:
  - WGSL `Params` gains `span: vec2f` and `trail: vec4f`, after `heroHeight`.
  - `trail.w` is the stars' virtual scroll.
  - `renderer.ts` writes `span = [work.top, contact.top]`. Task 4's shader reads it.

- [ ] **Step 1: Take a baseline screenshot** for the scroll-0 comparisons. Insert this test above `// runner`, then run `cd $PW && node voyage.mjs test_baseline`:

```js
tests.test_baseline = async () => {
  const p = await open();
  await p.screenshot({ path: process.env.SHOT ?? "baseline-rise-1440.png" });
  report("test_baseline", p.errors.length === 0, { errors: p.errors });
  await p.context().close();
};
```
Expected: PASS, and `baseline-rise-1440.png` is written.

- [ ] **Step 2: Write the failing browser tests.** Insert above `// runner`:

```js
tests.test_coast = async () => {
  for (const reduced of [false, true]) {
    const p = await open(reduced ? { reducedMotion: "reduce" } : {});
    await p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
    await p.waitForTimeout(3500);
    await p.mouse.wheel(0, -500);
    await settle(p);
    const a = await shot(p);
    await p.waitForTimeout(500);
    const c = await shot(p);
    await p.waitForTimeout(2000);
    const s0 = await p.evaluate(() => window.__submits);
    await p.waitForTimeout(2000);
    const idle = (await p.evaluate(() => window.__submits)) - s0;
    const moved = diff(a, c);
    report(`test_coast ${reduced ? "reduced" : "motion"}`, (reduced ? moved === 0 : moved > 20) && idle === 0, { moved, idle });
    await p.context().close();
  }
};

tests.test_hash_idle = async () => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__submits = 0;
    const submit = GPUQueue.prototype.submit;
    GPUQueue.prototype.submit = function (...a) {
      window.__submits++;
      return submit.apply(this, a);
    };
  });
  await p.goto(URL + "#omsimos");
  await p.waitForTimeout(4000);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(2000);
  const idle = (await p.evaluate(() => window.__submits)) - s0;
  report("test_hash_idle", idle === 0 && s0 > 0, { s0, idle });
  await ctx.close();
};

tests.test_device_loss = async () => {
  const p = await open({}, () => {
    const req = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...a) {
      const d = await req.apply(this, a);
      (window.__devices ||= []).push(d);
      return d;
    };
  });
  await p.evaluate(() => window.__devices.forEach((d) => d.destroy()));
  await p.waitForTimeout(500);
  for (let i = 0; i < 10; i++) {
    await p.mouse.wheel(0, 40);
    await p.waitForTimeout(50);
  }
  await p.waitForTimeout(1500);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(2000);
  const after = (await p.evaluate(() => window.__submits)) - s0;
  const sky = await p.evaluate(() => document.documentElement.dataset.sky);
  report("test_device_loss", after === 0 && sky === "css", { after, sky, errors: p.errors });
  await p.context().close();
};
```

- [ ] **Step 3: Run them to verify the coast test fails.**

Run: `cd $PW && node voyage.mjs test_coast test_hash_idle test_device_loss`
Expected:
- `test_coast motion` FAILs with `moved` at 0, because there is no coast yet. The stars stop with the scroll.
- `test_coast reduced`, `test_hash_idle` and `test_device_loss` pass. They pin behaviour that must survive the rewrite.

- [ ] **Step 4: Update the shader's `Params`.** In `sky.wgsl`, after `heroHeight: f32,` add:

```wgsl
  // Where the trail's ribbon runs, in page y: the top of Work and the top of Contact.
  span: vec2f,
  // The orb's trail (shed, carry, gather; 0..1) and, in w, the stars' virtual scroll (scroll + coast).
  trail: vec4f,
```

- [ ] **Step 5: Replace the stars block.** Replace the block from `let sp = vec2f(css.x, css.y + params.scroll * 0.85);` through `col += vec3f(st * occ);` with:

```wgsl
  // Stars in three depths. Each layer moves at its own share of the stars' virtual scroll, so
  // scrolling reads as travel and the field glides on for a moment after a stop.
  let ss = params.trail.w;
  let par = (params.pointer - 0.5) * 8.0 * params.hover;
  let st = stars((css + vec2f(0.0, ss * 0.04) + par * 0.6) / 9.0, t, 0.988, 0.08) * 0.4
         + stars((css + vec2f(0.0, ss * 0.08) + par * 1.2) / 23.0 + 17.0, t * 0.8, 0.98, 0.07) * 0.65
         + stars((css + vec2f(0.0, ss * 0.17) + par * 2.0) / 47.0 + 41.0, t * 0.6, 0.975, 0.09) * 0.95;
  col += vec3f(st * occ);
```

- [ ] **Step 6: Rewrite `src/components/sky/renderer.ts`.**

```ts
import { effect, frame, surface } from "vgpu";

import skySource from "./sky.wgsl";
import { anchorRect, EMPTY_RECT, flight, onTick, startFlight } from "@/lib/flight";
import { getGpu } from "@/lib/gpu";
import {
  armIntro,
  departure,
  horizonFrame,
  introProgress,
  orbFrame,
  rise,
  skyDpr,
  trailFrame,
  type Rect,
} from "@/lib/sky-math";

const INTRO_DELAY_MS = 250;
// The ambient drift (nebula, flow, twinkle) needs no more than ~30fps.
const AMBIENT_MS = 33;

type Callbacks = { onFirstFrame: () => void; onFallback: () => void };

/**
 * Draws the page's sky into the fixed `canvas` on flight's tick. Frames are drawn on demand: when
 * anything the sky reads has changed, while the orb's intro eases, and at ~30fps while the orb,
 * the horizon or the shedding trail is in view.
 */
export function mountSky(canvas: HTMLCanvasElement, { onFirstFrame, onFallback }: Callbacks) {
  let disposed = false;
  let measure = () => {};
  const teardown: (() => void)[] = [startFlight()];

  void (async () => {
    const maybeGpu = await getGpu();
    if (disposed) return;
    if (!maybeGpu) return onFallback();
    // Narrowing doesn't reach the tick closure below.
    const gpu = maybeGpu;

    try {
      const output = surface(gpu, canvas, {
        // Sized by hand to the pixel budget; auto-resize would re-read devicePixelRatio.
        autoResize: false,
        // Every pixel is written with alpha 1, so the compositor can skip blending the canvas.
        alphaMode: "opaque",
      });
      teardown.push(() => output.dispose());

      const sky = effect(gpu, skySource, {
        set: {
          params: {
            resolution: output.size,
            light: [0, 0],
            pointer: [0.5, 0.5],
            dpr: 1,
            scroll: 0,
            hover: 0,
            time: flight.reduced ? 8 : 0,
            orb: [0, 0, 1, 0],
            foot: [0, 0, 1, 0],
            footWidth: 1,
            heroHeight: 1,
            span: [0, 0],
            trail: [0, 0, 0, 0],
          },
        },
      });
      await sky.compile({ colors: [output.format] });
      if (disposed) return;

      let cssWidth = 1;
      let hero: Rect = EMPTY_RECT;
      let work: Rect = EMPTY_RECT;
      let contact: Rect = EMPTY_RECT;
      let time = flight.reduced ? 8 : 0;
      let lastDraw = 0;
      let dirty = true;
      let shown = false;
      let introStart: number | null = null;
      // What the last frame was drawn from; a tick that matches it draws nothing.
      const last = new Float64Array(8).fill(Number.NaN);

      // Layout is read only here, never inside a tick.
      measure = () => {
        hero = anchorRect("hero");
        work = anchorRect("work");
        contact = anchorRect("contact");
        flight.hero = hero;
        dirty = true;
      };

      const resize = () => {
        cssWidth = Math.max(canvas.clientWidth, 1);
        const height = Math.max(canvas.clientHeight, 1);
        const dpr = skyDpr(window.devicePixelRatio, cssWidth, height);
        output.resize([Math.max(1, Math.round(cssWidth * dpr)), Math.max(1, Math.round(height * dpr))]);
        dirty = true;
      };

      const tick = (now: number) => {
        if (document.hidden) return;
        const { light, pointer, reduced } = flight;
        const scrollY = flight.scroll;

        // The tick only runs while the tab is visible.
        introStart = armIntro(introStart, now + INTRO_DELAY_MS, hero.height > 0, true);
        const intro = reduced ? 1 : introStart === null ? 0 : introProgress(now - introStart);
        const dep = reduced ? 0 : departure(scrollY, hero);
        const orb = orbFrame(hero, intro, dep);
        const up = !contact.height ? 0 : reduced ? 1 : rise(scrollY, window.innerHeight, contact);
        const horizon = horizonFrame(contact, up);
        const trail = trailFrame(dep, up, reduced, work.height > 0);
        const starScroll = scrollY + flight.coast.offset;

        const inputs = [scrollY, starScroll, light.x, light.y, light.hover, pointer.nx, pointer.ny, reduced ? 1 : 0];
        let changed = dirty;
        inputs.forEach((value, i) => {
          if (value !== last[i]) {
            last[i] = value;
            changed = true;
          }
        });
        const easing = !reduced && introStart !== null && intro < 1;
        const ambient = !reduced && (orb.vis > 0.001 || up > 0 || (trail.shed > 0 && trail.shed < 1));
        if (!changed && !easing && !(ambient && now - lastDraw >= AMBIENT_MS)) return;

        // Time only runs while something ambient is in view; elsewhere frames are static.
        if (ambient && lastDraw) time += Math.min((now - lastDraw) / 1000, 0.1);
        lastDraw = now;
        dirty = false;
        sky.set({
          params: {
            resolution: output.size,
            dpr: output.size[0] / cssWidth,
            scroll: scrollY,
            light: [light.x, light.y],
            pointer: [pointer.nx, pointer.ny],
            hover: light.hover,
            time,
            orb: [orb.cx, orb.apex, orb.radius, orb.vis],
            foot: [horizon.cx, horizon.top, horizon.radius, up],
            footWidth: horizon.halfWidth,
            heroHeight: hero.height,
            span: [work.top, contact.height ? contact.top : work.top + work.height],
            trail: [trail.shed, trail.carry, trail.gather, starScroll],
          },
        });
        const done = frame(gpu, (f) => f.pass(output, sky)).done;
        if (!shown) {
          shown = true;
          // A device lost before the first submit rejects here; the lost handler falls back.
          done.then(() => !disposed && onFirstFrame()).catch(() => {});
        }
      };

      const onVisibility = () => {
        dirty = true;
      };
      window.addEventListener("load", measure);
      document.addEventListener("visibilitychange", onVisibility);
      const canvasObserver = new ResizeObserver(resize);
      canvasObserver.observe(canvas);
      const pageObserver = new ResizeObserver(measure);
      pageObserver.observe(document.body);
      void document.fonts.ready.then(() => !disposed && measure());
      const offTick = onTick(tick);
      teardown.push(() => {
        offTick();
        window.removeEventListener("load", measure);
        document.removeEventListener("visibilitychange", onVisibility);
        canvasObserver.disconnect();
        pageObserver.disconnect();
      });

      void gpu.gpu.lost.then(() => {
        if (disposed) return;
        offTick();
        onFallback();
      });

      resize();
      measure();
    } catch (error) {
      console.error(error);
      if (!disposed) onFallback();
    }
  })();

  return {
    measure: () => measure(),
    dispose: () => {
      disposed = true;
      teardown.forEach((fn) => fn());
    },
  };
}
```

- [ ] **Step 7: Validate the shader, then run the browser tests to verify they pass.**

```bash
bunx vgpu check src/components/sky/sky.wgsl --require-validation
cd $PW && node voyage.mjs test_coast test_hash_idle test_device_loss test_lenis && node idle.mjs
```
Expected:
- the shader check passes
- every voyage test passes
- `idle.mjs` prints `idle submits 0` on all three lines

- [ ] **Step 8: Check the stars by eye.** Run `cd $PW && SHOT=stars-rise-1440.png node voyage.mjs test_baseline`, then read `baseline-rise-1440.png` and `stars-rise-1440.png` with the Read tool.
  - Expected: the orb, its rings and the copy are identical. Only the star pattern differs.
  - The near layer reads as larger, brighter stars, with no visible tiling.
  - If the far layer is invisible at DPR 1, raise its size to 0.1 and record that as a ruling.

- [ ] **Step 9: Run the checks and commit.**

```bash
bun run lint && bun run typecheck && bun test && bun run build
git add src/components/sky/renderer.ts src/components/sky/sky.wgsl
git commit -m "feat(sky): draw the sky on the flight loop with three coasting star layers"
```

---

### Task 4: The trail (shed, carry, gather)

**Files:**
- Modify: `src/components/sky/sky.wgsl`, `src/components/work.tsx` (the anchor)
- Test: `$PW/voyage.mjs` (`test_contrast`, `test_story`)

**Interfaces:**
- Consumes:
  - `params.trail.xyz` (shed, carry, gather) and `params.span` (workTop, contactTop) from Task 3
  - the `data-sky-anchor="work"` that `renderer.ts` already measures
- Produces: no new interfaces.

- [ ] **Step 1: Add the anchor.** In `src/components/work.tsx`, add `data-sky-anchor="work"` to the `<section id="work" …>`.

- [ ] **Step 2: Write the contrast and story tests.** Insert above `// runner`:

```js
tests.test_contrast = async () => {
  const DIM = lum(0x7c, 0x81, 0x8b);
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await p.addStyleTag({ content: "[data-statement], [data-statement] * { color: transparent !important; }" });
    const rows = [];
    for (const id of ["umamin", "omsimos", "stackmap"]) {
      await p.evaluate((id) => document.querySelector(`#${id} [data-statement]`).scrollIntoView({ block: "center" }), id);
      await p.waitForTimeout(3000);
      const clip = await p.$eval(`#${id} [data-statement]`, (e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      const img = await shot(p, { clip });
      const ls = [];
      for (let i = 0; i < img.data.length; i += 4) ls.push(lum(img.data[i], img.data[i + 1], img.data[i + 2]));
      ls.sort((x, y) => x - y);
      const p95 = ls[Math.floor(ls.length * 0.95)];
      rows.push({ id, p95: +p95.toFixed(4), ratio: +((DIM + 0.05) / (p95 + 0.05)).toFixed(2) });
    }
    report(`test_contrast ${w}`, rows.every((r) => r.ratio >= 4.5), rows);
    await p.context().close();
  }
};

tests.test_story = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    const H = await p.evaluate(() => document.querySelector("#home").offsetHeight);
    for (const [name, y] of [["rise", 0], ["shed", H * 0.6], ["carry", null], ["gather", 1e6]]) {
      if (y === null) await p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
      else await p.evaluate((v) => scrollTo(0, v), y);
      await p.waitForTimeout(3000);
      await p.screenshot({ path: `story-${name}-${w}.png` });
    }
    report(`test_story ${w}`, p.errors.length === 0, { errors: p.errors });
    await p.context().close();
  }
};
```

- [ ] **Step 3: Run the contrast test on the current sky** to record the baseline, which must already pass.

Run: `cd $PW && node voyage.mjs test_contrast`
Expected: PASS at both widths. Note the ratios; the ribbon must keep them at 4.5 or above.

- [ ] **Step 4: Add the carry ribbon.** In `sky.wgsl`, directly after the nebula block's closing `}` (after `col += neb * …;`), insert:

```wgsl
  // Carry: the shed atmosphere becomes a ribbon of nebula winding down through Work. It sits deep
  // (its path moves at 45% of the scroll) and is dimmed behind the text column for legibility.
  let carry = params.trail.y;
  let gather = params.trail.z;
  let workTop = params.span.x;
  let contactTop = params.span.y;
  if (carry > 0.003 && page.y > workTop - 400.0 && page.y < contactTop + 200.0) {
    let deep = page.y - params.scroll * 0.55;
    let bend = gather * smoothstep(contactTop - 900.0, contactTop, page.y);
    let path = W * (0.5 + 0.3 * sin(deep / 900.0 + 1.1) + 0.08 * sin(deep / 310.0));
    let cx = mix(path, params.foot.x, bend);
    let off = abs(page.x - cx);
    if (off < W * 0.5) {
      let width = W * mix(0.22, 0.08, bend);
      let q = vec2f(page.x, deep) / 420.0;
      let w = vec2f(fbm3(q + vec2f(2.1, t * 0.02)), fbm3(q + vec2f(7.3, 3.9)));
      let n = fbm3(q * 1.6 + (w - 0.45) * 2.0);
      let body = exp(-(off * off) / (width * width));
      let ends = smoothstep(workTop - 400.0, workTop + 300.0, page.y)
               * (1.0 - smoothstep(contactTop, contactTop + 200.0, page.y));
      let readability = mix(0.55, 1.0, smoothstep(0.32, 0.4, abs(css.x - W * 0.5) / W));
      // At most ~0.10 added luminance.
      col += vec3f(0.2, 0.34, 0.7) * smoothstep(0.3, 0.75, n) * body * ends * readability * carry * 0.3;
    }
  }
```

- [ ] **Step 5: Add the shed.** Directly after the orb branch's closing `}` (after the flares line), insert:

```wgsl
  // Shed: as the orb sets, its atmosphere peels off the limb and streams up the page. It brightens
  // as the orb fades, then hands over to the ribbon once the orb is gone.
  let shed = params.trail.x;
  let shedK = shed * (1.0 - 0.5 * vis) * smoothstep(0.0, 0.15, vis);
  let shedLen = R * mix(0.15, 0.9, shed);
  if (shedK > 0.001 && rel.y < 0.0 && dOrb > 0.0 && dOrb < shedLen) {
    let dir = rel / max(dist, 0.0001);
    // 0 straight up the page, growing toward the shoulders.
    let ang = atan2(dir.x, -dir.y);
    let along = dOrb / shedLen;
    let q = vec2f(ang * 5.0, along * 2.5 - shed * 2.0 - t * 0.03);
    let n = fbm(q + vec2f(fbm3(q * 0.8) * 1.2, 0.0));
    let streak = smoothstep(0.45, 0.85, n) * exp(-along * 2.2) * (1.0 - smoothstep(0.7, 1.0, along));
    let crown = 1.0 - smoothstep(0.6, 1.1, abs(ang));
    let tint = mix(vec3f(0.47, 0.7, 0.96), vec3f(0.16, 0.24, 0.52), smoothstep(0.0, 0.8, along));
    // At most ~0.18 added luminance.
    col += tint * streak * crown * shedK * 0.27;
  }
```

- [ ] **Step 6: Add the gather.** Inside the horizon branch, replace these two lines:

```wgsl
    let h = vec3f(0.78, 0.87, 1.0) * rim * 0.95 + vec3f(0.3, 0.42, 0.62) * (atmo * 0.55 + inner * 0.32);
    col += h * facing * rise * GLOW;
```

with:

```wgsl
    // Gather: the ribbon's wisps run along the arc into its centre, and the rim lights as they arrive.
    let arrive = 1.0 + 0.25 * gather * smoothstep(0.6, 1.0, gather);
    let inward = abs(page.x - params.foot.x) / hw;
    let wq = vec2f(inward * 2.5 + t * 0.04 + gather * 1.5, max(dFoot, 0.0) / 90.0);
    let wisp = smoothstep(0.55, 0.85, fbm3(wq)) * exp(-max(dFoot, 0.0) / 180.0) * above;
    let h = vec3f(0.78, 0.87, 1.0) * rim * 0.95 * arrive + vec3f(0.3, 0.42, 0.62) * (atmo * 0.55 + inner * 0.32);
    col += h * facing * rise * GLOW;
    // At most ~0.08 added luminance.
    col += vec3f(0.3, 0.45, 0.85) * wisp * gather * 0.12;
```

- [ ] **Step 7: Validate, then run contrast and story.**

```bash
bunx vgpu check src/components/sky/sky.wgsl --require-validation
cd $PW && node voyage.mjs test_contrast test_story test_coast
```
Expected:
- the shader check passes
- `test_contrast` passes at both widths. If not, lower the `0.55` readability factor in steps of 0.1, down to 0.15 at minimum, re-run, and record the final value as a ruling.
- `test_story` and `test_coast` pass

- [ ] **Step 8: Judge the story by eye.** Read the eight `story-*.png` files and `baseline-rise-1440.png`. Expected (spec §2.1):
  - `rise` matches the baseline, except for the stars.
  - `shed` shows wisps rising off the setting limb.
  - `carry` shows a faint blue ribbon behind the rows that never competes with the text.
  - `gather` shows the ribbon narrowing into the horizon, with a brighter rim.
  - Any adjustment to the strengths (0.27, 0.3, 0.12) is recorded as a ruling.

- [ ] **Step 9: Run the checks and commit.**

```bash
bun run lint && bun run typecheck && bun test && bun run build
git add src/components/sky/sky.wgsl src/components/work.tsx
git commit -m "feat(sky): shed the orb into a trail that carries through Work into the horizon"
```

---

### Task 5: Edge light and magnetic arrows

**Files:**
- Create: `src/lib/magnet.ts`, `src/lib/magnet.test.ts`, `src/components/edge-light.tsx`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/work.tsx`, `src/components/hero.tsx`, `src/components/contact.tsx`, `src/components/status-page.tsx`
- Test: `$PW/voyage.mjs` (`test_edge_light`, `test_magnet`, `test_touch_none`, `test_resize_realign`, `test_pointer_leave`)

**Interfaces:**
- Consumes: `flight`, `onTick`, `startFlight` and `anchorRect` (Task 2).
- Produces:
  - `MAGNET_RADIUS = 90`
  - `magnet(dx: number, dy: number, radius?: number, max?: number): { x: number; y: number }`
  - the markup attributes `data-catch-light` and `data-magnet`
  - the CSS variables `--lx`, `--ly`, `--lb` and `--lo`

- [ ] **Step 1: Write the failing unit tests** in `src/lib/magnet.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { MAGNET_RADIUS, magnet } from "./magnet";

describe("magnet", () => {
  test("no pull with the pointer on the centre", () => {
    expect(magnet(0, 0)).toEqual({ x: 0, y: 0 });
  });
  test("no pull at or beyond the radius", () => {
    expect(magnet(MAGNET_RADIUS, 0)).toEqual({ x: 0, y: 0 });
    expect(magnet(0, -200)).toEqual({ x: 0, y: 0 });
  });
  test("pulls toward the pointer, proportionally near the centre", () => {
    expect(magnet(10, 0).x).toBeCloseTo(3);
    expect(magnet(0, -10).y).toBeCloseTo(-3);
  });
  test("is capped at max", () => {
    const { x, y } = magnet(30, 30);
    expect(Math.hypot(x, y)).toBeLessThanOrEqual(6);
    expect(magnet(30, 0, 90, 4).x).toBeCloseTo(4);
  });
  test("releases smoothly toward the edge", () => {
    expect(magnet(80, 0).x).toBeGreaterThan(0);
    expect(magnet(80, 0).x).toBeLessThan(magnet(50, 0).x);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail.**

Run: `bun test src/lib/magnet.test.ts`
Expected: FAIL, with "Cannot find module './magnet'".

- [ ] **Step 3: Implement `src/lib/magnet.ts`.**

```ts
import { ease } from "./sky-math";

export const MAGNET_RADIUS = 90;

/** A magnetic pull toward the pointer: proportional near the centre, capped, released at the edge. */
export function magnet(dx: number, dy: number, radius = MAGNET_RADIUS, max = 6) {
  const d = Math.hypot(dx, dy);
  if (d === 0 || d >= radius) return { x: 0, y: 0 };
  const length = Math.min(d * 0.3, max) * (1 - ease(0.6 * radius, radius, d));
  return { x: (dx / d) * length, y: (dy / d) * length };
}
```

- [ ] **Step 4: Run the tests to verify they pass.**

Run: `bun test`
Expected: PASS, all green.

- [ ] **Step 5: Write the failing browser tests.** Insert above `// runner`:

```js
const lineAt = (p, sel) => p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
const vars = (p, sel) => p.$eval(sel, (e) => ({ lo: e.style.getPropertyValue("--lo"), lx: parseFloat(e.style.getPropertyValue("--lx")) }));
const tx = (p, sel) => p.$eval(sel, (e) => new DOMMatrix(getComputedStyle(e).transform).m41);
const toRow = (p) => p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));

tests.test_edge_light = async () => {
  const p = await open();
  await toRow(p);
  await p.waitForTimeout(800);
  const line = await lineAt(p, "#omsimos [data-hairline]");
  await p.mouse.move(line.x + 200, line.y + 10);
  await p.waitForTimeout(1500);
  const near = await vars(p, "#omsimos [data-hairline]");
  await p.mouse.move(line.x + 200, Math.min(line.y + 620, 895));
  await p.waitForTimeout(2500);
  const far = await vars(p, "#omsimos [data-hairline]");
  report("test_edge_light", +near.lo > 0 && near.lx >= 0 && near.lx <= line.w && +far.lo === 0, { near, far, line });
  await p.context().close();
};

tests.test_magnet = async () => {
  for (const reduced of [false, true]) {
    const p = await open(reduced ? { reducedMotion: "reduce" } : {});
    await toRow(p);
    await p.waitForTimeout(800);
    const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.move(c.x - 30, c.y);
    await p.waitForTimeout(900);
    const pulled = await tx(p, "#omsimos .visit");
    await p.mouse.move(c.x - 400, c.y + 300);
    await p.waitForTimeout(1200);
    const back = await tx(p, "#omsimos .visit");
    const ok = reduced ? pulled === 0 : pulled < -1 && Math.abs(back) < 0.5;
    report(`test_magnet ${reduced ? "reduced" : "motion"}`, ok, { pulled, back });
    await p.context().close();
  }
};

tests.test_touch_none = async () => {
  const p = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await toRow(p);
  await p.waitForTimeout(800);
  const line = await lineAt(p, "#omsimos [data-hairline]");
  await p.touchscreen.tap(line.x + 100, line.y + 5);
  await p.waitForTimeout(1000);
  const written = await p.$$eval("[data-catch-light]", (els) => els.filter((e) => e.style.getPropertyValue("--lo")).length);
  const pulled = await p.$$eval("[data-magnet]", (els) => els.filter((e) => new DOMMatrix(getComputedStyle(e).transform).m41 !== 0).length);
  report("test_touch_none", written === 0 && pulled === 0, { written, pulled });
  await p.context().close();
};

tests.test_resize_realign = async () => {
  const p = await open();
  await p.setViewportSize({ width: 1100, height: 900 });
  await p.waitForTimeout(800);
  await toRow(p);
  await p.waitForTimeout(800);
  const line = await lineAt(p, "#omsimos [data-hairline]");
  await p.mouse.move(line.x + 150, line.y + 10);
  await p.waitForTimeout(1500);
  const near = await vars(p, "#omsimos [data-hairline]");
  const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(c.x - 30, c.y);
  await p.waitForTimeout(900);
  const pulled = await tx(p, "#omsimos .visit");
  report("test_resize_realign", +near.lo > 0 && Math.abs(near.lx - 150) < 40 && pulled < -1, { near, pulled });
  await p.context().close();
};

tests.test_pointer_leave = async () => {
  const p = await open();
  await toRow(p);
  await p.waitForTimeout(800);
  const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(c.x - 30, c.y);
  await p.waitForTimeout(900);
  await p.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent("pointerleave")));
  await p.waitForTimeout(2500);
  const lit = await p.$$eval("[data-catch-light]", (els) => els.filter((e) => +e.style.getPropertyValue("--lo") > 0).length);
  const back = await tx(p, "#omsimos .visit");
  report("test_pointer_leave", lit === 0 && Math.abs(back) < 0.5, { lit, back });
  await p.context().close();
};
```

- [ ] **Step 6: Run them to verify they fail.**

Run: `cd $PW && node voyage.mjs test_edge_light test_magnet test_touch_none test_resize_realign test_pointer_leave`
Expected:
- `test_edge_light`, `test_magnet motion` and `test_resize_realign` FAIL, because nothing writes `--lo` and nothing moves yet.
- The others pass trivially. They guard behaviour the implementation must keep.

- [ ] **Step 7: Create `src/components/edge-light.tsx`.**

```tsx
"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { anchorRect, flight, onTick, startFlight } from "@/lib/flight";
import { MAGNET_RADIUS, magnet } from "@/lib/magnet";

gsap.registerPlugin(ScrollTrigger);

// Beyond this a target can't catch the light, so it isn't written to.
const REACH = 300;
const FINE = "(hover: hover) and (pointer: fine)";
// Ancestors GSAP moves while the page is live: the hero copy's drift and the page-in rise.
const MOVERS = ["[data-hero-copy]", "[data-rise]"];

type QuickTo = ReturnType<typeof gsap.quickTo>;
type Box = { el: HTMLElement; left: number; top: number; width: number; height: number; movers: HTMLElement[] };
type Lit = Box & { lx: number; ly: number; lo: number };
type Pull = Box & { x: QuickTo; y: QuickTo; ix: QuickTo | null; iy: QuickTo | null; ox: number; oy: number };

const gsapY = (el: Element) => Number(gsap.getProperty(el, "y")) || 0;
const lift = (movers: HTMLElement[]) => movers.reduce((sum, el) => sum + gsapY(el), 0);
const gap = (p: number, start: number, size: number) => Math.max(start - p, 0, p - start - size);

/** A page-space box with GSAP's offsets taken out (its own and its moving ancestors'), so it holds while they move. */
function box(el: HTMLElement): Box {
  const movers = MOVERS.map((s) => el.parentElement?.closest<HTMLElement>(s)).filter((m): m is HTMLElement => !!m);
  const r = el.getBoundingClientRect();
  return {
    el,
    movers,
    left: r.left + window.scrollX - (Number(gsap.getProperty(el, "x")) || 0),
    top: r.top + window.scrollY - gsapY(el) - lift(movers),
    // Layout size, so a hairline that is still scaling in measures at full width.
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
}

/** The cursor light catching the page's edges, and the arrows it pulls (spec §5, §6.1). */
export default function EdgeLight() {
  const pathname = usePathname();

  useEffect(() => {
    const fine = window.matchMedia(FINE);
    const pulls = new Map<HTMLElement, Pull>();
    let lit: Lit[] = [];
    let anyLit = false;
    let disposed = false;

    // Layout is read only here, never inside a tick.
    const measure = () => {
      if (disposed) return;
      flight.hero = anchorRect("hero");
      lit = [...document.querySelectorAll<HTMLElement>("[data-catch-light]")].map((el) => ({ ...box(el), lx: Number.NaN, ly: Number.NaN, lo: 0 }));
      const seen = new Set<HTMLElement>();
      document.querySelectorAll<HTMLElement>("[data-magnet]").forEach((el) => {
        seen.add(el);
        const prev = pulls.get(el);
        const icon = el.querySelector("svg");
        const tween = { duration: 0.6, ease: "power3.out" };
        pulls.set(el, {
          ...box(el),
          x: prev?.x ?? gsap.quickTo(el, "x", tween),
          y: prev?.y ?? gsap.quickTo(el, "y", tween),
          ix: prev?.ix ?? (icon ? gsap.quickTo(icon, "x", tween) : null),
          iy: prev?.iy ?? (icon ? gsap.quickTo(icon, "y", tween) : null),
          ox: prev?.ox ?? 0,
          oy: prev?.oy ?? 0,
        });
      });
      for (const el of pulls.keys()) if (!seen.has(el)) pulls.delete(el);
    };

    const darken = (t: Lit) => {
      t.el.style.setProperty("--lo", "0");
      t.lo = 0;
      t.lx = Number.NaN;
    };

    const glint = () => {
      const { light, pointer } = flight;
      if (!pointer.active && light.hover <= 0.002) {
        if (anyLit) lit.forEach((t) => t.lo && darken(t));
        anyLit = false;
        return;
      }
      anyLit = true;
      for (const t of lit) {
        const top = t.top + lift(t.movers);
        if (gap(light.x, t.left, t.width) > REACH || gap(light.y, top, t.height) > REACH) {
          if (t.lo) darken(t);
          continue;
        }
        const lx = light.x - t.left;
        const ly = light.y - top;
        if (!(Math.abs(lx - t.lx) < 0.5 && Math.abs(ly - t.ly) < 0.5)) {
          t.el.style.setProperty("--lx", `${lx.toFixed(1)}px`);
          t.el.style.setProperty("--ly", `${ly.toFixed(1)}px`);
          t.el.style.setProperty("--lb", `${(t.height - ly).toFixed(1)}px`);
          t.lx = lx;
          t.ly = ly;
        }
        if (Math.abs(light.hover - t.lo) > 0.01) {
          t.el.style.setProperty("--lo", light.hover.toFixed(3));
          t.lo = light.hover;
        }
      }
    };

    const pull = () => {
      const { pointer } = flight;
      const on = pointer.active && !flight.reduced;
      const px = pointer.x + window.scrollX;
      const py = pointer.y + flight.scroll;
      for (const m of pulls.values()) {
        let o = { x: 0, y: 0 };
        if (on) {
          const dx = px - (m.left + m.width / 2);
          const dy = py - (m.top + lift(m.movers) + m.height / 2);
          if (Math.abs(dx) < MAGNET_RADIUS && Math.abs(dy) < MAGNET_RADIUS) o = magnet(dx, dy);
        }
        if (Math.abs(o.x - m.ox) < 0.05 && Math.abs(o.y - m.oy) < 0.05) continue;
        m.ox = o.x;
        m.oy = o.y;
        m.x(o.x);
        m.y(o.y);
        m.ix?.(o.x * 0.33);
        m.iy?.(o.y * 0.33);
      }
    };

    const tick = () => {
      if (!fine.matches) return;
      glint();
      pull();
    };

    const stop = startFlight();
    measure();
    const offTick = onTick(tick);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    ScrollTrigger.addEventListener("refresh", measure);
    void document.fonts.ready.then(measure);
    return () => {
      disposed = true;
      offTick();
      stop();
      observer.disconnect();
      ScrollTrigger.removeEventListener("refresh", measure);
      for (const m of pulls.values()) gsap.set([m.el, m.el.querySelector("svg")].filter(Boolean), { x: 0, y: 0 });
    };
  }, [pathname]);

  return null;
}
```

- [ ] **Step 8: Mount it and mark the targets.**
  - `src/app/layout.tsx`: add `import EdgeLight from "@/components/edge-light";`, and render `<EdgeLight />` right after `<SmoothScroll />`.
  - `src/components/work.tsx`:
    - Add `data-catch-light` to the `data-hairline` div.
    - Add `data-catch-light data-magnet` to the `.visit` `<a>`.
    - Change the `<ol className="border-b border-white/7">` to `<ol>`.
    - Right after `</ol>`, add `<div aria-hidden="true" data-catch-light className="rule h-px" />`.
  - `src/components/hero.tsx`: add `data-catch-light data-magnet` to both `.line-link`s: the "Selected work" `ScrollLink` and the "Résumé" `<a>`.
  - `src/components/contact.tsx`:
    - Add `data-catch-light` to the `.say` `<a>`.
    - Add `data-catch-light data-magnet` to each link-list `<a className="line-link">` and to the "Back to top" `ScrollLink`.
  - `src/components/status-page.tsx`: add `data-catch-light` to the "Return home" `Link`.

- [ ] **Step 9: CSS.** In `src/app/globals.css`:

  1. Replace the `.hairline` rule with the following, and add `.rule` right after it:

```css
  .hairline {
    --line: linear-gradient(90deg, rgb(201 220 255 / 0.42), rgb(201 220 255 / 0.1) 32%, rgb(255 255 255 / 0.07) 62%);
    background-image: var(--line);
    transform-origin: left center;
  }
  .rule {
    --line: linear-gradient(rgb(255 255 255 / 0.07), rgb(255 255 255 / 0.07));
    background-image: var(--line);
  }
```

  2. In the `.visit` rule, add `position: relative;`.

  3. Move every arrow nudge from `transform` to `translate`, which leaves `transform` free for GSAP's magnets:

```bash
perl -0pi -e 's/\{ transform: translate\(2px, -2px\); \}/{ translate: 2px -2px; }/g; s/\{ transform: translateY\(3px\); \}/{ translate: 0 3px; }/g; s/\{ transform: translateY\(-3px\); \}/{ translate: 0 -3px; }/g; s/transition: transform 0\.5s var\(--ease-out-quint\);/transition: translate 0.5s var(--ease-out-quint);/g' src/app/globals.css
grep -n "transform" src/app/globals.css
```
Expected: only `transform-origin` and the `.say::after` / `flare` transforms remain.

  4. Append at the end of the file:

```css
/* Edge light: the cursor light catches these 1 px lines and rings; edge-light.tsx writes the variables. */
[data-catch-light] {
  --lx: -999px;
  --ly: -999px;
  --lb: 999px;
  --lo: 0;
}
@media (hover: hover) and (pointer: fine) {
  .hairline,
  .rule {
    background-image:
      radial-gradient(180px circle at var(--lx) var(--ly), rgb(201 220 255 / calc(0.7 * var(--lo))), transparent 70%),
      var(--line);
  }
  /* A ::before twin of the ::after rule, so the rule's own low opacity doesn't dim the glint. */
  .line-link::before,
  .say::before {
    content: "";
    position: absolute;
    inset-inline: 0;
    bottom: var(--edge);
    height: 1px;
    pointer-events: none;
    background: radial-gradient(160px circle at var(--lx) calc(var(--edge) - var(--lb)), rgb(201 220 255 / calc(0.9 * var(--lo))), transparent 70%);
  }
  .line-link::before { --edge: 9px; }
  .say::before { --edge: 0.06em; }
  /* The ring catches the light on its 1 px border only. */
  .visit::before {
    content: "";
    position: absolute;
    inset: -1px;
    padding: 1px;
    border-radius: inherit;
    pointer-events: none;
    background: radial-gradient(120px circle at var(--lx) var(--ly), rgb(201 220 255 / calc(0.8 * var(--lo))), transparent 70%);
    mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  }
}
```

- [ ] **Step 10: Run the browser tests to verify they pass.**

Run: `cd $PW && node voyage.mjs test_edge_light test_magnet test_touch_none test_resize_realign test_pointer_leave test_coast`
Expected: all PASS. `test_coast` confirms the edge light added no idle draws: the pointer isn't moved there.

- [ ] **Step 11: Look at it.** Take a hover screenshot: insert and run this test, then read `glint.png`.

```js
tests.test_glint_shot = async () => {
  const p = await open();
  await toRow(p);
  await p.waitForTimeout(800);
  const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(c.x - 60, c.y - 60);
  await p.waitForTimeout(1800);
  await p.screenshot({ path: "glint.png", clip: { x: Math.max(c.x - 500, 0), y: Math.max(c.y - 260, 0), width: 1000, height: 520 } });
  report("test_glint_shot", true, {});
  await p.context().close();
};
```
Expected:
- The hairline above the row brightens in a soft pool near the cursor.
- The visit ring brightens on its near side.
- The text is unchanged, and nothing reads as a spotlight on the background.

- [ ] **Step 12: Run the checks and commit.**

```bash
bun run lint && bun run typecheck && bun test && bun run build
git add src/lib/magnet.ts src/lib/magnet.test.ts src/components/edge-light.tsx src/app/globals.css src/app/layout.tsx src/components/work.tsx src/components/hero.tsx src/components/contact.tsx src/components/status-page.tsx
git commit -m "feat(motion): catch the cursor light on edges and pull arrows magnetically"
```

---

### Task 6: Project row hover and the section marker

**Files:**
- Create: `src/lib/sections.ts`, `src/lib/sections.test.ts`, `src/components/section-marker.tsx`
- Modify: `src/components/site-header.tsx`, `src/app/globals.css`
- Test: `$PW/voyage.mjs` (`test_row_hover`, `test_marker`)

**Interfaces:**
- Consumes: none from earlier tasks besides GSAP and ScrollTrigger.
- Produces:
  - `type SectionTops = { work: number | null; contact: number | null }`
  - `activeSection(scroll: number, viewportH: number, tops: SectionTops): "work" | "contact" | null`
  - `data-section-link="work" | "contact"` on the header links

- [ ] **Step 1: Write the failing tests** in `src/lib/sections.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { activeSection } from "./sections";

const tops = { work: 960, contact: 2400 };

describe("activeSection", () => {
  test("none in the hero", () => {
    expect(activeSection(0, 900, tops)).toBeNull();
    expect(activeSection(960 - 360 - 1, 900, tops)).toBeNull();
  });
  test("work once its top reaches 40% of the viewport", () => {
    expect(activeSection(960 - 360, 900, tops)).toBe("work");
    expect(activeSection(1800, 900, tops)).toBe("work");
  });
  test("contact once its top reaches 60% of the viewport", () => {
    expect(activeSection(2400 - 540, 900, tops)).toBe("contact");
    expect(activeSection(2400 - 541, 900, tops)).toBe("work");
  });
  test("missing sections are never active", () => {
    expect(activeSection(5000, 900, { work: null, contact: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail.**

Run: `bun test src/lib/sections.test.ts`
Expected: FAIL, with "Cannot find module './sections'".

- [ ] **Step 3: Implement `src/lib/sections.ts`.**

```ts
export type SectionTops = { work: number | null; contact: number | null };

/** The section the header marks: Contact once its top is 60% up the viewport, else Work at 40%. */
export function activeSection(scroll: number, viewportH: number, tops: SectionTops) {
  if (tops.contact !== null && tops.contact - scroll <= 0.6 * viewportH) return "contact";
  if (tops.work !== null && tops.work - scroll <= 0.4 * viewportH) return "work";
  return null;
}
```

- [ ] **Step 4: Run the tests to verify they pass.**

Run: `bun test`
Expected: PASS, all green.

- [ ] **Step 5: Write the failing browser tests.** Insert above `// runner`:

```js
tests.test_row_hover = async () => {
  const p = await open();
  await p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(800);
  const color = () => p.$eval("#omsimos [data-statement]", (e) => getComputedStyle(e).color);
  const before = await color();
  const at = await p.$eval("#omsimos [data-statement]", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + 20, y: r.y + 10 }; });
  await p.mouse.move(at.x, at.y);
  await p.waitForTimeout(900);
  const hover = await color();
  const shift = await p.$eval("#omsimos h3", (e) => getComputedStyle(e).translate);
  await p.mouse.move(5, 5);
  await p.waitForTimeout(900);
  const after = await color();
  await p.focus("#omsimos .visit");
  await p.waitForTimeout(700);
  const focused = await color();
  const ok = before === "rgb(124, 129, 139)" && hover === "rgb(161, 166, 175)" && shift.startsWith("4px") && after === before && focused === hover;
  report("test_row_hover", ok, { before, hover, shift, after, focused });
  await p.context().close();
};

tests.test_marker = async () => {
  const p = await open();
  const state = () => p.evaluate(() => ({
    current: [...document.querySelectorAll("header [aria-current]")].map((e) => e.textContent.trim()).join(),
    opacity: getComputedStyle(document.querySelector("[data-marker]")).opacity,
  }));
  const top = await state();
  await p.evaluate(() => document.querySelector("#umamin").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1200);
  const work = await state();
  await p.evaluate(() => scrollTo(0, 1e6));
  await p.waitForTimeout(1200);
  const contact = await state();
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(1200);
  const back = await state();
  const ok = top.current === "" && top.opacity === "0" && work.current === "Work" && work.opacity === "1" && contact.current === "Contact" && back.current === "" && back.opacity === "0";
  report("test_marker", ok, { top, work, contact, back });
  await p.context().close();
};
```

- [ ] **Step 6: Run them to verify they fail.**

Run: `cd $PW && node voyage.mjs test_row_hover test_marker`
Expected: both FAIL. The statement colour doesn't change, and `[data-marker]` doesn't exist.

- [ ] **Step 7: Row hover CSS.** Append to `src/app/globals.css`:

```css
/* Project row: hovering or focusing it brightens its statement; the name slides a touch. */
@media (hover: hover) and (pointer: fine) {
  [data-project] [data-statement] { transition: color 0.5s ease; }
  [data-project]:hover [data-statement] { color: var(--color-mute); }
}
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  [data-project] h3 { transition: translate 0.6s var(--ease-out-quint); }
  [data-project]:hover h3 { translate: 4px 0; }
}
[data-project]:focus-within [data-statement] { color: var(--color-mute); }
```

- [ ] **Step 8: Create `src/components/section-marker.tsx`.**

```tsx
"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { activeSection, type SectionTops } from "@/lib/sections";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Section = "work" | "contact";
const SECTIONS: Section[] = ["work", "contact"];

/** A small orb under the header link of the section in view; it glides between them. */
export default function SectionMarker() {
  const ref = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const marker = ref.current;
      const nav = marker?.parentElement;
      if (!marker || !nav) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const links = Object.fromEntries(
        SECTIONS.map((id) => [id, nav.querySelector<HTMLElement>(`[data-section-link="${id}"]`)]),
      ) as Record<Section, HTMLElement | null>;
      const centres: Record<Section, number> = { work: 0, contact: 0 };
      let tops: SectionTops = { work: null, contact: null };
      let current: Section | null = null;

      const show = (next: Section | null) => {
        if (next === current) return;
        const from = current;
        current = next;
        SECTIONS.forEach((id) => {
          if (id === next) links[id]?.setAttribute("aria-current", "true");
          else links[id]?.removeAttribute("aria-current");
        });
        if (!next) return gsap.to(marker, { opacity: 0, duration: reduced ? 0 : 0.4, overwrite: "auto" });
        // Appearing, it starts under its link; moving, it glides from the last one.
        if (!from || reduced) gsap.set(marker, { x: centres[next] });
        else gsap.to(marker, { x: centres[next], duration: 0.7, ease: "power4.out", overwrite: "auto" });
        gsap.to(marker, { opacity: 1, duration: reduced ? 0 : 0.4 });
      };

      const update = () => show(activeSection(window.scrollY, window.innerHeight, tops));
      // Layout is read only on refresh.
      const refresh = () => {
        const top = (id: string) => {
          const el = document.getElementById(id);
          return el ? el.getBoundingClientRect().top + window.scrollY : null;
        };
        tops = { work: top("work"), contact: top("contact") };
        SECTIONS.forEach((id) => {
          const link = links[id];
          if (link) centres[id] = link.offsetLeft + link.offsetWidth / 2 - marker.offsetWidth / 2;
        });
        if (current) gsap.set(marker, { x: centres[current] });
        update();
      };

      const trigger = ScrollTrigger.create({ start: 0, end: "max", onUpdate: update, onRefresh: refresh });
      refresh();
      return () => {
        trigger.kill();
        SECTIONS.forEach((id) => links[id]?.removeAttribute("aria-current"));
      };
    },
    { dependencies: [pathname] },
  );

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-marker
      className="orb-dot pointer-events-none absolute bottom-1 left-0 size-[5px] rounded-full opacity-0"
    />
  );
}
```

- [ ] **Step 9: Wire up the header.** In `src/components/site-header.tsx`:
  - Add `import SectionMarker from "@/components/section-marker";`.
  - Add `relative` to the `<nav>`'s className.
  - Add `data-section-link="work"` to the Work `ScrollLink`, and `data-section-link="contact"` to the Contact one.
  - Render `<SectionMarker />` as the nav's last child.

- [ ] **Step 10: Run the browser tests to verify they pass.**

Run: `cd $PW && node voyage.mjs test_row_hover test_marker test_nav_lands`
Expected: all PASS.

- [ ] **Step 11: Run the checks and commit.**

```bash
bun run lint && bun run typecheck && bun test && bun run build
git add src/lib/sections.ts src/lib/sections.test.ts src/components/section-marker.tsx src/components/site-header.tsx src/app/globals.css
git commit -m "feat(motion): add project row hover and the header section marker"
```

---

### Task 7: Headline blur-in

**Files:**
- Create: `src/components/words.tsx`
- Modify: `src/components/hero.tsx`, `src/components/contact.tsx`, `src/components/motion.tsx`, `src/app/globals.css`, `src/app/layout.tsx`
- Test: `$PW/voyage.mjs` (`test_blur_in`, `test_words_visible`)

**Interfaces:**
- Consumes: none from earlier tasks.
- Produces: `Words({ text }: { text: string })`, which renders `<span data-head-word class="inline-block">` per word.

- [ ] **Step 1: Write the failing browser tests.** Insert above `// runner`:

```js
tests.test_blur_in = async () => {
  const p = await open();
  const read = (sel) => p.$$eval(sel, (els) => els.map((e) => [getComputedStyle(e).filter, getComputedStyle(e).opacity]));
  const clear = (rows) => rows.length > 0 && rows.every(([f, o]) => f === "none" && o === "1");
  const hero = await read("#home [data-head-word]");
  const sayBefore = await read(".say [data-head-word]");
  await p.evaluate(() => scrollTo(0, 1e6));
  await p.waitForTimeout(2800);
  const say = await read(".say [data-head-word]");
  report("test_blur_in", hero.length === 4 && clear(hero) && sayBefore.length === 3 && sayBefore.every(([, o]) => o === "0") && clear(say), { hero, sayBefore, say });
  await p.context().close();
};

tests.test_words_visible = async () => {
  for (const opts of [{ reducedMotion: "reduce" }, { javaScriptEnabled: false }]) {
    const p = await open(opts);
    const words = await p.$$eval("[data-head-word]", (els) => els.map((e) => getComputedStyle(e).opacity));
    report(`test_words_visible ${Object.keys(opts)[0]}`, words.length === 7 && words.every((o) => o === "1"), { words });
    await p.context().close();
  }
};
```

- [ ] **Step 2: Run them to verify they fail.**

Run: `cd $PW && node voyage.mjs test_blur_in test_words_visible`
Expected: FAIL, because no `[data-head-word]` exists (lengths are 0).

- [ ] **Step 3: Create `src/components/words.tsx`.**

```tsx
import { Fragment } from "react";

/** A headline split into words for the blur-in (motion.tsx), on the server so nothing shifts. */
export function Words({ text }: { text: string }) {
  return text.split(" ").map((word, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span data-head-word className="inline-block">
        {word}
      </span>
    </Fragment>
  ));
}
```

- [ ] **Step 4: Use it.**
  - `src/components/hero.tsx`:
    - Import `{ Words }` from `@/components/words`.
    - Remove `data-rise` from the `<h1>`.
    - Make its children `<Words text="Software engineer" />{" "}<span className="block text-glow"><Words text="and designer." /></span>`.
  - `src/components/contact.tsx`:
    - Import `{ Words }`.
    - Make the `.say` link's child `<Words text="Send a signal." />`.

- [ ] **Step 5: The pre-hide and the no-JS override.**
  - In `src/app/globals.css`, change `[data-rise] { opacity: 0; }` to `[data-rise], [data-head-word] { opacity: 0; }`.
  - In `src/app/layout.tsx`, change the noscript style string to `"[data-rise],[data-head-word]{opacity:1!important}"`.

- [ ] **Step 6: The tweens.** In `src/components/motion.tsx`, replace the `// 01 Rise` block with:

```ts
        // 01 Rise: the headline resolves word by word from a soft blur, then the copy fades up line
        // by line, as the orb rises.
        const blur = { opacity: 0, y: 16, filter: "blur(10px)" };
        const clear = { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6, ease: "power4.out", clearProps: "filter" };
        const heroWords = gsap.utils.toArray<HTMLElement>("#home [data-head-word]");
        gsap
          .timeline({ delay: 0.5 })
          .fromTo(heroWords, blur, { ...clear, stagger: 0.08 }, 0)
          .fromTo(
            gsap.utils.toArray<HTMLElement>("[data-rise]"),
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 1.6, ease: "power4.out", stagger: 0.14 },
            Math.max(heroWords.length - 1, 0) * 0.08 + 0.14,
          );

        // "Send a signal." resolves once as it comes into view: a blur tied to scroll would read as
        // a rendering fault, so this one reveal isn't scrubbed.
        const sayWords = gsap.utils.toArray<HTMLElement>(".say [data-head-word]");
        if (sayWords.length) {
          gsap.fromTo(sayWords, blur, {
            ...clear,
            stagger: 0.1,
            scrollTrigger: { trigger: sayWords[0], start: "top 85%", once: true },
          });
        }
```

- [ ] **Step 7: Run the browser tests to verify they pass.**

Run: `cd $PW && node voyage.mjs test_blur_in test_words_visible test_magnet test_edge_light && node motion-check.mjs`
Expected:
- every voyage test passes
- `motion-check.mjs` prints `errors []`, `reduced { dim: 0, hidden: 0, … }` and `nojs { dim: 0, hidden: 0 }`

- [ ] **Step 8: Run the checks and commit.**

```bash
bun run lint && bun run typecheck && bun test && bun run build
git add src/components/words.tsx src/components/hero.tsx src/components/contact.tsx src/components/motion.tsx src/app/globals.css src/app/layout.tsx
git commit -m "feat(motion): blur the headlines in word by word"
```

---

### Task 8: Production verification

**Files:**
- Test: `$PW/voyage.mjs` (`test_frames`, `test_firefox`, `test_mobile_width`)
- Modify: nothing, unless a check fails. Any fix gets a RED→GREEN test and its own commit.

- [ ] **Step 1: Add the production checks.** Insert above `// runner`:

```js
const frameProbe = () => {
  window.__dts = [];
  window.__cls = 0;
  let last = 0;
  const loop = (t) => {
    if (last) window.__dts.push(t - last);
    last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
};

tests.test_frames = async () => {
  const p = await open({}, frameProbe);
  await p.mouse.move(720, 450);
  await p.evaluate(() => (window.__dts = []));
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (const dir of [1, -1]) {
    for (let i = 0; i < 400; i++) {
      await p.mouse.wheel(0, 120 * dir);
      await p.waitForTimeout(16);
      const y = await p.evaluate(() => scrollY);
      if ((dir > 0 && y >= max - 1) || (dir < 0 && y <= 0)) break;
    }
  }
  const { dts, cls } = await p.evaluate(() => ({ dts: window.__dts, cls: window.__cls }));
  const s = [...dts].sort((x, y) => x - y);
  const p95 = s[Math.floor(s.length * 0.95)];
  const over50 = s.filter((d) => d > 50).length;
  report("test_frames", p95 <= 17 && over50 === 0 && cls < 0.05, { frames: s.length, p95: +p95.toFixed(2), over50, cls: +cls.toFixed(4) });
  await p.context().close();
};

tests.test_firefox = async () => {
  const ff = await firefox.launch();
  const p = await ff.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto(URL);
  await p.waitForTimeout(3500);
  const cls = await p.evaluate(() => document.documentElement.className);
  await p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1000);
  const line = await p.$eval("#omsimos [data-hairline]", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y }; });
  await p.mouse.move(line.x + 200, line.y + 10);
  await p.waitForTimeout(1500);
  const lo = await p.$eval("#omsimos [data-hairline]", (e) => +e.style.getPropertyValue("--lo"));
  const current = await p.evaluate(() => [...document.querySelectorAll("header [aria-current]")].map((e) => e.textContent.trim()).join());
  const sky = await p.evaluate(() => document.documentElement.dataset.sky);
  report("test_firefox", errors.length === 0 && cls.includes("lenis") && lo > 0 && current === "Work" && sky === "css", { errors, cls, lo, current, sky });
  await ff.close();
};

tests.test_mobile_width = async () => {
  const p = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  for (const y of [600, 1200, 1800, 2400, 1e6]) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(400);
  }
  const width = await p.evaluate(() => document.documentElement.scrollWidth);
  report("test_mobile_width", width === 390 && p.errors.length === 0, { width, errors: p.errors });
  await p.context().close();
};
```

- [ ] **Step 2: Build and serve production on port 3100** in a second right-hand pane.

```bash
herdr pane split --current --direction right --ratio 0.4 --cwd /Users/hyamero/Documents/Projects/personal/portfolio --no-focus
# note the pane_id as $PROD
herdr pane run $PROD 'bun run build && bun run start -p 3100'
curl -sf --retry 120 --retry-delay 1 --retry-connrefused -o /dev/null http://localhost:3100/ && echo up
```
Expected: `up`.

- [ ] **Step 3: Run the whole suite against production.**

Run: `cd $PW && URL=http://localhost:3100/ node voyage.mjs`
Expected: every test PASSes, including `test_frames` (p95 ≤ 17 ms, 0 over 50 ms, CLS < 0.05), `test_firefox` and `test_mobile_width`.

Then read `story-*.png`, `glint.png` and `baseline-rise-1440.png` once more, against spec §2.1.

- [ ] **Step 4: Run every check.**

```bash
bun run lint && bun run typecheck && bun test && bunx vgpu check src/components/sky/sky.wgsl --require-validation && bun run build
```
Expected: all green.

- [ ] **Step 5: Close both server panes.**

```bash
herdr pane close $PROD
herdr pane close $DEV
```
