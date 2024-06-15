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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList data-lenis-prevent>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Sections">
          <CommandItem>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem>
            <Laptop2 className="mr-2 h-4 w-4" />
            <span>Projects</span>
          </CommandItem>
          <CommandItem>
            <ContactRound className="mr-2 h-4 w-4" />
            <span>Contact</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Projects">
          <CommandItem>
            <Code2Icon className="mr-2 h-4 w-4" />
            <span>Omsimos</span>
          </CommandItem>
          <CommandItem>
            <HeartHandshake className="mr-2 h-4 w-4" />
            <span>Umamin</span>
          </CommandItem>
          <CommandItem>
            <Leaf className="mr-2 h-4 w-4" />
            <span>Foliage</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Links">
          <CommandItem>
            <Paperclip className="mr-2 h-4 w-4" />
            <span>Resume</span>
          </CommandItem>
          <CommandItem>
            <Github className="mr-2 h-4 w-4" />
            <span>GitHub</span>
          </CommandItem>
          <CommandItem>
            <Linkedin className="mr-2 h-4 w-4" />
            <span>LinkedIn</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
