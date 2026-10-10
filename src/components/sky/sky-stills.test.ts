import { describe, expect, test } from "bun:test";

import { encode, GROUND, type Rgb } from "@/lib/light";

import manifest from "./stills.json";
import { screenInverse, stillsHash } from "./stills-source";

const screen = (u: number, s: number) => 1 - (1 - u) * (1 - s);

describe("the CSS sky's stills", () => {
  test("are rendered from the current shaders and parameters", async () => {
    if ((await stillsHash()) !== manifest.hash) throw new Error("The sky's stills are stale: run `bun run sky:stills`.");
  });
});

describe("screenInverse", () => {
  test("screen-blends back into the live sky's pixel over the page", () => {
    const col: Rgb = [0.2, 0.3, 0.5];
    const s = screenInverse(col, 0, GROUND);
    const under = encode([0.00182, 0.00212, 0.00304]);
    const want = encode(col);
    for (const i of [0, 1, 2]) expect(screen(under[i], s[i])).toBeCloseTo(want[i], 9);
  });
  test("over the ground it takes the ground's colour as what's under it", () => {
    const col: Rgb = [0.0033, 0.0046, 0.0104];
    const s = screenInverse(col, 1, GROUND);
    const under = encode(GROUND);
    for (const i of [0, 1, 2]) expect(screen(under[i], s[i])).toBeCloseTo(encode(col)[i], 9);
  });
  test("is 0 where the live sky is no brighter than what's under it", () => {
    expect(screenInverse([0.00182, 0.00212, 0.00304], 0, GROUND)).toEqual([0, 0, 0]);
  });
});
