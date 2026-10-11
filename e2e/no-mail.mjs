// Playwright, but no page can hand a mailto: link to the OS (which opens the user's mail app).
// The page's own click handlers still run; only the navigation is cancelled.
import * as pw from "playwright";

const GUARD = `window.addEventListener("click", (e) => {
  const a = e.target instanceof Element && e.target.closest('a[href^="mailto:"]');
  if (a) e.preventDefault();
});
const open = window.open;
window.open = (u, ...rest) => (String(u).startsWith("mailto:") ? null : open.call(window, u, ...rest));`;

const guardContext = async (ctx) => {
  await ctx.addInitScript(GUARD);
  return ctx;
};

const wrap = (type) => ({
  ...type,
  launch: async (...args) => {
    const b = await type.launch(...args);
    const newContext = b.newContext.bind(b);
    b.newContext = async (...a) => guardContext(await newContext(...a));
    b.newPage = async (...a) => (await b.newContext(...a)).newPage();
    return b;
  },
});

export const chromium = wrap(pw.chromium);
export const firefox = wrap(pw.firefox);
export const webkit = wrap(pw.webkit);
