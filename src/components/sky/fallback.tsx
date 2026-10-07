import type { CSSProperties } from "react";

const mask = (image: string): CSSProperties => ({
  WebkitMaskImage: image,
  maskImage: image,
});

/** [left %, top px, size px, twinkle delay s] */
type Star = readonly [number, number, number, number];

const HERO_STARS: readonly Star[] = [
  [7, 150, 1.5, 0], [12, 300, 1, 2.9], [16, 420, 1, 1.1], [23, 96, 1, 2.2],
  [31, 610, 1.5, 0.5], [38, 180, 1, 1.6], [47, 128, 1, 2.8], [55, 72, 1.5, 0.3],
  [66, 600, 1, 1.3], [73, 160, 1.5, 2], [79, 130, 1, 0.8], [84, 560, 1, 0.6],
  [88, 380, 1, 2.4], [94, 170, 1.5, 1.4],
];
const CONTACT_STARS: readonly Star[] = [
  [9, 120, 1.5, 0.7], [21, 460, 1, 2.1], [36, 86, 1, 1.2],
  [64, 520, 1.5, 0.2], [77, 140, 1, 2.6], [91, 400, 1, 1.7],
];

function Stars({ stars }: { stars: readonly Star[] }) {
  return stars.map(([left, top, size, delay]) => (
    <span
      key={`${left}-${top}`}
      className="animate-twinkle absolute rounded-full bg-white"
      style={{ left: `${left}%`, top, width: size, height: size, animationDelay: `${delay}s` }}
    />
  ));
}

const FLARE = (core: number, glow: number, fade: number, alpha: number) =>
  `radial-gradient(circle, rgba(236,243,255,0.95) 0 ${core}px, rgba(201,220,255,0.32) ${glow}px, rgba(201,220,255,0) ${fade}px), ` +
  `linear-gradient(90deg, rgba(214,228,255,0), rgba(214,228,255,${alpha}), rgba(214,228,255,0)) center / 100% 1px no-repeat, ` +
  `linear-gradient(rgba(214,228,255,0), rgba(214,228,255,${alpha}), rgba(214,228,255,0)) center / 1px 100% no-repeat`;

const ORB = "max(124%, 1824px)";

