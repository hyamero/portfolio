import { describe, expect, test } from "bun:test";

import { parseStatement, plainStatement, wordOpacity } from "./statement";

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
