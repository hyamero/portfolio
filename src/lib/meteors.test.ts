import { describe, expect, test } from "bun:test";

import { meteorInFlight } from "./meteors";

describe("meteorInFlight", () => {
  test("follows the shader's schedule: none in the first slot, the first from 7.56 s for 0.79 s", () => {
    for (let t = 0; t < 7.5; t += 0.05) expect(meteorInFlight(t)).toBe(false);
    expect(meteorInFlight(7.6)).toBe(true);
    expect(meteorInFlight(8.3)).toBe(true);
    expect(meteorInFlight(8.6)).toBe(false);
  });
  test("is occasional: in flight for a small share of the time", () => {
    let on = 0;
    for (let t = 0; t < 2000; t += 0.05) if (meteorInFlight(t)) on++;
    const share = on / (2000 / 0.05);
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.15);
  });
});