export function HeroSky() {
  return (
    <div
      aria-hidden="true"
      className="sky-fallback pointer-events-none absolute inset-0 -z-2 overflow-hidden"
      style={mask("linear-gradient(#000 82%, transparent 100%)")}
    >
      <div
        className="absolute rounded-full"
        style={{ left: "50%", top: "68%", width: 1640, height: 820, margin: "-560px 0 0 -820px", background: "radial-gradient(closest-side, rgba(58,88,170,0.2), rgba(58,88,170,0.07) 55%, rgba(58,88,170,0) 100%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: "2%", top: "16%", width: 640, height: 300, transform: "rotate(-14deg)", background: "radial-gradient(closest-side, rgba(88,66,156,0.13), rgba(88,66,156,0) 100%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ right: "1%", top: "24%", width: 580, height: 280, transform: "rotate(12deg)", background: "radial-gradient(closest-side, rgba(50,106,128,0.12), rgba(50,106,128,0) 100%)" }}
      />
      <Stars stars={HERO_STARS} />
      <div
        className="absolute inset-0"
        style={mask("linear-gradient(90deg, #000 0%, #000 14%, transparent 23%, transparent 77%, #000 86%, #000 100%)")}
      >
        <div
          className="absolute aspect-square -translate-x-1/2 rounded-full"
          style={{ left: "50%", top: "calc(68% - 110px)", width: `calc(${ORB} + 220px)`, border: "1px solid rgba(201,220,255,0.08)", ...mask("linear-gradient(#000 0%, #000 8%, transparent 22%)") }}
        />
        <div
          className="absolute aspect-square -translate-x-1/2 rounded-full"
          style={{ left: "50%", top: "calc(68% - 310px)", width: `calc(${ORB} + 620px)`, border: "1px solid rgba(201,220,255,0.06)", ...mask("linear-gradient(#000 0%, #000 10%, transparent 26%)") }}
        />
      </div>
      <span
        className="animate-flare absolute"
        style={{ left: "calc(50% + 639px)", top: "calc(68% - 130px)", width: 30, height: 30, margin: "-15px 0 0 -15px", background: FLARE(1.4, 2.8, 7, 0.85) }}
      />
      <span
        className="animate-flare absolute"
        style={{ left: "calc(50% - 594px)", top: "calc(68% + 80px)", width: 22, height: 22, margin: "-11px 0 0 -11px", animationDelay: "-2.2s", background: FLARE(1.1, 2.4, 6, 0.75) }}
      />
      <div
        className="absolute aspect-square -translate-x-1/2 rounded-full"
        style={{ left: "50%", top: "calc(68% - 150px)", width: `calc(${ORB} + 300px)`, background: "radial-gradient(circle closest-side, rgba(84,106,124,0) 85.6%, rgba(92,116,138,0.38) 85.9%, rgba(84,106,124,0.13) 91%, rgba(84,106,124,0) 100%)", ...mask("linear-gradient(#000 0%, #000 12%, transparent 34%)") }}
      />
      <div
        className="absolute aspect-square -translate-x-1/2 rounded-full"
        style={{ left: "50%", top: "68%", width: ORB, background: "linear-gradient(90deg, rgba(4,5,11,0.35), rgba(4,5,11,0) 30%, rgba(4,5,11,0) 62%, rgba(4,5,11,0.45)), radial-gradient(circle closest-side, #04050b 0%, #04050b 60%, #070c26 72%, #10204a 81%, #284c8c 89.5%, #5287d6 95.5%, #86b6f4 98.6%, #b8d5fd 100%)" }}
      />
      <div
        className="absolute aspect-square -translate-x-1/2 rounded-full"
        style={{ left: "50%", top: "calc(68% - 20px)", width: `calc(${ORB} + 40px)`, background: "radial-gradient(circle closest-side, rgba(201,220,255,0) 96.7%, rgba(201,220,255,0.35) 97.45%, rgba(220,234,255,0.95) 97.85%, rgba(201,220,255,0.3) 98.3%, rgba(201,220,255,0) 99.3%)" }}
      />
    </div>
  );
}

export function ContactSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <div
        className="absolute rounded-full"
        style={{ left: "50%", bottom: -260, width: 1500, height: 640, marginLeft: -750, background: "radial-gradient(closest-side, rgba(58,88,170,0.18), rgba(58,88,170,0.06) 55%, rgba(58,88,170,0) 100%)" }}
      />
      <Stars stars={CONTACT_STARS} />
      <div
        className="absolute inset-0"
        style={mask("radial-gradient(ellipse 62% 140% at 50% 100%, #000 40%, transparent 100%)")}
      >
        <div
          className="absolute rounded-full"
          style={{ left: "50%", top: "calc(100% - 123px)", width: 6336, height: 6336, marginLeft: -3168, background: "radial-gradient(circle closest-side, #05060a 98.9%, rgba(46,77,140,0.5) 99.62%, rgba(201,220,255,0.95) 99.975%, rgba(201,220,255,0) 100%)", boxShadow: "0 0 70px 8px rgba(77,107,158,0.5), 0 0 16px 1px rgba(201,220,255,0.4)" }}
        />
      </div>
    </div>
  );
}

export function SkyGrain() {
  return (
    <svg
      aria-hidden="true"
      className="sky-fallback pointer-events-none fixed inset-0 -z-2 size-full opacity-5"
    >
      <filter id="sky-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.6 -1.2" />
      </filter>
      <rect width="100%" height="100%" fill="#fff" filter="url(#sky-grain)" />
    </svg>
  );
}
