"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { activeSection, type SectionTops } from "@/lib/sections";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Section = "work" | "contact";
const SECTIONS: Section[] = ["work", "contact"];

/** A small orb under the header link of the section in view; it glides between them. */
export default function SectionMarker() {
  const ref = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const marker = ref.current;
      const nav = marker?.parentElement;
      if (!marker || !nav) return;
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const links = Object.fromEntries(
        SECTIONS.map((id) => [id, nav.querySelector<HTMLElement>(`[data-section-link="${id}"]`)]),
      ) as Record<Section, HTMLElement | null>;
      const centres: Record<Section, number> = { work: 0, contact: 0 };
      let tops: SectionTops = { work: null, contact: null };
      let current: Section | null = null;

      const show = (next: Section | null) => {
        if (next === current) return;
        const from = current;
        current = next;
        // Read per move: the setting can change while the page is open.
        const reduced = motion.matches;
        SECTIONS.forEach((id) => {
          if (id === next) links[id]?.setAttribute("aria-current", "true");
          else links[id]?.removeAttribute("aria-current");
        });
        if (!next) return gsap.to(marker, { opacity: 0, duration: reduced ? 0 : 0.4, overwrite: "auto" });
        // Appearing, it starts under its link; moving, it glides from the last one.
        if (!from || reduced) gsap.set(marker, { x: centres[next], overwrite: "auto" });
        else gsap.to(marker, { x: centres[next], duration: 0.7, ease: "power4.out", overwrite: "auto" });
        gsap.to(marker, { opacity: 1, duration: reduced ? 0 : 0.4 });
      };

      const update = () => show(activeSection(window.scrollY, window.innerHeight, tops));
      // Layout is read only on refresh.
      const refresh = () => {
        const top = (id: string) => {
          const el = document.getElementById(id);
          return el ? el.getBoundingClientRect().top + window.scrollY : null;
        };
        tops = { work: top("work"), contact: top("contact") };
        SECTIONS.forEach((id) => {
          const link = links[id];
          if (link) centres[id] = link.offsetLeft + link.offsetWidth / 2 - marker.offsetWidth / 2;
        });
        if (current) gsap.set(marker, { x: centres[current] });
        update();
      };

      const trigger = ScrollTrigger.create({ start: 0, end: "max", onUpdate: update, onRefresh: refresh });
      refresh();
      return () => {
        trigger.kill();
        SECTIONS.forEach((id) => links[id]?.removeAttribute("aria-current"));
      };
    },
    { dependencies: [pathname] },
  );

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-marker
      className="orb-dot pointer-events-none absolute bottom-1 left-0 size-[5px] rounded-full opacity-0"
    />
  );
}
