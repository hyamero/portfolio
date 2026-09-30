"use client";

import { useEffect, useRef } from "react";

/** The tools grid's pointer light; mounts over its parent. Renders nothing visible without WebGPU. */
export default function BentoLight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // A light that follows the pointer has nothing to follow on touch screens.
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (!canvas || !canHover || !("gpu" in navigator)) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import("./grazing-light").then(({ mountGrazingLight }) => {
      if (!cancelled) dispose = mountGrazingLight(canvas);
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none invisible absolute inset-0 size-full"
    />
  );
}
