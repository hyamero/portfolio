import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function StatusPage({ title }: { title: string }) {
  return (
    <section className="relative z-50 flex h-screen flex-col items-center justify-center gap-5">
      <h2 className="text-[clamp(2rem,10vw,6rem)] leading-none font-medium tracking-[-0.07em]">
        {title}
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
