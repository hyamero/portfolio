"use client";

import { ArrowUpIcon } from "lucide-react";
import { scrollToSection } from "@/lib/scroll";

export function BackToTop() {
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => scrollToSection("home")}
    >
      <ArrowUpIcon />
    </button>
  );
}
