"use client";

import {
  Home,
  Leaf,
  Github,
  Laptop2,
  Linkedin,
  Code2Icon,
  Paperclip,
  ContactRound,
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

import { useEffect, useState } from "react";

export function CommandMenu() {
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

  type Commands = {
    group: string;
    items: {
      Icon: React.FC<React.SVGProps<SVGSVGElement>>;
      title: string;
      action?: () => void;
    }[];
  };

  const commands: Commands[] = [
    {
      group: "Sections",
      items: [
        { Icon: Home, title: "Home" },
        { Icon: Laptop2, title: "Projects" },
        { Icon: ContactRound, title: "Contact" },
      ],
    },
    {
      group: "Projects",
      items: [
        { Icon: Code2Icon, title: "Omsimos" },
        { Icon: HeartHandshake, title: "Umamin" },
        { Icon: Leaf, title: "Foliage" },
      ],
    },
    {
      group: "Links",
      items: [
        { Icon: Paperclip, title: "Resume" },
        { Icon: Github, title: "GitHub" },
        { Icon: Linkedin, title: "LinkedIn" },
      ],
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList data-lenis-prevent>
        <CommandEmpty>No results found.</CommandEmpty>

        {commands.map(({ group, items }) => (
          <CommandGroup key={group} heading={group}>
            {items.map(({ Icon, title, action }) => (
              <CommandItem key={title} onClick={action}>
                <Icon className="mr-2 size-4" />
                <span>{title}</span>
              </CommandItem>
            ))}
            <CommandSeparator />
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
