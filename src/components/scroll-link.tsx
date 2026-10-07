"use client";

import Link from "next/link";

import { scrollToSection } from "@/lib/scroll";

type ScrollLinkProps = { to: string } & Omit<
  React.ComponentProps<"a">,
  "href"
>;

/** An in-page link that glides to its section; from another page it navigates to /#<to>. */
export default function ScrollLink({ to, onClick, ...props }: ScrollLinkProps) {
  return (
    <Link
      href={to === "home" ? "/" : `/#${to}`}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
        if (event.defaultPrevented || modified || !document.getElementById(to)) return;
        event.preventDefault();
        scrollToSection(to);
        history.replaceState(null, "", to === "home" ? "/" : `#${to}`);
      }}
    />
  );
}
