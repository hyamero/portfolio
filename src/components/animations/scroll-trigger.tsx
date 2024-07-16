"use client";

import gsap from "gsap";
import React from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function ScrollTrigAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  function createScrollTrigger(
    trigger: string,
    start: string,
    scrub: number | boolean,
    toggleActions?: string,
    end?: string,
  ) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger,
        start,
        scrub,
        toggleActions: toggleActions || "restart none none reset",
        end,
        markers: process.env.NODE_ENV === "development",
      },
    });

    return tl;
  }

  const projects = ["omsimos", "umamin", "foliage"];

  useGSAP(() => {
    projects.forEach((project) => {
      createScrollTrigger(`.${project}`, "100px bottom", false)
        .fromTo(
          `.project-subtitle-${project} span`,
          {
            opacity: 0,
            filter: "blur(5px)",
          },
          {
            opacity: 100,
            duration: 1,
            ease: "power4.inOut",
            stagger: 0.1,
            filter: "blur(0px)",
          },
          "<",
        )
        .fromTo(
          `.thumbnail-${project}`,
          {
            filter: "grayscale(100%)",
          },
          {
            filter: "grayscale(0%)",
            duration: 2.5,
            ease: "power4.inOut",
          },
          "<10%",
        );
    });
  });

  return <>{children}</>;
}
