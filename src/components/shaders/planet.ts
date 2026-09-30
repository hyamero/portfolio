import { effect, frame, frameLoop, surface, type FrameLoopHandle } from "vgpu";

import planetSource from "./planet.wgsl";
import { getGpu, prefersReducedMotion } from "@/lib/gpu";

const INTRO_SECONDS = 2.4;
// Frame budget above which the loop drops to 30fps instead of janking the page.
const SLOW_FRAME_MS = 25;

// public/img/rings-bg.svg's viewBox.
const RINGS_VIEWBOX = [1440, 810] as const;

/**
 * Renders the planet into `canvas`, with the rings SVG drawn where `rings` lays out;
 * returns a disposer. `onFallback` fires if WebGPU can't run it.
 */
export function mountPlanet(
  canvas: HTMLCanvasElement,
  rings: HTMLElement,
  { onReady, onFallback }: { onReady: () => void; onFallback: () => void },
) {
  let disposed = false;
  const teardown: (() => void)[] = [];

  void (async () => {
    const gpu = await getGpu();
    if (disposed) return;
    if (!gpu) return onFallback();

    try {
      const output = surface(gpu, canvas, {
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
        // Every pixel is written with alpha 1, so the compositor can skip blending the canvas.
        alphaMode: "opaque",
      });
      teardown.push(() => output.dispose());

      const reduced = prefersReducedMotion();
      const pointer = { x: 0.15, y: 0.1 };
      const target = { ...pointer };
      const planet = effect(gpu, planetSource, {
        set: {
          params: {
            resolution: output.size,
            pointer: [pointer.x, pointer.y],
            time: 0,
            scroll: 0,
            intro: reduced ? 1 : 0,
            rings: [0, 0, 0],
            hover: 0,
          },
        },
      });

      // The rings share the canvas's containing block, so their offset only changes on resize.
      const measureRings = () => {
        const box = canvas.getBoundingClientRect();
        const r = rings.getBoundingClientRect();
        if (!box.height) return;
        // The <img> letterboxes the SVG (preserveAspectRatio meet); the rect includes its scale.
        const unit = Math.min(
          r.width / RINGS_VIEWBOX[0],
          r.height / RINGS_VIEWBOX[1],
        );
        const x = r.left + r.width / 2 - box.left;
        const y = r.top + r.height / 2 - box.top;
        planet.set({
          params: {
            rings: [x / box.height, y / box.height, unit / box.height],
          },
        });
      };
      measureRings();
      teardown.push(
        output.onResize(({ width, height }) => {
          planet.set({ params: { resolution: [width, height] } });
          measureRings();
        }),
      );
      await planet.compile({ colors: [output.format] });
      if (disposed) return;

      // Whether a real pointer is over the page: touch and the resting light never glint sparkles.
      const hover = { value: 0, target: 0 };
      const onPointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        target.x = (event.clientX - rect.left) / rect.width;
        target.y = (event.clientY - rect.top) / rect.height;
        hover.target = event.pointerType === "touch" ? 0 : 1;
      };
      const onLeave = () => (hover.target = 0);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      teardown.push(() => {
        window.removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      });

      const scroll = () =>
        Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1);

      if (reduced) {
        const draw = () =>
          frame(gpu, (f) => {
            planet.set({ params: { scroll: scroll() } });
            f.pass(output, planet);
          });
        draw();
        teardown.push(output.onResize(() => requestAnimationFrame(draw)));
        onReady();
        return;
      }

      // Own the timeline: the shared device's clock is ticked by every shader on the page.
      let time = 0;
      let last = performance.now();
      let sampled = 0;
      let slowFrames = 0;
      let fps: number | undefined;
      let loop: FrameLoopHandle | undefined;

      const stop = () => {
        loop?.stop();
        loop = undefined;
      };
      const start = () => {
        stop();
        last = performance.now();
        loop = frameLoop(
          gpu,
          (f) => {
            const now = performance.now();
            const dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            time += dt;

            if (!fps && time > INTRO_SECONDS && sampled < 120) {
              sampled += 1;
              if (dt * 1000 > SLOW_FRAME_MS) slowFrames += 1;
              if (sampled === 120 && slowFrames > 60) {
                fps = 30;
                queueMicrotask(start);
              }
            }

            const ease = 1 - Math.exp(-dt * 3);
            pointer.x += (target.x - pointer.x) * ease;
            pointer.y += (target.y - pointer.y) * ease;
            hover.value += (hover.target - hover.value) * ease;
            const intro = Math.min(time / INTRO_SECONDS, 1);

            planet.set({
              params: {
                pointer: [pointer.x, pointer.y],
                time,
                scroll: scroll(),
                intro: 1 - (1 - intro) ** 3,
                hover: hover.value,
              },
            });
            f.pass(output, planet);
          },
          fps ? { fps } : undefined,
        );
      };

      // Pause while the hero is scrolled out of view.
      const observer = new IntersectionObserver(([entry]) =>
        entry.isIntersecting ? start() : stop(),
      );
      observer.observe(canvas);
      teardown.push(() => {
        observer.disconnect();
        stop();
      });
      onReady();
    } catch (error) {
      console.error(error);
      if (!disposed) onFallback();
    }
  })();

  return () => {
    disposed = true;
    teardown.forEach((fn) => fn());
  };
}
