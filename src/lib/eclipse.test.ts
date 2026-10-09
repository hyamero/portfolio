import { describe, expect, test } from "bun:test";
import gsap from "gsap";

import {
  addCameraTweens,
  beadFlash,
  bodyFrame,
  CAMERA_KEYS,
  endFrame,
  haloFrame,
  PHI0,
  REST,
  settleFrame,
  startFrame,
  stillFrame,
  sunFrame,
  type Camera,
  type Vec,
} from "./eclipse";
import type { Rect } from "./sky-math";

// Board 09 at 1440 × 900: a 403.2 px eclipse box centred at (1096, 500).
const box: Rect = { left: 894.4, top: 298.4, width: 403.2, height: 403.2 };
const at = (zoom: number, pan: number, level: number): Camera => ({ zoom, pan, level, morph: 0 });
const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("startFrame", () => {
  test("sits on the eclipse box, with the bead 135° round its edge", () => {
    const s = startFrame(box, 0);
    expect(s.C[0]).toBeCloseTo(1096);
    expect(s.C[1]).toBeCloseTo(500);
    expect(s.R).toBeCloseTo(201.6);
    expect(Math.atan2(s.C[1] - s.B[1], s.B[0] - s.C[0])).toBeCloseTo(PHI0);
    expect(dist(s.B, s.C)).toBeCloseTo(s.R);
  });
  test("measures from the hero's top", () => {
    expect(startFrame({ ...box, top: box.top + 50 }, 50).C[1]).toBeCloseTo(500);
  });
});

describe("endFrame", () => {
  for (const [W, H] of [
    [1440, 900],
    [390, 844],
  ]) {
    test(`is board 02's horizon at ${W} × ${H}`, () => {
      const e = endFrame(W, H);
      expect(e.R).toBeCloseTo((25 / 6) * W);
      expect(e.C[0]).toBeCloseTo(W / 2);
      expect(e.C[1] - e.R).toBeCloseTo(0.64 * H);
      expect(e.B[0]).toBeCloseTo(0.38 * W);
      expect(dist(e.B, e.C)).toBeCloseTo(e.R, 6);
    });
  }
  test("puts the sun 2.5 px below the apex at 1440, at 91.65°", () => {
    const e = endFrame(1440, 900);
    expect(e.B[1] - 0.64 * 900).toBeCloseTo(2.49, 1);
    expect((e.phi * 180) / Math.PI).toBeCloseTo(91.65, 2);
  });
});

describe("bodyFrame", () => {
  const start = startFrame(box, 0);
  const end = endFrame(1440, 900);
  test("all channels at 0 are board 09, and all at 1 are board 02", () => {
    const a = bodyFrame(at(0, 0, 0), start, end);
    expect(dist(a.C, start.C)).toBeLessThan(1e-6);
    expect(a.R).toBeCloseTo(start.R, 9);
    const b = bodyFrame(at(1, 1, 1), start, end);
    expect(dist(b.C, end.C) / end.R).toBeLessThan(1e-6);
    expect(b.R).toBeCloseTo(end.R, 6);
    expect(dist(b.B, end.B)).toBeLessThan(1e-6);
  });
  test("keeps the bead on the edge", () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 100; i++) {
      const f = bodyFrame(at(rnd(), rnd(), rnd()), start, end);
      expect(Math.abs(dist(f.B, f.C) - f.R) / f.R).toBeLessThan(1e-9);
    }
  });
  test("zooms on a log scale: equal steps multiply the radius by the same factor", () => {
    const r = [0, 0.25, 0.5, 0.75, 1].map((z) => bodyFrame(at(z, 0, 0), start, end).R);
    for (let i = 1; i < r.length - 1; i++) expect(r[i + 1] / r[i]).toBeCloseTo(r[i] / r[i - 1], 9);
  });
  test("moves smoothly: a 0.001 step moves the bead less than 1 px and the radius less than 0.5%", () => {
    for (const [W, H, b] of [
      [1440, 900, box],
      [390, 844, { left: 85, top: 170, width: 220, height: 220 }],
    ] as const) {
      const s = startFrame(b, 0);
      const e = endFrame(W, H);
      for (let k = 0; k < 1000; k++) {
        const v = k / 1000;
        const p = bodyFrame(at(v, v, v), s, e);
        const q = bodyFrame(at(v + 0.001, v + 0.001, v + 0.001), s, e);
        expect(dist(p.B, q.B)).toBeLessThan(1);
        expect(Math.abs(q.R / p.R - 1)).toBeLessThan(0.005);
      }
    }
  });
  test("gives finite numbers on a page without an eclipse box", () => {
    const none = startFrame({ left: 0, top: 0, width: 0, height: 0 }, 0);
    const f = bodyFrame(at(0.5, 0.5, 0.5), none, end);
    expect([f.C[0], f.C[1], f.R, f.B[0], f.B[1]].every(Number.isFinite)).toBe(true);
  });
});

