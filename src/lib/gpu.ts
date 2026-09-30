import type { Gpu } from "vgpu";

let pending: Promise<Gpu | null> | undefined;

/**
 * One WebGPU device shared by every shader on the page, kept for the tab's lifetime.
 * Resolves to null when WebGPU is unavailable so callers can keep their static fallback.
 */
export function getGpu(): Promise<Gpu | null> {
  pending ??= (async () => {
    if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;
    try {
      const { init } = await import("vgpu");
      return await init();
    } catch {
      return null;
    }
  })();
  return pending;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
