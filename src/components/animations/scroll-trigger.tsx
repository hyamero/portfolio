"use client";

import gsap from "gsap";
import React from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMediaQuery } from "../use-media-query";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type scrollTriggerParams = {
  trigger: string;
  start: string;
  end: string;
  scrub: number | boolean;
  markers?: boolean;
  toggleActions?: string;
};

export default function ScrollTrigAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  function createScrollTrigger({
    trigger,
    start,
    end,
    scrub,
    markers,
    toggleActions,
  }: scrollTriggerParams) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
        markers: markers ? process.env.NODE_ENV === "development" : false,
        toggleActions: toggleActions || "restart none none reset",
      },
    });

    return tl;
  }

  const projects = ["omsimos", "umamin", "foliage"];

  useGSAP(
    () => {
      projects.forEach((project) => {
        createScrollTrigger({
          trigger: `.${project}`,
          start: "5% bottom",
          end: "25% 40%",
          scrub: false,
        }).fromTo(
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
        );

        createScrollTrigger({
          trigger: `.${project}`,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.1,
        }).to(
          `.stars-${project}`,
          {
            y: 130,
          },
          "<",
        );

        if (isDesktop) {
          createScrollTrigger({
            trigger: "#home",
            start: "5px top",
            end: "bottom top",
            scrub: 1.2,
          }).to(
            "#hero-bg",
            {
              y: 80,
              x: 30,
            },
            "<",
          );
        }

        createScrollTrigger({
          trigger: `.thumbnail-${project}`,
          start: "-50px bottom",
          end: "65% 40%",
          scrub: 2,
        }).fromTo(
          `.thumbnail-${project}`,
          {
            opacity: 0.2,
          },
          {
            opacity: 1,
          },
          "<",
        );
      });
    },
    { dependencies: [isDesktop] },
  );

  return <>{children}</>;
}
