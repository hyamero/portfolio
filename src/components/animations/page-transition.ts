"use client";

import gsap from "gsap";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const animatePageIn = () => {
  const tl = gsap.timeline();

  tl.set("body", {
    overflowY: "hidden",
  })
    .set(".banner div", {
      yPercent: 0,
    })
    .to(".banner div", {
      yPercent: 100,
      stagger: 0.2,
      ease: "power2.inOut",
      delay: 0.5,
    })
    .to("body", {
      overflowY: "auto",
    });
};

export const animatePageOut = (href: string, router: AppRouterInstance) => {
  const tl = gsap.timeline();

  tl.set(".banner div", {
    yPercent: -100,
  }).to(".banner div", {
    yPercent: 0,
    stagger: 0.2,
    ease: "power2.inOut",
    onComplete: () => {
      router.push(href);
    },
  });
};
