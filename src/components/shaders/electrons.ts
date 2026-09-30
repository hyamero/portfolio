import {
  effect,
  frameLoop,
  sampler,
  surface,
  type FrameLoopHandle,
} from "vgpu";

import electronsSource from "./electrons.wgsl";
import { imageTexture } from "./image-texture";
import { getGpu, prefersReducedMotion } from "@/lib/gpu";

// Radians of orbit per second: at rest, and while the "Powered by" panel is hovered.
const PACE = { idle: 0.7, powered: 1.8 };

/**
 * Sets electrons circling the atom `image`, drawn into `canvas` over it; returns a disposer.
 * They pick up speed while the pointer is over `panel`. Leaves the icon still without WebGPU.
 */
export function mountElectrons(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  panel: HTMLElement,
  onReady: () => void,
) {
  let disposed = false;
  const teardown: (() => void)[] = [];
  if (prefersReducedMotion()) return () => {};

  void (async () => {
    const gpu = await getGpu();
    if (!gpu || disposed) return;

    try {
      // The electrons take their brightness from the icon's own shading.
      const icon = await imageTexture(gpu, image);
      if (disposed) return icon.destroy();
      teardown.push(() => icon.destroy());

      const output = surface(gpu, canvas, {
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alphaMode: "premultiplied",
      });
      teardown.push(() => output.dispose());

      // Each atom starts somewhere of its own, so two on screen never move in lockstep.
      let phase = Math.random() * 100;
      const electrons = effect(gpu, electronsSource, {
        set: {
          icon,
          samp: sampler(gpu, { minFilter: "linear", magFilter: "linear" }),
          params: { resolution: output.size, phase, power: 0 },
        },
      });
      teardown.push(
        output.onResize(({ width, height }) =>
          electrons.set({ params: { resolution: [width, height] } }),
        ),
      );
      await electrons.compile({ colors: [output.format] });
      if (disposed) return;

      const power = { value: 0, target: 0 };
      const onEnter = (event: PointerEvent) => {
        if (event.pointerType !== "touch") power.target = 1;
      };
      const onLeave = () => (power.target = 0);
      panel.addEventListener("pointerenter", onEnter);
      panel.addEventListener("pointerleave", onLeave);
      teardown.push(() => {
        panel.removeEventListener("pointerenter", onEnter);
        panel.removeEventListener("pointerleave", onLeave);
      });

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
          power.value += (power.target - power.value) * (1 - Math.exp(-dt * 4));
          phase += dt * (PACE.idle + (PACE.powered - PACE.idle) * power.value);
          electrons.set({ params: { phase, power: power.value } });
          f.pass(output, electrons);
        });
      };

      // Only the atoms on screen spin.
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
