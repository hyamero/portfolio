"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SkyHandle = { measure(): void; dispose(): void };

/**
 * The fixed vgpu sky behind every page, and the resting horizon's ground over the content (spec
 * §5.6). The CSS sky (fallback.tsx) shows until it's live.
 */
export default function Sky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<SkyHandle | null>(null);
  const [shown, setShown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const canvas = canvasRef.current;
    const front = frontRef.current;
    if (!canvas || !front || !("gpu" in navigator)) return;
    // The CSS diamond waits while the live sky may still take over (sky polish spec §6).
    document.documentElement.dataset.sky = "pending";
    let cancelled = false;
    void import("./renderer").then(({ mountSky }) => {
      if (cancelled) return;
      handleRef.current = mountSky(canvas, front, {
        onFirstFrame: () => setShown(true),
        onFallback: () => {
          setShown(false);
          document.documentElement.dataset.sky = "css";
        },
      });
    });
    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  // Hide the CSS sky only once the canvas has finished fading in over it.
  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => {
      document.documentElement.dataset.sky = "live";
    }, 1300);
    return () => clearTimeout(timer);
  }, [shown]);

  // Each route brings its own anchors.
  useEffect(() => {
    handleRef.current?.measure();
  }, [pathname]);

  const fade = `transition-opacity duration-1200 ${shown ? "opacity-100" : "opacity-0"}`;
  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-x-0 top-0 -z-1 h-lvh w-full ${fade}`}
      />
      {/* The renderer shows it from the runway's end and clips its hit area to the planet. */}
      <canvas
        ref={frontRef}
        aria-hidden="true"
        className={`invisible fixed inset-x-0 top-[62lvh] z-30 h-[38lvh] w-full ${fade}`}
      />
    </>
  );
}
