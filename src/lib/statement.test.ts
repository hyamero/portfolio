import { describe, expect, test } from "bun:test";

import { parseStatement, plainStatement, readProgress, wordOpacity } from "./statement";

const umamin =
  "A social platform for sending and receiving encrypted anonymous messages. Reached almost *3 million users* with more than *17.5 million page visits.*";

describe("parseStatement", () => {
  test("splits into words and marks emphasis", () => {
    const words = parseStatement(umamin);
    expect(words).toHaveLength(22);
    expect(words[0]).toEqual({ text: "A", emphasis: false });
    expect(words.slice(12, 15)).toEqual([
      { text: "3", emphasis: true },
      { text: "million", emphasis: true },
      { text: "users", emphasis: true },
    ]);
    expect(words[21]).toEqual({ text: "visits.", emphasis: true });
  });
  test("keeps punctuation attached to emphasized words", () => {
    const words = parseStatement("An *agent-first* tool into an *interactive diagram,* for");
    expect(words.map((w) => w.text)).toEqual([
      "An", "agent-first", "tool", "into", "an", "interactive", "diagram,", "for",
    ]);
    expect(words.filter((w) => w.emphasis).map((w) => w.text)).toEqual([
      "agent-first", "interactive", "diagram,",
    ]);
  });
});

describe("plainStatement", () => {
  test("drops the emphasis markers", () => {
    expect(plainStatement("An *agent-first* tool")).toBe("An agent-first tool");
  });
});

describe("wordOpacity", () => {
  test("every word starts dim", () => {
    for (let i = 0; i < 22; i++) expect(wordOpacity(0, i, 22)).toBe(0.16);
  });
  test("every word ends fully lit", () => {
    for (let i = 0; i < 22; i++) expect(wordOpacity(1, i, 22)).toBe(1);
  });
  test("words light in reading order", () => {
    expect(wordOpacity(0.3, 0, 22)).toBeGreaterThan(wordOpacity(0.3, 5, 22));
  });
});

describe("readProgress", () => {
  test("runs 0..1 between start and end", () => {
    expect(readProgress(100, 100, 300, 5000)).toBe(0);
    expect(readProgress(200, 100, 300, 5000)).toBe(0.5);
    expect(readProgress(400, 100, 300, 5000)).toBe(1);
  });
  test("finishes at the page bottom when the end can't be scrolled to", () => {
    expect(readProgress(250, 100, 300, 250)).toBe(1);
    expect(readProgress(175, 100, 300, 250)).toBe(0.5);
  });
  test("is fully lit at the bottom even when the start is out of reach", () => {
    expect(readProgress(250, 400, 600, 250)).toBe(1);
    expect(readProgress(0, 400, 600, 250)).toBe(0);
  });
});
