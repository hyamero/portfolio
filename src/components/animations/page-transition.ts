"use client";

import gsap from "gsap";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useRouter } from "next/navigation";
import { useUnmountStore } from "@/lib/unmount-store";

gsap.registerPlugin(useGSAP);

export default function PageTransition() {
  const setHref = useUnmountStore((state) => state.setHref);
  const setPageOut = useUnmountStore((state) => state.setPageOut);

  const { push } = useRouter();
  const tlIn = useRef<GSAPTimeline>();

  const href = useUnmountStore((state) => state.href);
  const pageOut = useUnmountStore((state) => state.pageOut);

  useGSAP(
    () => {
      if (pageOut) {
        tlIn.current = gsap
          .timeline()
          .set("body", { overflow: "hidden" })
          .to(".banner div", {
            yPercent: 0,
            stagger: -0.2,
            ease: "power2.inOut",
            onComplete: () => {
              push(href);
            },
          });
      }
    },
    { dependencies: [pageOut] },
  );

  const animatePageOut = (href: string) => {
    setHref(href);
    setPageOut(true);
  };

  return { animatePageOut };
}
