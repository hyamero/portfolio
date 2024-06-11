import gsap from "gsap";

const menuOpen: GSAPTimeline = gsap.timeline();
const menuClose: GSAPTimeline = gsap.timeline();

const scrollTo = (scrollElement: string, offsetY: number) => {
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: `#${scrollElement}`, offsetY },
    ease: "power2.easeOut",
  });
};

const openMenu = () => {
  menuOpen
    .to(".menu", {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      ease: "power2.easeInOut",
      duration: 0.5,
    })
    .to(
      "body",
      {
        overflowY: "hidden",
      },
      "<",
    )
    .fromTo(
      ".menu-item, .menu-item-title",
      {
        y: -150,
        opacity: 0,
        skewX: -10,
      },
      {
        y: 0,
        opacity: 1,
        skewX: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power4.out",
      },
      "-=0.1",
    );
};

const closeMenu = () => {
  menuClose
    .fromTo(
      ".menu-item, .menu-item-title",
      {
        y: 0,
        opacity: 1,
      },
      {
        opacity: 0,
        y: -150,
        duration: 0.4,
        stagger: 0.1,
        ease: "power4.out",
      },
    )
    .to(
      "body",
      {
        overflowY: "auto",
      },
      "<",
    )
    .to(
      ".menu",
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
        ease: "power2.easeInOut",
        duration: 0.5,
      },
      "-=0.4",
    );
};

export { openMenu, closeMenu, scrollTo };
