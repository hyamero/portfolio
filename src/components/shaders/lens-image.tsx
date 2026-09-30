"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/** A next/image with a WebGPU glass lens on hover; renders as a plain image without WebGPU. */
export default function LensImage({
  alt,
  className,
  wrapperClassName,
  ...props
}: ImageProps & { wrapperClassName?: string }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const [image, canvas] = [imageRef.current, canvasRef.current];
    if (!image || !canvas || !("gpu" in navigator)) return;

    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import("./lens").then(({ mountLens }) => {
      if (!cancelled) dispose = mountLens(image, canvas);
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div className={cn("relative", wrapperClassName)}>
      <Image ref={imageRef} alt={alt} className={className} {...props} />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        // The image's classes come first so its rounding carries over but sizing can't win.
        className={cn(
          className,
          "pointer-events-none invisible absolute inset-0 size-full",
        )}
      />
    </div>
  );
}
