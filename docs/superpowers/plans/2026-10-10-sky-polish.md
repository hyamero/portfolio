# Sky Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The vgpu sky looks like a photograph wherever people read (a real star field with a Milky Way, a real corona, an orbital sunrise) and turns cinematic only in motion or when it answers you, and the CSS sky becomes stills rendered from the same shader.

**Architecture:**
- **WGSL modules** under `src/components/sky/wgsl/` (`noise`, `light`, `stars`, `corona`, `air`, `lens`, `body`, `trail`), imported by three entry points:
  - `sky.wgsl`, the live sky;
  - `wgsl/milky-cache.wgsl`, the Milky Way cache;
  - `wgsl/stills.wgsl` and `wgsl/star-check.wgsl`, for the stills script.
- **Light:** every layer adds in linear light, then a highlight shoulder, the sRGB encode and the grain.
- **Pure TS, unit-tested:**
  - `params.ts` builds each frame's uniforms;
  - `signal.ts` eases the lift and times the pulse;
  - `star-field.ts` ports the star hash for the CSS star map;
  - `stills.ts` places the stills.
- **Renderer:** `renderer.ts` keeps its shape. It diffs `skyParams` instead of hand-kept input arrays, and renders the Milky Way cache only when the viewport or the page height changes.
- **CSS sky:**
  - `scripts/sky-stills.ts` renders `stills.wgsl` headless (vgpu/node, software adapter) into AVIF stills. Each still screen-blends exactly back into the live sky's pixels.
  - A force-static route draws the star map as an SVG.

**Tech Stack:** Next.js 16.3, React 19.3, Tailwind CSS 4, GSAP 3.15, Lenis 1.3, vgpu 0.5 and `@vgpu/wgsl` 0.5 (WGSL modules, `vgpu/node`, `resolveShader`), sharp 0.35 (new, dev only), bun 1.3 (`bun test`), TypeScript 5.9, oxlint, Playwright 1.63 (scratchpad only).

**Spec:** `docs/superpowers/specs/2026-10-10-sky-polish-design.md`. Read it first, then the specs it builds on: `2026-10-09-eclipse-to-horizon-design.md`, `2026-10-07-motion-and-light-design.md` and `2026-10-07-portfolio-redesign-design.md`.

**Pre-checked:** every code block below was built and run in a scratch copy of the repo before the plan was written.
- **Unit tests:** every test file in this plan passed there: 29 in `eclipse.test.ts`, 13 in `flight.test.ts`, 6 in `light.test.ts`, 10 in `star-field.test.ts`, 8 in `signal.test.ts`, 14 in `params.test.ts`, 3 in `stills.test.ts` and 4 in `sky-stills.test.ts`.
- **Shaders:** `bunx vgpu check --require-validation` passed on all four entry points.
- **Headless renders:** the full sky at the hero, the hold (with a fling) and at rest (with a signal) matched the chosen prototypes.
  - The alignment probe measured 0.044 (limit 0.15).
- **The stills script:** it ran on the hardware adapter.
  - The stills were 19.6 KB in all.
  - `--check` passed: the re-render was identical, and 100% of the map's stars sat within 1 px of a live star.
- **Typecheck:** the renderer, the cache and the CSS sky typechecked.
- **Not pre-run:** `pw/polish.mjs` (Task 13) needs the finished site. Treat its thresholds as the spec's, and its selectors as a first guess to fix.
- **On a mismatch:** if a step's output differs from its Expected line, the code is the first suspect only when it differs from this plan.

## Global Constraints

- **Tooling:** bun 1.3.14, Node 24.x, TypeScript 5.9. Don't upgrade TypeScript.
- **Dependencies:** one new dev dependency, `sharp` (Task 10). Nothing else.
- **Git:**
  - Work on `feat/eclipse-horizon`, which is already the working branch.
  - Commits are Conventional Commits with a subject line only: no body and no `Co-Authored-By`.
  - After each commit, say what was committed and to which branch.
  - Never push without the owner's explicit yes to "push to `feat/eclipse-horizon`?".
- **Code comments:** technical and necessary only. Comment the non-obvious why.
- **No layout reads in a tick.** The sky measures only on resize, load, font load and a page resize (`measure`).
- **Sky budget:** unchanged: `skyDpr`, at most 2.2 M device pixels and a DPR of 1.25.
- **One light (spec §3.2):** every sky term is linear light, added; then `shoulder`, `encode`, then the grain. The background is (0.00182, 0.00212, 0.00304).
- **Integer hashes only (spec §2.3):** every hash goes through `pcg`/`cellHash`; no float hash anywhere in the sky.
- **Modules are pure (spec §3.1):** a module under `wgsl/` declares no `@group`/`@binding`. Only entry points do.
- **Reduced motion (spec §8):**
  - `velocity` is 0 and `pulse.y` (travel) is 0.
  - Travel 0 also stops the cursor's light, the aim and the corona's lean in the shader.
  - Time is frozen.
- **Touch:** `hover` is 0, as today.
- **Tuning values:** every constant comes from spec Appendix A. A tuning change needs the owner's eye and its own commit.
- **End of every task:** `bun run lint`, `bun run typecheck`, `bun test` and `bun run build` pass.
- **Shader check, once the entry exists:**
  ```
  for e in src/components/sky/sky.wgsl src/components/sky/wgsl/{milky-cache,star-check,stills}.wgsl; do bunx vgpu check $e --require-validation | grep -q '"ok": true' && echo "ok $e" || echo "FAIL $e"; done
  ```
- **Scratch paths:**
  - `SCRATCH=/private/tmp/claude-501/-Users-hyamero-Documents-Projects-personal-portfolio/4bb137b1-3a96-4a38-973b-8391f318066e/scratchpad`
  - `PW=$SCRATCH/pw` holds `playwright@1.63`, `pngjs`, Chromium and Firefox, and the suites `voyage.mjs` and `eclipse.mjs`. If it's missing: `mkdir -p $PW && cd $PW && bun init -y && bun add playwright@1.63 pngjs && bunx playwright install chromium firefox`.
  - `PROBES=$SCRATCH/probes`.
- **Server for browser checks:** a production build in a pane on the right.
  - Check first: `curl -sf -o /dev/null http://localhost:3000/ && echo up`. The owner may already run `bun dev` there; if so, use that for quick looks, and a production build for Task 13.
  - Start one:
    - `herdr pane split --current --direction right --ratio 0.4 --cwd /Users/hyamero/Documents/Projects/personal/portfolio --no-focus` (note the `pane_id` as `$DEV`)
    - `herdr pane run $DEV 'bun run build && bun run start'`
    - `herdr pane wait-output $DEV --match "Ready in" --timeout 300000`
  - Read panes with `--source visible`. Close any pane you opened when you're done (`herdr pane close $DEV`).

## Review Focus

1. **The coast's offset wandering past the Milky Way cache** (long back-and-forth flings):
   - Expected: the band stays continuous. The cache keeps a 2000 px coast margin at each end and clamps past it.
   - Pinned by `bandExtent`'s "leaves room for the coast to wander 2000 px past either end" (Task 7).
2. **A page without the hero** (the 404 page):
   - Expected: every uniform is finite, with no body, no text rects and no stills requested.
   - Pinned by `skyParams`' "a page without the body stays finite" (Task 7), and by `test_network` and `eclipse.mjs`'s `test_not_found` (Task 13).
3. **A hidden tab during a pulse:**
   - Expected: when the tab comes back after 3.5 s, the pulse is over and the sky goes idle at once, with no stale frames.
   - Pinned by `pulseAge`'s "ends at 3.5 s" (Task 2) and `skyParams`' "stops changing the frame" (Task 7).
4. **A WebGPU visitor during the first 1.6 s:**
   - Expected: no second (CSS) diamond while the live sky is pending. Without WebGPU or JavaScript, the CSS diamond always plays.
   - Pinned by `test_diamond` (Task 13).
5. **Windows between 390 and 864 px wide, and wider than 1440:**
   - Expected: the CSS horizon's ground meets its still's limb, and only one horizon still downloads.
   - Pinned by `horizonStill`'s two tests (Task 9) and `test_network`/`test_css_live` (Task 13).

Known approximation, for the owner: from 864 px up, the CSS horizon still scales uniformly with the width. The sun's glare in it doesn't, because `sunFrame`'s core, glare and vertical streak are fixed px. So the CSS sky's sun is up to 40% smaller at 864 px and larger beyond 1440. The limb and the air are exact. The live sky is unaffected.

---

### Task 1: The bead's intro and the sun's new glare sizes

**Files:**
- Modify: `src/lib/eclipse.ts` (`RADIUS_PER_WIDTH` export; `sunFrame`; new `beadOpen`)
- Test: `src/lib/eclipse.test.ts`

**Interfaces:**
- Produces:
  - `beadOpen(intro: number): number`: −2 until 0.45, 0.12 from 0.8.
  - `sunFrame(m: number, W: number): { core; glare; streakH; streakV }`, with spec A.5's values.
  - `RADIUS_PER_WIDTH = 25 / 6`, now exported.
- `haloFrame` stays until Task 8, which removes it with the old renderer.

- [ ] **Step 1: Write the failing tests**

In `src/lib/eclipse.test.ts`, add `beadOpen,` to the import list after `beadFlash,`. Replace the whole `describe("haloFrame and sunFrame", …)` block with:

```ts
describe("haloFrame", () => {
  test("starts at board 09's reaches and ends at board 02's", () => {
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
  });
  test("moves one way between the two", () => {
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
  test("loses the rays by halfway", () => {
    expect(haloFrame(0.5, 1000).rays).toBe(0);
  });
});

describe("sunFrame", () => {
  test("starts at 09's diamond and ends at 02's sun", () => {
    expect(sunFrame(0, 1440)).toEqual({ core: 2, glare: 120, streakH: 85, streakV: 60 });
    const s = sunFrame(1, 1440);
    expect(s.core).toBeCloseTo(1.75);
    expect(s.glare).toBeCloseTo(60);
    expect(s.streakH).toBeCloseTo(140);
    expect(s.streakV).toBeCloseTo(24);
    expect(sunFrame(1, 390).streakH).toBeCloseTo(37.92, 2);
  });
  test("moves one way between the two at every width", () => {
    for (const W of [390, 1440, 2560]) {
      const a = sunFrame(0, W);
      const b = sunFrame(1, W);
      let last = a;
      for (let i = 1; i <= 20; i++) {
        const s = sunFrame(i / 20, W);
        for (const k of ["core", "glare", "streakH", "streakV"] as const) {
          expect((s[k] - last[k]) * Math.sign(b[k] - a[k])).toBeGreaterThanOrEqual(0);
        }
        last = s;
      }
    }
  });
});

describe("beadOpen", () => {
  test("keeps the beads shut until 0.45 and closed into the diamond from 0.8", () => {
    expect(beadOpen(0)).toBe(-2);
    expect(beadOpen(0.45)).toBe(-2);
    expect(beadOpen(0.8)).toBeCloseTo(0.12, 9);
    expect(beadOpen(1)).toBeCloseTo(0.12, 9);
  });
  test("opens one way", () => {
    for (let i = 1; i <= 50; i++) expect(beadOpen(i / 50)).toBeGreaterThanOrEqual(beadOpen((i - 1) / 50));
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test src/lib/eclipse.test.ts`
Expected: FAIL. `beadOpen` is not exported, and `sunFrame(0, 1440)` gives `{ core: 5, glare: 120, streakH: 200, streakV: 150 }`.

- [ ] **Step 3: Implement**

In `src/lib/eclipse.ts`, replace

```ts
// 02's 12,000 px circle at 1440 px wide.
const RADIUS_PER_WIDTH = 25 / 6;
```

with

```ts
/** The horizon's radius per px of viewport width: 02's 12,000 px circle at 1440 px wide. */
export const RADIUS_PER_WIDTH = 25 / 6;
```

Replace `sunFrame` and its doc comment with:

```ts
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
```

- [ ] **Step 4: Run them to see them pass**

Run: `bun test src/lib/eclipse.test.ts`
Expected: PASS, 29 tests.

- [ ] **Step 5: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build`
Expected: all pass. Until Task 8 the old shader draws the glare with these new, smaller sizes. That's expected.

```bash
git add src/lib/eclipse.ts src/lib/eclipse.test.ts
git commit -m "feat(sky): close the beads over the intro and resize the sun's glare"
```

---

### Task 2: The signal's lift and pulse

**Files:**
- Create: `src/lib/signal.ts`
- Test: `src/lib/signal.test.ts`

**Interfaces:**
- Consumes: `approach`, `ease` from `src/lib/sky-math.ts`.
- Produces:
  - `PULSE_S = 3.5`
  - `liftStep(lift: number, target: number, dt: number, reduced: boolean): number`
  - `pulseAge(now: number, at: number): number`: s since the click, or −1 with none running (also from 3.5 s on). `now` and `at` are ms on the tick's clock.
  - `pulseEnvelope(age: number): number`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/signal.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { liftStep, PULSE_S, pulseAge, pulseEnvelope } from "./signal";

const DT = 1 / 60;

describe("liftStep", () => {
  test("eases toward its target at rate 6", () => {
    expect(liftStep(0, 1, DT, false)).toBeCloseTo(1 - Math.exp(-0.1), 9);
  });
  test("lands on the target once within 0.002", () => {
    let lift = 0;
    let steps = 0;
    while (lift !== 1 && steps < 600) {
      lift = liftStep(lift, 1, DT, false);
      steps++;
    }
    expect(lift).toBe(1);
    expect(steps).toBe(63);
    expect(liftStep(0.0015, 0, DT, false)).toBe(0);
  });
  test("jumps under reduced motion", () => {
    expect(liftStep(0, 1, DT, true)).toBe(1);
    expect(liftStep(1, 0, DT, true)).toBe(0);
  });
});

describe("pulseAge", () => {
  test("is negative with no pulse", () => {
    expect(pulseAge(5000, Number.NEGATIVE_INFINITY)).toBe(-1);
  });
  test("counts seconds since the click, then ends at 3.5 s", () => {
    expect(pulseAge(1500, 1000)).toBeCloseTo(0.5, 9);
    expect(pulseAge(1000 + PULSE_S * 1000, 1000)).toBe(-1);
  });
  test("restarts on a second click", () => {
    expect(pulseAge(4000, 1000)).toBeCloseTo(3, 9);
    expect(pulseAge(4000, 3900)).toBeCloseTo(0.1, 9);
  });
});

describe("pulseEnvelope", () => {
  test("starts at 1 and falls", () => {
    expect(pulseEnvelope(0)).toBe(1);
    let last = 1;
    for (let age = 0.1; age < PULSE_S; age += 0.1) {
      expect(pulseEnvelope(age)).toBeLessThan(last);
      last = pulseEnvelope(age);
    }
  });
  test("is 0 at 3.5 s and after, and before a pulse", () => {
    expect(pulseEnvelope(PULSE_S)).toBe(0);
    expect(pulseEnvelope(5)).toBe(0);
    expect(pulseEnvelope(-1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test src/lib/signal.test.ts`
Expected: FAIL with `Cannot find module './signal'`.

- [ ] **Step 3: Implement**

Create `src/lib/signal.ts`:

```ts
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
```

- [ ] **Step 4: Run them to see them pass**

Run: `bun test src/lib/signal.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add src/lib/signal.ts src/lib/signal.test.ts
git commit -m "feat(sky): ease a signal's lift and time its pulse"
```

---

### Task 3: Contact's links send a signal; the sky learns where the text is

**Files:**
- Modify: `src/lib/flight.ts` (signal state, its listeners, `eclipse.copy`, `textRect`)
- Modify: `src/lib/flight.test.ts`
- Modify: `src/components/motion.tsx` (scrub `flight.eclipse.copy`)
- Modify: `src/components/hero.tsx`, `src/components/work.tsx`, `src/components/contact.tsx` (`data-sky-text`, `data-sky-signal`)

**Interfaces:**
- Consumes: `liftStep` (Task 2).
- Produces:
  - `flight.signal: { lift: number; target: number; at: number }`. `at` is ms on the tick's clock (`gsap.ticker.time * 1000`), −∞ before any click.
  - `flight.eclipse.copy: number`: 1 → 0 across the copy's exit.
  - `textRect(name: "hero" | "work" | "contact"): Rect`
  - DOM: `[data-sky-text="hero"|"work"|"contact"]` and `[data-sky-signal]`.

- [ ] **Step 1: Write the failing tests**

In `src/lib/flight.test.ts`, change the first test's expectation to include `copy`:

```ts
    expect(createFlight().eclipse).toEqual({ zoom: 0, pan: 0, level: 0, morph: 0, end: Number.POSITIVE_INFINITY, copy: 1 });
```

and add these tests after it:

```ts
  test("the signal starts unlit, with no pulse", () => {
    expect(createFlight().signal).toEqual({ lift: 0, target: 0, at: Number.NEGATIVE_INFINITY });
  });
  test("a hovered link's lift eases in and lets go", () => {
    const s = fresh();
    advance(s, 0, 0, DT);
    s.signal.target = 1;
    advance(s, 0, 0, DT);
    expect(s.signal.lift).toBeGreaterThan(0);
    expect(s.signal.lift).toBeLessThan(1);
    for (let i = 0; i < 120; i++) advance(s, 0, 0, DT);
    expect(s.signal.lift).toBe(1);
    s.signal.target = 0;
    for (let i = 0; i < 120; i++) advance(s, 0, 0, DT);
    expect(s.signal.lift).toBe(0);
  });
  test("under reduced motion the lift applies at once", () => {
    const s = fresh();
    s.reduced = true;
    s.signal.target = 1;
    advance(s, 0, 0, DT);
    expect(s.signal.lift).toBe(1);
  });
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test src/lib/flight.test.ts`
Expected: FAIL. `eclipse` has no `copy`, and `signal` is undefined.

- [ ] **Step 3: Implement the state, the step and `textRect`**

In `src/lib/flight.ts`:

1. Add the import, above the `./sky-math` import:

   ```ts
   import { liftStep } from "./signal";
   ```

2. In `createFlight`, extend the `eclipse` doc comment and object, and add `signal` after it:

   ```ts
       /**
        * The hero's camera (spec §4.1): motion.tsx scrubs the channels and the sky reads them. `end` is
        * the scroll position where the runway ends, written on refresh; until then nothing settles.
        * `copy` is how much of the hero copy still shows, 1 → 0 as it lifts away; the sky's text mask follows it.
        */
       eclipse: { zoom: 0, pan: 0, level: 0, morph: 0, end: Number.POSITIVE_INFINITY, copy: 1 },
       /**
        * Contact's signal (sky polish spec §5.6): a hovered or focused link's lift on the sun, easing
        * toward `target`, and the last click's time in ms on the tick's clock.
        */
       signal: { lift: 0, target: 0, at: Number.NEGATIVE_INFINITY },
   ```

3. At the end of `advance`, after the coast:

   ```ts
     s.signal.lift = liftStep(s.signal.lift, s.signal.target, dt, s.reduced);
   ```

4. After `anchorRect`, add:

   ```ts
   /** A `data-sky-text` block's rect in page space: text the sky keeps quiet behind. It reads layout too. */
   export function textRect(name: string): Rect {
     const el = document.querySelector(`[data-sky-text="${name}"]`);
     return el ? pageRect(el) : EMPTY_RECT;
   }
   ```

- [ ] **Step 4: Run them to see them pass**

Run: `bun test src/lib/flight.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Add the delegated listeners**

In `listen()` in `src/lib/flight.ts`, after `onLeave`:

```ts
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
```

Register them after `document.documentElement.addEventListener("pointerleave", onLeave);`:

```ts
  document.addEventListener("pointerover", onOver);
  document.addEventListener("pointerout", onOut);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);
  document.addEventListener("click", onClick);
