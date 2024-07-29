"use client";

import gsap from "gsap";
import { ArrowUpIcon } from "lucide-react";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";

export default function Footer() {
  gsap.registerPlugin(ScrollToPlugin);

  const scrollToSection = (scrollElement: string, offsetY: number) => {
    gsap.to(window, {
      duration: 1,
      scrollTo: { y: `#${scrollElement}`, offsetY },
      ease: "power2.easeOut",
    });
  };

  return (
    <footer
      id="footer"
      className="relative mt-52 border-t bg-neutral-950 pb-7 pt-16 lg:mt-64 lg:pt-28"
    >
      <div className="container flex flex-col items-center gap-5 lg:flex-row lg:items-end lg:justify-between">
        <p className="text-[clamp(2rem,16vw,12rem)] font-semibold leading-none tracking-tighter text-neutral-200">
          hyamero
        </p>

        <div className="mb-5 flex items-center gap-2 text-neutral-400 lg:gap-5">
          <p className="text-base font-light tracking-tight sm:text-lg lg:text-xl">
            Copyright &copy; Dale Bañares 2024
          </p>
          <button onClick={() => scrollToSection("home", 0)}>
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </footer>
  );
}
