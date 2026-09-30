import { effect, frame, frameLoop, surface, type FrameLoopHandle } from "vgpu";

import horizonSource from "./horizon.wgsl";
import { getGpu, prefersReducedMotion } from "@/lib/gpu";

const RISE_SECONDS = 1.8;

/** Renders the footer horizon into `canvas`; returns a disposer. Leaves the canvas blank without WebGPU. */
export function mountHorizon(canvas: HTMLCanvasElement, onReady: () => void) {
  let disposed = false;
  const teardown: (() => void)[] = [];

  void (async () => {
    const gpu = await getGpu();
    if (!gpu || disposed) return;

    try {
      const output = surface(gpu, canvas, {
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
        alphaMode: "premultiplied",
      });
      teardown.push(() => output.dispose());

      const reduced = prefersReducedMotion();
      const pointer = { x: 0.3 };
      const target = { ...pointer };
      const horizon = effect(gpu, horizonSource, {
        set: {
          params: {
            resolution: output.size,
            pointer: [pointer.x, 0],
            time: 0,
            rise: reduced ? 1 : 0,
          },
        },
      });
      await horizon.compile({ colors: [output.format] });
      if (disposed) return;

      if (reduced) {
        const draw = () => frame(gpu, (f) => f.pass(output, horizon));
        teardown.push(
          output.onResize(({ width, height }) => {
            horizon.set({ params: { resolution: [width, height] } });
            requestAnimationFrame(draw);
          }),
        );
        draw();
        onReady();
        return;
      }
      teardown.push(
        output.onResize(({ width, height }) =>
          horizon.set({ params: { resolution: [width, height] } }),
        ),
      );

      const onPointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        target.x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      };
      window.addEventListener("pointermove", onPointer, { passive: true });
      teardown.push(() => window.removeEventListener("pointermove", onPointer));

      // Time only advances while visible, so the rise plays the first time the footer shows.
      let time = 0;
      let last = 0;
      let loop: FrameLoopHandle | undefined;
      const stop = () => {
        loop?.stop();
        loop = undefined;
      };
      const start = () => {
        stop();
        last = performance.now();
        loop = frameLoop(gpu, (f) => {
          const now = performance.now();
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          time += dt;
          pointer.x += (target.x - pointer.x) * (1 - Math.exp(-dt * 2.5));
          const rise = Math.min(time / RISE_SECONDS, 1);
          horizon.set({
            params: { pointer: [pointer.x, 0], time, rise: 1 - (1 - rise) ** 3 },
          });
          f.pass(output, horizon);
        });
      };

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
    }
  })();

  return () => {
    disposed = true;
    teardown.forEach((fn) => fn());
  };
}
