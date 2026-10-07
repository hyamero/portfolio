import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

export function scrollToSection(id: string) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return gsap.to(window, {
    duration: reduced ? 0 : 1,
    scrollTo: { y: `#${id}` },
    ease: "power2.out",
  });
}
