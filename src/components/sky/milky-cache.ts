import { effect, sampler, target, type Gpu } from "vgpu";

import type { BandMap } from "./params";
import cacheSource from "./wgsl/milky-cache.wgsl";

/**
 * The Milky Way cache (spec §3.5): ~22 octaves of noise per pixel that only drift at 6% of the
 * scroll, so the band renders once at the sky's resolution and the sky samples it each frame. Full
 * resolution keeps its finest grain, the unresolved stars, from blurring into haze.
 * Its texture belongs to the shared device, which gpu.ts keeps for the tab's lifetime.
 */
export function createMilkyCache(gpu: Gpu) {
  const cache = target(gpu, { size: [1, 1], format: "rgba16float" });
  const band = effect(gpu, cacheSource, { set: { params: { size: [1, 1], map: [0, 0, 1, 1] } } });
  let key = "";
  return {
    target: cache,
    effect: band,
    sampler: sampler(gpu, { minFilter: "linear", magFilter: "linear" }),
    compile: () => band.compile({ colors: [cache.format] }),
    /** Sizes the cache for this viewport and extent; true when it must be drawn again. */
    update(W: number, H: number, dpr: number, map: BandMap) {
      const next = [W, H, dpr, ...map.origin, ...map.size].join();
      if (next === key) return false;
      key = next;
      cache.resize([Math.max(1, Math.ceil(map.size[0] * dpr)), Math.max(1, Math.ceil(map.size[1] * dpr))]);
      band.set({ params: { size: [W, H], map: [...map.origin, ...map.size] } });
      return true;
    },
  };
}
