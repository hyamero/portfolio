# Motion and light: a voyage through the sky

- **Date:** 2026-10-07
- **Status:** Draft for review
- **Builds on:** [2026-10-07 portfolio redesign](2026-10-07-portfolio-redesign-design.md) ("the redesign spec"). Everything there stands unless this spec changes it.

## 1. Intent

Make the one sky feel travelled through, not just scrolled past, while keeping the page quiet and readable.

- **Orb:** the orb's atmosphere streams off as a blue trail when you leave the hero. The trail becomes the nebula behind Work, then gathers back into the horizon at Contact. It is one object carried through the whole page.
- **Stars:** the stars sit in three depth layers. Scrolling gives them momentum in your direction, and they coast to rest after you stop.
- **Smooth scroll:** wheel and trackpad scrolling is smoothed by Lenis on GSAP's ticker. The canvas, the copy and every effect move in the same frame.
- **One light:** the cursor light the orb already reflects also glints along the page's edges: hairlines, underlines and button rings.
- **Micro-interactions:** magnetic arrows, project-row hover, a section marker in the header and a blur-in for the two headlines.

Decisions confirmed with the owner on 2026-10-07:

- **Orb transformation:** a scroll story, driven by position only. There is no warp or streaking driven by scroll speed.
- **Light on elements:** only edges catch it. Text, glass and chromatic effects are out.
- **Stars:** depth layers plus coast, coming to rest so idle frames stay at zero. They do not cruise on their own.
- **Micro-interactions:** all four of magnetic arrows, row hover, section marker and headline blur-in.
- **Architecture:** one shared frame loop (approach A). Lenis, ScrollTrigger, the sky and the edge light all run on `gsap.ticker` and read one state module.

## 2. Success criteria

1. **Story parity.**
   - **Scroll 0:** the orb and its rings look exactly as they do today.
   - **0.6 × hero:** a visible trail rises off the setting limb.
   - **Work rows in view:** a faint blue ribbon sits behind the rows.
   - **Page bottom:** the ribbon visibly feeds the horizon rim.
   - **Reversibility:** scrolling back up reverses every step.
