import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveShader } from "@vgpu/wgsl/runtime";

import { endFrame, startFrame } from "@/lib/camera";
import { BG, CORE, encode, GROUND, shoulder, type Rgb } from "@/lib/light";
import { NARROW, PLANET, WIDE } from "@/lib/stills";

/*
 * What the CSS sky's stills are rendered from (sky polish spec §7.1), shared by the stills script
 * and the staleness test. Node only.
 */

export const ROOT = path.resolve(import.meta.dir, "../../..");
export const STILLS_ENTRY = path.join(ROOT, "src/components/sky/wgsl/stills.wgsl");
export const STAR_CHECK_ENTRY = path.join(ROOT, "src/components/sky/wgsl/star-check.wgsl");
// The script inverts with light.ts's encode, shoulder and GROUND, which mirror light.wgsl and
// air.wgsl: a change to either side must re-render the stills.
const LIGHT = [path.join(ROOT, "src/components/sky/wgsl/light.wgsl"), path.join(ROOT, "src/lib/light.ts")];

export type Still = {
  file: string;
  /** Rendered px, and px per CSS px of the frame it models. */
  size: readonly [number, number];
  dpr: number;
  /** The layout width the frame models. */
  W: number;
  time: number;
  /** C.x, C.y, R, then B.x, B.y and morph, in the still's CSS px. */
  body: readonly [number, number, number];
  sun: readonly [number, number, number];
  /** How far the planet is lit, and the light it faces, in the still's CSS px. */
  dawn: number;
  light: readonly [number, number];
  /** What the CSS puts under the still where the body covers it: the planet's core, or the ground. */
  interior: "planet" | "ground";
};

function planet(): Still {
  // The hero's planet at 1440, where its radius is 0.64 W, rendered at PLANET.R px.
  const R = 0.64 * 1440;
  const dpr = PLANET.R / R;
  const start = startFrame({ left: 0, top: 0.4 * R, width: 2 * R, height: 2 * R }, 0);
  // The resting light (restingLight) as it sits from the planet at 1440 × 900: 0.42 W across, a
  // quarter of the hero's 1860 px over its top, with the planet 0.62 W across and its apex at 563.
  const light = [start.C[0] + 0.42 * 1440 - 0.62 * 1440, start.C[1] - 0.25 * 1860 - (563 + R)] as const;
  return {
    file: PLANET.src.slice("/sky/".length),
    size: PLANET.size,
    dpr,
    W: 1440,
    time: 0,
    body: [start.C[0], start.C[1], R],
    sun: [start.B[0], start.B[1], 0],
    light,
    dawn: 1,
    interior: "planet",
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
    sun: [e.B[0], e.B[1], 1],
    // Only the planet faces the light; without a pointer the horizon's lobe sits on the sun.
    light: [e.B[0], e.B[1] - 400],
    dawn: 1,
    interior: "ground",
  };
}

export const STILLS: readonly Still[] = [planet(), horizon(WIDE), horizon(NARROW)];

/** Every file the stills are rendered from, relative to the repo. */
export async function stillsFiles() {
  const { deps } = await resolveShader({ entry: STILLS_ENTRY });
  return [...new Set([...deps, ...LIGHT])].map((file) => path.relative(ROOT, file)).sort();
}

/** A SHA-256 of the stills' parameters and of every file they're rendered from. */
export async function stillsHash() {
  const hash = createHash("sha256").update(JSON.stringify(STILLS));
  for (const file of await stillsFiles()) hash.update(file).update("\0").update(await readFile(path.join(ROOT, file)));
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

export const INTERIOR: Record<Still["interior"], Rgb> = { planet: CORE, ground: GROUND };
