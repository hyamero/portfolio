# Eclipse to horizon: the hero as one camera move

- **Date:** 2026-10-09
- **Status:** Draft for review, revised after the first preview
- **Builds on:** [portfolio redesign](2026-10-07-portfolio-redesign-design.md) ("the redesign spec") and [motion and light](2026-10-07-motion-and-light-design.md) ("the motion spec"). Everything there stands unless this spec changes it.
- **Boards:** 09 · Eclipse, full stop and 02 · Horizon, on the "Portfolio Hero Variants" Claude Design canvas. Appendices A and B copy their layer values, so this spec doesn't depend on the canvas.

## 1. Intent

The hero opens on board 09, with the statement on the left and an eclipse on the right. Scrolling flies the camera into the eclipse:

- The disc grows about 30×.
- The bright bead on its edge slides round to the top.
- The edge flattens into board 02's horizon, and the bead becomes 02's sunrise.

As Work comes up, the horizon settles slowly to a rest line near the bottom of the screen and stays there for the rest of the page:

- Content rises from behind it, as if from behind the planet.
- While it settles, its glow sheds into the blue trail that runs through Work, and the trail gathers back into it at Contact.
- It becomes Contact's horizon, and the footer sits on its ground.

The sky draws all of it, so the edge stays sharp at any zoom. A GSAP timeline, scrubbed by scroll, choreographs the hero. The content of Work and Contact, the edge light and the micro-interactions are unchanged.

Confirmed with the owner on 2026-10-09:

- **Ends:** 09's composition at rest, and 02's horizon asset at the end of the hero, without 02's typography.
- **Approach:** the eclipse and the horizon are one body in `sky.wgsl`. A scroll-scrubbed GSAP timeline choreographs the body and also fades the copy.
- **Story:** runway, copy out, approach (zoom, pan, level), morph and hold, as §4 describes.
- **After the hold** (feedback on the first preview): the horizon sinks slowly and stays down instead of leaving, and the text is revealed from behind it.

Decided in this spec, for the owner's review:

- **One horizon:** the resting horizon replaces Contact's own. The footer sits on its ground. Once the horizon rests, its rim leans toward the cursor, as Contact's horizon does today.
- **Rest line:** 86% of the screen's height, where Contact's horizon ends today. About 14% of the screen below it is ground.
- **Still at rest:** once settled, the horizon stops pulsing, so the sky draws nothing while you read.
- **Logo:** the header's orb dot becomes 09's eclipse mark. The section marker stays the small blue orb.
- **Page-in:** the halo fades in, then the bead flashes and settles, like the diamond ring at the end of totality.
- **Cursor light in the hero:** the eclipse ignores it, since the sun behind the disc is its light.
- **Fallbacks:** reduced motion drops the runway, the zoom and the reveal. The CSS sky shows the two end frames one after the other down the page, without animating between them (§7).

## 2. Success criteria

1. **Rest is 09.** At scroll 0, at 1440 × 900 and 390 × 844:
   - The shader's disc sits on the eclipse box, with centre and radius within 1 px.
   - The bead is at 135° on the edge.
   - Side by side with board 09, the layers match by eye.
2. **Hold is 02.** At the end of the runway:
   - The edge's apex is at 64% of the canvas height (±1 px), centred, with radius 25/6 × W.
   - The sun is on the edge at 0.38 × W (±1 px).
   - Side by side with board 02, the layers match by eye, with no text on screen.
3. **One move.**
   - Between rest and hold, the bead stays on the edge.
   - Its screen position, the disc's radius and every layer weight change continuously with scroll.
   - Scrolling back reverses it exactly. Nothing catches up over time.
4. **Settles and stays.**
   - After the runway, the horizon eases down to its rest line, 86% of H, over one screen of scroll. It starts at 0.44× the scroll speed and slows to a stop.
   - It stays there to the end of the page and never fades.
   - The motion spec's §2.1 checks for the Work rows and the page bottom still pass, with the trail gathering into the resting rim.
5. **Revealed from behind.**
   - Content below the rim is hidden behind the ground and appears as it rises past the rim.
   - The footer stays visible on the ground.
   - A click on the ground never reaches the content behind it.
   - Focus and anchor scrolling stop with the target above the rim.
6. **Readable.**
   - At scroll 0, the sky behind each dim word of the statement keeps `--color-dim` at 4.5:1 or better, measured as in the motion spec's §2.2.
   - Work's statement words keep 4.5:1 once they're 120 px above the rim. Words still rising past the sun's glare, below that line, are exempt.
