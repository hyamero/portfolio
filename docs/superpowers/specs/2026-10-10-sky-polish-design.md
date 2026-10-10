# Sky polish: real in stills, cinematic in motion

- **Date:** 2026-10-10
- **Status:** Draft for review
- **Builds on:** [eclipse to horizon](2026-10-09-eclipse-to-horizon-design.md) ("the eclipse spec"), [motion and light](2026-10-07-motion-and-light-design.md) ("the motion spec") and [portfolio redesign](2026-10-07-portfolio-redesign-design.md) ("the redesign spec"). Everything there stands unless this spec changes it. The camera path, its timeline, the settle, the front layer and the trail's choreography are all unchanged.
- **Prototypes:** the looks were chosen on throwaway WebGPU pages. Appendix A copies every value this spec depends on, so it doesn't need them.

## 1. Intent

A polish round on the vgpu sky: the assets, shaders, atmosphere, light, alignment, shader interactions, realism and wow factor, and the star background.

**Direction:** real, cinematic in motion.
- Wherever people read, the sky looks like a photograph: a real star field, a real corona and real air.
- Spectacle (lens ghosts, star streaks, the signal) appears only while something moves or answers you.

Confirmed with the owner on 2026-10-10:

- **Approach A:**
  - One pass per canvas.
  - `sky.wgsl` split into WGSL modules.
  - All light added in linear space, with a filmic highlight shoulder and a manual sRGB encode.
  - Analytic glows, and no bloom pass.
- **Stars (C):** a photographic field with a Milky Way. Four depths, real brightness spread, star colours, clumping, dust lanes, and streaks on fast scrolls.
- **Corona (B):** board 09's seven streamers, photographed. Fine filaments, earthshine on the moon, the chromosphere, Baily's beads, prominences and the diamond.
- **Air (C):** an orbital sunrise. Rayleigh layers, the sunrise's warm low air by the sun, a green airglow thread, Mie glow, and a night ground with a thin lit band.
- **Interactions (all four, as prototyped):**
  - The cursor lights the sky.
  - The corona answers the pointer.
  - You can aim the flare.
  - Contact's links send a signal.
  - Fast scrolls also streak the stars.
- **CSS sky:** shader-rendered stills. A script renders the real shader headless and writes AVIF stills, so first paint is the same picture the live sky draws.

Decided in this spec, for the owner's review:

- **Intro:**
  - The first paint is totality (§6).
  - The live sky shows the same corona from its first frame. Its intro plays only Baily's beads closing into the diamond, so the crossfade from the CSS sky never jumps.
- **CSS stars:**
  - Built at build time from a TS port of the shader's star hash (§7.2).
  - So the CSS sky's stars sit exactly where the live sky's brightest stars are.
  - The CSS sky has no Milky Way. It arrives with the live sky.
- **Ghosts and streaks:**
  - Over the eclipse's moon, they cross it, as lens artefacts do.
  - Over the horizon's ground, they're hidden: the sun's streaks drop to 15%, and the ghosts are gone.
  - A straight streak cutting across a curved limb read as a misalignment in the prototypes.
- **Not in this round:**
  - the OG and Twitter images and the favicon
  - the header's eclipse mark
  - the layout and the type
  - the camera keys

## 2. Success criteria

