import { describe, expect, test } from "bun:test";

import { liftStep, PULSE_S, pulseAge, pulseEnvelope } from "./signal";

const DT = 1 / 60;

describe("liftStep", () => {
  test("eases toward its target at rate 6", () => {
    expect(liftStep(0, 1, DT, false)).toBeCloseTo(1 - Math.exp(-0.1), 9);
  });
  test("lands on the target once within 0.002", () => {
    let lift = 0;
    let steps = 0;
    while (lift !== 1 && steps < 600) {
      lift = liftStep(lift, 1, DT, false);
      steps++;
    }
    expect(lift).toBe(1);
    expect(steps).toBe(63);
    expect(liftStep(0.0015, 0, DT, false)).toBe(0);
  });
  test("jumps under reduced motion", () => {
    expect(liftStep(0, 1, DT, true)).toBe(1);
    expect(liftStep(1, 0, DT, true)).toBe(0);
  });
});

describe("pulseAge", () => {
  test("is negative with no pulse", () => {
    expect(pulseAge(5000, Number.NEGATIVE_INFINITY)).toBe(-1);
  });
  test("counts seconds since the click, then ends at 3.5 s", () => {
    expect(pulseAge(1500, 1000)).toBeCloseTo(0.5, 9);
    expect(pulseAge(1000 + PULSE_S * 1000, 1000)).toBe(-1);
  });
  test("restarts on a second click", () => {
    expect(pulseAge(4000, 1000)).toBeCloseTo(3, 9);
    expect(pulseAge(4000, 3900)).toBeCloseTo(0.1, 9);
  });
});

describe("pulseEnvelope", () => {
  test("starts at 1 and falls", () => {
    expect(pulseEnvelope(0)).toBe(1);
    let last = 1;
    for (let age = 0.1; age < PULSE_S; age += 0.1) {
      expect(pulseEnvelope(age)).toBeLessThan(last);
      last = pulseEnvelope(age);
    }
  });
  test("is 0 at 3.5 s and after, and before a pulse", () => {
    expect(pulseEnvelope(PULSE_S)).toBe(0);
    expect(pulseEnvelope(5)).toBe(0);
    expect(pulseEnvelope(-1)).toBe(0);
  });
});
