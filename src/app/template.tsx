"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { animatePageIn } from "@/components/animations/page-transition";

gsap.registerPlugin(useGSAP);

export default function Template({ children }: { children: React.ReactNode }) {
  useGSAP(() => {
    animatePageIn();
  });

  return (
    <div>
      <div className="banner [&>*]:fixed [&>*]:top-0 [&>*]:z-50 [&>*]:min-h-screen [&>*]:w-1/4 [&>*]:bg-[#111]">
        <div className="left-0" />
        <div className="left-1/4" />
        <div className="left-2/4" />
        <div className="left-3/4" />
      </div>
      {children}
    </div>
  );
}