```

Remove them in the returned cleanup, after `removeEventListener("pointerleave", onLeave)`:

```ts
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("click", onClick);
```

- [ ] **Step 6: Scrub `copy` with the copy's exit**

In `src/components/motion.tsx`, after the `camera.to("[data-hero-copy]", …)` line:

```ts
        // The sky's text mask follows the copy out (sky polish spec §3.3).
        camera.to(flight.eclipse, { copy: 0, ease: "none", duration: COPY_OUT.end }, 0);
```

In the same `mm.add` cleanup, after `flight.eclipse.end = Number.POSITIVE_INFINITY;`:

```ts
          flight.eclipse.copy = 1;
```

- [ ] **Step 7: Mark the text and the signal links**

- `src/components/hero.tsx`: on `<div data-hero-copy …>`, add `data-sky-text="hero"`.
- `src/components/work.tsx`: on the `<ol>`, add `data-sky-text="work"`.
- `src/components/contact.tsx`:
  - on the content `<div className="px-gutter relative z-1 …">`, add `data-sky-text="contact"`;
  - on the `say` link (`<a data-catch-light className="say …">`) and on each `LINKS` link (`<a className="line-link" …>` inside the `<li>`), add `data-sky-signal`.
  - Leave the footer's "Back to top" alone.

- [ ] **Step 8: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add src/lib/flight.ts src/lib/flight.test.ts src/components/motion.tsx src/components/hero.tsx src/components/work.tsx src/components/contact.tsx
git commit -m "feat(sky): send a signal from Contact's links and mark the sky's text"
```

---

### Task 4: The star hash in TS, and the CSS star map

**Files:**
- Create: `src/lib/light.ts`, `src/lib/star-field.ts`
- Test: `src/lib/light.test.ts`, `src/lib/star-field.test.ts`

**Interfaces:**
- Produces, from `light.ts`:
  - `type Rgb = readonly [number, number, number]`
  - `BG`, `GROUND`
  - `shoulder(c: Rgb): Rgb`, `encode(c: Rgb): Rgb`, `hex(c: Rgb): string`
- Produces, from `star-field.ts`:
  - `pcg`, `cellHash(x, y, seed)`, `u01`, `vnoise`, `fbm(x, y, octaves, seed)`, `starTint(r, sat): Rgb`
  - `type MapStar = { x; y; flux; halo; tint: Rgb }`
  - `brightStars(width, height): MapStar[]`, `starPeak(s: MapStar): number`, `starMapSvg(width, height): string`