2. **Readable.**
   - Behind every statement word, the sky behind the glyph box stays dark enough for `--color-dim` (#7c818b) text to keep at least 4.5:1 contrast.
   - This is measured from screenshots at the brightest point of the ribbon.
3. **Smooth.** The redesign spec's §2.4 still holds on a production build:
   - p95 frame time 17 ms or less, no frame over 50 ms, and CLS under 0.05.
   - The scripted scroll now drives Lenis with wheel events.
4. **Cheap at rest.**
   - The sky makes 0 GPU calls when all of these hold: the orb and horizon are off screen, the pointer and light are still, and star coast velocity is below rest.
   - Each tick reads no layout, and the edge light reads no layout.
5. **Coast.**
   - After a wheel scroll down stops, the stars keep moving up for at least 0.5 s.
   - The sky makes no draws from 2.5 s after the scroll stops.
6. **Works everywhere.**
   - **Reduced motion:**
     - Lenis is off, so scrolling is native.
     - There is no coast, shed animation, magnet, blur-in or row slide.
     - The light follows the cursor without easing.
     - The marker jumps instead of gliding.
   - **Touch:** native scroll momentum and no edge light. Content never depends on hover.
   - **No WebGPU:** the CSS sky as today. Lenis, the edge light and the micro-interactions still run, because none of them need the GPU.
   - **No JavaScript:** headline words are visible and anchors jump natively.
7. **Green checks:** lint, typecheck, `bun test`, `bunx vgpu check src/components/sky/sky.wgsl` and `next build`.

## 3. Lenis and the shared loop

### 3.1 `src/components/smooth-scroll.tsx` (new, client)

It is mounted once in `layout.tsx`, beside `<Sky />`, so every route has it.

- **When:** only under `(prefers-reduced-motion: no-preference)`. If the preference changes, it is created or destroyed.
- **Instance:** `new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, lerp: 0.1, anchors: false })`.
  - `syncTouch: false` keeps the phone's native momentum.
- **Ticker:** `flight`'s single `gsap.ticker` callback calls `flight.lenis?.raf(time * 1000)` first, then updates the shared state, then runs subscribers. One callback guarantees the order.
  - `gsap.ticker.lagSmoothing(0)`.
  - `lenis.on("scroll", ScrollTrigger.update)`.
- **Styles:** imports `lenis/dist/lenis.css`.
- **Hand-over:** Lenis ignores native scrolls mid-glide and then writes its own position back. So a scroll key (PageUp, PageDown, Home, End, Space, the up and down arrows) or a focus change during a smooth glide stops and restarts Lenis, which drops the glide where it is and lets the native scroll stand.
- **Sharing:** the instance is exposed through `flight.lenis` (§3.2) for `scrollToSection`.

### 3.2 `src/lib/flight.ts` (new): shared motion state

A module singleton. It is not React state and causes no re-renders. One `gsap.ticker` callback, registered first, updates it once per tick.

| Field | Meaning |
|---|---|
| `scroll` | `window.scrollY` this tick, which Lenis has already applied. |
| `velocity` | Scroll velocity in px/s, from `scroll` deltas over `dt`, clamped to ±6000. A change of more than 400 px in one tick is a jump (End, a late scroll restore, a hash), not a scroll, and has zero velocity. A 1.2 s glide across the page moves about 250 px in its first tick even at 30 fps. |
| `pointer` | `{ x, y, nx, ny, active }`, where `active` is true for a fine pointer inside the window. |
| `light` | The eased light in page space `{ x, y }`, plus `hover` (0..1). It is moved here from `renderer.ts`, with the same `approach()` easing and rest point (`restingLight(hero)`). The easing is only asymptotic, so the light lands on its target once within 0.5 px, and `hover` once within 0.002: a settled light then stops changing the frame. The light takes its resting place only once the hero is measured (or the pointer is active), so it never eases in from the page's corner. |
| `coast` | `{ v, offset }`: the star coast (§4.2). |
| `lenis` | The Lenis instance, or `null`. |

- **Subscription:** `onTick(fn)` lets the sky and the edge light subscribe in order, after the update.
- **Settling:** `settling()` is true while the light, hover or coast is still easing, so subscribers know whether to keep drawing.
- **Hero anchor:** `flight` stores the hero anchor rect, set by the sky's `measure`, so it can compute the resting light.

### 3.3 Scrolling to a section

- `scrollToSection(id)` calls `flight.lenis.scrollTo(top, { duration: 1.2, easing: easeOutQuint })` when Lenis is running.
  - `top` is the element's page top minus its computed `scroll-margin-top`, read once per call. A number target avoids depending on whether Lenis honours `scroll-margin`.
  - `easeOutQuint` matches `--ease-out-quint`.
- Otherwise it calls `element.scrollIntoView()`, which honours `scroll-margin`.
- `ScrollToPlugin` is no longer registered or imported.

### 3.4 Renderer on the ticker

- `renderer.ts` stops using its own `requestAnimationFrame`. It subscribes to `flight.onTick`.
- **On-demand drawing:** a tick draws only if one of these holds:
  - it is dirty (scroll changed, resize, re-measure)
  - `flight.settling()`
  - the orb intro is easing
  - it is an ambient frame (§4.4)

  Any other tick returns before touching the GPU.
- **Removed listeners:** the renderer's own `scroll` and `pointermove` listeners go. `flight` owns them.
- **Kept:** the renderer still owns resize, load, fonts, visibility, motion-query and device-lost handling.

## 4. The sky

### 4.1 Trail: shed, carry, gather

> The shed now peels off the settling horizon, and the trail gathers into the resting one: see the [eclipse to horizon spec](2026-10-09-eclipse-to-horizon-design.md), §5.4–5.5.

**New anchor:** `data-sky-anchor="work"` on `#work`.

**Uniforms.** New fields on `Params` (WGSL order respects `vec4f` alignment):

| Uniform | Meaning |
|---|---|
| `trail: vec4f` | `shed` (0..1), `carry` (0..1), `gather` (0..1), and `starScroll`: the stars' virtual scroll, `scroll + coast.offset` (§4.2). |
| `span: vec2f` | `workTop` and `contactTop`, in page y: where the ribbon runs. |

**JS values, in `sky-math.ts` as pure functions with bun tests:**

- `shed = ease(0.04, 0.4, dep)`, where `dep` is the existing `departure`.
  - It is 0 at rest and full well before the orb finishes fading.
  - The orb sinks at twice the page speed, so its limb leaves the viewport near `dep = 0.26` (at both 1440 × 900 and 390 × 844). Most of the shed has to happen before then to be seen. The first draft, `ease(0.12, 0.85, dep)`, peaked after the limb had gone.
- `carry = ease(0, 0.35, dep) * (1 - 0.4 * rise)`.
  - The ribbon is present once the orb starts leaving and dims slightly as the horizon takes over.
- `gather = rise`.
- **Reduced motion:** `shed = 0` and `carry = 1`, so the ribbon is still nebula. `gather` keeps today's reduced-motion rise.

#### Shed (`sky.wgsl`, inside the orb branch)

- Above the limb, so `outward.y < 0` and `0 < dOrb < 0.9 R`, wisps stream away from the limb in page-up.
- **Texture:** `fbm` at `(angle * 14, along * 1.6 − shed * 2.5 − t * 0.03)`, thresholded `smoothstep(0.42, 0.8)` and fading `exp(−1.6 · along)` toward the tip. That makes narrow streamers that visibly peel as you scroll; they don't depend on time alone.
- **Length:** grows with `shed`, from `0.15 R` to `0.9 R`.
- **Colour:** from the band blue (`0.47, 0.70, 0.96`) at the limb to the nebula blue (`0.16, 0.24, 0.52`) at the tip.
- **Brightness:** at most about 0.3 added luminance, right at the limb, thinning well before the hero copy (strength 0.45). The first draft's 0.18 read as part of the halo. The trail's strength is `shed * (1 - vis*0.5)`, so it brightens as the orb fades. The light hands over; it doesn't vanish. The shed is gone before Work, so §2.2's contrast is unaffected (measured ≥ 4.82:1 at 1440 and ≥ 5.03:1 at 390).
- The orb's current geometry, rings and flares are unchanged.

#### Carry (new branch, after the nebula)

- **Path:** a ribbon in page space between `span.x` and `span.y`. Its centre line is

  `x(y) = W * (0.5 + 0.30 * sin(y / 900 + 1.1) + 0.08 * sin(y / 310))`

  It winds gently across the width.
- **Width:** about `0.22 W`, with an `exp` falloff from the centre line.
- **Texture:** a domain-warped `fbm3`, at the nebula's 0.55 parallax (`page.y - scroll * 0.55`), so it reads as deep.
- **Colour:** the nebula's palette, biased toward blue (`0.20, 0.34, 0.70`).
- **Strength:** at most `0.10 * carry` added. A `readability` term multiplies it to keep §2.2. Initially that is `0.55` inside the content column (`|x − W/2| < 0.36 W`) and `1.0` outside. It is tuned until the §2.2 measurement passes.
- **Cost:** it is computed only within `0.5 W` of the centre line, and only when `carry > 0.003`.

#### Gather (inside the horizon branch, plus a ribbon bend)

- **Bend:** within `900 px` above `contactTop`, the ribbon's centre line bends toward `foot.x` by `gather * smoothstep(contactTop − 900, contactTop, y)`. It also narrows to `0.08 W`.
- **Wisps:** thin `fbm` streaks above the rim run along the arc toward its centre, at most 0.08 added.
- **Rim:** the rim's brightness gains `+ 0.25 * gather * smoothstep(0.6, 1.0, gather)`. It lights up as the wisps arrive.

### 4.2 Stars: three layers and coast

**Coast (in `flight`, pure helpers in `sky-math.ts`):**

| Constant | Value |
|---|---|
| `COAST_GAIN` | 0.5 |
| `COAST_MAX` | 800 px/s |
| `COAST_RISE` | 6 /s, while the coast is gaining speed or reversing |
| `COAST_DECAY` | 2 /s, while it is letting go |
| `COAST_REST` | 4 px/s |

- `target = clamp(velocity * COAST_GAIN, ±COAST_MAX)`.
- `coast.v = approach(coast.v, target, dt, rate)`, then `coast.offset += coast.v * dt`.
  - `rate` is `COAST_DECAY` when `target` has the same sign as `coast.v` (or is 0) and a smaller magnitude. Otherwise it is `COAST_RISE`.
  - Two rates are needed because Lenis already eases the scroll to a stop over about a second. A single fast rate would let go in step with Lenis and leave no visible coast.
- The coast is at rest when `|coast.v| < COAST_REST` and `|velocity| < COAST_REST`. Then `coast.v` snaps to 0 and the sky stops drawing.
- The first tick after load primes `scroll` with zero velocity, so loading mid-page or at a hash gives no kick. Later jumps (§3.2) give none either.
- **Reduced motion:** `coast.v = 0` always.
- **Size:** after a stop from the cap, the remaining glide is at most `800 / 2 = 400` px of virtual scroll.
  - The near layer moves about 68 px on screen in that time, and the far layer about 16 px.
  - It rests within about 2.7 s from the cap, and about 1–1.5 s after a typical wheel scroll.

**Layers (`sky.wgsl`):** the current two `stars()` calls become three. Each layer's screen offset is `starScroll * k`.

| Layer | k | Cell | Density threshold | Size | Brightness | Twinkle speed | Pointer parallax |
|---|---|---|---|---|---|---|---|
| Far | 0.04 | 9 px | 0.988 | 0.08 | 0.40 | t | ×0.6 |
| Mid | 0.08 | 23 px | 0.980 | 0.07 | 0.65 | t × 0.8 | ×1.2 |
| Near | 0.17 | 47 px | 0.975 | 0.06 | 0.95 | t × 0.6 | ×2.0 |

- Steady-scroll screen speeds come out near 6%, 12% and 25% of scroll speed.
- Star placement is in screen space plus the per-layer offset. The near layer gets a 1.5× core size.
- Occlusion (`occ`) applies to all three layers, as now.

### 4.3 Light

- The shader's `light` and `hover` uniforms now come from `flight.light`, unchanged in meaning.

### 4.4 Frame policy (replaces the redesign spec's §4.5 bullets where they differ)

- **Redraw on change:** a tick draws if scroll changed, after a resize or re-measure, or while `flight.settling()`. That includes the light easing and the coast above rest.
- **Ambient:** at most every 33 ms while the orb is visible, the horizon has `rise > 0`, or `shed` is above 0 and below 1. Time advances only on those frames.
- **Trail in Work is static:** time is frozen while only the ribbon is on screen.
- **Idle, hidden tab and device lost:** as in the redesign spec.

## 5. Edge light

### 5.1 Targets

Elements marked `data-catch-light`:

- each project `[data-hairline]`
- the work list's bottom rule, moved from a border onto a `<div data-catch-light class="rule">`
- every `.line-link`
- every `.visit`
- `.say`

### 5.2 `src/components/edge-light.tsx` (new, client)

It is mounted in `layout.tsx`.

**Measure (never during a tick):**
- When: on mount, on `ScrollTrigger` `refresh`, on body resize (one `ResizeObserver`), and after `document.fonts.ready`.
- Each target's page-space rect is cached as `{ el, left, top, width, height }`.

**Each tick** (`flight.onTick`, only while `flight.pointer.active` or `flight.light.hover > 0.002`):
- The light in viewport coordinates is `flight.light − (scrollX, scroll)`.
- For each target whose rect is within 300 px of it, write via `style.setProperty`:
  - `--lx` and `--ly`: the light in element-local px from the top-left
  - `--lb`: the light's height above the element's bottom edge, for underlines anchored to the bottom
  - `--lo`: the hover value
- Write only when the value changed by 0.5 px or more.
- A target that leaves the 300 px band gets `--lo: 0` once.
- A target whose transform is non-identity at measure time is measured from its untransformed layout box. The scaled hairline is the case here, and the glint correctly scales with it.
- **Moving ancestors:** a target inside `[data-hero-copy]` or `[data-rise]` adds those ancestors' current GSAP `y` at each tick. That value comes from GSAP's cache, not layout. It keeps the hero's glints and magnets aligned while the copy drifts.

**CSS (`globals.css`, `@media (hover: hover) and (pointer: fine)` only):**

```css
[data-catch-light] { --lx: -999px; --ly: -999px; --lb: 999px; --lo: 0; }
/* --line is each element's own base gradient; the glint layers over it. */
.hairline, .rule {
  background-image:
    radial-gradient(180px circle at var(--lx) var(--ly), rgb(201 220 255 / calc(0.7 * var(--lo))), transparent 70%),
    var(--line);
}
/* Underlines glint on a ::before twin of the ::after rule, so the rule's 0.22 opacity doesn't dim it. */
.line-link::before, .say::before {
  content: ""; position: absolute; inset-inline: 0; height: 1px; pointer-events: none;
  background: radial-gradient(160px circle at var(--lx) calc(var(--edge) - var(--lb)), rgb(201 220 255 / calc(0.9 * var(--lo))), transparent 70%);
}
.line-link::before { --edge: 9px; bottom: 9px; }
.say::before { --edge: 0.06em; bottom: 0.06em; }
/* The ring catches the light on its 1 px border only. */
.visit { position: relative; }
.visit::before {
  content: ""; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; pointer-events: none;
  background: radial-gradient(120px circle at var(--lx) var(--ly), rgb(201 220 255 / calc(0.8 * var(--lo))), transparent 70%);
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
}
```

- The visual rule:
  - Only the existing 1 px lines and rings brighten, within 160–180 px of the light.
  - Peak `#c9dcff` at 0.7–0.9 alpha.
  - Nothing else changes.

**Reduced motion:** still runs, because it is direct manipulation. `flight.light` is unsmoothed there, matching the sky.

## 6. Micro-interactions

- **Hover:** all use `@media (hover: hover) and (pointer: fine)`, or for JS, a `matchMedia` gate with the same query.
- **Focus:** keyboard focus reaches the same end state with no motion: colour and underline only.
- **Reduced motion:** colour changes only.

### 6.1 Magnetic arrows

- **Targets:** `.visit`, the hero's `.line-link`s, the contact `.line-link`s and "Back to top", marked `data-magnet`.
- **Pure helper:** `magnet(dx, dy, radius = 90, max = 6)` in `src/lib/magnet.ts`, with bun tests.
  - It returns an offset along `(dx, dy)` of length `min(d * 0.3, max) * (1 − smoothstep(0.6·radius, radius, d))`.
  - So it is 0 at the edge and grows toward the centre.
- **Driver:** `edge-light.tsx` reuses its cached rects. For each magnet within `radius + 40` px, it drives `gsap.quickTo(el, "x"|"y", { duration: 0.6, ease: "power3.out" })`.
  - The child `svg` gets a further `0.33 ×` the offset, through its own `quickTo`.
  - Leaving the radius returns to 0 through the same `quickTo`.
- **Transform conflicts:**
  - Magnets never carry `data-rise`. The hero's rise animates the parent `nav`.
  - The existing CSS `transform` hover nudges on the arrow `svg` move to the `translate` property. That leaves `transform` free for GSAP.

### 6.2 Project row hover

On `li[data-project]:hover`, or `:focus-within`:

- `[data-statement]` colour goes from `--color-dim` to `--color-mute` over 0.5 s.
  - The read-along still writes each word's `opacity`, and colour and opacity compose.
  - Emphasis words stay `--color-ink`.
- The `h3` shifts `translate: 4px 0` over 0.6 s with `--ease-out-quint`, on the `translate` property.
- The light pooling along the hairline comes for free from §5. No extra code.

### 6.3 Section marker

- **Component:** `src/components/section-marker.tsx` (client). The header sits outside `<Motion>`'s scope, so the marker gets its own `useGSAP`.
- **Element:** a `<span aria-hidden data-marker class="orb-dot size-[5px] rounded-full absolute bottom-1">` inside the header `nav`, positioned by `x` (GSAP).
  - The links carry `data-section-link="work"` and `data-section-link="contact"`.
- **Active section:** a pure helper `activeSection(scroll, viewportH, sections)` in `src/lib/sections.ts`, with bun tests. It returns:
  - `"contact"` once Contact's top is at or above 60% of the viewport
  - else `"work"` once Work's top is at or above 40%
  - else `null`
- **Driver:** one ScrollTrigger over the whole page. Its `onUpdate` calls the helper with section tops cached at refresh, and acts only when the result changes.
  - The marker tweens `x` to the active link's centre: 0.7 s, `power4.out`.
  - It fades to 0 opacity when `null`.
- **Link positions:** read on refresh, never during a scroll tick.
- **Accessibility:** the active link gets `aria-current="true"`. It is removed when the section is inactive.
- **Reduced motion:** `x` and `opacity` are set instantly. The preference is read on every move, so a change while the page is open applies at once.

### 6.4 Headline blur-in

> The hero's words are now the statement's, staggered 0.04 s: see the [eclipse to horizon spec](2026-10-09-eclipse-to-horizon-design.md), §6.

- **Markup:** the hero `h1` and `.say` render each word in a server-side `<span data-head-word class="inline-block">`. The h1's `text-glow` span keeps wrapping its words.
  - The `h1` loses `data-rise`, and its words animate instead.
- **Hero:** `fromTo("[data-head-word]" in #home, { opacity: 0, y: 16, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6, ease: "power4.out", delay: 0.5, stagger: 0.08, clearProps: "filter" })`.
  - The rest of `[data-rise]` keeps its timing, shifted to start after the last word starts.
- **`.say`:** the same tween with `stagger: 0.1`, triggered once by a ScrollTrigger at `top 85%`.
  - This is a one-shot reveal, deliberately not scrubbed: a blur that scrubs reads as a rendering bug.
  - This is an exception to the redesign spec's §2.3. The read-along statements stay scrubbed.
- **No-JS and reduced motion:** words are visible. The CSS pre-hide is `[data-head-word] { opacity: 0 }`, under `prefers-reduced-motion: no-preference`. The `<noscript>` override in `layout.tsx` gains `[data-head-word]`.

## 7. Files

| File | Change |
|---|---|
| `package.json` | add `lenis@^1.3.26` |
| `src/lib/flight.ts` | new: shared state, ticker update, `onTick`, `settling` |
| `src/lib/sky-math.ts` (+ test) | `trailFrame` (shed, carry, gather) and `coastStep`. Star layer constants live in the shader only. |
| `src/lib/magnet.ts` (+ test) | new |
| `src/lib/sections.ts` (+ test) | new |
| `src/lib/scroll.ts` | Lenis `scrollTo`, else `scrollIntoView`; drop ScrollToPlugin |
| `src/components/smooth-scroll.tsx` | new |
| `src/components/edge-light.tsx` | new: glint variables and magnets |
| `src/components/sky/renderer.ts` | ticker subscription, `flight` inputs, new uniforms |
| `src/components/sky/sky.wgsl` | shed, carry, gather, three star layers |
| `src/components/motion.tsx` | headline blur-in |
| `src/components/section-marker.tsx` | new: section marker |
| `src/components/words.tsx` | new: server-side word spans for the headlines |
| `src/components/hero.tsx`, `contact.tsx`, `work.tsx`, `site-header.tsx` | word spans, data attributes, marker, rule element |
| `src/app/layout.tsx` | mount `SmoothScroll` and `EdgeLight`; noscript selector |
| `src/app/globals.css` | Lenis CSS import, glint rules, `translate`-based nudges, row hover, word pre-hide |

## 8. Verification

- **Checks:** §2.7.
- **Unit (bun, written first):**
  - `shed` and `carry` endpoints and monotonicity
  - coast: comes to rest within 3 s from `COAST_MAX` but still moves after 1 s, honours the cap, reverses quickly, and stays at rest at zero velocity
  - flight: the first tick primes with no velocity, reduced motion holds the coast at 0, the light rests and follows, and `settling` reflects easing
  - `magnet`: 0 at the centre and at the edge, capped at `max`, points toward the cursor
  - `activeSection` thresholds
- **Playwright** (scratchpad `pw/`, production build, Chromium with WebGPU):
  - Screenshots at scroll 0, 0.6 × hero, the Work rows, and the bottom, at 1440×900 and 390×844, judged by eye against §2.1.
  - Contrast (§2.2): with the ribbon at its brightest, sample the sky behind each statement's bounding box with the text hidden, and assert the dim text contrast is at least 4.5:1.
  - Coast (§2.5): wheel down 1200 px, stop, and compare the near-layer star pixels at +0 and +500 ms (moved). Count GPU calls from +2.5 s for 2 s, and assert it is 0.
  - Idle (§2.4): as in the redesign checks, with the pointer still in Work, assert 0 GPU calls.
  - Frame time and CLS (§2.3): the existing scripted scroll, now with wheel events.
  - Edge light: move the pointer onto a hairline and assert `--lo > 0` and `--lx` within that hairline. Move 600 px away and assert `--lo = 0`.
  - Magnet: hover 30 px off a `.visit` centre and assert a translate of more than 0 toward the pointer. Leave, wait 1 s, and assert 0.
  - Marker: scroll to Work and assert `aria-current` on Work and the marker opacity is 1. Scroll to the top and assert none.
  - Blur-in: after 3 s, every `[data-head-word]` has computed `filter: none` and `opacity: 1`.
  - Nav: clicking Work lands with the row clear of the header, as in the existing scroll-margin check.
  - Reduced motion: no Lenis (`html` lacks the `lenis` class), the coast check shows no movement after the stop, and the words are visible at once.
  - Firefox (no WebGPU): no console errors. Lenis, the edge light and the marker all work.
- **Manual:** desktop Safari and iOS Safari. Lenis and `translate` are supported there. Check that the CSS sky plus Lenis feels right.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Lenis plus the fixed canvas: one-frame skew between the copy and the sky | Both update in the same `gsap.ticker` tick (§3.4). The sky reads `scroll` after Lenis applies it. |
| The ribbon behind text hurts legibility | The `readability` mask plus a measured contrast gate (§2.2), not judged by eye. |
| The coast makes idle draws never stop | A hard rest threshold that snaps to 0, and a test asserting 0 draws 2.5 s after a stop. |
| `filter: blur` costs on the hero intro | Only about 6 words, for 1.6 s, `clearProps` after, and only during the page-in. |
| Magnets fight other transforms | Magnets get no `data-rise`, and the CSS nudges move to `translate` (§6.1). |
| Lenis breaks find-in-page, focus scrolling or native anchors | Lenis follows native scroll changes. `anchors: false`, and ScrollLink handles in-page links. Checked in Playwright via focus tabbing. |
| Edge-light writes cost style recalcs | Only targets within 300 px, only on a change of 0.5 px or more, and only while the pointer is active. At most about 5 targets per tick in practice. |
