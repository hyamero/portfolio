"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useStateStore } from "@/lib/state-store";
import { blurIn, pageInTimeline } from "./timelines";

gsap.registerPlugin(useGSAP);

export default function HeroAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  const setPageOut = useStateStore((state) => state.setPageOut);

  useGSAP(() => {
    pageInTimeline(() => setPageOut(false))
      .fromTo(
        "#hero-text .hero-line span",
        ...blurIn(8, { duration: 2, stagger: 0.1 }),
        "<20%",
      )
      .fromTo(
        "#description span",
        ...blurIn(5, { duration: 2, stagger: 0.05 }),
        "<",
      )
      .fromTo(".blur-item", ...blurIn(8, { stagger: 0.3 }), "<25%")
      .to("body", { overflow: "auto" }, "<50%");
  });

  return <>{children}</>;
}
