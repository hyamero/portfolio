"use client";

import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { useEffect } from "react";

import { flight, startFlight } from "@/lib/flight";

gsap.registerPlugin(ScrollTrigger);

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
    sync();
    motion.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      lenis?.destroy();
      flight.lenis = null;
      stop();
    };
  }, []);
  return null;
}
