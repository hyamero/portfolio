import gsap from "gsap";

/**
 * `from`/`to` vars for the blur-in reveal, spread into `fromTo`.
 *
 * `opacity: 100` (not 1) is what the site ships with: opacity clamps at 1, so
 * it snaps in within the first ~1% of the tween and only the blur visibly eases.
 */
export function blurIn(
  blur: number,
  vars: gsap.TweenVars = {},
): [gsap.TweenVars, gsap.TweenVars] {
  return [
    { opacity: 0, filter: `blur(${blur}px)` },
    { opacity: 100, filter: "blur(0px)", ease: "power4.inOut", ...vars },
  ];
}

/** Lifts the page-transition banner; chain page-specific reveals onto it. */
export function pageInTimeline(onBannerLifted: () => void) {
  return gsap.timeline().set("body", { overflow: "hidden" }).to(".banner div", {
    yPercent: 100,
    stagger: 0.2,
    ease: "power2.inOut",
    onComplete: onBannerLifted,
  });
}
