"use client";

import gsap from "gsap";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import PageTransition from "./animations/page-transition";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";

import {
  Home,
  Leaf,
  Github,
  Linkedin,
  Newspaper,
  SquareTerminal,
  HeartHandshake,
} from "lucide-react";

import {
  CommandSeparator,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useStateStore } from "@/lib/state-store";

gsap.registerPlugin(useGSAP, ScrollToPlugin);

type Commands = {
  group: string;
  items: {
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    url?: string;
  }[];
};

const commands: Commands[] = [
  {
    group: "home",
    items: [{ Icon: Home, title: "home" }],
  },
  {
    group: "Projects",
    items: [
      { Icon: SquareTerminal, title: "omsimos" },
      { Icon: HeartHandshake, title: "umamin" },
      { Icon: Leaf, title: "foliage" },
    ],
  },
  {
    group: "Contact",
    items: [
      { Icon: Newspaper, title: "Resume", url: "/resume" },
      { Icon: Github, title: "GitHub", url: "https://github.com/hyamero" },
      {
        Icon: Linkedin,
        title: "LinkedIn",
        url: "https://linkedin.com/in/daleban",
      },
    ],
  },
];

export function CommandMenu() {
  const pathname = usePathname();
  const { contextSafe } = useGSAP();
  const { animatePageOut } = PageTransition();

  const setOpen = useStateStore((state) => state.setOpenMenu);
  const open = useStateStore((state) => state.openMenu);

  const scrollTo = contextSafe((scrollElement: string, offsetY: number) => {
    if (pathname !== "/") {
      return animatePageOut("/");
    }

    gsap.to(window, {
      duration: 1,
      scrollTo: { y: `#${scrollElement}`, offsetY },
      ease: "power2.easeOut",
    });
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const commandAction = (group: string, title: string) => {
    if (group === "home") {
      scrollTo(title, 0);
    } else if (group === "Projects") {
      if (title !== pathname.split("/")[2]) {
        animatePageOut(`/project/${title}`);
      }
    } else return;

    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList data-lenis-prevent>
        <CommandEmpty>No results found.</CommandEmpty>

        {commands.map(({ group, items }) => (
          <CommandGroup key={group} heading={group === "home" ? "" : group}>
            {items.map(({ Icon, title, url }) => (
              <React.Fragment key={title}>
                {group === "Contact" && url ? (
                  <Link href={url} target="_blank" rel="noopener noreferrer">
                    <CommandItem className="cursor-pointer">
                      <Icon className="mr-2 size-4" />
                      <span className="capitalize">{title}</span>
                    </CommandItem>
                  </Link>
                ) : (
                  <CommandItem
                    onSelect={() => commandAction(group, title)}
                    className="cursor-pointer"
                  >
                    <>
                      <Icon className="mr-2 size-4" />
                      <span className="capitalize">{title}</span>
                    </>
                  </CommandItem>
                )}
              </React.Fragment>
            ))}
            <CommandSeparator />
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
