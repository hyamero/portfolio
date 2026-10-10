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
// Above the CSS horizon, whose rim sits at 64% of the runway: at least ~540 px down on a phone.
const RUNWAY_STARS: readonly Star[] = [
  [5, 120, 1.5, 0], [11, 280, 1, 2.9], [17, 72, 1, 1.1], [24, 200, 1.5, 2.2],
  [35, 110, 1, 0.5], [44, 230, 1, 1.6], [52, 80, 1.5, 2.8], [63, 165, 1, 0.3],
  [74, 100, 1.5, 1.3], [81, 260, 1, 2], [87, 150, 1, 0.8], [92, 330, 1.5, 2.4],
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

/** The hero's stars, over the stage. */
export function HeroStars() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-x-0 top-0 -z-2 h-[960px]">
      <Stars stars={HERO_STARS} />
    </div>
  );
}

/**
 * The CSS sky's stars (sky polish spec §7.2): the live sky's near and bright stars at scroll 0, from
 * the build's star map, anchored at the viewport's top left as the live field is.
 */
export function SkyStars() {
  return (
    <div
      aria-hidden="true"
      className="sky-fallback pointer-events-none fixed inset-0 -z-2 bg-[url(/sky/stars.svg)] bg-no-repeat"
    />
  );
}

const RAYS =
  "conic-gradient(from 0deg, rgba(201,220,255,0) 0deg, rgba(201,220,255,0.16) 8deg, rgba(201,220,255,0) 18deg, " +
  "rgba(201,220,255,0) 52deg, rgba(201,220,255,0.1) 61deg, rgba(201,220,255,0) 70deg, " +
  "rgba(201,220,255,0) 95deg, rgba(201,220,255,0.18) 104deg, rgba(201,220,255,0) 116deg, " +
  "rgba(201,220,255,0) 160deg, rgba(201,220,255,0.12) 172deg, rgba(201,220,255,0) 182deg, " +
  "rgba(201,220,255,0) 236deg, rgba(201,220,255,0.15) 246deg, rgba(201,220,255,0) 258deg, " +
  "rgba(201,220,255,0) 284deg, rgba(201,220,255,0.1) 292deg, rgba(201,220,255,0) 301deg, " +
  "rgba(201,220,255,0) 330deg, rgba(201,220,255,0.14) 340deg, rgba(201,220,255,0) 352deg)";

/** Baily's beads: [left %, top %, size px, glow]. */
const BAILY = [
  [7.6, 23.5, 3, "0 0 6px 2px rgba(236,243,255,0.75)"],
  [23.5, 7.6, 3, "0 0 6px 2px rgba(236,243,255,0.75)"],
  [30.5, 4, 2, "0 0 5px 1px rgba(236,243,255,0.65)"],
] as const;

/** Board 09's eclipse (spec appendix A), filling the hero's eclipse box. */
export function EclipseSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <div
        className="absolute inset-[-120%] rounded-full"
        style={{ background: "radial-gradient(circle closest-side, rgba(52,78,150,0.2), rgba(30,46,100,0.08) 42%, rgba(12,18,40,0) 100%)" }}
      />
      <div
        className="absolute inset-[-105%] rounded-full"
        style={{
          transform: "scale(1.35, 0.92) rotate(-16deg)",
          filter: "blur(14px)",
          background: RAYS,
          ...mask("radial-gradient(circle closest-side, #000 30%, rgba(0,0,0,0.45) 46%, transparent 80%)"),
        }}
      />
      <div
        className="animate-breathe absolute inset-[-60%] rounded-full"
        style={{ background: "radial-gradient(circle closest-side, rgba(226,236,255,0.6) 44%, rgba(176,200,255,0.24) 50%, rgba(130,160,236,0.1) 62%, rgba(96,126,214,0.035) 80%, rgba(96,126,214,0) 100%)" }}
      />
      <div
        className="absolute inset-[-9%] rounded-full"
        style={{ background: "radial-gradient(circle closest-side, rgba(246,249,255,0) 82%, rgba(246,249,255,0.9) 84.8%, rgba(214,228,255,0.38) 88%, rgba(201,220,255,0.1) 94%, rgba(201,220,255,0) 100%)" }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 36% 32%, #0c0f18 0%, #05060a 52%, #020203 100%)",
          boxShadow: "0 0 0 1px rgba(246,249,255,0.92), 0 0 9px 1px rgba(226,236,255,0.7), 0 0 30px 5px rgba(160,190,255,0.22)",
        }}
      />
      <span
        className="absolute"
        style={{ left: "92.4%", top: "76.5%", width: 14, height: 7, margin: "-3.5px 0 0 -7px", borderRadius: "7px 7px 2px 2px", transform: "rotate(122deg) translateY(-4px)", filter: "blur(0.6px)", background: "radial-gradient(ellipse at 50% 100%, rgba(255,150,170,0.9), rgba(255,110,140,0.35) 60%, rgba(255,110,140,0) 100%)" }}
      />
      <span
        className="absolute"
        style={{ left: "3%", top: "67.1%", width: 9, height: 5, margin: "-2.5px 0 0 -4.5px", borderRadius: "5px 5px 2px 2px", transform: "rotate(250deg) translateY(-3px)", filter: "blur(0.5px)", background: "radial-gradient(ellipse at 50% 100%, rgba(255,150,170,0.8), rgba(255,110,140,0.3) 60%, rgba(255,110,140,0) 100%)" }}
      />
      {BAILY.map(([left, top, size, glow]) => (
        <span
          key={`${left}-${top}`}
          className="absolute rounded-full bg-white"
          style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, margin: `${-size / 2}px 0 0 ${-size / 2}px`, boxShadow: glow }}
        />
      ))}
      <div className="animate-bead absolute size-0" style={{ left: "14.6%", top: "14.6%" }}>
        <span
          className="absolute rounded-full"
          style={{ left: -120, top: -120, width: 240, height: 240, background: "radial-gradient(circle closest-side, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.7) 5%, rgba(201,220,255,0.26) 18%, rgba(201,220,255,0.07) 44%, rgba(201,220,255,0) 100%)" }}
        />
        <span
          className="absolute"
          style={{ left: -200, top: -0.5, width: 400, height: 1, background: "linear-gradient(90deg, rgba(214,228,255,0), rgba(240,246,255,0.8), rgba(214,228,255,0))" }}
        />
        <span
          className="absolute"
          style={{ left: -0.5, top: -150, width: 1, height: 300, background: "linear-gradient(rgba(214,228,255,0), rgba(240,246,255,0.65), rgba(214,228,255,0))" }}
        />
        <span
          className="absolute rounded-full bg-white"
          style={{ left: -5, top: -5, width: 10, height: 10, boxShadow: "0 0 14px 5px rgba(255,255,255,0.85), 0 0 44px 14px rgba(201,220,255,0.45)" }}
        />
      </div>
    </div>
  );
}

