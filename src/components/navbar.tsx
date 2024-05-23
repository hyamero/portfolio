"use client";

import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="container fixed left-0 right-0 top-0 z-50 mx-auto mt-10 flex justify-between text-foreground mix-blend-difference">
      <button
        className="nav-item font-neue-roman text-lg tracking-tight"
        onClick={() => {
          setIsOpen(false);
        }}
      >
        hyamero.
      </button>

      <button
        type="button"
        className="nav-item menu-burger group flex w-8 cursor-pointer flex-col items-center justify-center space-y-1 py-3 [&>span]:block [&>span]:h-[1.5px] [&>span]:w-full [&>span]:transform [&>span]:bg-foreground [&>span]:transition [&>span]:duration-300"
        onClick={() => setIsOpen(!isOpen)}
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
  );
}
