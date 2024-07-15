import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative z-50 flex h-screen flex-col items-center justify-center gap-5">
      <h2 className="text-8xl text-[clamp(2rem,10vw,6rem)] font-medium tracking-[-0.07em]">
        Page Not Found
      </h2>

      <Link
        href="/"
        className="hover-effect relative flex items-center justify-between gap-3 border-b border-border px-2 pb-2 text-base font-medium text-muted-foreground transition-colors hover:text-foreground md:text-lg"
      >
        <p>Return Home</p>
        <ArrowUpRight />
      </Link>
    </section>
  );
}
