import { describe, expect, test } from "bun:test";

import { activeSection } from "./sections";

const tops = { work: 960, contact: 2400 };

describe("activeSection", () => {
  test("none in the hero", () => {
    expect(activeSection(0, 900, tops)).toBeNull();
    expect(activeSection(960 - 360 - 1, 900, tops)).toBeNull();
  });
  test("work once its top reaches 40% of the viewport", () => {
    expect(activeSection(960 - 360, 900, tops)).toBe("work");
    expect(activeSection(1800, 900, tops)).toBe("work");
  });
  test("contact once its top reaches 60% of the viewport", () => {
    expect(activeSection(2400 - 540, 900, tops)).toBe("contact");
    expect(activeSection(2400 - 541, 900, tops)).toBe("work");
  });
  test("missing sections are never active", () => {
    expect(activeSection(5000, 900, { work: null, contact: null })).toBeNull();
  });
});
