"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRouter } from "next/navigation";
import { useStateStore } from "@/lib/state-store";

gsap.registerPlugin(useGSAP);

export default function TransitionLoader() {
  const { push } = useRouter();
  const href = useStateStore((state) => state.href);
  const pageOut = useStateStore((state) => state.pageOut);

  // Owned by this single mounted component: running it inside a hook that
  // every caller mounts played the tween and pushed the route once per caller.
  useGSAP(
    () => {
      if (!pageOut) return;

      gsap
        .timeline()
        .set("body", { overflow: "hidden" })
        .to(".banner div", {
          yPercent: 0,
          stagger: -0.2,
          ease: "power2.inOut",
          onComplete: () => push(href),
        });
    },
    { dependencies: [pageOut] },
  );

  return (
    <div className="banner *:fixed *:top-0 *:z-50 *:min-h-screen *:w-1/4 *:border-r *:bg-[#111]">
      <div className="left-0" />
      <div className="left-1/4" />
      <div className="left-2/4" />
      <div className="left-3/4" />
    </div>
  );
}
