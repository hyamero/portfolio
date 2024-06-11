"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";

const navItems = ["tools", "design", "contact"];
const navProjects = ["omsimos", "umamin", "foliage"];

const menuOpen: GSAPTimeline = gsap.timeline();
const menuClose: GSAPTimeline = gsap.timeline();

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

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenu = () => {
    setIsOpen(!isOpen);

    if (!isOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  };

  const scrollTo = (scrollElement: string, offsetY: number) => {
    gsap.to(window, {
      duration: 1,
      scrollTo: { y: `#${scrollElement}`, offsetY },
      ease: "power2.easeOut",
    });
  };

  /**
   * Close nav when clicked outside
   */
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        divRef.current &&
        !divRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        closeMenu();
        console.log("run this");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={divRef}>
      <nav className="container fixed left-0 right-0 top-0 z-50 mx-auto mt-10 flex justify-between text-foreground mix-blend-difference">
        <button
          className="nav-item text-xl font-normal tracking-tighter"
          onClick={() => {
            closeMenu();
            scrollTo("home", 0);
            setIsOpen(false);
          }}
        >
          hyamero.
        </button>

        <button
          type="button"
          className="nav-item menu-burger group flex w-8 cursor-pointer flex-col items-center justify-center space-y-1 py-3 [&>span]:block [&>span]:h-[1.5px] [&>span]:w-full [&>span]:transform [&>span]:bg-foreground [&>span]:transition [&>span]:duration-300"
          onClick={() => handleMenu()}
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
      <Menu handleMenu={handleMenu} />
    </div>
  );
}

const Menu = ({ handleMenu }: { handleMenu: () => void }) => {
  useEffect(() => {
    const menuItems = Array.from(document.querySelectorAll(".menu-item"));
    menuItems.forEach((item: any) => {
      const word = item.children[0].innerText.split("");
      item.children[0].innerHTML = "";
      word.forEach((letter: string, idx: number) => {
        item.children[0].innerHTML += `<span style="--index: ${idx};">${letter}</span>`;
      });

      const cloneDiv = item.children[0].cloneNode(true);
      cloneDiv.style.position = "absolute";
      cloneDiv.style.left = "0";
      cloneDiv.style.top = "0";
      item.appendChild(cloneDiv);
    });
  }, []);

  gsap.registerPlugin(ScrollToPlugin);

  const scrollToSection = (scrollElement: string, offsetY: number) => {
    handleMenu();

    gsap.to(window, {
      duration: 1,
      scrollTo: { y: `#${scrollElement}`, offsetY },
      ease: "power2.easeOut",
    });
  };

  return (
    <div className="menu fixed left-0 top-0 z-30 grid h-screen w-screen place-items-center justify-center space-y-1 rounded-lg border-b bg-[#111] bg-opacity-35 text-secondary backdrop-blur-lg [clipPath:polygon(0%_0%,_100%_0%,_100%_0%,_0%_0%)] sm:h-[65vh]">
      <div className="flex flex-col gap-14 sm:flex-row sm:gap-28">
        <div className="flex flex-col items-start gap-3 md:gap-5">
          <button
            onClick={() => {
              scrollToSection("home", 0);
            }}
            type="button"
            className="menu-item-title cursor-pointer text-left text-xs font-medium uppercase text-muted-foreground opacity-0"
          >
            Home
          </button>
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className="menu-item text-4xl font-light tracking-tighter opacity-0 md:text-5xl"
              onClick={() => {
                scrollToSection(item, 0);
              }}
            >
              <div className="col-start-2 row-start-2 flex font-light tracking-tighter">
                <span className="menu-item-text capitalize">{item}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-start gap-3 md:gap-5">
          <button
            onClick={() => {
              scrollToSection("omsimos", 0);
            }}
            type="button"
            className="menu-item-title cursor-pointer text-left text-xs font-medium uppercase text-muted-foreground opacity-0"
          >
            Projects
          </button>
          {navProjects.map((item) => (
            <button
              type="button"
              key={item}
              className="menu-item text-4xl font-light tracking-tighter opacity-0 md:text-5xl"
              onClick={() => {
                scrollToSection(item, 0);
              }}
            >
              <div className="col-start-2 row-start-2 flex font-light tracking-tighter">
                <span className="menu-item-text capitalize">{item}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
