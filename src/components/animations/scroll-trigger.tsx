"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/lib/projects";
import { blurIn } from "./timelines";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function scrollTimeline(trigger: ScrollTrigger.Vars) {
  return gsap.timeline({
    scrollTrigger: { toggleActions: "restart none none reset", ...trigger },
  });
}

export default function ScrollTrigAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  useGSAP(() => {
    projects.forEach(({ projectTitle: project }) => {
      scrollTimeline({
        trigger: `.${project}`,
        start: "5% bottom",
        end: "25% 40%",
        scrub: false,
      }).fromTo(
        `.project-subtitle-${project} span`,
        ...blurIn(5, { duration: 1, stagger: 0.1 }),
        "<",
      );

      scrollTimeline({
        trigger: `.${project}`,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.1,
      }).to(`.stars-${project}`, { y: 130 }, "<");

      scrollTimeline({
        trigger: `.thumbnail-${project}`,
        start: "-50px bottom",
        end: "65% 40%",
        scrub: 2,
      }).fromTo(`.thumbnail-${project}`, { opacity: 0.2 }, { opacity: 1 }, "<");
    });
  });

  return <>{children}</>;
}
