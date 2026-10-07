"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SkyHandle = { measure(): void; dispose(): void };

/** The fixed vgpu sky behind every page; the CSS sky (fallback.tsx) shows until it's live. */
export default function Sky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<SkyHandle | null>(null);
  const [shown, setShown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !("gpu" in navigator)) return;
    let cancelled = false;
    void import("./renderer").then(({ mountSky }) => {
      if (cancelled) return;
      handleRef.current = mountSky(canvas, {
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

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 -z-1 h-lvh w-full transition-opacity duration-1200 ${shown ? "opacity-100" : "opacity-0"}`}
    />
  );
}
