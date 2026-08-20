"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";

import usePageTransition from "./animations/use-page-transition";
import { useStateStore } from "@/lib/state-store";
import { CommandMenu } from "./command-menu";
import { NavMenu } from "./nav-menu";
import { Button } from "./ui/button";

gsap.registerPlugin(useGSAP, ScrollToPlugin);

export default function Navbar() {
  const pathname = usePathname();

  const tl = useRef<GSAPTimeline | null>(null);
  const { contextSafe } = useGSAP();
  const [isOpen, setIsOpen] = useState(false);
  const { animatePageOut } = usePageTransition();

  const setOpenMenu = useStateStore((state) => state.setOpenMenu);

  // oxlint-disable-next-line react/refs -- contextSafe only wraps the callback; it runs in event handlers, not during render
  const scrollTo = contextSafe((scrollElement: string, offsetY: number) => {
    if (isOpen) {
      tl.current?.reverse().eventCallback("onReverseComplete", () => {
        setIsOpen(false);
      });
    }

    gsap.to(window, {
      duration: 1,
      scrollTo: { y: `#${scrollElement}`, offsetY },
      ease: "power2.easeOut",
    });
  });

  // oxlint-disable-next-line react/refs -- contextSafe only wraps the callback; it runs in event handlers, not during render
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
          .set("body", { overflow: "hidden" })
          .to(".menu", {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            ease: "power2.easeInOut",
            duration: 0.5,
          })
          .fromTo(
            ".menu-item, .menu-item-title",
            {
              y: -30,
              opacity: 0,
              filter: "blur(10px)",

              skewX: -10,
            },
            {
              y: 0,
              opacity: 1,
              skewX: 0,
              duration: 0.5,
              stagger: 0.1,
              filter: "blur(0px)",
              ease: "power4.out",
            },
            "-=0.1",
          );
      } else return;
    },
    { dependencies: [isOpen] },
  );

  return (
    <div>
      <CommandMenu />

      <nav className="fixed top-0 right-0 left-0 z-50 container mx-auto mt-10 flex justify-between text-foreground">
        <button
          className="nav-item rounded-md border border-muted/60 bg-black/50 px-3 text-base font-normal tracking-tighter backdrop-blur-xs sm:text-lg lg:px-5"
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

        <div className="flex items-center">
          <Button
            variant="outline"
            className="relative h-8 w-full justify-start rounded-none rounded-l-md border-muted/60 bg-black/50 text-sm font-normal text-muted-foreground shadow-none backdrop-blur-xs hover:bg-muted/40 sm:pr-12 md:w-40 lg:w-64"
            onClick={() => setOpenMenu(true)}
          >
            <span className="hidden lg:inline-flex">Quick search...</span>
            <span className="inline-flex lg:hidden">Search...</span>
            <kbd className="pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-5 items-center gap-1 rounded border border-muted/80 bg-muted/50 px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <div className="h-8 rounded-r-md border border-l-0 border-muted/60 bg-black/50 px-3 backdrop-blur-xs hover:bg-muted/40">
            <button
              type="button"
              name="menu"
              className="nav-item menu-burger group flex w-7 cursor-pointer flex-col items-center justify-center space-y-1 py-3 [&>span]:block [&>span]:h-[1.5px] [&>span]:transform [&>span]:rounded-full [&>span]:bg-foreground [&>span]:transition [&>span]:duration-300"
              onClick={() => toggleNav()}
            >
              <span
                className={`${
                  isOpen
                    ? "w-3/4 translate-y-[3px] rotate-45 opacity-80 group-hover:opacity-100"
                    : "w-full opacity-80 group-hover:opacity-100"
                }`}
              />
              <span
                className={`${
                  isOpen
                    ? "w-3/4 translate-y-[-3px] -rotate-45 opacity-80 group-hover:opacity-100"
                    : "w-full opacity-80 group-hover:opacity-100"
                }`}
              />
            </button>
          </div>
        </div>
      </nav>
      {isOpen && <NavMenu scrollTo={scrollTo} />}
    </div>
  );
}
