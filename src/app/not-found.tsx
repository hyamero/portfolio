import type { Metadata } from "next";
import Link from "next/link";

import { Arrow } from "@/components/icons";
import LostOrb from "@/components/lost-orb";

export const metadata: Metadata = {
  title: "Page not found",
};

/** The 404: the page drifted off, and took the wordmark's orb with it (lost-orb.tsx). */
export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-1 flex-col">
      {/* At the foot on phones, under the orb; from md at left, with the orb in the sky to its right. */}
      <div className="px-gutter absolute inset-x-0 bottom-[clamp(48px,10vh,112px)] mx-auto w-full max-w-[1440px] md:top-1/2 md:bottom-auto md:-translate-y-[46%]">
        <div data-lost-copy className="grid justify-items-start gap-4 md:max-w-[min(46rem,54vw)] md:gap-5">
          <p className="text-[13px] tracking-[0.14em] text-dim tabular-nums">404</p>
          <h1 className="text-[clamp(2.4rem,11vw,3.25rem)] leading-[1.06] font-medium tracking-[-0.06em] text-balance md:text-[clamp(2.75rem,6.2vw,5.5rem)]">
            <span className="text-dim">This page</span> drifted out of{" "}
            {/* The full stop rides in the last word's box, so it never wraps alone. */}
            <span className="whitespace-nowrap">
              orbit
              <span className="sr-only">.</span>
              <span aria-hidden="true" className="full-stop" />
            </span>
          </h1>
          <p className="max-w-[34ch] text-[clamp(1.0625rem,1.3vw,1.1875rem)] leading-[1.5] tracking-[-0.015em] text-pretty text-mute">
            It took my little planet with it. Catch it and I’ll fly you home.
          </p>
          <Link href="/" data-catch-light data-magnet className="line-link text-base tracking-tight text-mute">
            Return home <Arrow dir="ne" size={15} />
          </Link>
        </div>
      </div>
      <LostOrb />
    </main>
  );
}
