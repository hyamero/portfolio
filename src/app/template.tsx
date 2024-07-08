"use client";

import gsap from "gsap";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import PageTransition from "@/components/animations/page-transition";

gsap.registerPlugin(useGSAP);

export default function Template({ children }: { children: React.ReactNode }) {
  const { animatePageIn } = PageTransition();
  const bannerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      animatePageIn();
    },
    { scope: bannerRef },
  );

  return (
    <div>
      <div
        ref={bannerRef}
        className="banner [&>*]:fixed [&>*]:top-0 [&>*]:z-50 [&>*]:min-h-screen [&>*]:w-1/4 [&>*]:bg-[#111]"
      >
        <div className="left-0" />
        <div className="left-1/4" />
        <div className="left-2/4" />
        <div className="left-3/4" />
      </div>
      {children}
    </div>
  );
}
