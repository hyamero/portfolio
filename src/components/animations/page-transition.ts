"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useUnmountStore } from "@/lib/unmount-store";

gsap.registerPlugin(useGSAP);

export default function PageTransition() {
  const setHref = useUnmountStore((state) => state.setHref);
  const setPageOut = useUnmountStore((state) => state.setPageOut);

  const animatePageOut = (href: string) => {
    setHref(href);
    setPageOut(true);
  };

  return { animatePageOut };
}
