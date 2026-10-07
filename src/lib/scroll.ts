import { flight } from "@/lib/flight";

const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

/** Glides to a section with Lenis; without it (reduced motion), jumps there natively. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const { lenis } = flight;
  if (!lenis) return el.scrollIntoView();
  // A number target, so the header offset doesn't depend on Lenis reading scroll-margin.
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY - margin, {
    duration: 1.2,
    easing: easeOutQuint,
  });
}
