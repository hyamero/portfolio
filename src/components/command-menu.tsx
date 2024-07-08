"use client";

import { useEffect, useState } from "react";

import {
  Home,
  Leaf,
  Github,
  Linkedin,
  SquareTerminal,
  Newspaper,
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
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePathname, useRouter } from "next/navigation";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";
import PageTransition from "./animations/page-transition";

gsap.registerPlugin(useGSAP, ScrollToPlugin);

type Commands = {
  group: string;
  items: {
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    action?: () => void;
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
      { Icon: Newspaper, title: "Resume", url: "https://github.com/hyamero" },
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
  const router = useRouter();

  const { contextSafe } = useGSAP();

  const { animatePageOut } = PageTransition();

  const scrollTo = contextSafe((scrollElement: string, offsetY: number) => {
    if (pathname !== "/") {
      animatePageOut("/");
    }

    gsap.to(window, {
      duration: 1,
      scrollTo: { y: `#${scrollElement}`, offsetY },
      ease: "power2.easeOut",
    });
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
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
            {items.map(({ Icon, title, action }) => (
              <CommandItem
                onSelect={() => commandAction(group, title)}
                key={title}
                className="cursor-pointer"
              >
                <Icon className="mr-2 size-4" />
                <span className="capitalize">{title}</span>
              </CommandItem>
            ))}
            <CommandSeparator />
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
