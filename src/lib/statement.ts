import { clamp } from "./sky-math";

export type Word = { text: string; emphasis: boolean };

/** Splits a statement into words; `*…*` marks emphasized runs. */
export function parseStatement(source: string): Word[] {
  const words: Word[] = [];
  source.split("*").forEach((run, index) => {
    for (const text of run.split(/\s+/)) {
      if (text) words.push({ text, emphasis: index % 2 === 1 });
    }
  });
  return words;
}

export function plainStatement(source: string) {
  return source.replaceAll("*", "");
}

/**
 * Read-along: each word fades up over a window four words wide, so the light runs through the
 * sentence as it scrolls from 90% to 40% of the viewport. Never below 0.16, so it stays legible.
 */
export function wordOpacity(progress: number, index: number, count: number) {
  return clamp((progress * (count + 6) - index) / 4, 0.16, 1);
}

/**
 * A statement's read-along progress. Near the page bottom its trigger's end can sit past the last
 * scroll position, so the light finishes at the bottom instead of leaving the last words dim.
 */
export function readProgress(scroll: number, start: number, end: number, maxScroll: number) {
  const stop = Math.min(end, maxScroll);
  if (stop <= start) return scroll >= stop ? 1 : 0;
  return clamp((scroll - start) / (stop - start));
}