// Board 02's planet at 1440 px wide. The CSS sky keeps it at that size on every screen.
const PLANET = 12000;

/** Board 02's horizon (spec appendix B), with its rim at 64% of the runway it fills. */
export function HorizonSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0 -z-2">
      <Stars stars={RUNWAY_STARS} />
      <div
        className="absolute rounded-full"
        style={{ left: "50%", top: "64%", width: 2800, height: 200, margin: "-100px 0 0 -1400px", background: "radial-gradient(closest-side, rgba(96,136,224,0.13), rgba(96,136,224,0) 100%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: "38%", top: "64%", width: 1400, height: 340, margin: "-170px 0 0 -700px", background: "radial-gradient(closest-side, rgba(150,184,248,0.3), rgba(84,120,206,0.12) 42%, rgba(40,60,120,0.04) 70%, rgba(40,60,120,0) 100%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: "50%", top: "64%", width: PLANET, height: PLANET, marginLeft: -PLANET / 2, background: "radial-gradient(circle closest-side, #020305 99.4%, #05080f 99.9%, #080c18 100%)", boxShadow: "0 0 0 1px rgba(150,180,240,0.28)" }}
      />
      <div
        className="absolute inset-0"
        style={mask("linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 18%, #000 33%, #000 43%, rgba(0,0,0,0.5) 62%, rgba(0,0,0,0.18) 84%, rgba(0,0,0,0.08) 100%)")}
      >
        <div
          className="absolute rounded-full"
          style={{ left: "50%", top: "64%", width: PLANET, height: PLANET, marginLeft: -PLANET / 2, boxShadow: "0 0 0 1px rgba(240,246,255,0.95), 0 -1px 4px 0 rgba(214,228,255,0.7), 0 -4px 22px 2px rgba(130,168,244,0.4)" }}
        />
      </div>
      <div className="absolute size-0" style={{ left: "38%", top: "calc(64% + 2px)" }}>
        <span
          className="animate-glint absolute"
          style={{ left: -560, top: -0.5, width: 1120, height: 1, background: "linear-gradient(90deg, rgba(214,228,255,0), rgba(236,243,255,0.85) 50%, rgba(214,228,255,0))" }}
        />
        <span
          className="absolute rounded-full"
          style={{ left: -60, top: -60, width: 120, height: 120, background: "radial-gradient(circle closest-side, rgba(255,255,255,0.9), rgba(214,228,255,0.35) 22%, rgba(201,220,255,0) 100%)" }}
        />
        <span
          className="absolute"
          style={{ left: -0.5, top: -70, width: 1, height: 140, background: "linear-gradient(rgba(214,228,255,0), rgba(236,243,255,0.6), rgba(214,228,255,0))" }}
        />
        <span
          className="absolute rounded-full bg-white"
          style={{ left: -3, top: -3, width: 6, height: 6, boxShadow: "0 0 10px 3px rgba(255,255,255,0.85), 0 0 34px 10px rgba(201,220,255,0.4)" }}
        />
      </div>
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
