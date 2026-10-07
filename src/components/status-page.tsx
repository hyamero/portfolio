import Link from "next/link";

import { Arrow } from "@/components/icons";

export function StatusPage({ title }: { title: string }) {
  return (
    <main className="px-gutter flex min-h-svh flex-1 flex-col items-center justify-center gap-8 text-center">
      <h1 className="text-[clamp(2.5rem,6.4vw,5.75rem)] leading-[1.1] font-medium tracking-[-0.07em] text-balance">
        {title}
      </h1>
      <Link href="/" className="line-link text-base tracking-tight text-mute">
        Return home <Arrow dir="ne" size={13} />
      </Link>
    </main>
  );
}