7. **Smooth.** The redesign spec's §2.4 holds through the runway and the settle on a production build:
   - p95 frame time 17 ms or less
   - no frame over 50 ms
   - CLS under 0.05
8. **Cheap at rest.**
   - The motion spec's §2.4 holds, with "the orb" read as "the body".
   - The body draws ambient frames (30 fps at most) only in the hero, the runway and the settle.
   - Once it rests, with no scroll and the pointer still, the sky makes 0 GPU calls. Content scrolls under the front layer without redrawing it.
9. **Works everywhere.**
   - **Reduced motion:** no runway, zoom, settle or reveal. The still eclipse scrolls away with the page, Contact keeps a still horizon, and the statement shows at once.
   - **Touch:** native scroll scrubs the same story, and the reveal line never jitters.
   - **No WebGPU:** the CSS eclipse at the top and the CSS horizon in the runway, both still. Contact keeps its CSS horizon and there's no reveal.
   - **No JavaScript:** as without WebGPU, with the statement visible.
10. **Windows.** On the owner's Windows PC, in Chrome and Firefox, the edge, halo and horizon show no seams or faceting.
11. **Green checks:** lint, typecheck, `bun test`, `bunx vgpu check src/components/sky/sky.wgsl` and `next build`.

## 3. Hero

### 3.1 Structure

`#home` keeps `data-sky-anchor="hero"` and `overflow: hidden`, and holds two blocks.

- **Stage:** board 09's layout, at least 960 px tall (880 px below 760 px wide).
  - **Layout:**
    - A flex row with `flex-wrap: wrap-reverse`, items centred and `justify-content: space-between`.
    - Gaps are 40 px between rows and 64 px between columns.
    - Padding is 120 px at the top, 80 px at the bottom and the gutter at the sides.
    - At most 1440 px wide.
    - On narrow screens the eclipse wraps above the copy.
  - **Copy** (`data-hero-copy`): `flex: 1 1 560px`, at most 740 px wide, `z-index: 1`.
  - **Eclipse column:** `flex: 1 1 400px`, at least `clamp(320px, 40vw, 600px)` tall, centring the eclipse box.
  - **Eclipse box:** `data-sky-anchor="eclipse"`, `aria-hidden`, `width: clamp(220px, 28vw, 480px)`, square. The sky measures it, and the CSS eclipse (§7) fills it.
- **Runway:** an empty block, `100svh` tall and `aria-hidden`. It's hidden under reduced motion and holds the CSS horizon (§7).
- **Gone:** the grid-lines overlay, the centred headline and the lede.

### 3.2 Copy

- **h1, the statement:**
  - **Source:** `I’m *Dale Bañares,* a *software engineer and designer* based in the Philippines, working mostly with teams across the EU`, followed by the full stop below.
  - **Words:** rendered with `parseStatement`, where `*…*` marks emphasis with punctuation inside, as in the Work statements. Each word gets its own `data-head-word` span for the blur-in.
  - **Type:** `clamp(1.875rem, 3.4vw, 3rem)`, line-height 1.16, weight 400, −0.045em, `text-wrap: pretty`, in `dim`. Emphasis is weight 500 in `ink`.
  - **Full stop:**
    - A visually hidden "." and an `aria-hidden` bead.
    - The bead is 0.15em with a 0.07em left margin, `#f4f8ff`, with the glow `0 0 0.05em 0.01em rgb(244 248 255 / 0.9), 0 0 0.3em 0.06em rgb(201 220 255 / 0.32)`.
    - It breathes (opacity 0.86 ↔ 1 over 5.2 s), except under reduced motion.
    - It sits inside the span for "EU", so it never wraps alone and blurs in with that word.
- **Links** (`nav` labelled "Start here", `data-rise`):
  - 32 px below the statement, 16 px, −0.025em, 36 px apart, with 4 px rows when they wrap.
  - **"Selected work ↓":** a `ScrollLink` to `#work`.
  - **"Résumé ↗":** opens the résumé in a new tab.
  - **"Email ↗":** `siteConfig.links.email`.
  - Each is a `line-link` with `data-catch-light` and `data-magnet`.

### 3.3 Header

- The logo's dot becomes 09's eclipse mark, `.eclipse-mark` in `globals.css`: 13 px, `#05060a`, with `box-shadow: 0 0 0 1px rgb(240 246 255 / 0.92), 0 0 7px 1px rgb(201 220 255 / 0.55)`.
- `.orb-dot` stays for the section marker.

### 3.4 The rest of the page

