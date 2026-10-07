# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as the canvas's single page under one continuous vgpu sky, with GSAP scroll choreography.

**Architecture:**
- **Sky:** one fixed, opaque WebGPU canvas (`src/components/sky/`) draws the whole background in page space. It renders a WGSL port of the concept's WebGL2 shader.
  - It measures section geometry only on layout changes and draws on demand.
  - Without WebGPU, the canvas's own CSS sky shows instead.
- **DOM motion:** GSAP ScrollTrigger with `scrub` (`src/components/motion.tsx`).
- **Pure math:** all scroll and sky math lives in `src/lib/sky-math.ts` and `src/lib/statement.ts`, unit-tested with `bun test`.

**Tech Stack:** Next.js 16.3 (App Router, Turbopack), React 19.3, Tailwind CSS 4, GSAP 3.15 (ScrollTrigger, ScrollToPlugin, `@gsap/react`), vgpu 0.5 with `@vgpu/wgsl`, bun 1.3 (`bun test`), TypeScript 5.9, oxlint.

**Spec:** `docs/superpowers/specs/2026-10-07-portfolio-redesign-design.md`. Read it first; this plan argues from it. The concept canvas is https://claude.ai/artifact/M15sVykKSydrFPDnoGb3eE. Its `Main.dc.html` holds the original GLSL and CSS that the shader and the fallback port line for line.

## Global Constraints

- **Tooling:** bun 1.3.14, Node 24.x, TypeScript 5.9. Don't upgrade TypeScript.
- **Dependencies:** no new runtime dependencies. The one new dev dependency is `@types/bun`.
- **Font:** Geist only, via the existing `geist` package.
- **Git:**
  - Work on branch `feat/redesign`, which already exists.
  - Commits are Conventional Commits with a subject line only: no body, no `Co-Authored-By`.
  - After each commit, say what was committed and to which branch.
  - Never push without the owner's explicit yes to "push to `feat/redesign`?".
- **Code comments:** technical and necessary only. Comment the non-obvious why.
- **Scroll:** only `transform` and `opacity` change on scroll, plus the sky's uniforms. Every scroll effect is scrubbed.
- **Sky geometry:** the sky never reads layout inside a frame.
- **Sky budget:** at most 2.2 M device pixels, at a DPR of 1.25 or less.
- **Shader check:** `bunx vgpu check src/components/sky/sky.wgsl --require-validation` passes.
- **Checks:** `bun run lint`, `bun run typecheck`, `bun test` and `bun run build` pass at the end of every task.
- **Breakpoint:** "mobile" means below `md` (768 px).
- **Copy:** verbatim from spec §3.
- **Servers:**
  - A server runs in a herdr pane on the right, opened with `herdr pane split --current --direction right --ratio 0.4 --no-focus`.
  - Every `herdr … wait` gets a `--timeout`.
  - `wait-output` must match a token that appears only in the program's output.
  - Read panes with `--source visible`.
  - Close the pane when done.

## Review Focus

1. **No WebGPU** (for example Firefox on macOS): the CSS sky shows with the same layout and no console errors. Pinned in Task 4, Step 7 and Task 6, Step 3.
2. **Reduced motion:** no intro, scrub or parallax; every word is at opacity 1 and every hero line is visible. Pinned in Task 5, Step 4.
3. **Old deep links:** `/project/omsimos` lands on `/#omsimos` (permanent redirect). Pinned in Task 2, Step 12.
4. **Resizes:** after the viewport resizes, the horizon still sits at Contact's bottom and the orb at the hero. The sky re-measures, so nothing goes stale. Pinned in Task 4, Step 8.
5. **404 page:** the sky draws with no hero or contact anchors, showing stars and nebula only, with no orb, no horizon and no errors. Pinned in Task 4, Step 8.

---

## Task 0: Dev server

Not a commit. Every later task assumes this pane exists.

- [ ] **Step 1: Open a pane and start the dev server**

```bash
herdr pane split --current --direction right --ratio 0.4 --cwd /Users/hyamero/Documents/Projects/personal/portfolio --no-focus
# note the returned pane_id, e.g. w1:p7
herdr pane run <pane_id> 'bun run dev'
herdr pane wait-output <pane_id> --match "Ready in" --timeout 60000
```

Expected: `Local: http://localhost:3000`.

---

## Task 1: Test harness and pure math

**Files:**
- Modify: `package.json` (add a `test` script and the `@types/bun` dev dependency)
- Modify: `.github/workflows/ci.yml` (add a Test step)
- Create: `src/lib/sky-math.ts`, `src/lib/sky-math.test.ts`
- Create: `src/lib/statement.ts`, `src/lib/statement.test.ts`

**Interfaces:**
- Produces, in `src/lib/sky-math.ts`:
  - `type Rect = { left: number; top: number; width: number; height: number }`, in page-space CSS px
  - `clamp(v, lo = 0, hi = 1)`
  - `ease(a, b, x)`
  - `skyDpr(deviceDpr, width, height)`
  - `departure(scrollY, hero: Rect)`
  - `rise(scrollY, viewportHeight, contact: Rect)`
  - `introProgress(elapsedMs)`
  - `orbFrame(hero, intro, dep)`, returning `{ cx, apex, radius, vis }`
  - `horizonFrame(contact, rise)`, returning `{ cx, top, radius, halfWidth }`
  - `restingLight(hero)`, returning `{ x, y }`
  - `approach(current, target, dt, rate = 3)`
- Produces, in `src/lib/statement.ts`:
  - `type Word = { text: string; emphasis: boolean }`
  - `parseStatement(source): Word[]`
  - `plainStatement(source): string`
  - `wordOpacity(progress, index, count): number`

- [ ] **Step 1: Add the test runner**

```bash
bun add -d @types/bun
```

In `package.json` `scripts`, add `"test": "bun test"` after `"typecheck"`.

In `.github/workflows/ci.yml`, insert this after the `Typecheck` step:

```yaml
      - name: Test
        run: bun test
```

- [ ] **Step 2: Write the failing sky-math tests**

`src/lib/sky-math.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import {
  approach,
  clamp,
  departure,
  ease,
  horizonFrame,
  introProgress,
  orbFrame,
  restingLight,
  rise,
  skyDpr,
  type Rect,
} from "./sky-math";

const hero: Rect = { left: 0, top: 0, width: 1440, height: 960 };
const contact: Rect = { left: 0, top: 3000, width: 1440, height: 820 };

describe("clamp and ease", () => {
  test("clamp bounds to 0..1 by default", () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(clamp(0.3)).toBe(0.3);
    expect(clamp(5, 0.16, 1)).toBe(1);
  });
  test("ease is smoothstep", () => {
    expect(ease(0.2, 0.8, 0.2)).toBe(0);
    expect(ease(0.2, 0.8, 0.5)).toBeCloseTo(0.5);
    expect(ease(0.2, 0.8, 0.9)).toBe(1);
  });
});

describe("skyDpr", () => {
  test("caps at 1.25", () => {
    expect(skyDpr(2, 1440, 900)).toBe(1.25);
  });
  test("keeps big screens within 2.2M device pixels", () => {
    const dpr = skyDpr(2, 3840, 2160);
    expect(3840 * 2160 * dpr * dpr).toBeLessThanOrEqual(2.2e6 + 1);
  });
  test("never upscales a 1x screen", () => {
    expect(skyDpr(1, 390, 844)).toBe(1);
  });
  test("treats a missing ratio as 1", () => {
    expect(skyDpr(0, 390, 844)).toBe(1);
  });
});

describe("departure and rise", () => {
  test("departure runs 0..1 across the hero", () => {
    expect(departure(0, hero)).toBe(0);
    expect(departure(480, hero)).toBe(0.5);
    expect(departure(5000, hero)).toBe(1);
  });
  test("rise starts when Contact's top meets the viewport bottom", () => {
    expect(rise(3000 - 900, 900, contact)).toBe(0);
    expect(rise(3000 - 900 + 410, 900, contact)).toBeCloseTo(0.5);
    expect(rise(9000, 900, contact)).toBe(1);
  });
  test("a missing anchor never divides by zero", () => {
    const none: Rect = { left: 0, top: 0, width: 0, height: 0 };
    expect(Number.isFinite(departure(100, none))).toBe(true);
    expect(Number.isFinite(rise(100, 900, none))).toBe(true);
  });
});

describe("introProgress", () => {
  test("eases out over 2.4 s", () => {
    expect(introProgress(-100)).toBe(0);
    expect(introProgress(1200)).toBeCloseTo(0.875);
    expect(introProgress(2400)).toBe(1);
  });
});

describe("orbFrame", () => {
  test("rests at 68% of the hero once the intro is done", () => {
    const orb = orbFrame(hero, 1, 0);
    expect(orb.cx).toBe(720);
    expect(orb.apex).toBeCloseTo(960 * 0.68);
    expect(orb.radius).toBeCloseTo(Math.max(0.62 * 1440, 0.95 * 960));
    expect(orb.vis).toBe(1);
  });
  test("starts 10% lower and 3% smaller during the intro", () => {
    const orb = orbFrame(hero, 0, 0);
    expect(orb.apex).toBeCloseTo(960 * 0.78);
    expect(orb.radius).toBeCloseTo(0.97 * 912);
    expect(orb.vis).toBe(0);
  });
  test("sinks twice as fast as the page scrolls and is gone by 80% departure", () => {
    const half = orbFrame(hero, 1, 0.5);
    expect(half.apex).toBeCloseTo(960 * 0.68 + 960);
    expect(half.vis).toBeCloseTo(0.5);
    expect(orbFrame(hero, 1, 0.8).vis).toBe(0);
  });
  test("is invisible without a hero", () => {
    expect(orbFrame({ left: 0, top: 0, width: 0, height: 0 }, 1, 0).vis).toBe(0);
  });
});

describe("horizonFrame", () => {
  test("sits 2% above Contact's bottom at rest and 15% when risen", () => {
    expect(horizonFrame(contact, 0).top).toBeCloseTo(3820 - 0.02 * 820);
    expect(horizonFrame(contact, 1).top).toBeCloseTo(3820 - 0.15 * 820);
  });
  test("is a wide arc centered on Contact", () => {
    const h = horizonFrame(contact, 1);
    expect(h.cx).toBe(720);
    expect(h.radius).toBe(Math.max(1440 * 2.2, 2600));
    expect(h.halfWidth).toBeCloseTo(1440 * 0.37);
  });
});

describe("restingLight and approach", () => {
  test("rests above the hero, a little left of center", () => {
    expect(restingLight(hero)).toEqual({ x: 1440 * 0.42, y: -240 });
  });
  test("approach eases by 1 - e^(-rate*dt)", () => {
    expect(approach(0, 10, 1, 3)).toBeCloseTo(10 * (1 - Math.exp(-3)));
    expect(approach(5, 5, 0.1)).toBe(5);
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `bun test src/lib/sky-math.test.ts`
Expected: FAIL. `Cannot find module './sky-math'`.

- [ ] **Step 4: Implement `src/lib/sky-math.ts`**

```ts
/** A rect in page space: CSS pixels from the document's top-left. */
export type Rect = { left: number; top: number; width: number; height: number };