1. **Looks chosen.** At the hero, the hold, mid-settle, Work and Contact, at 1440 × 900 and 390 × 844, side by side with the chosen prototype screens:
   - Stars C, corona B and air C match by eye.
   - The Work and Contact layers keep their choreography (the eclipse spec's §5.4–5.5).
2. **One light.**
   - Every layer adds in linear light.
   - No channel clips before the shoulder.
   - Values below 0.62 pass through unchanged.
   - There's no banding in the corona or the air at 8 bits, thanks to the dither.
3. **No seams.**
   - Every hash is an integer hash.
   - Every angular noise samples round a circle.
   - On the owner's Windows PC, in Chrome and Firefox, the corona, the air, the Milky Way and the star field show no seams or faceting.
4. **Aligned.**
   - At the hold and at rest, no streak, ghost or glare edge crosses the ground at more than 15% of its strength above the limb.
   - The sun's core sits on the limb, half hidden.
   - The CSS stills and the live sky agree on the first frame of the crossfade, at 1440 × 900 and 390 × 844:
     - the eclipse's centre and radius within 1 px
     - the CSS horizon's limb within 1 px of the live hold frame at the sun, for widths of 864 px and up
     - the CSS stars within 1 px of the matching live stars
5. **Readable.**
   - The sky behind each dim word keeps `--color-dim` at 4.5:1 or better, measured as in the motion spec's §2.2.
   - This holds at scroll 0, in Work and at Contact, with the pointer resting on the text and with it away.
   - It also holds for the CSS sky at scroll 0.
6. **Interactions.** Each works as §5 describes, is off on touch where §5 says so, and follows §8 under reduced motion.
7. **Smooth.** The redesign spec's §2.4 holds on a production build through the runway, the settle, a fast fling through Work and a signal at Contact:
   - p95 frame time of 17 ms or less
   - no frame over 50 ms
   - CLS under 0.05
8. **Cheap at rest.**
   - With no scroll and a still pointer, the sky makes 0 GPU calls once the horizon has settled, as today.
   - A signal draws for at most 3.5 s, then stops.
9. **First paint.**
   - The stills total 320 KB or less.
   - The CSS star map is 16 KB or less, gzipped.
   - No still is requested on routes without the hero or Contact.
10. **Green checks:**
    - lint, typecheck, `bun test` and `next build`
    - `bunx vgpu check --require-validation` on `sky.wgsl` and `stills.wgsl`
    - `bun run sky:stills --check`

## 3. Architecture

### 3.1 Modules

`src/components/sky/sky.wgsl` becomes a thin entry point.

- **Imports:** it imports from WGSL modules under `src/components/sky/wgsl/` through `@vgpu/wgsl` (already wired in `next.config` for Turbopack). Imports resolve at build time, and the resolver mangles helper names, so modules can't collide.
- **Pure functions:**
  - Modules export pure functions and structs, and never touch a binding.
  - Only the entry point declares `params` and passes values in. Verified: the resolver accepts exported structs and functions, and `vgpu check` validates the result.

| Module | Exports |
|---|---|
| `noise.wgsl` | `pcg`, `cellHash(c: vec2i, seed: u32)`, `u01`, `vnoise`, `fbm(p, octaves, seed)` (normalised to 0..1), `erf` |
| `light.wgsl` | `LUMA`, `shoulder`, `encode` (sRGB), `grain`, `textMask` |
| `stars.wgsl` | `starTint`, `psf`, `starLayer`, `brightLayer`, `bandFrame`, `milky`, `skyField` |
| `corona.wgsl` | `corona`, `moon`, `limbLight`, `prom` |
| `air.wgsl` | `atmosphere`, `groundNight`, `mie` |
| `lens.wgsl` | `sunGlare`, `ghosts` |
| `body.wgsl` | `bodyLight`: the eclipse-to-horizon body composed from `corona` and `air`, used by both entries so the stills can't drift from the live sky |
| `trail.wgsl` | the margin nebula, the shed, the ribbon and the gather, moved from `sky.wgsl` and retuned (§4.5) |

`src/components/sky/wgsl/stills.wgsl` is a second entry point for the stills script (§7). Its `mode` uniform picks what it draws into a float target:

- **0:** `bodyLight` and `sunGlare` only, with no stars, background or grain.
- **1:** the 60 px layer and the bright layer alone, for the star map's check (§7.1).

Today's `hash21` and the float-hashed `stars()` are removed. The grain and dither hash the integer pixel coordinate through `pcg`.

### 3.2 Light

- **Linear light:**
  - Every term is linear light, added.
  - The background is `#06070a` in linear light: (0.00182, 0.00212, 0.00304). So the CSS page background and the sky's empty pixels are the same colour.
- **The shoulder:**
  - Below a peak channel of 0.62, colour passes through.
  - Above it, the peak maps to `1 − d² / (peak + d − 0.62)` with `d = 0.38`, and the colour scales with it, so hue is kept.
- **Encode:**
  - `encode` is the exact sRGB curve. The canvas stays `bgra8unorm`.
  - Then the grain, `(u01(pcg(pixel)) − 0.5) · (0.012 + 0.03 · lum)`, and today's ±0.5/255 dither.
- **Front pass:** writes the encoded colour premultiplied, as today.

### 3.3 Uniforms

`Params` becomes the following. Positions are in page space, as today.

| Field | Contents | Change |
|---|---|---|
| `resolution`, `light`, `pointer`, `dpr`, `scroll`, `hover`, `time`, `layer`, `origin`, `viewHeight`, `settle`, `span` | as today | |
| `body: vec4f` | `C.x`, `C.y`, `R`, `vis` | `vis` is 1 from the first frame (§6) |
| `sun: vec4f` | `B.x`, `B.y`, `morph`, diamond strength (`beadFlash(intro)`) | |
| `glare: vec4f` | core radius, glare radius, horizontal and vertical streak decay (px), from `sunFrame` | values change (§4.4) |
| `trail: vec4f` | shed, carry, gather, the stars' virtual scroll | |
| `velocity: f32` | the stars' scroll speed, px/s: `flight.velocity + flight.coast.v`, 0 under reduced motion | new |
| `beads: f32` | how far Baily's beads are open, `beadOpen(intro)` | new |
| `lift: f32` | a hovered or focused Contact link's lift on the sun, 0..1 | new |
| `pulse: vec2f` | the signal's age in s (< 0 for none), and travel (1, or 0 under reduced motion) | new |
| `textA`, `textB`, `textC: vec4f` | page rects of the hero statement, Work's list and Contact's block (x, y, w, h; w = 0 for none) | new |
| `textK: vec4f` | each rect's strength (the hero's follows the copy's opacity); w unused | new |
| `halo` | | removed with `haloFrame` |

### 3.4 Renderer

`renderer.ts` keeps its shape: one shared tick, draws on demand, two surfaces. Three pieces move out so they can be tested or swapped alone.

- **`src/components/sky/params.ts` (pure, unit-tested):**
  - `skyParams(state)` builds the uniform object from flight's state, the measured rects and the canvas size.
  - The renderer calls it, then diffs the result against the last frame's (§3.6). This replaces today's hand-kept input arrays.
- **`src/components/sky/milky-cache.ts`:** the Milky Way cache (§3.5).
- **`src/lib/signal.ts` (pure, unit-tested):** the lift's easing and the pulse's age (§5.6).

The renderer also measures the `data-sky-text` elements alongside the anchors (`measure`, never in a tick).

### 3.5 The Milky Way cache

`milky()` costs about 22 octaves of value noise per pixel, and it only drifts at 2.5% of the scroll. So it renders into a cache, which the main pass samples.

- **Target:** an `rgba16float` vgpu `target` at half the sky's device resolution.
- **Coverage:** band space, `s = css + offset`, over `[−8, W + 8] × [−8, H + 0.025 · maxScroll + 8]`. That covers the page's whole drift plus the pointer's parallax (≤ 2.4 px).
- **Re-rendered:** on resize, and on a measure that changes the page's height. Never per frame.
- **Channels:** rgb is the band's light. Alpha is `exp(−a²)`, its core profile, which the 8 px and 24 px star layers read at each cell's centre to raise their odds in the band.
- **Sampling:** `textureSampleLevel` with a linear sampler. The cursor light and the text mask apply at sampling, in the main pass.
- **Unchanged per frame:** the 60 px star layer computes its clumping exactly, and the bright layer has none. The CSS star map (§7.2) depends on both matching the TS port.

### 3.6 Frame policy

The eclipse spec's §5.8 stands. Changes:

- **Diff:** a frame draws when any field of `skyParams` differs from the last frame's, except `time` while nothing ambient runs. This replaces the two input arrays.
- **Every tick, not throttled:**
  - while a pulse runs (age < 3.5 s)
  - while the lift eases
  - while `velocity` is non-zero (the scroll moves then anyway)
- **Front canvas:** also redraws for `lift`, `pulse` and the sun's pulse while they change, because the limb's skin and the sun's lower glare sit in its 3 px band.
- **Ambient:** frames (≤ 30 fps, time advancing) run as today, in the hero, the runway and the settle. Twinkle and the corona's drift run only then.

## 4. The look

### 4.1 Stars and the Milky Way (stars C)

`skyField(css, scroll, velocity, pl, ext)` is the sky behind everything: the background, the cached Milky Way, and four depths of stars.

- **Star PSF:**
  - Each star is an energy-normalised Gaussian, σ = 0.62 device px.
  - While the stars move, it smears along y over `velocity × parallax × 0.05 s` (a 0.05 s exposure), integrated exactly with `erf`, so a streak's total light equals the still star's.
- **Brightness:**
  - Flux follows a Euclidean count, `F = flux · min(u^−2/3, cap)` with `u` uniform per star.
  - Most stars are faint, and a few per screen are bright.
- **Colour:** spectral tints from warm K to blue-white B at 55% saturation, normalised to equal luminance (Appendix A.1).
- **Clumping:** each cell's odds scale by `0.45 + 1.1 · fbm(cell centre / 380)`, so the field has clusters and voids.
- **Layers:** Appendix A.1 lists the 8, 24 and 60 px layers and the bright layer with spikes, with their parallax.
  - Stars move with the virtual scroll (scroll plus coast) at their layer's share, as today.
  - A hovered pointer shifts them by up to 8 px × depth.
- **Twinkle:** only the brighter stars, ±16%.
- **The Milky Way:**
  - A band at 26° through (0.62 W, 0.42 H), with a central bulge, cloud structure, ridged dust lanes and a rift.
  - It's tinted cool at the edges and warm in the core, at gain 0.004 (Appendix A.2).
  - It drifts at 2.5% of the virtual scroll. It also raises the odds of the 8 px and 24 px layers in the band.
- **Under text:** each `data-sky-text` rect dims the band and the cursor's light behind it by up to 92%, with a soft edge from 12 px inside to 80 px outside.
- **Extinction:**
  - Where the air or the corona in front is bright, the stars and the band fade: `ext = 1 − 0.9 · smoothstep(0.003, 0.06, lum(front))`.
  - So no star shows through the lit limb.

### 4.2 The eclipse (corona B)

The body's eclipse end, at `m = 0`, in the body's own frame. That frame is turned so the bead sits at the upper left, as today.

- **Corona:**
  - Board 09's seven streamers as helmet-streamer envelopes, widening at the base.
  - Fine radial filaments are sampled round a circle (no seam) at two scales, and drift very slowly.
  - An inner K-corona `x^−20 + 0.1 x^−6` and an outer F/K glow `0.022 x^−2.6`, which fades out between 2.6 R and 4 R.
  - The tint runs from white at the limb to blue outside.
  - Its outer part dims by up to 70% under text.
  - All values are in Appendix A.3.
- **Moon:** dark, with faint earthshine on its maria (0.003) and a soft light from the bead's side.
- **Limb:**
  - **Chromosphere:** a hydrogen-pink arc, thickest by the bead.
  - **Baily's beads:** sunlight through the valleys of the moon's rough limb profile. `beads` opens them, so the intro closes them into the diamond.
  - **Prominences:** two ragged pink flames at 65° and −167° from the bead, flickering slowly.
- **Diamond:** `sunGlare` at `m = 0` (§4.4), at `sun.w` strength.
- **Fading:** the limb features fade out by `m = 0.35`, as today.

### 4.3 The horizon (air C)

As the camera nears, the corona folds onto the limb and becomes air.

- **Fold:**
  - The corona is drawn as if the moon's radius were `Rc = R · (60 / R)^√m`, keeping each pixel's height above the limb.
  - It turns blue, toward (0.55, 0.7, 1), and fades by `(1 − m)³`.
- **Air:**
  - It fades in by `smoothstep(0.2, 0.95, m)` and is drawn from 2 px under the limb to 420 px above it.
  - Heights are measured in `hsc = max(W / 1440, 0.6)` px.
  - s is the arc length along the limb from the sun.
- **Rayleigh layers:**
  - a cyan-white skin (scale height 2.6)
  - a blue band (13)
  - a deep-blue glow fading to space (55)
  - Each is lit by a Gaussian of s: σ is 0.24 W on the right and 0.2 W on the left, with a floor so the night side keeps a thin skin.
- **Orbital sunrise:** by the sun, the lowest air turns orange (scale height 3.5, σ 0.11 W), then amber (9, 0.2 W). It's the page's one warm note.
- **Airglow:** a faint green thread 92 px up, over the night side only.
- **Mie:** a soft forward-scattering glow around the sun, stretched along the limb (0.2 W × 70 hsc).
- **Night ground:** near-black, with board 02's thin lit band inside the edge (scale depth 6 hsc). It replaces 09's moon by `m`.
- **The rim's lean:** once the horizon rests, the lit stretch leans toward the cursor, `s − 0.5 · hover · settle · (light.x − B.x)`, as today. The sunrise stays with the sun.
- **The cursor's light:**
  - The air lifts by up to 90% within the cursor's light.
  - The light is `pl = hover · exp(−|p − pointer|² / (2 · 200²))`.

### 4.4 The sun and the lens

`sunGlare(g, m, d)` is one glare from the diamond (`m = 0`) to the sun on the horizon (`m = 1`). `g` is the offset from the sun, and `d` the height above the limb.

- **Parts:**
  - a saturated core
  - a bloom
  - a veiling glare
  - a horizontal and a vertical streak
  - a faint dispersion ring (red outside, blue inside), which fades out by `m`
- **Sizes:** `sunFrame(m, W)` gives them, blending geometrically (Appendix A.5). The streaks decay exponentially: horizontal 85 → 140 · W/1440 px with a Gaussian tail at 3×, vertical 60 → 24 px.
- **The core at the horizon:** half hidden by the limb, `× mix(1, smoothstep(−2, 1, d), m)`.
- **Streaks at the horizon:** over the ground, they drop to 15%, `× (1 − 0.85 · m · (1 − smoothstep(−1, 1.5, d)))`. Over the moon (`m = 0`), they cross it.
- **Strength:** `k = flash · pulse · (1 + 0.6 · lift) · (1 + 0.7 · near) · (1 + 1.2 · e^(−5 · age))`.
  - `pulse` crossfades 09's 5.2 s breathing into 02's 6 s glint by `m`, as today.
  - `near = hover · (1 − smoothstep(24, 180, |pointer − B|))`.
  - The last factor is the flash as a signal leaves (§5.6).
- **Ghosts:**
  - Five ghosts sit on the line from the sun through the aim point, at 0.3, 0.58, 0.86, 1.22 and −0.24 of it, with the tints and sizes in Appendix A.5.
  - **Aim point:** the viewport's centre, mixed toward the pointer by `hover`.
  - **Strength:** `k · (0.9 · smoothstep(100, 1400, |velocity|) + 0.6 · aim)`, where `aim = hover · (1 − smoothstep(0.35 W, 0.8 W, |pointer − B|))`.
  - **Over the ground:** hidden, `× mix(1, smoothstep(−1.5, 1.5, d), m)`.
  - **Front pass:** never drawn there.

### 4.5 Work and Contact

The margin nebula, the shed, the ribbon and the gather keep their shapes, motion and choreography. They move to `trail.wgsl` with two changes.

- **Retuned for linear light:**
  - Each layer's peak keeps today's on-screen value: its new linear gain is `lin(bg + old) − lin(bg)` at its peak. Then it's judged by eye.
  - The 0.55× dim behind Work's text column is replaced by the `textB` mask.
- **A warm root:** the shed's colour at its root takes the sunrise's amber, (1, 0.6, 0.22) at 25%, fading to today's blue by a third of its length.

## 5. Interactions

Hover effects are off on touch, because `hover` is 0 there. §8 covers reduced motion.

### 5.1 Scroll streaks

- The stars smear by depth with `velocity` (§4.1). Exposure is 0.05 s, so a 6000 px/s fling makes the 60 px layer's streaks about 51 px long.
- The coast still glides on after a stop, and its streaks shorten as it slows.

### 5.2 Ghosts in motion

During a fast scroll, five faint ghosts sweep across the frame on the line from the sun through the viewport's centre (§4.4).

### 5.3 Aim the flare

A hovered pointer within about 0.8 W of the sun swings the ghosts' line through the pointer and brings them up.

### 5.4 The corona answers

In the hero, with a hovered pointer within 3.6 R of the centre:

- The streamers on the pointer's side lean toward it, up to 0.2 rad at 2 R, and brighten by up to 45%.
- The diamond flares by up to 70% within 180 px of the bead.

It fades out by `m`, so the horizon doesn't lean this way. The horizon has its own rim lean (§4.3).

### 5.5 Cursor light

- A soft 200 px light follows a hovered pointer.
- It lifts the Milky Way's dust (×3.5 at its centre), adds a faint blue haze (0.0016) and lifts the limb's air (+90%).
- Behind text it's dimmed like the band, so contrast holds.

### 5.6 The signal

Contact's links (`Email`, `GitHub`, `LinkedIn`, `Résumé` and the large email link) carry `data-sky-signal`.

- **Lift:**
  - While one is hovered or focused, `lift` eases toward 1 (approach rate 6/s), else toward 0.
  - The sun brightens by up to 60%.
- **Pulse:**
  - A click, or Enter on a focused link, starts a pulse: the sun flashes, `1 + 1.2 · e^(−5 · age)`.
  - A bright front runs out along the limb both ways, at 0.55 W per second. It widens from 26 px and fades as `e^(−1.4 · age)`.
  - It lights the skin most (×2.2) and the band a little (×0.5).
  - It's multiplied by `1 − smoothstep(2.5, 3.5, age)`, so it lands at exactly 0 and frames stop at 3.5 s.
  - A second click restarts it.
- **State:**
  - `flight.signal` holds `{ lift, target, at }`.
  - `flight.ts` listens with delegated `pointerover`, `pointerout`, `focusin`, `focusout` and `click` listeners for `[data-sky-signal]`.
  - The click doesn't stop the link's default action.
- **Pure helpers:** the maths lives in `src/lib/signal.ts`: `liftStep(lift, target, dt, reduced)` and `pulseAge(now, at)`.

## 6. Page-in

The CSS sky shows totality: the corona, the moon, the chromosphere and the prominences, but no beads and no diamond. The live sky starts from the same picture.

- **Body:**
  - `body.w` (vis) is 1 from the live sky's first frame, for the eclipse and the horizon alike.
  - The canvas still fades in over the CSS sky in 1.2 s. Because both show the same totality, nothing changes but the fine detail.
- **Beads and diamond:** the intro (2.4 s, the redesign spec) drives only the beads and the diamond.
  - `beadOpen(intro) = mix(−2, 0.12, ease(0.45, 0.8, intro))`: the beads appear one by one and close into the diamond.
  - `beadFlash(intro)` is unchanged: the diamond is dark until halfway, flashes to 1.5× at 0.8, and settles to 1. It lands about 1.25 s after the sky starts.
- **The CSS diamond:**
  - The CSS eclipse keeps a CSS diamond.
  - It fades in with a 1.6 s delay and then breathes (`animate-bead`), but only once `html[data-sky]` is `css`.
  - `sky.tsx` sets `data-sky="pending"` as soon as it finds `navigator.gpu`, and the diamond waits while it's pending.
  - If the sky falls back, it becomes `css` and the diamond plays. If it goes live, the CSS sky hides as today.
  - Hydration sets `pending` well inside the 1.6 s delay, so the paused diamond is still invisible.
  - So a WebGPU visitor never sees two diamonds, and a visitor without WebGPU or JavaScript always sees one.
- **Reduced motion:** the intro is 1, as today. The beads are closed and the diamond is lit from the first frame.

## 7. The CSS sky

### 7.1 Stills

`scripts/sky-stills.ts` (`bun run sky:stills`) renders `stills.wgsl` headless and writes the stills.

- **Rendering:**
  - It renders with `vgpu/node` on the software adapter, so the pixels are the same on any machine.
  - The target is `rgba16float`. The script reads it back with `readFloats()`.
- **Inverting the blend:** the CSS sky composites each still with `mix-blend-mode: screen` over what's under it. So for each pixel the script stores `S = (E − U) / (1 − U)`:
  - `E` is the live sky's encoded colour, which is what's under it plus the still's light, added in linear light, then encoded.
  - `U` is the encoded colour of what the CSS puts under that pixel: the page background outside the body, black inside the moon, and the night ground's base inside the ground.
  - So `screen(U, S) = E`, and the CSS composite equals the live sky's pixel, not an sRGB-space approximation.
- **Encoding:**
  - AVIF through `sharp`, which joins `devDependencies`.
  - Quality 60, 4:4:4 chroma.
- **Outputs:** written to `public/sky/`.

  | Still | Rendered | Shown |
  |---|---|---|
  | `eclipse.avif` | 2048 × 2048, R = 256 px, at totality (no beads, no diamond, hover 0) | Centred on the eclipse box at 4× its width (`inset: −150%`), scaled uniformly. The corona fades out by 4 R, inside its edge. |
  | `horizon-1440.avif` | 2880 × 768 (2×), the hold frame at W = 1440: the strip from 320 px above the apex to 64 px below it, with the sun and its glare | W ≥ 864, scaled uniformly by W / 1440. That's exact, because every size scales with W above 864. |
  | `horizon-390.avif` | 780 × 464 (2×), the hold frame at W = 390 | W < 864, stretched horizontally only. Heights are pinned (`hsc` = 0.6 below 864), so only the limb's curvature drifts, by up to 0.03 · (W − 390) px at the screen's edges, and not at all at the sun. |

- **Manifest:**
  - `src/components/sky/stills.json` records each still's size and render parameters.
  - It also records a SHA-256 of the render parameters and of every `.wgsl` file in `stills.wgsl`'s import closure.
- **Staleness test:**
  - A bun test (`sky-stills.test.ts`, no GPU) recomputes that hash and fails with "run `bun run sky:stills`" when it differs.
  - Editing the trail or the stars never invalidates the stills. Editing the corona, the air or the lens does.
- **`--check`:** re-renders in memory and compares with the committed files. It also verifies the CSS star map (§7.2) against a `mode` 1 render: at least 98% of the map's stars must be within 1 px of a live star, at 1440 × 900.

### 7.2 Stars

- **The TS port:**
  - `src/lib/star-field.ts` ports `pcg`, `cellHash`, `u01`, `vnoise` and `fbm` to TS, with `Math.imul` and `>>> 0` for the u32 maths.
  - It also ports the 60 px layer and the bright layer's star placement.
  - These two are the layers whose stars don't depend on the viewport's size or the Milky Way.
- **The star map:** `brightStars(width, height)` lists their stars at scroll 0 with hover 0: position, flux and tint.
- **The route:** `src/app/sky/stars.svg/route.ts` (`dynamic = "force-static"`) renders them at build time.
  - The SVG is 2560 × 1600: one tinted circle per star, sized and filled so its peak matches the live star.
  - It never goes stale, because it's built from the same code at every build.
- **Display:**
  - `SkyStars`, in `fallback.tsx`, is a fixed full-viewport layer with the SVG as its background, anchored at the top left. The live field's stars are anchored there too.
  - It replaces `HeroStars` and the runway's and Contact's star lists, and their CSS twinkle.

### 7.3 Composition

| Layer | Contents |
|---|---|
| `SkyStars` | §7.2 |
| `EclipseSky` | a black disc filling the eclipse box, `eclipse.avif` over it (`screen`), and the CSS diamond (§6). It replaces the CSS layers. |
| `HorizonSky` (the runway) | the night ground as an ellipse that matches the still's limb (radii `f · R`, `R`, where `f` is the still's horizontal stretch), filled with the ground's base colour; the horizon still over it (`screen`), with the apex at 64% of the runway, as today |
| `ContactSky` | the same horizon composition, with the apex where `stillFrame` puts the reduced-motion horizon: 0.15 × Contact's height above its bottom |
| `SkyGrain` | unchanged |

