"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

import { addCameraTweens, COPY_OUT } from "@/lib/eclipse";
import { flight } from "@/lib/flight";
import { readProgress, wordOpacity } from "@/lib/statement";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** The page's DOM motion: the page-in, and every scroll effect, scrubbed. The sky runs its own. */
export default function Motion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 01 Rise: the statement resolves word by word from a soft blur, then the links fade up, as
        // the eclipse lights. Its ~20 words stagger at half the old headline's pace.
        const blur = { opacity: 0, y: 16, filter: "blur(10px)" };
        const clear = { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.6, ease: "power4.out", clearProps: "filter" };
        const heroWords = gsap.utils.toArray<HTMLElement>("#home [data-head-word]");
        gsap
          .timeline({ delay: 0.5 })
          .fromTo(heroWords, blur, { ...clear, stagger: 0.04 }, 0)
          .fromTo(
            gsap.utils.toArray<HTMLElement>("[data-rise]"),
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 1.6, ease: "power4.out", stagger: 0.14 },
            Math.max(heroWords.length - 1, 0) * 0.04 + 0.14,
          );

        // "Send a signal." resolves once as it comes into view: a blur tied to scroll would read as
        // a rendering fault, so this one reveal isn't scrubbed.
        const sayWords = gsap.utils.toArray<HTMLElement>(".say [data-head-word]");
        if (sayWords.length) {
          gsap.fromTo(sayWords, blur, {
            ...clear,
            stagger: 0.1,
            scrollTrigger: { trigger: sayWords[0], start: "top 85%", once: true },
          });
        }

        // 02 Approach: across the runway the copy lifts away while the camera flies into the eclipse
        // (spec §4.1). The sky reads flight.eclipse each tick and settles the horizon from `end`.
        const camera = gsap.timeline({
          scrollTrigger: {
            trigger: "#home",
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onRefresh: (self) => {
              flight.eclipse.end = self.end;
            },
          },
        });
        camera.to("[data-hero-copy]", { y: -COPY_OUT.lift, opacity: 0, ease: "none", duration: COPY_OUT.end }, 0);
        // The sky's text mask follows the copy out (sky polish spec §3.3).
        camera.to(flight.eclipse, { copy: 0, ease: "none", duration: COPY_OUT.end }, 0);
        addCameraTweens(camera, flight.eclipse);

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

        return () => {
          // Reduced motion has no runway, so nothing may settle.
          flight.eclipse.end = Number.POSITIVE_INFINITY;
          flight.eclipse.copy = 1;
          words.forEach((word) => word.style.removeProperty("opacity"));
        };
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