describe("settleFrame", () => {
  const H = 900;
  const end = 960;
  const hold = endFrame(1440, H);
  const apex = (scroll: number) => {
    const f = settleFrame(hold, scroll, end, H).body;
    return f.C[1] - f.R;
  };
  test("leaves the body alone before the runway's end", () => {
    expect(apex(0)).toBeCloseTo(0.64 * H);
    expect(apex(end)).toBeCloseTo(0.64 * H);
    expect(settleFrame(hold, end - 100, end, H).s).toBe(0);
  });
  test("reaches the rest line one screen past the end, and stays", () => {
    expect(apex(end + H)).toBeCloseTo(REST * H);
    expect(apex(end + 5 * H)).toBeCloseTo(REST * H);
    expect(settleFrame(hold, end + H, end, H).s).toBe(1);
  });
  test("starts at 0.44× the scroll's speed, slows to a stop and never moves up", () => {
    expect(apex(end + 1) - apex(end)).toBeCloseTo(0.44, 2);
    let last = apex(end);
    for (let y = end + 5; y <= end + 1.2 * H; y += 5) {
      const a = apex(y);
      expect(a - last).toBeGreaterThanOrEqual(0);
      expect((a - last) / 5).toBeLessThanOrEqual(0.441);
      last = a;
    }
  });
  test("waits until the timeline reports where the runway ends", () => {
    expect(settleFrame(hold, 5000, Number.POSITIVE_INFINITY, H).s).toBe(0);
  });
  test("moves the sun with the body", () => {
    const f = settleFrame(hold, end + H, end, H).body;
    expect(f.B[1] - hold.B[1]).toBeCloseTo((REST - 0.64) * H);
  });
});

describe("stillFrame", () => {
  const W = 1440;
  const H = 900;
  const start = startFrame(box, 0);
  const rects = {
    hero: { left: 0, top: 0, width: W, height: 960 },
    work: { left: 0, top: 960, width: W, height: 1400 },
    contact: { left: 0, top: 2360, width: W, height: 820 },
  };
  test("keeps the eclipse in the hero, scrolling with the page", () => {
    const f = stillFrame(start, rects, W, H, 120);
    expect(f.morph).toBe(0);
    expect(f.body.C[1]).toBeCloseTo(500 - 120);
    expect(f.body.R).toBeCloseTo(201.6);
  });
  test("rests the horizon where Contact's ends, past the middle of Work", () => {
    const bottom = 3180 - H;
    const f = stillFrame(start, rects, W, H, bottom);
    expect(f.morph).toBe(1);
    expect(f.body.C[1] - f.body.R).toBeCloseTo(2360 + 0.85 * 820 - bottom);
    expect(f.body.B[0]).toBeCloseTo(0.38 * W);
  });
  test("switches while neither is in view", () => {
    const phone = {
      hero: { left: 0, top: 0, width: 390, height: 900 },
      work: { left: 0, top: 900, width: 390, height: 1600 },
      contact: { left: 0, top: 2500, width: 390, height: 640 },
    };
    for (const [w, h, rs, b] of [
      [1440, 900, rects, box],
      [390, 844, phone, { left: 85, top: 170, width: 220, height: 220 }],
    ] as const) {
      const s = startFrame(b, 0);
      const flip = rs.work.top + rs.work.height / 2 - h / 2;
      const before = stillFrame(s, rs, w, h, flip - 1);
      const after = stillFrame(s, rs, w, h, flip + 1);
      expect(before.morph).toBe(0);
      expect(after.morph).toBe(1);
      // The eclipse's haze reaches 2.4 R past its edge; the horizon's bloom, 170 px above its rim.
      expect(before.body.C[1] + 3.4 * before.body.R).toBeLessThan(0);
      expect(after.body.C[1] - after.body.R - 170).toBeGreaterThan(h);
    }
  });
});