- **Breakpoint:** the horizon still is picked with `@media (min-width: 864px)`, through `image-set` with AVIF only. A browser without AVIF keeps the ground and stars and loses the glow.
- **Removed keyframes:** `twinkle`, `breathe` and `glint` go, along with the CSS layers that used them.
- **Placement maths:** pure and unit-tested in `src/lib/stills.ts`.
  - `horizonStill(W)` returns the still, its scale and its stretch.
  - `eclipseStill(box)` returns its inset.

## 8. Reduced motion, touch and fallbacks

- **Reduced motion:**
  - `velocity` is 0, so there are no streaks and no ghosts in motion.
  - There's no aim and no corona lean, and the cursor's light is off (`pl = 0`).
  - Time is frozen, as today, so there's no twinkle, drift or flicker.
  - **The signal:** the lift applies at once. A click lights the whole rim (`travel = 0`: the pulse's envelope is applied without a moving front) and fades over the same 3.5 s.
  - Everything else is as in the eclipse spec's §7.
- **Touch:** `hover` is 0, so there's no cursor light, lean or aim. Streaks, ghosts in motion and the signal (tap) work.
- **No WebGPU:** the CSS sky (§7), with the CSS diamond playing. The page is otherwise as in the eclipse spec's §7.
- **No JavaScript:** as without WebGPU. `data-sky` stays `css`.
- **Lost device:** as today.

## 9. Performance

- **Budget:** the redesign spec's pixel budget (2.2 MP, DPR ≤ 1.25) stands.
- **Bounded cost per pixel:**
  - The Milky Way is cached (§3.5).
  - The 8 px and 24 px layers read their band boost from the cache.
  - A star layer's streak loop visits at most `ceil(streak / cell)` rows on each side.
- **Branches:** the corona, the air, the glare and the ghosts each branch out when they can't reach the pixel, as the prototypes do.
- **If §2.7 fails on the measuring machine,** these cuts apply in order, each measured before the next:
  1. Cap the 8 px layer's streak rows at 2.
  2. Drop the 8 px layer while `|velocity|` > 3000 px/s, since it's a blur by then.
  3. Lower the pixel budget to 1.8 MP.

## 10. Removals

- `haloFrame` and the `halo` uniform.
- The shader's board-09 and board-02 CSS ports: `haze09`, `glow09`, `ring09`, `rays09`, `disc09`, `band02`, `bloom02`, `rimMask`, `baily`, `prominence`, the old `glareAt`, `stars()` and `hash21`.
- The CSS sky's hand-built eclipse and horizon layers, the runway's and Contact's star lists, and the `twinkle`, `breathe` and `glint` keyframes.

## 11. Files

| File | Change |
|---|---|
| `src/components/sky/sky.wgsl` | the entry point: `Params` (§3.3), composition, the front pass |
| `src/components/sky/wgsl/*.wgsl` (new) | §3.1's modules and `stills.wgsl` |
| `src/components/sky/renderer.ts` | `skyParams`, the cache, the text rects, the signal, the frame policy (§3.6) |
| `src/components/sky/params.ts` and its test (new) | `skyParams` |
| `src/components/sky/milky-cache.ts` (new) | the Milky Way cache |
| `src/components/sky/sky.tsx` | `data-sky="pending"` |
| `src/components/sky/fallback.tsx` | `SkyStars`, and the still-based `EclipseSky`, `HorizonSky` and `ContactSky` |
| `src/components/sky/stills.json` (generated), `public/sky/*.avif` (generated) | the stills |
| `src/components/sky/sky-stills.test.ts` (new) | the staleness test |
| `scripts/sky-stills.ts` (new) | the stills script and `--check` |
| `src/app/sky/stars.svg/route.ts` (new) | the CSS star map |
| `src/lib/star-field.ts` and its test (new) | the TS port of the star hash and layers |
| `src/lib/stills.ts` and its test (new) | still placement |
| `src/lib/signal.ts` and its test (new) | lift and pulse |
| `src/lib/eclipse.ts` and its test | `beadOpen`; new `sunFrame` values; `haloFrame` removed |
| `src/lib/flight.ts` and its test | `signal` state and its listeners; `eclipse.copy` |
| `src/components/motion.tsx` | the timeline also scrubs `flight.eclipse.copy` 1 → 0 over 0–0.3, alongside the copy |
| `src/components/hero.tsx`, `work.tsx`, `contact.tsx` | `data-sky-text`; `data-sky-signal` on Contact's links |
| `src/app/layout.tsx` | `SkyStars` |
| `src/app/globals.css` | the CSS diamond's gating on `data-sky`; removed keyframes |
| `package.json` | `sharp` (dev); `sky:stills` script |
| `docs/superpowers/specs/2026-10-09-eclipse-to-horizon-design.md` | once shipped, §5.3's layer tables and §7's CSS sky point here |

## 12. Verification

### Checks

§2.10.

### Unit tests (bun, written first)

- **`star-field`:**
  - `pcg`, `cellHash` and `fbm` match known-answer vectors, pinned from one `vgpu/node` run of `noise.wgsl`.
  - `brightStars` is deterministic, keeps every star inside its cell's jitter box, and gives 40–120 stars at 1440 × 900.
- **`signal`:**
  - The lift eases toward its target and lands within 0.002.
  - Under reduced motion it jumps.
  - `pulseAge` is negative with no pulse and restarts on a second click.
  - The pulse's envelope is 0 at 3.5 s and after.
- **`params`:**
  - `velocity` is the sum of scroll and coast speed, and 0 under reduced motion.
  - Text rects are passed in page space, with w = 0 for a missing one.
  - The hero's strength follows `eclipse.copy`.
  - `body.w` is 1 whenever there's an eclipse box.
- **`eclipse`:**
  - `beadOpen` is −2 until 0.45, 0.12 from 0.8, and monotone.
  - `sunFrame` gives 09's values at `m` = 0 and 02's at `m` = 1, and is monotone.
  - The existing tests stay, without `haloFrame`'s.
- **`stills`:**
  - `horizonStill` picks `horizon-1440` from 864 px, scaled by W / 1440 with no stretch.
  - Below 864 it picks `horizon-390`, with a stretch of W / 390 and a scale of 1.
  - `eclipseStill` gives an inset of −150%.
- **`sky-stills`:** the staleness hash (§7.1).

### Shader

`bunx vgpu check --require-validation` on both entry points.

### Playwright

Scratchpad `pw/`, production build, Chromium with WebGPU, 1440 × 900 and 390 × 844.

- **Screenshots** at scroll 0, mid-runway, the hold, mid-settle, at rest in Work, and at Contact. Judged by eye against the prototypes (§2.1).
- **Alignment:**
  - At the hold, with a forced 6000 px/s velocity, the luminance 3–20 px below the limb along the sun's streak is ≤ 15% of the same distance above it.
  - The first live frame and the CSS sky (`data-sky` forced to `css`) are diffed at scroll 0 and at the hold: §2.4's tolerances.
- **Contrast:** as in the motion spec's §2.2, at scroll 0, Work and Contact, with the pointer on the text and away. Also for the CSS sky at scroll 0.
- **Signal:**
  - Clicking Contact's Email link raises the rim's luminance 0.3 W from the sun within 1 s, then lets it fall back below 1.02× its resting value by 3.5 s.
  - GPU submits stop by 3.6 s.
- **Idle:** at rest in Work, with no input for 2 s: 0 submits.
- **Performance:** `pw/voyage.mjs` through the runway, the settle, a fling through Work and a signal: §2.7.
- **First paint:**
  - Network totals for `/sky/*` on `/`: §2.9.
  - `/404` requests no still.

### Owner's checks

- Windows (Chrome and Firefox): seams (§2.3).
- Safari on macOS and iOS: the CSS stills' blend, and the live sky.
- By eye: the cursor's lean and light, the corona's lean, the flare, the signal.

## Appendix A. Values

These are the prototypes' values, in linear light and CSS px unless noted. "Device px" is canvas pixels.

### A.1 Stars

- **Tints** (by `r = u01`, then 55% saturation, normalised to luminance 1):

  | r | Tint |
  |---|---|
  | < 0.1 | (1, 0.64, 0.4) |
  | 0.1–0.35 | (1, 0.82, 0.64) → (1, 0.94, 0.86) |
  | 0.35–0.75 | (1, 0.97, 0.93) → (0.92, 0.95, 1) |
  | > 0.75 | (0.84, 0.89, 1) → (0.68, 0.78, 1) |

- **Layers** (`flux` is scaled by gain 1):

  | Layer | Cell | Odds | Flux | Cap | Halo (σ 2.6 share) | Band boost | Parallax (of virtual scroll) | Pointer shift (× par) | Seed |
  |---|---|---|---|---|---|---|---|---|---|
  | faint | 8 | 0.10 | 0.035 | 10 | 0 | 2.4 | 0.04 | 0.6 | 101 |
  | mid | 24 | 0.13 | 0.09 | 14 | 0 | 1.2 | 0.08 | 1.2 | 202 |
  | near | 60 | 0.16 | 0.3 | 16 | 0.08 | 0 | 0.17 | 2.0 | 303 |
  | bright | 240 | 0.12 | 1.6–4.0 | none | 0.1 | 0 | 0.12 | 1.6 | 404 |

  `par = (pointer − 0.5) · 8 · hover`.
- **Jitter:** a star sits at `(cell + 0.22 + 0.56 · u) · size`. Bright stars sit at `0.3 + 0.4 · u`.
- **Clumping:** `fbm(cell centre / 380, 3, seed + 7)`.
- **Twinkle:** `1 + 0.16 · smoothstep(0.25, 1, F / (flux · cap)) · sin(t · (0.8 + 1.7 u) + 2π u)`.
- **Bright stars' spikes:** length `9 √F` device px, width σ 0.45, weight 0.012, gone once a streak is longer than 8 px.
- **Background:** (0.00182, 0.00212, 0.00304).

### A.2 Milky Way

- **Frame:**
  - centre (0.62 W, 0.42 H)
  - angle 26°
  - half-width `w = 0.2 H`
  - The centre line wanders by `0.9 w · (fbm(along / 700, 1.3) − 0.5)`.
- **Glow:**
  - `core = exp(−a²)`, `wing = exp(−|a| / 1.6)`, with `a = across / w`
  - `lengthwise = 0.55 + 0.7 · fbm(along / 520)`
  - `bulge = exp(−((along − 0.12 W) / 0.5 W)²)`
  - `cloud = fbm(s / 140, 5)`, `grain = fbm(s / 22, 3)`
  - `glow = (core · (0.22 + 1.1 · smoothstep(0.35, 0.85, cloud)) · (0.7 + 0.6 · grain) + 0.22 · wing · cloud) · lengthwise · (0.75 + 0.7 · bulge)`
- **Dust:**
  - `ridge = 1 − |2 · fbm((along / 300, across / 80), 5) − 1|`
  - `lanes = smoothstep(0.62, 0.93, ridge) · exp(−2a²)`
  - The rift is centred at `across = −0.12 w`, σ 0.16 w, gated by `smoothstep(0.35, 0.75, fbm(along / 450))`.
  - `clear = (1 − 0.85 · lanes) · (1 − 0.7 · rift)`.
- **Tint:** (0.6, 0.72, 1) → (1, 0.85, 0.7) by `core · (0.35 + 0.65 · bulge)`, at 55% saturation.
- **Gain:** 0.004. Under the cursor's light it's × (1 + 2.5 pl), plus (0.5, 0.65, 1) · 0.0016 · pl. Both are × (1 − 0.92 · textMask).
- **Drift:** offset (0, 0.025 · virtual scroll) + 0.3 · par.

### A.3 Corona, moon and limb

- **Corona** (`x = r / R`):
  - Seven streamers at 8°, 61°, 104°, 172°, 246°, 292° and 340° of board 09's frame (which undoes its `scale(1.35, 0.92) rotate(−16°)`).
  - Strengths 0.16, 0.10, 0.18, 0.12, 0.15, 0.10 and 0.14; widths 9, 8, 10, 10, 10, 8 and 10° × `(0.5 + 0.8 / x)`; normalised by 0.18.
  - `env = 0.08 + 2.2 · streamers`.
- **Filaments:**
  - `f1 = fbm(dir · (58 + 2.4 ln x) + (0.004 t, 0), 3)`
  - `f2 = fbm(dir · (17 + 1.5 ln x) + (0, 0.003 t), 3)`
  - `fine = clamp(1 + (0.45 + 0.75 · smoothstep(1, 1.8, x)) · (1.1 (f1 − 0.5) + 0.6 (f2 − 0.5)), 0.1, 1.8)`
- **Intensity:**
  - `inner = x^−20 + 0.1 x^−6`
  - `outer = 0.022 x^−2.6 · (1 − smoothstep(2.6, 4, x)) · (1 − 0.7 · textMask)`
  - `I = inner · (0.85 + 0.15 fine) + outer · env · fine`
  - The tint goes from (0.93, 0.96, 1) to (0.58, 0.7, 1) by `smoothstep(1.02, 2.4, x)`.
- **Lean:**
  - The direction is the pointer's; the pull is `hover · (1 − smoothstep(1.3 R, 3.6 R, |pointer − C|)) · (1 − m)`.
  - Angles bend by `0.2 · pull · (x − 1) · sin(dp) · exp(−dp² / 1.2)`.
  - Intensity is × (1 + 0.45 · pull · exp(−dp² / 0.2)).
- **Moon:**
  - earthshine `0.003 · albedo · (0.4 + 0.6 z)`, tinted (0.55, 0.66, 1)
  - The maria are `smoothstep(0.44, 0.62, fbm(uv · 1.7, 4))` and darken by 45%.
  - Plus (0.6, 0.7, 1) · 0.004 · `toward³`.
- **Chromosphere:** (1, 0.24, 0.38) · 0.9, thickness `0.7 + 2.4 · exp(−db² / 0.13)` px around the bead's angle.
- **Beads:**
  - The profile is `fbm(angle · 24, 3)`, and `gap = (0.5 − profile) · 2.4 − |db| · 4.2 + beads`.
  - Light is (1, 0.97, 0.94) · `smoothstep(0, 0.2, gap)` · (3 e^(−(d − 0.5)² / 1.1) + 0.35 e^(−(d − 0.5)² / 9)).
- **Prominences:**
  - at 65° (half-width 7.5, height 9.5, seed 3) and −167° (5.5, 7.0, seed 5)
  - colour (1, 0.26, 0.42); core 0.8, glow 0.3
  - The shape is noise `fbm((t, h) / 2 + (3.7 seed, 0.04 t), 3)`.

### A.4 Air (heights in hsc px)

- **Rayleigh:**
  - skin (0.75, 0.9, 1) · 0.9 · e^(−h / 2.6) · (0.06 + 0.94 lit)
  - band (0.2, 0.42, 1) · 0.3 · e^(−h / 13) · (0.18 + 0.82 lit)
  - deep (0.05, 0.12, 0.42) · 0.12 · e^(−h / 55) · litWide
  - `lit = e^(−(s / σ)²)` and `litWide = e^(−0.2 (s / σ)²)`, with σ = 0.24 W for s > 0 and 0.2 W for s < 0.
- **Sunrise:** (1, 0.33, 0.07) · 1.6 · e^(−h / 3.5) · e^(−(s / 0.11 W)²) + (1, 0.6, 0.22) · 0.5 · e^(−h / 9) · e^(−(s / 0.2 W)²).
- **Airglow:** (0.3, 1, 0.55) · 0.0035 · e^(−((h − 92) / 4)²) · (1 − lit).
- **Mie:** (0.85, 0.92, 1) · 0.05 · e^(−|e|²) · smoothstep(−2, 4, d), with `e = ((x − B.x) / 0.2 W, (y − B.y) / 70 hsc)`.
- **Ground:** (0.0013, 0.0016, 0.0024) + (0.002, 0.003, 0.008) · e^(−depth / 6).
- **Signal:**
  - `front = 0.55 W · age`, width `26 + 50 · age`
  - (0.8, 0.92, 1) · e^(−((|s| − front) / width)²) · e^(−1.4 age) · (2.2 skin + 0.5 band) · (1 − smoothstep(2.5, 3.5, age))
  - With `travel = 0`, the Gaussian term is 1.

### A.5 Sun and lens

- **`sunFrame(m, W)`**, geometric blends:

  | Size | `m` = 0 → 1 |
  |---|---|
  | core | 2 → 1.75 |
  | glare | 120 → 60 |
  | horizontal streak decay | 85 → 140 · W/1440 |
  | vertical streak decay | 60 → 24 |

- **Glare** (`ks = glare / 120`):
  - core `1 − smoothstep(0.8 core, 1.6 core, r)` · 6
  - bloom (e^(−r² / 50ks²) + 0.3 e^(−r² / 512ks²)) · 2.2
  - veil (0.8, 0.88, 1) · 0.07 / (1 + (r / 24ks)²)^1.25
  - horizontal streak (0.88, 0.93, 1) · 0.9 · e^(−|x| / Lh − (x / 3Lh)²) · e^(−y² / 0.6)
  - vertical streak (0.88, 0.93, 1) · 0.65 · e^(−|y| / Lv) · e^(−x² / 0.6)
  - ring at radii (47.5, 46, 44.5) · ks for RGB, σ² 7, 0.018 · (1 − m)
- **Ghosts:**

  | Position on the line | Radius | Tint |
  |---|---|---|
  | 0.3 | 9 | (0.55, 0.85, 1) |
  | 0.58 | 24 | (0.75, 0.62, 1) |
  | 0.86 | 6 | (1, 0.82, 0.58) |
  | 1.22 | 40 | (0.5, 0.92, 0.82) |
  | −0.24 | 15 | (0.85, 0.75, 1) |

  Each ghost is a disc of 0.010 (soft edge from 0.8 r) plus a rim of 0.016 at 0.9 r, with width² `0.06 r + 0.8`.
