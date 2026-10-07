# Portfolio redesign: one sky

- **Date:** 2026-10-07
- **Status:** Draft for review
- **Concept:** [Portfolio Redesign Concept](https://claude.ai/artifact/M15sVykKSydrFPDnoGb3eE). The source of truth is that canvas's current artboards:
  - `Main.dc.html`: the live desktop page, with a WebGL2 sky.
  - `Mobile.dc.html`: the 390 px layout.
  - `Story-1-Rise` to `Story-4-Horizon`: one storyboard frame per scroll beat.
- **Supersedes:** the 2026-10-02 "One Sky" spec and plan. The canvas has moved past them, so they are deleted.

## 1. Intent

Rebuild the portfolio as the canvas shows it: a quiet single page under one continuous night sky.

- **Visual:** a blue orb rises behind the hero, and a planet's horizon closes the page at Contact.
- **Content:** three projects told as type, not screenshots.
- **Stack:**
  - The sky renders with **vgpu**, replacing the prototype's raw WebGL2.
  - Every DOM motion runs on **GSAP**, using ScrollTrigger with `scrub` and a page-in timeline.

Decisions confirmed with the owner on 2026-10-07:

- The canvas wins over the Oct 2 spec. Projects are Umamin, Omsimos and StackMap. There are no screenshots, lens, electrons, contact orbits, serif surname or work pill.
- Match the canvas strictly:
  - One route.
  - The project pages, the ⌘K command menu, the four-column page-in banner and every existing shader are removed.

## 2. Success criteria

1. **Parity with the canvas.**
   - At 1440×900 and 390×844, every section matches its artboard in layout, copy, type and color.
   - At the storyboard's scroll positions, the page matches each frame.
2. **One continuous sky.** No section draws its own background. The nebula, stars and grain run unbroken from the header to the footer.
3. **Scrubbed motion only.**
   - Every scroll effect is tied to scroll position: reversible, and never replayed.
   - Scroll changes only `transform` and `opacity`, and the shader's uniforms.
4. **Smooth.** These are measured on a production build in Chromium on an M-series Mac, at 1440×900, during a scripted full-page scroll:
   - The p95 frame time is 17 ms or less.
   - No frame takes over 50 ms.
   - CLS stays under 0.05.
5. **Cheap at rest.**
   - The sky never reads layout inside a frame.
   - It stops drawing when the tab is hidden.
   - It stops drawing when nothing it draws is moving: the orb and the horizon are off screen, and the pointer, the light and the scroll are all still.
6. **Works everywhere.**
   - **No WebGPU** (for example Firefox on macOS): the CSS sky from the canvas shows, with the same layout and no console errors.
   - **Reduced motion:** there is no intro, scrub or parallax. Every word is fully lit, and the sky's time is frozen.
   - **Touch:** no content depends on hover.
7. **Green checks:**
   - lint, typecheck and build
   - `bunx vgpu check src/components/sky/sky.wgsl`
   - `bun test` for the pure math

## 3. Page

- **Route:** a single route, `/`.
- **Redirects:** `/project/:title` permanently redirects to `/#:title`. `/resume` keeps redirecting to `/resume.pdf`, and every "Résumé" link uses `siteConfig.links.resume` (`/resume`).
- **Fonts:** Geist (from the `geist` package) only.
- **Root text color:** `#eceef2`, antialiased.
- **Selection:** `rgba(201,220,255,0.24)`.

### 3.1 Tokens

| Token | Value | Use |
|---|---|---|
| `sky` | `#06070a` | page background, header fade |
| `ink` | `#eceef2` | headings, emphasised words |
| `glow` | `#c9dcff` | second hero line, Visit buttons, hover |
| `mute` | `#a1a6af` | nav, lede, section labels, contact links |
| `dim` | `#7c818b` | years, statements |
| grid line | `rgba(168,184,214,0.065)` | 64 px grid |
| hairline | `linear-gradient(90deg, rgba(201,220,255,.42), rgba(201,220,255,.1) 32%, rgba(255,255,255,.07) 62%)` | project rule |

**Gutter:** `clamp(20px, 5.6vw, 80px)`, with a 1440 px max content width.

### 3.2 Header

- **Placement:** fixed and full-width at `z-50`, with `pointer-events: none` except on its links.
- **Background:** a gradient from `#06070a` through `rgba(6,7,10,.72)` at 52% to transparent.
- **Padding:** 18 px top and 30 px bottom.
- **Left side:** a 13 px orb dot, `radial-gradient(circle at 50% 130%, #0c1838 35%, #4b80d4 72%, #c9dcff 100%)` with a soft top glow, then "hyamero" (16 px, weight 500, 0.04em), linking to `#home`.
- **Right side:** "Work", "Contact" and "Résumé ↗".
  - They are 14 px with 0.06em tracking, in `mute`.
  - The gap is `clamp(18px, 3vw, 40px)`.
  - Each target is at least 44 px tall.

### 3.3 Hero (`#home`)

- **Box:** at least 960 px tall (880 px below 760 px wide), `overflow: hidden`.
- **Copy:** centred, with a 200 px top pad (132 px on mobile).
  - **h1:** "Software engineer" plus a block line "and designer." in `glow`.
    - Size `clamp(2.75rem, 6.1vw, 5.5rem)`, line-height 1.04, weight 400, 0.01em.
  - **Lede:** "I'm Dale Bañares, based in the Philippines and working mostly with teams across the EU."
    - 30 px below the h1, at most 34em wide, `clamp(1rem, 1.3vw, 1.1875rem)`, line-height 1.6, in `mute`, balanced.
  - **Links:** "Selected work ↓" scrolls to `#work`, and "Résumé ↗" opens the résumé.
    - 34 px below the lede, 15 px, weight 500, with a 40 px gap (8 px rows when they wrap).
- **Grid:** the CSS grid, masked by `radial-gradient(ellipse 58% 60% at 50% 72%, …)`.

### 3.4 Selected work (`#work`)

- **Box:** padding 120 px top and 96 px bottom.
- **Label:** "Selected work" (15 px, 0.08em, `mute`), with 26 px below it.
- **List:** an `<ol>` with a bottom border of `rgba(255,255,255,.07)`. Each `<li id=…>` has 56 px top and 72 px bottom padding (44 px and 52 px on mobile).
- **Row layout:** a wrapping flex row with a 36 × 48 px gap.
  - The left column (flex `1 1 340px`) holds the year (13 px, tabular, `dim`), then the name as an `h3` (`clamp(2.5rem, 4.4vw, 4rem)`, weight 400) beside a 44 px round Visit link (`aria-label="Visit <Name>"`, opens in a new tab).
  - The right column (flex `1.7 1 520px`) holds the statement: `clamp(1.375rem, 2.2vw, 2rem)`, line-height 1.4, `dim`, pretty-wrapped.
  - Emphasised words are `ink` at weight 500.
- **Hairline:** a 1 px rule at the top of each row, in the hairline gradient.

### 3.5 Contact (`#contact`) and footer

- **Box:** at least 820 px tall, filling the rest of the page, `overflow: hidden`.
- **Copy:** centred, with padding 196 px top and 160 px bottom (150 px top on mobile).
  - **Label:** "Contact".
  - **CTA:** "Send a signal." as a `mailto:` link, 26 px below the label: `clamp(2.5rem, 6.4vw, 5.75rem)`, line-height 1.1.
  - **Links:** 44 px below the CTA, a list of Email, GitHub, LinkedIn and Résumé (15 px, `mute`, 36 px gap), each with a ↗.
- **Grid:** the CSS grid, masked `radial-gradient(ellipse 56% 78% at 50% 100%, …)` and anchored to the bottom.
- **Footer:** inside Contact, on the planet's dark side.
  - "© {year} Dale Bañares" on the left and "Back to top ↑" on the right, 14 px, in `mute`, with 14 px bottom padding.
  - The year is computed at build time.

### 3.6 Content

The project data in `src/lib/projects.ts` is replaced with these entries. `*…*` marks emphasis.

| id | Name | Year | URL | Statement |
|---|---|---|---|---|
| `umamin` | Umamin | 2022 | https://umamin.link | A social platform for sending and receiving encrypted anonymous messages. Reached almost *3 million users* with more than *17.5 million page visits.* |
| `omsimos` | Omsimos | 2023 | https://omsimos.com | A community-driven, open-source developer collective building *enterprise-level open-source initiatives,* where I do *design and product engineering.* |
| `stackmap` | StackMap | 2026 | https://stackmap.omsimos.com | An *agent-first* tool that maps systems into an *interactive diagram,* for architecture, dataflow, workflow, lifecycle and sequence. |

- **Site description:** "Software engineer and designer based in the Philippines, working mostly with teams across the EU."
- **Sitemap:** lists `/` only.

## 4. The sky (vgpu)

### 4.1 Canvas

- **Element:** one `<canvas>` (`src/components/sky/sky.tsx`) at `position: fixed; inset: 0; z-index: -1; pointer-events: none`, rendered by the root layout.
- **Output:** opaque.
- **Sizing:** sized by hand. Device pixel ratio = min(devicePixelRatio, 1.25, √(2.2 M / (vw × vh))).
- **Device:** vgpu loads by dynamic import, and the device comes from the shared `getGpu()`.

### 4.2 What it draws (per pixel, `sky.wgsl`, in page space)

The shader is a port of the prototype's fragment shader, with the same constants and colors.

1. **Background:** `vec3(0.024, 0.027, 0.039)`.
2. **Nebula:** domain-warped fbm in page space, drifting at 0.02 per second.
   - It lags the scroll by `scroll × 0.55`, so it reads at 0.45×.
   - It gathers in three places:
     - around the orb
     - along the side margins (outer 26–50% of the half-width, varied by noise)
     - above the horizon
   - Its palette blends blue `(0.16,0.24,0.52)`, violet `(0.27,0.2,0.5)` and teal `(0.15,0.32,0.38)`.
   - A strength lever multiplies it, default 1.
3. **Orb:** center `(hero.cx, apex + R)`, with R = max(0.62 × heroW, 0.95 × heroH) × (0.97 + 0.03 × intro).
   - **Limb:** lit toward the light. The light is the pointer on hover; at rest it sits at 42% across and 25% of the hero's height above the hero.
   - **Atmosphere band:** flows with fbm and slowly spins (0.01 rad/s).
   - **Body:** dark, and occludes the stars.
   - **Halo:** around the outside.
   - **Orbit hairlines:** two, at R + 110 and R + 310, drawn only on the orb's shoulders, clear of the headline.
   - **Flares:** two twinkling four-point flares on those orbits.
   - It is drawn where `vis > 0`, fading out below the orb's center by `smoothstep(-0.02H, 0.34H)`.
4. **Horizon** (Contact): a circle of radius max(2.2 × contactW, 2600), centered under Contact.
   - Its top sits at contactBottom − (0.02 + 0.13 × rise) × contactH.
   - **Rim, atmosphere and inner glow:** falloffs over 6.4, 64 and 41 px, at weights 0.95, 0.55 and 0.32.
   - **Lit arc:** leans toward the pointer's x by hover, with a half-width of 0.37 × contactW.
   - **Surface:** dark below the rim, and occludes the stars.
5. **Stars:** two hashed layers at 0.85× scroll parallax, twinkling, with an 8 px pointer parallax on hover. Occluded by the orb and the horizon.
6. **Grain and dither:** luminance-weighted static grain, then ±0.5/255 dither. A grain lever multiplies the grain, default 1.

### 4.3 Uniforms and state

`renderer.ts` computes these, all in CSS pixels:

| Uniform | Contents |
|---|---|
| `resolution` | canvas size |
| `dpr` | device pixel ratio |
| `scroll` | `scrollY` |
| `light` | page-space light position |
| `pointer` | normalised pointer position |
| `hover` | 0..1 |
| `time` | seconds |
| `orb` | cx, apex, R, vis |
| `foot` | cx, top, radius, rise |
| `footWidth` | horizon half-width |
| `mix` | glow, nebula, grain, heroH |

Pure functions live in `src/lib/sky-math.ts` and are unit-tested with `bun test`:

| Function | Definition |
|---|---|
| `clamp` | clamps a value to 0..1 |
| `ease` | smoothstep |
| `skyDpr` | the device pixel ratio formula in §4.1 |
| `departure` | clamp(scrollY / heroH) |
| `rise` | clamp((vh − contactTop) / contactH) |
| `orbFrame(geo, intro, dep)` | returns `{cx, apex, R, vis}`, where apex = heroTop + H × (0.68 + 0.1 × (1 − intro)) + dep × 2H and vis = intro × (1 − ease(0.2, 0.8, dep)) |
| `horizonFrame(geo, rise)` | the horizon's center, top, radius and half-width, per §4.2 |

**Easing:**

- The light and hover ease by 1 − e^(−3·dt). They snap under reduced motion.
- The intro runs 0 → 1 over 2.4 s, starting 250 ms after mount, with an ease-out cubic.

### 4.4 Geometry

- The renderer caches the hero and contact page-space rects.
- It re-measures them on:
  - mount
  - `ResizeObserver` callbacks on `document.body`
  - `document.fonts.ready`
  - `window` `load`
- It never reads layout inside a frame.
- Sections mark themselves with `data-sky="hero"` and `data-sky="contact"`.

### 4.5 Frame policy

- **Redraw on change.** The next animation frame draws after scroll, pointer movement, a resize, a re-measure, or while the light, hover or intro is still easing.
- **Ambient drift.** While the orb (vis > 0 and on screen) or the horizon (rise > 0) is visible, frames draw at most every 33 ms. Time advances only on those frames.
- **Idle.** Otherwise nothing is drawn.
- **Hidden tab.** It pauses while `document.hidden`.
- **Device lost.** It sets fallback (§4.6).

### 4.6 Lifecycle and fallback

- **State:** `<html data-sky>` starts as `css`.
  - It becomes `live` 1.3 s after the first frame, once the canvas has faded in over 1.2 s.
  - It returns to `css` if init fails or the device is lost.
- **Fallback layers:** `.sky-fallback`, at `z-index: -2`, ported verbatim from the canvas markup.
  - **Hero:** the radial glows, 14 twinkle stars, the orbit rings, two flares, the orb gradient and the limb.
  - **Contact:** the glow, 6 twinkle stars and the CSS horizon disc with its box-shadow.
  - **Whole page:** an SVG grain.
  - They become `visibility: hidden` under `[data-sky=live]`.

## 5. Motion (GSAP)

All motion is in `src/components/motion.tsx`, a client component that wraps the page.

- It uses `useGSAP` and `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`.
- It registers ScrollTrigger and ScrollToPlugin.
- The sky doesn't read GSAP. It derives `departure` and `rise` from `scrollY` and its cached geometry, so it stays correct without the DOM timeline.

| Beat | Trigger | What changes |
|---|---|---|
| **01 Rise** (page load) | timeline on mount | The h1, lede and links run from opacity 0 and y 16 px to 1 and 0, over 1.6 s with `expo.out`, at delays 0.5 s + i × 0.14 s. The sky's intro runs in parallel (§4.3). |
| **02 Drift** | `#home`, `top top` → `bottom top`, scrub | The hero copy moves y 0 → −90 px, and its opacity runs 1 → 0 by 71% of the range (1 − 1.4 × dep). The sky sets the orb and dims it. |
| **03 Focus**: hairline | each row, `top bottom` → `top 70%`, scrub | The hairline's scaleX runs 0 → 1, from the left. |
| **03 Focus**: read-along | each statement, `top 90%` → `top 40%`, scrub | Word i of n runs opacity 0.16 → 1 over the window [i / (n + 6), (i + 4) / (n + 6)]. This is the canvas's `clamp(0.16, (sv(n + 6) − i) / 4, 1)`. |
| **04 Horizon** | — | The sky raises the horizon by `rise`. There is no DOM motion. |

**Rules:**

- **Statements:** split into words on the server as `<span>`s. The paragraph stays one `<p>` with its plain text intact for screen readers, and the spans add no ARIA.
- **Opacity range:** scrubbed opacity never drops below 0.16 on text, and links stay focusable.
- **In-page links:** "Work", "Contact", "Selected work" and "Back to top" use `scrollToSection` (1 s). With reduced motion they jump instantly.
- **Refresh:** `ScrollTrigger.refresh()` runs after `document.fonts.ready`.
- **Reduced motion:** nothing is registered, so every word renders at opacity 1, the hairlines are full width and the copy is static.

## 6. Micro-interactions (CSS)

These match the canvas:

- **`.line-link`:**
  - Its underline (an `::after` pseudo-element, 9 px from the bottom) brightens from 0.22 to 0.85 opacity.
  - Its arrow nudges: ↗ moves (2, −2) px, ↓ moves 3 px down, ↑ moves 3 px up, over 0.5 s `cubic-bezier(.22,1,.36,1)`.
- **`.visit`:**
  - The border goes from 0.2 to 0.55 alpha.
  - The fill becomes `rgba(201,220,255,.07)` and the text turns white.
  - The arrow nudges (2, −2) px.
- **`.say`** ("Send a signal."):
  - The text color goes to `glow`.
  - An underline scales from 0.4 to 1 and fades to 0.5.
- **Keyboard:** every hover state also applies on `:focus-visible`, with a visible 1 px `glow` outline.
- **Touch:** the hover states are wrapped in `@media (hover: hover)`.

## 7. Removals

| Kind | Removed |
|---|---|
| Routes | `src/app/project/[title]` (replaced by the redirect) |
| Components | everything under `sections/`, `animations/`, `magicui/` and `shaders/`; `navbar`, `nav-menu`, `command-menu`, `transition-loader`, `back-to-top`, `hover-brake`, `status-page` (unless `error`/`not-found` use it, in which case it is restyled), and every `ui/*` with no remaining import |
| Data and state | `lib/state-store.ts`, `lib/stats-themes.json`, `hooks/use-media-query.ts` (if unused) |
| Assets | `public/img/projects/*`, `public/img/icons/*`, `main-bg.jpg`, `rings-bg.svg`, `stars.svg` |
| Dependencies | the Radix packages, `cmdk`, `zustand`, `lucide-react` (icons become inline stroke SVGs), `tw-animate-css` and `class-variance-authority`, wherever they become unused |
| Kept | `gsap`, `@gsap/react`, `vgpu`, `@vgpu/wgsl`, `geist`, `clsx`, `tailwind-merge` |

The kept items are trimmed to what is used. `error.tsx` and `not-found.tsx` are restyled to the new tokens, under the same sky.

## 8. Files

**New**

- `src/components/sky/sky.tsx`: the canvas, the fallback state and the dynamic import.
- `src/components/sky/renderer.ts`: geometry, input, the frame policy and uniforms.
- `src/components/sky/sky.wgsl`: the shader.
- `src/components/sky/fallback.tsx`: the hero and contact CSS sky layers.
- `src/components/site-header.tsx`, `hero.tsx`, `work.tsx`, `contact.tsx`: the sections.
- `src/components/motion.tsx`: the GSAP choreography.
- `src/components/scroll-link.tsx`: the in-page link component.
- `src/components/icons.tsx`: rewritten as the four arrows.
- `src/lib/sky-math.ts` with `sky-math.test.ts`, and `src/lib/statement.ts` with `statement.test.ts` (parses `*…*` emphasis into words, and returns plain text).

**Changed**

- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/sitemap.ts`, `app/error.tsx`, `app/not-found.tsx`
- `lib/projects.ts`, `lib/site.ts`, `lib/scroll.ts`, `lib/gpu.ts`
- `next.config.ts` (the redirect)
- `package.json` (removed dependencies, a `test` script and `@types/bun`)
- `ci.yml` (adds `bun test`)

## 9. Verification

- **Checks:** lint, typecheck, `bun test`, `vgpu check` and `next build`.
- **Visual:** Playwright screenshots of the production build in Chromium with WebGPU.
  - At 1440×900, at scroll 0 (Rise), 0.6 × hero (Drift), with the first rows in view (Focus) and at the bottom (Horizon).
  - At 390×844, the full page.
  - Each is compared by eye against the matching artboard.
- **Performance:** a scripted scroll with an in-page frame probe, held to §2.4. An idle check confirms no frames are drawn with the hero and contact off screen and the pointer still.
- **Fallbacks:** Playwright Firefox (no WebGPU) shows the CSS sky with no errors. Reduced-motion emulation shows a static page with every word lit.
- **Manual:** desktop Safari, and iOS Safari if available.

## 10. Risks

| Risk | Mitigation |
|---|---|
| The fixed canvas trails compositor scroll by a frame | Only the horizon is page-locked, and it is a soft glow. The orb and nebula already parallax. |
| WGSL port drifts from the GLSL look | Port line for line, and compare screenshots against the canvas, which renders the same shader. |
| Read-along creates many tweens | Use one ScrollTrigger per statement, driving each word's opacity in an `onUpdate` (fewer than 25 words each). |
| WebGPU missing in some browsers | The CSS fallback is first-class and tested in Firefox. |
