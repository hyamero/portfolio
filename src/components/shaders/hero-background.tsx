"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import heroBg from "@public/img/main-bg.jpg";
import ringStar from "@public/img/rings-bg.svg";
import Particles from "@/components/magicui/particles";

type Mode = "pending" | "live" | "fallback";

/**
 * Live planet shader over the static poster. The shader bakes in the rings, dimming overlay and
 * grain; the DOM versions of those, plus the particles, remain the no-WebGPU path.
 */
export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<HTMLImageElement>(null);
  const [mode, setMode] = useState<Mode>("pending");

  useEffect(() => {
    const [canvas, rings] = [canvasRef.current, ringsRef.current];
    if (!canvas || !rings) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import("./planet").then(({ mountPlanet }) => {
      if (cancelled) return;
      dispose = mountPlanet(canvas, rings, {
        onReady: () => setMode("live"),
        onFallback: () => setMode("fallback"),
      });
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  const live = mode === "live";

  return (
    <>
      <div className="absolute top-0 -z-10 size-full lg:left-0">
        {/* Only seen without WebGPU, so it shouldn't compete with the page's critical requests. */}
        <Image
          id="hero-bg"
          src={heroBg}
          alt=""
          className="object-cover object-center opacity-90"
          loading="eager"
          fetchPriority="low"
          fill
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-full opacity-0 transition-opacity duration-1000",
            live && "opacity-100",
          )}
        />
      </div>

      {/* The shader redraws these rings in place, measured from this image's layout. */}
      <div className="absolute top-[-20%] -left-1/2 -z-10 size-full sm:top-[-10%] 2xl:top-0">
        <Image
          ref={ringsRef}
          alt=""
          src={ringStar}
          fill
          unoptimized
          loading="eager"
          className={cn(
            "scale-[2.5] transition-opacity duration-1000 md:scale-[2] lg:scale-125 2xl:scale-100",
            live && "opacity-0",
          )}
        />
      </div>

      {/* Blend layers fade out individually: an opacity wrapper would isolate their blending. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-black/35 mix-blend-overlay transition-opacity duration-1000",
          live && "opacity-0",
        )}
      />
      <div
        style={{ filter: "url(#noiseFilter)" }}
        className={cn(
          "pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_bottom,white,transparent_80%)] opacity-75 mix-blend-soft-light transition-opacity duration-1000",
          live && "opacity-0",
        )}
      />
      <svg aria-hidden="true" className="absolute left-full">
        <filter id="noiseFilter">
          <feTurbulence
            baseFrequency="6.29"
            numOctaves="1"
            stitchTiles="stitch"
            type="fractalNoise"
          />
        </filter>
      </svg>

      {mode === "fallback" && (
        <Particles
          className="absolute inset-0"
          quantity={75}
          ease={80}
          color="#888888"
          refresh
        />
      )}
    </>
  );
}
