import { cn } from "@/lib/utils";
import Link from "next/link";

export interface OrbitingIconsProps {
  href: string;
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
            className="stroke-black/10 stroke-1 dark:stroke-white/10"
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
        style={
          {
            "--duration": duration,
            "--radius": radius,
            "--delay": -delay,
          } as React.CSSProperties
        }
        className={cn(
          "animate-orbit absolute flex size-full transform-gpu items-center justify-center rounded-full border bg-black/10 [animation-delay:calc(var(--delay)*1000ms)] dark:bg-white/10",
          { "[animation-direction:reverse]": reverse },
          className,
        )}
      >
        {children}
      </Link>
    </>
  );
}
