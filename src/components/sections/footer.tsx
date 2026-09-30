"use client";

import { ArrowUpIcon } from "lucide-react";
import { scrollToSection } from "@/lib/scroll";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="relative mt-52 border-t bg-neutral-950 pt-16 pb-7 lg:mt-64 lg:pt-28"
    >
      <div className="container flex flex-col items-center gap-5 lg:flex-row lg:items-end lg:justify-between">
        <p className="text-[clamp(2rem,16vw,12rem)] leading-none font-semibold tracking-tighter text-neutral-200">
          hyamero
        </p>

        <div className="mb-5 flex items-center gap-2 text-neutral-400 lg:gap-5">
          <p className="text-base font-light tracking-tight sm:text-lg lg:text-xl">
            Copyright &copy; Dale Bañares {new Date().getFullYear()}
          </p>
          <button
            type="button"
            aria-label="Back to top"
            onClick={() => scrollToSection("home")}
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </footer>
  );
}
