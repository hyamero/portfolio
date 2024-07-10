"use client";

import gsap from "gsap";
import { NavMenu } from "./nav-menu";
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";
import PageTransition from "./animations/page-transition";
import React, { useEffect, useRef, useState } from "react";

gsap.registerPlugin(useGSAP, ScrollToPlugin);

export default function Navbar() {
  const pathname = usePathname();

  const tl = useRef<GSAPTimeline>();
  const { contextSafe } = useGSAP();
  const navRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { animatePageOut } = PageTransition();

  const scrollTo = contextSafe((scrollElement: string, offsetY: number) => {
    setIsOpen(false);

    gsap.to(window, {
      duration: 1,
      scrollTo: { y: `#${scrollElement}`, offsetY },
      ease: "power2.easeOut",
    });
  });

  const toggleNav = contextSafe(() => {
    if (!isOpen) {
      setIsOpen(true);
    } else {
      tl.current?.reverse().eventCallback("onReverseComplete", () => {
        setIsOpen(false);
      });
    }
  });

  useGSAP(
    () => {
      if (isOpen) {
        tl.current = gsap
          .timeline()
          .to(".menu", {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            ease: "power2.easeInOut",
            duration: 0.5,
          })
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
      } else return;
    },
    { dependencies: [isOpen], scope: navRef },
  );

  /**
   * Close nav when clicked outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <div ref={navRef}>
      <nav className="container fixed left-0 right-0 top-0 z-50 mx-auto mt-10 flex justify-between text-foreground mix-blend-difference">
        <button
          className="nav-item text-xl font-normal tracking-tighter"
          onClick={() => {
            if (pathname !== "/") {
              animatePageOut("/");
            } else {
              scrollTo("home", 0);
            }
          }}
        >
          hyamero.
        </button>

        <button
          type="button"
          className="nav-item menu-burger group flex w-8 cursor-pointer flex-col items-center justify-center space-y-1 py-3 [&>span]:block [&>span]:h-[1.5px] [&>span]:w-full [&>span]:transform [&>span]:bg-foreground [&>span]:transition [&>span]:duration-300"
          onClick={() => toggleNav()}
        >
          <span
            className={`${
              isOpen
                ? "translate-y-[3px] rotate-45 opacity-100 group-hover:opacity-50"
                : "opacity-100 group-hover:opacity-50"
            }`}
          />
          <span
            className={`${
              isOpen
                ? "-translate-y-[3px] -rotate-45 opacity-100 group-hover:opacity-50"
                : "opacity-100 group-hover:opacity-50"
            }`}
          />
        </button>
      </nav>
      {/**
       * MENU COMPONENT
       */}
      {isOpen && <NavMenu scrollTo={scrollTo} />}
    </div>
  );
}
