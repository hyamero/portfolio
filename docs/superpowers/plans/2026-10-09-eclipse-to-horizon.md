# Eclipse to Horizon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The hero opens on board 09. Scrolling flies the camera into the eclipse until it becomes board 02's horizon, which then settles low and stays for the rest of the page while the content rises from behind it.

**Architecture:**
- **Pure camera maths** in `src/lib/eclipse.ts`, unit-tested:
  - the body's frame from four channels, and the settle;
  - the reduced-motion still frames;
  - the halo and glare sizes;
  - the timeline's keyframes.
- **Timeline:** `motion.tsx` scrubs those channels on `flight.eclipse` with one ScrollTrigger timeline across the hero's runway.
- **Renderer:** `renderer.ts` turns the channels into uniforms each tick.
- **Shader:** `sky.wgsl` draws the body, blending board 09's layers into board 02's. It draws it twice: once behind the page, and once in a front pass that draws only the ground, over the content.
- **Browser checks:** Playwright scripts in the scratchpad.

**Tech Stack:** Next.js 16.3, React 19.3, Tailwind CSS 4, GSAP 3.15 (ScrollTrigger, `@gsap/react`), Lenis 1.3, vgpu 0.5 (WGSL), bun 1.3 (`bun test`), TypeScript 5.9, oxlint, Playwright 1.63 (scratchpad only).

**Spec:** `docs/superpowers/specs/2026-10-09-eclipse-to-horizon-design.md`. Read it first, with the two specs it builds on: `docs/superpowers/specs/2026-10-07-portfolio-redesign-design.md` and `docs/superpowers/specs/2026-10-07-motion-and-light-design.md`.

**Pre-checked:** every code block below was built, unit-tested and run in Chromium (WebGPU) and Firefox in a scratch copy of the repo before the plan was written.
- **Results:** 25 unit tests in `eclipse.test.ts` and 28 browser checks in `eclipse.mjs` passed.
- **Shader:** `bunx vgpu check --require-validation` passed.
- **Suite:** with Task 6's edits applied, the existing `voyage.mjs` suite passes too.
- **On a mismatch:** if a step's output differs from its Expected line, the code is the first suspect only when it differs from this plan.

## Global Constraints

- **Tooling:** bun 1.3.14, Node 24.x, TypeScript 5.9. Don't upgrade TypeScript.
- **Dependencies:** no new ones.
- **Git:**
  - Work on `feat/eclipse-horizon`.
  - Commits are Conventional Commits with a subject line only: no body and no `Co-Authored-By`.
  - After each commit, say what was committed and to which branch.
  - Never push without the owner's explicit yes to "push to `feat/eclipse-horizon`?".
- **Code comments:** technical and necessary only. Comment the non-obvious why.
- **No layout reads in a tick.** The sky and the edge light measure only on resize, refresh, load and font load.
- **Sky budget:** unchanged. Both canvases use `skyDpr`: at most 2.2 M device pixels and a DPR of 1.25 or less.
- **What scroll may change:** `transform`, `opacity`, the sky's uniforms, the edge light's custom properties, and the front canvas's `visibility` and `clip-path`.
- **Reduced motion:** no runway, camera, settle or front layer. The still eclipse scrolls away, and a still horizon sits at Contact.
- **No WebGPU:** the CSS eclipse and CSS horizon, both still, Contact's CSS horizon, and no reveal.
- **No JS:** the statement's words are visible through the existing `<noscript>` rule.
- **Tuning values:** `CAMERA_KEYS`, `REST` and the halo extents are starting values from the spec. A tuning change needs the owner's eye and its own commit.
- **Shader check:** `bunx vgpu check src/components/sky/sky.wgsl --require-validation` passes.
- **End of every task:** `bun run lint`, `bun run typecheck`, `bun test` and `bun run build` pass.
- **Dev server:**
  - Tasks 2–5 test against `http://localhost:3000`.
  - The owner often keeps `bun dev` running in a pane. Check with `curl -sf -o /dev/null http://localhost:3000/ && echo up` first.
  - If nothing answers, start one in a pane on the right:
    - `herdr pane split --current --direction right --ratio 0.4 --cwd /Users/hyamero/Documents/Projects/personal/portfolio --no-focus` (note the `pane_id` as `$DEV`)
    - `herdr pane run $DEV 'bun dev'`
    - `curl -sf --retry 60 --retry-delay 1 --retry-connrefused -o /dev/null http://localhost:3000/ && echo up`
  - Read panes with `--source visible`, and close any pane you opened when you're done.
- **Playwright home:** `PW=/private/tmp/claude-501/-Users-hyamero-Documents-Projects-personal-portfolio/4bb137b1-3a96-4a38-973b-8391f318066e/scratchpad/pw`.
  - It has `playwright@1.63`, `pngjs`, Chromium and Firefox, and the older suite `voyage.mjs`.
  - If it's missing, recreate it: `mkdir -p $PW && cd $PW && bun init -y && bun add playwright@1.63 pngjs && bunx playwright install chromium firefox`. Then `voyage.mjs` has to come from the motion plan, `docs/superpowers/plans/2026-10-07-motion-and-light.md`.
  - This plan's checks live in `$PW/eclipse.mjs`.
  - Run them with `cd $PW && node eclipse.mjs <test names>`. `URL` defaults to `http://localhost:3000/`.

## Review Focus

1. **Loading mid-page** (a refresh in Work, or `/#umamin`):
   - The horizon is already at rest and the ground is showing.
   - The sky goes idle at once.
   - Pinned by `test_load_mid_page` (Task 5).
2. **Resizing the window at rest:**
   - The ground's canvas and its hit area follow the new size.
   - The rim stays at 86% of the new height.
   - Pinned by `test_resize_rest` (Task 5).
3. **Switching reduced motion mid-page:**
   - The ground hides and the still frame takes over.
   - Switching back, the ground shows exactly when the scroll is past the runway.
   - Pinned by `test_reduced_toggle` (Task 5).
   - Switching back also jumps the page to the top: Lenis is re-created at 0. The live site already does this, so it's out of scope here.
4. **A page without the hero** (the 404 page):
   - The maths stays finite, there's no body and no ground, and there are no console errors.
   - Pinned by `bodyFrame`'s "gives finite numbers on a page without an eclipse box" (Task 1) and `test_not_found` (Task 5).
5. **The GPU lost while the ground shows:**
   - Both canvases go, and the CSS sky comes back.
   - Pinned by `test_device_loss_front` (Task 5).

---

### Task 1: The camera's geometry

**Files:**
- Create: `src/lib/eclipse.ts`
- Test: `src/lib/eclipse.test.ts`

**Interfaces:**
- Consumes: `clamp`, `ease` and `Rect` from `src/lib/sky-math.ts`.
- Produces:
  - `type Vec = readonly [number, number]`
  - `type Camera = { zoom: number; pan: number; level: number; morph: number }`
  - `type Body = { C: Vec; R: number; B: Vec }`
  - `type End = Body & { phi: number }`
  - `PHI0: number` (3π/4) and `REST: number` (0.86)
  - `startFrame(box: Rect, heroTop: number): Body`
  - `endFrame(W: number, H: number): End`
  - `bodyFrame(cam: Camera, start: Body, end: End): Body`
  - `settleFrame(body: Body, scroll: number, end: number, H: number): { body: Body; s: number }`
  - `stillFrame(start: Body, rects: { hero: Rect; work: Rect; contact: Rect }, W: number, H: number, scroll: number): { body: Body; morph: number }`
  - `haloFrame(m: number, R: number): { ring: number; glow: number; haze: number; rays: number }`
  - `sunFrame(m: number, W: number): { core: number; glare: number; streakH: number; streakV: number }`
  - `beadFlash(intro: number): number`
  - `CAMERA_KEYS: { zoom | pan | level | morph: { start: number; end: number; ease: string } }`
  - `COPY_OUT: { end: 0.3; lift: 90 }`
  - `addCameraTweens(tl: { to(target: object, vars: Record<string, unknown>, position?: number): unknown }, cam: Camera): void`
- All positions are viewport CSS px, y down. The renderer adds `scroll` before upload.

- [ ] **Step 1: Write the failing tests.** Create `src/lib/eclipse.test.ts`:

```ts
import { describe, expect, test } from "bun:test";
import gsap from "gsap";

import {
  addCameraTweens,
  beadFlash,
  bodyFrame,
  CAMERA_KEYS,
  endFrame,
  haloFrame,
  PHI0,
  REST,
  settleFrame,
  startFrame,
  stillFrame,
  sunFrame,
  type Camera,
  type Vec,
} from "./eclipse";
import type { Rect } from "./sky-math";

// Board 09 at 1440 × 900: a 403.2 px eclipse box centred at (1096, 500).
const box: Rect = { left: 894.4, top: 298.4, width: 403.2, height: 403.2 };
const at = (zoom: number, pan: number, level: number): Camera => ({ zoom, pan, level, morph: 0 });
const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("startFrame", () => {
  test("sits on the eclipse box, with the bead 135° round its edge", () => {
    const s = startFrame(box, 0);
    expect(s.C[0]).toBeCloseTo(1096);
    expect(s.C[1]).toBeCloseTo(500);
    expect(s.R).toBeCloseTo(201.6);
    expect(Math.atan2(s.C[1] - s.B[1], s.B[0] - s.C[0])).toBeCloseTo(PHI0);
    expect(dist(s.B, s.C)).toBeCloseTo(s.R);
  });
  test("measures from the hero's top", () => {
    expect(startFrame({ ...box, top: box.top + 50 }, 50).C[1]).toBeCloseTo(500);
  });
});

describe("endFrame", () => {
  for (const [W, H] of [
    [1440, 900],
    [390, 844],
  ]) {
    test(`is board 02's horizon at ${W} × ${H}`, () => {
      const e = endFrame(W, H);
      expect(e.R).toBeCloseTo((25 / 6) * W);
      expect(e.C[0]).toBeCloseTo(W / 2);
      expect(e.C[1] - e.R).toBeCloseTo(0.64 * H);
      expect(e.B[0]).toBeCloseTo(0.38 * W);
      expect(dist(e.B, e.C)).toBeCloseTo(e.R, 6);
    });
  }
  test("puts the sun 2.5 px below the apex at 1440, at 91.65°", () => {
    const e = endFrame(1440, 900);
    expect(e.B[1] - 0.64 * 900).toBeCloseTo(2.49, 1);
    expect((e.phi * 180) / Math.PI).toBeCloseTo(91.65, 2);
  });
});

describe("bodyFrame", () => {
  const start = startFrame(box, 0);
  const end = endFrame(1440, 900);
  test("all channels at 0 are board 09, and all at 1 are board 02", () => {
    const a = bodyFrame(at(0, 0, 0), start, end);
    expect(dist(a.C, start.C)).toBeLessThan(1e-6);
    expect(a.R).toBeCloseTo(start.R, 9);
    const b = bodyFrame(at(1, 1, 1), start, end);
    expect(dist(b.C, end.C) / end.R).toBeLessThan(1e-6);
    expect(b.R).toBeCloseTo(end.R, 6);
    expect(dist(b.B, end.B)).toBeLessThan(1e-6);
  });
  test("keeps the bead on the edge", () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 100; i++) {
      const f = bodyFrame(at(rnd(), rnd(), rnd()), start, end);
      expect(Math.abs(dist(f.B, f.C) - f.R) / f.R).toBeLessThan(1e-9);
    }
  });
  test("zooms on a log scale: equal steps multiply the radius by the same factor", () => {
    const r = [0, 0.25, 0.5, 0.75, 1].map((z) => bodyFrame(at(z, 0, 0), start, end).R);
    for (let i = 1; i < r.length - 1; i++) expect(r[i + 1] / r[i]).toBeCloseTo(r[i] / r[i - 1], 9);
  });
  test("moves smoothly: a 0.001 step moves the bead less than 1 px and the radius less than 0.5%", () => {
    for (const [W, H, b] of [
      [1440, 900, box],
      [390, 844, { left: 85, top: 170, width: 220, height: 220 }],
    ] as const) {
      const s = startFrame(b, 0);
      const e = endFrame(W, H);
      for (let k = 0; k < 1000; k++) {
        const v = k / 1000;
        const p = bodyFrame(at(v, v, v), s, e);
        const q = bodyFrame(at(v + 0.001, v + 0.001, v + 0.001), s, e);
        expect(dist(p.B, q.B)).toBeLessThan(1);
        expect(Math.abs(q.R / p.R - 1)).toBeLessThan(0.005);
      }
    }
  });
  test("gives finite numbers on a page without an eclipse box", () => {
    const none = startFrame({ left: 0, top: 0, width: 0, height: 0 }, 0);
    const f = bodyFrame(at(0.5, 0.5, 0.5), none, end);
    expect([f.C[0], f.C[1], f.R, f.B[0], f.B[1]].every(Number.isFinite)).toBe(true);
  });
});

describe("settleFrame", () => {
  const H = 900;
  const end = 960;
  const hold = endFrame(1440, H);
  const apex = (scroll: number) => {
    const f = settleFrame(hold, scroll, end, H).body;
    return f.C[1] - f.R;
  };
  test("leaves the body alone before the runway's end", () => {
    expect(apex(0)).toBeCloseTo(0.64 * H);
    expect(apex(end)).toBeCloseTo(0.64 * H);
    expect(settleFrame(hold, end - 100, end, H).s).toBe(0);
  });
  test("reaches the rest line one screen past the end, and stays", () => {
    expect(apex(end + H)).toBeCloseTo(REST * H);
    expect(apex(end + 5 * H)).toBeCloseTo(REST * H);
    expect(settleFrame(hold, end + H, end, H).s).toBe(1);
  });
  test("starts at 0.44× the scroll's speed, slows to a stop and never moves up", () => {
    expect(apex(end + 1) - apex(end)).toBeCloseTo(0.44, 2);
    let last = apex(end);
    for (let y = end + 5; y <= end + 1.2 * H; y += 5) {
      const a = apex(y);
      expect(a - last).toBeGreaterThanOrEqual(0);
      expect((a - last) / 5).toBeLessThanOrEqual(0.441);
      last = a;
    }
  });
  test("waits until the timeline reports where the runway ends", () => {
    expect(settleFrame(hold, 5000, Number.POSITIVE_INFINITY, H).s).toBe(0);
  });
  test("moves the sun with the body", () => {
    const f = settleFrame(hold, end + H, end, H).body;
    expect(f.B[1] - hold.B[1]).toBeCloseTo((REST - 0.64) * H);
  });
});

describe("stillFrame", () => {
  const W = 1440;
  const H = 900;
  const start = startFrame(box, 0);
  const rects = {
    hero: { left: 0, top: 0, width: W, height: 960 },
    work: { left: 0, top: 960, width: W, height: 1400 },
    contact: { left: 0, top: 2360, width: W, height: 820 },
  };
  test("keeps the eclipse in the hero, scrolling with the page", () => {
    const f = stillFrame(start, rects, W, H, 120);
    expect(f.morph).toBe(0);
    expect(f.body.C[1]).toBeCloseTo(500 - 120);
    expect(f.body.R).toBeCloseTo(201.6);
  });
  test("rests the horizon where Contact's ends, past the middle of Work", () => {
    const bottom = 3180 - H;
    const f = stillFrame(start, rects, W, H, bottom);
    expect(f.morph).toBe(1);
    expect(f.body.C[1] - f.body.R).toBeCloseTo(2360 + 0.85 * 820 - bottom);
    expect(f.body.B[0]).toBeCloseTo(0.38 * W);
  });
  test("switches while neither is in view", () => {
    const phone = {
      hero: { left: 0, top: 0, width: 390, height: 900 },
      work: { left: 0, top: 900, width: 390, height: 1600 },
      contact: { left: 0, top: 2500, width: 390, height: 640 },
    };
    for (const [w, h, rs, b] of [
      [1440, 900, rects, box],
      [390, 844, phone, { left: 85, top: 170, width: 220, height: 220 }],
    ] as const) {
      const s = startFrame(b, 0);
      const flip = rs.work.top + rs.work.height / 2 - h / 2;
      const before = stillFrame(s, rs, w, h, flip - 1);
      const after = stillFrame(s, rs, w, h, flip + 1);
      expect(before.morph).toBe(0);
      expect(after.morph).toBe(1);
      // The eclipse's haze reaches 2.4 R past its edge; the horizon's bloom, 170 px above its rim.
      expect(before.body.C[1] + 3.4 * before.body.R).toBeLessThan(0);
      expect(after.body.C[1] - after.body.R - 170).toBeGreaterThan(h);
    }
  });
});

