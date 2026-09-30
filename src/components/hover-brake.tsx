"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/gpu";

/**
 * A div whose CSS animations ease down to `rate` of their speed while a pointer is over it, and
 * wind back up after: moving things slow down when you reach for them, rather than stopping dead.
 */
export default function HoverBrake({
  rate = 0.2,
  ...props
}: React.ComponentProps<"div"> & { rate?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    let current = 1;
    let target = 1;
    let raf = 0;
    let last = 0;
    // Runs only while the speed is changing; in between, the animations stay on the compositor.
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      current +=
        (target - current) * (1 - Math.exp(-dt * (target < current ? 5 : 2)));
      if (Math.abs(target - current) < 0.002) current = target;
      for (const animation of element.getAnimations({ subtree: true })) {
        // Hover transitions inside keep their own pace.
        if (animation instanceof CSSAnimation) animation.playbackRate = current;
      }
      raf = current === target ? 0 : requestAnimationFrame(tick);
      if (!raf) last = 0;
    };
    const brake = (value: number) => {
      target = value;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onEnter = (event: PointerEvent) =>
      event.pointerType !== "touch" && brake(rate);
    const onLeave = () => brake(1);
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerleave", onLeave);
    };
  }, [rate]);

  return <div ref={ref} {...props} />;
}
