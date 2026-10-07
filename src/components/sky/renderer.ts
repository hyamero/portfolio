import { effect, frame, surface } from "vgpu";

import skySource from "./sky.wgsl";
import { getGpu } from "@/lib/gpu";
import {
  approach,
  armIntro,
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
    const maybeGpu = await getGpu();
    if (disposed) return;
    if (!maybeGpu) return onFallback();
    // Narrowing doesn't reach the hoisted tick() below.
    const gpu = maybeGpu;

    try {
      const output = surface(gpu, canvas, {
        // Sized by hand to the pixel budget; auto-resize would re-read devicePixelRatio.
        autoResize: false,
        // Every pixel is written with alpha 1, so the compositor can skip blending the canvas.
        alphaMode: "opaque",
      });
      teardown.push(() => output.dispose());

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      let reduced = motionQuery.matches;
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
      let introStart: number | null = null;

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

        // tick() only runs while the tab is visible.
        introStart = armIntro(introStart, now + INTRO_DELAY_MS, hero.height > 0, true);
        const intro = reduced ? 1 : introStart === null ? 0 : introProgress(now - introStart);
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
          (!reduced && introStart !== null && intro < 1);
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
            // A device lost before the first submit rejects here; the lost handler falls back.
            drawn.done.then(() => !disposed && onFirstFrame()).catch(() => {});
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
      const onMotionChange = (event: MediaQueryListEvent) => {
        reduced = event.matches;
        light.ready = false;
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
      motionQuery.addEventListener("change", onMotionChange);
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
        motionQuery.removeEventListener("change", onMotionChange);
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
