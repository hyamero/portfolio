"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { usePathname } from "next/navigation";
import { ScrollToPlugin } from "gsap/dist/ScrollToPlugin";
import {
  Home,
  Leaf,
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
import { Icons } from "./icons";
import { useStateStore } from "@/lib/state-store";
import usePageTransition from "./animations/use-page-transition";

gsap.registerPlugin(useGSAP, ScrollToPlugin);

type CommandGroupData = {
  group: string;
  items: {
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    url?: string;
  }[];
};

const commands: CommandGroupData[] = [
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
      {
        Icon: Icons.gitHub,
        title: "GitHub",
        url: "https://github.com/hyamero",
      },
      {
        Icon: Icons.linkedIn,
        title: "LinkedIn",
        url: "https://linkedin.com/in/daleban",
      },
    ],
  },
];

const isEditableTarget = (target: EventTarget | null) =>
  (target instanceof HTMLElement && target.isContentEditable) ||
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement;

export function CommandMenu() {
  const pathname = usePathname();
  const { contextSafe } = useGSAP();
  const { animatePageOut } = usePageTransition();

  const open = useStateStore((state) => state.openMenu);
  const setOpen = useStateStore((state) => state.setOpenMenu);
  const toggleOpen = useStateStore((state) => state.toggleOpenMenu);

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
        if (isEditableTarget(e.target)) return;

        e.preventDefault();
        toggleOpen();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggleOpen]);

  const commandAction = (group: string, title: string) => {
    if (group === "home") {
      scrollTo(title, 0);
    } else if (group === "Projects" && title !== pathname.split("/")[2]) {
      animatePageOut(`/project/${title}`);
    }

    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList data-lenis-prevent>
        <CommandEmpty>No results found.</CommandEmpty>

        {commands.map(({ group, items }) => (
          <CommandGroup key={group} heading={group === "home" ? "" : group}>
            {items.map(({ Icon, title, url }) =>
              url ? (
                <Link
                  key={title}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CommandItem className="cursor-pointer">
                    <Icon className="mr-2 size-4" />
                    <span className="capitalize">{title}</span>
                  </CommandItem>
                </Link>
              ) : (
                <CommandItem
                  key={title}
                  onSelect={() => commandAction(group, title)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 size-4" />
                  <span className="capitalize">{title}</span>
                </CommandItem>
              ),
            )}
            <CommandSeparator />
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
