export type SectionTops = { work: number | null; contact: number | null };

/** The section the header marks: Contact once its top is 60% up the viewport, else Work at 40%. */
export function activeSection(scroll: number, viewportH: number, tops: SectionTops) {
  if (tops.contact !== null && tops.contact - scroll <= 0.6 * viewportH) return "contact";
  if (tops.work !== null && tops.work - scroll <= 0.4 * viewportH) return "work";
  return null;
}
