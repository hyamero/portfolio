import { describe, expect, test } from "bun:test";

import { dodge, driftRegion, flightMs, homePath, pathPoint, reach, sway, SHY, TIRED, WIDE } from "./drift";

const inside = (p: { x: number; y: number }, r: { x0: number; x1: number; y0: number; y1: number }) =>
  p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;

describe("driftRegion", () => {
  // The copy and the header's foot as they measure at 1440 × 900 and 390 × 844.
  const wideCopy = { left: 80, top: 290, right: 816, bottom: 640 };
  const phoneCopy = { left: 22, top: 500, right: 368, bottom: 760 };
  test("keeps orb and sway right of the copy on wide screens", () => {
    const r = driftRegion(1440, 900, 36, wideCopy, 92);
    const { x, y } = reach(1440, 900);
    expect(r.x0 - x - 36).toBeGreaterThan(wideCopy.right);
    expect(r.x1 + x + 36).toBeLessThan(1440);
    expect(r.y0 - y - 36).toBeGreaterThan(92);
    expect(r.y1 + y + 36).toBeLessThan(900);
  });
  test("keeps orb and sway between the header and the copy on phones", () => {
    const r = driftRegion(390, 844, 24, phoneCopy, 72);
    const { x, y } = reach(390, 844);
    expect(390).toBeLessThan(WIDE);
    expect(r.x0 - x - 24).toBeGreaterThan(0);
    expect(r.x1 + x + 24).toBeLessThan(390);
    expect(r.y0 - y - 24).toBeGreaterThan(72);
    expect(r.y1 + y + 24).toBeLessThan(phoneCopy.top);
  });
  test("settles in the middle when a short screen leaves no room", () => {
    const r = driftRegion(390, 560, 24, { ...phoneCopy, top: 200 }, 72);
    expect(r.y0).toBe(r.y1);
  });
});

describe("sway", () => {
  const peak = (reach: number) => {
    let x = 0;
    let y = 0;
    for (let t = 0; t < 60; t += 0.05) {
      const s = sway(t, 1440, 900, reach);
      x = Math.max(x, Math.abs(s.x));
      y = Math.max(y, Math.abs(s.y));
    }
    return { x, y };
  };
  test("drifts within 70 by 44 px on a wide screen", () => {
    const { x, y } = peak(1);
    expect(x).toBeLessThanOrEqual(70);
    expect(y).toBeLessThanOrEqual(44);
    expect(x).toBeGreaterThan(60);
  });
  test("drifts less once it has tired of dodging", () => {
    expect(peak(TIRED).x).toBeLessThan(peak(1).x / 2);
  });
  test("scales its reach down on a phone", () => {
    expect(Math.abs(sway(0.6, 390, 844).x)).toBeLessThanOrEqual(390 * 0.06);
  });
});

describe("dodge", () => {
  const region = { x0: 940, x1: 1300, y0: 240, y1: 640 };
  const anchor = { x: 1080, y: 380 };
  test("ignores a cursor that keeps its distance", () => {
    expect(dodge(anchor, anchor, { x: anchor.x - 36 - SHY - 1, y: anchor.y }, 36, region, 160)).toBeNull();
  });
  test("hops straight away from a cursor that closes in", () => {
    const to = dodge(anchor, anchor, { x: anchor.x - 60, y: anchor.y }, 36, region, 160)!;
    expect(to.x - anchor.x).toBeGreaterThan(100);
    expect(Math.abs(to.y - anchor.y)).toBeLessThan(1);
    expect(inside(to, region)).toBe(true);
  });
  test("slips sideways when pinned against the edge of the open sky", () => {
    const pinned = { x: region.x1, y: 420 };
    const to = dodge(pinned, pinned, { x: pinned.x - 50, y: pinned.y }, 36, region, 160)!;
    expect(Math.abs(to.y - pinned.y)).toBeGreaterThan(80);
    expect(inside(to, region)).toBe(true);
  });
});

describe("homePath", () => {
  const from = { x: 1080, y: 420 };
  const to = { x: 86, y: 40 };
  const path = homePath(from, to);
  test("starts at the orb and ends in the wordmark", () => {
    expect(pathPoint(path, 0)).toEqual(from);
    expect(pathPoint(path, 1)).toEqual(to);
  });
  test("rises off the drift first and stays below the top edge", () => {
    expect(pathPoint(path, 0.25).y).toBeLessThan(from.y);
    for (let t = 0; t <= 1; t += 0.05) expect(pathPoint(path, t).y).toBeGreaterThan(30);
  });
});

describe("flightMs", () => {
  test("takes longer the farther it flies, within 0.75 to 1.2 s", () => {
    expect(flightMs(100)).toBe(750);
    expect(flightMs(1000)).toBeGreaterThan(flightMs(800));
    expect(flightMs(3000)).toBe(1200);
  });
});
