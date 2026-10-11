import { flight } from "@/lib/flight";

/** Ease in and out along a sine: its peak speed is only π/2 the average, so the sky's motion reads throughout. */
export const glide = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** Seconds for a glide over `distance` px: slow enough to watch the stars and the camera pass, longer for longer trips. */
export function glideDuration(distance: number, viewportHeight: number) {
  const screens = Math.abs(distance) / Math.max(viewportHeight, 1);
  return Math.min(Math.max(1.2 + 0.45 * screens, 1.6), 4.2);
}

/** Glides to a section with Lenis; without it (reduced motion), jumps there natively. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const { lenis } = flight;
  if (!lenis) return el.scrollIntoView();
  // A number target, so the header offset doesn't depend on Lenis reading scroll-margin.
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const target = el.getBoundingClientRect().top + window.scrollY - margin;
  lenis.scrollTo(target, {
    duration: glideDuration(target - window.scrollY, window.innerHeight),
    easing: glide,
  });
}
