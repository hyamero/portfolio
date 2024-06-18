"use client";

import gsap from "gsap";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const animatePageIn = () => {
  const tl = gsap.timeline();

  tl.set("#transition-element", {
    xPercent: 0,
  })
    .to("#transition-element", {
      xPercent: 100,
      duration: 0.8,
    })
    .to(
      "#transition-element",
      {
        borderTopLeftRadius: "50vh",
        borderBottomLeftRadius: "50vh",
        duration: 0.4,
      },
      "<",
    );
};

export const animatePageOut = (href: string, router: AppRouterInstance) => {
  const tl = gsap.timeline();

  tl.set("#transition-element", {
    xPercent: -100,
    borderTopRightRadius: "50vh",
    borderBottomRightRadius: "50vh",
    borderTopLeftRadius: "0",
    borderBottomLeftRadius: "0",
  })
    .to("#transition-element", {
      xPercent: 0,
      duration: 0.8,
      onComplete: () => {
        router.push(href);
      },
    })
    .to(
      "#transition-element",
      {
        borderTopRightRadius: "0",
        borderBottomRightRadius: "0",
        duration: 0.4,
      },
      "<",
    );
};
