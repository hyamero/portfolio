"use client";

import gsap from "gsap";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { animatePageIn } from "@/components/animations/page-transition";

gsap.registerPlugin(useGSAP);

export default function Template({ children }: { children: React.ReactNode }) {
  const tl = useRef<GSAPTimeline>();

  useGSAP(() => {
    animatePageIn();
  });

  return (
    <div>
      <div
        id="transition-element"
        className="fixed left-0 top-0 z-50 h-screen w-screen bg-black"
      />
      {children}
    </div>
  );
}
