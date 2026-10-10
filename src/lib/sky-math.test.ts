import { describe, expect, test } from "bun:test";

import {
  approach,
  armIntro,
  clamp,
  COAST,
  coastStep,
  ease,
  introProgress,
  restingLight,
  rise,
  skyDpr,
  trailFrame,
  type Rect,
} from "./sky-math";

const hero: Rect = { left: 0, top: 0, width: 1440, height: 960 };
const contact: Rect = { left: 0, top: 3000, width: 1440, height: 820 };

describe("clamp and ease", () => {
  test("clamp bounds to 0..1 by default", () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(clamp(0.3)).toBe(0.3);
    expect(clamp(5, 0.16, 1)).toBe(1);
  });
  test("ease is smoothstep", () => {
    expect(ease(0.2, 0.8, 0.2)).toBe(0);
    expect(ease(0.2, 0.8, 0.5)).toBeCloseTo(0.5);
    expect(ease(0.2, 0.8, 0.9)).toBe(1);
  });
});

describe("skyDpr", () => {
  test("caps at 1.25", () => {
    expect(skyDpr(2, 1440, 900)).toBe(1.25);
  });
  test("keeps big screens within 2.2M device pixels", () => {
    const dpr = skyDpr(2, 3840, 2160);
    expect(3840 * 2160 * dpr * dpr).toBeLessThanOrEqual(2.2e6 + 1);
  });
  test("never upscales a 1x screen", () => {
    expect(skyDpr(1, 390, 844)).toBe(1);
  });
  test("treats a missing ratio as 1", () => {
    expect(skyDpr(0, 390, 844)).toBe(1);
  });
});

describe("rise", () => {
  test("rise starts when Contact's top meets the viewport bottom", () => {
    expect(rise(3000 - 900, 900, contact)).toBe(0);
    expect(rise(3000 - 900 + 410, 900, contact)).toBeCloseTo(0.5);
    expect(rise(9000, 900, contact)).toBe(1);
  });
  test("a missing anchor never divides by zero", () => {
    const none: Rect = { left: 0, top: 0, width: 0, height: 0 };
    expect(Number.isFinite(rise(100, 900, none))).toBe(true);
  });
});

describe("introProgress", () => {
  test("eases out over 3.6 s", () => {
    expect(introProgress(-100)).toBe(0);
    expect(introProgress(1800)).toBeCloseTo(0.875);
    expect(introProgress(3600)).toBe(1);
  });
});

describe("restingLight and approach", () => {
  test("rests above the hero, a little left of center", () => {
    expect(restingLight(hero)).toEqual({ x: 1440 * 0.42, y: -240 });
  });
  test("approach eases by 1 - e^(-rate*dt)", () => {
    expect(approach(0, 10, 1, 3)).toBeCloseTo(10 * (1 - Math.exp(-3)));
    expect(approach(5, 5, 0.1)).toBe(5);
  });
});

describe("armIntro", () => {
  test("starts on the first visible frame with a hero", () => {
    expect(armIntro(null, 1000, true, true)).toBe(1000);
  });
  test("waits while the tab is hidden", () => {
    expect(armIntro(null, 1000, true, false)).toBeNull();
  });
  test("waits for a hero, and re-arms when the hero goes away", () => {
    expect(armIntro(null, 1000, false, true)).toBeNull();
    expect(armIntro(500, 1000, false, true)).toBeNull();
  });
  test("keeps a running intro", () => {
    expect(armIntro(500, 1000, true, true)).toBe(500);
  });
});

describe("trailFrame", () => {
  test("nothing sheds before the settle, and the whole trail has shed well before it ends", () => {
    expect(trailFrame(0, 0, false, true).shed).toBe(0);
    expect(trailFrame(0.85, 0, false, true).shed).toBe(1);
    expect(trailFrame(1, 0, false, true).shed).toBe(1);
  });
  test("most of the shed happens in the first quarter of the settle, while the horizon still moves", () => {
    expect(trailFrame(0.26, 0, false, true).shed).toBeGreaterThan(0.5);
  });
  test("shed grows monotonically with the settle", () => {
    let last = -1;
    for (let d = 0; d <= 1; d += 0.05) {
      const { shed } = trailFrame(d, 0, false, true);
      expect(shed).toBeGreaterThanOrEqual(last);
      last = shed;
    }
  });
  test("the ribbon appears as the horizon settles and dims as Contact rises", () => {
    expect(trailFrame(0, 0, false, true).carry).toBe(0);
    expect(trailFrame(0.35, 0, false, true).carry).toBe(1);
    expect(trailFrame(1, 1, false, true).carry).toBeCloseTo(0.6);
  });
  test("there is no ribbon without a Work section", () => {
    expect(trailFrame(1, 0, false, false).carry).toBe(0);
  });
  test("gather follows the horizon's rise", () => {
    expect(trailFrame(1, 0.4, false, true).gather).toBe(0.4);
  });
  test("reduced motion sheds nothing and holds the ribbon as still nebula", () => {
    expect(trailFrame(0.6, 1, true, true)).toEqual({ shed: 0, carry: 1, gather: 1 });
  });
});

describe("coastStep", () => {
  const DT = 1 / 60;
  const run = (v: number, velocity: number, seconds: number) => {
    for (let i = 0; i < Math.round(seconds / DT); i++) v = coastStep(v, velocity, DT);
    return v;
  };
  test("follows the scroll in its direction, at half its speed", () => {
    expect(run(0, 1000, 0.5)).toBeGreaterThan(450);
    expect(run(0, -1000, 0.5)).toBeLessThan(-450);
  });
  test("is capped", () => {
    const v = run(0, 6000, 2);
    expect(v).toBeLessThanOrEqual(COAST.max);
    expect(v).toBeGreaterThan(COAST.max - 10);
  });
  test("glides on after a stop and comes to rest within 3 s from the cap", () => {
    expect(run(COAST.max, 0, 1)).toBeGreaterThan(COAST.rest);
    let v: number = COAST.max;
    let t = 0;
    while (v !== 0 && t < 5) {
      v = coastStep(v, 0, DT);
      t += DT;
    }
    expect(v).toBe(0);
    expect(t).toBeLessThanOrEqual(3);
  });
  test("reverses quickly when the scroll does", () => {
    expect(run(400, -1000, 0.3)).toBeLessThan(0);
  });
  test("stays at rest without a scroll", () => {
    expect(coastStep(0, 0, DT)).toBe(0);
  });
});
