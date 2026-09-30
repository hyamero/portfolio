import { cn } from "@/lib/utils";
import Link from "next/link";

export interface OrbitingIconsProps {
  href: string;
  /** Accessible name for the icon-only link. */
  label: string;
  /** Brand color the orbit trail picks up a hint of. */
  tint?: string;
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
}

export default function OrbitingIcons({
  href,
  label,
  tint,
  className,
  children,
  reverse,
  duration = 20,
  delay = 10,
  radius = 50,
  path = false,
}: OrbitingIconsProps) {
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-white/5 stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}

      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        // ContactOrbits takes over this animation's clock and draws its trail.
        data-orbit=""
        data-tint={tint}
        style={
          {
            "--duration": duration,
            "--radius": radius,
            "--delay": -delay,
          } as React.CSSProperties
        }
        className={cn(
          "absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border bg-black/10 [animation-delay:calc(var(--delay)*1000ms)] dark:bg-white/10",
          // `scale` composes with the orbit's animated transform instead of replacing it.
          "transition-[opacity,scale] duration-300 ease-out hover:scale-110 hover:opacity-100 focus-visible:scale-110 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:outline-none motion-reduce:[animation-play-state:paused]",
          { "[animation-direction:reverse]": reverse },
          className,
        )}
      >
        {children}
      </Link>
    </>
  );
}
