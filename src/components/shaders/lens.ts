import { effect, frame, sampler, surface, texture } from "vgpu";

import lensSource from "./lens.wgsl";
import { getGpu, prefersReducedMotion } from "@/lib/gpu";

// Lens radius as a fraction of the thumbnail's height.
const RADIUS = 0.2;
// The drop's stretch is a spring: about 3.3Hz, underdamped enough to wobble once when it stops.
const SPRING = 420;
const DAMPING = 16;
// Integration step; a long frame is split up rather than taken in one unstable leap.
const STEP = 1 / 240;

/**
 * Overlays a glass lens on `image`, drawn only while the pointer is over it.
 * The canvas stays hidden at rest so the real <img> is what people see and save.
 */
export function mountLens(image: HTMLImageElement, canvas: HTMLCanvasElement) {
  let disposed = false;
  const teardown: (() => void)[] = [];

  void (async () => {
    const gpu = await getGpu();
    if (!gpu || disposed) return;

    try {
      // Thumbnails load lazily, and decode() rejects on an image that hasn't started loading.
      if (!image.complete || !image.naturalWidth) {
        await new Promise((resolve, reject) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", reject, { once: true });
        });
      }
      const bitmap = await createImageBitmap(image);
      if (disposed) return bitmap.close();

      const source = texture(gpu, {
        kind: "2d",
        size: [bitmap.width, bitmap.height],
        format: "rgba8unorm",
        usage: ["texture_binding", "copy_dst", "render_attachment"],
      });
      gpu.gpu.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture: source.gpu },
        [bitmap.width, bitmap.height],
      );
      bitmap.close();
      teardown.push(() => source.destroy());

      const output = surface(gpu, canvas);
      teardown.push(() => output.dispose());

      const state = { x: 0.5, y: 0.5, strength: 0 };
      const target = { x: 0.5, y: 0.5, strength: 0 };
      const lens = effect(gpu, lensSource, {
        set: {
          image: source,
          samp: sampler(gpu, { minFilter: "linear", magFilter: "linear" }),
          params: {
            resolution: output.size,
            pointer: [state.x, state.y],
            strength: 0,
            radius: RADIUS,
            axis: [1, 0],
            stretch: 0,
          },
        },
      });
      teardown.push(
        output.onResize(({ width, height }) =>
          lens.set({ params: { resolution: [width, height] } }),
        ),
      );
      await lens.compile({ colors: [output.format] });
      if (disposed) return;

      // Reduced motion keeps the magnifier but drops the trailing, fading and stretching.
      const reduced = prefersReducedMotion();
      // Dragged quickly, the lens draws out along its path like a drop, then wobbles back round.
      const drop = { stretch: 0, velocity: 0, axis: [1, 0] };
      const stretch = (fromX: number, fromY: number, dt: number) => {
        // The lens's own velocity in radii per second, so it stretches alike at any thumbnail size.
        const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
        const vx = (((state.x - fromX) / dt) * aspect) / RADIUS;
        const vy = (state.y - fromY) / dt / RADIUS;
        const speed = Math.hypot(vx, vy);
        if (speed > 0.5) {
          // The stretch has an axis, not a direction: reversing shouldn't swing it through zero.
          const flip = vx * drop.axis[0] + vy * drop.axis[1] < 0 ? -1 : 1;
          const turn = 1 - Math.exp(-dt * 12);
          const ax = drop.axis[0] + ((flip * vx) / speed - drop.axis[0]) * turn;
          const ay = drop.axis[1] + ((flip * vy) / speed - drop.axis[1]) * turn;
          const length = Math.hypot(ax, ay) || 1;
          drop.axis = [ax / length, ay / length];
        }
        const goal = Math.min(speed * 0.02, 0.25);
        for (let left = dt; left > 0; left -= STEP) {
          const h = Math.min(STEP, left);
          drop.velocity +=
            ((goal - drop.stretch) * SPRING - drop.velocity * DAMPING) * h;
          drop.stretch += drop.velocity * h;
        }
      };

      let raf = 0;
      let last = 0;
      const tick = (now: number) => {
        const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
        last = now;
        // Position trails the pointer a little more than strength does, which reads as liquid.
        const follow = reduced ? 1 : 1 - Math.exp(-dt * 14);
        const fade = reduced ? 1 : 1 - Math.exp(-dt * 9);
        const [fromX, fromY] = [state.x, state.y];
        state.x += (target.x - state.x) * follow;
        state.y += (target.y - state.y) * follow;
        state.strength += (target.strength - state.strength) * fade;
        if (!reduced) stretch(fromX, fromY, dt);

        const settled = target.strength === 0 && state.strength < 0.002;
        canvas.style.visibility = settled ? "hidden" : "visible";
        if (settled) {
          raf = 0;
          last = 0;
          return;
        }

        lens.set({
          params: {
            pointer: [state.x, state.y],
            strength: state.strength,
            axis: drop.axis,
            stretch: drop.stretch,
          },
        });
        frame(gpu, (f) => f.pass(output, lens));
        raf = requestAnimationFrame(tick);
      };
      const wake = () => {
        if (!raf) raf = requestAnimationFrame(tick);
      };

      // Hit-test on window: the thumbnail sits under a negative z-index, so it never receives
      // pointer events of its own.
      const onPointer = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
        if (inside) {
          // Start the lens where the pointer entered instead of sliding in from the last exit.
          if (state.strength < 0.002) {
            Object.assign(state, { x, y });
            Object.assign(drop, { stretch: 0, velocity: 0 });
          }
          Object.assign(target, { x, y, strength: 1 });
          wake();
        } else if (target.strength) {
          target.strength = 0;
          wake();
        }
      };

      window.addEventListener("pointermove", onPointer, { passive: true });
      teardown.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
      });
    } catch (error) {
      console.error(error);
    }
  })();

  return () => {
    disposed = true;
    teardown.forEach((fn) => fn());
  };
}