export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));

/** Smoothstep from `a` to `b`. */
export function ease(a: number, b: number, x: number) {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
}

// A pixel budget, not a fixed ratio: the sky covers the whole viewport on every frame.
const PIXEL_BUDGET = 2.2e6;
const MAX_DPR = 1.25;
const INTRO_MS = 2400;

export function skyDpr(deviceDpr: number, width: number, height: number) {
  return Math.min(
    deviceDpr || 1,
    MAX_DPR,
    Math.sqrt(PIXEL_BUDGET / Math.max(width * height, 1)),
  );
}

/** How far the page has scrolled through the hero, 0..1. */
export function departure(scrollY: number, hero: Rect) {
  return clamp((scrollY - hero.top) / Math.max(hero.height, 1));
}

/** How far Contact has come up into the viewport, 0..1. */
export function rise(scrollY: number, viewportHeight: number, contact: Rect) {
  return clamp(
    (viewportHeight - (contact.top - scrollY)) / Math.max(contact.height, 1),
  );
}

/** The orb's page-in, eased out (cubic) over 2.4 s. */
export function introProgress(elapsedMs: number) {
  return 1 - (1 - clamp(elapsedMs / INTRO_MS)) ** 3;
}

/**
 * The hero orb: `apex` is the top of its limb. It rises into place with the intro, then sinks
 * twice as fast as the page scrolls, so the departing copy never sits on the bright limb.
 */
export function orbFrame(hero: Rect, intro: number, dep: number) {
  const { width: W, height: H } = hero;
  return {
    cx: hero.left + W / 2,
    apex: hero.top + H * (0.68 + 0.1 * (1 - intro)) + dep * H * 2,
    radius: Math.max(0.62 * W, 0.95 * H) * (0.97 + 0.03 * intro),
    vis: H > 0 ? intro * (1 - ease(0.2, 0.8, dep)) : 0,
  };
}

/** The closing horizon behind Contact: a wide arc whose top climbs with `rise`. */
export function horizonFrame(contact: Rect, rise: number) {
  return {
    cx: contact.left + contact.width / 2,
    top: contact.top + contact.height - (0.02 + 0.13 * rise) * contact.height,
    radius: Math.max(contact.width * 2.2, 2600),
    halfWidth: contact.width * 0.37,
  };
}

/** Where the light rests without a pointer: above the hero, a little left of center. */
export function restingLight(hero: Rect) {
  return {
    x: hero.left + hero.width * 0.42,
    y: hero.top - hero.height * 0.25,
  };
}

/** Frame-rate independent exponential approach. */
export function approach(current: number, target: number, dt: number, rate = 3) {
  return current + (target - current) * (1 - Math.exp(-dt * rate));
}
```

- [ ] **Step 5: Run the sky-math tests and confirm they pass**

Run: `bun test src/lib/sky-math.test.ts`
Expected: PASS, all tests.

- [ ] **Step 6: Write the failing statement tests**

`src/lib/statement.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { parseStatement, plainStatement, wordOpacity } from "./statement";

const umamin =
  "A social platform for sending and receiving encrypted anonymous messages. Reached almost *3 million users* with more than *17.5 million page visits.*";

describe("parseStatement", () => {
  test("splits into words and marks emphasis", () => {
    const words = parseStatement(umamin);
    expect(words).toHaveLength(22);
    expect(words[0]).toEqual({ text: "A", emphasis: false });
    expect(words.slice(12, 15)).toEqual([
      { text: "3", emphasis: true },
      { text: "million", emphasis: true },
      { text: "users", emphasis: true },
    ]);
    expect(words[21]).toEqual({ text: "visits.", emphasis: true });
  });
  test("keeps punctuation attached to emphasized words", () => {
    const words = parseStatement("An *agent-first* tool into an *interactive diagram,* for");
    expect(words.map((w) => w.text)).toEqual([
      "An", "agent-first", "tool", "into", "an", "interactive", "diagram,", "for",
    ]);
    expect(words.filter((w) => w.emphasis).map((w) => w.text)).toEqual([
      "agent-first", "interactive", "diagram,",
    ]);
  });
});

describe("plainStatement", () => {
  test("drops the emphasis markers", () => {
    expect(plainStatement("An *agent-first* tool")).toBe("An agent-first tool");
  });
});

describe("wordOpacity", () => {
  test("every word starts dim", () => {
    for (let i = 0; i < 22; i++) expect(wordOpacity(0, i, 22)).toBe(0.16);
  });
  test("every word ends fully lit", () => {
    for (let i = 0; i < 22; i++) expect(wordOpacity(1, i, 22)).toBe(1);
  });
  test("words light in reading order", () => {
    expect(wordOpacity(0.3, 0, 22)).toBeGreaterThan(wordOpacity(0.3, 5, 22));
  });
});
```

- [ ] **Step 7: Run it and confirm it fails**

Run: `bun test src/lib/statement.test.ts`
Expected: FAIL. `Cannot find module './statement'`.

- [ ] **Step 8: Implement `src/lib/statement.ts`**

```ts
import { clamp } from "./sky-math";

export type Word = { text: string; emphasis: boolean };

/** Splits a statement into words; `*…*` marks emphasized runs. */
export function parseStatement(source: string): Word[] {
  const words: Word[] = [];
  source.split("*").forEach((run, index) => {
    for (const text of run.split(/\s+/)) {
      if (text) words.push({ text, emphasis: index % 2 === 1 });
    }
  });
  return words;
}

export function plainStatement(source: string) {
  return source.replaceAll("*", "");
}

/**
 * Read-along: each word fades up over a window four words wide, so the light runs through the
 * sentence as it scrolls from 90% to 40% of the viewport. Never below 0.16, so it stays legible.
 */
export function wordOpacity(progress: number, index: number, count: number) {
  return clamp((progress * (count + 6) - index) / 4, 0.16, 1);
}
```

- [ ] **Step 9: Run all tests, then the checks**

Run: `bun test && bun run lint && bun run typecheck`
Expected: all tests PASS, and lint and typecheck exit 0.

- [ ] **Step 10: Commit**

```bash
git add package.json bun.lock .github/workflows/ci.yml src/lib/sky-math.ts src/lib/sky-math.test.ts src/lib/statement.ts src/lib/statement.test.ts
git commit -m "test(lib): add sky and read-along math with bun test"
```

---

## Task 2: Strip the old site and build the static page

At the end of this task the page renders the canvas layout on a flat `#06070a` background. The sky and motion come in later tasks.

**Files:**
- Delete:
  - `src/components/{animations,magicui,sections,shaders,ui}/`
  - `src/components/{navbar,nav-menu,command-menu,transition-loader,back-to-top,hover-brake}.tsx`
  - `src/app/project/`
  - `src/lib/state-store.ts`, `src/lib/stats-themes.json`
  - `src/hooks/`
  - `public/img/`
  - `components.json`
- Rewrite:
  - `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/sitemap.ts`
  - `src/components/icons.tsx`, `src/components/status-page.tsx`
  - `src/lib/projects.ts`, `src/lib/site.ts`, `src/lib/scroll.ts`