describe("haloFrame and sunFrame", () => {
  test("start at board 09's sizes and end at board 02's", () => {
    const a = haloFrame(0, 200);
    expect(a.ring).toBeCloseTo(36);
    expect(a.glow).toBeCloseTo(240);
    expect(a.haze).toBeCloseTo(480);
    expect(a.rays).toBe(1);
    const b = haloFrame(1, 6000);
    expect(b.ring).toBeCloseTo(22);
    expect(b.glow).toBeCloseTo(100);
    expect(b.haze).toBeCloseTo(100);
    expect(b.rays).toBe(0);
    expect(sunFrame(0, 1440)).toEqual({ core: 5, glare: 120, streakH: 200, streakV: 150 });
    const s = sunFrame(1, 1440);
    expect(s.core).toBeCloseTo(3);
    expect(s.glare).toBeCloseTo(60);
    expect(s.streakH).toBeCloseTo(560);
    expect(s.streakV).toBeCloseTo(70);
  });
  test("move one way between the two", () => {
    let last = haloFrame(0, 1000);
    for (let i = 1; i <= 20; i++) {
      const h = haloFrame(i / 20, 1000);
      expect(h.ring).toBeLessThanOrEqual(last.ring);
      expect(h.glow).toBeLessThanOrEqual(last.glow);
      expect(h.haze).toBeLessThanOrEqual(last.haze);
      expect(h.rays).toBeLessThanOrEqual(last.rays);
      last = h;
    }
  });
  test("lose the rays by halfway", () => {
    expect(haloFrame(0.5, 1000).rays).toBe(0);
  });
});

describe("beadFlash", () => {
  test("stays dark through the first half of the intro, flashes at 0.8 and settles at 1", () => {
    expect(beadFlash(0)).toBeCloseTo(0, 6);
    expect(beadFlash(0.5)).toBeCloseTo(0, 5);
    expect(beadFlash(0.8)).toBeGreaterThanOrEqual(1.4);
    expect(Math.abs(beadFlash(1) - 1)).toBeLessThan(0.01);
  });
});

