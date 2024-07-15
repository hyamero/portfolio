"use client";

import gsap from "gsap";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useRouter } from "next/navigation";
import { useStateStore } from "@/lib/state-store";

gsap.registerPlugin(useGSAP);

export default function PageTransition() {
  const setHref = useStateStore((state) => state.setHref);
  const setPageOut = useStateStore((state) => state.setPageOut);

  const { push } = useRouter();
  const tlIn = useRef<GSAPTimeline>();

  const href = useStateStore((state) => state.href);
  const pageOut = useStateStore((state) => state.pageOut);

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