- Create:
  - `src/components/site-header.tsx`, `src/components/scroll-link.tsx`
  - `src/components/hero.tsx`, `src/components/work.tsx`, `src/components/contact.tsx`
- Modify: `next.config.ts`, `package.json`

**Interfaces:**
- Consumes: `parseStatement` (Task 1).
- Produces:
  - DOM hooks that Tasks 3–5 rely on:

    | Hook | Element |
    |---|---|
    | `#home[data-sky-anchor="hero"]` | the hero section |
    | `[data-hero-copy]` | the hero's copy column |
    | `[data-rise]` | the h1, lede and link row |
    | `#work` | the work section |
    | `li[data-project]` | each project row, with `[data-hairline]` and `p[data-statement]` holding `span[data-word]`s |
    | `#contact[data-sky-anchor="contact"]` | the contact section |
    | `<html data-sky="css">` | the sky state |

  - `Arrow({ dir: "ne" | "s" | "n", size, strokeWidth?, className? })`
  - `ScrollLink({ to, ...anchorProps })`
  - `Project = { id, name, year, url, statement }`

- [ ] **Step 1: Delete the old site**

```bash
git rm -rq src/components/animations src/components/magicui src/components/sections src/components/shaders src/components/ui \
  src/components/navbar.tsx src/components/nav-menu.tsx src/components/command-menu.tsx src/components/transition-loader.tsx \
  src/components/back-to-top.tsx src/components/hover-brake.tsx src/app/project src/lib/state-store.ts src/lib/stats-themes.json \
  src/hooks public/img components.json
bun remove @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-slot \
  @radix-ui/react-switch cmdk zustand lucide-react class-variance-authority tw-animate-css
```

In `package.json`, delete the `"ui:add"` script.

- [ ] **Step 2: Redirect the old project pages**

In `next.config.ts`, add this entry to the `redirects()` array after the `/resume` one:

```ts
      {
        source: "/project/:title",
        destination: "/#:title",
        permanent: true,
      },
```

- [ ] **Step 3: Replace the data files**

`src/lib/site.ts`:

```ts
export const siteConfig = {
  url: "https://dale.omsimos.com",
  name: "Dale Bañares",
  description:
    "Software engineer and designer based in the Philippines, working mostly with teams across the EU.",
  links: {
    github: "https://github.com/hyamero",
    linkedin: "https://linkedin.com/in/hyamero",
    email: "mailto:daleban.dev@gmail.com",
    resume: "/resume",
  },
};
```

`src/lib/projects.ts`:

```ts
export type Project = {
  /** Section id: the row's anchor, and where /project/<id> redirects. */
  id: string;
  name: string;
  year: number;
  url: string;
  /** `*…*` marks emphasized runs; see parseStatement. */
  statement: string;
};

export const projects: Project[] = [
  {
    id: "umamin",
    name: "Umamin",
    year: 2022,
    url: "https://umamin.link",
    statement:
      "A social platform for sending and receiving encrypted anonymous messages. Reached almost *3 million users* with more than *17.5 million page visits.*",
  },
  {
    id: "omsimos",
    name: "Omsimos",
    year: 2023,
    url: "https://omsimos.com",
    statement:
      "A community-driven, open-source developer collective building *enterprise-level open-source initiatives,* where I do *design and product engineering.*",
  },
  {
    id: "stackmap",
    name: "StackMap",
    year: 2026,
    url: "https://stackmap.omsimos.com",
    statement:
      "An *agent-first* tool that maps systems into an *interactive diagram,* for architecture, dataflow, workflow, lifecycle and sequence.",
  },
];
```

`src/lib/scroll.ts`:

```ts
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

export function scrollToSection(id: string) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return gsap.to(window, {
    duration: reduced ? 0 : 1,
    scrollTo: { y: `#${id}` },
    ease: "power2.out",
  });
}
```

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteConfig.url, changeFrequency: "monthly", priority: 1 }];
}
```

- [ ] **Step 4: Write `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-sky: #06070a;
  --color-ink: #eceef2;
  --color-glow: #c9dcff;
  --color-mute: #a1a6af;
  --color-dim: #7c818b;
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
}

@utility px-gutter {
  padding-inline: clamp(20px, 5.6vw, 80px);
}

@layer base {
  html {
    background: var(--color-sky);
    color-scheme: dark;
  }
  body {
    color: var(--color-ink);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::selection {
    background: rgb(201 220 255 / 0.24);
    color: #fff;
  }
  :focus-visible {
    outline: 1px solid var(--color-glow);
    outline-offset: 4px;
  }
}

@layer components {
  .header-fade {
    background: linear-gradient(#06070a 0%, rgb(6 7 10 / 0.72) 52%, rgb(6 7 10 / 0) 100%);
  }
  .orb-dot {
    background: radial-gradient(circle at 50% 130%, #0c1838 35%, #4b80d4 72%, #c9dcff 100%);
    box-shadow: 0 -1px 7px rgb(201 220 255 / 0.4);
  }
  .hairline {
    background: linear-gradient(90deg, rgb(201 220 255 / 0.42), rgb(201 220 255 / 0.1) 32%, rgb(255 255 255 / 0.07) 62%);
    transform-origin: left center;
  }
  .grid-lines {
    pointer-events: none;
    background-image:
      linear-gradient(rgb(168 184 214 / 0.065) 1px, transparent 1px),
      linear-gradient(90deg, rgb(168 184 214 / 0.065) 1px, transparent 1px);
    background-size: 64px 64px;
  }

  /* Underlined text link: the rule brightens and the arrow nudges toward where it goes. */
  .line-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    transition: color 0.3s ease;
  }
  .line-link::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    bottom: 9px;
    height: 1px;
    background: currentColor;
    opacity: 0.22;
    transition: opacity 0.35s ease;
  }
  .line-link svg {
    flex: none;
    transition: transform 0.5s var(--ease-out-quint);
  }

  /* Round "Visit" button beside each project name. */
  .visit {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgb(201 220 255 / 0.2);
    color: var(--color-glow);
    transition:
      border-color 0.3s ease,
      background-color 0.3s ease,
      color 0.3s ease;
  }
  .visit svg {
    transition: transform 0.5s var(--ease-out-quint);
  }

  /* "Send a signal.": an underline draws out from the left. */
  .say {
    position: relative;
    display: inline-block;
    transition: color 0.3s ease;
  }
  .say::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    bottom: 0.06em;
    height: 1px;
    background: currentColor;
    opacity: 0;
    transform: scaleX(0.4);
    transform-origin: left center;
    transition:
      opacity 0.4s ease,
      transform 0.7s var(--ease-out-quint);
  }
}

/* Hover only where a real pointer can hover; keyboard focus gets the same states. */
@media (hover: hover) {
  .line-link:hover::after { opacity: 0.85; }
  .line-link:hover svg[data-dir="ne"] { transform: translate(2px, -2px); }
  .line-link:hover svg[data-dir="s"] { transform: translateY(3px); }
  .line-link:hover svg[data-dir="n"] { transform: translateY(-3px); }
  .visit:hover { color: #fff; border-color: rgb(201 220 255 / 0.55); background-color: rgb(201 220 255 / 0.07); }
  .visit:hover svg { transform: translate(2px, -2px); }
  .say:hover { color: var(--color-glow); }
  .say:hover::after { opacity: 0.5; transform: scaleX(1); }
}
.line-link:focus-visible::after { opacity: 0.85; }
.line-link:focus-visible svg[data-dir="ne"] { transform: translate(2px, -2px); }
.line-link:focus-visible svg[data-dir="s"] { transform: translateY(3px); }
.line-link:focus-visible svg[data-dir="n"] { transform: translateY(-3px); }
.visit:focus-visible { color: #fff; border-color: rgb(201 220 255 / 0.55); background-color: rgb(201 220 255 / 0.07); }
.visit:focus-visible svg { transform: translate(2px, -2px); }
.say:focus-visible { color: var(--color-glow); }
.say:focus-visible::after { opacity: 0.5; transform: scaleX(1); }

/* The page-in fades these up (motion.tsx); hidden first so they never flash in. */
@media (prefers-reduced-motion: no-preference) {
  [data-rise] { opacity: 0; }
}
```

- [ ] **Step 5: Write the icons and the scroll link**

`src/components/icons.tsx`:

```tsx
const PATHS = {
  ne: ["M7 7h10v10", "M7 17 17 7"],
  s: ["M12 5v14", "m19 12-7 7-7-7"],
  n: ["m5 12 7-7 7 7", "M12 19V5"],
} as const;

type ArrowProps = {
  /** Also styles the hover nudge (see .line-link in globals.css). */
  dir: keyof typeof PATHS;
  size: number;
  strokeWidth?: number;
  className?: string;
};

export function Arrow({ dir, size, strokeWidth = 1.25, className }: ArrowProps) {
  return (
    <svg
      data-dir={dir}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[dir].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
```

`src/components/scroll-link.tsx`:

