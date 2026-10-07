"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

import { readProgress, wordOpacity } from "@/lib/statement";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** The page's DOM motion: the page-in, and every scroll effect, scrubbed. The sky runs its own. */
export default function Motion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 01 Rise: the copy fades up line by line as the orb rises.
        gsap.fromTo(
          "[data-rise]",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 1.6, ease: "power4.out", delay: 0.5, stagger: 0.14 },
        );

        // 02 Drift: the copy lifts and is gone by 71% of the hero, while the orb sets below it.
        gsap
          .timeline({
            scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: true },
          })
          .to("[data-hero-copy]", { y: -90, ease: "none", duration: 1 }, 0)
          .to("[data-hero-copy]", { opacity: 0, ease: "none", duration: 1 / 1.4 }, 0);

        // 03 Focus: each hairline draws in, then its statement lights up word by word.
        const words: HTMLElement[] = [];
        gsap.utils.toArray<HTMLElement>("[data-project]").forEach((project) => {
          gsap.fromTo(
            project.querySelector("[data-hairline]"),
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: { trigger: project, start: "top bottom", end: "top 70%", scrub: true },
            },
          );

          const statement = project.querySelector<HTMLElement>("[data-statement]");
          if (!statement) return;
          const own = gsap.utils.toArray<HTMLElement>("[data-word]", statement);
          words.push(...own);
          // One trigger per statement, writing each word's opacity: cheaper than a tween per word.
          const paint = (progress: number) =>
            own.forEach((word, i) => {
              word.style.opacity = String(wordOpacity(progress, i, own.length));
            });
          const update = (self: ScrollTrigger) =>
            paint(readProgress(self.scroll(), self.start, self.end, ScrollTrigger.maxScroll(window)));
          ScrollTrigger.create({
            trigger: statement,
            start: "top 90%",
            end: "top 40%",
            onUpdate: update,
            onRefresh: update,
          });
        });

        return () => words.forEach((word) => word.style.removeProperty("opacity"));
      });

      // Geist swaps in after first layout; trigger positions are measured against it.
      void document.fonts.ready.then(() => ScrollTrigger.refresh());
    },
    { scope },
  );

  return (
    <main ref={scope} className="flex flex-1 flex-col">
      {children}
    </main>
  );
}
