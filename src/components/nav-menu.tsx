"use client";

import { useEffect } from "react";

const navProjects = ["omsimos", "umamin", "foliage"];
const navItems = ["tools", "design", "contact"];

export const NavMenu = ({
  scrollTo,
}: {
  scrollTo: (scrollElement: string, offsetY: number) => void;
}) => {
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

  return (
    <div className="menu fixed left-0 top-0 z-40 grid h-screen w-screen place-items-center justify-center space-y-1 rounded-lg border-b bg-[#111] bg-opacity-95 text-secondary-foreground [clipPath:polygon(0%_0%,_100%_0%,_100%_0%,_0%_0%)]">
      <div className="flex flex-col gap-14 sm:flex-row sm:gap-28">
        <div className="flex flex-col items-start gap-3 md:gap-5">
          <button
            onClick={() => {
              scrollTo("home", 0);
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
                scrollTo(item, 0);
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
              scrollTo("omsimos", 0);
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
                scrollTo(item, 0);
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