- **Footer:** Contact's footer gets a `z-index` above the sky's front layer (§5.6), so it sits on the ground, visible and clickable.
- **Scroll padding:** while the sky is live and motion is on, `html` gets `scroll-padding-bottom: calc(14lvh + 24px)`, so focus and anchor scrolling stop above the rim.

## 4. The scroll story

### 4.1 Timeline

One GSAP timeline in `motion.tsx`, under `prefers-reduced-motion: no-preference`, replaces "02 Drift".

- **ScrollTrigger:**
  - Trigger `#home`, start `top top`, end `bottom bottom`, `scrub: true`.
  - It runs while the stage scrolls away and the runway comes into view, about one stage height of scroll.
- **Tweens:** positions are fractions of the timeline, which is padded to 1.

  | Target | Change | Start–end | Ease |
  |---|---|---|---|
  | Copy (`[data-hero-copy]`) | y 0 → −90 px, opacity 1 → 0 | 0–0.30 | `none` |
  | `zoom` | 0 → 1 | 0–0.85 | `power1.inOut` |
  | `pan` | 0 → 1 | 0.12–0.85 | `sine.inOut` |
  | `level` | 0 → 1 | 0.12–0.85 | `sine.inOut` |
  | `morph` | 0 → 1 | 0.25–0.85 | `power1.inOut` |
  | Hold | none | 0.85–1 | none |

  These are starting values. The camera rows live in one exported table, `CAMERA_KEYS` in `src/lib/eclipse.ts`, so tuning is a one-line change.
- **State:**
  - The four channels live on `flight.eclipse`, each 0..1. The sky reads them every tick.
  - On refresh, the trigger writes its end scroll position to `flight.eclipse.end`.
  - So the settle (§5.2) starts exactly where the timeline stops, even when ScrollTrigger ignores a mobile toolbar resize.
- **Same tick:** `scrub: true` sets the timeline's progress inside `ScrollTrigger.update`. Lenis calls that on the shared tick, before the sky draws, so the sky and the copy never disagree by a frame.
- **Reduced motion:** there's no timeline and the channels stay at 0. If the setting changes mid-page, `matchMedia` reverts them.

### 4.2 What each channel does

- **`zoom`:** the disc's radius, on a log scale, so equal scroll gives equal magnification (§5.2).
- **`pan`:** the bead's position on screen, from its spot on the eclipse to 02's sun.
- **`level`:** the bead's angle on the edge, from 135° (upper left) to the top of 02's circle (91.65°). The edge under the bead turns from a diagonal into a level horizon.
- **`morph`:** the eclipse's layers become the horizon's (§5.3).

Pan and level start a beat after the zoom, so the bead doesn't pass under the fading copy. Morph starts later still, so the first stretch reads as a pure zoom.

After the timeline, the settle (§5.2) is plain scroll maths in the renderer, like the orb's setting was.

## 5. The sky

### 5.1 Coordinates

- Coordinates are in viewport CSS pixels, with y down. W and H are the canvas's CSS width and height; the canvas is `h-lvh`.
- Angles `phi` turn anticlockwise from +x with y up, so the unit vector on screen is `u(phi) = (cos phi, −sin phi)`.
- The shader works in page space: the renderer adds `scroll` to every y before upload.

### 5.2 Geometry (`src/lib/eclipse.ts`, pure, unit-tested)

- **Start (09)**, from the eclipse box's page rect and the hero's top:
  - `C0 = (box.left + box.width / 2, box.top − hero.top + box.height / 2)`
  - `R0 = box.width / 2`
  - `phi0 = 135°`
  - The bead is at `B0 = C0 + R0 · u(phi0)`.
- **End (02):**
  - `R1 = 25/6 · W`, which is 02's 12,000 px circle at 1440 wide.
  - `C1 = (W / 2, 0.64 H + R1)`.
  - The sun `S1` is on the circle at x = 0.38 W: `S1.y = C1.y − √(R1² − (0.12 W)²)`. That's 2.5 px below the apex at 1440.
  - `phi1` is the angle of `S1 − C1`: 91.65° at any width.
- **Body,** from the channels:
  - `R = R0 · (R1 / R0) ^ zoom`
  - `phi = phi0 + (phi1 − phi0) · level`
  - `B = B0 + (S1 − B0) · pan`
  - `C = B − R · u(phi)`

  The bead is always on the edge. All channels at 0 give the start, and all at 1 give the end.
