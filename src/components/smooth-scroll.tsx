"use client";

import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { useEffect } from "react";

import { flight, startFlight } from "@/lib/flight";

gsap.registerPlugin(ScrollTrigger);

const SCROLL_KEYS = new Set(["PageUp", "PageDown", "Home", "End", " ", "ArrowUp", "ArrowDown"]);

/** Lenis on flight's tick for wheel and trackpad; touch keeps native momentum. Off for reduced motion. */
export default function SmoothScroll() {
  useEffect(() => {
    const stop = startFlight();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    const sync = () => {
      if (motion.matches) {
        lenis?.destroy();
        lenis = flight.lenis = null;
        return;
      }
      if (lenis) return;
      lenis = new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, lerp: 0.1, anchors: false });
      lenis.on("scroll", ScrollTrigger.update);
      flight.lenis = lenis;
    };
    // Lenis ignores native scrolls mid-glide and then writes its own position back, which would
    // undo a key or focus scroll. Hand those over by dropping the glide where it is.
    const handOver = () => {
      if (lenis?.isScrolling !== "smooth") return;
      lenis.stop();
      lenis.start();
    };
    const onKey = (event: KeyboardEvent) => SCROLL_KEYS.has(event.key) && handOver();
    sync();
    motion.addEventListener("change", sync);
    window.addEventListener("keydown", onKey);
    window.addEventListener("focusin", handOver);
    return () => {
      motion.removeEventListener("change", sync);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("focusin", handOver);
      lenis?.destroy();
      flight.lenis = null;
      stop();
    };
  }, []);
  return null;
}
