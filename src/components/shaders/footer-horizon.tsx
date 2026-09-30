"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** The footer's WebGPU horizon glow; renders nothing visible without WebGPU. */
export default function FooterHorizon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !("gpu" in navigator)) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import("./horizon").then(({ mountHorizon }) => {
      if (!cancelled) dispose = mountHorizon(canvas, () => setReady(true));
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
      className={cn(
        "pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-700",
        ready && "opacity-100",
      )}
    />
  );
}
