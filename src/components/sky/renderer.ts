import { effect, frame, surface } from "vgpu";

import { createMilkyCache } from "./milky-cache";
import { bandExtent, diffKey, sameKey, skyParams, type BandMap, type SkyInput } from "./params";
import skySource from "./sky.wgsl";
import { bodyFrame, endFrame, settleFrame, startFrame, stillFrame, type Body } from "@/lib/camera";
import { anchorRect, EMPTY_RECT, flight, onTick, startFlight, textRect } from "@/lib/flight";
import { getGpu } from "@/lib/gpu";
import { armIntro, introProgress, rise, skyDpr, trailFrame, type Rect } from "@/lib/sky-math";

const INTRO_DELAY_MS = 250;
// The ambient drift (twinkle, the planet's flowing band and sparkles) needs no more than ~30fps.
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
      let planet: Rect = EMPTY_RECT;
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
        const cam = flight.camera;
        const scrollY = flight.scroll;
        const W = cssWidth;
        const H = cssHeight;
        const hasPlanet = planet.width > 0;
        // The tick only runs while the tab is visible.
        introStart = armIntro(introStart, now + INTRO_DELAY_MS, hasPlanet, true);
        const intro = reduced ? 1 : introStart === null ? 0 : introProgress(now - introStart);
        let body: Body | null = null;
        let morph = 0;
        let foot: number | null = null;
        let settle = 0;
        if (hasPlanet && reduced) {
          const still = stillFrame(startFrame(planet, hero.top), { hero, work, contact }, W, H, scrollY);
          body = still.body;
          morph = still.morph;
          // The still horizon is at rest; the still planet isn't, and ends at the hero's foot as the CSS one does.
          settle = still.morph;
          if (!still.morph) foot = hero.top + hero.height;
        } else if (hasPlanet) {
          const settled = settleFrame(bodyFrame(cam, startFrame(planet, hero.top), endFrame(W, H)), scrollY, cam.end, H);
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
          foot,
          settle,
          intro,
          trail: trailFrame(settle, up, reduced, work.height > 0),
          span: [work.top, contact.height ? contact.top : work.top + work.height],
          text,
          copy: cam.copy,
          signal: flight.signal,
          band,
          // The ground covers the content from the runway's end on (eclipse spec §5.6).
          frontOn: !reduced && hasPlanet && scrollY >= cam.end,
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
        planet = anchorRect("planet");
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
