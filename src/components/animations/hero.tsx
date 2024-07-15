"use client";

import gsap from "gsap";
import { toast } from "sonner";
import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { useStateStore } from "@/lib/state-store";

gsap.registerPlugin(useGSAP);

export default function HeroAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  const tl = useRef<GSAPTimeline>();
  const setPageOut = useStateStore((state) => state.setPageOut);

  useGSAP(() => {
    tl.current = gsap
      .timeline()
      .set("body", { overflow: "hidden" })
      .to(".banner div", {
        yPercent: 100,
        stagger: 0.2,
        ease: "power2.inOut",
        onComplete: () => {
          setPageOut(false);
        },
      })
      .fromTo(
        "#hero-text div span",
        {
          opacity: 0,
          filter: "blur(8px)",
        },
        {
          opacity: 100,
          duration: 2,
          ease: "power4.inOut",
          stagger: 0.1,
          filter: "blur(0px)",
        },
        "<20%",
      )
      .fromTo(
        "#description span",
        {
          opacity: 0,
          filter: "blur(5px)",
        },
        {
          opacity: 100,
          duration: 2,
          ease: "power4.inOut",
          stagger: 0.05,
          filter: "blur(0px)",
        },
        "<",
      )
      .fromTo(
        ".blur-item",
        {
          opacity: 0,
          filter: "blur(8px)",
        },
        {
          opacity: 100,
          ease: "power4.inOut",
          stagger: 0.3,
          filter: "blur(0px)",
          onComplete: () => {
            toast.info("Tip: press [ / ] for quick search!");
          },
        },
        "<25%",
      )
      .to(
        "body",
        {
          overflow: "auto",
        },
        "<50%",
      );
  });

  return <>{children}</>;
}
