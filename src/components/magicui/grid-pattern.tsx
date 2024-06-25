"use client";

import gsap from "gsap";
import { cn } from "@/lib/utils";
import { useId, useRef } from "react";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface GridPatternProps {
  width?: any;
  height?: any;
  x?: any;
  y?: any;
  squares?: Array<[x: number, y: number]>;
  strokeDasharray?: any;
  className?: string;
  [key: string]: any;
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  squares,
  className,
  ...props
}: GridPatternProps) {
  const id = useId();

  const tl = useRef<GSAPTimeline>();

  useGSAP(() => {
    tl.current = gsap
      .timeline({ repeat: -1 })
      .to(".rect-item", {
        opacity: 1,
        duration: 0.5,
        stagger: 0.5,
      })
      .to(".rect-item", {
        opacity: 0,
        duration: 0.5,
        stagger: 0.5,
      });
  });

  function calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function generateRandomSquares(
    count: number,
    max: number,
    minDistance: number,
  ): [x: number, y: number][] {
    const squares: [x: number, y: number][] = [];
    const generatedPairs: Set<string> = new Set(); // Set to store generated pairs as strings "x,y"

    while (squares.length < count) {
      const x = getRandomInt(10, max);
      const y = getRandomInt(10, max);
      let isValid = true;

      // Check distance from existing squares
      for (const [px, py] of squares) {
        if (calculateDistance(x, y, px, py) < minDistance) {
          isValid = false;
          break;
        }
      }

      if (isValid) {
        const pairString = `${x},${y}`;
        squares.push([x, y]);
        generatedPairs.add(pairString);
      }
    }

    return squares;
  }

  const randomSquares = generateRandomSquares(15, 30, 5);

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-auto absolute inset-0 h-full w-full fill-gray-400/20 stroke-gray-400/10",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      {randomSquares && (
        <svg x={x} y={y} className="overflow-visible">
          {randomSquares.map(([x, y]) => (
            <rect
              className="rect-item opacity-0"
              strokeWidth="0"
              key={`${x}-${y}`}
              width={width - 1}
              height={height - 1}
              x={x * width + 1}
              y={y * height + 1}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

export default GridPattern;