describe("CAMERA_KEYS", () => {
  // GSAP keeps its own bookkeeping on a tweened object, so compare the channels by name.
  const CHANNELS = ["zoom", "pan", "level", "morph"] as const;
  const build = () => {
    const cam: Camera = { zoom: 0, pan: 0, level: 0, morph: 0 };
    const tl = gsap.timeline({ paused: true });
    addCameraTweens(tl, cam);
    return { cam, tl };
  };
  test("make a timeline of length 1", () => {
    const { tl } = build();
    expect(tl.duration()).toBeCloseTo(1);
    tl.kill();
  });
  test("put every channel at 0 at the start and at 1 from 0.85 on", () => {
    const { cam, tl } = build();
    tl.progress(0);
    for (const key of CHANNELS) expect(cam[key]).toBe(0);
    for (const p of [0.85, 1]) {
      tl.progress(p);
      for (const key of CHANNELS) expect(cam[key]).toBeCloseTo(1, 9);
    }
    tl.kill();
  });
  test("hold pan, level and morph at 0 until their start, and never run a channel backwards", () => {
    const { cam, tl } = build();
    const last = { zoom: 0, pan: 0, level: 0, morph: 0 };
    for (let i = 0; i <= 200; i++) {
      const p = i / 200;
      tl.progress(p);
      for (const key of CHANNELS) {
        if (p < CAMERA_KEYS[key].start) expect(cam[key]).toBe(0);
        expect(cam[key]).toBeGreaterThanOrEqual(last[key]);
        last[key] = cam[key];
      }
    }
    tl.kill();
  });
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `bun test src/lib/eclipse.test.ts`
Expected: FAIL, `Cannot find module './eclipse'`.

- [ ] **Step 3: Write the module.** Create `src/lib/eclipse.ts`:

```ts
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
// 02's 12,000 px circle at 1440 px wide.
const RADIUS_PER_WIDTH = 25 / 6;

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

/** Each halo layer's reach past the edge (px), from board 09's (a share of R) to 02's, and the rays' strength (spec §5.3). */
export function haloFrame(m: number, R: number) {
  return { ring: geo(0.18 * R, 22, m), glow: geo(1.2 * R, 100, m), haze: geo(2.4 * R, 100, m), rays: 1 - ease(0, 0.5, m) };
}

/** The bead's glare in px, a camera effect that doesn't scale with the zoom, becoming 02's sun (spec §5.3). */
export function sunFrame(m: number, W: number) {
  return { core: geo(5, 3, m), glare: geo(120, 60, m), streakH: geo(200, (560 * W) / 1440, m), streakV: geo(150, 70, m) };
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
```

- [ ] **Step 4: Run the tests to see them pass.**

Run: `bun test src/lib/eclipse.test.ts`
Expected: 25 pass, 0 fail.

- [ ] **Step 5: Run the checks.**

Run: `bun run lint && bun run typecheck && bun test && bun run build`
Expected: all green.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/eclipse.ts src/lib/eclipse.test.ts
git commit -m "feat(sky): add the eclipse camera's geometry"
```

---

### Task 2: The hero: board 09's statement, the eclipse box and the runway

**Files:**
- Modify: `src/components/hero.tsx` (replace the file)
- Modify: `src/components/sky/fallback.tsx` (replace the file)
- Modify: `src/app/globals.css`
- Modify: `src/components/site-header.tsx:17`
- Test: `$PW/eclipse.mjs` (new): `test_hero_layout`, `test_css_story`

**Interfaces:**
- Consumes: `parseStatement` from `src/lib/statement.ts`.
- Produces:
  - **DOM:**
    - `#home` holds a stage and `[data-runway]`.
    - The stage holds `[data-hero-copy]` (the h1 and the "Start here" nav) and the eclipse box `[data-sky-anchor="eclipse"]`.
    - The runway is one `svh` tall, hidden under reduced motion.
    - The h1 has 19 `[data-head-word]` spans. The last is "EU", holding a `.sr-only` "." and a `.full-stop`.
  - **Fallback components:** `fallback.tsx` exports `HeroStars`, `EclipseSky`, `HorizonSky`, `ContactSky` and `SkyGrain`. `HeroSky` is gone.
  - **CSS:** `globals.css` adds `.eclipse-mark`, `.full-stop`, the keyframes `breathe`, `bead` and `glint`, and the utilities `animate-breathe`, `animate-bead` and `animate-glint`. `animate-flare` is gone.

- [ ] **Step 1: Write the browser tests.** Create `$PW/eclipse.mjs`:

```js
// Browser checks for the eclipse-to-horizon hero (docs/superpowers/specs/2026-10-09-eclipse-to-horizon-design.md).
// Run: cd $PW && URL=http://localhost:3000/ node eclipse.mjs [test names]
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
  await p.waitForTimeout(4000);
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
const jump = async (p, y, wait = 2500) => {
  await p.evaluate((v) => scrollTo(0, v), y);
  await settle(p);
  await p.waitForTimeout(wait);
};
const shot = async (p, opts) => PNG.sync.read(await p.screenshot(opts));
const lum = (r, g, bl) => {
  const f = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
};
const at = (img, x, y) => {
  const i = (Math.round(y) * img.width + Math.round(x)) * 4;
  return lum(img.data[i], img.data[i + 1], img.data[i + 2]);
};
// The brightest pixel in column x between rows y0 and y1, in CSS px (screenshots are at DPR 1).
const brightestInColumn = (img, x, y0, y1) => {
  let best = { y: -1, l: -1 };
  for (let y = Math.round(y0); y <= Math.round(y1); y++) {
    const l = at(img, x, y);
    if (l > best.l) best = { y, l };
  }
  return best;
};
// The sun's column: its vertical flare and core make the tallest run of saturated pixels near the rim.
const sunColumn = (img, y0, y1) => {
  let best = { x: -1, n: -1 };
  for (let x = 0; x < img.width; x++) {
    let n = 0;
    for (let y = Math.round(y0); y <= Math.round(y1); y++) if (at(img, x, y) >= 0.98) n++;
    if (n > best.n) best = { x, n };
  }
  return best;
};
// Hides the page's content so only the sky (both canvases) is left to measure.
const skyOnly = (p) => p.addStyleTag({ content: "main, header { visibility: hidden !important; }" });
const geometry = (p) =>
  p.evaluate(() => {
    const box = document.querySelector('[data-sky-anchor="eclipse"]').getBoundingClientRect();
    const runway = document.querySelector("[data-runway]");
    return {
      W: innerWidth,
      H: innerHeight,
      C: [box.x + box.width / 2, box.y + scrollY + box.height / 2],
      R: box.width / 2,
      end: document.querySelector("#home").offsetHeight - innerHeight,
      runway: runway ? runway.getBoundingClientRect().height : -1,
    };
  });

tests.test_hero_layout = async () => {
  for (const [w, h, cx, cy, size] of [[1440, 900, 1096, 500, 403.2], [390, 844, 195, null, 220]]) {
    const p = await open({ viewport: { width: w, height: h } });
    const g = await geometry(p);
    const words = await p.$$eval("#home h1 [data-head-word]", (els) => els.map((e) => e.textContent));
    const stop = await p.$eval("#home h1 [data-head-word]:last-child", (e) => !!e.querySelector(".full-stop") && e.querySelector(".sr-only")?.textContent === ".");
    const above = await p.evaluate(() => document.querySelector('[data-sky-anchor="eclipse"]').getBoundingClientRect().bottom <= document.querySelector("#home h1").getBoundingClientRect().top);
    const pageWidth = await p.evaluate(() => document.documentElement.scrollWidth);
    const ok =
      Math.abs(g.C[0] - cx) < 1.5 && (cy === null || Math.abs(g.C[1] - cy) < 1.5) && Math.abs(2 * g.R - size) < 1 &&
      g.runway === h && words.length === 19 && words[18] === "EU." && stop && (w > 1000 || above) && pageWidth === w && p.errors.length === 0;
    report(`test_hero_layout ${w}`, ok, { C: g.C, R: g.R, runway: g.runway, words: words.length, last: words[18], stop, above, pageWidth, errors: p.errors });
    await p.context().close();
  }
  const p = await open({ reducedMotion: "reduce" });
  const g = await geometry(p);
  report("test_hero_layout reduced", g.runway === 0, { runway: g.runway });
  await p.context().close();
};

tests.test_css_story = async () => {
  const ff = await firefox.launch();
  const p = await ff.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto(URL);
  await p.waitForTimeout(3500);
  const sky = await p.evaluate(() => document.documentElement.dataset.sky);
  await p.addStyleTag({ content: "main > section:first-child [data-hero-copy], header { visibility: hidden !important; }" });
  const g = await geometry(p);
  const rest = await shot(p);
  const centre = at(rest, g.C[0], g.C[1]);
  const edge = at(rest, g.C[0] + g.R + 1, g.C[1]);
  await p.evaluate((v) => scrollTo(0, v), g.end);
  await p.waitForTimeout(1500);
  const hold = await shot(p);
  const sun = sunColumn(hold, 0.64 * 900 - 40, 0.64 * 900 + 40);
  await p.screenshot({ path: "css-hold-1440.png" });
  report("test_css_story", sky === "css" && centre < 0.01 && edge > 0.3 && Math.abs(sun.x - 0.38 * 1440) < 4 && errors.length === 0, { sky, centre, edge, sun, errors });
  await ff.close();
};

// runner
for (const [name, fn] of Object.entries(tests)) if (!only.length || only.includes(name)) await fn();
await b.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: Run them to see them fail.**

Run: `cd $PW && node eclipse.mjs test_hero_layout test_css_story`
Expected: the script stops with `TypeError: Cannot read properties of null (reading 'getBoundingClientRect')`. There's no eclipse box yet.

- [ ] **Step 3: Write the hero.** Replace `src/components/hero.tsx` with:

```tsx
import { Fragment } from "react";

import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { EclipseSky, HeroStars, HorizonSky } from "@/components/sky/fallback";
import { siteConfig } from "@/lib/site";
import { parseStatement } from "@/lib/statement";

/** Board 09's statement; `*…*` marks emphasis, punctuation inside (see parseStatement). */
const STATEMENT =
  "I’m *Dale Bañares,* a *software engineer and designer* based in the Philippines, working mostly with teams across the EU";

export default function Hero() {
  const words = parseStatement(STATEMENT);
  return (
    <section id="home" data-sky-anchor="hero" className="relative overflow-hidden">
      <HeroStars />
      <div className="px-gutter mx-auto flex min-h-[880px] max-w-[1440px] flex-wrap-reverse items-center justify-between gap-x-16 gap-y-10 pt-[120px] pb-20 md:min-h-[960px]">
        <div data-hero-copy className="relative z-1 max-w-[740px] min-w-0 flex-[1_1_560px]">
          <h1 className="text-[clamp(1.875rem,3.4vw,3rem)] leading-[1.16] font-normal tracking-[-0.045em] text-pretty text-dim">
            {words.map((word, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span data-head-word className={word.emphasis ? "inline-block font-medium text-ink" : "inline-block"}>
                  {word.text}
                  {/* The full stop rides in the last word's box, so it never wraps alone. */}
                  {i === words.length - 1 && (
                    <>
                      <span className="sr-only">.</span>
                      <span aria-hidden="true" className="full-stop" />
                    </>
                  )}
                </span>
              </Fragment>
            ))}
          </h1>
          <nav data-rise aria-label="Start here" className="mt-8 flex flex-wrap gap-x-9 gap-y-1 text-base tracking-tight">
            <ScrollLink to="work" className="line-link" data-catch-light data-magnet>
              Selected work <Arrow dir="s" size={16} />
            </ScrollLink>
            <a
              className="line-link"
              data-catch-light
              data-magnet
              href={siteConfig.links.resume}
              target="_blank"
              rel="noopener noreferrer"
            >
              Résumé <Arrow dir="ne" size={15} />
            </a>
            <a className="line-link" data-catch-light data-magnet href={siteConfig.links.email}>
              Email <Arrow dir="ne" size={15} />
            </a>
          </nav>
        </div>
        <div aria-hidden="true" className="flex min-h-[clamp(320px,40vw,600px)] flex-[1_1_400px] items-center justify-center">
          <div data-sky-anchor="eclipse" className="relative aspect-square w-[clamp(220px,28vw,480px)]">
            <EclipseSky />
          </div>
        </div>
      </div>
      {/* The runway: a screen of sky for the camera move. Without motion there's no move to make. */}
      <div data-runway aria-hidden="true" className="relative h-svh overflow-hidden motion-reduce:hidden">
        <HorizonSky />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write the CSS sky's eclipse and horizon.** Replace `src/components/sky/fallback.tsx` with:

```tsx
import type { CSSProperties } from "react";

const mask = (image: string): CSSProperties => ({
  WebkitMaskImage: image,
  maskImage: image,
});

/** [left %, top px, size px, twinkle delay s] */
type Star = readonly [number, number, number, number];

const HERO_STARS: readonly Star[] = [
  [7, 150, 1.5, 0], [12, 300, 1, 2.9], [16, 420, 1, 1.1], [23, 96, 1, 2.2],
  [31, 610, 1.5, 0.5], [38, 180, 1, 1.6], [47, 128, 1, 2.8], [55, 72, 1.5, 0.3],
  [66, 600, 1, 1.3], [73, 160, 1.5, 2], [79, 130, 1, 0.8], [84, 560, 1, 0.6],
  [88, 380, 1, 2.4], [94, 170, 1.5, 1.4],
];
// Above the CSS horizon, whose rim sits at 64% of the runway: at least ~540 px down on a phone.
const RUNWAY_STARS: readonly Star[] = [
  [5, 120, 1.5, 0], [11, 280, 1, 2.9], [17, 72, 1, 1.1], [24, 200, 1.5, 2.2],
  [35, 110, 1, 0.5], [44, 230, 1, 1.6], [52, 80, 1.5, 2.8], [63, 165, 1, 0.3],
  [74, 100, 1.5, 1.3], [81, 260, 1, 2], [87, 150, 1, 0.8], [92, 330, 1.5, 2.4],
];
const CONTACT_STARS: readonly Star[] = [
  [9, 120, 1.5, 0.7], [21, 460, 1, 2.1], [36, 86, 1, 1.2],
  [64, 520, 1.5, 0.2], [77, 140, 1, 2.6], [91, 400, 1, 1.7],
];

function Stars({ stars }: { stars: readonly Star[] }) {
  return stars.map(([left, top, size, delay]) => (
    <span
      key={`${left}-${top}`}
      className="animate-twinkle absolute rounded-full bg-white"
      style={{ left: `${left}%`, top, width: size, height: size, animationDelay: `${delay}s` }}
    />
  ));
}

/** The hero's stars, over the stage. */
export function HeroStars() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-x-0 top-0 -z-2 h-[960px]">
      <Stars stars={HERO_STARS} />
    </div>
  );
}

const RAYS =
  "conic-gradient(from 0deg, rgba(201,220,255,0) 0deg, rgba(201,220,255,0.16) 8deg, rgba(201,220,255,0) 18deg, " +
  "rgba(201,220,255,0) 52deg, rgba(201,220,255,0.1) 61deg, rgba(201,220,255,0) 70deg, " +
  "rgba(201,220,255,0) 95deg, rgba(201,220,255,0.18) 104deg, rgba(201,220,255,0) 116deg, " +
  "rgba(201,220,255,0) 160deg, rgba(201,220,255,0.12) 172deg, rgba(201,220,255,0) 182deg, " +
  "rgba(201,220,255,0) 236deg, rgba(201,220,255,0.15) 246deg, rgba(201,220,255,0) 258deg, " +
  "rgba(201,220,255,0) 284deg, rgba(201,220,255,0.1) 292deg, rgba(201,220,255,0) 301deg, " +
  "rgba(201,220,255,0) 330deg, rgba(201,220,255,0.14) 340deg, rgba(201,220,255,0) 352deg)";

/** Baily's beads: [left %, top %, size px, glow]. */
const BAILY = [
  [7.6, 23.5, 3, "0 0 6px 2px rgba(236,243,255,0.75)"],
  [23.5, 7.6, 3, "0 0 6px 2px rgba(236,243,255,0.75)"],
  [30.5, 4, 2, "0 0 5px 1px rgba(236,243,255,0.65)"],
] as const;

/** Board 09's eclipse (spec appendix A), filling the hero's eclipse box. */
export function EclipseSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <div
        className="absolute inset-[-120%] rounded-full"
        style={{ background: "radial-gradient(circle closest-side, rgba(52,78,150,0.2), rgba(30,46,100,0.08) 42%, rgba(12,18,40,0) 100%)" }}
      />
      <div
        className="absolute inset-[-105%] rounded-full"
        style={{
          transform: "scale(1.35, 0.92) rotate(-16deg)",
          filter: "blur(14px)",
          background: RAYS,
          ...mask("radial-gradient(circle closest-side, #000 30%, rgba(0,0,0,0.45) 46%, transparent 80%)"),
        }}
      />
      <div
        className="animate-breathe absolute inset-[-60%] rounded-full"
        style={{ background: "radial-gradient(circle closest-side, rgba(226,236,255,0.6) 44%, rgba(176,200,255,0.24) 50%, rgba(130,160,236,0.1) 62%, rgba(96,126,214,0.035) 80%, rgba(96,126,214,0) 100%)" }}
      />
      <div
        className="absolute inset-[-9%] rounded-full"
        style={{ background: "radial-gradient(circle closest-side, rgba(246,249,255,0) 82%, rgba(246,249,255,0.9) 84.8%, rgba(214,228,255,0.38) 88%, rgba(201,220,255,0.1) 94%, rgba(201,220,255,0) 100%)" }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 36% 32%, #0c0f18 0%, #05060a 52%, #020203 100%)",
          boxShadow: "0 0 0 1px rgba(246,249,255,0.92), 0 0 9px 1px rgba(226,236,255,0.7), 0 0 30px 5px rgba(160,190,255,0.22)",
        }}
      />
      <span
        className="absolute"
        style={{ left: "92.4%", top: "76.5%", width: 14, height: 7, margin: "-3.5px 0 0 -7px", borderRadius: "7px 7px 2px 2px", transform: "rotate(122deg) translateY(-4px)", filter: "blur(0.6px)", background: "radial-gradient(ellipse at 50% 100%, rgba(255,150,170,0.9), rgba(255,110,140,0.35) 60%, rgba(255,110,140,0) 100%)" }}
      />
      <span
        className="absolute"
        style={{ left: "3%", top: "67.1%", width: 9, height: 5, margin: "-2.5px 0 0 -4.5px", borderRadius: "5px 5px 2px 2px", transform: "rotate(250deg) translateY(-3px)", filter: "blur(0.5px)", background: "radial-gradient(ellipse at 50% 100%, rgba(255,150,170,0.8), rgba(255,110,140,0.3) 60%, rgba(255,110,140,0) 100%)" }}
      />
      {BAILY.map(([left, top, size, glow]) => (
        <span
          key={`${left}-${top}`}
          className="absolute rounded-full bg-white"
          style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, margin: `${-size / 2}px 0 0 ${-size / 2}px`, boxShadow: glow }}
        />
      ))}
      <div className="animate-bead absolute size-0" style={{ left: "14.6%", top: "14.6%" }}>
        <span
          className="absolute rounded-full"
          style={{ left: -120, top: -120, width: 240, height: 240, background: "radial-gradient(circle closest-side, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.7) 5%, rgba(201,220,255,0.26) 18%, rgba(201,220,255,0.07) 44%, rgba(201,220,255,0) 100%)" }}
        />
        <span
          className="absolute"
          style={{ left: -200, top: -0.5, width: 400, height: 1, background: "linear-gradient(90deg, rgba(214,228,255,0), rgba(240,246,255,0.8), rgba(214,228,255,0))" }}
        />
        <span
          className="absolute"
          style={{ left: -0.5, top: -150, width: 1, height: 300, background: "linear-gradient(rgba(214,228,255,0), rgba(240,246,255,0.65), rgba(214,228,255,0))" }}
        />
        <span
          className="absolute rounded-full bg-white"
          style={{ left: -5, top: -5, width: 10, height: 10, boxShadow: "0 0 14px 5px rgba(255,255,255,0.85), 0 0 44px 14px rgba(201,220,255,0.45)" }}
        />
      </div>
    </div>
  );
}

// Board 02's planet at 1440 px wide. The CSS sky keeps it at that size on every screen.
const PLANET = 12000;

/** Board 02's horizon (spec appendix B), with its rim at 64% of the runway it fills. */
export function HorizonSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <Stars stars={RUNWAY_STARS} />
      <div
        className="absolute rounded-full"
        style={{ left: "50%", top: "64%", width: 2800, height: 200, margin: "-100px 0 0 -1400px", background: "radial-gradient(closest-side, rgba(96,136,224,0.13), rgba(96,136,224,0) 100%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: "38%", top: "64%", width: 1400, height: 340, margin: "-170px 0 0 -700px", background: "radial-gradient(closest-side, rgba(150,184,248,0.3), rgba(84,120,206,0.12) 42%, rgba(40,60,120,0.04) 70%, rgba(40,60,120,0) 100%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: "50%", top: "64%", width: PLANET, height: PLANET, marginLeft: -PLANET / 2, background: "radial-gradient(circle closest-side, #020305 99.4%, #05080f 99.9%, #080c18 100%)", boxShadow: "0 0 0 1px rgba(150,180,240,0.28)" }}
      />
      <div
        className="absolute inset-0"
        style={mask("linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 18%, #000 33%, #000 43%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 84%, rgba(0,0,0,0.08) 100%)")}
      >
        <div
          className="absolute rounded-full"
          style={{ left: "50%", top: "64%", width: PLANET, height: PLANET, marginLeft: -PLANET / 2, boxShadow: "0 0 0 1px rgba(240,246,255,0.95), 0 -1px 4px 0 rgba(214,228,255,0.7), 0 -4px 22px 2px rgba(130,168,244,0.4)" }}
        />
      </div>
      <div className="absolute size-0" style={{ left: "38%", top: "calc(64% + 2px)" }}>
        <span
          className="animate-glint absolute"
          style={{ left: -560, top: -0.5, width: 1120, height: 1, background: "linear-gradient(90deg, rgba(214,228,255,0), rgba(236,243,255,0.85) 50%, rgba(214,228,255,0))" }}
        />
        <span
          className="absolute rounded-full"
          style={{ left: -60, top: -60, width: 120, height: 120, background: "radial-gradient(circle closest-side, rgba(255,255,255,0.9), rgba(214,228,255,0.35) 22%, rgba(201,220,255,0) 100%)" }}
        />
        <span
          className="absolute"
          style={{ left: -0.5, top: -70, width: 1, height: 140, background: "linear-gradient(rgba(214,228,255,0), rgba(236,243,255,0.6), rgba(214,228,255,0))" }}
        />
        <span
          className="absolute rounded-full bg-white"
          style={{ left: -3, top: -3, width: 6, height: 6, boxShadow: "0 0 10px 3px rgba(255,255,255,0.85), 0 0 34px 10px rgba(201,220,255,0.4)" }}
        />
      </div>
    </div>
  );
}

export function ContactSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <div
        className="absolute rounded-full"
        style={{ left: "50%", bottom: -260, width: 1500, height: 640, marginLeft: -750, background: "radial-gradient(closest-side, rgba(58,88,170,0.18), rgba(58,88,170,0.06) 55%, rgba(58,88,170,0) 100%)" }}
      />
      <Stars stars={CONTACT_STARS} />
      <div
        className="absolute inset-0"
        style={mask("radial-gradient(ellipse 62% 140% at 50% 100%, #000 40%, transparent 100%)")}
      >
        <div
          className="absolute rounded-full"
          style={{ left: "50%", top: "calc(100% - 123px)", width: 6336, height: 6336, marginLeft: -3168, background: "radial-gradient(circle closest-side, #05060a 98.9%, rgba(46,77,140,0.5) 99.62%, rgba(201,220,255,0.95) 99.975%, rgba(201,220,255,0) 100%)", boxShadow: "0 0 70px 8px rgba(77,107,158,0.5), 0 0 16px 1px rgba(201,220,255,0.4)" }}
        />
      </div>
    </div>
  );
}

export function SkyGrain() {
  return (
    <svg
      aria-hidden="true"
      className="sky-fallback pointer-events-none fixed inset-0 -z-2 size-full opacity-5"
    >
      <filter id="sky-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.6 -1.2" />
      </filter>
      <rect width="100%" height="100%" fill="#fff" filter="url(#sky-grain)" />
    </svg>
  );
}
```

- [ ] **Step 5: Add the styles.** In `src/app/globals.css`:

  1. After the `.orb-dot { … }` rule inside `@layer components`, add:

```css
  /* The header's mark: board 09's eclipse in miniature. */
  .eclipse-mark {
    background: #05060a;
    box-shadow: 0 0 0 1px rgb(240 246 255 / 0.92), 0 0 7px 1px rgb(201 220 255 / 0.55);
  }
  /* The statement's full stop: a small bead that breathes. */
  .full-stop {
    display: inline-block;
    width: 0.15em;
    height: 0.15em;
    margin-left: 0.07em;
    border-radius: 50%;
    vertical-align: baseline;
    background: #f4f8ff;
    box-shadow: 0 0 0.05em 0.01em rgb(244 248 255 / 0.9), 0 0 0.3em 0.06em rgb(201 220 255 / 0.32);
    animation: breathe 5.2s ease-in-out infinite;
  }
```

  2. Replace the `@keyframes flare` block and the `animate-twinkle` and `animate-flare` utilities. This is the stretch from `@keyframes flare {` to the closing `}` of `@utility animate-flare`. Use:

```css
/* The CSS sky's eclipse and horizon (fallback.tsx), and the statement's full stop. */
@keyframes breathe {
  0%, 100% { opacity: 0.86; }
  50% { opacity: 1; }
}
@keyframes bead {
  0%, 100% { opacity: 0.82; transform: scale(0.92); }
  50% { opacity: 1; transform: scale(1.04); }
}
@keyframes glint {
  0%, 100% { opacity: 0.78; transform: scaleX(0.94); }
  50% { opacity: 1; transform: scaleX(1); }
}
@utility animate-twinkle {
  animation: twinkle 3.6s ease-in-out infinite;
}
@utility animate-breathe {
  animation: breathe 7s ease-in-out infinite;
}
@utility animate-bead {
  animation: bead 5.2s ease-in-out infinite;
}
@utility animate-glint {
  animation: glint 6s ease-in-out infinite;
}
```

  3. Replace the reduced-motion block that stops `.animate-twinkle` and `.animate-flare` with:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-twinkle,
  .animate-breathe,
  .animate-bead,
  .animate-glint,
  .full-stop {
    animation: none;
  }
}
```

- [ ] **Step 6: Change the header's mark.** In `src/components/site-header.tsx`, replace `<span aria-hidden="true" className="orb-dot size-[13px] rounded-full" />` with:

```tsx
          <span aria-hidden="true" className="eclipse-mark size-[13px] rounded-full" />
```

- [ ] **Step 7: Run the browser tests to see them pass.**

Run: `cd $PW && node eclipse.mjs test_hero_layout test_css_story`
Expected:
- `test_hero_layout 1440`, `390` and `reduced` all PASS. At 1440 the box's centre is `[1096, 500]` and R is 201.6. The runway is 900 and 844, and 0 under reduced motion.
- `test_css_story` PASSes in Firefox: `sky` is `css` and the sun is within 4 px of x 547.
- The old orb still draws in the live sky. Task 4 replaces it.

- [ ] **Step 8: Run the checks.**

Run: `bun run lint && bun run typecheck && bun test && bun run build`
Expected: all green.

- [ ] **Step 9: Commit.**

```bash
git add src/components/hero.tsx src/components/sky/fallback.tsx src/app/globals.css src/components/site-header.tsx
git commit -m "feat(hero): lay out board 09's statement and eclipse over a runway"
```

---

### Task 3: The camera timeline

**Files:**
- Modify: `src/lib/flight.ts` (`createFlight`)
- Modify: `src/components/motion.tsx`
- Test: `src/lib/flight.test.ts`, `$PW/eclipse.mjs` (`test_copy_fade`)

**Interfaces:**
- Consumes: `addCameraTweens` and `COPY_OUT` (Task 1). Also `[data-hero-copy]` and `#home` with its runway (Task 2).
- Produces:
  - `flight.eclipse: { zoom: number; pan: number; level: number; morph: number; end: number }`.
  - The channels run 0..1 across the runway.
  - `end` is the trigger's end scroll position, written on every refresh. It's `Number.POSITIVE_INFINITY` before the first refresh and under reduced motion.

- [ ] **Step 1: Write the failing unit test.** In `src/lib/flight.test.ts`, insert as the first test inside `describe("flight", …)`:

```ts
  test("the hero's camera starts on board 09, with no runway end yet", () => {
    expect(createFlight().eclipse).toEqual({ zoom: 0, pan: 0, level: 0, morph: 0, end: Number.POSITIVE_INFINITY });
  });
```

- [ ] **Step 2: Write the failing browser test.** In `$PW/eclipse.mjs`, insert above `// runner`:

```js
tests.test_copy_fade = async () => {
  const p = await open();
  const g = await geometry(p);
  const read = () => p.$eval("[data-hero-copy]", (e) => ({ o: +getComputedStyle(e).opacity, y: new DOMMatrix(getComputedStyle(e).transform).m42 }));
  const top = await read();
  await jump(p, 0.3 * g.end, 300);
  const gone = await read();
  await jump(p, g.end, 300);
  const end = await read();
  await jump(p, 0, 300);
  const back = await read();
  report("test_copy_fade", top.o === 1 && gone.o < 0.05 && Math.abs(gone.y + 90) < 2 && end.o < 0.05 && back.o === 1, { top, gone, end, back });
  await p.context().close();
};
```

- [ ] **Step 3: Run both to see them fail.**

Run: `bun test src/lib/flight.test.ts`
Expected: FAIL. `eclipse` is `undefined`.

Run: `cd $PW && node eclipse.mjs test_copy_fade`
Expected: FAIL. The old "02 Drift" is still running, so at 30% of the runway the copy's opacity is still about 0.8.

- [ ] **Step 4: Add the state.** In `src/lib/flight.ts`, inside `createFlight()`'s object, between `hero: EMPTY_RECT,` and `reduced: false,`, add:

```ts
    /**
     * The hero's camera (spec §4.1): motion.tsx scrubs the channels and the sky reads them. `end` is
     * the scroll position where the runway ends, written on refresh; until then nothing settles.
     */
    eclipse: { zoom: 0, pan: 0, level: 0, morph: 0, end: Number.POSITIVE_INFINITY },
```

- [ ] **Step 5: Add the timeline.** In `src/components/motion.tsx`:

  1. Replace the import of `readProgress` and `wordOpacity` with:

```tsx
import { addCameraTweens, COPY_OUT } from "@/lib/eclipse";
import { flight } from "@/lib/flight";
import { readProgress, wordOpacity } from "@/lib/statement";
```

  2. In "01 Rise", replace the comment and both `0.08`s:

```tsx
        // 01 Rise: the statement resolves word by word from a soft blur, then the links fade up, as
        // the eclipse lights. Its ~20 words stagger at half the old headline's pace.
```

   `.fromTo(heroWords, blur, { ...clear, stagger: 0.08 }, 0)` becomes `.fromTo(heroWords, blur, { ...clear, stagger: 0.04 }, 0)`, and `Math.max(heroWords.length - 1, 0) * 0.08 + 0.14,` becomes `Math.max(heroWords.length - 1, 0) * 0.04 + 0.14,`.

  3. Replace the whole "02 Drift" block, from its comment to the `.to("[data-hero-copy]", { opacity: 0, … })` line, with:

```tsx
        // 02 Approach: across the runway the copy lifts away while the camera flies into the eclipse
        // (spec §4.1). The sky reads flight.eclipse each tick and settles the horizon from `end`.
        const camera = gsap.timeline({
          scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onRefresh: (self) => {
              flight.eclipse.end = self.end;
            },
          },
        });
        camera.to("[data-hero-copy]", { y: -COPY_OUT.lift, opacity: 0, ease: "none", duration: COPY_OUT.end }, 0);
        addCameraTweens(camera, flight.eclipse);
```

  4. Replace `return () => words.forEach((word) => word.style.removeProperty("opacity"));` with:

```tsx
        return () => {
          // Reduced motion has no runway, so nothing may settle.
          flight.eclipse.end = Number.POSITIVE_INFINITY;
          words.forEach((word) => word.style.removeProperty("opacity"));
        };
```

- [ ] **Step 6: Run both to see them pass.**

Run: `bun test src/lib/flight.test.ts`
Expected: PASS.

Run: `cd $PW && node eclipse.mjs test_copy_fade`
Expected: PASS, with `gone` at `{"o":0,"y":-90}` and `back` at `{"o":1,"y":0}`.

- [ ] **Step 7: Run the checks.**

Run: `bun run lint && bun run typecheck && bun test && bun run build`
Expected: all green.

- [ ] **Step 8: Commit.**

```bash
git add src/lib/flight.ts src/lib/flight.test.ts src/components/motion.tsx
git commit -m "feat(motion): scrub the hero's camera across the runway"
```

---

### Task 4: The sky's body, from eclipse to resting horizon

**Files:**
- Modify: `src/components/sky/sky.wgsl` (replace the file)
- Modify: `src/components/sky/renderer.ts` (replace the file)
- Modify: `src/lib/sky-math.ts`, `src/lib/sky-math.test.ts`
- Test: `$PW/eclipse.mjs` (`test_rest_frame`, `test_hold_frame`, `test_settle`, `test_story`, `test_reduced_still`)

**Interfaces:**
- Consumes:
  - Everything from Task 1, plus `flight.eclipse` (Task 3).
  - `data-sky-anchor="eclipse"` (Task 2).
- Produces:
  - **`Params`:**
    - New fields: `viewHeight: f32`, `body: vec4f`, `sun: vec4f`, `halo: vec4f`, `glare: vec4f` and `settle: f32`.
    - Removed: `orb`, `heroHeight`, `foot` and `footWidth`.
  - **`mountSky(canvas, callbacks)`:** its signature is unchanged in this task.
  - **`sky-math.ts`:** loses `departure`, `orbFrame` and `horizonFrame`.
- This task covers spec §5.1–5.5 and §5.8: the body, the settle, the shed, the gather into the resting rim with the cursor's lean, and the still frames. Contact's own horizon goes, since the resting horizon takes its place.

- [ ] **Step 1: Write the failing browser tests.** In `$PW/eclipse.mjs`, insert above `// runner`:

```js
tests.test_rest_frame = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await skyOnly(p);
    const g = await geometry(p);
    const img = await shot(p);
    const centre = at(img, g.C[0], g.C[1]);
    const edge = at(img, g.C[0] + g.R + 1, g.C[1]);
    const bead = [g.C[0] - g.R * Math.SQRT1_2, g.C[1] - g.R * Math.SQRT1_2];
    const glow = at(img, bead[0], bead[1]);
    report(`test_rest_frame ${w}`, centre < 0.01 && edge > 0.4 && glow > 0.8 && p.errors.length === 0, { centre, edge, glow });
    await p.context().close();
  }
};

tests.test_hold_frame = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await skyOnly(p);
    const g = await geometry(p);
    await jump(p, g.end);
    const img = await shot(p);
    const sun = sunColumn(img, 0.64 * h - 40, 0.64 * h + 40);
    const apex = brightestInColumn(img, w / 2, 0.55 * h, 0.75 * h);
    await p.screenshot({ path: `hold-${w}.png` });
    report(`test_hold_frame ${w}`, Math.abs(sun.x - 0.38 * w) <= 3 && Math.abs(apex.y - 0.64 * h) <= 2, { sun, apex });
    await p.context().close();
  }
};

tests.test_settle = async () => {
  const p = await open();
  await skyOnly(p);
  const g = await geometry(p);
  const apexes = [];
  for (const k of [0, 0.25, 0.5, 1, 2]) {
    await jump(p, g.end + k * g.H);
    apexes.push(brightestInColumn(await shot(p), g.W / 2, 0.55 * g.H, 0.97 * g.H).y);
  }
  const rising = apexes.every((y, i) => i === 0 || y >= apexes[i - 1] - 1);
  report("test_settle", rising && Math.abs(apexes[3] - 0.86 * g.H) <= 2 && Math.abs(apexes[4] - 0.86 * g.H) <= 2, { apexes });
  await p.context().close();
};

tests.test_story = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    const g = await geometry(p);
    const points = [
      ["0", 0], ["25", 0.25 * g.end], ["50", 0.5 * g.end], ["75", 0.75 * g.end], ["hold", g.end],
      ["settle", g.end + 0.5 * h], ["rest", g.end + 1.2 * h], ["work", null], ["bottom", 1e6],
    ];
    for (const [name, y] of points) {
      if (y === null) await p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
      else await p.evaluate((v) => scrollTo(0, v), y);
      await settle(p);
      await p.waitForTimeout(2500);
      await p.screenshot({ path: `story-${name}-${w}.png` });
    }
    report(`test_story ${w}`, p.errors.length === 0, { errors: p.errors });
    await p.context().close();
  }
};

tests.test_reduced_still = async () => {
  const p = await open({ reducedMotion: "reduce" });
  const words = await p.$$eval("#home [data-head-word]", (els) => els.map((e) => getComputedStyle(e).opacity));
  await skyOnly(p);
  const g = await geometry(p);
  await jump(p, 300, 800);
  const moved = await shot(p);
  const centre = at(moved, g.C[0], g.C[1] - 300);
  const edge = at(moved, g.C[0] + g.R + 1, g.C[1] - 300);
  await jump(p, 1e6, 800);
  const contact = await p.evaluate(() => {
    const r = document.querySelector("#contact").getBoundingClientRect();
    return { top: r.top, height: r.height };
  });
  const expected = contact.top + 0.85 * contact.height;
  const apex = brightestInColumn(await shot(p), 720, expected - 40, Math.min(899, expected + 40));
  report("test_reduced_still", words.length === 19 && words.every((o) => o === "1") && centre < 0.01 && edge > 0.4 && Math.abs(apex.y - expected) <= 3, { centre, edge, apex, expected });
  await p.context().close();
};
```

- [ ] **Step 2: Run them to see them fail.**

Run: `cd $PW && node eclipse.mjs test_rest_frame test_hold_frame test_settle test_reduced_still`
Expected: FAIL. The live sky still draws the orb, so there's no eclipse on the box, no horizon at 64%, and no rest line at 86%.

- [ ] **Step 3: Write the shader.** Replace `src/components/sky/sky.wgsl` with:

```wgsl
// The page's one sky, drawn behind everything in page space: nebula, the body (board 09's eclipse,
// which the camera flies into until it is board 02's horizon), stars and grain. Lengths are CSS
// pixels; y grows down the page.
struct Params {
  resolution: vec2f,
  // The light, in page space: the pointer while hovering, else resting above the hero.
  light: vec2f,
  // Pointer in 0..1 of the viewport, for the star parallax.
  pointer: vec2f,
  // Canvas pixels per CSS pixel.
  dpr: f32,
  scroll: f32,
  hover: f32,
  time: f32,
  // The viewport's height: the shed's scale.
  viewHeight: f32,
  // The body (spec §5.3): centre x, centre y (page), radius, visibility.
  body: vec4f,
  // The bead, which becomes the sun: x, y (page), morph (0 eclipse .. 1 horizon), brightness.
  sun: vec4f,
  // Reach past the edge of the edge ring, inner glow and outer haze (px), and the rays' strength.
  halo: vec4f,
  // The bead's glare in px: core radius, glare radius, horizontal and vertical streak half-lengths.
  glare: vec4f,
  // How far the horizon has settled toward its rest line, 0..1.
  settle: f32,
  // Where the trail's ribbon runs, in page y: the top of Work and the top of Contact.
  span: vec2f,
  // The trail (shed, carry, gather; 0..1) and, in w, the stars' virtual scroll (scroll + coast).
  trail: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;

const NEBULA = 1.0;
const GRAIN = 1.0;
const TAU = 6.2831853;

fn hash21(q: vec2f) -> f32 {
  var p = fract(q * vec2f(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// The noise lattice's hash, in integers. hash21 amplifies rounding, and some compilers (DXC, on
// Windows) fold `(i + 1) * k` into `i * k + k`: neighbouring cells then disagree at their shared
// edge and the noise shows seams. Integer maths is exact on every backend.
fn hashCell(c: vec2f) -> f32 {
  let i = bitcast<vec2u>(vec2i(c));
  var h = (i.x * 1597334677u) ^ (i.y * 3812015801u);
  h = (h ^ (h >> 16u)) * 0x7feb352du;
  h = (h ^ (h >> 15u)) * 0x846ca68bu;
  h = h ^ (h >> 16u);
  return f32(h >> 8u) / 16777215.0;
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hashCell(i);
  let b = hashCell(i + vec2f(1.0, 0.0));
  let c = hashCell(i + vec2f(0.0, 1.0));
  let d = hashCell(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(q: vec2f) -> f32 {
  var p = q;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2f(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

fn fbm3(q: vec2f) -> f32 {
  var p = q;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.07 + vec2f(4.1, 2.3);
    a *= 0.5;
  }
  return v;
}

fn stars(p: vec2f, t: f32, density: f32, size: f32) -> f32 {
  let cell = floor(p);
  let s = hash21(cell);
  let j = vec2f(hash21(cell + 11.0), hash21(cell + 23.0)) * 0.6 + 0.2;
  let d = length(fract(p) - j);
  let tw = 0.55 + 0.45 * sin(t * (0.6 + s * 1.8) + s * 40.0);
  return step(density, s) * (1.0 - smoothstep(0.0, size, d)) * tw;
}

// Interpolation between two CSS gradient stops at x0 and x1: the boards' layers are ported stop by stop.
fn stop(x: f32, x0: f32, x1: f32) -> f32 {
  return clamp((x - x0) / (x1 - x0), 0.0, 1.0);
}

// From a to b on a log scale: a reach that shrinks from a share of R to a few px does so evenly.
fn geo(a: f32, b: f32, m: f32) -> f32 {
  return a * pow(b / a, m);
}

// A CSS box-shadow's falloff past its spread. The blurred edge is a normal CDF; this is its logistic fit.
fn shadow(d: f32, spread: f32, blur: f32) -> f32 {
  return 1.0 / (1.0 + exp(clamp(1.702 * (d - spread) / max(blur * 0.5, 0.001), -30.0, 30.0)));
}

// Turns v anticlockwise on screen (y down) by a radians.
fn turn(v: vec2f, a: f32) -> vec2f {
  let c = cos(a);
  let s = sin(a);
  return vec2f(v.x * c + v.y * s, -v.x * s + v.y * c);
}

// Board 09's outer haze, x past the edge as a share of its reach.
fn haze09(x: f32) -> vec3f {
  if (x < 0.179) {
    let k = stop(x, 0.0, 0.179);
    return mix(vec3f(37.0, 55.0, 115.0), vec3f(30.0, 46.0, 100.0), k) / 255.0 * mix(0.116, 0.08, k);
  }
  let k = stop(x, 0.179, 1.0);
  return mix(vec3f(30.0, 46.0, 100.0), vec3f(12.0, 18.0, 40.0), k) / 255.0 * mix(0.08, 0.0, k);
}

// Board 09's inner glow.
fn glow09(x: f32) -> vec3f {
  if (x < 0.0833) {
    let k = stop(x, 0.0, 0.0833);
    return mix(vec3f(214.0, 227.0, 255.0), vec3f(176.0, 200.0, 255.0), k) / 255.0 * mix(0.513, 0.24, k);
  }
  if (x < 0.303) {
    let k = stop(x, 0.0833, 0.303);
    return mix(vec3f(176.0, 200.0, 255.0), vec3f(130.0, 160.0, 236.0), k) / 255.0 * mix(0.24, 0.1, k);
  }
  if (x < 0.633) {
    let k = stop(x, 0.303, 0.633);
    return mix(vec3f(130.0, 160.0, 236.0), vec3f(96.0, 126.0, 214.0), k) / 255.0 * mix(0.1, 0.035, k);
  }
  return vec3f(96.0, 126.0, 214.0) / 255.0 * mix(0.035, 0.0, stop(x, 0.633, 1.0));
}

// Board 09's ring hugging the edge.
fn ring09(x: f32) -> vec3f {
  if (x < 0.213) {
    let k = stop(x, 0.0, 0.213);
    return mix(vec3f(246.0, 249.0, 255.0), vec3f(214.0, 228.0, 255.0), k) / 255.0 * mix(0.9, 0.38, k);
  }
  if (x < 0.606) {
    let k = stop(x, 0.213, 0.606);
    return mix(vec3f(214.0, 228.0, 255.0), vec3f(201.0, 220.0, 255.0), k) / 255.0 * mix(0.38, 0.1, k);
  }
  return vec3f(201.0, 220.0, 255.0) / 255.0 * mix(0.1, 0.0, stop(x, 0.606, 1.0));
}

// One of board 09's streamers: up to its peak and back down, by CSS conic angle in degrees.
fn ray(deg: f32, a0: f32, peak: f32, a1: f32) -> f32 {
  return min(stop(deg, a0, peak), 1.0 - stop(deg, peak, a1));
}

// Board 09's seven streamers. Their angles run clockwise from 12 o'clock, as CSS conic angles do.
fn rays09(deg: f32) -> f32 {
  var a = ray(deg, 0.0, 8.0, 18.0) * 0.16;
  a = max(a, ray(deg, 52.0, 61.0, 70.0) * 0.1);
  a = max(a, ray(deg, 95.0, 104.0, 116.0) * 0.18);
  a = max(a, ray(deg, 160.0, 172.0, 182.0) * 0.12);
  a = max(a, ray(deg, 236.0, 246.0, 258.0) * 0.15);
  a = max(a, ray(deg, 284.0, 292.0, 301.0) * 0.1);
  return max(a, ray(deg, 330.0, 340.0, 352.0) * 0.14);
}

// Board 09's dark disc, lit a little from its upper left; q is in the body's own frame.
fn disc09(q: vec2f, R: f32) -> vec3f {
  let f = length(q - vec2f(-0.28, -0.36) * R) / (1.8676 * R);
  if (f < 0.52) {
    return mix(vec3f(12.0, 15.0, 24.0), vec3f(5.0, 6.0, 10.0), stop(f, 0.0, 0.52)) / 255.0;
  }
  return mix(vec3f(5.0, 6.0, 10.0), vec3f(2.0, 2.0, 3.0), stop(f, 0.52, 1.0)) / 255.0;
}

// Board 02's ground: flat, with a thin lit band just inside the edge. depth is px inside it.
fn ground02(depth: f32) -> vec3f {
  if (depth < 6.0) {
    return mix(vec3f(8.0, 12.0, 24.0), vec3f(5.0, 8.0, 15.0), stop(depth, 0.0, 6.0)) / 255.0;
  }
  return mix(vec3f(5.0, 8.0, 15.0), vec3f(2.0, 3.0, 5.0), stop(depth, 6.0, 36.0)) / 255.0;
}

// Board 02's band along the horizon, centred on its apex.
fn band02(p: vec2f, apex: vec2f, sx: f32) -> vec3f {
  let e = length(vec2f((p.x - apex.x) / (1400.0 * sx), (p.y - apex.y) / 100.0));
  return vec3f(96.0, 136.0, 224.0) / 255.0 * 0.13 * max(1.0 - e, 0.0);
}

// Board 02's bloom around the sun.
fn bloom02(p: vec2f, sun: vec2f, sx: f32) -> vec3f {
  let e = length(vec2f((p.x - sun.x) / (700.0 * sx), (p.y - sun.y) / 170.0));
  if (e < 0.42) {
    let k = stop(e, 0.0, 0.42);
    return mix(vec3f(150.0, 184.0, 248.0), vec3f(84.0, 120.0, 206.0), k) / 255.0 * mix(0.3, 0.12, k);
  }
  if (e < 0.7) {
    let k = stop(e, 0.42, 0.7);
    return mix(vec3f(84.0, 120.0, 206.0), vec3f(40.0, 60.0, 120.0), k) / 255.0 * mix(0.12, 0.04, k);
  }
  return vec3f(40.0, 60.0, 120.0) / 255.0 * mix(0.04, 0.0, stop(e, 0.7, 1.0));
}

// Board 02's rim mask (spec §5.3): full near the sun, about a tenth at the screen's edges. s is the
// arc length from the sun, positive to the right.
fn rimMask(s: f32, W: f32) -> f32 {
  let sigma = select(0.21 * W, 0.18 * W, s < 0.0);
  let k = max(abs(s) - 0.05 * W, 0.0) / sigma;
  return 0.1 + 0.9 * exp(-k * k);
}

// One of Baily's beads, on the edge `deg` degrees anticlockwise from the bead.
fn baily(p: vec2f, C: vec2f, R: f32, ub: vec2f, deg: f32, r: f32, spread: f32, blur: f32, a: f32) -> vec3f {
  let d = length(p - (C + turn(ub, radians(deg)) * R)) - r;
  return vec3f(1.0 - smoothstep(-0.5, 0.5, d)) + vec3f(236.0, 243.0, 255.0) / 255.0 * a * shadow(d, spread, blur);
}

// A pink prominence licking up from the edge, `deg` degrees anticlockwise from the bead: colour and
// alpha, painted over the ring as the board paints it.
fn prominence(p: vec2f, C: vec2f, R: f32, ub: vec2f, deg: f32, along: f32, up: f32) -> vec4f {
  let dir = turn(ub, radians(deg));
  let local = p - (C + dir * (R + 2.5));
  let e = length(vec2f(dot(local, vec2f(-dir.y, dir.x)) / along, dot(local, dir) / up));
  if (e >= 1.0) {
    return vec4f(0.0);
  }
  if (e < 0.6) {
    let k = stop(e, 0.0, 0.6);
    return vec4f(mix(vec3f(255.0, 150.0, 170.0), vec3f(255.0, 110.0, 140.0), k) / 255.0, mix(0.9, 0.35, k));
  }
  return vec4f(vec3f(255.0, 110.0, 140.0) / 255.0, mix(0.35, 0.0, stop(e, 0.6, 1.0)));
}

// The bead's glare (spec §5.3): a camera effect sized in px, from board 09's diamond to board 02's
// sun as m goes 0 to 1. g is the pixel's offset from the bead.
fn glareAt(g: vec2f, m: f32) -> vec3f {
  let core = params.glare.x;
  let reach = params.glare.y;
  let r = length(g);
  var c = vec3f(0.0);
  if (r < reach) {
    let x = r / reach;
    var a09 = mix(0.07, 0.0, stop(x, 0.44, 1.0));
    var c09 = vec3f(201.0, 220.0, 255.0) / 255.0;
    if (x < 0.05) {
      let k = stop(x, 0.0, 0.05);
      a09 = mix(0.95, 0.7, k);
      c09 = mix(vec3f(255.0), vec3f(240.0, 246.0, 255.0), k) / 255.0;
    } else if (x < 0.18) {
      let k = stop(x, 0.05, 0.18);
      a09 = mix(0.7, 0.26, k);
      c09 = mix(vec3f(240.0, 246.0, 255.0), vec3f(201.0, 220.0, 255.0), k) / 255.0;
    } else if (x < 0.44) {
      a09 = mix(0.26, 0.07, stop(x, 0.18, 0.44));
    }
    let k02 = stop(x, 0.0, 0.22);
    var a02 = mix(0.9, 0.35, k02);
    var c02 = mix(vec3f(255.0), vec3f(214.0, 228.0, 255.0), k02) / 255.0;
    if (x >= 0.22) {
      let k = stop(x, 0.22, 1.0);
      a02 = mix(0.35, 0.0, k);
      c02 = mix(vec3f(214.0, 228.0, 255.0), vec3f(201.0, 220.0, 255.0), k) / 255.0;
    }
    c += c09 * a09 * (1.0 - m) + c02 * a02 * m;
  }
  // The streaks: 1 px lines, brightest at the bead and gone at their ends.
  let streak = vec3f(240.0, 246.0, 255.0) / 255.0;
  c += streak * mix(0.8, 0.85, m) * max(1.0 - abs(g.x) / params.glare.z, 0.0) * clamp(1.0 - abs(g.y), 0.0, 1.0);
  c += streak * mix(0.65, 0.6, m) * max(1.0 - abs(g.y) / params.glare.w, 0.0) * clamp(1.0 - abs(g.x), 0.0, 1.0);
  // The core and its two glows (box-shadows on the boards).
  let d = r - core;
  c += vec3f(1.0 - smoothstep(-0.5, 0.5, d));
  c += vec3f(0.85) * shadow(d, mix(5.0, 3.0, m), mix(14.0, 10.0, m));
  c += vec3f(201.0, 220.0, 255.0) / 255.0 * mix(0.45, 0.4, m) * shadow(d, mix(14.0, 10.0, m), mix(44.0, 34.0, m));
  return c;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let frag = uv * params.resolution;
  let css = frag / params.dpr;
  let page = css + vec2f(0.0, params.scroll);
  let W = params.resolution.x / params.dpr;
  let sx = W / 1440.0;
  let t = params.time;
  let bg = vec3f(0.024, 0.027, 0.039);
  var col = bg;
  var occ = 1.0;

  // The body (spec §5.3). m blends every layer from board 09's eclipse to board 02's horizon.
  let C = params.body.xy;
  let R = max(params.body.z, 1.0);
  let vis = params.body.w;
  let B = params.sun.xy;
  let m = params.sun.z;
  let rel = page - C;
  let dist = length(rel);
  let d = dist - R;

  // Nebula: domain-warped fbm that drifts on its own and lags the scroll (it moves at 45%),
  // gathering along the page margins.
  var side = smoothstep(0.26, 0.5, abs(css.x - W * 0.5) / W);
  side *= 0.3 + 0.7 * noise(vec2f(page.y * 0.0012, step(W * 0.5, css.x) * 5.0));
  let env = side * 0.55 * NEBULA;
  if (env > 0.003) {
    let q = vec2f(page.x, page.y - params.scroll * 0.55) / 560.0;
    let tt = t * 0.02;
    let w = vec2f(fbm3(q + vec2f(0.0, tt)), fbm3(q + vec2f(5.2, 1.3) + vec2f(-tt * 0.8, tt * 0.3)));
    let n = fbm(q * 1.3 + (w - 0.45) * 2.4 + vec2f(tt * 0.6, -tt * 0.25));
    var cloud = smoothstep(0.4, 0.8, n);
    cloud *= cloud;
    // Cubed by hand: pow() is undefined for a zero base.
    let x = max(n - 0.52, 0.0) * 2.6;
    let wisp = x * x * x;
    let hue = fbm3(q * 0.7 + w * 1.5 + 3.7);
    var neb = mix(vec3f(0.16, 0.24, 0.52), vec3f(0.27, 0.2, 0.5), smoothstep(0.35, 0.65, hue));
    neb = mix(neb, vec3f(0.15, 0.32, 0.38), smoothstep(0.5, 0.75, w.x));
    col += neb * (cloud * 0.17 + wisp * 0.12) * min(env, 1.4);
  }

  // Carry: the shed atmosphere becomes a ribbon of nebula winding down through Work. It sits deep
  // (its path moves at 45% of the scroll) and is dimmed behind the text column for legibility.
  let carry = params.trail.y;
  let gather = params.trail.z;
  let workTop = params.span.x;
  let contactTop = params.span.y;
  if (carry > 0.003 && page.y > workTop - 400.0 && page.y < contactTop + 200.0) {
    let deep = page.y - params.scroll * 0.55;
    // Near Contact the ribbon bends into the resting horizon's sun (spec §5.5).
    let bend = gather * smoothstep(contactTop - 900.0, contactTop, page.y);
    let path = W * (0.5 + 0.3 * sin(deep / 900.0 + 1.1) + 0.08 * sin(deep / 310.0));
    let cx = mix(path, B.x, bend);
    let off = abs(page.x - cx);
    if (off < W * 0.5) {
      let width = W * mix(0.22, 0.08, bend);
      let q = vec2f(page.x, deep) / 420.0;
      let w = vec2f(fbm3(q + vec2f(2.1, t * 0.02)), fbm3(q + vec2f(7.3, 3.9)));
      let n = fbm3(q * 1.6 + (w - 0.45) * 2.0);
      let body = exp(-(off * off) / (width * width));
      let ends = smoothstep(workTop - 400.0, workTop + 300.0, page.y)
               * (1.0 - smoothstep(contactTop, contactTop + 200.0, page.y));
      // Dimmed across the whole text column, which reaches ~0.44 W from the centre.
      let readability = mix(0.55, 1.0, smoothstep(0.44, 0.5, abs(css.x - W * 0.5) / W));
      // At most ~0.10 added luminance.
      col += vec3f(0.2, 0.34, 0.7) * smoothstep(0.3, 0.75, n) * body * ends * readability * carry * 0.3;
    }
  }

  if (vis > 0.001 && d < max(params.halo.z, 170.0 * m) + 4.0) {
    // The body's own frame, turned so the bead sits where board 09 has it: its upper left.
    let ub = (B - C) / R;
    let rest = vec2f(-0.70710678, -0.70710678);
    let spin = atan2(ub.x * rest.y - ub.y * rest.x, dot(ub, rest));
    let q = vec2f(rel.x * cos(spin) - rel.y * sin(spin), rel.x * sin(spin) + rel.y * cos(spin));

    // Past the edge, board 09's haze, glow, rays and ring fade out as board 02's band and bloom
    // fade in. Their reaches shrink from 09's (a share of R) to 02's (px) as the camera nears.
    if (d > -2.0) {
      let x = max(d, 0.0);
      let breathe = 0.93 - 0.07 * cos(t * TAU / 7.0);
      var halo = haze09(x / params.halo.z) + glow09(x / params.halo.y) * breathe + ring09(x / params.halo.x);
      if (params.halo.w > 0.001) {
        // Undo the streamers' CSS transform, scale(1.35, 0.92) rotate(-16deg), to find the conic angle.
        let a = radians(16.0);
        let s = vec2f(q.x / 1.35, q.y / 0.92);
        let l = vec2f(s.x * cos(a) - s.y * sin(a), s.x * sin(a) + s.y * cos(a));
        var deg = degrees(atan2(l.x, -l.y));
        if (deg < 0.0) {
          deg += 360.0;
        }
        let rx = (length(l) - R) / params.halo.z;
        let fade = select(1.0 - 0.55 * stop(rx, 0.0, 0.1775), 0.45 * (1.0 - stop(rx, 0.1775, 0.617)), rx > 0.1775);
        halo += vec3f(201.0, 220.0, 255.0) / 255.0 * rays09(deg) * fade * params.halo.w;
      }
      col += (halo * (1.0 - m) + (band02(page, vec2f(C.x, C.y - R), sx) + bloom02(page, B, sx)) * m) * vis;
    }

    // The ground is opaque, so it hides the nebula, the ribbon and the stars behind it.
    let inside = (1.0 - smoothstep(-0.75, 0.75, d)) * vis;
    col = mix(col, mix(disc09(q, R), ground02(max(-d, 0.0)), m), inside);
    occ *= mix(1.0, smoothstep(0.0, 2.0, d), vis);

    // The edge: board 09's even ring of light gathers into board 02's rim, brightest near the sun.
    // Once the horizon rests, the bright stretch leans toward the cursor, as Contact's horizon did.
    if (d > -1.5 && d < 120.0) {
      let n = rel / max(dist, 0.0001);
      let lean = 0.5 * params.hover * params.settle * (params.light.x - B.x);
      let arc = R * atan2(ub.x * n.y - ub.y * n.x, dot(ub, n)) - lean;
      let mask = mix(1.0, rimMask(arc, W), m);
      let line = clamp(1.0 - abs(d - 0.5), 0.0, 1.0);
      let g1 = 0.7 * shadow(d, 1.0, geo(9.0, 4.0, m));
      let g2 = mix(0.22, 0.4, m) * shadow(d, mix(5.0, 6.0, m), geo(30.0, 22.0, m));
      // Gather: as the ribbon's wisps arrive, the rim lights up (spec §5.5).
      let arrive = 1.0 + 0.25 * gather * smoothstep(0.6, 1.0, gather);
      let edge = mix(vec3f(246.0, 249.0, 255.0), vec3f(240.0, 246.0, 255.0), m) / 255.0 * mix(0.92, 0.95, m) * line
               + mix(vec3f(226.0, 236.0, 255.0), vec3f(214.0, 228.0, 255.0), m) / 255.0 * g1
               + mix(vec3f(160.0, 190.0, 255.0), vec3f(130.0, 168.0, 244.0), m) / 255.0 * g2;
      let faint = vec3f(150.0, 180.0, 240.0) / 255.0 * 0.28 * m * line;
      col += (edge * mask * arrive + faint) * smoothstep(-0.5, 0.5, d) * vis;
    }

    // Board 09's Baily's beads and pink prominences, placed from the bead so they turn with it.
    let feature = (1.0 - smoothstep(0.0, 0.35, m)) * vis;
    if (feature > 0.001 && d > -14.0 && d < 16.0) {
      for (var i = 0; i < 2; i++) {
        let pr = prominence(page, C, R, ub, select(65.0, -167.0, i == 0), select(4.5, 7.0, i == 0), select(2.6, 4.0, i == 0));
        col = mix(col, pr.rgb, pr.a * feature);
      }
      var beads = baily(page, C, R, ub, 13.0, 1.5, 2.0, 6.0, 0.75);
      beads += baily(page, C, R, ub, -13.0, 1.5, 2.0, 6.0, 0.75);
      beads += baily(page, C, R, ub, -22.0, 1.0, 1.0, 5.0, 0.65);
      col += beads * feature;
    }
  }

  // The bead's glare sits over everything. It pulses as board 09's diamond, then as 02's glint.
  if (vis > 0.001 && length(page - B) < max(params.glare.y, max(params.glare.z, params.glare.w)) + 80.0) {
    let pulse = mix(0.91 - 0.09 * cos(t * TAU / 5.2), 0.89 - 0.11 * cos(t * TAU / 6.0), m);
    col += glareAt(page - B, m) * params.sun.w * pulse * vis;
  }

  // Shed: as the horizon settles, its atmosphere peels off the rim around the sun and streams up
  // the page, then fades as it comes to rest and the ribbon takes over (spec §5.4).
  let shed = params.trail.x;
  let shedK = shed * (1.0 - 0.5 * vis) * smoothstep(0.0, 0.15, vis) * (1.0 - smoothstep(0.5, 1.0, params.settle));
  let Rs = 0.95 * params.viewHeight;
  let shedLen = Rs * mix(0.15, 0.9, shed);
  if (shedK > 0.001 && d > 0.0 && d < shedLen) {
    let lat = (page.x - B.x) / Rs;
    let along = d / shedLen;
    let q = vec2f(lat * 14.0, along * 1.6 - shed * 2.5 - t * 0.03);
    let n = fbm(q + vec2f(fbm3(q * 0.8) * 1.2, 0.0));
    let streak = smoothstep(0.42, 0.8, n) * exp(-along * 1.6) * (1.0 - smoothstep(0.7, 1.0, along));
    let crown = 1.0 - smoothstep(0.6, 1.1, abs(lat));
    let tint = mix(vec3f(0.47, 0.7, 0.96), vec3f(0.16, 0.24, 0.52), smoothstep(0.0, 0.8, along));
    // At most ~0.3 added luminance, at the rim.
    col += tint * streak * crown * shedK * 0.45;
  }

  // Gather: the ribbon's wisps run along the resting rim into the sun (spec §5.5).
  if (gather > 0.001 && vis > 0.001 && d > 0.0 && d < 400.0) {
    let inward = abs(page.x - B.x) / (0.37 * W);
    let wq = vec2f(inward * 2.5 + t * 0.04 + gather * 1.5, d / 90.0);
    let wisp = smoothstep(0.55, 0.85, fbm3(wq)) * exp(-d / 180.0);
    // At most ~0.08 added luminance.
    col += vec3f(0.3, 0.45, 0.85) * wisp * gather * 0.12 * vis;
  }

  // Stars in three depths. Each layer moves at its own share of the stars' virtual scroll, so
  // scrolling reads as travel and the field glides on for a moment after a stop.
  let ss = params.trail.w;
  let par = (params.pointer - 0.5) * 8.0 * params.hover;
  let st = stars((css + vec2f(0.0, ss * 0.04) + par * 0.6) / 9.0, t, 0.988, 0.08) * 0.4
         + stars((css + vec2f(0.0, ss * 0.08) + par * 1.2) / 23.0 + 17.0, t * 0.8, 0.98, 0.07) * 0.65
         + stars((css + vec2f(0.0, ss * 0.17) + par * 2.0) / 47.0 + 41.0, t * 0.6, 0.975, 0.09) * 0.95;
  col += vec3f(st * occ);

  let lum = dot(col, vec3f(0.2126, 0.7152, 0.0722));
  let g = hash21(floor(frag) * 0.7311 + 13.17) - 0.5;
  col += g * GRAIN * (0.02 + 0.07 * lum);
  col += (hash21(frag + fract(t) * 91.0) - 0.5) / 255.0;
  return vec4f(max(col, vec3f(0.0)), 1.0);
}
```

- [ ] **Step 4: Validate it.**

Run: `bunx vgpu check src/components/sky/sky.wgsl --require-validation > /tmp/vgpu-check.json; echo $?; head -c 400 /tmp/vgpu-check.json`
Expected: exit 0, `"diagnostics": []` and `"ok": true`.

- [ ] **Step 5: Write the renderer.** Replace `src/components/sky/renderer.ts` with:

```ts
import { effect, frame, surface } from "vgpu";

import skySource from "./sky.wgsl";
import {
  beadFlash,
  bodyFrame,
  endFrame,
  haloFrame,
  settleFrame,
  startFrame,
  stillFrame,
  sunFrame,
  type Body,
} from "@/lib/eclipse";
import { anchorRect, EMPTY_RECT, flight, onTick, startFlight } from "@/lib/flight";
import { getGpu } from "@/lib/gpu";
import { armIntro, introProgress, rise, skyDpr, trailFrame, type Rect } from "@/lib/sky-math";

const INTRO_DELAY_MS = 250;
// The ambient drift (nebula, twinkle, the bead's pulse) needs no more than ~30fps.
const AMBIENT_MS = 33;
// Far above the page and invisible: the body on a page without an eclipse box.
const NO_BODY: Body = { C: [0, -1e5], R: 1, B: [0, -1e5] };

type Callbacks = { onFirstFrame: () => void; onFallback: () => void };

/**
 * Draws the page's sky into the fixed `canvas` on flight's tick. Frames are drawn on demand: when
 * anything the sky reads has changed, while the intro eases, and at ~30fps while the body is still
 * moving (spec §5.8).
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
            viewHeight: 1,
            body: [0, 0, 1, 0],
            sun: [0, 0, 0, 0],
            halo: [1, 1, 1, 0],
            glare: [1, 1, 1, 1],
            settle: 0,
            span: [0, 0],
            trail: [0, 0, 0, 0],
          },
        },
      });
      await sky.compile({ colors: [output.format] });
      if (disposed) return;

      let cssWidth = 1;
      let cssHeight = 1;
      let hero: Rect = EMPTY_RECT;
      let eclipse: Rect = EMPTY_RECT;
      let work: Rect = EMPTY_RECT;
      let contact: Rect = EMPTY_RECT;
      let time = flight.reduced ? 8 : 0;
      let lastDraw = 0;
      let dirty = true;
      let shown = false;
      let introStart: number | null = null;
      // What the last frame was drawn from; a tick that matches it draws nothing.
      const last = new Float64Array(13).fill(Number.NaN);

      // Layout is read only here, never inside a tick.
      measure = () => {
        hero = anchorRect("hero");
        eclipse = anchorRect("eclipse");
        work = anchorRect("work");
        contact = anchorRect("contact");
        flight.hero = hero;
        dirty = true;
      };

      const resize = () => {
        cssWidth = Math.max(canvas.clientWidth, 1);
        cssHeight = Math.max(canvas.clientHeight, 1);
        const dpr = skyDpr(window.devicePixelRatio, cssWidth, cssHeight);
        output.resize([Math.max(1, Math.round(cssWidth * dpr)), Math.max(1, Math.round(cssHeight * dpr))]);
        dirty = true;
      };

      const tick = (now: number) => {
        if (document.hidden) return;
        const { light, pointer, reduced } = flight;
        const cam = flight.eclipse;
        const scrollY = flight.scroll;
        const W = cssWidth;
        const H = cssHeight;
        const hasEclipse = eclipse.width > 0;

        // The tick only runs while the tab is visible.
        introStart = armIntro(introStart, now + INTRO_DELAY_MS, hasEclipse, true);
        const intro = reduced ? 1 : introStart === null ? 0 : introProgress(now - introStart);
        let body = NO_BODY;
        let morph = 0;
        let settle = 0;
        if (hasEclipse && reduced) {
          const still = stillFrame(startFrame(eclipse, hero.top), { hero, work, contact }, W, H, scrollY);
          body = still.body;
          morph = still.morph;
          // The still horizon is at rest; the still eclipse isn't.
          settle = still.morph;
        } else if (hasEclipse) {
          const settled = settleFrame(bodyFrame(cam, startFrame(eclipse, hero.top), endFrame(W, H)), scrollY, cam.end, H);
          body = settled.body;
          morph = cam.morph;
          settle = settled.s;
        }
        const vis = hasEclipse ? intro : 0;
        const up = !contact.height ? 0 : reduced ? 1 : rise(scrollY, H, contact);
        const trail = trailFrame(settle, up, reduced, work.height > 0);
        const starScroll = scrollY + flight.coast.offset;

        const inputs = [
          scrollY, starScroll, light.x, light.y, light.hover, pointer.nx, pointer.ny, reduced ? 1 : 0,
          cam.zoom, cam.pan, cam.level, cam.morph, cam.end,
        ];
        let changed = dirty;
        inputs.forEach((value, i) => {
          if (value !== last[i]) {
            last[i] = value;
            changed = true;
          }
        });
        const easing = !reduced && introStart !== null && intro < 1;
        // At rest the body holds still, so reading Work costs no frames (spec §5.8).
        const ambient = !reduced && vis > 0.001 && settle < 1;
        if (!changed && !easing && !(ambient && now - lastDraw >= AMBIENT_MS)) return;

        // Time only runs while something ambient is in view; elsewhere frames are static.
        if (ambient && lastDraw) time += Math.min((now - lastDraw) / 1000, 0.1);
        lastDraw = now;
        dirty = false;
        const halo = haloFrame(morph, body.R);
        const glare = sunFrame(morph, W);
        sky.set({
          params: {
            resolution: output.size,
            dpr: output.size[0] / cssWidth,
            scroll: scrollY,
            light: [light.x, light.y],
            pointer: [pointer.nx, pointer.ny],
            hover: light.hover,
            time,
            viewHeight: H,
            body: [body.C[0], body.C[1] + scrollY, body.R, vis],
            sun: [body.B[0], body.B[1] + scrollY, morph, beadFlash(intro)],
            halo: [halo.ring, halo.glow, halo.haze, halo.rays],
            glare: [glare.core, glare.glare, glare.streakH, glare.streakV],
            settle,
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

- [ ] **Step 6: Remove the orb's and Contact horizon's maths.** In `src/lib/sky-math.ts`:
  1. Delete `departure`: its doc comment and the function.
  2. Delete `orbFrame` and `horizonFrame`, each with its doc comment.
  3. Replace `trailFrame`'s doc comment with:

```ts
/**
 * The horizon's trail (motion spec §4.1, eclipse spec §5.4): its atmosphere sheds off the rim as it
 * settles (`dep` is how far it has settled), carries on as a ribbon of nebula through Work, and
 * gathers back into the resting horizon as Contact rises.
 */
```

- [ ] **Step 7: Retire their tests.** In `src/lib/sky-math.test.ts`:
  1. Remove `departure`, `horizonFrame` and `orbFrame` from the import list.
  2. Delete the `describe("orbFrame", …)` and `describe("horizonFrame", …)` blocks.
  3. In `describe("departure and rise", …)`:
     - Rename it to `describe("rise", …)`.
     - Delete its first test, "departure runs 0..1 across the hero".
     - In "a missing anchor never divides by zero", delete the `departure` line.
  4. Rename four `trailFrame` tests, which now describe the settle:
     - "nothing sheds at the top, and the whole trail has shed as the orb finishes fading" → "nothing sheds before the settle, and the whole trail has shed well before it ends"
     - "most of the shed happens while the setting limb is still in view" → "most of the shed happens in the first quarter of the settle, while the horizon still moves". Delete its `// The orb sinks…` comment.
     - "shed grows monotonically with departure" → "shed grows monotonically with the settle"
     - "the ribbon appears as the orb leaves and dims as the horizon takes over" → "the ribbon appears as the horizon settles and dims as Contact rises"

- [ ] **Step 8: Run the browser tests to see them pass.**

Run: `cd $PW && node eclipse.mjs test_rest_frame test_hold_frame test_settle test_story test_reduced_still`
Expected:
- `test_rest_frame 1440` and `390` PASS: the centre is under 0.01, and the edge and the bead are at 1.
- `test_hold_frame 1440` PASSes with the sun at x 547 and the apex at y 575. At 390 the sun is at x 148.
- `test_settle` PASSes with apexes of about `[575, 662, 723, 773, 773]`.
- `test_reduced_still` PASSes with the Contact apex within 3 px of its expected y.
- `test_story` PASSes and writes `story-*.png`.

Read `story-0-1440.png`, `story-hold-1440.png`, `story-settle-1440.png` and `story-rest-1440.png`. Then:
- **09 and 02:** check them against spec §2.1–2.4. 0 should be board 09 and hold should be board 02.
- **Settle:** shows the shed streaming up as aurora streaks.
- **Rest:** the horizon sits at 86% with the ribbon behind Work.

- [ ] **Step 9: Run the checks.**

Run: `bun run lint && bun run typecheck && bun test && bunx vgpu check src/components/sky/sky.wgsl --require-validation > /dev/null && bun run build`
Expected: all green. `bun test` is 80 tests across 6 files.

- [ ] **Step 10: Commit.**

```bash
git add src/components/sky/sky.wgsl src/components/sky/renderer.ts src/lib/sky-math.ts src/lib/sky-math.test.ts
git commit -m "feat(sky): fly into the eclipse until it rests as the page's horizon"
```

---

### Task 5: The front layer: content rises from behind the horizon

**Files:**
- Modify: `src/components/sky/sky.wgsl` (`Params`, the top and the bottom of `fs_main`)
- Modify: `src/components/sky/renderer.ts` (replace the file)
- Modify: `src/components/sky/sky.tsx`
- Modify: `src/app/globals.css` (scroll padding)
- Modify: `src/components/contact.tsx` (the footer's `z-index`)
- Test: `$PW/eclipse.mjs`:
  - `test_front_layer`, `test_reveal`, `test_ground_click`, `test_focus_rim`, `test_footer`, `test_idle_rest`
  - `test_load_mid_page`, `test_resize_rest`, `test_reduced_toggle`, `test_not_found`, `test_device_loss_front`

**Interfaces:**
- Consumes: Task 4's renderer and shader.
- Produces:
  - **`mountSky`:** now `mountSky(canvas: HTMLCanvasElement, front: HTMLCanvasElement, callbacks)`.
  - **Front canvas:** the second `<canvas>` in `Sky`:
    - It's fixed at `top: 62lvh`, with `height: 38lvh` and `z-30`.
    - It's hidden until the scroll passes `flight.eclipse.end`.
    - Its `clip-path` is a circle matching the planet.
  - **`Params`:** gains `layer: f32` and `origin: f32`.

- [ ] **Step 1: Write the failing browser tests.** In `$PW/eclipse.mjs`, insert above `// runner`:

```js
tests.test_front_layer = async () => {
  const p = await open();
  const g = await geometry(p);
  const state = () => p.evaluate(() => {
    const c = document.querySelectorAll("canvas")[1];
    return { visibility: getComputedStyle(c).visibility, clip: c.style.clipPath };
  });
  const hero = await state();
  await jump(p, g.end + 20);
  const after = await state();
  report("test_front_layer", hero.visibility === "hidden" && after.visibility === "visible" && after.clip.startsWith("circle("), { hero, after });
  await p.context().close();
};

tests.test_reveal = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    // The last project's name: ink, never dimmed, and deep enough that the horizon has come to rest.
    const sel = "#stackmap h3";
    const top = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
    await jump(p, top - (0.86 * h - 30));
    const box = await p.$eval(sel, (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const withText = await shot(p);
    await p.addStyleTag({ content: `${sel} { visibility: hidden !important; }` });
    await p.waitForTimeout(300);
    const without = await shot(p);
    await skyOnly(p);
    await p.waitForTimeout(300);
    const sky = await shot(p);
    let above = 0;
    let below = 0;
    for (let x = Math.ceil(box.x); x < Math.min(w, box.x + box.w); x++) {
      // The sun's flare is brighter than the rim in its own column, so skip it.
      if (Math.abs(x - 0.38 * w) < 10) continue;
      const rim = brightestInColumn(sky, x, 0.6 * h, 0.97 * h).y;
      for (let y = Math.max(0, Math.floor(box.y)); y < Math.min(h, box.y + box.h); y++) {
        const i = (y * w + x) * 4;
        const d = Math.abs(withText.data[i] - without.data[i]) + Math.abs(withText.data[i + 1] - without.data[i + 1]) + Math.abs(withText.data[i + 2] - without.data[i + 2]);
        if (d <= 24) continue;
        if (y < rim - 3) above++;
        else if (y > rim + 3) below++;
      }
    }
    report(`test_reveal ${w}`, above > 50 && below === 0, { box, above, below });
    await p.context().close();
  }
};

tests.test_ground_click = async () => {
  const p = await open();
  const g = await geometry(p);
  const top = await p.evaluate(() => document.querySelector("#umamin .visit").getBoundingClientRect().top + scrollY);
  await jump(p, top - (g.H - 60));
  const v = await p.$eval("#umamin .visit", (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  let popups = 0;
  p.context().on("page", () => popups++);
  await p.mouse.click(v.x, v.y);
  await p.waitForTimeout(800);
  report("test_ground_click", v.y > 0.88 * g.H && popups === 0, { visit: v, popups });
  await p.context().close();
};

tests.test_focus_rim = async () => {
  const p = await open();
  const g = await geometry(p);
  const top = await p.evaluate(() => document.querySelector("#omsimos .visit").getBoundingClientRect().top + scrollY);
  await jump(p, top - (g.H - 60));
  await p.focus("#omsimos .visit");
  await settle(p);
  const bottom = await p.$eval("#omsimos .visit", (e) => e.getBoundingClientRect().bottom);
  report("test_focus_rim", bottom <= 0.86 * g.H, { bottom, rim: 0.86 * g.H });
  await p.context().close();
};

tests.test_footer = async () => {
  const p = await open();
  await jump(p, 1e6);
  const box = await p.$eval("#contact footer", (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const a = await shot(p, { clip: box });
  await p.addStyleTag({ content: "#contact footer { visibility: hidden !important; }" });
  await p.waitForTimeout(300);
  const c = await shot(p, { clip: box });
  let differ = 0;
  for (let i = 0; i < a.data.length; i += 4) if (Math.abs(a.data[i] - c.data[i]) > 24) differ++;
  report("test_footer", box.y > 0.86 * 900 && differ > 100, { box, differ });
  await p.context().close();
};

tests.test_idle_rest = async () => {
  const p = await open();
  const g = await geometry(p);
  await p.mouse.move(20, 450);
  await jump(p, g.end + 2 * g.H, 3000);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(2000);
  const idle = (await p.evaluate(() => window.__submits)) - s0;
  report("test_idle_rest", idle === 0 && s0 > 0, { s0, idle });
  await p.context().close();
};

const frontState = (p) =>
  p.evaluate(() => {
    const c = document.querySelectorAll("canvas")[1];
    return { visibility: getComputedStyle(c).visibility, clip: c.style.clipPath, sky: document.documentElement.dataset.sky };
  });

tests.test_load_mid_page = async () => {
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
  await p.goto(URL + "#umamin");
  await p.waitForTimeout(4500);
  const front = await frontState(p);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(2000);
  const idle = (await p.evaluate(() => window.__submits)) - s0;
  await skyOnly(p);
  const apex = brightestInColumn(await shot(p), 720, 0.55 * 900, 0.97 * 900);
  report("test_load_mid_page", front.visibility === "visible" && idle === 0 && Math.abs(apex.y - 0.86 * 900) <= 2, { front, idle, apex });
  await ctx.close();
};

tests.test_resize_rest = async () => {
  const p = await open();
  const g = await geometry(p);
  await jump(p, g.end + 2 * g.H);
  await p.setViewportSize({ width: 1200, height: 800 });
  await p.waitForTimeout(2500);
  await skyOnly(p);
  const apex = brightestInColumn(await shot(p), 600, 0.55 * 800, 0.97 * 800);
  const front = await frontState(p);
  report("test_resize_rest", front.visibility === "visible" && Math.abs(apex.y - 0.86 * 800) <= 2 && p.errors.length === 0, { apex, front, errors: p.errors });
  await p.context().close();
};

tests.test_reduced_toggle = async () => {
  const p = await open();
  const g = await geometry(p);
  await jump(p, g.end + 2 * g.H);
  const before = await frontState(p);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.waitForTimeout(1500);
  const after = await frontState(p);
  await p.emulateMedia({ reducedMotion: "no-preference" });
  await p.waitForTimeout(1500);
  const back = await frontState(p);
  const y = await p.evaluate(() => scrollY);
  // Back in motion, the ground shows exactly when the scroll is past the runway.
  const expected = y >= (await geometry(p)).end ? "visible" : "hidden";
  report("test_reduced_toggle", before.visibility === "visible" && after.visibility === "hidden" && back.visibility === expected && p.errors.length === 0, { before, after, back, y, errors: p.errors });
  await p.context().close();
};

tests.test_not_found = async () => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !m.text().includes("404") && errors.push(m.text()));
  await p.goto(URL + "no-such-page");
  await p.waitForTimeout(3500);
  const front = await frontState(p);
  report("test_not_found", front.visibility === "hidden" && errors.length === 0, { front, errors });
  await ctx.close();
};

tests.test_device_loss_front = async () => {
  const p = await open({}, () => {
    const req = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...a) {
      const d = await req.apply(this, a);
      (window.__devices ||= []).push(d);
      return d;
    };
  });
  const g = await geometry(p);
  await jump(p, g.end + 2 * g.H);
  const before = await frontState(p);
  await p.evaluate(() => window.__devices.forEach((d) => d.destroy()));
  await p.waitForTimeout(1500);
  const after = await frontState(p);
  report("test_device_loss_front", before.visibility === "visible" && after.visibility === "hidden" && after.sky === "css", { before, after });
  await p.context().close();
};
```

- [ ] **Step 2: Run them to see them fail.**

Run: `cd $PW && node eclipse.mjs test_front_layer test_reveal test_ground_click test_footer`
Expected: `test_front_layer` stops with a TypeError, because there's no second canvas. Without the front layer:
- `test_reveal` fails, since the name shows below the rim;
- `test_ground_click` opens a popup;
- `test_footer` may pass already.

- [ ] **Step 3: Add the front pass to the shader.** In `src/components/sky/sky.wgsl`:

  1. In `Params`, after `time: f32,`, add:

```wgsl
  // 1 for the front pass, which draws only the ground over the content (spec §5.6), else 0.
  layer: f32,
  // The front canvas's top in the viewport, CSS px; 0 for the back canvas.
  origin: f32,
```

  2. In `fs_main`, replace `let css = frag / params.dpr;` with:

```wgsl
  let css = frag / params.dpr + vec2f(0.0, params.origin);
  // The same screen pixel in both passes, so the grain and dither match across the rim.
  let screen = frag + vec2f(0.0, params.origin * params.dpr);
```

  3. After `let d = dist - R;`, add:

```wgsl

  // The front pass keeps only the ground and the rim; above them it is clear.
  let front = params.layer > 0.5;
  if (front && (vis <= 0.001 || d > 3.0)) {
    return vec4f(0.0);
  }
  // Deep in the ground the nebula and the ribbon are hidden anyway.
  let buried = front && d < -2.0 && vis > 0.999;
```

  4. Change `if (env > 0.003) {` to `if (!buried && env > 0.003) {`. Change `if (carry > 0.003 && page.y > workTop - 400.0` to `if (!buried && carry > 0.003 && page.y > workTop - 400.0`.

  5. Replace the last five lines of `fs_main`, from `let g = hash21(floor(frag)…` to `return vec4f(max(col, vec3f(0.0)), 1.0);`, with:

```wgsl
  let g = hash21(floor(screen) * 0.7311 + 13.17) - 0.5;
  col += g * GRAIN * (0.02 + 0.07 * lum);
  col += (hash21(screen + fract(t) * 91.0) - 0.5) / 255.0;
  let rgb = max(col, vec3f(0.0));
  if (front) {
    // Opaque up to 1.5 px above the rim, so the rim line sits over the content; clear by 3 px.
    let a = 1.0 - smoothstep(1.5, 3.0, d);
    return vec4f(rgb * a, a);
  }
  return vec4f(rgb, 1.0);
```

- [ ] **Step 4: Validate it.**

Run: `bunx vgpu check src/components/sky/sky.wgsl --require-validation > /tmp/vgpu-check.json; echo $?; head -c 400 /tmp/vgpu-check.json`
Expected: exit 0, `"diagnostics": []` and `"ok": true`.

- [ ] **Step 5: Draw the ground.** Replace `src/components/sky/renderer.ts` with:

```ts
import { effect, frame, surface } from "vgpu";

import skySource from "./sky.wgsl";
import {
  beadFlash,
  bodyFrame,
  endFrame,
  haloFrame,
  settleFrame,
  startFrame,
  stillFrame,
  sunFrame,
  type Body,
} from "@/lib/eclipse";
import { anchorRect, EMPTY_RECT, flight, onTick, startFlight } from "@/lib/flight";
import { getGpu } from "@/lib/gpu";
import { armIntro, introProgress, rise, skyDpr, trailFrame, type Rect } from "@/lib/sky-math";

const INTRO_DELAY_MS = 250;
// The ambient drift (nebula, twinkle, the bead's pulse) needs no more than ~30fps.
const AMBIENT_MS = 33;
// Far above the page and invisible: the body on a page without an eclipse box.
const NO_BODY: Body = { C: [0, -1e5], R: 1, B: [0, -1e5] };

type Callbacks = { onFirstFrame: () => void; onFallback: () => void };

/**
 * Draws the page's sky into the fixed `canvas` on flight's tick, and the resting horizon's ground
 * into `front`, over the content (spec §5.6). Frames are drawn on demand: when anything the sky
 * reads has changed, while the intro eases, and at ~30fps while the body is still moving.
 */
export function mountSky(canvas: HTMLCanvasElement, front: HTMLCanvasElement, { onFirstFrame, onFallback }: Callbacks) {
  let disposed = false;
  let measure = () => {};
  const hideFront = () => {
    front.style.visibility = "hidden";
    front.style.clipPath = "";
  };
  const teardown: (() => void)[] = [startFlight(), hideFront];

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
      // The ground over the content writes premultiplied alpha: clear above the rim.
      const frontOutput = surface(gpu, front, { autoResize: false, alphaMode: "premultiplied" });
      teardown.push(() => frontOutput.dispose());

      const initial = {
        resolution: output.size,
        light: [0, 0],
        pointer: [0.5, 0.5],
        dpr: 1,
        scroll: 0,
        hover: 0,
        time: flight.reduced ? 8 : 0,
        layer: 0,
        origin: 0,
        viewHeight: 1,
        body: [0, 0, 1, 0],
        sun: [0, 0, 0, 0],
        halo: [1, 1, 1, 0],
        glare: [1, 1, 1, 1],
        settle: 0,
        span: [0, 0],
        trail: [0, 0, 0, 0],
      };
      const sky = effect(gpu, skySource, { set: { params: initial } });
      const ground = effect(gpu, skySource, { set: { params: { ...initial, layer: 1 } } });
      await Promise.all([sky.compile({ colors: [output.format] }), ground.compile({ colors: [frontOutput.format] })]);
      if (disposed) return;

      let cssWidth = 1;
      let cssHeight = 1;
      let frontTop = 0;
      let hero: Rect = EMPTY_RECT;
      let eclipse: Rect = EMPTY_RECT;
      let work: Rect = EMPTY_RECT;
      let contact: Rect = EMPTY_RECT;
      let time = flight.reduced ? 8 : 0;
      let lastDraw = 0;
      let dirty = true;
      let shown = false;
      let frontShown = false;
      let introStart: number | null = null;
      // What the last frame was drawn from; a tick that matches it draws nothing.
      const last = new Float64Array(13).fill(Number.NaN);
      // What the ground was last drawn from. It doesn't move with the scroll, so it redraws only when these change.
      const lastGround = new Float64Array(16).fill(Number.NaN);

      // Layout is read only here, never inside a tick.
      measure = () => {
        hero = anchorRect("hero");
        eclipse = anchorRect("eclipse");
        work = anchorRect("work");
        contact = anchorRect("contact");
        flight.hero = hero;
        dirty = true;
      };

      const resize = () => {
        cssWidth = Math.max(canvas.clientWidth, 1);
        cssHeight = Math.max(canvas.clientHeight, 1);
        const dpr = skyDpr(window.devicePixelRatio, cssWidth, cssHeight);
        output.resize([Math.max(1, Math.round(cssWidth * dpr)), Math.max(1, Math.round(cssHeight * dpr))]);
        const box = front.getBoundingClientRect();
        frontTop = box.top;
        frontOutput.resize([Math.max(1, Math.round(cssWidth * dpr)), Math.max(1, Math.round(box.height * dpr))]);
        dirty = true;
        // Resizing clears the canvas.
        lastGround.fill(Number.NaN);
      };

      const tick = (now: number) => {
        if (document.hidden) return;
        const { light, pointer, reduced } = flight;
        const cam = flight.eclipse;
        const scrollY = flight.scroll;
        const W = cssWidth;
        const H = cssHeight;
        const hasEclipse = eclipse.width > 0;

        // The tick only runs while the tab is visible.
        introStart = armIntro(introStart, now + INTRO_DELAY_MS, hasEclipse, true);
        const intro = reduced ? 1 : introStart === null ? 0 : introProgress(now - introStart);
        let body = NO_BODY;
        let morph = 0;
        let settle = 0;
        if (hasEclipse && reduced) {
          const still = stillFrame(startFrame(eclipse, hero.top), { hero, work, contact }, W, H, scrollY);
          body = still.body;
          morph = still.morph;
          // The still horizon is at rest; the still eclipse isn't.
          settle = still.morph;
        } else if (hasEclipse) {
          const settled = settleFrame(bodyFrame(cam, startFrame(eclipse, hero.top), endFrame(W, H)), scrollY, cam.end, H);
          body = settled.body;
          morph = cam.morph;
          settle = settled.s;
        }
        const vis = hasEclipse ? intro : 0;
        const up = !contact.height ? 0 : reduced ? 1 : rise(scrollY, H, contact);
        const trail = trailFrame(settle, up, reduced, work.height > 0);
        const starScroll = scrollY + flight.coast.offset;
        const bead = beadFlash(intro);
        // The ground covers the content from the runway's end on (spec §5.6).
        const frontOn = !reduced && hasEclipse && scrollY >= cam.end;

        const inputs = [
          scrollY, starScroll, light.x, light.y, light.hover, pointer.nx, pointer.ny, reduced ? 1 : 0,
          cam.zoom, cam.pan, cam.level, cam.morph, cam.end,
        ];
        let changed = dirty;
        inputs.forEach((value, i) => {
          if (value !== last[i]) {
            last[i] = value;
            changed = true;
          }
        });
        const easing = !reduced && introStart !== null && intro < 1;
        // At rest the body holds still, so reading Work costs no frames (spec §5.8).
        const ambient = !reduced && vis > 0.001 && settle < 1;
        if (!changed && !easing && !(ambient && now - lastDraw >= AMBIENT_MS)) return;

        // Time only runs while something ambient is in view; elsewhere frames are static.
        if (ambient && lastDraw) time += Math.min((now - lastDraw) / 1000, 0.1);
        lastDraw = now;
        dirty = false;
        const halo = haloFrame(morph, body.R);
        const glare = sunFrame(morph, W);
        const params = {
          resolution: output.size,
          dpr: output.size[0] / cssWidth,
          scroll: scrollY,
          light: [light.x, light.y],
          pointer: [pointer.nx, pointer.ny],
          hover: light.hover,
          time,
          layer: 0,
          origin: 0,
          viewHeight: H,
          body: [body.C[0], body.C[1] + scrollY, body.R, vis],
          sun: [body.B[0], body.B[1] + scrollY, morph, bead],
          halo: [halo.ring, halo.glow, halo.haze, halo.rays],
          glare: [glare.core, glare.glare, glare.streakH, glare.streakV],
          settle,
          span: [work.top, contact.height ? contact.top : work.top + work.height],
          trail: [trail.shed, trail.carry, trail.gather, starScroll],
        };
        sky.set({ params });

        if (frontOn !== frontShown) {
          frontShown = frontOn;
          front.style.visibility = frontOn ? "visible" : "hidden";
        }
        const groundInputs = [
          frontOn ? 1 : 0, body.C[0], body.C[1], body.R, body.B[0], body.B[1], morph, vis, bead, settle,
          light.hover > 0 ? light.x : 0, light.hover, time, W, H, frontTop,
        ];
        let groundChanged = false;
        groundInputs.forEach((value, i) => {
          if (value !== lastGround[i]) {
            lastGround[i] = value;
            groundChanged = true;
          }
        });
        const drawGround = frontOn && groundChanged;
        if (drawGround) {
          ground.set({ params: { ...params, resolution: frontOutput.size, layer: 1, origin: frontTop } });
          // Hit-testing follows the planet: the ground takes the clicks, the clear sky above it doesn't.
          front.style.clipPath = `circle(${(body.R + 3).toFixed(1)}px at ${body.C[0].toFixed(1)}px ${(body.C[1] - frontTop).toFixed(1)}px)`;
        }
        const done = frame(gpu, (f) => {
          f.pass(output, sky);
          if (drawGround) f.pass(frontOutput, ground);
        }).done;
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
      canvasObserver.observe(front);
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
        hideFront();
        onFallback();
      });

      resize();
      measure();
    } catch (error) {
      console.error(error);
      hideFront();
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

- [ ] **Step 6: Mount the front canvas.** In `src/components/sky/sky.tsx`:

  1. Replace the component's doc comment with:

```tsx
/**
 * The fixed vgpu sky behind every page, and the resting horizon's ground over the content (spec
 * §5.6). The CSS sky (fallback.tsx) shows until it's live.
 */
```

  2. After `const canvasRef = useRef<HTMLCanvasElement>(null);`, add `const frontRef = useRef<HTMLCanvasElement>(null);`.

  3. In the mount effect:
     - Replace `if (!canvas || !("gpu" in navigator)) return;` with `const front = frontRef.current;` followed by `if (!canvas || !front || !("gpu" in navigator)) return;`.
     - Pass `front` as `mountSky`'s second argument: `mountSky(canvas, front, { … })`.

  4. Replace the returned `<canvas … />` with:

```tsx
  const fade = `transition-opacity duration-1200 ${shown ? "opacity-100" : "opacity-0"}`;
  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 top-0 -z-1 h-lvh w-full ${fade}`}
      />
      {/* The renderer shows it from the runway's end and clips its hit area to the planet. */}
      <canvas
        ref={frontRef}
        aria-hidden="true"
        className={`invisible fixed inset-x-0 top-[62lvh] z-30 h-[38lvh] w-full ${fade}`}
      />
    </>
  );
```

- [ ] **Step 7: Keep focus above the rim, and the footer on the ground.**

  1. In `src/app/globals.css`, directly after the `[data-sky="live"] .sky-fallback { visibility: hidden; }` rule, add:

```css

/* The resting horizon's ground covers the bottom of the screen (spec §3.4), so focus and anchor
   scrolling stop above it. */
@media (prefers-reduced-motion: no-preference) {
  [data-sky="live"] {
    scroll-padding-bottom: calc(14lvh + 24px);
  }
}
```

  2. In `src/components/contact.tsx`, put this comment directly above `<footer`:

```tsx
      {/* Above the sky's front layer, so it sits on the ground (spec §3.4). */}
```

   Then change the footer's `relative z-1` to `relative z-40`.

- [ ] **Step 8: Run the browser tests to see them pass.**

Run: `cd $PW && node eclipse.mjs test_front_layer test_reveal test_ground_click test_focus_rim test_footer test_idle_rest test_load_mid_page test_resize_rest test_reduced_toggle test_not_found test_device_loss_front`
Expected: every test PASSes.
- `test_reveal 1440`: `above` in the thousands and `below: 0`.
- `test_focus_rim`: `bottom` well under 774.
- `test_idle_rest` and `test_load_mid_page`: `idle: 0`.
- `test_resize_rest`: the apex at 687, which is 86% of 800.
- `test_reduced_toggle`: `back.visibility` matches the scroll position. The page jumps to 0 when motion switches back on (Review Focus 3).

Then re-run Task 4's tests, which must still pass with the front layer drawing:

Run: `cd $PW && node eclipse.mjs test_rest_frame test_hold_frame test_settle test_reduced_still`
Expected: all PASS.

- [ ] **Step 9: Run the checks.**

Run: `bun run lint && bun run typecheck && bun test && bunx vgpu check src/components/sky/sky.wgsl --require-validation > /dev/null && bun run build`
Expected: all green.

- [ ] **Step 10: Commit.**

```bash
git add src/components/sky/sky.wgsl src/components/sky/renderer.ts src/components/sky/sky.tsx src/app/globals.css src/components/contact.tsx
git commit -m "feat(sky): draw the resting horizon's ground over the content"
```

---

### Task 6: Production verification and the earlier specs

**Files:**
- Test: `$PW/eclipse.mjs` (`test_contrast_rest`, `test_back_to_top`)
- Test: `$PW/voyage.mjs`: `test_coast`, `test_blur_in` and `test_words_visible` are retargeted, and `test_story` is retired
- Modify: `docs/superpowers/specs/2026-10-07-portfolio-redesign-design.md`, `docs/superpowers/specs/2026-10-07-motion-and-light-design.md`
- Modify: nothing else, unless a check fails. A fix gets a RED→GREEN test and its own commit.

**Interfaces:**
- Consumes: everything above.
- Produces: no new interfaces.

- [ ] **Step 1: Add the last checks.** In `$PW/eclipse.mjs`, insert above `// runner`:

```js
tests.test_contrast_rest = async () => {
  const DIM = lum(0x7c, 0x81, 0x8b);
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await p.addStyleTag({ content: "#home h1, #home h1 * { color: transparent !important; } .full-stop { visibility: hidden !important; }" });
    await p.waitForTimeout(300);
    const boxes = await p.$$eval("#home h1 [data-head-word]:not(.text-ink)", (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    let worst = Infinity;
    for (const clip of boxes) {
      const img = await shot(p, { clip });
      const ls = [];
      for (let i = 0; i < img.data.length; i += 4) ls.push(lum(img.data[i], img.data[i + 1], img.data[i + 2]));
      ls.sort((x, y) => x - y);
      worst = Math.min(worst, (DIM + 0.05) / (ls[Math.floor(ls.length * 0.95)] + 0.05));
    }
    report(`test_contrast_rest ${w}`, boxes.length > 5 && worst >= 4.5, { words: boxes.length, worst: +worst.toFixed(2) });
    await p.context().close();
  }
};

tests.test_back_to_top = async () => {
  const p = await open();
  await jump(p, 1e6, 1500);
  await p.click("#contact footer a");
  const y = await settle(p);
  await p.waitForTimeout(1500);
  await skyOnly(p);
  const g = await geometry(p);
  const img = await shot(p);
  report("test_back_to_top", y === 0 && at(img, g.C[0], g.C[1]) < 0.01 && at(img, g.C[0] + g.R + 1, g.C[1]) > 0.4, { y });
  await p.context().close();
};
```

- [ ] **Step 2: Retarget the old suite to the new hero.** In `$PW/voyage.mjs`:

  1. In `test_coast`, replace the comment and the `scrollTo(0, 820)` line with:

```js
    // A quiet stretch: Work, where the horizon rests (eclipse spec §5.8).
    await p.evaluate(() => scrollTo(0, document.querySelector("#work").offsetTop + 100));
```

  2. In `test_blur_in`, change `hero.length === 4` to `hero.length === 19`.

  3. In `test_words_visible`, change `words.length === 7` to `words.length === 22`. That's the statement's 19 words plus "Send a signal.".

  4. Delete `tests.test_story`. Its orb screenshots are replaced by `eclipse.mjs`'s `test_story`.

- [ ] **Step 3: Build and serve production on port 3100** in a right-hand pane.

```bash
herdr pane split --current --direction right --ratio 0.4 --cwd /Users/hyamero/Documents/Projects/personal/portfolio --no-focus
# note the pane_id as $PROD
herdr pane run $PROD 'bun run build && bun run start -p 3100'
curl -sf --retry 180 --retry-delay 1 --retry-connrefused -o /dev/null http://localhost:3100/ && echo up
```
Expected: `up`.

- [ ] **Step 4: Run both suites against production.**

Run: `cd $PW && URL=http://localhost:3100/ node eclipse.mjs`
Expected:
- Every test PASSes.
- `test_contrast_rest`'s worst ratio is about 4.78 at 1440 and about 5.03 at 390.

Run: `cd $PW && URL=http://localhost:3100/ node voyage.mjs`
Expected:
- Every test PASSes.
- `test_frames`: p95 17 ms or less, no frame over 50 ms, CLS under 0.05. It ran at 16.8 ms on the owner's Mac in the pre-check.
- `test_contrast` holds at 4.5 or above. It centres each statement, well over 120 px above the rim, so it also covers spec §2.6's Work check.
- `test_firefox` reports `sky: "css"`.

Then read the `story-*-1440.png` and `story-*-390.png` screenshots once more against spec §2.1–2.5.

- [ ] **Step 5: Point the earlier specs here.**

  1. In `docs/superpowers/specs/2026-10-07-portfolio-redesign-design.md`:
     - **§3.3:** directly under `### 3.3 Hero (\`#home\`)`, add a blank line and `> Superseded by the [eclipse to horizon spec](2026-10-09-eclipse-to-horizon-design.md), §3: board 09's statement and eclipse, over a runway.`
     - **§4.2, the orb:** after item 3's last sub-bullet, "It is drawn where `vis > 0`…", add `   - **Superseded:** the eclipse-to-horizon spec's body replaces the orb (§5.3).`
     - **§4.2, the horizon:** after item 4's last sub-bullet, "**Surface:** dark below the rim…", add `   - **Superseded:** the resting horizon replaces it (eclipse-to-horizon spec §5.5).`
     - **§4.6:** at the end of the `**Hero:**` fallback-layers line, add ` Superseded by the eclipse-to-horizon spec's §7.`
  2. In `docs/superpowers/specs/2026-10-07-motion-and-light-design.md`:
     - **§4.1:** directly under `### 4.1 Trail: shed, carry, gather`, add a blank line and `> The shed now peels off the settling horizon, and the trail gathers into the resting one: see the [eclipse to horizon spec](2026-10-09-eclipse-to-horizon-design.md), §5.4–5.5.`
     - **§6.4:** directly under `### 6.4 Headline blur-in`, add a blank line and `> The hero's words are now the statement's, staggered 0.04 s: see the [eclipse to horizon spec](2026-10-09-eclipse-to-horizon-design.md), §6.`

- [ ] **Step 6: Run every check.**

```bash
bun run lint && bun run typecheck && bun test && bunx vgpu check src/components/sky/sky.wgsl --require-validation > /dev/null && bun run build
```
Expected: all green.

- [ ] **Step 7: Commit the docs, and close the panes you opened.**

```bash
git add docs/superpowers/specs/2026-10-07-portfolio-redesign-design.md docs/superpowers/specs/2026-10-07-motion-and-light-design.md
git commit -m "docs: point the earlier specs at the eclipse-to-horizon spec"
herdr pane close $PROD
```
Close `$DEV` too if you opened it.

- [ ] **Step 8: Hand over to the owner.** Ask the owner to check these, which only they can do:
  - The scrub and settle on their Windows PC, in Chrome and Firefox, looking for seams on the edge, halo and horizon (spec §2.10).
  - Safari on macOS and iOS (spec §10, Manual).
  - At rest, moving the cursor across the page: the rim's bright stretch leans toward it (spec §5.3, Light). No automated check covers this.
  - The tuning values. The middle of the approach is the brightest stretch: `story-50-1440.png` shows how much of the screen the halo takes there.
