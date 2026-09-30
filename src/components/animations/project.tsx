"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useStateStore } from "@/lib/state-store";
import { blurIn, pageInTimeline } from "./timelines";

gsap.registerPlugin(useGSAP);

export default function ProjectAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  const setPageOut = useStateStore((state) => state.setPageOut);

  useGSAP(() => {
    pageInTimeline(() => setPageOut(false))
      .fromTo(
        ".project-title span",
        ...blurIn(8, { duration: 2, stagger: 0.1 }),
        "<20%",
      )
      .fromTo(
        ".project-subtitle span",
        ...blurIn(5, { duration: 1.5, stagger: 0.1 }),
        "<",
      )
      .to("body", { overflow: "auto" }, "<30%");
  });

  return <>{children}</>;
}
