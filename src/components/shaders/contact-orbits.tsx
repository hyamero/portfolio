"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Trails for the contact card's orbiting icons, and the braking that holds an icon still to be
 * clicked. Mounts on its parent card; without WebGPU the canvas stays blank but the icons still brake.
 */
export default function ContactOrbits() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const card = canvas?.parentElement;
    if (!canvas || !card) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import("./orbits").then(({ mountOrbits }) => {
      if (!cancelled) dispose = mountOrbits(card, canvas, () => setReady(true));
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
        "pointer-events-none absolute inset-0 size-full rounded-lg opacity-0 transition-opacity duration-700",
        ready && "opacity-100",
      )}
    />
  );
}