- **Settle (`settleFrame`):** once the scroll passes `flight.eclipse.end`:
  - `s = clamp((scroll − end) / H)`.
  - `C.y` and `B.y` gain `(REST − 0.64) · H · (1 − (1 − s)²)`, with `REST = 0.86`.
  - So the horizon eases from 64% to 86% over one screen, starting at 0.44× the scroll speed, and then stays.
  - `vis = intro`. It never fades.
  - The trail is `trailFrame(s, rise, reduced, hasWork)`, unchanged.
- **Reduced motion (`stillFrame`):**
  - Until the scroll passes the middle of Work, the body is the start frame, fixed in page space so it scrolls away with the hero.
  - After that, it's the horizon at rest, fixed in page space where Contact's horizon ends today: centred on Contact, apex 0.15 × Contact's height above its bottom, radius 25/6 · W.
  - The switch happens while neither is on screen. `vis` is 1.

### 5.3 The body (`sky.wgsl`, replacing the orb)

> The body's layers were rebuilt in the [sky polish round](2026-10-10-sky-polish-design.md) (§3–§4): its corona, air and lens replace the board ports below.

The shader draws every layer in Appendices A and B analytically around `C` and `R`, with `d = |p − C| − R`, the distance in px outside the edge. `morph`, written `m` below, blends them.

- **Extents:**
  - Each reach blends geometrically, `a · (b / a) ^ m`, from 09's size (a multiple of R) to 02's size in px.
  - So the halo grows with the zoom at first, then thins instead of filling the screen at 30×.
  - `haloFrame(m, R)` computes these in TS:
    - edge ring: 0.18 R → 22 px
    - inner glow: 1.2 R → 100 px
    - outer haze: 2.4 R → 100 px
  - The edge line's glows blend from 9 → 4 px and from 30 → 22 px. These are constants in the shader.
- **Colour and strength** crossfade with `m`:
  - The inner glow and the haze become 02's band and bloom.
  - The even edge ring becomes 02's rim, which is full within 0.05 W of the sun and falls to about a tenth at the screen edges. In this fit to Appendix B's mask, `s` is the signed arc length from the bead, positive to the right, and σ is 0.18 W to the left and 0.21 W to the right:

    `0.1 + 0.9 · exp(−(max(|s| − 0.05 W, 0) / σ)²)`

  - 02's faint full-width edge line (alpha 0.28) fades in under the rim.