```tsx
"use client";

import Link from "next/link";

import { scrollToSection } from "@/lib/scroll";

type ScrollLinkProps = { to: string } & Omit<
  React.ComponentProps<"a">,
  "href"
>;

/** An in-page link that glides to its section; from another page it navigates to /#<to>. */
export default function ScrollLink({ to, onClick, ...props }: ScrollLinkProps) {
  return (
    <Link
      href={to === "home" ? "/" : `/#${to}`}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
        if (event.defaultPrevented || modified || !document.getElementById(to)) return;
        event.preventDefault();
        scrollToSection(to);
        history.replaceState(null, "", to === "home" ? "/" : `#${to}`);
      }}
    />
  );
}
```

- [ ] **Step 6: Write the header**

`src/components/site-header.tsx`:

```tsx
import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { siteConfig } from "@/lib/site";

const NAV_LINK = "inline-flex min-h-11 items-center transition-colors duration-300 hover:text-white";

export default function SiteHeader() {
  return (
    <header className="header-fade pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="px-gutter mx-auto flex max-w-[1440px] items-center justify-between gap-3 py-3.5 md:gap-6 md:pt-[18px] md:pb-[30px]">
        <ScrollLink
          to="home"
          className="pointer-events-auto inline-flex min-h-11 items-center gap-2.5 text-[15px] font-medium tracking-[0.04em] md:gap-3 md:text-base"
        >
          <span aria-hidden="true" className="orb-dot size-[13px] rounded-full" />
          hyamero
        </ScrollLink>
        <nav
          aria-label="Primary"
          className="pointer-events-auto flex items-center gap-[18px] text-[13px] tracking-[0.06em] text-mute md:gap-[clamp(18px,3vw,40px)] md:text-sm"
        >
          <ScrollLink to="work" className={NAV_LINK}>
            Work
          </ScrollLink>
          <ScrollLink to="contact" className={NAV_LINK}>
            Contact
          </ScrollLink>
          <a
            href={siteConfig.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            className={`${NAV_LINK} gap-1.5`}
          >
            Résumé <Arrow dir="ne" size={13} strokeWidth={1.5} />
          </a>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Write the hero**

`src/components/hero.tsx`:

```tsx
import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { siteConfig } from "@/lib/site";

export default function Hero() {
  return (
    <section
      id="home"
      data-sky-anchor="hero"
      className="relative min-h-[880px] overflow-hidden md:min-h-[960px]"
    >
      <div
        aria-hidden="true"
        className="grid-lines absolute inset-0 z-0 bg-position-[calc(50%+32px)_0] mask-[radial-gradient(ellipse_58%_60%_at_50%_72%,#000_0%,rgb(0_0_0/0.5)_46%,transparent_78%)]"
      />
      <div
        data-hero-copy
        className="px-gutter relative z-1 mx-auto flex max-w-[1440px] flex-col items-center pt-[132px] text-center md:pt-[200px]"
      >
        <h1
          data-rise
          className="text-[clamp(2.75rem,6.1vw,5.5rem)] leading-[1.04] font-normal tracking-[0.01em] text-balance"
        >
          Software engineer <span className="block text-glow">and designer.</span>
        </h1>
        <p
          data-rise
          className="mt-6 max-w-[34em] text-base leading-[1.6] tracking-[0.015em] text-balance text-mute md:mt-[30px] md:text-[clamp(1rem,1.3vw,1.1875rem)]"
        >
          I’m Dale Bañares, based in the Philippines and working mostly with teams across the EU.
        </p>
        <nav
          data-rise
          aria-label="Start here"
          className="mt-[26px] flex flex-wrap justify-center gap-x-8 gap-y-1 text-[15px] font-medium tracking-[0.04em] md:mt-[34px] md:gap-x-10 md:gap-y-2"
        >
          <ScrollLink to="work" className="line-link">
            Selected work <Arrow dir="s" size={16} />
          </ScrollLink>
          <a
            className="line-link"
            href={siteConfig.links.resume}
            target="_blank"
            rel="noopener noreferrer"
          >
            Résumé <Arrow dir="ne" size={15} />
          </a>
        </nav>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Write the work list**

`src/components/work.tsx`:

```tsx
import { Fragment } from "react";

import { Arrow } from "@/components/icons";
import { projects } from "@/lib/projects";
import { parseStatement } from "@/lib/statement";

export default function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className="relative z-1 px-6 pt-24 pb-[72px] md:px-0 md:pt-[120px] md:pb-24"
    >
      <div className="mx-auto max-w-[1440px] md:px-gutter">
        <h2
          id="work-title"
          className="pb-[26px] text-sm font-normal tracking-[0.08em] text-mute md:text-[15px]"
        >
          Selected work
        </h2>
        <ol className="border-b border-white/7">
          {projects.map((project) => (
            <li
              key={project.id}
              id={project.id}
              data-project
              className="relative flex flex-wrap gap-x-12 gap-y-7 pt-10 pb-12 md:gap-y-9 md:pt-14 md:pb-[72px]"
            >
              <div aria-hidden="true" data-hairline className="hairline absolute inset-x-0 top-0 h-px" />
              <div className="flex flex-[1_1_340px] flex-col items-start gap-5">
                <span className="text-[13px] tracking-[0.06em] text-dim tabular-nums">
                  {project.year}
                </span>
                <div className="mt-2 flex items-center gap-[18px]">
                  <h3 className="text-[clamp(2.5rem,4.4vw,4rem)] leading-none font-normal tracking-[0.01em]">
                    {project.name}
                  </h3>
                  <a
                    className="visit"
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${project.name}`}
                  >
                    <Arrow dir="ne" size={16} />
                  </a>
                </div>
              </div>
              <p
                data-statement
                className="min-w-0 flex-[1.7_1_520px] text-[clamp(1.375rem,2.2vw,2rem)] leading-[1.4] tracking-[0.008em] text-pretty text-dim"
              >
                {parseStatement(project.statement).map((word, i) => (
                  <Fragment key={i}>
                    {i > 0 && " "}
                    <span data-word className={word.emphasis ? "font-medium text-ink" : undefined}>
                      {word.text}
                    </span>
                  </Fragment>
                ))}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

On phones the statement's 520 px basis can't fit beside the 340 px column, so the row wraps. That gives the mobile artboard's stacked layout without a breakpoint.

- [ ] **Step 9: Write Contact and the footer**

`src/components/contact.tsx`:

```tsx
import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { siteConfig } from "@/lib/site";

const YEAR = new Date().getFullYear();

const LINKS = [
  { label: "Email", href: siteConfig.links.email, external: false },
  { label: "GitHub", href: siteConfig.links.github, external: true },
  { label: "LinkedIn", href: siteConfig.links.linkedin, external: true },
  { label: "Résumé", href: siteConfig.links.resume, external: true },
];

export default function Contact() {
  return (
    <section
      id="contact"
      data-sky-anchor="contact"
      aria-labelledby="contact-title"
      className="relative flex min-h-[640px] flex-[1_0_auto] flex-col overflow-hidden md:min-h-[820px]"
    >
      <div
        aria-hidden="true"
        className="grid-lines absolute inset-0 z-0 bg-position-[calc(50%+32px)_100%] mask-[radial-gradient(ellipse_56%_78%_at_50%_100%,#000_0%,rgb(0_0_0/0.45)_45%,transparent_76%)]"
      />
      <div className="px-gutter relative z-1 mx-auto flex w-full max-w-[1440px] flex-[1_0_auto] flex-col items-center pt-[150px] pb-40 text-center md:pt-[196px]">
        <h2
          id="contact-title"
          className="text-sm font-normal tracking-[0.08em] text-mute md:text-[15px]"
        >
          Contact
        </h2>
        <a
          className="say mt-5 text-[clamp(2.75rem,6.4vw,5.75rem)] leading-[1.1] tracking-[0.01em] md:mt-[26px]"
          href={siteConfig.links.email}
        >
          Send a signal.
        </a>
        <ul className="mt-[30px] flex flex-wrap justify-center gap-x-6 text-sm tracking-[0.04em] text-mute md:mt-11 md:gap-x-9 md:gap-y-1 md:text-[15px]">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                className="line-link"
                href={link.href}
                {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
              >
                {link.label} <Arrow dir="ne" size={13} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <footer className="px-gutter relative z-1 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-2.5 text-[13px] tracking-[0.04em] text-mute md:pb-3.5 md:text-sm">
        <p>© {YEAR} Dale Bañares</p>
        <ScrollLink to="home" className="line-link">
          Back to top <Arrow dir="n" size={14} />
        </ScrollLink>
      </footer>
    </section>
  );
}
```

The CTA's minimum is 2.75rem (44 px), not the spec's 2.5rem, to match the 44 px on the mobile artboard.

- [ ] **Step 10: Write the layout, the page and the status page**

`src/app/layout.tsx` keeps the existing `metadata` export unchanged and replaces the imports and the component:

```tsx
import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import SiteHeader from "@/components/site-header";
import { siteConfig } from "@/lib/site";

// export const metadata: Metadata = { … } — unchanged from before

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-sky="css" className={GeistSans.variable}>
      <body className="flex min-h-svh flex-col overflow-x-clip font-sans">
        {/* Without scripts nothing would fade the page-in up. */}
        <noscript>
          <style>{"[data-rise]{opacity:1!important}"}</style>
        </noscript>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
import Contact from "@/components/contact";
import Hero from "@/components/hero";
import Work from "@/components/work";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <Work />
      <Contact />
    </main>
  );
}
```

`src/components/status-page.tsx`:

```tsx
import Link from "next/link";

import { Arrow } from "@/components/icons";

export function StatusPage({ title }: { title: string }) {
  return (
    <main className="px-gutter flex min-h-svh flex-1 flex-col items-center justify-center gap-8 text-center">
      <h1 className="text-[clamp(2.5rem,6.4vw,5.75rem)] leading-[1.1] tracking-[0.01em] text-balance">
        {title}
      </h1>
      <Link href="/" className="line-link text-[15px] tracking-[0.04em] text-mute">
        Return home <Arrow dir="ne" size={13} />
      </Link>
    </main>
  );
}
```

`error.tsx` and `not-found.tsx` stay as they are; they already render `StatusPage`.

- [ ] **Step 11: Run the checks**

Run: `bun run lint && bun run typecheck && bun test && bun run build`
Expected: all exit 0. The build lists `/`, `/_not-found`, `/robots.txt`, `/sitemap.xml` and the image routes. There is no `/project/[title]`.

Then check that nothing still imports a removed module:

```bash
grep -rnE "lucide|zustand|cmdk|@radix|class-variance|state-store|magicui|sections/|shaders/" src
```

Expected: no output.

- [ ] **Step 12: Verify the redirects (Review Focus 3)**

With the dev server from Task 0:

```bash
curl -sI http://localhost:3000/project/omsimos | grep -iE "^(HTTP|location)"
```

Expected: `HTTP/1.1 308 Permanent Redirect` and `location: /#omsimos`.

If Next encodes the hash as `%23`, drop the redirect and add `src/app/project/[title]/page.tsx` that calls `permanentRedirect(\`/#${title}\`)` from `next/navigation`, then re-run the curl.

- [ ] **Step 13: Look at it**

Open http://localhost:3000 at 1440 px wide and at 390 px. Compare the text layout with `Main.dc.html` and `Mobile.dc.html`.

Expected:
- The same copy, sizes and spacing on a flat `#06070a` background.
- The hero text is invisible until Task 5. That's the `[data-rise]` rule; with reduced motion emulated, it shows.
- Hover states work on the links, the round Visit buttons and "Send a signal.".

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: rebuild the page as the one-sky layout"
```

---

## Task 3: CSS sky fallback

This is the sky as the canvas draws it in CSS. It shows until the vgpu sky is live, and it stays when WebGPU is missing.

**Files:**
- Create: `src/components/sky/fallback.tsx`
- Modify: `src/app/globals.css` (add the keyframes and the live rule)
- Modify: `src/components/hero.tsx`, `src/components/contact.tsx` (render the layers)
- Modify: `src/app/layout.tsx` (add the page grain)

**Interfaces:**
- Produces: `HeroSky()`, `ContactSky()` and `SkyGrain()`, all server components with no props. Each root carries `className="sky-fallback …"`.

- [ ] **Step 1: Add the fallback CSS**

Append to `src/app/globals.css`:

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.95; }
}
@keyframes flare {
  0%, 100% { opacity: 0.55; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}
@utility animate-twinkle {
  animation: twinkle 3.6s ease-in-out infinite;
}
@utility animate-flare {
  animation: flare 4.8s ease-in-out infinite;
}

/* The vgpu sky paints over all of this once it's live (see sky.tsx). */
[data-sky="live"] .sky-fallback {
  visibility: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .animate-twinkle,
  .animate-flare {
    animation: none;
  }
}
```

- [ ] **Step 2: Write `src/components/sky/fallback.tsx`**

These are ported verbatim from `Main.dc.html`, lines 93–123 for the hero and 189–200 for contact.

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

const FLARE = (core: number, glow: number, fade: number, alpha: number) =>
  `radial-gradient(circle, rgba(236,243,255,0.95) 0 ${core}px, rgba(201,220,255,0.32) ${glow}px, rgba(201,220,255,0) ${fade}px), ` +
  `linear-gradient(90deg, rgba(214,228,255,0), rgba(214,228,255,${alpha}), rgba(214,228,255,0)) center / 100% 1px no-repeat, ` +
  `linear-gradient(rgba(214,228,255,0), rgba(214,228,255,${alpha}), rgba(214,228,255,0)) center / 1px 100% no-repeat`;

const ORB = "max(124%, 1824px)";

export function HeroSky() {
  return (
    <div
      aria-hidden="true"
      className="sky-fallback pointer-events-none absolute inset-0 -z-2 overflow-hidden"
      style={mask("linear-gradient(#000 82%, transparent 100%)")}
    >
      <div
        className="absolute rounded-full"
        style={{ left: "50%", top: "68%", width: 1640, height: 820, margin: "-560px 0 0 -820px", background: "radial-gradient(closest-side, rgba(58,88,170,0.2), rgba(58,88,170,0.07) 55%, rgba(58,88,170,0) 100%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: "2%", top: "16%", width: 640, height: 300, transform: "rotate(-14deg)", background: "radial-gradient(closest-side, rgba(88,66,156,0.13), rgba(88,66,156,0) 100%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ right: "1%", top: "24%", width: 580, height: 280, transform: "rotate(12deg)", background: "radial-gradient(closest-side, rgba(50,106,128,0.12), rgba(50,106,128,0) 100%)" }}
      />
      <Stars stars={HERO_STARS} />
      <div
        className="absolute inset-0"
        style={mask("linear-gradient(90deg, #000 0%, #000 14%, transparent 23%, transparent 77%, #000 86%, #000 100%)")}
      >
        <div
          className="absolute aspect-square -translate-x-1/2 rounded-full"
          style={{ left: "50%", top: "calc(68% - 110px)", width: `calc(${ORB} + 220px)`, border: "1px solid rgba(201,220,255,0.08)", ...mask("linear-gradient(#000 0%, #000 8%, transparent 22%)") }}
        />
        <div
          className="absolute aspect-square -translate-x-1/2 rounded-full"
          style={{ left: "50%", top: "calc(68% - 310px)", width: `calc(${ORB} + 620px)`, border: "1px solid rgba(201,220,255,0.06)", ...mask("linear-gradient(#000 0%, #000 10%, transparent 26%)") }}
        />
      </div>
      <span
        className="animate-flare absolute"
        style={{ left: "calc(50% + 639px)", top: "calc(68% - 130px)", width: 30, height: 30, margin: "-15px 0 0 -15px", background: FLARE(1.4, 2.8, 7, 0.85) }}
      />
      <span
        className="animate-flare absolute"
        style={{ left: "calc(50% - 594px)", top: "calc(68% + 80px)", width: 22, height: 22, margin: "-11px 0 0 -11px", animationDelay: "-2.2s", background: FLARE(1.1, 2.4, 6, 0.75) }}
      />
      <div
        className="absolute aspect-square -translate-x-1/2 rounded-full"
        style={{ left: "50%", top: "calc(68% - 150px)", width: `calc(${ORB} + 300px)`, background: "radial-gradient(circle closest-side, rgba(84,106,124,0) 85.6%, rgba(92,116,138,0.38) 85.9%, rgba(84,106,124,0.13) 91%, rgba(84,106,124,0) 100%)", ...mask("linear-gradient(#000 0%, #000 12%, transparent 34%)") }}
      />
      <div
        className="absolute aspect-square -translate-x-1/2 rounded-full"
        style={{ left: "50%", top: "68%", width: ORB, background: "linear-gradient(90deg, rgba(4,5,11,0.35), rgba(4,5,11,0) 30%, rgba(4,5,11,0) 62%, rgba(4,5,11,0.45)), radial-gradient(circle closest-side, #04050b 0%, #04050b 60%, #070c26 72%, #10204a 81%, #284c8c 89.5%, #5287d6 95.5%, #86b6f4 98.6%, #b8d5fd 100%)" }}
      />
      <div
        className="absolute aspect-square -translate-x-1/2 rounded-full"
        style={{ left: "50%", top: "calc(68% - 20px)", width: `calc(${ORB} + 40px)`, background: "radial-gradient(circle closest-side, rgba(201,220,255,0) 96.7%, rgba(201,220,255,0.35) 97.45%, rgba(220,234,255,0.95) 97.85%, rgba(201,220,255,0.3) 98.3%, rgba(201,220,255,0) 99.3%)" }}
      />
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

- [ ] **Step 3: Render the layers**

- `hero.tsx`: import `{ HeroSky }` from `@/components/sky/fallback` and render `<HeroSky />` as the section's first child.
- `contact.tsx`: import `{ ContactSky }` and render `<ContactSky />` as the section's first child.
- `layout.tsx`: import `{ SkyGrain }` and render `<SkyGrain />` right after `<noscript>`.

The layers sit at `z-index: -2` with no stacking context between them and the root. That keeps them under the fixed `-z-1` canvas from Task 4, and above `html`'s background.

- [ ] **Step 4: Run the checks**

Run: `bun run lint && bun run typecheck && bun test && bun run build`
Expected: all exit 0.

- [ ] **Step 5: Look at it**

Reload http://localhost:3000 at 1440 px, then compare with `Story-1-Rise` and `Story-4-Horizon`.

Expected:
- The blue CSS orb with its limb, two orbit hairlines on the shoulders, two flares and twinkling stars.
- The Contact horizon disc glowing at the bottom.
- Faint grain over everything.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(sky): add the css sky as the no-webgpu fallback"
```

---

## Task 4: vgpu sky

**Files:**
- Create: `src/components/sky/sky.wgsl`, `src/components/sky/renderer.ts`, `src/components/sky/sky.tsx`
- Modify: `src/app/layout.tsx` (render `<Sky />`)

**Interfaces:**
- Consumes:
  - From Task 1: `skyDpr`, `departure`, `rise`, `introProgress`, `orbFrame`, `horizonFrame`, `restingLight` and `approach`.
  - From Task 2: the `data-sky-anchor` hooks and `html[data-sky]`.
  - From `@/lib/gpu`: `getGpu()` and `prefersReducedMotion()`.
- Produces:
  - `mountSky(canvas, { onFirstFrame, onFallback }): { measure(): void; dispose(): void }`
  - The default export `Sky()`.

- [ ] **Step 1: Write the shader**

`src/components/sky/sky.wgsl`, ported line for line from `fragmentSource()` in `Main.dc.html`:

```wgsl
// The page's one sky, drawn behind everything in page space: nebula, the hero orb with its orbital
// paths, stars, the closing horizon and grain. Lengths are CSS pixels; y grows down the page.
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
  // Hero orb: center x, apex y (top of the limb), radius, visibility.
  orb: vec4f,
  // Contact horizon: center x, top y, radius, rise.
  foot: vec4f,
  footWidth: f32,
  heroHeight: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

const GLOW = 1.0;
const NEBULA = 1.0;
const GRAIN = 1.0;

fn hash21(q: vec2f) -> f32 {
  var p = fract(q * vec2f(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
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

fn flare(d: vec2f, t: f32, phase: f32) -> f32 {
  let tw = 0.7 + 0.3 * sin(t * 1.3 + phase);
  let ax = abs(d.x);
  let ay = abs(d.y);
  let spikes = exp(-ay / 0.8) * exp(-ax / 13.0) + exp(-ax / 0.8) * exp(-ay / 13.0);
  let core = exp(-length(d) / 2.0);
  return (spikes * 0.55 + core * 0.9) * tw;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let frag = uv * params.resolution;
  let css = frag / params.dpr;
  let page = css + vec2f(0.0, params.scroll);
  let W = params.resolution.x / params.dpr;
  let H = max(params.heroHeight, 1.0);
  let t = params.time;
  let bg = vec3f(0.024, 0.027, 0.039);
  var col = bg;
  var occ = 1.0;

  let C = vec2f(params.orb.x, params.orb.y + params.orb.z);
  let R = max(params.orb.z, 1.0);
  let vis = params.orb.w;
  let rel = page - C;
  let dist = length(rel);
  let dOrb = dist - R;

  let fc = vec2f(params.foot.x, params.foot.y + params.foot.z);
  let dFoot = length(page - fc) - params.foot.z;
  let rise = params.foot.w;

  // Nebula: domain-warped fbm that drifts on its own and lags the scroll (it moves at 45%),
  // gathering around the orb, along the page margins and above the horizon.
  var side = smoothstep(0.26, 0.5, abs(css.x - W * 0.5) / W);
  side *= 0.3 + 0.7 * noise(vec2f(page.y * 0.0012, step(W * 0.5, css.x) * 5.0));
  var env = vis * exp(-max(dOrb, 0.0) / (R * 0.5)) * step(-60.0, dOrb)
          + side * 0.55
          + rise * exp(-max(dFoot, 0.0) / 300.0) * step(-40.0, dFoot) * 0.9;
  env *= NEBULA;
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

  // The orb: a lit limb, a flowing atmosphere band and a dark body that occludes the sky.
  if (vis > 0.001 && dOrb < R * 1.2) {
    let v = vis * (1.0 - smoothstep(-0.02 * H, 0.34 * H, rel.y));
    let d = dOrb / R;
    let outward = rel / max(dist, 0.0001);
    let facing = dot(outward, normalize(params.light - C)) * 0.5 + 0.5;
    let spin = t * 0.01;
    let around = vec2f(
      outward.x * cos(spin) - outward.y * sin(spin),
      outward.x * sin(spin) + outward.y * cos(spin),
    );
    var flow = 0.5;
    if (abs(d) < 0.8) {
      flow = fbm(around * 4.0 + vec2f(0.0, d * 7.0 - t * 0.06));
    }
    let inside = 1.0 - smoothstep(-0.0025, 0.0025, d);
    let halo = exp(-max(d, 0.0) * 6.0) * (0.3 + 0.7 * facing) * (0.75 + 0.5 * flow);
    let depth = max(-d, 0.0);
    let band = mix(vec3f(0.02, 0.04, 0.14), vec3f(0.47, 0.7, 0.96), 1.0 - smoothstep(0.012, 0.28, depth));
    let bandFade = 1.0 - 0.92 * smoothstep(0.18, 0.6, depth);
    let atmos = band * bandFade * (0.45 + 0.55 * facing) * (0.8 + 0.4 * flow) * 0.85 * (0.6 + 0.4 * GLOW);
    let body = max(atmos, vec3f(0.01, 0.012, 0.03));
    let outside = col + vec3f(0.3, 0.38, 0.43) * halo * 0.6 * GLOW;
    var planet = mix(outside, body, inside);
    planet += vec3f(0.78, 0.87, 1.0) * exp(-abs(dOrb) / 5.5) * (0.35 + 0.65 * facing) * 0.85 * GLOW;
    col = mix(col, planet, v);
    occ *= mix(1.0, smoothstep(0.02, 0.3, d), v);

    // Orbital paths: two hairlines on the orb's shoulders, clear of the headline, and two flares.
    let lw = max(0.7, 0.8 / params.dpr);
    let r1 = R + 110.0;
    let r2 = R + 310.0;
    let shoulder = smoothstep(0.27, 0.36, abs(page.x - C.x) / W) * (1.0 - smoothstep(-0.3, 0.0, outward.y));
    let rings = exp(-abs(dist - r1) / lw) * 0.085 + exp(-abs(dist - r2) / lw) * 0.065;
    col += vec3f(0.79, 0.86, 1.0) * rings * shoulder * vis;
    let f1 = C + vec2f(sin(0.55), -cos(0.55)) * r2;
    let f2 = C + vec2f(sin(-0.62), -cos(-0.62)) * r1;
    col += vec3f(0.86, 0.92, 1.0) * (flare(page - f1, t, 0.0) + flare(page - f2, t, 2.2) * 0.75) * vis;
  }

  // The closing horizon: the orb again, low and wide, its lit arc leaning toward the pointer.
  if (rise > 0.001 && dFoot < 560.0 && dFoot > -400.0) {
    let hw = max(params.footWidth, 1.0);
    let a = (page.x - mix(params.foot.x, params.light.x, params.hover)) / (hw * 0.95);
    let b = (page.x - params.foot.x) / (hw * 1.3);
    let facing = (0.3 + 0.7 * exp(-a * a)) * exp(-b * b);
    let flow = noise(vec2f(page.x * 0.0045 - t * 0.08, dFoot * 0.02));
    let above = step(0.0, dFoot);
    let rim = exp(-abs(dFoot) / 6.4);
    let atmo = exp(-max(dFoot, 0.0) / 64.0) * above * (0.75 + 0.5 * flow);
    let inner = exp(min(dFoot, 0.0) / 41.0) * (1.0 - above);
    let ground = (1.0 - above) * (1.0 - smoothstep(-24.0, 0.0, dFoot)) * rise;
    col = mix(col, bg * 0.8, ground);
    let h = vec3f(0.78, 0.87, 1.0) * rim * 0.95 + vec3f(0.3, 0.42, 0.62) * (atmo * 0.55 + inner * 0.32);
    col += h * facing * rise * GLOW;
    occ *= mix(1.0, smoothstep(0.0, 14.0, dFoot), rise);
  }

  let sp = vec2f(css.x, css.y + params.scroll * 0.85);
  let par = (params.pointer - 0.5) * 8.0 * params.hover;
  let st = stars((sp + par) / 11.0, t, 0.986, 0.09) * 0.55
         + stars((sp + par * 1.8) / 37.0 + 17.0, t * 0.7, 0.975, 0.055) * 0.85;
  col += vec3f(st * occ);

  let lum = dot(col, vec3f(0.2126, 0.7152, 0.0722));
  let g = hash21(floor(frag) * 0.7311 + 13.17) - 0.5;
  col += g * GRAIN * (0.02 + 0.07 * lum);
  col += (hash21(frag + fract(t) * 91.0) - 0.5) / 255.0;
  return vec4f(max(col, vec3f(0.0)), 1.0);
}
```

- [ ] **Step 2: Validate the shader**

Run: `bunx vgpu check src/components/sky/sky.wgsl --require-validation`
Expected: exit 0, with no errors. If a name collides with a WGSL reserved word, rename the local and re-run.

- [ ] **Step 3: Write the renderer**

`src/components/sky/renderer.ts`:

```ts
import { effect, frame, surface } from "vgpu";

import skySource from "./sky.wgsl";
import { getGpu, prefersReducedMotion } from "@/lib/gpu";
import {
  approach,
  departure,
  horizonFrame,
  introProgress,
  orbFrame,
  restingLight,
  rise,
  skyDpr,
  type Rect,
} from "@/lib/sky-math";

const INTRO_DELAY_MS = 250;
// The ambient drift (nebula, flow, twinkle) needs no more than ~30fps.
const AMBIENT_MS = 33;
const EMPTY: Rect = { left: 0, top: 0, width: 0, height: 0 };

type Callbacks = { onFirstFrame: () => void; onFallback: () => void };

/**
 * Draws the page's sky into the fixed `canvas`. Frames are drawn on demand: on scroll, pointer
 * and layout changes, while the light eases, and at ~30fps while the orb or horizon is in view.
 */
export function mountSky(canvas: HTMLCanvasElement, { onFirstFrame, onFallback }: Callbacks) {
  let disposed = false;
  let measure = () => {};
  const teardown: (() => void)[] = [];

  void (async () => {
    const gpu = await getGpu();
    if (disposed) return;
    if (!gpu) return onFallback();

    try {
      const output = surface(gpu, canvas, {
        // Sized by hand to the pixel budget; auto-resize would re-read devicePixelRatio.
        autoResize: false,
        // Every pixel is written with alpha 1, so the compositor can skip blending the canvas.
        alphaMode: "opaque",
      });
      teardown.push(() => output.dispose());

      const reduced = prefersReducedMotion();
      const sky = effect(gpu, skySource, {
        set: {
          params: {
            resolution: output.size,
            light: [0, 0],
            pointer: [0.5, 0.5],
            dpr: 1,
            scroll: 0,
            hover: 0,
            time: reduced ? 8 : 0,
            orb: [0, 0, 1, 0],
            foot: [0, 0, 1, 0],
            footWidth: 1,
            heroHeight: 1,
          },
        },
      });
      await sky.compile({ colors: [output.format] });
      if (disposed) return;

      let cssWidth = 1;
      let hero = EMPTY;
      let contact = EMPTY;
      const pointer = { x: 0, y: 0, nx: 0.5, ny: 0.5 };
      const light = { x: 0, y: 0, ready: false };
      let hover = 0;
      let hoverTarget = 0;
      let time = reduced ? 8 : 0;
      let raf = 0;
      let lastTick = 0;
      let lastDraw = 0;
      let dirty = true;
      let shown = false;
      const introStart = performance.now() + INTRO_DELAY_MS;

      const request = () => {
        dirty = true;
        if (!raf && !disposed) raf = requestAnimationFrame(tick);
      };

      const anchor = (name: string): Rect => {
        const el = document.querySelector(`[data-sky-anchor="${name}"]`);
        if (!el) return EMPTY;
        const r = el.getBoundingClientRect();
        return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
      };
      // Layout is read only here, never inside a frame.
      measure = () => {
        hero = anchor("hero");
        contact = anchor("contact");
        request();
      };

      const resize = () => {
        cssWidth = Math.max(canvas.clientWidth, 1);
        const height = Math.max(canvas.clientHeight, 1);
        const dpr = skyDpr(window.devicePixelRatio, cssWidth, height);
        output.resize([Math.max(1, Math.round(cssWidth * dpr)), Math.max(1, Math.round(height * dpr))]);
        request();
      };

      function tick(now: number) {
        raf = 0;
        if (document.hidden) return;
        const dt = lastTick ? Math.min((now - lastTick) / 1000, 0.1) : 1 / 60;
        lastTick = now;
        const scrollY = window.scrollY;

        const intro = reduced ? 1 : introProgress(now - introStart);
        const orb = orbFrame(hero, intro, reduced ? 0 : departure(scrollY, hero));
        const up = !contact.height ? 0 : reduced ? 1 : rise(scrollY, window.innerHeight, contact);
        const horizon = horizonFrame(contact, up);

        const rest = restingLight(hero);
        const tx = hoverTarget ? pointer.x + window.scrollX : rest.x;
        const ty = hoverTarget ? pointer.y + scrollY : rest.y;
        if (!light.ready || reduced) {
          light.x = tx;
          light.y = ty;
          light.ready = true;
        }
        light.x = approach(light.x, tx, dt);
        light.y = approach(light.y, ty, dt);
        hover = reduced ? hoverTarget : approach(hover, hoverTarget, dt);

        const settling =
          Math.abs(hoverTarget - hover) > 0.002 ||
          Math.hypot(tx - light.x, ty - light.y) > 0.5 ||
          (!reduced && intro < 1);
        const ambient = !reduced && (orb.vis > 0.001 || up > 0);

        if (dirty || settling || (ambient && now - lastDraw >= AMBIENT_MS)) {
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
              hover,
              time,
              orb: [orb.cx, orb.apex, orb.radius, orb.vis],
              foot: [horizon.cx, horizon.top, horizon.radius, up],
              footWidth: horizon.halfWidth,
              heroHeight: hero.height,
            },
          });
          const drawn = frame(gpu, (f) => f.pass(output, sky));
          if (!shown) {
            shown = true;
            void drawn.done.then(() => !disposed && onFirstFrame());
          }
        }

        if (settling || ambient) raf = requestAnimationFrame(tick);
      }

      const onPointer = (event: PointerEvent) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.nx = event.clientX / Math.max(window.innerWidth, 1);
        pointer.ny = event.clientY / Math.max(window.innerHeight, 1);
        hoverTarget = event.pointerType === "touch" ? 0 : 1;
        request();
      };
      const onLeave = () => {
        hoverTarget = 0;
        request();
      };
      const onVisibility = () => {
        lastTick = 0;
        request();
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", request, { passive: true });
      window.addEventListener("load", measure);
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
      const canvasObserver = new ResizeObserver(resize);
      canvasObserver.observe(canvas);
      const pageObserver = new ResizeObserver(measure);
      pageObserver.observe(document.body);
      void document.fonts.ready.then(() => !disposed && measure());
      teardown.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("scroll", request);
        window.removeEventListener("load", measure);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        canvasObserver.disconnect();
        pageObserver.disconnect();
      });

      void gpu.gpu.lost.then(() => {
        if (disposed) return;
        cancelAnimationFrame(raf);
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

If typecheck reports that `gpu.gpu` has no `lost`, check the type with `bunx vgpu docs cat /vgpu/gpu.docs.md`. Use the device it exposes; `image-texture.ts` used `gpu.gpu.queue`, so `gpu.gpu` is the `GPUDevice`. If `frame()` doesn't return a `Frame` with `done`, call `onFirstFrame()` inside a `requestAnimationFrame` after the first `frame()` call instead.

- [ ] **Step 4: Write the component**

`src/components/sky/sky.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type SkyHandle = { measure(): void; dispose(): void };

/** The fixed vgpu sky behind every page; the CSS sky (fallback.tsx) shows until it's live. */
export default function Sky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<SkyHandle | null>(null);
  const [shown, setShown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !("gpu" in navigator)) return;
    let cancelled = false;
    void import("./renderer").then(({ mountSky }) => {
      if (cancelled) return;
      handleRef.current = mountSky(canvas, {
        onFirstFrame: () => setShown(true),
        onFallback: () => {
          setShown(false);
          document.documentElement.dataset.sky = "css";
        },
      });
    });
    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  // Hide the CSS sky only once the canvas has finished fading in over it.
  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => {
      document.documentElement.dataset.sky = "live";
    }, 1300);
    return () => clearTimeout(timer);
  }, [shown]);

  // Each route brings its own anchors.
  useEffect(() => {
    handleRef.current?.measure();
  }, [pathname]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 -z-1 h-lvh w-full opacity-0 transition-opacity duration-1200",
        shown && "opacity-100",
      )}
    />
  );
}
```

- [ ] **Step 5: Mount it**

In `src/app/layout.tsx`, import `Sky from "@/components/sky/sky"` and render `<Sky />` right after `<SkyGrain />`.

- [ ] **Step 6: Run the checks**

Run: `bun run lint && bun run typecheck && bun test && bunx vgpu check src/components/sky/sky.wgsl --require-validation && bun run build`
Expected: all exit 0.

- [ ] **Step 7: Verify it live and with no WebGPU (Review Focus 1)**

Use the scratchpad Playwright setup from the previous session. That's `pw/` with playwright-core 1.56 and the headed chromium-1243 build, which has WebGPU, launched with `--enable-unsafe-webgpu`. Write `sky-check.mjs` there:

```js
import { chromium } from "playwright-core";
const exe = process.env.CHROMIUM; // path used by pw/tour.mjs
const browser = await chromium.launch({ executablePath: exe, headless: false, args: ["--enable-unsafe-webgpu"] });
for (const gpu of [true, false]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  if (!gpu) await page.addInitScript(() => { delete Navigator.prototype.gpu; });
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(3500);
  const state = await page.evaluate(() => document.documentElement.dataset.sky);
  await page.screenshot({ path: `sky-${gpu ? "live" : "nogpu"}.png` });
  console.log(gpu ? "live" : "nogpu", state, errors);
  await page.close();
}
await browser.close();
```

Run: `CHROMIUM=<path> node sky-check.mjs` in the scratchpad `pw/` directory.

Expected:
- `live live []` and `nogpu css []`.
- `sky-live.png` shows the shader orb with its lit limb, orbit hairlines, flares, nebula and stars, matching `Story-1-Rise`.
- `sky-nogpu.png` shows the CSS sky from Task 3.

- [ ] **Step 8: Verify resize and the 404 page (Review Focus 4 and 5)**

Extend `sky-check.mjs`, or add a second script, with a live page:

1. Scroll to the bottom and screenshot (`horizon-1440.png`).
2. `page.setViewportSize({ width: 1024, height: 768 })`, wait 500 ms, scroll to the bottom again and screenshot (`horizon-1024.png`).
3. Go to `http://localhost:3000/nope`, wait 2 s, screenshot (`404.png`) and log the errors.

Expected:
- In both horizon shots, the lit horizon arc sits behind "© … Dale Bañares", about 15% of Contact's height above the page bottom.
- `404.png` shows stars and nebula with no orb or horizon, and there are no errors.

- [ ] **Step 9: Verify that idle draws nothing**

On the live page, count GPU submits with an init script, then scroll to the middle of `#work` (the hero and Contact both off screen) and hold the pointer still:

```js
await page.addInitScript(() => {
  window.__submits = 0;
  const submit = GPUQueue.prototype.submit;
  GPUQueue.prototype.submit = function (...args) { window.__submits++; return submit.apply(this, args); };
});
// after load and the 2.4 s intro:
await page.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
await page.waitForTimeout(2000);
const before = await page.evaluate(() => window.__submits);
await page.waitForTimeout(2000);
console.log("idle submits", (await page.evaluate(() => window.__submits)) - before);
```

Expected: `idle submits 0`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(sky): draw the page sky with vgpu"
```

---

## Task 5: GSAP choreography

**Files:**
- Create: `src/components/motion.tsx`
- Modify: `src/app/page.tsx` (wrap the sections in `<Motion>`, which renders the `<main>`)

**Interfaces:**
- Consumes:
  - From Task 2: the `[data-rise]`, `[data-hero-copy]`, `#home`, `[data-project]`, `[data-hairline]`, `[data-statement]` and `[data-word]` hooks.
  - From Task 1: `wordOpacity`.
- Produces: the default export `Motion({ children })`, which renders `<main className="flex flex-1 flex-col">`.

- [ ] **Step 1: Write `src/components/motion.tsx`**

```tsx
"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

import { wordOpacity } from "@/lib/statement";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** The page's DOM motion: the page-in, and every scroll effect, scrubbed. The sky runs its own. */
export default function Motion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 01 Rise: the copy fades up line by line as the orb rises.
        gsap.fromTo(
          "[data-rise]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 1.6, ease: "power4.out", delay: 0.5, stagger: 0.14 },
        );

        // 02 Drift: the copy lifts and is gone by 71% of the hero, while the orb sets below it.
        gsap
          .timeline({
            scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: true },
          })
          .to("[data-hero-copy]", { y: -90, ease: "none", duration: 1 }, 0)
          .to("[data-hero-copy]", { opacity: 0, ease: "none", duration: 1 / 1.4 }, 0);

        // 03 Focus: each hairline draws in, then its statement lights up word by word.
        const words: HTMLElement[] = [];
        gsap.utils.toArray<HTMLElement>("[data-project]").forEach((project) => {
          gsap.fromTo(
            project.querySelector("[data-hairline]"),
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: { trigger: project, start: "top bottom", end: "top 70%", scrub: true },
            },
          );

          const statement = project.querySelector<HTMLElement>("[data-statement]");
          if (!statement) return;
          const own = gsap.utils.toArray<HTMLElement>("[data-word]", statement);
          words.push(...own);
          // One trigger per statement, writing each word's opacity: cheaper than a tween per word.
          const paint = (progress: number) =>
            own.forEach((word, i) => {
              word.style.opacity = String(wordOpacity(progress, i, own.length));
            });
          ScrollTrigger.create({
            trigger: statement,
            start: "top 90%",
            end: "top 40%",
            onUpdate: (self) => paint(self.progress),
            onRefresh: (self) => paint(self.progress),
          });
        });

        return () => words.forEach((word) => word.style.removeProperty("opacity"));
      });

      // Geist swaps in after first layout; trigger positions are measured against it.
      void document.fonts.ready.then(() => ScrollTrigger.refresh());
    },
    { scope },
  );

  return (
    <main ref={scope} className="flex flex-1 flex-col">
      {children}
    </main>
  );
}
```

- [ ] **Step 2: Use it in `src/app/page.tsx`**

```tsx
import Contact from "@/components/contact";
import Hero from "@/components/hero";
import Motion from "@/components/motion";
import Work from "@/components/work";

export default function Home() {
  return (
    <Motion>
      <Hero />
      <Work />
      <Contact />
    </Motion>
  );
}
```

- [ ] **Step 3: Run the checks**

Run: `bun run lint && bun run typecheck && bun test && bun run build`
Expected: all exit 0.

- [ ] **Step 4: Verify the storyboard and reduced motion (Review Focus 2)**

Add `motion-check.mjs` to the scratchpad `pw/` directory. Use a live Chromium page at 1440×900 and wait 3.5 s after load before each step.

1. Screenshot at scroll 0 (`rise.png`). Expected: it matches `Story-1-Rise`, with all three hero lines visible.
2. Scroll to `0.35 × #home height` and screenshot (`drift.png`). Expected: it matches `Story-2-Drift`. The copy has lifted and dimmed, and the orb has sunk with no text over the limb.
3. Call `scrollIntoView({block: "start"})` on `#umamin`, scroll up 180 px and screenshot (`focus.png`). Expected: it matches `Story-3-Focus`. Umamin's statement is fully lit, the second hairline is partly drawn, and Omsimos's words fade along the line.
4. Scroll to the bottom and screenshot (`horizon.png`). Expected: it matches `Story-4-Horizon`.
5. Open a new context with `reducedMotion: "reduce"`, load the page, scroll through all of it and evaluate:

```js
const dim = await page.$$eval("[data-word]", (els) => els.filter((e) => getComputedStyle(e).opacity !== "1").length);
const hidden = await page.$$eval("[data-rise]", (els) => els.filter((e) => getComputedStyle(e).opacity !== "1").length);
const moved = await page.$eval("[data-hero-copy]", (e) => getComputedStyle(e).transform);
console.log({ dim, hidden, moved });
```

Expected: `{ dim: 0, hidden: 0, moved: "none" }`.

6. With JavaScript disabled (`javaScriptEnabled: false`), load the page. Expected: the hero lines are visible (the noscript rule) and every word is at opacity 1.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(motion): scrub the page-in, drift, hairlines and read-along with gsap"
```

---

## Task 6: Production verification and PR

Not code, except fixes for whatever this finds; each fix is its own commit.

- [ ] **Step 1: Production server**

In the herdr pane: stop the dev server, then run `bun run build && bun run start -p 3100`. Wait for the token `Ready in` with `--timeout 120000`.

- [ ] **Step 2: Frame probe**

Run a scripted full-page scroll at 1440×900 against `http://localhost:3100`:
- Use `page.mouse.wheel(0, 120)` every 16 ms until the bottom, then back to the top.
- An init script records the `requestAnimationFrame` deltas.
- Also record CLS with a `PerformanceObserver` of type `layout-shift` (`buffered: true`).

Expected:
- p95 frame time is 17 ms or less, and no frame takes over 50 ms.
- CLS is under 0.05.

- [ ] **Step 3: Firefox (no WebGPU)**

Load `http://localhost:3100` in Playwright Firefox, using `pw2/` with playwright-core 1.63, at 1440×900. Scroll through and screenshot the hero and Contact.

Expected: the CSS sky, the hero text visible after the page-in, the read-along working, and no console errors.

- [ ] **Step 4: Mobile**

In Chromium with WebGPU at 390×844, `isMobile: true`, `hasTouch: true`, take full-page screenshots.

Expected: it matches `Mobile.dc.html`, with no horizontal scroll (`document.documentElement.scrollWidth === 390`).

- [ ] **Step 5: Clean up**

Close the server pane with `herdr pane close <pane_id>`.

- [ ] **Step 6: Push and PR (only after the owner's explicit yes)**

Ask: "push to `feat/redesign`?" On yes:

```bash
git push -u origin feat/redesign
gh pr create --base main --title "feat: one-sky portfolio redesign" --body "<what changed and why, no filler: the canvas link, the vgpu sky, the gsap beats, the removals, the verification numbers>"
```