- The WGSL in Task 5 must match these bit for bit (`noise.wgsl`, `stars.wgsl`'s near and bright layers, `light.wgsl`).
- The known-answer vectors below were pinned from a `vgpu/node` run of that WGSL.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/light.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { BG, encode, hex, shoulder } from "./light";

describe("shoulder", () => {
  test("passes colour below the knee through unchanged", () => {
    expect(shoulder([0.5, 0.3, 0.1])).toEqual([0.5, 0.3, 0.1]);
  });
  test("is continuous at the knee", () => {
    expect(shoulder([0.62 + 1e-9, 0, 0])[0]).toBeCloseTo(0.62, 6);
  });
  test("maps a peak of 1 to 0.81 and keeps the hue", () => {
    const s = shoulder([1, 0.5, 0.25]);
    expect(s[0]).toBeCloseTo(0.81, 6);
    expect(s[1] / s[0]).toBeCloseTo(0.5, 9);
    expect(s[2] / s[0]).toBeCloseTo(0.25, 9);
  });
  test("never reaches 1", () => {
    expect(shoulder([1000, 0, 0])[0]).toBeLessThan(1);
  });
});

describe("encode", () => {
  test("is the sRGB curve", () => {
    expect(encode([0, 0.0031308, 1])[0]).toBe(0);
    expect(encode([0, 0.0031308, 1])[1]).toBeCloseTo(0.0404, 4);
    expect(encode([0, 0.0031308, 1])[2]).toBeCloseTo(1, 9);
  });
  test("turns the linear background back into the page's #06070a", () => {
    expect(hex(encode(BG))).toBe("#06070a");
  });
});
```

Create `src/lib/star-field.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { brightStars, cellHash, fbm, pcg, starMapSvg, starTint, u01 } from "./star-field";

// Pinned from one vgpu/node run of noise.wgsl: index i, pcg(7919 i + 1), u01(cellHash(i − 8, 3 − i, 101)) and fbm(0.37 i, 1.3, 3, 7).
const GPU = [
  [0, 2831084092, 0.8332586884498596, 0.48246878385543823],
  [5, 1953814019, 0.38231366872787476, 0.5852159261703491],
  [11, 2418778161, 0.0745166540145874, 0.5071955919265747],
  [15, 2276300552, 0.8150473833084106, 0.2821023166179657],
] as const;

describe("the hash port", () => {
  for (const [i, hash, cell, noise] of GPU) {
    test(`matches the GPU at ${i}`, () => {
      expect(pcg(7919 * i + 1)).toBe(hash);
      expect(u01(cellHash(i - 8, 3 - i, 101))).toBe(cell);
      expect(fbm(Math.fround(Math.fround(0.37) * i), Math.fround(1.3), 3, 7)).toBeCloseTo(noise, 5);
    });
  }
});

describe("starTint", () => {
  test("has luminance 1 from K to B", () => {
    for (const r of [0, 0.2, 0.5, 0.9]) {
      const [cr, cg, cb] = starTint(r, 0.55);
      expect(0.2126 * cr + 0.7152 * cg + 0.0722 * cb).toBeCloseTo(1, 9);
    }
    expect(starTint(0, 0.55)[0]).toBeGreaterThan(starTint(0, 0.55)[2]);
    expect(starTint(0.95, 0.55)[2]).toBeGreaterThan(starTint(0.95, 0.55)[0]);
  });
});

describe("brightStars", () => {
  test("is the same on every call", () => {
    expect(brightStars(1440, 900)).toEqual(brightStars(1440, 900));
  });
  test("keeps every star inside its cell's jitter box", () => {
    for (const s of brightStars(1440, 900)) {
      const cell = s.halo === 0.1 ? 240 : 60;
      const [lo, hi] = cell === 240 ? [0.3, 0.7] : [0.22, 0.78];
      const fx = s.x / cell - Math.floor(s.x / cell);
      const fy = s.y / cell - Math.floor(s.y / cell);
      for (const v of [fx, fy]) {
        expect(v).toBeGreaterThanOrEqual(lo - 1e-6);
        expect(v).toBeLessThanOrEqual(hi + 1e-6);
      }
    }
  });
  test("gives 40 to 120 stars at 1440 × 900", () => {
    const n = brightStars(1440, 900).length;
    expect(n).toBeGreaterThanOrEqual(40);
    expect(n).toBeLessThanOrEqual(120);
  });
});

describe("starMapSvg", () => {
  test("draws one circle per star", () => {
    const svg = starMapSvg(2560, 1600);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.match(/<circle /g)?.length).toBe(brightStars(2560, 1600).length);
  });
  test("is 16 KB or less, gzipped", () => {
    expect(Bun.gzipSync(new TextEncoder().encode(starMapSvg(2560, 1600))).length).toBeLessThanOrEqual(16384);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test src/lib/light.test.ts src/lib/star-field.test.ts`
Expected: FAIL with `Cannot find module './light'` and `'./star-field'`.

- [ ] **Step 3: Implement**

Create `src/lib/light.ts`:

```ts
/**
 * The sky's light (spec §3.2), mirrored from src/components/sky/wgsl/light.wgsl and air.wgsl for the
 * CSS sky's star map and stills. Keep in step with those files.
 */
export type Rgb = readonly [number, number, number];

/** The page background, #06070a, in linear light. */
export const BG: Rgb = [0.00182, 0.00212, 0.00304];
/** The night ground's base colour in linear light (air.wgsl's GROUND). */
export const GROUND: Rgb = [0.0013, 0.0016, 0.0024];
const KNEE = 0.62;

/** Highlights roll off toward 1 above the knee, the colour scaled as one so its hue is kept. */
export function shoulder(c: Rgb): Rgb {
  const peak = Math.max(c[0], c[1], c[2]);
  if (peak <= KNEE) return c;
  const d = 1 - KNEE;
  const k = (1 - (d * d) / (peak + d - KNEE)) / peak;
  return [c[0] * k, c[1] * k, c[2] * k];
}

const srgb = (x: number) => (x <= 0.0031308 ? Math.max(x, 0) * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055);

/** Linear light to sRGB, 0..1. */
export function encode(c: Rgb): Rgb {
  return [srgb(c[0]), srgb(c[1]), srgb(c[2])];
}

/** An encoded colour as #rrggbb. */
export function hex(c: Rgb) {
  const byte = (x: number) => Math.round(Math.min(Math.max(x, 0), 1) * 255).toString(16).padStart(2, "0");
  return `#${byte(c[0])}${byte(c[1])}${byte(c[2])}`;
}
```

Create `src/lib/star-field.ts`:

```ts
import { BG, encode, hex, shoulder, type Rgb } from "./light";

/*
 * The sky's star hash and the two star layers that don't depend on the viewport's size or the Milky
 * Way (the 60 px layer and the bright layer), ported from src/components/sky/wgsl/noise.wgsl and
 * stars.wgsl with exact u32 maths and f32 rounding, so the CSS sky's stars sit on the live sky's
 * (spec §7.2). Keep in step with those files.
 */

const f = Math.fround;

export function pcg(v: number) {
  const s = (Math.imul(v >>> 0, 747796405) + 2891336453) >>> 0;
  const w = Math.imul((s >>> ((s >>> 28) + 4)) ^ s, 277803737) >>> 0;
  return ((w >>> 22) ^ w) >>> 0;
}

export function cellHash(x: number, y: number, seed: number) {
  return pcg(Math.imul(x, 1597334677) ^ pcg((y ^ seed) >>> 0));
}

export const u01 = (h: number) => (h >>> 8) / 16777216;

export function vnoise(px: number, py: number, seed: number) {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = f(px - ix);
  const fy = f(py - iy);
  const wx = f(fx * fx * (3 - 2 * fx));
  const wy = f(fy * fy * (3 - 2 * fy));
  const a = u01(cellHash(ix, iy, seed));
  const b = u01(cellHash(ix + 1, iy, seed));
  const c = u01(cellHash(ix, iy + 1, seed));
  const d = u01(cellHash(ix + 1, iy + 1, seed));
  const ab = a + (b - a) * wx;
  const cd = c + (d - c) * wx;
  return ab + (cd - ab) * wy;
}

/** Octaves of value noise, normalised to 0..1. */
export function fbm(x: number, y: number, octaves: number, seed: number) {
  let v = 0;
  let a = 0.5;
  let n = 0;
  for (let i = 0; i < octaves; i++) {
    v += a * vnoise(x, y, (seed + i * 131) >>> 0);
    n += a;
    x = f(x * 2.03 + 1.7);
    y = f(y * 2.03 + 9.2);
    a *= 0.5;
  }
  return v / n;
}

const lum = (c: Rgb) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const lerp = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** A star's colour, warm K to blue-white B by `r`, at `sat` saturation and luminance 1 (Appendix A.1). */
export function starTint(r: number, sat: number): Rgb {
  let c: Rgb;
  if (r < 0.1) c = [1, 0.64, 0.4];
  else if (r < 0.35) c = lerp([1, 0.82, 0.64], [1, 0.94, 0.86], (r - 0.1) / 0.25);
  else if (r < 0.75) c = lerp([1, 0.97, 0.93], [0.92, 0.95, 1], (r - 0.35) / 0.4);
  else c = lerp([0.84, 0.89, 1], [0.68, 0.78, 1], (r - 0.75) / 0.25);
  const y = lum(c);
  const s = lerp([y, y, y], c, sat);
  const n = lum(s);
  return [s[0] / n, s[1] / n, s[2] / n];
}

/** A star on the CSS sky's map: its position (CSS px from the viewport's top left), flux, halo share and tint. */
export type MapStar = { x: number; y: number; flux: number; halo: number; tint: Rgb };

/** The near layer and the bright layer at scroll 0 with no hover: every star whose centre falls inside width × height. */
export function brightStars(width: number, height: number): MapStar[] {
  const stars: MapStar[] = [];
  for (let cy = 0; cy * 60 < height; cy++) {
    for (let cx = 0; cx * 60 < width; cx++) {
      const h0 = cellHash(cx, cy, 303);
      const odds = 0.16 * (0.45 + 1.1 * fbm(f(((cx + 0.5) * 60) / 380), f(((cy + 0.5) * 60) / 380), 3, 310));
      if (u01(h0) > odds) continue;
      const h1 = pcg(h0);
      const h2 = pcg(h1);
      const h3 = pcg(h2);
      const h4 = pcg(h3);
      const x = f(f(cx + f(f(u01(h1) * 0.56) + 0.22)) * 60);
      const y = f(f(cy + f(f(u01(h2) * 0.56) + 0.22)) * 60);
      if (x >= width || y >= height) continue;
      const flux = 0.3 * Math.min(Math.max(u01(h3), 1e-5) ** (-2 / 3), 16);
      stars.push({ x, y, flux, halo: 0.08, tint: starTint(u01(h4), 0.55) });
    }
  }
  for (let cy = 0; cy * 240 < height; cy++) {
    for (let cx = 0; cx * 240 < width; cx++) {
      const h0 = cellHash(cx, cy, 404);
      if (u01(h0) > 0.12) continue;
      const h1 = pcg(h0);
      const h2 = pcg(h1);
      const h3 = pcg(h2);
      const h4 = pcg(h3);
      const x = f(f(cx + f(f(u01(h1) * 0.4) + 0.3)) * 240);
      const y = f(f(cy + f(f(u01(h2) * 0.4) + 0.3)) * 240);
      if (x >= width || y >= height) continue;
      stars.push({ x, y, flux: 1.6 + 2.4 * u01(h3), halo: 0.1, tint: starTint(0.5 + 0.5 * u01(h4), 0.5) });
    }
  }
  return stars;
}

/** A star's peak light on a 1× screen: its core and halo Gaussians (σ 0.62 and 2.6 px) at their centre. */
export function starPeak(s: MapStar) {
  return s.flux * ((1 - s.halo) / (2 * Math.PI * 0.62 ** 2) + s.halo / (2 * Math.PI * 2.6 ** 2));
}

/** The CSS sky's star map (spec §7.2): one circle per star, filled so its peak matches the live star's. */
export function starMapSvg(width: number, height: number) {
  const circles = brightStars(width, height).map((s) => {
    const p = starPeak(s);
    const fill = hex(encode(shoulder([BG[0] + s.tint[0] * p, BG[1] + s.tint[1] * p, BG[2] + s.tint[2] * p])));
    return `<circle cx="${s.x.toFixed(2)}" cy="${s.y.toFixed(2)}" r="0.73" fill="${fill}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${circles.join("")}</svg>`;
}
```

- [ ] **Step 4: Run them to see them pass**

Run: `bun test src/lib/light.test.ts src/lib/star-field.test.ts`
Expected: PASS, 16 tests. `brightStars(1440, 900)` gives 71 stars.

- [ ] **Step 5: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add src/lib/light.ts src/lib/light.test.ts src/lib/star-field.ts src/lib/star-field.test.ts
git commit -m "feat(sky): port the star hash and the CSS star map to TS"
```

---

### Task 5: The star field and the Milky Way as WGSL modules

**Files:**
- Create: `src/components/sky/wgsl/noise.wgsl`, `light.wgsl`, `stars.wgsl`
- Create (entry points): `src/components/sky/wgsl/milky-cache.wgsl`, `star-check.wgsl`

**Interfaces:**
- Produces, from `noise.wgsl`: `pcg`, `cellHash(c: vec2i, seed: u32)`, `u01`, `vnoise`, `fbm(p, octaves, seed)` (0..1), `erf`.
- Produces, from `light.wgsl`: `LUMA`, `BG`, `shoulder`, `encode`, `decode`, `grain(pixel, lum, time)`, `textMask(p, rect: vec4f)`.
- Produces, from `stars.wgsl`:
  - `starTint`, `psf`
  - `struct Layer { cell, odds, flux, cap, halo, boost, seed }`, `nearLayer()`
  - `milky(s, W, H) -> vec4f` (rgb the band's light before gain, a its core `exp(−a²)`)
  - `starLayer(css, off, L, trail, dpr, time, mwOff, cache, samp, map)`, `brightLayer(css, off, trail, dpr, time)`
  - `struct StarFrame { scroll, vel, dpr, time, par, pl, ext, quiet, map }`, `skyField(css, f, cache, samp) -> vec3f`
- Entry `milky-cache.wgsl`: `params { size: vec2f, map: vec4f }`.
- Entry `star-check.wgsl`: `params { resolution, dpr }`, and the bindings `milky` and `milkySampler` (never read).
- Ruling, spec §3.1 vs §7.1: the star check gets its own entry instead of a `mode` on `stills.wgsl`. Otherwise `stills.wgsl` would import `stars.wgsl`, and editing the stars would invalidate the stills, which §7.1 rules out.

- [ ] **Step 1: Write the entry points first (the failing check)**

Create `src/components/sky/wgsl/milky-cache.wgsl`:

```wgsl
// Renders the Milky Way into its cache (spec §3.5): one texel per uv over the band-space rect `map`.
import { milky } from "./stars.wgsl";

struct Params {
  // The viewport, CSS px: the band's frame scales with it.
  size: vec2f,
  // The band-space rect this cache covers: origin, size (CSS px).
  map: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  return milky(params.map.xy + uv * params.map.zw, params.size.x, params.size.y);
}
```

Create `src/components/sky/wgsl/star-check.wgsl`:

```wgsl
// The near and bright star layers alone at scroll 0, for `bun run sky:stills --check`'s check of the
// CSS star map (spec §7.1). It's its own entry so editing the stars never invalidates the stills.
import { brightLayer, nearLayer, starLayer } from "./stars.wgsl";

struct Params {
  resolution: vec2f,
  dpr: f32,
}

@group(0) @binding(0) var<uniform> params: Params;
// starLayer's band lookup. The near layer has no band boost, so it's never read.
@group(0) @binding(1) var milky: texture_2d<f32>;
@group(0) @binding(2) var milkySampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let css = uv * params.resolution / params.dpr;
  let near = starLayer(css, vec2f(0.0), nearLayer(), 0.0, params.dpr, 0.0, vec2f(0.0), milky, milkySampler, vec4f(0.0, 0.0, 1.0, 1.0));
  return vec4f(near + brightLayer(css, vec2f(0.0), 0.0, params.dpr, 0.0), 1.0);
}
```

- [ ] **Step 2: Run the check to see it fail**

Run: `bunx vgpu check src/components/sky/wgsl/milky-cache.wgsl --require-validation`
Expected: FAIL with `VGPU-WGSL-RES-NOTFOUND` for `./stars.wgsl`.

- [ ] **Step 3: Write the modules**

Create `src/components/sky/wgsl/noise.wgsl`:

```wgsl
// Integer hashes and value noise for the sky. Every hash is integer maths: float hashes amplify
// rounding, and some compilers (DXC, on Windows) refold `(i + 1) * k`, so neighbouring cells
// disagreed at their shared edge and the noise showed seams. src/lib/star-field.ts ports these.

export fn pcg(v: u32) -> u32 {
  let s = v * 747796405u + 2891336453u;
  let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}

export fn cellHash(c: vec2i, seed: u32) -> u32 {
  return pcg((bitcast<u32>(c.x) * 1597334677u) ^ pcg(bitcast<u32>(c.y) ^ seed));
}

// 24 bits of a hash as a float in 0..1.
export fn u01(h: u32) -> f32 {
  return f32(h >> 8u) * (1.0 / 16777216.0);
}

export fn vnoise(p: vec2f, seed: u32) -> f32 {
  let i = vec2i(floor(p));
  let f = fract(p);
  let w = f * f * (3.0 - 2.0 * f);
  let a = u01(cellHash(i, seed));
  let b = u01(cellHash(i + vec2i(1, 0), seed));
  let c = u01(cellHash(i + vec2i(0, 1), seed));
  let d = u01(cellHash(i + vec2i(1, 1), seed));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
}

// Octaves of value noise, normalised to 0..1.
export fn fbm(p0: vec2f, octaves: i32, seed: u32) -> f32 {
  var p = p0;
  var v = 0.0;
  var a = 0.5;
  var n = 0.0;
  for (var i = 0; i < octaves; i++) {
    v += a * vnoise(p, seed + u32(i) * 131u);
    n += a;
    p = p * 2.03 + vec2f(1.7, 9.2);
    a *= 0.5;
  }
  return v / n;
}

// A close fit to the error function, so a streak integrates a Gaussian exactly enough.
export fn erf(x: f32) -> f32 {
  let y = clamp(x, -4.0, 4.0);
  return tanh(1.12837917 * y + 0.10294324 * y * y * y);
}
```

Create `src/components/sky/wgsl/light.wgsl`:

```wgsl
// The sky's one light (spec §3.2): every layer adds in linear light, then a highlight shoulder, the
// sRGB encode, and grain in display space. src/lib/light.ts mirrors BG, shoulder and encode.
import { cellHash, u01 } from "./noise.wgsl";

export const LUMA = vec3f(0.2126, 0.7152, 0.0722);

// The page background, #06070a, in linear light.
export const BG = vec3f(0.00182, 0.00212, 0.00304);

// Highlights roll off toward 1 above the knee, the colour scaled as one so its hue is kept.
export fn shoulder(c: vec3f) -> vec3f {
  let knee = 0.62;
  let peak = max(c.r, max(c.g, c.b));
  if (peak <= knee) {
    return c;
  }
  let d = 1.0 - knee;
  return c * ((1.0 - d * d / (peak + d - knee)) / peak);
}

export fn encode(c: vec3f) -> vec3f {
  let x = max(c, vec3f(0.0));
  return select(1.055 * pow(max(x, vec3f(1e-7)), vec3f(1.0 / 2.4)) - 0.055, x * 12.92, x <= vec3f(0.0031308));
}

export fn decode(c: vec3f) -> vec3f {
  let x = max(c, vec3f(0.0));
  return select(pow((x + 0.055) / 1.055, vec3f(2.4)), x / 12.92, x <= vec3f(0.04045));
}

// Film grain and an 8-bit dither, in display space, hashed from the integer screen pixel so both
// canvases agree across the rim. The dither's seed moves with time, the grain's doesn't.
export fn grain(pixel: vec2f, lum: f32, time: f32) -> f32 {
  let p = vec2i(floor(pixel));
  let g = (u01(cellHash(p, 7u)) - 0.5) * (0.012 + 0.03 * lum);
  let dither = (u01(cellHash(p, 11u + u32(fract(time) * 4096.0))) - 0.5) / 255.0;
  return g + dither;
}

// How much a text rect (x, y, w, h; w 0 for none) covers p: 1 from 12 px inside, 0 by 80 px outside.
export fn textMask(p: vec2f, rect: vec4f) -> f32 {
  if (rect.z <= 0.0) {
    return 0.0;
  }
  let half = rect.zw * 0.5;
  let d = abs(p - (rect.xy + half)) - half;
  let outside = length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
  return 1.0 - smoothstep(-12.0, 80.0, outside);
}
```

Create `src/components/sky/wgsl/stars.wgsl`:

```wgsl
// The star field and the Milky Way (spec §4.1, Appendix A.1–A.2), in linear light. src/lib/star-field.ts
// ports the near and bright layers' placement for the CSS sky's star map: keep them in step.
import { BG, LUMA } from "./light.wgsl";
import { cellHash, erf, fbm, pcg, u01 } from "./noise.wgsl";

// The streaks' exposure, s: a star smears over velocity × parallax × this.
const EXPOSURE = 0.05;

// A star's colour, warm K to blue-white B by r, at sat saturation and luminance 1.
export fn starTint(r: f32, sat: f32) -> vec3f {
  var c = vec3f(0.0);
  if (r < 0.1) {
    c = vec3f(1.0, 0.64, 0.4);
  } else if (r < 0.35) {
    c = mix(vec3f(1.0, 0.82, 0.64), vec3f(1.0, 0.94, 0.86), (r - 0.1) / 0.25);
  } else if (r < 0.75) {
    c = mix(vec3f(1.0, 0.97, 0.93), vec3f(0.92, 0.95, 1.0), (r - 0.35) / 0.4);
  } else {
    c = mix(vec3f(0.84, 0.89, 1.0), vec3f(0.68, 0.78, 1.0), (r - 0.75) / 0.25);
  }
  c = mix(vec3f(dot(c, LUMA)), c, sat);
  return c / dot(c, LUMA);
}

// A unit-flux Gaussian of sigma (device px), smeared over len px toward +y. The smear integrates
// it exactly, so a streak carries the still star's light. o = pixel − star, device px.
export fn psf(o: vec2f, sigma: f32, len: f32) -> f32 {
  let gx = exp(-0.5 * o.x * o.x / (sigma * sigma)) / (sigma * 2.5066283);
  if (len < 0.05) {
    return gx * exp(-0.5 * o.y * o.y / (sigma * sigma)) / (sigma * 2.5066283);
  }
  let k = 0.70710678 / sigma;
  return gx * 0.5 * (erf(o.y * k) - erf((o.y - len) * k)) / len;
}

// One depth of stars (Appendix A.1): cell size, odds, flux, the brightness cap, the halo's share, how
// much the Milky Way raises the odds, and the hash seed.
export struct Layer {
  cell: f32,
  odds: f32,
  flux: f32,
  cap: f32,
  halo: f32,
  boost: f32,
  seed: u32,
}

// The 60 px layer, which the CSS star map ports.
export fn nearLayer() -> Layer {
  return Layer(60.0, 0.16, 0.3, 16.0, 0.08, 0.0, 303u);
}

// The band's frame at s: its distance along the band, across it (with its wandering centre line), and its half-width.
fn bandFrame(s: vec2f, W: f32, H: f32) -> vec3f {
  let c0 = vec2f(0.62 * W, 0.42 * H);
  let ang = radians(26.0);
  let dir = vec2f(cos(ang), -sin(ang));
  let nrm = vec2f(-dir.y, dir.x);
  let along = dot(s - c0, dir);
  let w = 0.2 * H;
  let across = dot(s - c0, nrm) - w * 0.9 * (fbm(vec2f(along / 700.0, 1.3), 3, 11u) - 0.5);
  return vec3f(along, across, w);
}

// The Milky Way at band-space s (viewport W × H): rgb its light before gain, a its core profile
// exp(−a²), which raises the faint layers' odds in the band. The sky caches it (spec §3.5).
export fn milky(s: vec2f, W: f32, H: f32) -> vec4f {
  let f = bandFrame(s, W, H);
  let along = f.x;
  let across = f.y;
  let w = f.z;
  let a = across / w;
  let core = exp(-a * a);
  let wing = exp(-abs(a) / 1.6);
  let lengthwise = 0.55 + 0.7 * fbm(vec2f(along / 520.0, 4.7), 3, 17u);
  let bx = (along - 0.12 * W) / (0.5 * W);
  let bulge = exp(-bx * bx);
  let cloud = fbm(s / 140.0, 5, 23u);
  let grain = fbm(s / 22.0, 3, 29u);
  let glow = (core * (0.22 + 1.1 * smoothstep(0.35, 0.85, cloud)) * (0.7 + 0.6 * grain) + 0.22 * wing * cloud)
           * lengthwise * (0.75 + 0.7 * bulge);
  let ridge = 1.0 - abs(2.0 * fbm(vec2f(along / 300.0, across / 80.0), 5, 31u) - 1.0);
  let lanes = smoothstep(0.62, 0.93, ridge) * exp(-2.0 * a * a);
  let rx = (across + 0.12 * w) / (0.16 * w);
  let rift = exp(-rx * rx) * smoothstep(0.35, 0.75, fbm(vec2f(along / 450.0, 9.1), 3, 37u));
  let clear = (1.0 - 0.85 * lanes) * (1.0 - 0.7 * rift);
  let warm = clamp(core * (0.35 + 0.65 * bulge), 0.0, 1.0);
  var tint = mix(vec3f(0.6, 0.72, 1.0), vec3f(1.0, 0.85, 0.7), warm);
  tint = mix(vec3f(dot(tint, LUMA)), tint, 0.55);
  return vec4f(tint * glow * clear, core);
}

// One depth of stars at css (viewport px). off: the layer's scroll and parallax offset; trail: its
// streak this frame (CSS px, + while the page scrolls down). mwOff: the band's offset, and cache/map
// the Milky Way cache and the band-space rect it covers, for the layers it raises.
export fn starLayer(css: vec2f, off: vec2f, L: Layer, trail: f32, dpr: f32, time: f32, mwOff: vec2f,
                    cache: texture_2d<f32>, samp: sampler, map: vec4f) -> vec3f {
  let p = css + off;
  let base = vec2i(floor(p / L.cell));
  // A streak reaches back over the cells its stars have crossed.
  let reach = i32(ceil(abs(trail) / L.cell));
  let len = abs(trail) * dpr;
  var col = vec3f(0.0);
  for (var j = -reach; j <= reach; j++) {
    let c = base + vec2i(0, j);
    let h0 = cellHash(c, L.seed);
    let mid = (vec2f(c) + 0.5) * L.cell;
    // Clusters and voids.
    var odds = L.odds * (0.45 + 1.1 * fbm(mid / 380.0, 3, L.seed + 7u));
    if (L.boost > 0.0) {
      let core = textureSampleLevel(cache, samp, (mid - off + mwOff - map.xy) / map.zw, 0.0).a;
      odds *= 1.0 + L.boost * core;
    }
    if (u01(h0) > odds) {
      continue;
    }
    let h1 = pcg(h0);
    let h2 = pcg(h1);
    let h3 = pcg(h2);
    let h4 = pcg(h3);
    let h5 = pcg(h4);
    let star = (vec2f(c) + vec2f(u01(h1), u01(h2)) * 0.56 + 0.22) * L.cell - off;
    var o = (css - star) * dpr;
    if (trail < 0.0) {
      o.y = -o.y;
    }
    // A Euclidean count: most stars faint, a few bright.
    let F = L.flux * min(pow(max(u01(h3), 1e-5), -2.0 / 3.0), L.cap);
    let bright = smoothstep(0.25, 1.0, F / (L.flux * L.cap));
    let twinkle = 1.0 + 0.16 * bright * sin(time * (0.8 + 1.7 * u01(h5)) + 6.2831853 * u01(h4));
    var e = (1.0 - L.halo) * psf(o, 0.62, len);
    if (L.halo > 0.0) {
      e += L.halo * psf(o, 2.6, len);
    }
    col += starTint(u01(h4), 0.55) * F * twinkle * e;
  }
  return col;
}

// The few bright stars, with diffraction spikes that vanish once they streak.
export fn brightLayer(css: vec2f, off: vec2f, trail: f32, dpr: f32, time: f32) -> vec3f {
  let cell = 240.0;
  let c = vec2i(floor((css + off) / cell));
  let h0 = cellHash(c, 404u);
  if (u01(h0) > 0.12) {
    return vec3f(0.0);
  }
  let h1 = pcg(h0);
  let h2 = pcg(h1);
  let h3 = pcg(h2);
  let h4 = pcg(h3);
  let h5 = pcg(h4);
  let star = (vec2f(c) + vec2f(u01(h1), u01(h2)) * 0.4 + 0.3) * cell - off;
  var o = (css - star) * dpr;
  let len = abs(trail) * dpr;
  if (trail < 0.0) {
    o.y = -o.y;
  }
  let F = 1.6 + 2.4 * u01(h3);
  let twinkle = 1.0 + 0.12 * sin(time * (0.6 + 1.2 * u01(h5)) + 6.2831853 * u01(h4));
  var e = 0.9 * psf(o, 0.62, len) + 0.1 * psf(o, 2.6, len);
  let L = 9.0 * sqrt(F);
  let w2 = 2.0 * 0.45 * 0.45;
  let spike = exp(-abs(o.x) / L) * exp(-o.y * o.y / w2) + 0.8 * exp(-abs(o.y) / L) * exp(-o.x * o.x / w2);
  e += 0.012 * spike * (1.0 - smoothstep(1.0, 8.0, len));
  return starTint(0.5 + 0.5 * u01(h4), 0.5) * F * twinkle * e;
}

// What the sky behind everything reads this frame.
export struct StarFrame {
  // The stars' virtual scroll (scroll plus the coast) and its speed, px/s.
  scroll: f32,
  vel: f32,
  dpr: f32,
  time: f32,
  // The pointer's parallax, (pointer − 0.5) · 8 · hover.
  par: vec2f,
  // The cursor's light here, 0..1.
  pl: f32,
  // How much of the sky shows through the light in front of it.
  ext: f32,
  // The text mask here.
  quiet: f32,
  // The band-space rect the Milky Way cache covers: origin, size.
  map: vec4f,
}

// The sky behind everything, in linear light: the background, the cached Milky Way and four depths of stars.
export fn skyField(css: vec2f, f: StarFrame, cache: texture_2d<f32>, samp: sampler) -> vec3f {
  let mwOff = vec2f(0.0, f.scroll * 0.025) + f.par * 0.3;
  let band = textureSampleLevel(cache, samp, (css + mwOff - f.map.xy) / f.map.zw, 0.0).rgb;
  // The cursor's light lifts the band's dust like a lamp in fog; text dims both.
  var col = (band * 0.004 * (1.0 + 2.5 * f.pl) + vec3f(0.5, 0.65, 1.0) * 0.0016 * f.pl) * (1.0 - 0.92 * f.quiet);
  let T = f.vel * EXPOSURE;
  col += starLayer(css, vec2f(0.0, f.scroll * 0.04) + f.par * 0.6, Layer(8.0, 0.1, 0.035, 10.0, 0.0, 2.4, 101u),
                   T * 0.04, f.dpr, f.time, mwOff, cache, samp, f.map);
  col += starLayer(css, vec2f(0.0, f.scroll * 0.08) + f.par * 1.2, Layer(24.0, 0.13, 0.09, 14.0, 0.0, 1.2, 202u),
                   T * 0.08, f.dpr, f.time, mwOff, cache, samp, f.map);
  col += starLayer(css, vec2f(0.0, f.scroll * 0.17) + f.par * 2.0, nearLayer(), T * 0.17, f.dpr, f.time, mwOff, cache, samp, f.map);
  col += brightLayer(css, vec2f(0.0, f.scroll * 0.12) + f.par * 1.6, T * 0.12, f.dpr, f.time);
  return BG + col * f.ext;
}
```

- [ ] **Step 4: Run the check to see it pass**

Run: `for e in milky-cache star-check; do bunx vgpu check src/components/sky/wgsl/$e.wgsl --require-validation | grep -q '"ok": true' && echo "ok $e" || echo "FAIL $e"; done`
Expected: `ok milky-cache` and `ok star-check`.

- [ ] **Step 5: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass; nothing imports the new files yet)

```bash
git add src/components/sky/wgsl
git commit -m "feat(sky): build the star field and the Milky Way as WGSL modules"
```

---

### Task 6: The corona, the air and the lens as WGSL modules

**Files:**
- Create: `src/components/sky/wgsl/corona.wgsl`, `air.wgsl`, `lens.wgsl`, `body.wgsl`
- Create (entry point): `src/components/sky/wgsl/stills.wgsl`

**Interfaces:**
- Consumes: Task 5's `noise.wgsl` (`fbm`) and `light.wgsl` (`BG`).
- Produces, from `corona.wgsl`: `angDiff`, `turn(v, a)`, `corona(q, R, lean: vec3f, t, quiet)`, `moon(q, R, ub)`, `limbLight(q, R, ub, open)`, `prom(q, R, ub, deg, bw, ph, seed, t)`.
- Produces, from `air.wgsl`: `GROUND`, `atmosphere(h, s, sl, W, age, travel)`, `mie(p, B, W, hsc, d)`, `groundNight(depth)`.
- Produces, from `lens.wgsl`: `sunGlare(g, m, d, size: vec4f)`, `sunPulse(t, m)`, `ghosts(p, sun, aim)`.
- Produces, from `body.wgsl`:
  - `struct Body { C, R, vis, B, m, beads, W, dpr, time, hover, light, motion, settle, age, travel, arrive }`
  - `struct BodyLight { front, night, inside, limb, d }`
  - `bodyLight(p, b: Body, pl, quiet) -> BodyLight`
- Entry `stills.wgsl`: `params { resolution, dpr, W, time, beads, body: vec4f, sun: vec4f, glare: vec4f }`. It writes `vec4f(linear colour, inside)`.

- [ ] **Step 1: Write the entry point first (the failing check)**

Create `src/components/sky/wgsl/stills.wgsl`:

```wgsl
// The body alone, for the CSS sky's stills (spec §7.1): an empty sky behind it, no stars, trail or
// grain, into a float target. rgb: the live sky's linear light there; a: how much of the pixel the
// moon or the ground covers, where the CSS puts its own disc or ground.
import { Body, bodyLight } from "./body.wgsl";
import { sunGlare, sunPulse } from "./lens.wgsl";
import { BG } from "./light.wgsl";

struct Params {
  resolution: vec2f,
  dpr: f32,
  // The layout width the frame models; the still may be rendered at a higher dpr.
  W: f32,
  time: f32,
  beads: f32,
  // C.x, C.y, R, vis
  body: vec4f,
  // B.x, B.y, morph, the diamond's strength
  sun: vec4f,
  // sunFrame: core, glare, horizontal and vertical streak decay
  glare: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv * params.resolution / params.dpr;
  let B = params.sun.xy;
  let m = params.sun.z;
  let b = Body(params.body.xy, params.body.z, params.body.w, B, m, params.beads, params.W, params.dpr, params.time,
               0.0, vec2f(-1e5), 0.0, 0.0, -1.0, 1.0, 1.0);
  let bl = bodyLight(p, b, 0.0, 0.0);
  var col = mix(BG + bl.front, bl.night, bl.inside) + bl.limb;
  let k = params.sun.w * sunPulse(params.time, m) * params.body.w;
  if (k > 0.001) {
    col += sunGlare(p - B, m, bl.d, params.glare) * k;
  }
  return vec4f(col, bl.inside);
}
```

- [ ] **Step 2: Run the check to see it fail**

Run: `bunx vgpu check src/components/sky/wgsl/stills.wgsl --require-validation`
Expected: FAIL with `VGPU-WGSL-RES-NOTFOUND` for `./body.wgsl`.

- [ ] **Step 3: Write the modules**

Create `src/components/sky/wgsl/corona.wgsl`:

```wgsl
// The eclipse (spec §4.2, Appendix A.3), in linear light and the body's own frame, where the bead
// sits at the upper left. q is CSS px from the moon's centre.
import { fbm } from "./noise.wgsl";

export fn angDiff(a: f32, b: f32) -> f32 {
  return atan2(sin(a - b), cos(a - b));
}

// Turns v anticlockwise on screen (y down) by a radians.
export fn turn(v: vec2f, a: f32) -> vec2f {
  let c = cos(a);
  let s = sin(a);
  return vec2f(v.x * c + v.y * s, -v.x * s + v.y * c);
}

fn lobe(deg: f32, c: f32, w: f32) -> f32 {
  var d = abs(deg - c);
  d = min(d, 360.0 - d);
  return exp(-(d * d) / (w * w));
}

// Board 09's seven streamers, wide at the base and narrowing outward like helmet streamers.
fn streamers(deg: f32, x: f32) -> f32 {
  let widen = 0.5 + 0.8 / x;
  var s = 0.16 * lobe(deg, 8.0, 9.0 * widen);
  s += 0.10 * lobe(deg, 61.0, 8.0 * widen);
  s += 0.18 * lobe(deg, 104.0, 10.0 * widen);
  s += 0.12 * lobe(deg, 172.0, 10.0 * widen);
  s += 0.15 * lobe(deg, 246.0, 10.0 * widen);
  s += 0.10 * lobe(deg, 292.0, 8.0 * widen);
  s += 0.14 * lobe(deg, 340.0, 10.0 * widen);
  return s / 0.18;
}

// Board 09's conic angle (deg) and radius at q, undoing its streamers' scale(1.35, 0.92) rotate(−16deg).
fn boardFrame(q: vec2f) -> vec2f {
  let a = radians(16.0);
  let s = vec2f(q.x / 1.35, q.y / 0.92);
  let l = vec2f(s.x * cos(a) - s.y * sin(a), s.x * sin(a) + s.y * cos(a));
  var deg = degrees(atan2(l.x, -l.y));
  if (deg < 0.0) {
    deg += 360.0;
  }
  return vec2f(deg, length(l));
}

// The corona. lean: the pointer's direction from the centre (xy) and its pull (z); quiet: the text mask.
export fn corona(q: vec2f, R: f32, lean: vec3f, t: f32, quiet: f32) -> vec3f {
  let r = length(q);
  let x = max(r / R, 1.0);
  let ang = atan2(q.x, -q.y);
  let dp = angDiff(atan2(lean.x, -lean.y), ang);
  // Farther out, features bend toward the pointer's side, as if it drew them.
  let sa = ang + 0.2 * lean.z * (x - 1.0) * sin(dp) * exp(-(dp * dp) / 1.2);
  let sdir = vec2f(sin(sa), -cos(sa));
  let lx = log(x);
  // Fine radial filaments, sampled round a circle so they have no seam, drifting very slowly.
  let f1 = fbm(sdir * (58.0 + 2.4 * lx) + vec2f(t * 0.004, 0.0), 3, 91u);
  let f2 = fbm(sdir * (17.0 + 1.5 * lx) + vec2f(0.0, t * 0.003), 3, 92u);
  // Near the limb the glow smooths them.
  let grain = 0.45 + 0.75 * smoothstep(1.0, 1.8, x);
  let fine = clamp(1.0 + grain * (1.1 * (f1 - 0.5) + 0.6 * (f2 - 0.5)), 0.1, 1.8);
  let b = boardFrame(sdir * r);
  let env = 0.08 + 2.2 * streamers(b.x, max(b.y / R, 1.0));
  let inner = pow(x, -20.0) + 0.1 * pow(x, -6.0);
  let outer = 0.022 * pow(x, -2.6) * (1.0 - smoothstep(2.6, 4.0, x)) * (1.0 - 0.7 * quiet);
  var I = inner * (0.85 + 0.15 * fine) + outer * env * fine;
  I *= 1.0 + 0.45 * lean.z * exp(-(dp * dp) / 0.2);
  return mix(vec3f(0.93, 0.96, 1.0), vec3f(0.58, 0.7, 1.0), smoothstep(1.02, 2.4, x)) * I;
}

// The moon's night side: earthshine on its maria, and a soft light from the bead's side (ub).
export fn moon(q: vec2f, R: f32, ub: vec2f) -> vec3f {
  let n = q / R;
  let z = sqrt(max(1.0 - dot(n, n), 0.0));
  let uv = n / (0.55 + 0.45 * z);
  let maria = smoothstep(0.44, 0.62, fbm(uv * 1.7 + vec2f(3.1, 7.7), 4, 61u));
  let albedo = (1.0 - 0.45 * maria) * (0.85 + 0.3 * fbm(uv * 6.0, 3, 62u));
  let toward = 0.5 + 0.5 * dot(n, ub);
  return vec3f(0.55, 0.66, 1.0) * 0.003 * albedo * (0.4 + 0.6 * z) + vec3f(0.6, 0.7, 1.0) * 0.004 * toward * toward * toward;
}

// The chromosphere's pink arc by the bead, and Baily's beads: sunlight through the valleys of the
// moon's rough limb. open > 0 lets light through; the intro raises it until they close into the diamond.
export fn limbLight(q: vec2f, R: f32, ub: vec2f, open: f32) -> vec3f {
  let d = length(q) - R;
  let ang = atan2(q.x, -q.y);
  let db = angDiff(ang, atan2(ub.x, -ub.y));
  let ch = exp(-(db * db) / 0.13);
  let th = 0.7 + 2.4 * ch;
  let hc = (d - 0.5 * th) / (0.5 * th + 0.35);
  var c = vec3f(1.0, 0.24, 0.38) * 0.9 * ch * exp(-hc * hc);
  let profile = fbm(vec2f(ang * 24.0, 0.37), 3, 71u);
  let gap = (0.5 - profile) * 2.4 - abs(db) * 4.2 + open;
  let e = d - 0.5;
  c += vec3f(1.0, 0.97, 0.94) * smoothstep(0.0, 0.2, gap) * (3.0 * exp(-(e * e) / 1.1) + 0.35 * exp(-(e * e) / 9.0));
  return c;
}

// A prominence: a ragged flame of hydrogen pink on the limb, deg anticlockwise from the bead.
export fn prom(q: vec2f, R: f32, ub: vec2f, deg: f32, bw: f32, ph: f32, seed: u32, t: f32) -> vec3f {
  let dir = turn(ub, radians(deg));
  let local = q - dir * R;
  let tt = dot(local, vec2f(-dir.y, dir.x));
  let h = dot(local, dir);
  if (h < -1.5 || h > ph * 1.8 || abs(tt) > bw * 1.8) {
    return vec3f(0.0);
  }
  let n = fbm(vec2f(tt, h) / 2.0 + vec2f(f32(seed) * 3.7, t * 0.04), 3, seed);
  let e = 1.0 - (tt * tt) / (bw * bw) - max(h, 0.0) / ph + (n - 0.5);
  let core = smoothstep(0.0, 0.5, e);
  let glow = exp(-max(-e, 0.0) * 4.0) * 0.3;
  return vec3f(1.0, 0.26, 0.42) * (core * 0.8 + glow) * smoothstep(-1.5, 0.5, h);
}
```

Create `src/components/sky/wgsl/air.wgsl`:

```wgsl
// The horizon's air and ground (spec §4.3, Appendix A.4), in linear light. Heights are in hsc px
// (max(W / 1440, 0.6) CSS px); s is the arc length along the limb from the sun, + right.

// The night ground's base colour; src/lib/light.ts mirrors it for the CSS sky's ground.
export const GROUND = vec3f(0.0013, 0.0016, 0.0024);

// The air at height h. sl: s leaned toward the cursor, which moves the Rayleigh layers' light; the
// sunrise and the signal stay with the sun. age, travel: the signal's pulse (age < 0 for none).
export fn atmosphere(h: f32, s: f32, sl: f32, W: f32, age: f32, travel: f32) -> vec3f {
  let k = sl / select(0.24 * W, 0.2 * W, sl < 0.0);
  let lit = exp(-k * k);
  let litWide = exp(-0.2 * k * k);
  // Rayleigh: a cyan-white skin on the limb, a blue band, a deep-blue glow fading to space. The
  // floors keep a thin skin on the night side.
  let skin = exp(-h / 2.6);
  let band = exp(-h / 13.0);
  var c = vec3f(0.75, 0.9, 1.0) * 0.9 * skin * (0.06 + 0.94 * lit)
        + vec3f(0.2, 0.42, 1.0) * 0.3 * band * (0.18 + 0.82 * lit)
        + vec3f(0.05, 0.12, 0.42) * 0.12 * exp(-h / 55.0) * litWide;
  // The orbital sunrise: sunlight grazing the low air reddens, orange on the ground, amber above it.
  let ks = s / (0.11 * W);
  let ka = s / (0.2 * W);
  c += vec3f(1.0, 0.33, 0.07) * 1.6 * exp(-h / 3.5) * exp(-ks * ks)
     + vec3f(1.0, 0.6, 0.22) * 0.5 * exp(-h / 9.0) * exp(-ka * ka);
  // Airglow: a faint green thread high over the night side.
  let ag = (h - 92.0) / 4.0;
  c += vec3f(0.3, 1.0, 0.55) * 0.0035 * exp(-ag * ag) * (1.0 - lit);
  if (age >= 0.0) {
    // The signal (spec §5.6): a front running out both ways from the sun. Without travel the
    // whole rim lights at once.
    let e = (abs(s) - 0.55 * W * age) / (26.0 + 50.0 * age);
    let front = mix(1.0, exp(-e * e), travel);
    c += vec3f(0.8, 0.92, 1.0) * front * exp(-1.4 * age) * (2.2 * skin + 0.5 * band) * (1.0 - smoothstep(2.5, 3.5, age));
  }
  return c;
}

// Mie: sunlight scattered forward around the sun B, stretched along the limb. d: p's height above it.
export fn mie(p: vec2f, B: vec2f, W: f32, hsc: f32, d: f32) -> vec3f {
  let e = vec2f((p.x - B.x) / (0.2 * W), (p.y - B.y) / (70.0 * hsc));
  return vec3f(0.85, 0.92, 1.0) * 0.05 * exp(-dot(e, e)) * smoothstep(-2.0, 4.0, d);
}

// The night ground at depth (hsc px inside the edge): board 02's thin lit band, then near-black.
export fn groundNight(depth: f32) -> vec3f {
  return GROUND + vec3f(0.002, 0.003, 0.008) * exp(-depth / 6.0);
}
```

Create `src/components/sky/wgsl/lens.wgsl`:

```wgsl
// The sun and the lens (spec §4.4, Appendix A.5), in linear light.

// The sun's glare, one glare from 09's diamond (m 0) to 02's sun on the horizon (m 1). g: px from the
// sun; d: the pixel's height above the limb; size: sunFrame's core radius, glare radius, and
// horizontal and vertical streak decay lengths (px).
export fn sunGlare(g: vec2f, m: f32, d: f32, size: vec4f) -> vec3f {
  let r = length(g);
  let ks = size.y / 120.0;
  // On the horizon the limb hides the core's lower half.
  let core = (1.0 - smoothstep(0.8 * size.x, 1.6 * size.x, r)) * mix(1.0, smoothstep(-2.0, 1.0, d), m);
  let bloom = exp(-r * r / (50.0 * ks * ks)) + 0.3 * exp(-r * r / (512.0 * ks * ks));
  let k = r / (24.0 * ks);
  let veil = 0.07 / pow(1.0 + k * k, 1.25);
  // A straight streak across the curved ground reads as a cut in it, so the ground keeps 15% of it.
  let over = 1.0 - 0.85 * m * (1.0 - smoothstep(-1.0, 1.5, d));
  let lx = g.x / (3.0 * size.z);
  let hx = exp(-abs(g.x) / size.z - lx * lx) * exp(-g.y * g.y / 0.6) * over;
  let vy = exp(-abs(g.y) / size.w) * exp(-g.x * g.x / 0.6) * over;
  // A faint dispersion ring, red outside and blue inside, that the diamond has and the sun doesn't.
  let rr = vec3f(r - 47.5 * ks, r - 46.0 * ks, r - 44.5 * ks);
  let ring = exp(-(rr * rr) / 7.0) * 0.018 * (1.0 - m);
  return vec3f(6.0 * core + 2.2 * bloom) + vec3f(0.8, 0.88, 1.0) * veil + vec3f(0.88, 0.93, 1.0) * (0.9 * hx + 0.65 * vy) + ring;
}

// The sun's slow pulse: 09's diamond breathing over 5.2 s, crossfading into 02's 6 s glint.
export fn sunPulse(t: f32, m: f32) -> f32 {
  return mix(0.91 - 0.09 * cos(t * 6.2831853 / 5.2), 0.89 - 0.11 * cos(t * 6.2831853 / 6.0), m);
}

fn ghost(p: vec2f, c: vec2f, r: f32, tint: vec3f) -> vec3f {
  let d = length(p - c);
  let disc = 1.0 - smoothstep(r * 0.8, r, d);
  let e = d - r * 0.9;
  return tint * (0.010 * disc + 0.016 * exp(-(e * e) / (r * 0.06 + 0.8)));
}

// Lens ghosts on the line from the sun through the aim point: moving the aim swings them.
export fn ghosts(p: vec2f, sun: vec2f, aim: vec2f) -> vec3f {
  let axis = aim - sun;
  var c = ghost(p, sun + axis * 0.3, 9.0, vec3f(0.55, 0.85, 1.0));
  c += ghost(p, sun + axis * 0.58, 24.0, vec3f(0.75, 0.62, 1.0));
  c += ghost(p, sun + axis * 0.86, 6.0, vec3f(1.0, 0.82, 0.58));
  c += ghost(p, sun + axis * 1.22, 40.0, vec3f(0.5, 0.92, 0.82));
  c += ghost(p, sun - axis * 0.24, 15.0, vec3f(0.85, 0.75, 1.0));
  return c;
}
```

Create `src/components/sky/wgsl/body.wgsl`:

```wgsl
// The body (spec §4.2–4.3): board 09's eclipse, which the camera flies into until it's board 02's
// horizon. Shared by sky.wgsl and stills.wgsl, so the CSS sky's stills can't drift from the live sky.
import { atmosphere, groundNight, mie } from "./air.wgsl";
import { corona, limbLight, moon, prom, turn } from "./corona.wgsl";

// One frame of the body. Positions share the caller's space.
export struct Body {
  C: vec2f,
  R: f32,
  vis: f32,
  // The bead, which becomes the sun; morph, 0 eclipse .. 1 horizon; how far Baily's beads are open.
  B: vec2f,
  m: f32,
  beads: f32,
  W: f32,
  dpr: f32,
  time: f32,
  hover: f32,
  // The eased pointer light; motion is 0 under reduced motion, which stops the corona's lean.
  light: vec2f,
  motion: f32,
  settle: f32,
  // The signal's pulse: its age (s, < 0 for none) and travel.
  age: f32,
  travel: f32,
  // The rim's brightening as the trail gathers into it.
  arrive: f32,
}

// What the body adds at p.
export struct BodyLight {
  // The corona and the air: light in front of the sky, which washes the stars out.
  front: vec3f,
  // The moon's or the ground's own colour, and how much of p it covers.
  night: vec3f,
  inside: f32,
  // The chromosphere, the beads and the prominences, over everything.
  limb: vec3f,
  // p's height above the limb, px.
  d: f32,
}

// pl: the cursor's light at p; quiet: the text mask at p.
export fn bodyLight(p: vec2f, b: Body, pl: f32, quiet: f32) -> BodyLight {
  var out = BodyLight(vec3f(0.0), vec3f(0.0), 0.0, vec3f(0.0), 1e6);
  if (b.vis <= 0.001) {
    return out;
  }
  let R = max(b.R, 1.0);
  let m = b.m;
  let rel = p - b.C;
  let dist = max(length(rel), 1e-4);
  let d = dist - R;
  out.d = d;
  let ub = (b.B - b.C) / R;
  let n = rel / dist;
  let s = R * atan2(ub.x * n.y - ub.y * n.x, dot(ub, n));
  // The body's own frame, turned so the bead sits where board 09 has it: its upper left.
  let rest = vec2f(-0.70710678, -0.70710678);
  let spin = atan2(ub.x * rest.y - ub.y * rest.x, dot(ub, rest));
  let q = turn(rel, -spin);
  let hsc = max(b.W / 1440.0, 0.6);
  // The corona folds onto the limb as the camera nears: drawn as if the moon's radius were Rc, from
  // R down to ~60 px, keeping each pixel's height above the limb. It turns the air's blue and fades.
  let fadeC = (1.0 - m) * (1.0 - m) * (1.0 - m);
  let Rc = R * pow(60.0 / R, sqrt(m));
  if (fadeC > 0.001 && d > -2.0 && d < 4.3 * Rc) {
    let pp = b.light - b.C;
    let pull = b.hover * b.motion * (1.0 - smoothstep(1.3 * R, 3.6 * R, length(pp))) * (1.0 - m);
    let pr = turn(pp, -spin);
    let lean = vec3f(pr / max(length(pr), 1.0), pull);
    out.front += corona(q / dist * (Rc + max(d, 0.0)), Rc, lean, b.time, quiet) * mix(vec3f(1.0), vec3f(0.55, 0.7, 1.0), m) * fadeC;
  }
  let airK = smoothstep(0.2, 0.95, m);
  if (airK > 0.001 && d > -2.0 && d < 420.0 * hsc) {
    // Once the horizon rests, the lit stretch leans toward the cursor.
    let sl = s - 0.5 * b.hover * b.settle * (b.light.x - b.B.x);
    let air = atmosphere(max(d, 0.0) / hsc, s, sl, b.W, b.age, b.travel) * (1.0 + 0.9 * pl) * b.arrive;
    out.front += (air + mie(p, b.B, b.W, hsc, d)) * airK;
  }
  out.inside = (1.0 - smoothstep(-0.6, 0.6, d * b.dpr)) * b.vis;
  out.front *= (1.0 - out.inside) * b.vis;
  out.night = mix(moon(q, R, rest), groundNight(max(-d, 0.0) / hsc), m);
  let feature = (1.0 - smoothstep(0.0, 0.35, m)) * b.vis;
  if (feature > 0.001 && abs(d) < 40.0) {
    let flames = prom(q, R, rest, 65.0, 7.5, 9.5, 3u, b.time) + prom(q, R, rest, -167.0, 5.5, 7.0, 5u, b.time);
    out.limb = (limbLight(q, R, rest, b.beads) + flames * (1.0 - out.inside)) * feature;
  }
  return out;
}
```

- [ ] **Step 4: Run the check to see it pass**

Run: `bunx vgpu check src/components/sky/wgsl/stills.wgsl --require-validation | grep -q '"ok": true' && echo ok || echo FAIL`
Expected: `ok`. Its `deps` are `air`, `body`, `corona`, `lens`, `light`, `noise` and `stills`, and not `stars` or `trail`.

- [ ] **Step 5: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add src/components/sky/wgsl
git commit -m "feat(sky): build the corona, the air and the lens as WGSL modules"
```

---

### Task 7: Each frame's uniforms in one pure function

**Files:**
- Create: `src/components/sky/params.ts`
- Test: `src/components/sky/params.test.ts`

**Interfaces:**
- Consumes:
  - `beadFlash`, `beadOpen`, `sunFrame`, `type Body` (`src/lib/eclipse.ts`)
  - `pulseAge` (Task 2)
  - `type Rect`
- Produces:
  - `type BandMap = { origin: readonly [number, number]; size: readonly [number, number] }`
  - `bandExtent(W, H, maxScroll): BandMap`
  - `type SkyInput` (the fields below)
  - `skyParams(s: SkyInput): { params; frontKey: number[] }`, where `params` matches `sky.wgsl`'s `Params` field for field (Task 8)
  - `type SkyParams`
  - `diffKey(params): number[]` (every field but `time`), `sameKey(a, b): boolean`
- Ruling: `Params` also carries `band: vec4f`, the cache's band-space rect, which §3.5 implies but §3.3's table leaves out. The shader can't know the page's height otherwise.
- Ruling: the cache's extent adds a 2000 px coast margin (50 px of band drift) at each end. `coast.offset` isn't bounded by the page (Review Focus 1).

- [ ] **Step 1: Write the failing tests**

Create `src/components/sky/params.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { endFrame } from "@/lib/eclipse";
import { EMPTY_RECT } from "@/lib/flight";
import type { Rect } from "@/lib/sky-math";

import { bandExtent, diffKey, sameKey, skyParams, type SkyInput } from "./params";

const hero: Rect = { left: 120, top: 300, width: 700, height: 260 };
const work: Rect = { left: 96, top: 2400, width: 1248, height: 1800 };
const contact: Rect = { left: 96, top: 4600, width: 1248, height: 500 };

const input = (over: Partial<SkyInput> = {}): SkyInput => ({
  resolution: [1800, 1125],
  W: 1440,
  H: 900,
  scroll: 0,
  starScroll: 0,
  velocity: 0,
  coast: 0,
  light: { x: 600, y: 200, hover: 0 },
  pointer: { nx: 0.5, ny: 0.5 },
  reduced: false,
  now: 10_000,
  time: 0,
  body: endFrame(1440, 900),
  morph: 1,
  settle: 0,
  intro: 1,
  trail: { shed: 0, carry: 0, gather: 0 },
  span: [2400, 4600],
  text: { hero, work, contact },
  copy: 1,
  signal: { lift: 0, at: Number.NEGATIVE_INFINITY },
  band: bandExtent(1440, 900, 6000),
  frontOn: false,
  frontTop: 558,
  ...over,
});

describe("skyParams", () => {
  test("velocity is the scroll's and the coast's speed together", () => {
    expect(skyParams(input({ velocity: 1200, coast: 300 })).params.velocity).toBe(1500);
  });
  test("velocity is 0 under reduced motion, and the signal doesn't travel", () => {
    const { params } = skyParams(input({ velocity: 1200, coast: 300, reduced: true }));
    expect(params.velocity).toBe(0);
    expect(params.pulse[1]).toBe(0);
  });
  test("passes the text rects in page space, with w 0 for a missing one", () => {
    const { params } = skyParams(input({ text: { hero, work, contact: EMPTY_RECT } }));
    expect(params.textA).toEqual([120, 300, 700, 260]);
    expect(params.textB).toEqual([96, 2400, 1248, 1800]);
    expect(params.textC[2]).toBe(0);
  });
  test("the hero's strength follows the copy", () => {
    expect(skyParams(input({ copy: 0.25 })).params.textK).toEqual([0.25, 1, 1, 0]);
  });
  test("the body shows from the first frame, at full strength", () => {
    expect(skyParams(input({ intro: 0 })).params.body[3]).toBe(1);
    expect(skyParams(input({ body: null })).params.body[3]).toBe(0);
  });
  test("the intro closes the beads and lights the diamond", () => {
    const start = skyParams(input({ intro: 0 })).params;
    expect(start.beads).toBe(-2);
    expect(start.sun[3]).toBeCloseTo(0, 6);
    const end = skyParams(input({ intro: 1 })).params;
    expect(end.beads).toBeCloseTo(0.12, 9);
  });
  test("the body moves to page space with the scroll", () => {
    const e = endFrame(1440, 900);
    const { params } = skyParams(input({ scroll: 3000 }));
    expect(params.body[1]).toBeCloseTo(e.C[1] + 3000, 9);
    expect(params.sun[1]).toBeCloseTo(e.B[1] + 3000, 9);
  });
  test("a pulse runs 3.5 s from its click, then stops changing the frame", () => {
    expect(skyParams(input({ now: 10_000, signal: { lift: 0, at: 9_000 } })).params.pulse[0]).toBeCloseTo(1, 9);
    const a = skyParams(input({ now: 13_600, signal: { lift: 0, at: 10_000 } }));
    const b = skyParams(input({ now: 20_000, signal: { lift: 0, at: 10_000 } }));
    expect(a.params.pulse[0]).toBe(-1);
    expect(sameKey(diffKey(a.params), diffKey(b.params))).toBe(true);
  });
  test("a page without the body stays finite", () => {
    const { params, frontKey } = skyParams(input({ body: null, text: { hero: EMPTY_RECT, work: EMPTY_RECT, contact: EMPTY_RECT } }));
    expect(diffKey(params).every(Number.isFinite)).toBe(true);
    expect(frontKey.every(Number.isFinite)).toBe(true);
  });
});

describe("frontKey", () => {
  test("ignores the scroll while the body holds still on screen", () => {
    const a = skyParams(input({ scroll: 5000, frontOn: true })).frontKey;
    const b = skyParams(input({ scroll: 5400, starScroll: 5400, frontOn: true })).frontKey;
    expect(sameKey(a, b)).toBe(true);
  });
  test("changes with the lift and the pulse", () => {
    const a = skyParams(input({ frontOn: true })).frontKey;
    expect(sameKey(a, skyParams(input({ frontOn: true, signal: { lift: 0.5, at: Number.NEGATIVE_INFINITY } })).frontKey)).toBe(false);
    expect(sameKey(a, skyParams(input({ frontOn: true, signal: { lift: 0, at: 9_500 } })).frontKey)).toBe(false);
  });
});

describe("diffKey", () => {
  test("ignores time and nothing else", () => {
    const a = skyParams(input()).params;
    expect(sameKey(diffKey(a), diffKey(skyParams(input({ time: 5 })).params))).toBe(true);
    expect(sameKey(diffKey(a), diffKey(skyParams(input({ scroll: 1 })).params))).toBe(false);
  });
});

describe("bandExtent", () => {
  test("covers the viewport and the band's whole drift down the page, 8 px past each edge", () => {
    const { origin, size } = bandExtent(1440, 900, 6000);
    expect(origin[0]).toBeLessThanOrEqual(-8);
    expect(origin[1]).toBeLessThanOrEqual(-8);
    expect(origin[0] + size[0]).toBeGreaterThanOrEqual(1448);
    expect(origin[1] + size[1]).toBeGreaterThanOrEqual(900 + 0.025 * 6000 + 8);
  });
  test("leaves room for the coast to wander 2000 px past either end", () => {
    const { origin, size } = bandExtent(1440, 900, 6000);
    expect(origin[1]).toBeLessThanOrEqual(-0.025 * 2000);
    expect(origin[1] + size[1]).toBeGreaterThanOrEqual(900 + 0.025 * 8000);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test src/components/sky/params.test.ts`
Expected: FAIL with `Cannot find module './params'`.

- [ ] **Step 3: Implement**

Create `src/components/sky/params.ts`:

```ts
import { beadFlash, beadOpen, sunFrame, type Body } from "@/lib/eclipse";
import { pulseAge } from "@/lib/signal";
import type { Rect } from "@/lib/sky-math";

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
  /** The body, or null on a page without an eclipse box. */
  body: Body | null;
  morph: number;
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
  const vis = s.body ? 1 : 0;
  const glare = sunFrame(s.morph, s.W);
  const age = pulseAge(s.now, s.signal.at);
  const flash = beadFlash(s.intro);
  const beads = beadOpen(s.intro);
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
    sun: [body.B[0], body.B[1] + s.scroll, s.morph, flash],
    glare: [glare.core, glare.glare, glare.streakH, glare.streakV],
    settle: s.settle,
    span: s.span,
    trail: [s.trail.shed, s.trail.carry, s.trail.gather, s.starScroll],
    velocity: s.reduced ? 0 : s.velocity + s.coast,
    beads,
    lift: s.signal.lift,
    pulse: [age, s.reduced ? 0 : 1],
    textA: rect(s.text.hero),
    textB: rect(s.text.work),
    textC: rect(s.text.contact),
    textK: [s.copy, 1, 1, 0],
    band: [...s.band.origin, ...s.band.size],
  };
  // The front canvas holds still on screen, so it reads the body in viewport px and ignores the scroll.
  const lit = s.light.hover > 0;
  const frontKey = [
    s.frontOn ? 1 : 0, body.C[0], body.C[1], body.R, body.B[0], body.B[1], s.morph, vis, flash, beads, s.settle,
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
```

- [ ] **Step 4: Run them to see them pass**

Run: `bun test src/components/sky/params.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add src/components/sky/params.ts src/components/sky/params.test.ts
git commit -m "feat(sky): build each frame's uniforms in one pure function"
```

---

### Task 8: The polished sky, live

**Files:**
- Create: `src/components/sky/wgsl/trail.wgsl`, `src/components/sky/milky-cache.ts`
- Replace: `src/components/sky/sky.wgsl`, `src/components/sky/renderer.ts`
- Modify: `src/components/sky/sky.tsx` (`data-sky="pending"`)
- Modify: `src/lib/eclipse.ts`, `src/lib/eclipse.test.ts` (remove `haloFrame`)
- Create (scratch): `$PW/polish.mjs`, `$PROBES/align.ts`

**Interfaces:**
- Consumes:
  - every module from Tasks 5–6
  - `skyParams`, `bandExtent`, `diffKey`, `sameKey`, `type BandMap`, `type SkyInput` (Task 7)
  - `textRect`, `flight.signal`, `flight.eclipse.copy` (Task 3)
- Produces:
  - `createMilkyCache(gpu): { target; effect; sampler; compile(); update(W, H, dpr, map): boolean }`
  - `sky.wgsl`'s `Params` (= `skyParams().params`), plus the bindings `milky: texture_2d<f32>` and `milkySampler: sampler`
  - `html[data-sky]`: `css` (initial HTML, fallback), `pending` (WebGPU found), `live`.

- [ ] **Step 1: Write the new entry point first (the failing check)**

Replace `src/components/sky/sky.wgsl` entirely with:

```wgsl
// The page's one sky, in page space and linear light (sky polish spec §3): the star field and the
// Milky Way, the body the camera flies from board 09's eclipse to board 02's horizon, the sun and
// its lens, and the trail. Lengths are CSS px; y grows down the page.
import { Body, bodyLight } from "./wgsl/body.wgsl";
import { ghosts, sunGlare, sunPulse } from "./wgsl/lens.wgsl";
import { encode, grain, LUMA, shoulder, textMask } from "./wgsl/light.wgsl";
import { skyField, StarFrame } from "./wgsl/stars.wgsl";
import { gather, nebula, ribbon, shed, Trail } from "./wgsl/trail.wgsl";

struct Params {
  resolution: vec2f,
  // The light, in page space: the pointer while hovering, else resting above the hero.
  light: vec2f,
  // The pointer in 0..1 of the viewport, for the star parallax.
  pointer: vec2f,
  // Canvas pixels per CSS pixel.
  dpr: f32,
  scroll: f32,
  hover: f32,
  time: f32,
  // 1 for the front pass, which draws only the ground over the content, else 0.
  layer: f32,
  // The front canvas's top in the viewport, CSS px; 0 for the back canvas.
  origin: f32,
  viewHeight: f32,
  // The body: centre x, y (page), radius, visibility.
  body: vec4f,
  // The bead, which becomes the sun: x, y (page), morph (0 eclipse .. 1 horizon), the diamond's strength.
  sun: vec4f,
  // sunFrame: core radius, glare radius, horizontal and vertical streak decay (px).
  glare: vec4f,
  // How far the horizon has settled toward its rest line, 0..1.
  settle: f32,
  // Where the trail's ribbon runs, page y: the tops of Work and Contact.
  span: vec2f,
  // The trail (shed, carry, gather) and, in w, the stars' virtual scroll.
  trail: vec4f,
  // The stars' scroll speed, px/s.
  velocity: f32,
  // How far Baily's beads are open.
  beads: f32,
  // A hovered or focused Contact link's lift on the sun, 0..1.
  lift: f32,
  // The signal's pulse: age (s, < 0 for none), and travel (0 under reduced motion, which also stops
  // the cursor's light, the aim and the corona's lean).
  pulse: vec2f,
  // Page rects of the hero statement, Work's list and Contact's block (w 0 for none), and their strengths.
  textA: vec4f,
  textB: vec4f,
  textC: vec4f,
  textK: vec4f,
  // The band-space rect the Milky Way cache covers: origin, size.
  band: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var milky: texture_2d<f32>;
@group(0) @binding(2) var milkySampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let frag = uv * params.resolution;
  let css = frag / params.dpr + vec2f(0.0, params.origin);
  // The same screen pixel in both passes, so the grain matches across the rim.
  let screen = frag + vec2f(0.0, params.origin * params.dpr);
  let page = css + vec2f(0.0, params.scroll);
  let W = params.resolution.x / params.dpr;
  let t = params.time;
  let vis = params.body.w;
  let B = params.sun.xy;
  let m = params.sun.z;
  let motion = params.pulse.y;

  // The front pass keeps only the ground and the rim; above them it's clear.
  let front = params.layer > 0.5;
  if (front && (vis <= 0.001 || length(page - params.body.xy) - max(params.body.z, 1.0) > 3.0)) {
    return vec4f(0.0);
  }

  let quiet = max(max(textMask(page, params.textA) * params.textK.x, textMask(page, params.textB) * params.textK.y),
                  textMask(page, params.textC) * params.textK.z);
  // The cursor's light (spec §5.5), dimmed behind text.
  let lp = page - params.light;
  let pl = params.hover * motion * exp(-dot(lp, lp) / 80000.0) * (1.0 - 0.92 * quiet);

  let gathered = params.trail.z;
  let b = Body(params.body.xy, params.body.z, vis, B, m, params.beads, W, params.dpr, t, params.hover, params.light,
               motion, params.settle, params.pulse.x, params.pulse.y, 1.0 + 0.25 * gathered * smoothstep(0.6, 1.0, gathered));
  let bl = bodyLight(page, b, pl, quiet);
  // Where the corona or the air is bright, the stars wash out.
  let ext = 1.0 - 0.9 * smoothstep(0.003, 0.06, dot(bl.front, LUMA));
  let sf = StarFrame(params.trail.w, params.velocity, params.dpr, t, (params.pointer - 0.5) * 8.0 * params.hover, pl, ext,
                     quiet, params.band);
  let tr = Trail(W, params.scroll, t, params.trail.x, params.trail.y, gathered, params.span.x, params.span.y,
                 params.viewHeight, B, vis, params.settle);

  var col = skyField(css, sf, milky, milkySampler) + nebula(page, css, tr) + ribbon(page, css, tr, quiet) + bl.front;
  // The moon and the ground are opaque.
  col = mix(col, bl.night, bl.inside);
  col += bl.limb + shed(page, bl.d, tr) + gather(page, bl.d, tr);

  // The sun brightens for a hovered link, flashes as a signal leaves, and flares near the pointer.
  let near = params.hover * (1.0 - smoothstep(24.0, 180.0, length(params.light - B)));
  var k = params.sun.w * sunPulse(t, m) * (1.0 + 0.6 * params.lift) * (1.0 + 0.7 * near) * vis;
  if (params.pulse.x >= 0.0) {
    k *= 1.0 + 1.2 * exp(-5.0 * params.pulse.x);
  }
  if (k > 0.001 && length(page - B) < max(700.0, 4.0 * params.glare.z)) {
    col += sunGlare(page - B, m, bl.d, params.glare) * k;
  }
  // Lens ghosts, on the line from the sun through the frame's centre while the stars move, or
  // through the pointer as it aims. The ground hides them, and the front pass never draws them.
  if (!front) {
    let aim = params.hover * motion * (1.0 - smoothstep(0.35 * W, 0.8 * W, length(params.light - B)));
    let gk = k * (0.9 * smoothstep(100.0, 1400.0, abs(params.velocity)) + 0.6 * aim) * mix(1.0, smoothstep(-1.5, 1.5, bl.d), m);
    if (gk > 0.001) {
      let view = vec2f(W * 0.5, params.scroll + params.viewHeight * 0.5);
      col += ghosts(page, B, mix(view, params.light, params.hover)) * gk;
    }
  }

  let encoded = encode(shoulder(max(col, vec3f(0.0))));
  let rgb = max(encoded + grain(screen, dot(encoded, LUMA), t), vec3f(0.0));
  if (front) {
    // Opaque up to 1.5 px above the rim, so the rim line sits over the content; clear by 3 px.
    let a = 1.0 - smoothstep(1.5, 3.0, bl.d);
    return vec4f(rgb * a, a);
  }
  return vec4f(rgb, 1.0);
}
```

- [ ] **Step 2: Run the check to see it fail**

Run: `bunx vgpu check src/components/sky/sky.wgsl --require-validation`
Expected: FAIL with `VGPU-WGSL-RES-NOTFOUND` for `./wgsl/trail.wgsl`.

- [ ] **Step 3: Write the trail module**

Create `src/components/sky/wgsl/trail.wgsl`:

```wgsl
// The trail (eclipse spec §5.4–5.5, sky polish spec §4.5): the margin nebula, the shed, the ribbon
// through Work and the gather into the resting horizon, in linear light. Their shapes and
// choreography are unchanged; each was tuned as display colour over the page, so lift() keeps
// its on-screen value.
import { BG, decode } from "./light.wgsl";
import { fbm, vnoise } from "./noise.wgsl";

export struct Trail {
  W: f32,
  scroll: f32,
  time: f32,
  // shed, carry, gather, 0..1
  shed: f32,
  carry: f32,
  gather: f32,
  // Where the ribbon runs, page y: the tops of Work and Contact.
  workTop: f32,
  contactTop: f32,
  viewHeight: f32,
  // The sun, the body's visibility and how far the horizon has settled.
  B: vec2f,
  vis: f32,
  settle: f32,
}

// The old fbm's octave sums, at their old amplitude.
fn fbm4(p: vec2f) -> f32 {
  return fbm(p, 4, 41u) * 0.9375;
}
fn fbm3(p: vec2f) -> f32 {
  return fbm(p, 3, 43u) * 0.875;
}

// Display-space colour added over the page background, as linear light.
fn lift(add: vec3f) -> vec3f {
  return decode(vec3f(0.0235, 0.0275, 0.0392) + add) - BG;
}

// Domain-warped fbm gathering along the page margins, drifting on its own and lagging the scroll.
export fn nebula(page: vec2f, css: vec2f, tr: Trail) -> vec3f {
  var side = smoothstep(0.26, 0.5, abs(css.x - tr.W * 0.5) / tr.W);
  side *= 0.3 + 0.7 * vnoise(vec2f(page.y * 0.0012, step(tr.W * 0.5, css.x) * 5.0), 47u);
  let env = side * 0.55;
  if (env <= 0.003) {
    return vec3f(0.0);
  }
  let q = vec2f(page.x, page.y - tr.scroll * 0.55) / 560.0;
  let tt = tr.time * 0.02;
  let w = vec2f(fbm3(q + vec2f(0.0, tt)), fbm3(q + vec2f(5.2, 1.3) + vec2f(-tt * 0.8, tt * 0.3)));
  let n = fbm4(q * 1.3 + (w - 0.45) * 2.4 + vec2f(tt * 0.6, -tt * 0.25));
  var cloud = smoothstep(0.4, 0.8, n);
  cloud *= cloud;
  let x = max(n - 0.52, 0.0) * 2.6;
  let hue = fbm3(q * 0.7 + w * 1.5 + 3.7);
  var neb = mix(vec3f(0.16, 0.24, 0.52), vec3f(0.27, 0.2, 0.5), smoothstep(0.35, 0.65, hue));
  neb = mix(neb, vec3f(0.15, 0.32, 0.38), smoothstep(0.5, 0.75, w.x));
  return lift(neb * (cloud * 0.17 + x * x * x * 0.12) * min(env, 1.4));
}

// Carry: the shed atmosphere winds down through Work as a ribbon of nebula. quiet, the text mask,
// dims it behind the text.
export fn ribbon(page: vec2f, css: vec2f, tr: Trail, quiet: f32) -> vec3f {
  if (tr.carry <= 0.003 || page.y < tr.workTop - 400.0 || page.y > tr.contactTop + 200.0) {
    return vec3f(0.0);
  }
  let deep = page.y - tr.scroll * 0.55;
  // Near Contact it bends into the resting horizon's sun.
  let bend = tr.gather * smoothstep(tr.contactTop - 900.0, tr.contactTop, page.y);
  let path = tr.W * (0.5 + 0.3 * sin(deep / 900.0 + 1.1) + 0.08 * sin(deep / 310.0));
  let off = abs(page.x - mix(path, tr.B.x, bend));
  if (off >= tr.W * 0.5) {
    return vec3f(0.0);
  }
  let width = tr.W * mix(0.22, 0.08, bend);
  let q = vec2f(page.x, deep) / 420.0;
  let w = vec2f(fbm3(q + vec2f(2.1, tr.time * 0.02)), fbm3(q + vec2f(7.3, 3.9)));
  let n = fbm3(q * 1.6 + (w - 0.45) * 2.0);
  let body = exp(-(off * off) / (width * width));
  let ends = smoothstep(tr.workTop - 400.0, tr.workTop + 300.0, page.y) * (1.0 - smoothstep(tr.contactTop, tr.contactTop + 200.0, page.y));
  return lift(vec3f(0.2, 0.34, 0.7) * smoothstep(0.3, 0.75, n) * body * ends * (1.0 - 0.45 * quiet) * tr.carry * 0.3);
}

// Shed: as the horizon settles, its atmosphere peels off the rim around the sun and streams up the
// page, then fades as the ribbon takes over. Its root keeps the sunrise's amber. d: height above the limb.
export fn shed(page: vec2f, d: f32, tr: Trail) -> vec3f {
  let k = tr.shed * (1.0 - 0.5 * tr.vis) * smoothstep(0.0, 0.15, tr.vis) * (1.0 - smoothstep(0.5, 1.0, tr.settle));
  let Rs = 0.95 * tr.viewHeight;
  let len = Rs * mix(0.15, 0.9, tr.shed);
  if (k <= 0.001 || d <= 0.0 || d >= len) {
    return vec3f(0.0);
  }
  let lat = (page.x - tr.B.x) / Rs;
  let along = d / len;
  let q = vec2f(lat * 14.0, along * 1.6 - tr.shed * 2.5 - tr.time * 0.03);
  let n = fbm4(q + vec2f(fbm3(q * 0.8) * 1.2, 0.0));
  let streak = smoothstep(0.42, 0.8, n) * exp(-along * 1.6) * (1.0 - smoothstep(0.7, 1.0, along));
  let crown = 1.0 - smoothstep(0.6, 1.1, abs(lat));
  let blue = mix(vec3f(0.47, 0.7, 0.96), vec3f(0.16, 0.24, 0.52), smoothstep(0.0, 0.8, along));
  let tint = mix(blue, vec3f(1.0, 0.6, 0.22), 0.25 * (1.0 - smoothstep(0.0, 0.33, along)));
  return lift(tint * streak * crown * k * 0.45);
}

// Gather: the ribbon's wisps run along the resting rim into the sun.
export fn gather(page: vec2f, d: f32, tr: Trail) -> vec3f {
  if (tr.gather <= 0.001 || tr.vis <= 0.001 || d <= 0.0 || d >= 400.0) {
    return vec3f(0.0);
  }
  let inward = abs(page.x - tr.B.x) / (0.37 * tr.W);
  let wq = vec2f(inward * 2.5 + tr.time * 0.04 + tr.gather * 1.5, d / 90.0);
  let wisp = smoothstep(0.55, 0.85, fbm3(wq)) * exp(-d / 180.0);
  return lift(vec3f(0.3, 0.45, 0.85) * wisp * tr.gather * 0.12 * tr.vis);
}
```

- [ ] **Step 4: Run the shader check to see every entry pass**

Run the four-entry loop from Global Constraints.
Expected: four `ok` lines.

- [ ] **Step 5: Write the cache and the renderer**

Create `src/components/sky/milky-cache.ts`:

```ts
import { effect, sampler, target, type Gpu } from "vgpu";

import type { BandMap } from "./params";
import cacheSource from "./wgsl/milky-cache.wgsl";

/**
 * The Milky Way cache (spec §3.5): ~22 octaves of noise per pixel that only drift at 2.5% of the
 * scroll, so the band renders once at half the sky's resolution and the sky samples it each frame.
 * Its texture belongs to the shared device, which gpu.ts keeps for the tab's lifetime.
 */
export function createMilkyCache(gpu: Gpu) {
  const cache = target(gpu, { size: [1, 1], format: "rgba16float" });
  const band = effect(gpu, cacheSource, { set: { params: { size: [1, 1], map: [0, 0, 1, 1] } } });
  let key = "";
  return {
    target: cache,
    effect: band,
    sampler: sampler(gpu, { minFilter: "linear", magFilter: "linear" }),
    compile: () => band.compile({ colors: [cache.format] }),
    /** Sizes the cache for this viewport and extent; true when it must be drawn again. */
    update(W: number, H: number, dpr: number, map: BandMap) {
      const next = [W, H, dpr, ...map.origin, ...map.size].join();
      if (next === key) return false;
      key = next;
      cache.resize([Math.max(1, Math.ceil((map.size[0] * dpr) / 2)), Math.max(1, Math.ceil((map.size[1] * dpr) / 2))]);
      band.set({ params: { size: [W, H], map: [...map.origin, ...map.size] } });
      return true;
    },
  };
}
```

Replace `src/components/sky/renderer.ts` entirely with:

```ts
import { effect, frame, surface } from "vgpu";

import { createMilkyCache } from "./milky-cache";
import { bandExtent, diffKey, sameKey, skyParams, type BandMap, type SkyInput } from "./params";
import skySource from "./sky.wgsl";
import { bodyFrame, endFrame, settleFrame, startFrame, stillFrame, type Body } from "@/lib/eclipse";
import { anchorRect, EMPTY_RECT, flight, onTick, startFlight, textRect } from "@/lib/flight";
import { getGpu } from "@/lib/gpu";
import { armIntro, introProgress, rise, skyDpr, trailFrame, type Rect } from "@/lib/sky-math";

const INTRO_DELAY_MS = 250;
// The ambient drift (twinkle, the corona's filaments, the sun's pulse) needs no more than ~30fps.
const AMBIENT_MS = 33;

type Callbacks = { onFirstFrame: () => void; onFallback: () => void };

/**
 * Draws the page's sky into the fixed `canvas` on flight's tick, and the resting horizon's ground
 * into `front`, over the content (eclipse spec §5.6). Frames are drawn on demand (sky polish spec
 * §3.6): when any uniform has changed, while the intro eases, and at ~30fps while the body moves.
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
      const milky = createMilkyCache(gpu);

      let cssWidth = 1;
      let cssHeight = 1;
      let frontTop = 0;
      let hero: Rect = EMPTY_RECT;
      let eclipse: Rect = EMPTY_RECT;
      let work: Rect = EMPTY_RECT;
      let contact: Rect = EMPTY_RECT;
      let text = { hero: EMPTY_RECT, work: EMPTY_RECT, contact: EMPTY_RECT };
      let band: BandMap = bandExtent(1, 1, 0);
      let time = flight.reduced ? 8 : 0;
      let lastDraw = 0;
      let dirty = true;
      let shown = false;
      let frontShown = false;
      let introStart: number | null = null;
      // What the last frame was drawn from; a tick that matches it draws nothing.
      let lastKey: number[] = [];
      // What the ground was last drawn from. It holds still on screen, so it ignores the scroll.
      let lastFront: number[] = [];

      const input = (now: number): SkyInput => {
        const { light, pointer, reduced } = flight;
        const cam = flight.eclipse;
        const scrollY = flight.scroll;
        const W = cssWidth;
        const H = cssHeight;
        const hasEclipse = eclipse.width > 0;
        // The tick only runs while the tab is visible.
        introStart = armIntro(introStart, now + INTRO_DELAY_MS, hasEclipse, true);
        const intro = reduced ? 1 : introStart === null ? 0 : introProgress(now - introStart);
        let body: Body | null = null;
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
        const up = !contact.height ? 0 : reduced ? 1 : rise(scrollY, H, contact);
        return {
          resolution: output.size,
          W,
          H,
          scroll: scrollY,
          starScroll: scrollY + flight.coast.offset,
          velocity: flight.velocity,
          coast: flight.coast.v,
          light,
          pointer,
          reduced,
          now,
          time,
          body,
          morph,
          settle,
          intro,
          trail: trailFrame(settle, up, reduced, work.height > 0),
          span: [work.top, contact.height ? contact.top : work.top + work.height],
          text,
          copy: cam.copy,
          signal: flight.signal,
          band,
          // The ground covers the content from the runway's end on (eclipse spec §5.6).
          frontOn: !reduced && hasEclipse && scrollY >= cam.end,
          frontTop,
        };
      };

      const initial = skyParams(input(0)).params;
      const sky = effect(gpu, skySource, { set: { params: initial, milky: milky.target, milkySampler: milky.sampler } });
      const ground = effect(gpu, skySource, {
        set: { params: { ...initial, layer: 1 }, milky: milky.target, milkySampler: milky.sampler },
      });
      await Promise.all([
        sky.compile({ colors: [output.format] }),
        ground.compile({ colors: [frontOutput.format] }),
        milky.compile(),
      ]);
      if (disposed) return;

      // Layout is read only here, never inside a tick.
      measure = () => {
        hero = anchorRect("hero");
        eclipse = anchorRect("eclipse");
        work = anchorRect("work");
        contact = anchorRect("contact");
        text = { hero: textRect("hero"), work: textRect("work"), contact: textRect("contact") };
        band = bandExtent(cssWidth, cssHeight, document.documentElement.scrollHeight - window.innerHeight);
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
        band = bandExtent(cssWidth, cssHeight, document.documentElement.scrollHeight - window.innerHeight);
        dirty = true;
        // Resizing clears the canvas.
        lastFront = [];
      };

      const tick = (now: number) => {
        if (document.hidden) return;
        const next = input(now);
        const key = diffKey(skyParams(next).params);
        const changed = dirty || !sameKey(key, lastKey);
        const easing = !next.reduced && introStart !== null && next.intro < 1;
        // At rest the body holds still, so reading Work costs no frames (eclipse spec §5.8).
        const ambient = !next.reduced && next.body !== null && next.settle < 1;
        if (!changed && !easing && !(ambient && now - lastDraw >= AMBIENT_MS)) return;

        // Time only runs while something ambient is in view; elsewhere frames are static.
        if (ambient && lastDraw) time += Math.min((now - lastDraw) / 1000, 0.1);
        lastDraw = now;
        dirty = false;
        lastKey = key;
        const { params, frontKey } = skyParams({ ...next, time });
        sky.set({ params });
        const drawCache = milky.update(next.W, next.H, params.dpr, band);

        if (next.frontOn !== frontShown) {
          frontShown = next.frontOn;
          front.style.visibility = next.frontOn ? "visible" : "hidden";
        }
        const drawGround = next.frontOn && !sameKey(frontKey, lastFront);
        if (drawGround) {
          lastFront = frontKey;
          ground.set({ params: { ...params, resolution: frontOutput.size, layer: 1, origin: frontTop } });
          const body = next.body;
          if (body) {
            // Hit-testing follows the planet: the ground takes the clicks, the clear sky above it doesn't.
            front.style.clipPath = `circle(${(body.R + 3).toFixed(1)}px at ${body.C[0].toFixed(1)}px ${(body.C[1] - frontTop).toFixed(1)}px)`;
          }
        }
        const done = frame(gpu, (f) => {
          if (drawCache) f.pass(milky.target, milky.effect);
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

- [ ] **Step 6: Gate the CSS diamond while the live sky may take over**

In `src/components/sky/sky.tsx`, in the first `useEffect`, after `if (!canvas || !front || !("gpu" in navigator)) return;`:

```ts
    // The CSS diamond waits while the live sky may still take over (sky polish spec §6).
    document.documentElement.dataset.sky = "pending";
```

- [ ] **Step 7: Remove `haloFrame`**

- In `src/lib/eclipse.ts`, delete `haloFrame` and its doc comment.
- In `src/lib/eclipse.test.ts`, delete `haloFrame,` from the imports and the whole `describe("haloFrame", …)` block.

Run: `bun run typecheck && bun test`
Expected: PASS, with 26 tests in `eclipse.test.ts`. `grep -rn haloFrame src` prints nothing.

- [ ] **Step 8: The alignment probe**

Create `$PROBES/align.ts`:

```ts
// The sky polish round's alignment check (spec §2.4), rendered headless: at the hold, with a
// 6000 px/s fling, the light 3–20 px below the sun's row must be ≤ 15% of the light as far above it,
// at three points along its streak. Run from the repo root: bun $PROBES/align.ts
import { resolveShader } from "@vgpu/wgsl/runtime";
import { effect, frame, init, sampler, target } from "vgpu/node";

import { bandExtent, skyParams, type SkyInput } from "@/components/sky/params";
import { endFrame } from "@/lib/eclipse";
import { EMPTY_RECT } from "@/lib/flight";

const ROOT = process.cwd();
const W = 1440;
const H = 900;
const sky = (await resolveShader({ entry: `${ROOT}/src/components/sky/sky.wgsl` })).wgsl;
const cacheShader = (await resolveShader({ entry: `${ROOT}/src/components/sky/wgsl/milky-cache.wgsl` })).wgsl;
const gpu = await init();
const band = bandExtent(W, H, 6000);
const cache = target(gpu, { size: [Math.ceil(band.size[0] / 2), Math.ceil(band.size[1] / 2)], format: "rgba16float" });
frame(gpu, (f) => f.pass(cache, effect(gpu, cacheShader, { set: { params: { size: [W, H], map: [...band.origin, ...band.size] } } })));

const e = endFrame(W, H);
const input: SkyInput = {
  resolution: [W, H], W, H, scroll: 0, starScroll: 2000, velocity: 6000, coast: 0,
  light: { x: 0, y: 0, hover: 0 }, pointer: { nx: 0.5, ny: 0.5 }, reduced: false, now: 10_000, time: 2,
  body: e, morph: 1, settle: 0, intro: 1, trail: { shed: 0, carry: 0, gather: 0 }, span: [2400, 4600],
  text: { hero: EMPTY_RECT, work: EMPTY_RECT, contact: EMPTY_RECT }, copy: 0,
  signal: { lift: 0, at: Number.NEGATIVE_INFINITY }, band, frontOn: false, frontTop: 558,
};
const out = target(gpu, { size: [W, H], format: "rgba8unorm" });
const fx = effect(gpu, sky, { set: { params: skyParams(input).params, milky: cache, milkySampler: sampler(gpu, { minFilter: "linear", magFilter: "linear" }) } });
frame(gpu, (f) => f.pass(out, fx));
const px = await out.color.read({ mipLevel: 0, region: "all" });
gpu.dispose();

const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (x: number, y: number) => {
  const i = (Math.round(y) * W + Math.round(x)) * 4;
  return 0.2126 * lin(px[i]) + 0.7152 * lin(px[i + 1]) + 0.0722 * lin(px[i + 2]);
};
let worst = 0;
for (const x of [e.B[0] + 60, e.B[0] + 200, e.B[0] + 400]) {
  let below = 0;
  let above = 0;
  for (let k = 3; k <= 20; k++) {
    below += lum(x, e.B[1] + k);
    above += lum(x, e.B[1] - k);
  }
  worst = Math.max(worst, below / above);
}
console.log(`alignment: below/above ${worst.toFixed(3)} (≤ 0.15)`, worst <= 0.15 ? "PASS" : "FAIL");
if (worst > 0.15) process.exit(1);
```

Run from the repo root (the copy lets `@/` and the packages resolve; it's deleted at once):
`cp $PROBES/align.ts ./.align.ts && bun ./.align.ts; rm -f ./.align.ts`
Expected: `alignment: below/above 0.044 (≤ 0.15) PASS`, or any value ≤ 0.15.

- [ ] **Step 9: Look at it in a browser**

Create `$PW/polish.mjs`:

```js
// Browser checks for the sky polish round (docs/superpowers/specs/2026-10-10-sky-polish-design.md).
// Run: cd $PW && URL=http://localhost:3000/ node polish.mjs [test names]
import { chromium } from "playwright";
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
const countSubmits = () => {
  window.__submits = 0;
  if (!("gpu" in navigator)) return;
  const submit = GPUQueue.prototype.submit;
  GPUQueue.prototype.submit = function (...a) {
    window.__submits++;
    return submit.apply(this, a);
  };
};
// The CSS sky in Chromium: no WebGPU, so the sky falls back as it does without it.
const noGpu = () => {
  delete Navigator.prototype.gpu;
};
const open = async (opts = {}, init, path = "") => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.addInitScript(countSubmits);
  if (init) await p.addInitScript(init);
  await p.goto(URL + path);
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
// The limb in column x: the row, between y0 and y1, where the light drops most going down.
const limbRow = (img, x, y0, y1) => {
  let best = { y: -1, drop: -Infinity };
  for (let y = Math.round(y0); y < Math.round(y1); y++) {
    const drop = at(img, x, y) - at(img, x, y + 1);
    if (drop > best.drop) best = { y: y + 0.5, drop };
  }
  return best.y;
};
// The eclipse's left and right limbs on the row through its centre: where the dark disc starts and ends.
const discEdges = (img, cx, cy, r) => {
  const dark = (x) => at(img, x, cy) < 0.02;
  let left = Math.round(cx);
  while (left > cx - r - 20 && dark(left - 1)) left--;
  let right = Math.round(cx);
  while (right < cx + r + 20 && dark(right + 1)) right++;
  return { centre: (left + right + 1) / 2, radius: (right + 1 - left) / 2 };
};
// Local maxima brighter than `min` inside a rect: the screen's stars.
const peaks = (img, x0, y0, x1, y1, min) => {
  const out = [];
  for (let y = y0 + 1; y < y1 - 1; y++) {
    for (let x = x0 + 1; x < x1 - 1; x++) {
      const l = at(img, x, y);
      if (l < min) continue;
      let top = true;
      for (let dy = -1; dy <= 1 && top; dy++) for (let dx = -1; dx <= 1 && top; dx++) if ((dx || dy) && at(img, x + dx, y + dy) > l) top = false;
      if (top) out.push([x, y]);
    }
  }
  return out;
};
const skyOnly = (p) => p.addStyleTag({ content: "main, header { visibility: hidden !important; }" });
const geometry = (p) =>
  p.evaluate(() => {
    const box = document.querySelector('[data-sky-anchor="eclipse"]').getBoundingClientRect();
    return {
      W: innerWidth,
      H: innerHeight,
      C: [box.x + box.width / 2, box.y + scrollY + box.height / 2],
      R: box.width / 2,
      end: document.querySelector("#home").offsetHeight - innerHeight,
      max: document.documentElement.scrollHeight - innerHeight,
    };
  });
const DIM = lum(0x7c, 0x81, 0x8b);
const contrast = async (p, clip) => {
  const img = await shot(p, { clip });
  const ls = [];
  for (let i = 0; i < img.data.length; i += 4) ls.push(lum(img.data[i], img.data[i + 1], img.data[i + 2]));
  ls.sort((x, y) => x - y);
  return (DIM + 0.05) / (ls[Math.floor(ls.length * 0.95)] + 0.05);
};
const rectOf = (p, sel) =>
  p.$eval(sel, (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

// §2.1: screenshots to judge by eye against the prototypes' screens.
tests.test_shots = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    const g = await geometry(p);
    const stops = { top: 0, runway: g.end * 0.5, hold: g.end, settle: g.end + 0.5 * h, work: g.end + 2 * h, contact: g.max };
    for (const [name, y] of Object.entries(stops)) {
      await jump(p, y);
      await p.screenshot({ path: `polish-${w}-${name}.png` });
    }
    report(`test_shots ${w}`, p.errors.length === 0, { errors: p.errors });
    await p.context().close();
  }
};

// §5.6: a click on Contact's Email link runs the signal out along the rim, then everything stops.
tests.test_signal = async () => {
  const p = await open();
  const g = await geometry(p);
  await jump(p, g.max, 3000);
  await p.mouse.move(5, 5);
  await p.waitForTimeout(1500);
  const rest = await shot(p);
  const sun = sunColumn(rest, 0.8 * g.H, 0.95 * g.H);
  const x = sun.x + 0.3 * g.W;
  const row = limbRow(rest, x, 0.8 * g.H, 0.98 * g.H);
  const band = (img) => {
    let s = 0;
    for (let dy = -8; dy <= 0; dy++) s += at(img, x, row + dy);
    return s;
  };
  const base = band(rest);
  await p.$eval('#contact a[data-sky-signal][href^="mailto:"]', (a) => a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
  const t0 = Date.now();
  let peak = 0;
  while (Date.now() - t0 < 1000) peak = Math.max(peak, band(await shot(p)));
  await p.waitForTimeout(Math.max(0, 3500 - (Date.now() - t0)));
  const after = band(await shot(p));
  await p.waitForTimeout(150);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(1500);
  const idle = (await p.evaluate(() => window.__submits)) - s0;
  report("test_signal", peak > 1.3 * base && after <= 1.02 * base && idle === 0, { base: +base.toFixed(4), peak: +peak.toFixed(4), after: +after.toFixed(4), idle });
  await p.context().close();
};

// §5.6: hovering a Contact link lifts the sun; leaving lets it go.
tests.test_lift = async () => {
  const p = await open();
  const g = await geometry(p);
  await jump(p, g.max, 3000);
  await p.mouse.move(5, 5);
  await p.waitForTimeout(1500);
  const glow = (img, sx) => {
    let s = 0;
    for (let dy = -30; dy <= 0; dy++) for (let dx = -30; dx <= 30; dx += 3) s += at(img, sx + dx, 0.86 * g.H + dy);
    return s;
  };
  const rest = await shot(p);
  const sx = sunColumn(rest, 0.8 * g.H, 0.95 * g.H).x;
  const link = await rectOf(p, "#contact li a[data-sky-signal]");
  await p.mouse.move(link.x + link.width / 2, link.y + link.height / 2);
  await p.waitForTimeout(1200);
  const lifted = await shot(p);
  report("test_lift", glow(lifted, sx) > 1.15 * glow(rest, sx), { rest: +glow(rest, sx).toFixed(3), lifted: +glow(lifted, sx).toFixed(3) });
  await p.context().close();
};

// §2.4: the CSS sky and the live sky agree on the first frame: the eclipse, the horizon's limb at the sun, and the stars.
tests.test_css_live = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const live = await open({ viewport: { width: w, height: h } });
    const css = await open({ viewport: { width: w, height: h } }, noGpu);
    await skyOnly(live);
    await skyOnly(css);
    const g = await geometry(live);
    const [a, c] = [await shot(live), await shot(css)];
    const cy = g.C[1];
    const da = discEdges(a, g.C[0], cy, g.R);
    const dc = discEdges(c, g.C[0], cy, g.R);
    // Stars: every CSS star in the top band has a live star within 1 px.
    const cssStars = peaks(c, 0, 0, w, Math.min(240, h), 0.05);
    const liveStars = peaks(a, 0, 0, w, Math.min(240, h), 0.02);
    const matched = cssStars.filter(([x, y]) => liveStars.some(([lx, ly]) => Math.hypot(lx - x, ly - y) <= 1)).length;
    await jump(live, g.end);
    await jump(css, g.end);
    const [ha, hc] = [await shot(live), await shot(css)];
    const sun = sunColumn(ha, 0.6 * h, 0.7 * h);
    const limb = (img) => limbRow(img, sun.x - 150, 0.6 * h, 0.72 * h);
    const sky = await css.evaluate(() => document.documentElement.dataset.sky);
    const ok =
      sky === "css" &&
      Math.abs(da.centre - dc.centre) <= 1 &&
      Math.abs(da.radius - dc.radius) <= 1 &&
      (w < 864 || Math.abs(limb(ha) - limb(hc)) <= 1) &&
      cssStars.length > 0 &&
      matched / cssStars.length >= 0.98;
    report(`test_css_live ${w}`, ok, { sky, live: da, css: dc, limb: [limb(ha), limb(hc)], stars: `${matched}/${cssStars.length}` });
    await live.context().close();
    await css.context().close();
  }
};

// §2.5: contrast behind the dim words with the pointer on the text and away, live and on the CSS sky.
tests.test_contrast_pointer = async () => {
  const targets = [
    ["hero", 0, "#home h1 [data-head-word]:not(.text-ink)", "#home h1, #home h1 * { color: transparent !important; } .full-stop { visibility: hidden !important; }"],
    ["work", null, "#omsimos [data-statement]", "[data-statement], [data-statement] * { color: transparent !important; }"],
    ["contact", "max", '#contact [data-sky-text="contact"]', "#contact [data-sky-text] * { color: transparent !important; }"],
  ];
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    for (const gpu of [true, false]) {
      const p = await open({ viewport: { width: w, height: h } }, gpu ? undefined : noGpu);
      const rows = [];
      for (const [name, y, sel, hide] of targets) {
        if (!gpu && name !== "hero") continue;
        const g = await geometry(p);
        if (y === null) await p.evaluate(() => document.querySelector("#omsimos [data-statement]").scrollIntoView({ block: "center" }));
        else await p.evaluate((v) => scrollTo(0, v), y === "max" ? g.max : y);
        await settle(p);
        await p.addStyleTag({ content: hide });
        const box = await rectOf(p, sel);
        for (const pointer of ["away", "on"]) {
          await p.mouse.move(pointer === "on" ? box.x + box.width / 2 : 5, pointer === "on" ? box.y + box.height / 2 : 5);
          await p.waitForTimeout(2500);
          rows.push({ name, pointer, ratio: +(await contrast(p, box)).toFixed(2) });
        }
      }
      report(`test_contrast_pointer ${w} ${gpu ? "live" : "css"}`, rows.every((r) => r.ratio >= 4.5), rows);
      await p.context().close();
    }
  }
};

// §6: with WebGPU the CSS diamond waits unseen while the sky is pending; without it, it plays.
tests.test_diamond = async () => {
  const live = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const lp = await live.newPage();
  await lp.goto(URL);
  await lp.waitForTimeout(1000);
  const pending = await lp.evaluate(() => ({ sky: document.documentElement.dataset.sky, opacity: getComputedStyle(document.querySelector(".css-diamond")).opacity }));
  await live.close();
  const css = await open({}, noGpu);
  const lit = await css.evaluate(() => ({ sky: document.documentElement.dataset.sky, opacity: getComputedStyle(document.querySelector(".css-diamond")).opacity }));
  await css.context().close();
  const nojs = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const np = await nojs.newPage();
  await np.goto(URL);
  await np.waitForTimeout(3500);
  const box = await rectOf(np, '[data-sky-anchor="eclipse"]');
  const img = await shot(np);
  const bead = at(img, box.x + 0.1464 * box.width, box.y + 0.1464 * box.height);
  await nojs.close();
  report("test_diamond", ["pending", "live"].includes(pending.sky) && pending.opacity === "0" && lit.sky === "css" && Number(lit.opacity) > 0.99 && bead > 0.9, { pending, lit, bead: +bead.toFixed(3) });
};

// §2.9: the stills fit their budget, only the screen's own horizon still loads, and the 404 page loads no still.
tests.test_network = async () => {
  const sizes = async (w, path) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage();
    await p.addInitScript(noGpu);
    const seen = [];
    p.on("response", async (r) => {
      if (!new globalThis.URL(r.url()).pathname.startsWith("/sky/")) return;
      seen.push({ path: new globalThis.URL(r.url()).pathname, bytes: (await r.body()).length, gzip: r.headers()["content-encoding"] ?? "" });
    });
    await p.goto(URL + path);
    await p.waitForTimeout(3000);
    await ctx.close();
    return seen;
  };
  const wide = await sizes(1440, "");
  const narrow = await sizes(390, "");
  const missing = await sizes(1440, "no-such-page");
  const stills = (list) => list.filter((r) => r.path.endsWith(".avif"));
  const bytes = (list) => stills(list).reduce((s, r) => s + r.bytes, 0);
  const ok =
    bytes(wide) <= 320 * 1024 &&
    stills(wide).some((r) => r.path === "/sky/horizon-1440.avif") &&
    !stills(wide).some((r) => r.path === "/sky/horizon-390.avif") &&
    stills(narrow).some((r) => r.path === "/sky/horizon-390.avif") &&
    !stills(narrow).some((r) => r.path === "/sky/horizon-1440.avif") &&
    stills(missing).length === 0;
  report("test_network", ok, { wide, narrow, missing });
};

for (const [name, fn] of Object.entries(tests)) if (!only.length || only.includes(name)) await fn();
await b.close();
console.log(fail ? `${fail} FAILED` : "ALL PASS");
process.exit(fail ? 1 : 0);
```

Start the server (Global Constraints) and run: `cd $PW && node polish.mjs test_shots`
Expected:
- `test_shots 1440 PASS` and `test_shots 390 PASS`, with no console errors.
- `$PW/polish-{1440,390}-{top,runway,hold,settle,work,contact}.png`, judged by eye against `$SCRATCH/proto/shot-stars-c.png`, `shot-corona4-b.png`, `shot-hz2-c-hold.png` and `shot-hz2-c-rest.png`:
  - stars C with the Milky Way
  - corona B with earthshine, the chromosphere and prominences
  - air C's orbital sunrise
  - the trail's choreography in Work and at Contact, as before

Then run the earlier suite for regressions: `cd $PW && node eclipse.mjs`
Expected: all PASS except `test_css_story`, whose CSS sky Task 12 rebuilds. Note its result and recheck it in Task 13.

- [ ] **Step 10: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build`, and the four-entry shader loop (all pass)

```bash
git add src/components/sky src/lib/eclipse.ts src/lib/eclipse.test.ts
git commit -m "feat(sky): draw the polished sky in linear light"
```

---

### Task 9: Where the CSS sky's stills sit

**Files:**
- Create: `src/lib/stills.ts`
- Test: `src/lib/stills.test.ts`

**Interfaces:**
- Consumes: `RADIUS_PER_WIDTH` (Task 1).
- Produces:
  - `WIDE_FROM = 864`
  - `WIDE = { src, W: 1440, above: 320, below: 64 }`, `NARROW = { src, W: 390, above: 192, below: 40 }`
  - `ECLIPSE = { src, size: 2048, R: 256, inset: "-150%" }`
  - `horizonStill(W): { src; scale; stretch; width; height; apex; ground: { rx; ry } }`
  - `eclipseStill(box: { width }): { src; inset; size }`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/stills.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { eclipseStill, horizonStill } from "./stills";

describe("horizonStill", () => {
  test("picks the 1440 still from 864 px, scaled by W / 1440 with no stretch", () => {
    for (const W of [864, 1440, 2560]) {
      const s = horizonStill(W);
      expect(s.src).toBe("/sky/horizon-1440.avif");
      expect(s.scale).toBeCloseTo(W / 1440, 12);
      expect(s.stretch).toBe(1);
      expect(s.apex).toBeCloseTo(320 * (W / 1440), 9);
      expect(s.ground.rx).toBeCloseTo((25 / 6) * W, 6);
      expect(s.ground.ry).toBeCloseTo((25 / 6) * W, 6);
    }
  });
  test("below 864 it picks the 390 still, stretched across by W / 390 at scale 1", () => {
    for (const W of [320, 390, 863]) {
      const s = horizonStill(W);
      expect(s.src).toBe("/sky/horizon-390.avif");
      expect(s.scale).toBe(1);
      expect(s.stretch).toBeCloseTo(W / 390, 12);
      expect(s.height).toBe(232);
      expect(s.apex).toBe(192);
      expect(s.ground.rx).toBeCloseTo((25 / 6) * W, 6);
      expect(s.ground.ry).toBeCloseTo(1625, 6);
    }
  });
});

describe("eclipseStill", () => {
  test("sits at an inset of −150%, its radius on the box's", () => {
    const s = eclipseStill({ width: 403.2 });
    expect(s.inset).toBe("-150%");
    expect(s.size).toBeCloseTo(4 * 403.2, 9);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `bun test src/lib/stills.test.ts`
Expected: FAIL with `Cannot find module './stills'`.

- [ ] **Step 3: Implement**

Create `src/lib/stills.ts`:

```ts
import { RADIUS_PER_WIDTH } from "./eclipse";

/*
 * Where the CSS sky's stills sit (sky polish spec §7.1, §7.3). Each horizon still is the shader's
 * hold frame: a strip from `above` px over the limb's apex to `below` px under it, at layout width W.
 */

/** From this width every size in the horizon scales with it, so one still scales exactly. */
export const WIDE_FROM = 864;
export const WIDE = { src: "/sky/horizon-1440.avif", W: 1440, above: 320, below: 64 } as const;
export const NARROW = { src: "/sky/horizon-390.avif", W: 390, above: 192, below: 40 } as const;
export const ECLIPSE = { src: "/sky/eclipse.avif", size: 2048, R: 256, inset: "-150%" } as const;

/** The horizon still for a viewport W px wide: its CSS size, the apex's depth in it, and how it scales. */
export function horizonStill(W: number) {
  const still = W >= WIDE_FROM ? WIDE : NARROW;
  // Wide: scaled uniformly. Narrow: stretched across only, since below 864 px the air's heights are pinned.
  const scale = still === WIDE ? W / WIDE.W : 1;
  const stretch = still === WIDE ? 1 : W / NARROW.W;
  return {
    src: still.src,
    scale,
    stretch,
    width: W,
    height: (still.above + still.below) * scale,
    apex: still.above * scale,
    // The CSS ground's ellipse under it, which matches the still's limb.
    ground: { rx: RADIUS_PER_WIDTH * still.W * scale * stretch, ry: RADIUS_PER_WIDTH * still.W * scale },
  };
}

/** The eclipse still, centred on the eclipse box at 4× its width, so its R = 256 is the box's radius. */
export function eclipseStill(box: { width: number }) {
  const scale = (box.width / 2) / ECLIPSE.R;
  return { src: ECLIPSE.src, inset: ECLIPSE.inset, size: ECLIPSE.size * scale };
}
```

- [ ] **Step 4: Run them to see them pass**

Run: `bun test src/lib/stills.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add src/lib/stills.ts src/lib/stills.test.ts
git commit -m "feat(sky): place the CSS sky's stills"
```

---

### Task 10: Render the stills from the shader

**Files:**
- Create: `src/components/sky/stills-source.ts`, `scripts/sky-stills.ts`
- Create (generated): `src/components/sky/stills.json`, `public/sky/eclipse.avif`, `public/sky/horizon-1440.avif`, `public/sky/horizon-390.avif`
- Test: `src/components/sky/sky-stills.test.ts`
- Modify: `package.json` (`sharp` in devDependencies, the `sky:stills` script), `bun.lock`

**Interfaces:**
- Consumes:
  - `endFrame`, `PHI0`, `sunFrame` (`eclipse.ts`)
  - `BG`, `GROUND`, `encode`, `shoulder` (Task 4)
  - `WIDE`, `NARROW` (Task 9)
  - `brightStars` (Task 4)
  - the `stills.wgsl` and `star-check.wgsl` entries (Tasks 5–6)
- Produces:
  - `ROOT`, `STILLS_ENTRY`, `STAR_CHECK_ENTRY`
  - `type Still`, `STILLS`
  - `stillsHash(): Promise<string>`, `screenInverse(col, inside, interior): Rgb`, `INTERIOR`
  - `bun run sky:stills [--check]`
  - `stills.json: { hash, stills: { [file]: { size, bytes } } }`

- [ ] **Step 1: Write the failing tests**

Create `src/components/sky/sky-stills.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { encode, GROUND, type Rgb } from "@/lib/light";

import manifest from "./stills.json";
import { screenInverse, stillsHash } from "./stills-source";

const screen = (u: number, s: number) => 1 - (1 - u) * (1 - s);

describe("the CSS sky's stills", () => {
  test("are rendered from the current shaders and parameters", async () => {
    if ((await stillsHash()) !== manifest.hash) throw new Error("The sky's stills are stale: run `bun run sky:stills`.");
  });
});

describe("screenInverse", () => {
  test("screen-blends back into the live sky's pixel over the page", () => {
    const col: Rgb = [0.2, 0.3, 0.5];
    const s = screenInverse(col, 0, GROUND);
    const under = encode([0.00182, 0.00212, 0.00304]);
    const want = encode(col);
    for (const i of [0, 1, 2]) expect(screen(under[i], s[i])).toBeCloseTo(want[i], 9);
  });
  test("over the ground it takes the ground's colour as what's under it", () => {
    const col: Rgb = [0.0033, 0.0046, 0.0104];
    const s = screenInverse(col, 1, GROUND);
    const under = encode(GROUND);
    for (const i of [0, 1, 2]) expect(screen(under[i], s[i])).toBeCloseTo(encode(col)[i], 9);
  });
  test("is 0 where the live sky is no brighter than what's under it", () => {
    expect(screenInverse([0.00182, 0.00212, 0.00304], 0, GROUND)).toEqual([0, 0, 0]);
  });
});
```

Create a placeholder manifest so the import resolves: `printf '{ "hash": "" }\n' > src/components/sky/stills.json`

- [ ] **Step 2: Run them to see them fail**

Run: `bun test src/components/sky/sky-stills.test.ts`
Expected: FAIL with `Cannot find module './stills-source'`.

- [ ] **Step 3: Implement the source**

Create `src/components/sky/stills-source.ts`:

```ts
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveShader } from "@vgpu/wgsl/runtime";

import { endFrame, PHI0 } from "@/lib/eclipse";
import { BG, encode, GROUND, shoulder, type Rgb } from "@/lib/light";
import { NARROW, WIDE } from "@/lib/stills";

/*
 * What the CSS sky's stills are rendered from (sky polish spec §7.1), shared by the stills script
 * and the staleness test. Node only.
 */

export const ROOT = path.resolve(import.meta.dir, "../../..");
export const STILLS_ENTRY = path.join(ROOT, "src/components/sky/wgsl/stills.wgsl");
export const STAR_CHECK_ENTRY = path.join(ROOT, "src/components/sky/wgsl/star-check.wgsl");
// The script's own encode and shoulder mirror it, so a change there must re-render the stills too.
const LIGHT = path.join(ROOT, "src/components/sky/wgsl/light.wgsl");

export type Still = {
  file: string;
  /** Rendered px, and px per CSS px of the frame it models. */
  size: readonly [number, number];
  dpr: number;
  /** The layout width the frame models. */
  W: number;
  time: number;
  /** C.x, C.y, R, then B.x, B.y, morph and the diamond's strength, in the still's CSS px. */
  body: readonly [number, number, number];
  sun: readonly [number, number, number, number];
  beads: number;
  /** What the CSS puts under the still where the body covers it: the black moon disc, or the ground. */
  interior: "moon" | "ground";
};

function eclipse(): Still {
  const C = 1024;
  const R = 256;
  return {
    file: "eclipse.avif",
    size: [2048, 2048],
    dpr: 1,
    W: 1440,
    // A quarter of the diamond's 5.2 s breath: the pulse at its mean.
    time: 1.3,
    body: [C, C, R],
    sun: [C + R * Math.cos(PHI0), C - R * Math.sin(PHI0), 0, 0],
    // Totality: the beads shut, no diamond (spec §6).
    beads: -2,
    interior: "moon",
  };
}

function horizon(still: typeof WIDE | typeof NARROW): Still {
  // The hold frame with its apex `above` px from the top.
  const e = endFrame(still.W, still.above / 0.64);
  return {
    file: still.src.slice("/sky/".length),
    size: [still.W * 2, (still.above + still.below) * 2],
    dpr: 2,
    W: still.W,
    // A quarter of the sun's 6 s glint: the pulse at its mean.
    time: 1.5,
    body: [e.C[0], e.C[1], e.R],
    sun: [e.B[0], e.B[1], 1, 1],
    beads: 0.12,
    interior: "ground",
  };
}

export const STILLS: readonly Still[] = [eclipse(), horizon(WIDE), horizon(NARROW)];

/** A SHA-256 of the stills' parameters and of every shader file they're rendered from. */
export async function stillsHash() {
  const { deps } = await resolveShader({ entry: STILLS_ENTRY });
  const files = [...new Set([...deps, LIGHT])].map((file) => path.relative(ROOT, file)).sort();
  const hash = createHash("sha256").update(JSON.stringify(STILLS));
  for (const file of files) hash.update(file).update("\0").update(await readFile(path.join(ROOT, file)));
  return hash.digest("hex");
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const unit = (x: number) => Math.min(Math.max(x, 0), 1);

/**
 * A still's pixel for the live sky's linear colour `col`. The CSS composites it with
 * `mix-blend-mode: screen` over its own pixel U (the page, or the disc or ground the body covers
 * `inside` of), and screen(U, S) = 1 − (1 − U)(1 − S), so S = (E − U) / (1 − U) gives back E.
 */
export function screenInverse(col: Rgb, inside: number, interior: Rgb): Rgb {
  const under = encode(mix(BG, interior, inside));
  const want = encode(shoulder(col));
  return [0, 1, 2].map((i) => unit((want[i] - under[i]) / (1 - under[i]))) as unknown as Rgb;
}

export const INTERIOR: Record<Still["interior"], Rgb> = { moon: [0, 0, 0], ground: GROUND };
```

Run: `bun test src/components/sky/sky-stills.test.ts`
Expected: three `screenInverse` tests PASS. The staleness test FAILs with "The sky's stills are stale: run `bun run sky:stills`." That's right: none are rendered yet.

- [ ] **Step 4: Add sharp and the script**

Run: `bun add -d sharp@0.35.5`
Add to `package.json`'s `scripts`: `"sky:stills": "bun scripts/sky-stills.ts"`.

Create `scripts/sky-stills.ts`:

```ts
// Renders the CSS sky's stills from the live sky's own shader (sky polish spec §7.1) and writes
// them to public/sky with a manifest. `--check` re-renders and compares instead, and checks the CSS
// star map against the live stars. Needs the CPU renderer once per machine:
// `bunx vgpu install-software-renderer`.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { resolveShader } from "@vgpu/wgsl/runtime";
import { effect, init, sampler, target } from "vgpu/node";

import { INTERIOR, ROOT, screenInverse, STAR_CHECK_ENTRY, STILLS, STILLS_ENTRY, stillsHash, type Still } from "@/components/sky/stills-source";
import { sunFrame } from "@/lib/eclipse";
import { brightStars } from "@/lib/star-field";

const OUT = path.join(ROOT, "public/sky");
const MANIFEST = path.join(ROOT, "src/components/sky/stills.json");
const BUDGET = 320 * 1024;
const check = process.argv.includes("--check");

// The software adapter renders the same pixels on every machine.
const gpu = await init({ adapter: "software" });
const stillsShader = (await resolveShader({ entry: STILLS_ENTRY })).wgsl;

async function render(still: Still) {
  const [w, h] = still.size;
  const out = target(gpu, { size: still.size, format: "rgba16float" });
  const glare = sunFrame(still.sun[2], still.W);
  const params = {
    resolution: still.size,
    dpr: still.dpr,
    W: still.W,
    time: still.time,
    beads: still.beads,
    body: [...still.body, 1],
    sun: still.sun,
    glare: [glare.core, glare.glare, glare.streakH, glare.streakV],
  };
  effect(gpu, stillsShader, { set: { params } }).draw(out);
  const px = await out.color.readFloats({ mipLevel: 0, region: "all" });
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const s = screenInverse([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]], px[i * 4 + 3], INTERIOR[still.interior]);
    rgb.set([Math.round(s[0] * 255), Math.round(s[1] * 255), Math.round(s[2] * 255)], i * 3);
  }
  return sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).avif({ quality: 60, chromaSubsampling: "4:4:4" }).toBuffer();
}

const decoded = (file: Buffer) => sharp(file).raw().toBuffer();

/** The share of the CSS star map's stars that sit within 1 px of a live star, at 1440 × 900. */
async function starMatch() {
  const [W, H] = [1440, 900];
  const out = target(gpu, { size: [W, H], format: "rgba16float" });
  const unused = target(gpu, { size: [1, 1], format: "rgba16float" });
  const shader = (await resolveShader({ entry: STAR_CHECK_ENTRY })).wgsl;
  effect(gpu, shader, { set: { params: { resolution: [W, H], dpr: 1 }, milky: unused, milkySampler: sampler(gpu, {}) } }).draw(out);
  const px = await out.color.readFloats({ mipLevel: 0, region: "all" });
  const lum = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return 0;
    const i = (y * W + x) * 4;
    return 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
  };
  const stars = brightStars(W, H);
  let near = 0;
  for (const star of stars) {
    // The light's centroid over the 3 × 3 px round the map's star; any wider and a neighbour pulls it.
    let sum = 0;
    let sx = 0;
    let sy = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = Math.floor(star.x) + dx;
        const y = Math.floor(star.y) + dy;
        const l = lum(x, y);
        sum += l;
        sx += l * (x + 0.5);
        sy += l * (y + 0.5);
      }
    }
    if (sum > 0 && Math.hypot(sx / sum - star.x, sy / sum - star.y) <= 1) near++;
  }
  return near / stars.length;
}

const hash = await stillsHash();
const files = new Map<string, Buffer>();
for (const still of STILLS) files.set(still.file, await render(still));
const total = [...files.values()].reduce((sum, file) => sum + file.length, 0);
let ok = total <= BUDGET;
console.log(`stills: ${(total / 1024).toFixed(1)} KB of ${BUDGET / 1024} KB`);

if (check) {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  if (manifest.hash !== hash) {
    ok = false;
    console.log("stale: the shaders or parameters changed since the stills were rendered");
  }
  for (const [file, fresh] of files) {
    const [a, b] = await Promise.all([decoded(fresh), decoded(await readFile(path.join(OUT, file)))]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff += Math.abs(a[i] - b[i]);
    const mean = a.length === b.length ? diff / a.length : Infinity;
    console.log(`${file}: mean difference ${mean.toFixed(3)} / 255`);
    if (mean > 0.5) ok = false;
  }
  const match = await starMatch();
  console.log(`star map: ${(match * 100).toFixed(1)}% within 1 px of a live star`);
  if (match < 0.98) ok = false;
} else {
  for (const [file, buffer] of files) await writeFile(path.join(OUT, file), buffer);
  const stills = Object.fromEntries(STILLS.map((s) => [s.file, { size: s.size, bytes: files.get(s.file)!.length }]));
  await writeFile(MANIFEST, `${JSON.stringify({ hash, stills }, null, 2)}\n`);
}

gpu.dispose();
if (!ok) process.exit(1);
```

- [ ] **Step 5: Render the stills**

Run, once per machine: `bunx vgpu install-software-renderer` (it downloads the portable CPU renderer).
Run: `mkdir -p public/sky && bun run sky:stills`
Expected:
- It prints `stills: N KB of 320 KB` with N near 20.
- It writes `public/sky/{eclipse,horizon-1440,horizon-390}.avif` and `src/components/sky/stills.json`.

- [ ] **Step 6: Check them**

Run: `bun run sky:stills --check`
Expected:
- each still's mean difference is `0.000 / 255`
- `star map: 100.0% within 1 px of a live star`
- exit code 0

Run: `bun test src/components/sky/sky-stills.test.ts`
Expected: PASS, 4 tests.

Then prove the staleness test bites: append a blank line to `src/components/sky/wgsl/air.wgsl`, run `bun test src/components/sky/sky-stills.test.ts` (Expected: FAIL, stale), then `git checkout src/components/sky/wgsl/air.wgsl`.

- [ ] **Step 7: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add package.json bun.lock scripts/sky-stills.ts src/components/sky/stills-source.ts src/components/sky/sky-stills.test.ts src/components/sky/stills.json public/sky
git commit -m "feat(sky): render the CSS sky's stills from the shader"
```

---

### Task 11: The CSS sky's stars

**Files:**
- Create: `src/app/sky/stars.svg/route.ts`
- Modify: `src/components/sky/fallback.tsx` (add `SkyStars`), `src/app/layout.tsx`

**Interfaces:**
- Consumes: `starMapSvg` (Task 4).
- Produces: `GET /sky/stars.svg` (static at build), and `SkyStars()`, a fixed, full-viewport `.sky-fallback` layer.

- [ ] **Step 1: The route**

Create `src/app/sky/stars.svg/route.ts`:

```ts
import { starMapSvg } from "@/lib/star-field";

export const dynamic = "force-static";

/** The CSS sky's star map (sky polish spec §7.2), built from the live sky's own star hash at build time. */
export function GET() {
  return new Response(starMapSvg(2560, 1600), { headers: { "Content-Type": "image/svg+xml" } });
}
```

Run: `bun run build`
Expected: the route table lists `○ /sky/stars.svg` (static).

- [ ] **Step 2: The layer**

Add to `src/components/sky/fallback.tsx`, before `EclipseSky`:

```tsx
/**
 * The CSS sky's stars (sky polish spec §7.2): the live sky's near and bright stars at scroll 0, from
 * the build's star map, anchored at the viewport's top left as the live field is.
 */
export function SkyStars() {
  return (
    <div
      aria-hidden="true"
      className="sky-fallback pointer-events-none fixed inset-0 -z-2 bg-[url(/sky/stars.svg)] bg-no-repeat"
    />
  );
}
```

In `src/app/layout.tsx`, import it with `SkyGrain` (`import { SkyGrain, SkyStars } from "@/components/sky/fallback";`). Render `<SkyStars />` just before `<SkyGrain />`.

- [ ] **Step 3: Look at it**

With the server running: `curl -s http://localhost:3000/sky/stars.svg | head -c 200`
Expected: `<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1600" …><circle cx=…`.

- [ ] **Step 4: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add src/app/sky src/components/sky/fallback.tsx src/app/layout.tsx
git commit -m "feat(sky): draw the CSS sky's stars from the live star hash"
```

---

### Task 12: The CSS sky from the stills

**Files:**
- Modify: `src/components/sky/fallback.tsx` (still-based `EclipseSky`, `HorizonSky`, `ContactSky`; drop the star lists and `HeroStars`)
- Modify: `src/components/hero.tsx` (drop `HeroStars`)
- Modify: `src/app/globals.css` (the diamond's gating, the horizon's sizes, removed keyframes)

**Interfaces:**
- Consumes:
  - `ECLIPSE` (Task 9), `GROUND`, `encode`, `hex` (Task 4)
  - the stills (Task 10)
  - `html[data-sky]` (Task 8)
- Produces: `.css-diamond`, `.horizon-ground`, `.horizon-still`.

- [ ] **Step 1: Rewrite the CSS sky's layers**

Replace `src/components/sky/fallback.tsx` entirely with this. `SkyStars` is unchanged from Task 11, and `SkyGrain` is unchanged:

```tsx
import { encode, GROUND, hex } from "@/lib/light";
import { ECLIPSE } from "@/lib/stills";

// The night ground's base colour, as the stills were inverted against.
const GROUND_FILL = hex(encode(GROUND));

/**
 * The CSS sky's stars (sky polish spec §7.2): the live sky's near and bright stars at scroll 0, from
 * the build's star map, anchored at the viewport's top left as the live field is.
 */
export function SkyStars() {
  return (
    <div
      aria-hidden="true"
      className="sky-fallback pointer-events-none fixed inset-0 -z-2 bg-[url(/sky/stars.svg)] bg-no-repeat"
    />
  );
}

/**
 * Board 09's eclipse at totality (sky polish spec §7.3), filling the eclipse box: a black disc, the
 * shader's still screen-blended over it, and the CSS diamond (spec §6).
 */
export function EclipseSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <div className="absolute inset-0 rounded-full bg-black" />
      <div
        className="absolute bg-size-[100%_100%] mix-blend-screen"
        style={{ inset: ECLIPSE.inset, backgroundImage: `url(${ECLIPSE.src})` }}
      />
      {/* The bead, 135° round the edge. */}
      <div className="css-diamond absolute size-0" style={{ left: "14.64%", top: "14.64%" }}>
        <div className="animate-bead absolute size-0">
          <span
            className="absolute rounded-full"
            style={{ left: -120, top: -120, width: 240, height: 240, background: "radial-gradient(circle closest-side, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.7) 5%, rgba(201,220,255,0.26) 18%, rgba(201,220,255,0.07) 44%, rgba(201,220,255,0) 100%)" }}
          />
          <span
            className="absolute"
            style={{ left: -255, top: -0.5, width: 510, height: 1, background: "linear-gradient(90deg, rgba(214,228,255,0), rgba(240,246,255,0.8), rgba(214,228,255,0))" }}
          />
          <span
            className="absolute"
            style={{ left: -0.5, top: -180, width: 1, height: 360, background: "linear-gradient(rgba(214,228,255,0), rgba(240,246,255,0.65), rgba(214,228,255,0))" }}
          />
          <span
            className="absolute rounded-full bg-white"
            style={{ left: -3, top: -3, width: 6, height: 6, boxShadow: "0 0 14px 5px rgba(255,255,255,0.85), 0 0 44px 14px rgba(201,220,255,0.45)" }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The resting horizon with its apex at `apex` of the box (sky polish spec §7.3): the night ground as
 * an ellipse matching the still's limb, and the shader's hold frame screen-blended over it. Their
 * sizes are in globals.css, which picks the still by width.
 */
function Horizon({ apex }: { apex: string }) {
  return (
    <>
      <div className="horizon-ground absolute left-1/2 -translate-x-1/2 rounded-[50%]" style={{ top: apex, background: GROUND_FILL }} />
      <div className="horizon-still absolute inset-x-0 mix-blend-screen" style={{ top: apex }} />
    </>
  );
}

/** The runway's horizon, its apex at 64%, where the live sky's hold frame puts it. */
export function HorizonSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <Horizon apex="64%" />
    </div>
  );
}

/** Contact's horizon, where the reduced-motion sky rests it: 0.15 × Contact's height above its bottom. */
export function ContactSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <Horizon apex="85%" />
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

In `src/components/hero.tsx`:
- change the import to `import { EclipseSky, HorizonSky } from "@/components/sky/fallback";`
- delete `<HeroStars />`.

- [ ] **Step 2: The CSS**

In `src/app/globals.css`:

1. Delete the `twinkle`, `breathe` and `glint` keyframes and the `animate-twinkle`, `animate-breathe` and `animate-glint` utilities. Keep `bead` and `animate-bead`, which `.full-stop` and the CSS diamond use.
2. In the `prefers-reduced-motion: reduce` block, the list becomes `.animate-bead, .full-stop`.
3. After the `[data-sky="live"] .sky-fallback` rule, add:

```css
/* The CSS diamond (fallback.tsx, sky polish spec §6) plays only on the CSS sky. While the live sky is
   pending it waits, unseen, inside its 1.6 s delay. */
@keyframes diamond-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.css-diamond {
  animation: diamond-in 0.8s ease-out 1.6s both;
}
html:not([data-sky="css"]) .css-diamond {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .css-diamond { animation: none; }
  html:not([data-sky="css"]) .css-diamond { visibility: hidden; }
}

/* The CSS horizon (fallback.tsx), sized from src/lib/stills.ts: keep them in step. Below 864 px the
   390 still stretches across with its heights pinned; from 864 px the 1440 still scales with the
   width. The ground is an ellipse of radii 25/6 × the still's modelled width, matching its limb. Each
   media query loads only its own still. */
.horizon-ground {
  width: 833.3333%;
  height: 3250px;
}
.horizon-still {
  height: 232px;
  translate: 0 -192px;
  background: url("/sky/horizon-390.avif") 0 0 / 100% 100% no-repeat;
}
@media (min-width: 864px) {
  .horizon-ground {
    height: auto;
    aspect-ratio: 1;
  }
  .horizon-still {
    height: auto;
    aspect-ratio: 2880 / 768;
    translate: 0 -83.3333%;
    background-image: url("/sky/horizon-1440.avif");
  }
}
```

- [ ] **Step 3: Look at it**

With the server rebuilt: `cd $PW && node polish.mjs test_css_live test_diamond test_network`
Expected: all PASS.
- If `test_css_live` fails on the limb or the disc, the CSS sizes above disagree with `stills.ts`; fix the CSS, not the stills.
- If it fails on selectors, fix the probe.

Also run `cd $PW && node eclipse.mjs test_css_story`
Expected: PASS: the CSS horizon's sun sits at 0.38 W.

- [ ] **Step 4: Check and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add src/components/sky/fallback.tsx src/components/hero.tsx src/app/globals.css
git commit -m "feat(sky): build the CSS sky from the shader's stills"
```

---

### Task 13: Verify on a production build, and point the earlier spec here

**Files:**
- Modify: `docs/superpowers/specs/2026-10-09-eclipse-to-horizon-design.md` (pointers to this round)
- Possibly modify: whatever a failing check implicates. Each fix gets its own test where one can exist, and its own commit.

- [ ] **Step 1: Production build**

Restart the pane's server as `bun run build && bun run start` (Global Constraints), and wait for `Ready in`.

- [ ] **Step 2: This round's checks**

Run: `cd $PW && node polish.mjs`
Expected: `ALL PASS`:
- `test_shots`, `test_signal`, `test_lift`, `test_css_live` (both widths)
- `test_contrast_pointer` (both widths, live and CSS)
- `test_diamond`, `test_network`

- [ ] **Step 3: The earlier suites**

Run: `cd $PW && node eclipse.mjs && node voyage.mjs`
Expected: all PASS. These cover the camera, the settle, the front layer, idle at rest, the 404 page, device loss, contrast at rest and `test_frames`. `test_frames` is spec §2.7's p95 ≤ 17 ms, no frame over 50 ms and CLS < 0.05.

If `test_frames` fails, apply spec §9's cuts in order, measuring after each. Each cut is its own commit:
1. In `starLayer`, cap `reach` at 2 for the 8 px layer: `let reach = min(i32(ceil(abs(trail) / L.cell)), select(64, 2, L.cell < 10.0));`.
2. In `skyField`, skip the 8 px layer while `abs(f.vel) > 3000.0`.
3. In `src/lib/sky-math.ts`, set `PIXEL_BUDGET = 1.8e6`.

- [ ] **Step 4: Alignment and the stills, once more**

Run: `cp $PROBES/align.ts ./.align.ts && bun ./.align.ts; rm -f ./.align.ts` (Expected: PASS)
Run: `bun run sky:stills --check` (Expected: exit 0)
Run the four-entry shader loop (Expected: four `ok`).

- [ ] **Step 5: Point the eclipse spec here**

In `docs/superpowers/specs/2026-10-09-eclipse-to-horizon-design.md`, add this as the first line under `### 5.3 The body (`sky.wgsl`, replacing the orb)`:

```markdown
> The body's layers were rebuilt in the [sky polish round](2026-10-10-sky-polish-design.md) (§3–§4): its corona, air and lens replace the board ports below.
```

Add this as the first line under `## 7. Fallbacks`:

```markdown
> The CSS sky is now shader-rendered stills and a star map: see the [sky polish round](2026-10-10-sky-polish-design.md) §6–§7.
```

- [ ] **Step 6: Final checks and commit**

Run: `bun run lint && bun run typecheck && bun test && bun run build` (all pass)

```bash
git add docs/superpowers/specs/2026-10-09-eclipse-to-horizon-design.md
git commit -m "docs(sky): point the eclipse spec at the polish round"
```

Close any pane you opened. Then hand the owner the checks only they can make (spec §12):
- Windows Chrome and Firefox: seams
- Safari on macOS and iOS: the stills' blend and the live sky
- by eye: the cursor's light and lean, the corona's lean, the flare, the signal