describe("haloFrame and sunFrame", () => {
  test("start at board 09's sizes and end at board 02's", () => {
    const a = haloFrame(0, 200);
    expect(a.ring).toBeCloseTo(36);
    expect(a.glow).toBeCloseTo(240);
    expect(a.haze).toBeCloseTo(480);
    expect(a.rays).toBe(1);
    const b = haloFrame(1, 6000);
    expect(b.ring).toBeCloseTo(22);
    expect(b.glow).toBeCloseTo(100);
    expect(b.haze).toBeCloseTo(100);
    expect(b.rays).toBe(0);
    expect(sunFrame(0, 1440)).toEqual({ core: 5, glare: 120, streakH: 200, streakV: 150 });
    const s = sunFrame(1, 1440);
    expect(s.core).toBeCloseTo(3);
    expect(s.glare).toBeCloseTo(60);
    expect(s.streakH).toBeCloseTo(560);
    expect(s.streakV).toBeCloseTo(70);
  });
  test("move one way between the two", () => {
    let last = haloFrame(0, 1000);
    for (let i = 1; i <= 20; i++) {
      const h = haloFrame(i / 20, 1000);
      expect(h.ring).toBeLessThanOrEqual(last.ring);
      expect(h.glow).toBeLessThanOrEqual(last.glow);
      expect(h.haze).toBeLessThanOrEqual(last.haze);
      expect(h.rays).toBeLessThanOrEqual(last.rays);
      last = h;
    }
  });
  test("lose the rays by halfway", () => {
    expect(haloFrame(0.5, 1000).rays).toBe(0);
  });
});

describe("beadFlash", () => {
  test("stays dark through the first half of the intro, flashes at 0.8 and settles at 1", () => {
    expect(beadFlash(0)).toBeCloseTo(0, 6);
    expect(beadFlash(0.5)).toBeCloseTo(0, 5);
    expect(beadFlash(0.8)).toBeGreaterThanOrEqual(1.4);
    expect(Math.abs(beadFlash(1) - 1)).toBeLessThan(0.01);
  });
});

describe("CAMERA_KEYS", () => {
  // GSAP keeps its own bookkeeping on a tweened object, so compare the channels by name.
  const CHANNELS = ["zoom", "pan", "level", "morph"] as const;
  const build = () => {
    const cam: Camera = { zoom: 0, pan: 0, level: 0, morph: 0 };
    const tl = gsap.timeline({ paused: true });
    addCameraTweens(tl, cam);
    return { cam, tl };
  };
  test("make a timeline of length 1", () => {
    const { tl } = build();
    expect(tl.duration()).toBeCloseTo(1);
    tl.kill();
  });
  test("put every channel at 0 at the start and at 1 from 0.85 on", () => {
    const { cam, tl } = build();
    tl.progress(0);
    for (const key of CHANNELS) expect(cam[key]).toBe(0);
    for (const p of [0.85, 1]) {
      tl.progress(p);
      for (const key of CHANNELS) expect(cam[key]).toBeCloseTo(1, 9);
    }
    tl.kill();
  });
  test("hold pan, level and morph at 0 until their start, and never run a channel backwards", () => {
    const { cam, tl } = build();
    const last = { zoom: 0, pan: 0, level: 0, morph: 0 };
    for (let i = 0; i <= 200; i++) {
      const p = i / 200;
      tl.progress(p);
      for (const key of CHANNELS) {
        if (p < CAMERA_KEYS[key].start) expect(cam[key]).toBe(0);
        expect(cam[key]).toBeGreaterThanOrEqual(last[key]);
        last[key] = cam[key];
      }
    }
    tl.kill();
  });
});
