import { effect, frame, surface } from "vgpu";

import lightSource from "./grazing-light.wgsl";
import { getGpu, prefersReducedMotion } from "@/lib/gpu";

const MAX_CARDS = 4;
// How far outside the grid the pointer still counts as near, in CSS pixels.
const APPROACH = 80;

type Vec4 = [number, number, number, number];

/**
 * Lights the `[data-bento-card]` cards under `canvas` from the pointer; returns a disposer.
 * Draws only while the pointer is near, and hides the canvas once the light has faded out.
 */
export function mountGrazingLight(canvas: HTMLCanvasElement) {
  let disposed = false;
  const teardown: (() => void)[] = [];
  const grid = canvas.parentElement;

  void (async () => {
    const gpu = await getGpu();
    if (!gpu || !grid || disposed) return;

    try {
      const output = surface(gpu, canvas, {
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alphaMode: "premultiplied",
      });
      teardown.push(() => output.dispose());

      const light = effect(gpu, lightSource, {
        set: {
          params: {
            resolution: output.size,
            scale: 1,
            radius: 0,
            light: [0, 0],
            strength: 0,
            reach: 340,
            cards: Array.from({ length: MAX_CARDS }, (): Vec4 => [0, 0, 0, 0]),
          },
        },
      });

      // Cards only move when the grid reflows, and the grid resizes whenever they do.
      const measure = () => {
        const box = grid.getBoundingClientRect();
        const cards = [
          ...grid.querySelectorAll<HTMLElement>("[data-bento-card]"),
        ]
          .slice(0, MAX_CARDS)
          .map((card): Vec4 => {
            const r = card.getBoundingClientRect();
            return [r.left - box.left, r.top - box.top, r.width, r.height];
          });
        while (cards.length < MAX_CARDS) cards.push([0, 0, 0, 0]);
        const first = grid.querySelector<HTMLElement>("[data-bento-card]");
        const radius = first
          ? parseFloat(getComputedStyle(first).borderTopLeftRadius)
          : 0;
        light.set({ params: { cards, radius } });
      };
      teardown.push(
        output.onResize(({ width, height }) => {
          light.set({
            params: {
              resolution: [width, height],
              scale: canvas.clientWidth ? width / canvas.clientWidth : 1,
            },
          });
          measure();
        }),
      );
      await light.compile({ colors: [output.format] });
      if (disposed) return;

      // Reduced motion keeps the light but drops its trailing and fading.
      const reduced = prefersReducedMotion();
      const state = { x: 0, y: 0, strength: 0 };
      const target = { x: 0, y: 0, strength: 0 };
      const pointer = { x: 0, y: 0, seen: false };

      let raf = 0;
      let last = 0;
      const tick = (now: number) => {
        const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
        last = now;
        const follow = reduced ? 1 : 1 - Math.exp(-dt * 12);
        // Arrives a little quicker than it leaves, so a light swept past lingers for a moment.
        const rate = target.strength > state.strength ? 7 : 3.5;
        const fade = reduced ? 1 : 1 - Math.exp(-dt * rate);
        state.x += (target.x - state.x) * follow;
        state.y += (target.y - state.y) * follow;
        state.strength += (target.strength - state.strength) * fade;

        const settled = target.strength === 0 && state.strength < 0.002;
        canvas.style.visibility = settled ? "hidden" : "visible";
        if (settled) {
          raf = 0;
          last = 0;
          return;
        }

        light.set({
          params: { light: [state.x, state.y], strength: state.strength },
        });
        frame(gpu, (f) => f.pass(output, light));
        raf = requestAnimationFrame(tick);
      };

      // Recomputed on scroll too: the grid moves under a pointer that hasn't.
      const aim = () => {
        if (!pointer.seen) return;
        const box = grid.getBoundingClientRect();
        const x = pointer.x - box.left;
        const y = pointer.y - box.top;
        const near =
          x > -APPROACH &&
          y > -APPROACH &&
          x < box.width + APPROACH &&
          y < box.height + APPROACH;
        if (near) {
          // Rise where the pointer arrived instead of sweeping in from where it last left.
          if (state.strength < 0.002) Object.assign(state, { x, y });
          Object.assign(target, { x, y, strength: 1 });
        } else if (target.strength) {
          target.strength = 0;
        } else {
          return;
        }
        if (!raf) raf = requestAnimationFrame(tick);
      };
      const onPointer = (event: PointerEvent) => {
        Object.assign(pointer, {
          x: event.clientX,
          y: event.clientY,
          seen: true,
        });
        aim();
      };
      const onLeave = () => {
        target.strength = 0;
        if (!raf) raf = requestAnimationFrame(tick);
      };

      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", aim, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      teardown.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("scroll", aim);
        document.documentElement.removeEventListener("pointerleave", onLeave);
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
