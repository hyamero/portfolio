"use client";

import gsap from "gsap";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useRouter } from "next/navigation";

gsap.registerPlugin(useGSAP);

export default function PageTransition() {
  const { contextSafe } = useGSAP();
  const tl = useRef<GSAPTimeline>();
  const { push } = useRouter();

  const animatePageIn = contextSafe(() => {
    tl.current = gsap
      .timeline()
      .to(".banner div", {
        yPercent: 0,
      })
      .to(".banner div", {
        yPercent: 100,
        stagger: 0.2,
        ease: "power2.inOut",
      });
  });

  const animatePageOut = contextSafe((href: string) => {
    tl.current = gsap
      .timeline()
      .set(".banner div", {
        yPercent: -100,
      })
      .to(".banner div", {
        yPercent: 0,
        stagger: 0.2,
        ease: "power2.inOut",
        onComplete: () => {
          push(href);
        },
      });
  });

  return { animatePageIn, animatePageOut };
}
