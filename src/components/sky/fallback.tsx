import { encode, GROUND, hex } from "@/lib/light";
import { ECLIPSE } from "@/lib/stills";

// The night ground's base colour, as the stills were inverted against.
const GROUND_FILL = hex(encode(GROUND));

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
 * Board 09's eclipse at totality (sky polish spec §7.3), filling the eclipse box: a black disc, the
 * shader's still screen-blended over it, and the CSS diamond (spec §6).
 */
export function EclipseSky() {
  return (
    <div aria-hidden="true" className="sky-fallback pointer-events-none absolute inset-0">
      <div className="absolute inset-0 -z-2 rounded-full bg-black" />
      <div
        className="absolute -z-2 bg-size-[100%_100%] mix-blend-screen"
        style={{ inset: ECLIPSE.inset, backgroundImage: `url(${ECLIPSE.src})` }}
      />
      {/* The bead, 135° round the edge. */}
      <div className="css-diamond absolute -z-2 size-0" style={{ left: "14.64%", top: "14.64%" }}>
        <div className="animate-bead absolute size-0">
          <span
            className="absolute rounded-full"
            style={{ left: -120, top: -120, width: 240, height: 240, background: "radial-gradient(circle closest-side, rgba(255,255,255,0.95) 0%, rgba(240,246,255,0.7) 5%, rgba(201,220,255,0.26) 18%, rgba(201,220,255,0.07) 44%, rgba(201,220,255,0) 100%)" }}
          />
          <span
            className="absolute"
            style={{ left: -255, top: -0.5, width: 510, height: 1, background: "linear-gradient(90deg, rgba(214,228,255,0), rgba(240,246,255,0.8), rgba(214,228,255,0))" }}
          />
          <span
            className="absolute"
            style={{ left: -0.5, top: -180, width: 1, height: 360, background: "linear-gradient(rgba(214,228,255,0), rgba(240,246,255,0.65), rgba(214,228,255,0))" }}
          />
          <span
            className="absolute rounded-full bg-white"
            style={{ left: -3, top: -3, width: 6, height: 6, boxShadow: "0 0 14px 5px rgba(255,255,255,0.85), 0 0 44px 14px rgba(201,220,255,0.45)" }}
          />
        </div>
      </div>
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
