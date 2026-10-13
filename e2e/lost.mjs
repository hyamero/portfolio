// Browser checks for the 404's lost orb (src/components/lost-orb.tsx): the empty wordmark, the drift,
// the dodge and the flight home. Run: URL=http://localhost:3000/ node e2e/lost.mjs [test names]
import { mkdirSync } from "node:fs";
import { chromium } from "./no-mail.mjs";

const OUT = `${import.meta.dirname}/out/`;
mkdirSync(OUT, { recursive: true });

const URL = process.env.URL ?? "http://localhost:3000/";
const LOST = `${URL.replace(/\/$/, "")}/lost-in-space`;
const only = process.argv.slice(2);
const b = await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] });
let fail = 0;
const tests = {};
const report = (name, ok, info) => {
  console.log(name, ok ? "PASS" : "FAIL", JSON.stringify(info));
  if (!ok) fail++;
};
// Only uncaught errors: the 404 document itself logs a failed load to the console.
const open = async (opts = {}) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  const res = await p.goto(LOST);
  p.status = res?.status();
  await p.waitForSelector("[data-lost-orb][data-live]");
  await p.waitForTimeout(800);
  return p;
};
const orbAt = (p) =>
  p.evaluate(() => {
    const r = document.querySelector(".lost-orb").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width };
  });
// The copy's text, not its column: the union of its lines' boxes.
const copyAt = (p) =>
  p.evaluate(() => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("[data-lost-copy]"));
    const r = range.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  });
const wordmarkOrb = (p) => p.evaluate(() => getComputedStyle(document.querySelector("[data-wordmark-orb]")).backgroundImage);
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

tests.test_lost_page = async () => {
  const p = await open();
  const title = await p.title();
  const socket = await wordmarkOrb(p);
  const orb = await orbAt(p);
  const copy = await copyAt(p);
  const clear = orb.x - orb.size / 2 > copy.right;
  await p.screenshot({ path: `${OUT}lost-desktop.png` });
  report("test_lost_page", p.status === 404 && title === "Page not found | Dale Bañares" && socket === "none" && clear && !p.errors.length, { status: p.status, title, socket, orb, copy, errors: p.errors });
  await p.context().close();
};

tests.test_drifts = async () => {
  const p = await open();
  const a = await orbAt(p);
  await p.waitForTimeout(1500);
  const moved = gap(a, await orbAt(p));
  report("test_drifts", moved > 2, { moved: +moved.toFixed(1) });
  await p.context().close();
};

// Twice it shies away from a cursor that closes in; the third time it stays to be caught.
tests.test_shies_away = async () => {
  const p = await open();
  const hops = [];
  for (let i = 0; i < 3; i++) {
    const orb = await orbAt(p);
    const at = { x: orb.x - 40, y: orb.y };
    await p.mouse.move(at.x, at.y, { steps: 4 });
    await p.waitForTimeout(1000);
    hops.push(+gap(at, await orbAt(p)).toFixed(1));
  }
  report("test_shies_away", hops[0] > 140 && hops[1] > 140 && hops[2] < 100, { distanceAfter: hops });
  await p.context().close();
};

tests.test_catch_flies_home = async () => {
  const p = await open();
  const start = await orbAt(p);
  await p.locator(".lost-orb").focus();
  await p.keyboard.press("Enter");
  await p.waitForTimeout(450);
  const mid = await orbAt(p);
  await p.screenshot({ path: `${OUT}lost-flight.png` });
  const landed = await p.waitForSelector("[data-lost-orb][data-home]", { timeout: 2500 }).then(() => true, () => false);
  const home = await p.waitForURL(URL, { timeout: 4000 }).then(() => true, () => false);
  const socket = home ? await wordmarkOrb(p) : "";
  report("test_catch_flies_home", mid.y < start.y && mid.size < start.size && landed && home && socket.includes("radial-gradient") && !p.errors.length, { start, mid, landed, url: p.url(), errors: p.errors });
  await p.context().close();
};

tests.test_reduced_motion = async () => {
  const p = await open({ reducedMotion: "reduce" });
  const a = await orbAt(p);
  await p.waitForTimeout(1200);
  const moved = gap(a, await orbAt(p));
  await p.locator(".lost-orb").focus();
  const t0 = Date.now();
  await p.keyboard.press("Enter");
  const home = await p.waitForURL(URL, { timeout: 2000 }).then(() => true, () => false);
  report("test_reduced_motion", moved < 1 && home, { moved: +moved.toFixed(2), home, ms: Date.now() - t0 });
  await p.context().close();
};

tests.test_phone = async () => {
  const p = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const orb = await orbAt(p);
  const copy = await copyAt(p);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await p.screenshot({ path: `${OUT}lost-phone.png` });
  const above = orb.y + orb.size / 2 < copy.top;
  const inside = orb.x - orb.size / 2 > 0 && orb.x + orb.size / 2 < 390;
  const now = await orbAt(p);
  await p.touchscreen.tap(now.x, now.y);
  const home = await p.waitForURL(URL, { timeout: 4000 }).then(() => true, () => false);
  report("test_phone", above && inside && !overflow && home && !p.errors.length, { orb, copy, overflow, home, errors: p.errors });
  await p.context().close();
};

// runner
for (const [name, fn] of Object.entries(tests)) if (!only.length || only.includes(name)) await fn();
await b.close();
process.exit(fail ? 1 : 0);
