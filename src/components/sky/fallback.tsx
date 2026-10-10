import { CORE, encode, GROUND, hex } from "@/lib/light";
import { PLANET } from "@/lib/stills";

// The night ground's and the planet core's colours, as the stills were inverted against.
const GROUND_FILL = hex(encode(GROUND));
const CORE_FILL = hex(encode(CORE));

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

// Each layer below takes its own -z-2, not its wrapper: a z-indexed wrapper would be a stacking
// context, and the stills would screen-blend with its empty backdrop instead of the page.

/**
 * The hero's planet (sky polish spec §7.3), filling its box: a disc of the planet's navy core, and the
 * shader's still screen-blended over it. Both fade in as the live sky's body does, so the disc never
 * shows ahead of the canvas.
 */
export function PlanetSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0">
      <div className="css-dawn absolute inset-0 -z-2 rounded-full" style={{ background: CORE_FILL }} />
      <div
        className="css-dawn absolute -z-2 bg-size-[100%_100%] mix-blend-screen"
        style={{ ...PLANET.box, backgroundImage: `url(${PLANET.src})` }}
      />
    </div>
  );
}

/**
 * The resting horizon with its apex at `apex` of the box (sky polish spec §7.3): the night ground as
 * an ellipse matching the still's limb, and the shader's hold frame screen-blended over it. Their
 * sizes are in globals.css, which picks the still by width.
 */
function Horizon({ apex }: { apex: string }) {
  return (
    <>
      <div className="horizon-ground absolute left-1/2 -z-2 -translate-x-1/2 rounded-[50%]" style={{ top: apex, background: GROUND_FILL }} />
      <div className="horizon-still absolute inset-x-0 -z-2 mix-blend-screen" style={{ top: apex }} />
    </>
  );
}

/** The runway's horizon, its apex at 64%, where the live sky's hold frame puts it. */
export function HorizonSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0">
      <Horizon apex="64%" />
    </div>
  );
}

/** Contact's horizon, where the reduced-motion sky rests it: 0.15 × Contact's height above its bottom. */
export function ContactSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0">
      <Horizon apex="85%" />
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