- **Details that fade:**
  - The rays (09's streamers) are gone by `m` = 0.5.
  - The prominences and Baily's beads are gone by `m` = 0.35.
  - All of them are placed by angle relative to the bead, so they turn with `level`.
- **Bead to sun:**
  - The glare is a camera effect, so it's sized in px rather than scaling with the zoom. `sunFrame(m, W)` gives:
    - core radius 5 → 3
    - glare radius 120 → 60
    - horizontal streak half-length 200 → 560 · W / 1440
    - vertical streak half-length 150 → 70
  - The horizontal streak stays horizontal on screen. By the hold it lies along the level edge as 02's glint.
  - The glare is additive and sits over everything.
- **Body fill and ground:**
  - 09's dark radial fill becomes 02's flat ground, with its thin lit band just inside the edge. Those stops are 36 px and 6 px at every width.
  - The ground hides the stars, the nebula and the ribbon, with a 2 px soft edge, so nothing below the rim changes with scroll.
- **Pulses:** 09's bead pulse (5.2 s) and breathing glow (7 s) crossfade into 02's glint pulse (6 s) by `m`. No pulse changes period mid-scroll.
- **Intro:**
  - `vis` follows the intro: 2.4 s, from the redesign spec.
  - The bead's brightness follows `beadFlash(intro) = smoothstep(0.5, 0.8, intro) + 0.5 · exp(−((intro − 0.8) / 0.08)²)`. It's dark until halfway, flashes to 1.5× at 0.8 and settles to 1.
- **Horizontal sizes** in Appendix B (band, bloom, glint and mask) scale with W / 1440. Vertical sizes and the sun's core and bloom stay in px.
- **Angles:** any angular term wraps across ±π, so there's no seam at the disc's left.
- **No float hashing:** the body hashes nothing in floats. Any noise goes through `hashCell`, from the seams fix.
- **Light:**
  - The eclipse ignores `light` and `hover`.
  - Once the horizon rests, the centre of the rim's bright stretch leans toward the cursor, as Contact's horizon does today: `mix(sun.x, light.x, 0.5 · hover · s)`.
- **Nebula:** the orb's and the Contact horizon's nebula terms are removed. The margin term stays.

### 5.4 Shed

The shed now peels off the settling horizon instead of the setting orb.

- **Scale:** `Rs = 0.95 H` stands in for the orb's radius, which was about 0.95 × the hero's height, so the streamers keep their size.
- **Length:** `Rs · mix(0.15, 0.9, shed)`, measured up from the edge.
- **Across:**
  - `lat = (x − sun.x) / Rs` replaces the angle from the top. The shed gathers around the sun instead of spanning the whole 6,000 px arc.
  - The crown is `1 − smoothstep(0.6, 1.1, |lat|)`.
- **Fading:** its strength also fades as the horizon comes to rest, × `(1 − ease(0.5, 1, s))`, handing over to the ribbon.
- **Unchanged:** texture, colour and strength are as in the motion spec's §4.1. Carry is unchanged too.

### 5.5 Gather

Contact's horizon (`foot`) is removed, and the resting horizon takes its place.

- The ribbon's bend near `contactTop` aims at the sun's x instead of `foot.x`.
- The gather wisps run along the resting rim toward the sun.
- The rim gains `+ 0.25 · gather · smoothstep(0.6, 1, gather)` as they arrive.
- `gather` is Contact's `rise`, as today.

### 5.6 The front layer: content behind the horizon

The reveal comes from a second canvas that draws the ground over the content.

- **Canvas:** `sky-front`, fixed over the bottom 38% of the large viewport (from 0.62 H down), above the page content and below the header and the footer.
- **Pass:**
  - A second effect from `sky.wgsl` draws it, with `layer = 1` and `origin` set to the canvas's top in the viewport, in the same frame as the back canvas.
  - Pixels more than 3 px above the rim return transparent at once.
  - The rest are computed exactly as in the back pass and written premultiplied, with alpha 1 up to 1.5 px above the rim, falling to 0 by 3 px.
- **Result:**
  - The ground, the rim line and the sun's lower glare sit over the content, pixel for pixel the same as behind it.
  - Everything above the rim stays behind the content.
  - Because the layer is fixed, the reveal line never jitters, even when touch scrolling moves the content a frame ahead of the sky.
- **Active:** from the runway's end onward. Before that it's cleared, so the hero copy never goes behind the eclipse.
- **Draws:** only when the body or its light changes, which means during the settle, on a resize, or when the cursor's lean moves. At rest, content scrolls under it with no draws.
- **Pointer:**
  - `pointer-events: auto`, with a `clip-path: circle()` that matches the planet.
  - The ground takes clicks meant for hidden content, and the clear area above the rim lets clicks through.
  - The clip follows the body during the settle and is static at rest.
- **Off:** not under reduced motion or without WebGPU. A lost device takes it down with the back canvas.

### 5.7 Uniforms

New fields on `Params`. The WGSL order respects `vec4f` alignment.

| Uniform | Contents |
|---|---|
| `body: vec4f` | `C.x`, `C.y` (page), `R`, `vis` |
| `sun: vec4f` | `B.x`, `B.y` (page), `morph`, bead brightness |
| `halo: vec4f` | ring, glow and haze reach (px), rays |
| `glare: vec4f` | core, glare, horizontal and vertical streak (px) |
| `settle: f32` | `s`, for the cursor's lean and the shed's fade |
| `layer: f32` | 0 for the back pass, 1 for the front |
| `origin: f32` | the front canvas's top in the viewport (px) |

`orb`, `heroHeight`, `foot` and `footWidth` are removed. Everything else is unchanged.

### 5.8 Frame policy

- The four channels, `end` and `settle` join the renderer's change check, so a resize or a reduced-motion switch redraws.
- **Ambient (back canvas):**
  - Applies while the body is visible (`vis > 0.001` and its reach overlaps the viewport) and still moving: in the hero, the runway and the settle (`s < 1`).
  - Frames come at most every 33 ms, and time advances.
  - At rest, time stops for the body as it does for the ribbon in Work.
- **Front canvas:** draws only when its own inputs change (§5.6).
- Otherwise, the frame policy is as in the motion spec's §4.4.

## 6. Page-in

- The statement's words blur in as the headline's did (the motion spec's §6.4). The stagger is 0.04 s, since the statement has about 20 words, not 5. The links fade up after.
- The eclipse lights up as §5.3's intro describes. The bead's flash lands about 1.25 s after the sky starts, as the last words begin to resolve.

## 7. Fallbacks

> The CSS sky is now shader-rendered stills and a star map: see the [sky polish round](2026-10-10-sky-polish-design.md) §6–§7.

- **Reduced motion:**
  - No runway, timeline, settle or front layer.
  - The shader draws the still eclipse in the stage, scrolling with the page, and a still horizon at Contact (`stillFrame`, §5.2). Time stays frozen as today, so nothing pulses.
  - The trail is as today under reduced motion.
- **No WebGPU (the CSS sky):** the two end frames, one after the other down the page.
  - **CSS eclipse:** Appendix A's layers in the eclipse box, with their CSS animations.
  - **CSS horizon:** Appendix B's layers in the runway, with the rim at 64% of the runway's height, where the shader's hold frame would put it.
  - **Contact:** keeps its CSS horizon (`ContactSky`), and there's no reveal.
  - **Live sky:** all of these are `.sky-fallback`, so they're hidden once the sky is live.
  - **Stars:** the hero's twinkle stars stay, with a few added above the CSS horizon.
- **No JavaScript:** as without WebGPU. The statement is visible through the existing `<noscript>` rule.
- **Touch:** native scroll scrubs the same story.

## 8. Removals

- `orbFrame`, `horizonFrame` and `departure`, with their tests.
- The shader's orb branch: limb, atmosphere band, halo, orbit rings and flares.
- The shader's Contact horizon branch.
- The `orb`, `heroHeight`, `foot` and `footWidth` uniforms.
- The CSS orb, rings, flares and glows in `HeroSky`.
- "02 Drift", the hero's grid lines, the centred headline and the lede.

## 9. Files

| File | Change |
|---|---|
| `src/lib/eclipse.ts` (new) | `startFrame`, `endFrame`, `bodyFrame`, `settleFrame`, `stillFrame`, `haloFrame`, `sunFrame`, `beadFlash`, `CAMERA_KEYS`, `REST` |
| `src/lib/eclipse.test.ts` (new) | §10's unit tests |
| `src/lib/flight.ts` | `eclipse` state: `zoom`, `pan`, `level`, `morph`, `end` |
| `src/lib/sky-math.ts` and its test | `orbFrame`, `horizonFrame` and `departure` removed |
| `src/components/hero.tsx` | stage, statement, links, eclipse box and runway |
| `src/components/motion.tsx` | the eclipse timeline replaces "02 Drift"; the statement's stagger |
| `src/components/sky/sky.tsx` | the front canvas |
| `src/components/sky/renderer.ts` | measures the eclipse box; computes the frames and uniforms; drives both passes and the front canvas's clip |
| `src/components/sky/sky.wgsl` | the body replaces the orb and the Contact horizon; the shed and gather are adapted; the front pass; new uniforms |
| `src/components/sky/fallback.tsx` | the CSS eclipse and the CSS horizon replace the CSS orb |
| `src/components/contact.tsx` | the footer's `z-index` |
| `src/components/site-header.tsx`, `src/app/globals.css` | the eclipse mark; the scroll padding |
| `docs/superpowers/specs/2026-10-07-*.md` | once shipped, the hero, orb, drift, Contact horizon and fallback sections point here |

## 10. Verification

- **Checks:** §2.11.
- **Unit (bun, written first):**
  - **`startFrame`:** centre and radius from the box, and the bead at 135° on the edge.
  - **`endFrame`**, at 1440 × 900 and 390 × 844:
    - `R1 = 25/6 · W`.
    - The apex is at 0.64 H and the centre at W / 2.
    - The sun is on the circle at 0.38 W.
  - **`bodyFrame`:**
    - All channels at 0 give the start and all at 1 give the end, within 1e−6 relative.
    - For 100 sampled channel sets, `|B − C| = R`.
    - `R` rises with `zoom` by a constant ratio per step.
    - A 0.001 step in any channel moves `B` by less than 1 px and changes `R` by less than 0.5%.
  - **`settleFrame`:**
    - Nothing moves before `end`.
    - The apex reaches 0.86 H one screen after `end` and stays there.
    - It never moves faster than 0.44× the scroll, and it never moves up.
    - `vis` stays at the intro's value.
  - **`stillFrame`:** the eclipse is in the hero before the switch, and the horizon sits at Contact after it. At the switch, neither is within the viewport at 1440 × 900 or 390 × 844.
  - **`haloFrame` and `sunFrame`:** 09's values at `m` = 0, 02's at `m` = 1, and monotone in between.
  - **`beadFlash`:** 0 at 0 and at 0.5, a peak of at least 1.4 near 0.8, and within 0.01 of 1 at 1.
  - **`CAMERA_KEYS`**, built into a GSAP timeline on a plain object (GSAP core runs in bun):
    - At progress 0 every channel is 0, and at 0.85 and 1 every channel is 1.
    - `pan`, `level` and `morph` stay 0 until their start.
    - No channel ever decreases.
  - The rest of `sky-math`'s tests are unchanged.
- **Playwright** (scratchpad `pw/`, production build, Chromium with WebGPU, 1440 × 900 and 390 × 844):
  - **Screenshots** at these points, judged by eye against boards 09 and 02 (§2.1–2.4):
    - scroll 0
    - 25%, 50% and 75% of the runway
    - the hold, mid-settle and at rest
    - the Work rows and the bottom
  - **Geometry:**
    - At scroll 0, the pixel at the eclipse box's centre is dark and the edge at `R` is bright.
    - At the hold, the brightest pixel in the row at 0.64 H is within 2 px of 0.38 W.
    - At rest, the rim's apex is at 0.86 H (±1 px).
  - **Reveal (§2.5):**
    - With a Work row straddling the rim, pixels just below the rim show the ground and pixels just above show the row's text.
    - At the bottom of the page, the footer's text is visible.
    - A click on the ground over a hidden link doesn't navigate.
    - Tabbing to a link that's behind the ground scrolls it above the rim.
  - **Contrast (§2.6):**
    - At scroll 0, hide the text, sample the sky behind each dim word, and assert at least 4.5:1.
    - In Work, the same check applies to each word that's 120 px or more above the rim.
  - **Smooth and idle (§2.7, §2.8):** run the scripted wheel scroll through the runway and the settle. Once the horizon rests, assert 0 GPU calls in Work with the pointer still.
  - **Reduced motion:** the hero is the stage alone, the statement shows at once, the eclipse scrolls away with the page, and Contact shows a still horizon.
  - **No WebGPU** (Firefox with WebGPU off): the CSS eclipse at the top, the CSS horizon in the runway, Contact's CSS horizon, and no console errors.
  - **Nav:**
    - "Selected work" from the top lands with the first row clear of the header.
    - "Back to top" from Contact returns to scroll 0 with the eclipse whole.
- **Manual:**
  - The owner's Windows PC, in Chrome and Firefox: no seams on the edge, halo or horizon, and a smooth scrub and settle.
  - Safari on macOS and iOS: the front layer lines up with the back, and touch scrolling reveals cleanly.

## 11. Risks

| Risk | Mitigation |
|---|---|
| The shader port drifts from the boards | The appendices carry the exact values. Both end frames are compared side by side with the boards. |
| The halo floods the screen mid-zoom | Extents blend geometrically down to px sizes (§5.3). Screenshots at 25%, 50% and 75% of the runway check it. |
| The halo behind the statement hurts legibility at rest | The §2.6 gate. If it fails, the halo is dimmed across the copy column, like the ribbon's readability term. |
| The front layer drifts from the back | Both come from the same shader and uniforms, drawn in the same frame. Playwright checks the reveal line at rest. |
| Hidden content can still be clicked or focused | The front canvas takes pointer events inside the planet, and the scroll padding keeps focus above the rim. |
| The ground costs reading space | The rest line is one constant, `REST`, for tuning. 14% of the screen is the starting point. |
| Words rising past the sun are hard to read | They're in transit, and the §2.6 gate starts 120 px above the rim. If that's not enough, the sun's glare dims at rest. |
| Precision with R near 10,000 px | f32 keeps about 0.001 px there, and nothing hashes floats (§5.3). |
| A seam where an angle wraps | Angular terms wrap across ±π (§5.3). |
| The sky and the timeline disagree on where the runway ends | The renderer reads the trigger's own end from `flight.eclipse.end`. |
| A frame of lag between scroll and zoom | `scrub: true` updates inside the shared tick, before the sky draws (§4.1). |
| The page is a screen longer | Only with motion on. "Selected work" glides through the runway in 1.2 s, and reduced motion has no runway. |

## Appendix A: board 09's eclipse

The box is a `clamp(220px, 28vw, 480px)` square. Layers are listed bottom first, and insets are relative to the box.

```text
haze      inset −120%
          radial-gradient(circle closest-side, rgba(52,78,150,.2), rgba(30,46,100,.08) 42%, rgba(12,18,40,0) 100%)
rays      inset −105%; transform: scale(1.35, .92) rotate(−16deg); filter: blur(14px)
          mask: radial-gradient(circle closest-side, #000 30%, rgba(0,0,0,.45) 46%, transparent 80%)
          conic-gradient(from 0deg) of rgba(201,220,255,a), rising and falling over (start°, peak°, end°, a):
          (0, 8, 18, .16) (52, 61, 70, .10) (95, 104, 116, .18) (160, 172, 182, .12)
          (236, 246, 258, .15) (284, 292, 301, .10) (330, 340, 352, .14)
          CSS conic angles θ run clockwise from 12 o'clock, so phi = 90° − θ.
glow      inset −60%; breathes over 7 s (opacity .86 ↔ 1)
          radial-gradient(circle closest-side, rgba(226,236,255,.6) 44%, rgba(176,200,255,.24) 50%,
          rgba(130,160,236,.1) 62%, rgba(96,126,214,.035) 80%, rgba(96,126,214,0) 100%)
ring      inset −9%
          radial-gradient(circle closest-side, rgba(246,249,255,0) 82%, rgba(246,249,255,.9) 84.8%,
          rgba(214,228,255,.38) 88%, rgba(201,220,255,.1) 94%, rgba(201,220,255,0) 100%)
disc      inset 0
          radial-gradient(circle at 36% 32%, #0c0f18 0%, #05060a 52%, #020203 100%)
          box-shadow: 0 0 0 1px rgba(246,249,255,.92), 0 0 9px 1px rgba(226,236,255,.7), 0 0 30px 5px rgba(160,190,255,.22)
prominences
          pink, on the edge, blur .5–.6 px:
          radial-gradient(ellipse at 50% 100%, rgba(255,150,170,.9), rgba(255,110,140,.35) 60%, rgba(255,110,140,0))
          at (92.4%, 76.5%): 14 × 7 px, rotate(122deg) translateY(−4px)
          at (3%, 67.1%): 9 × 5 px, rotate(250deg) translateY(−3px)
baily     at (7.6%, 23.5%) and (23.5%, 7.6%): 3 px #fff, box-shadow 0 0 6px 2px rgba(236,243,255,.75)
          at (30.5%, 4%): 2 px #fff, box-shadow 0 0 5px 1px rgba(236,243,255,.65)
diamond   at (14.6%, 14.6%), 135° on the edge; pulses over 5.2 s (opacity .82 ↔ 1, scale .92 ↔ 1.04)
          glare 240 px: radial-gradient(circle closest-side, rgba(255,255,255,.95) 0%, rgba(240,246,255,.7) 5%,
          rgba(201,220,255,.26) 18%, rgba(201,220,255,.07) 44%, rgba(201,220,255,0) 100%)
          streak 400 × 1 px: linear-gradient(90deg, transparent, rgba(240,246,255,.8), transparent)
          flare 1 × 300 px: linear-gradient(transparent, rgba(240,246,255,.65), transparent)
          core 10 px #fff: box-shadow 0 0 14px 5px rgba(255,255,255,.85), 0 0 44px 14px rgba(201,220,255,.45)
```

## Appendix B: board 02's horizon

Drawn at 1440 × 960 with the horizon at h = 64%. Horizontal sizes scale with W / 1440 (§5.3).

```text
band      2800 × 200 ellipse centred on (50%, h)
          radial-gradient(closest-side, rgba(96,136,224,.13), rgba(96,136,224,0))
bloom     1400 × 340 ellipse centred on (38%, h)
          radial-gradient(closest-side, rgba(150,184,248,.3), rgba(84,120,206,.12) 42%, rgba(40,60,120,.04) 70%, rgba(40,60,120,0))
planet    12,000 px circle, centred, apex at h
          radial-gradient(circle closest-side, #020305 99.4%, #05080f 99.9%, #080c18 100%)
          box-shadow: 0 0 0 1px rgba(150,180,240,.28)
rim       the same circle
          box-shadow: 0 0 0 1px rgba(240,246,255,.95), 0 −1px 4px 0 rgba(214,228,255,.7), 0 −4px 22px 2px rgba(130,168,244,.4)
          masked across the width: linear-gradient(90deg, .12 0%, .55 18%, 1 33%, 1 43%, .5 62%, .18 84%, .08 100%)
sun       at (38%, h + 2 px)
          glint 1120 × 1 px: linear-gradient(90deg, transparent, rgba(236,243,255,.85) 50%, transparent);
          pulses over 6 s (opacity .78 ↔ 1, scaleX .94 ↔ 1)
          bloom 120 px: radial-gradient(circle closest-side, rgba(255,255,255,.9), rgba(214,228,255,.35) 22%, rgba(201,220,255,0) 100%)
          flare 1 × 140 px: linear-gradient(transparent, rgba(236,243,255,.6), transparent)
          core 6 px #fff: box-shadow 0 0 10px 3px rgba(255,255,255,.85), 0 0 34px 10px rgba(201,220,255,.4)
stars     16 twinkles, all above the horizon
```
