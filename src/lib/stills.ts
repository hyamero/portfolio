import { RADIUS_PER_WIDTH } from "./eclipse";

/*
 * Where the CSS sky's stills sit (sky polish spec §7.1, §7.3). Each horizon still is the shader's
 * hold frame: a strip from `above` px over the limb's apex to `below` px under it, at layout width W.
 */

/** From this width every size in the horizon scales with it, so one still scales exactly. */
export const WIDE_FROM = 864;
export const WIDE = { src: "/sky/horizon-1440.avif", W: 1440, above: 320, below: 64 } as const;
export const NARROW = { src: "/sky/horizon-390.avif", W: 390, above: 192, below: 40 } as const;
export const ECLIPSE = { src: "/sky/eclipse.avif", size: 2048, R: 256, inset: "-150%" } as const;

/** The horizon still for a viewport W px wide: its CSS size, the apex's depth in it, and how it scales. */
export function horizonStill(W: number) {
  const still = W >= WIDE_FROM ? WIDE : NARROW;
  // Wide: scaled uniformly. Narrow: stretched across only, since below 864 px the air's heights are pinned.
  const scale = still === WIDE ? W / WIDE.W : 1;
  const stretch = still === WIDE ? 1 : W / NARROW.W;
  return {
    src: still.src,
    scale,
    stretch,
    width: W,
    height: (still.above + still.below) * scale,
    apex: still.above * scale,
    // The CSS ground's ellipse under it, which matches the still's limb.
    ground: { rx: RADIUS_PER_WIDTH * still.W * scale * stretch, ry: RADIUS_PER_WIDTH * still.W * scale },
  };
}

/** The eclipse still, centred on the eclipse box at 4× its width, so its R = 256 is the box's radius. */
export function eclipseStill(box: { width: number }) {
  const scale = (box.width / 2) / ECLIPSE.R;
  return { src: ECLIPSE.src, inset: ECLIPSE.inset, size: ECLIPSE.size * scale };
}
