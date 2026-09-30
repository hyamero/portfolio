"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import atomIcon from "@public/img/icons/atom-icon.png";

/** The "Powered by" atom, with WebGPU electrons circling its orbits; a still icon without WebGPU. */
export default function AtomIcon({ className }: { className?: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const [image, canvas] = [imageRef.current, canvasRef.current];
    // The panel the icon sits in: hovering any of it powers the electrons up.
    const panel = image?.parentElement?.parentElement;
    if (!image || !canvas || !panel || !("gpu" in navigator)) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import("./electrons").then(({ mountElectrons }) => {
      if (cancelled) return;
      dispose = mountElectrons(image, canvas, panel, () => setReady(true));
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Image
        ref={imageRef}
        alt="Atom Icon"
        src={atomIcon}
        className="w-full"
        height={200}
        width={200}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-1000",
          ready && "opacity-100",
        )}
      />
    </div>
  );
}
