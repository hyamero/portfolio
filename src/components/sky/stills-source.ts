import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveShader } from "@vgpu/wgsl/runtime";

import { endFrame, PHI0 } from "@/lib/eclipse";
import { BG, encode, GROUND, shoulder, type Rgb } from "@/lib/light";
import { NARROW, WIDE } from "@/lib/stills";

/*
 * What the CSS sky's stills are rendered from (sky polish spec §7.1), shared by the stills script
 * and the staleness test. Node only.
 */

export const ROOT = path.resolve(import.meta.dir, "../../..");
export const STILLS_ENTRY = path.join(ROOT, "src/components/sky/wgsl/stills.wgsl");
export const STAR_CHECK_ENTRY = path.join(ROOT, "src/components/sky/wgsl/star-check.wgsl");
// The script's own encode and shoulder mirror it, so a change there must re-render the stills too.
const LIGHT = path.join(ROOT, "src/components/sky/wgsl/light.wgsl");

export type Still = {
  file: string;
  /** Rendered px, and px per CSS px of the frame it models. */
  size: readonly [number, number];
  dpr: number;
  /** The layout width the frame models. */
  W: number;
  time: number;
  /** C.x, C.y, R, then B.x, B.y, morph and the diamond's strength, in the still's CSS px. */
  body: readonly [number, number, number];
  sun: readonly [number, number, number, number];
  beads: number;
  /** What the CSS puts under the still where the body covers it: the black moon disc, or the ground. */
  interior: "moon" | "ground";
};

function eclipse(): Still {
  const C = 1024;
  const R = 256;
  return {
    file: "eclipse.avif",
    size: [2048, 2048],
    dpr: 1,
    W: 1440,
    // A quarter of the diamond's 5.2 s breath: the pulse at its mean.
    time: 1.3,
    body: [C, C, R],
    sun: [C + R * Math.cos(PHI0), C - R * Math.sin(PHI0), 0, 0],
    // Totality: the beads shut, no diamond (spec §6).
    beads: -2,
    interior: "moon",
  };
}

function horizon(still: typeof WIDE | typeof NARROW): Still {
  // The hold frame with its apex `above` px from the top.
  const e = endFrame(still.W, still.above / 0.64);
  return {
    file: still.src.slice("/sky/".length),
    size: [still.W * 2, (still.above + still.below) * 2],
    dpr: 2,
    W: still.W,
    // A quarter of the sun's 6 s glint: the pulse at its mean.
    time: 1.5,
    body: [e.C[0], e.C[1], e.R],
    sun: [e.B[0], e.B[1], 1, 1],
    beads: 0.12,
    interior: "ground",
  };
}

export const STILLS: readonly Still[] = [eclipse(), horizon(WIDE), horizon(NARROW)];

/** A SHA-256 of the stills' parameters and of every shader file they're rendered from. */
export async function stillsHash() {
  const { deps } = await resolveShader({ entry: STILLS_ENTRY });
  const files = [...new Set([...deps, LIGHT])].map((file) => path.relative(ROOT, file)).sort();
  const hash = createHash("sha256").update(JSON.stringify(STILLS));
  for (const file of files) hash.update(file).update("\0").update(await readFile(path.join(ROOT, file)));
  return hash.digest("hex");
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const unit = (x: number) => Math.min(Math.max(x, 0), 1);

/**
 * A still's pixel for the live sky's linear colour `col`. The CSS composites it with
 * `mix-blend-mode: screen` over its own pixel U (the page, or the disc or ground the body covers
 * `inside` of), and screen(U, S) = 1 − (1 − U)(1 − S), so S = (E − U) / (1 − U) gives back E.
 */
export function screenInverse(col: Rgb, inside: number, interior: Rgb): Rgb {
  const under = encode(mix(BG, interior, inside));
  const want = encode(shoulder(col));
  return [0, 1, 2].map((i) => unit((want[i] - under[i]) / (1 - under[i]))) as unknown as Rgb;
}

export const INTERIOR: Record<Still["interior"], Rgb> = { moon: [0, 0, 0], ground: GROUND };
