import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

export function scrollToSection(id: string, offsetY = 0) {
  return gsap.to(window, {
    duration: 1,
    scrollTo: { y: `#${id}`, offsetY },
    ease: "power2.easeOut",
  });
}
