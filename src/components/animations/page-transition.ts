"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useUnmountStore } from "@/lib/unmount-store";

gsap.registerPlugin(useGSAP);

export default function PageTransition() {
  // const setUnmount = useUnmountStore((state) => state.setUnmount);
  const setPageOut = useUnmountStore((state) => state.setPageOut);
  const setHref = useUnmountStore((state) => state.setHref);

  const animatePageOut = (href: string) => {
    setHref(href);
    // setUnmount(false);
    setPageOut(true);
  };

  return { animatePageOut };
}
