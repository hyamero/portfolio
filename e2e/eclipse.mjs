import { mkdirSync } from "node:fs";
// Browser checks for the planet-to-horizon hero (was the eclipse's) (docs/superpowers/specs/2026-10-09-eclipse-to-horizon-design.md).
// Run: URL=http://localhost:3000/ node e2e/eclipse.mjs [test names]
import { chromium, firefox } from "./no-mail.mjs";
import { PNG } from "pngjs";

const OUT = `${import.meta.dirname}/out/`;
mkdirSync(OUT, { recursive: true });

const URL = process.env.URL ?? "http://localhost:3000/";
const only = process.argv.slice(2);
const b = await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] });
let fail = 0;
const tests = {};
const report = (name, ok, info) => {
  console.log(name, ok ? "PASS" : "FAIL", JSON.stringify(info));
  if (!ok) fail++;
};
const open = async (opts = {}, init) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.addInitScript(() => {
    window.__submits = 0;
    if (!("gpu" in navigator)) return;
    const submit = GPUQueue.prototype.submit;
    GPUQueue.prototype.submit = function (...a) {
      window.__submits++; (window.__times ??= []).push(performance.now());
      return submit.apply(this, a);
    };
  });
  if (init) await p.addInitScript(init);
  await p.goto(URL);
  await p.waitForTimeout(4000);
  return p;
};
const settle = async (p) => {
  let last = NaN;
  for (let i = 0; i < 100; i++) {
    const y = await p.evaluate(() => scrollY);
    if (y === last) return y;
    last = y;
    await p.waitForTimeout(150);
  }
  return last;
};
const jump = async (p, y, wait = 2500) => {
  await p.evaluate((v) => scrollTo(0, v), y);
  await settle(p);
  await p.waitForTimeout(wait);
};
const shot = async (p, opts) => PNG.sync.read(await p.screenshot(opts));
const lum = (r, g, bl) => {
  const f = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
};
const at = (img, x, y) => {
  const i = (Math.round(y) * img.width + Math.round(x)) * 4;
  return lum(img.data[i], img.data[i + 1], img.data[i + 2]);
};
// The brightest pixel in column x between rows y0 and y1, in CSS px (screenshots are at DPR 1).
const brightestInColumn = (img, x, y0, y1) => {
  let best = { y: -1, l: -1 };
  for (let y = Math.round(y0); y <= Math.round(y1); y++) {
    const l = at(img, x, y);
    if (l > best.l) best = { y, l };
  }
  return best;
};
// The brightest pixel in a band of rows: the middle of the rim's lit lobe.
const brightestNear = (img, y0, y1) => {
  let best = { x: -1, y: -1, l: -1 };
  for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = 0; x < img.width; x++) if (at(img, x, y) > best.l) best = { x, y, l: at(img, x, y) };
  return best;
};
// The sun's column: its vertical flare and core make the tallest run of saturated pixels near the rim.
// The planet at rest, `dy` px scrolled up: its rim on the apex, its lit air just inside, its navy core deeper.
const planetAt = (img, g, dy = 0) => {
  const x = Math.round(g.C[0]);
  const apex = g.apex - dy;
  const rim = brightestInColumn(img, x, apex - 10, apex + 10);
  return { apex, rim, air: +at(img, x, apex + 0.05 * g.R).toFixed(3), core: +at(img, x, apex + 0.32 * g.R).toFixed(4) };
};
const litPlanet = (s) => Math.abs(s.rim.y - s.apex) <= 2 && s.rim.l > 0.4 && s.air > 0.12 && s.air < 0.5 && s.core < 0.02;
// Hides the page's content so only the sky (both canvases) is left to measure.
const skyOnly = (p) => p.addStyleTag({ content: "main, header { visibility: hidden !important; }" });
const geometry = (p) =>
  p.evaluate(() => {
    const box = document.querySelector('[data-sky-anchor="planet"]').getBoundingClientRect();
    const runway = document.querySelector("[data-runway]");
    return {
      W: innerWidth,
      H: innerHeight,
      C: [box.x + box.width / 2, box.y + scrollY + box.height / 2],
      R: box.width / 2,
      apex: box.y + scrollY,
      copyBottom: document.querySelector("[data-hero-copy]").getBoundingClientRect().bottom + scrollY,
      end: document.querySelector("#home").offsetHeight - innerHeight,
      runway: runway ? runway.getBoundingClientRect().height : -1,
    };
  });

tests.test_hero_layout = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    const g = await geometry(p);
    const words = await p.$$eval("#home h1 [data-head-word]", (els) => els.map((e) => e.textContent));
    const stop = await p.$eval("#home h1 [data-head-word]:last-child", (e) => !!e.querySelector(".full-stop") && e.querySelector(".sr-only")?.textContent === ".");
    const pageWidth = await p.evaluate(() => document.documentElement.scrollWidth);
    const ok =
      Math.abs(g.C[0] - 0.62 * w) < 1.5 && Math.abs(2 * g.R - Math.max(1.28 * w, 1120)) < 1 && g.apex >= g.copyBottom + 63 && g.apex < h - 150 &&
      g.runway === h && words.length === 19 && words[18] === "EU." && stop && pageWidth === w && p.errors.length === 0;
    report(`test_hero_layout ${w}`, ok, { C: g.C, R: g.R, apex: g.apex, copyBottom: g.copyBottom, runway: g.runway, words: words.length, last: words[18], stop, pageWidth, errors: p.errors });
    await p.context().close();
  }
  const p = await open({ reducedMotion: "reduce" });
  const g = await geometry(p);
  report("test_hero_layout reduced", g.runway === 0, { runway: g.runway });
  await p.context().close();
};

tests.test_css_story = async () => {
  const ff = await firefox.launch();
  const p = await ff.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto(URL);
  await p.waitForTimeout(3500);
  const sky = await p.evaluate(() => document.documentElement.dataset.sky);
  await p.addStyleTag({ content: "main > section:first-child [data-hero-copy], header { visibility: hidden !important; }" });
  const g = await geometry(p);
  const planet = planetAt(await shot(p), g);
  await p.evaluate((v) => scrollTo(0, v), g.end);
  await p.waitForTimeout(1500);
  const hold = await shot(p);
  const lobe = brightestNear(hold, 0.64 * 900 - 40, 0.64 * 900 + 40);
  await p.screenshot({ path: OUT + "css-hold-1440.png" });
  report("test_css_story", sky === "css" && litPlanet(planet) && Math.abs(lobe.x - 720) < 0.08 * 1440 && errors.length === 0, { sky, planet, lobe, errors });
  await ff.close();
};

tests.test_copy_fade = async () => {
  const p = await open();
  const g = await geometry(p);
  const read = () => p.$eval("[data-hero-copy]", (e) => ({ o: +getComputedStyle(e).opacity, y: new DOMMatrix(getComputedStyle(e).transform).m42 }));
  const top = await read();
  await jump(p, 0.3 * g.end, 300);
  const gone = await read();
  await jump(p, g.end, 300);
  const end = await read();
  await jump(p, 0, 300);
  const back = await read();
  report("test_copy_fade", top.o === 1 && gone.o < 0.05 && Math.abs(gone.y + 90) < 2 && end.o < 0.05 && back.o === 1, { top, gone, end, back });
  await p.context().close();
};

tests.test_rest_frame = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await skyOnly(p);
    const g = await geometry(p);
    const img = await shot(p);
    await p.screenshot({ path: OUT + `rest-${w}.png` });
    const planet = planetAt(img, g);
    report(`test_rest_frame ${w}`, litPlanet(planet) && p.errors.length === 0, planet);
    await p.context().close();
  }
};

tests.test_hold_frame = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await skyOnly(p);
    const g = await geometry(p);
    await jump(p, g.end);
    const img = await shot(p);
    const lobe = brightestNear(img, 0.64 * h - 40, 0.64 * h + 40);
    const apex = brightestInColumn(img, w / 2, 0.55 * h, 0.75 * h);
    await p.screenshot({ path: OUT + `hold-${w}.png` });
    report(`test_hold_frame ${w}`, Math.abs(lobe.x - w / 2) <= 0.08 * w && Math.abs(apex.y - 0.64 * h) <= 2, { lobe, apex });
    await p.context().close();
  }
};

tests.test_settle = async () => {
  const p = await open();
  await skyOnly(p);
  const g = await geometry(p);
  const apexes = [];
  for (const k of [0, 0.25, 0.5, 1, 2]) {
    await jump(p, g.end + k * g.H);
    apexes.push(brightestInColumn(await shot(p), g.W / 2, 0.55 * g.H, 0.97 * g.H).y);
  }
  const rising = apexes.every((y, i) => i === 0 || y >= apexes[i - 1] - 1);
  report("test_settle", rising && Math.abs(apexes[3] - 0.8 * g.H) <= 2 && Math.abs(apexes[4] - 0.8 * g.H) <= 2, { apexes });
  await p.context().close();
};

tests.test_story = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    const g = await geometry(p);
    const points = [
      ["0", 0], ["25", 0.25 * g.end], ["50", 0.5 * g.end], ["75", 0.75 * g.end], ["hold", g.end],
      ["settle", g.end + 0.5 * h], ["rest", g.end + 1.2 * h], ["work", null], ["bottom", 1e6],
    ];
    for (const [name, y] of points) {
      if (y === null) await p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
      else await p.evaluate((v) => scrollTo(0, v), y);
      await settle(p);
      await p.waitForTimeout(2500);
      await p.screenshot({ path: OUT + `story-${name}-${w}.png` });
    }
    report(`test_story ${w}`, p.errors.length === 0, { errors: p.errors });
    await p.context().close();
  }
};

tests.test_reduced_still = async () => {
  const p = await open({ reducedMotion: "reduce" });
  const words = await p.$$eval("#home [data-head-word]", (els) => els.map((e) => getComputedStyle(e).opacity));
  await skyOnly(p);
  const g = await geometry(p);
  await jump(p, 300, 800);
  const planet = planetAt(await shot(p), g, 300);
  await jump(p, 1e6, 800);
  const contact = await p.evaluate(() => {
    const r = document.querySelector("#contact").getBoundingClientRect();
    return { top: r.top, height: r.height };
  });
  const expected = contact.top + 0.8 * contact.height;
  const apex = brightestInColumn(await shot(p), 720, expected - 40, Math.min(899, expected + 40));
  report("test_reduced_still", words.length === 19 && words.every((o) => o === "1") && litPlanet(planet) && Math.abs(apex.y - expected) <= 3, { planet, apex, expected });
  await p.context().close();
};

tests.test_front_layer = async () => {
  const p = await open();
  const g = await geometry(p);
  const state = () => p.evaluate(() => {
    const c = document.querySelectorAll("canvas")[1];
    return { visibility: getComputedStyle(c).visibility, clip: c.style.clipPath };
  });
  const hero = await state();
  await jump(p, g.end + 20);
  const after = await state();
  report("test_front_layer", hero.visibility === "hidden" && after.visibility === "visible" && after.clip.startsWith("circle("), { hero, after });
  await p.context().close();
};

tests.test_reveal = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    // The last project's name: ink, never dimmed, and deep enough that the horizon has come to rest.
    const sel = "#stackmap h3";
    const top = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
    await jump(p, top - (0.8 * h - 30));
    const box = await p.$eval(sel, (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const withText = await shot(p);
    await p.addStyleTag({ content: `${sel} { visibility: hidden !important; }` });
    await p.waitForTimeout(300);
    const without = await shot(p);
    await skyOnly(p);
    await p.waitForTimeout(300);
    let above = 0;
    let below = 0;
    for (let x = Math.ceil(box.x); x < Math.min(w, box.x + box.w); x++) {
      // The resting rim, from its geometry: main's horizon is faint at the edges, where its brightest pixel can be a star.
      const rim = 0.8 * h + 2.2 * w - Math.sqrt((2.2 * w) ** 2 - (x - w / 2) ** 2);
      for (let y = Math.max(0, Math.floor(box.y)); y < Math.min(h, box.y + box.h); y++) {
        const i = (y * w + x) * 4;
        const d = Math.abs(withText.data[i] - without.data[i]) + Math.abs(withText.data[i + 1] - without.data[i + 1]) + Math.abs(withText.data[i + 2] - without.data[i + 2]);
        if (d <= 24) continue;
        if (y < rim - 3) above++;
        else if (y > rim + 3) below++;
      }
    }
    report(`test_reveal ${w}`, above > 50 && below === 0, { box, above, below });
    await p.context().close();
  }
};

tests.test_ground_click = async () => {
  const p = await open();
  const g = await geometry(p);
  const top = await p.evaluate(() => document.querySelector("#umamin .visit").getBoundingClientRect().top + scrollY);
  await jump(p, top - (g.H - 60));
  const v = await p.$eval("#umamin .visit", (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  let popups = 0;
  p.context().on("page", () => popups++);
  await p.mouse.click(v.x, v.y);
  // Chromium raises a popup 0.5–1.4 s after the click.
  await p.waitForTimeout(3000);
  report("test_ground_click", v.y > 0.88 * g.H && popups === 0, { visit: v, popups });
  await p.context().close();
};

tests.test_focus_rim = async () => {
  const p = await open();
  const g = await geometry(p);
  const top = await p.evaluate(() => document.querySelector("#omsimos .visit").getBoundingClientRect().top + scrollY);
  await jump(p, top - (g.H - 60));
  await p.focus("#omsimos .visit");
  await settle(p);
  const bottom = await p.$eval("#omsimos .visit", (e) => e.getBoundingClientRect().bottom);
  report("test_focus_rim", bottom <= 0.8 * g.H, { bottom, rim: 0.8 * g.H });
  await p.context().close();
};

tests.test_footer = async () => {
  const p = await open();
  await jump(p, 1e6);
  const box = await p.$eval("#contact footer", (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const a = await shot(p, { clip: box });
  await p.addStyleTag({ content: "#contact footer { visibility: hidden !important; }" });
  await p.waitForTimeout(300);
  const c = await shot(p, { clip: box });
  let differ = 0;
  for (let i = 0; i < a.data.length; i += 4) if (Math.abs(a.data[i] - c.data[i]) > 24) differ++;
  report("test_footer", box.y > 0.8 * 900 && differ > 100, { box, differ });
  await p.context().close();
};

tests.test_idle_rest = async () => {
  const p = await open();
  const g = await geometry(p);
  await p.mouse.move(20, 450);
  await jump(p, g.end + 2 * g.H, 3000);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(2000);
  const idle = await p.evaluate((s0) => { const t = (window.__times ?? []).slice(s0); return t.length && t[t.length - 1] - t[0] > 1300 ? t.length : 0; }, s0); // one shooting star's burst is allowed
  report("test_idle_rest", idle === 0 && s0 > 0, { s0, idle });
  await p.context().close();
};

const frontState = (p) =>
  p.evaluate(() => {
    const c = document.querySelectorAll("canvas")[1];
    return { visibility: getComputedStyle(c).visibility, clip: c.style.clipPath, sky: document.documentElement.dataset.sky };
  });

tests.test_load_mid_page = async () => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__submits = 0;
    const submit = GPUQueue.prototype.submit;
    GPUQueue.prototype.submit = function (...a) {
      window.__submits++; (window.__times ??= []).push(performance.now());
      return submit.apply(this, a);
    };
  });
  await p.goto(URL + "#umamin");
  await p.waitForTimeout(4500);
  const front = await frontState(p);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(2000);
  const idle = await p.evaluate((s0) => { const t = (window.__times ?? []).slice(s0); return t.length && t[t.length - 1] - t[0] > 1300 ? t.length : 0; }, s0); // one shooting star's burst is allowed
  await skyOnly(p);
  const apex = brightestInColumn(await shot(p), 720, 0.55 * 900, 0.97 * 900);
  report("test_load_mid_page", front.visibility === "visible" && idle === 0 && Math.abs(apex.y - 0.8 * 900) <= 2, { front, idle, apex });
  await ctx.close();
};

tests.test_resize_rest = async () => {
  const p = await open();
  const g = await geometry(p);
  await jump(p, g.end + 2 * g.H);
  await p.setViewportSize({ width: 1200, height: 800 });
  await p.waitForTimeout(2500);
  await skyOnly(p);
  const apex = brightestInColumn(await shot(p), 600, 0.55 * 800, 0.97 * 800);
  const front = await frontState(p);
  report("test_resize_rest", front.visibility === "visible" && Math.abs(apex.y - 0.8 * 800) <= 2 && p.errors.length === 0, { apex, front, errors: p.errors });
  await p.context().close();
};

tests.test_reduced_toggle = async () => {
  const p = await open();
  const g = await geometry(p);
  await jump(p, g.end + 2 * g.H);
  const before = await frontState(p);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.waitForTimeout(1500);
  const after = await frontState(p);
  await p.emulateMedia({ reducedMotion: "no-preference" });
  await p.waitForTimeout(1500);
  const back = await frontState(p);
  const y = await p.evaluate(() => scrollY);
  // Back in motion, the ground shows exactly when the scroll is past the runway.
  const expected = y >= (await geometry(p)).end ? "visible" : "hidden";
  report("test_reduced_toggle", before.visibility === "visible" && after.visibility === "hidden" && back.visibility === expected && p.errors.length === 0, { before, after, back, y, errors: p.errors });
  await p.context().close();
};

tests.test_not_found = async () => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && !m.text().includes("404") && errors.push(m.text()));
  await p.goto(URL + "no-such-page");
  await p.waitForTimeout(3500);
  const front = await frontState(p);
  report("test_not_found", front.visibility === "hidden" && errors.length === 0, { front, errors });
  await ctx.close();
};

tests.test_device_loss_front = async () => {
  const p = await open({}, () => {
    const req = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...a) {
      const d = await req.apply(this, a);
      (window.__devices ||= []).push(d);
      return d;
    };
  });
  const g = await geometry(p);
  await jump(p, g.end + 2 * g.H);
  const before = await frontState(p);
  await p.evaluate(() => window.__devices.forEach((d) => d.destroy()));
  await p.waitForTimeout(1500);
  const after = await frontState(p);
  report("test_device_loss_front", before.visibility === "visible" && after.visibility === "hidden" && after.sky === "css", { before, after });
  await p.context().close();
};

tests.test_contrast_rest = async () => {
  const DIM = lum(0x7c, 0x81, 0x8b);
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await p.addStyleTag({ content: "#home h1, #home h1 * { color: transparent !important; } .full-stop { visibility: hidden !important; }" });
    await p.waitForTimeout(300);
    const boxes = await p.$$eval("#home h1 [data-head-word]:not(.text-ink)", (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    let worst = Infinity;
    for (const clip of boxes) {
      const img = await shot(p, { clip });
      const ls = [];
      for (let i = 0; i < img.data.length; i += 4) ls.push(lum(img.data[i], img.data[i + 1], img.data[i + 2]));
      ls.sort((x, y) => x - y);
      worst = Math.min(worst, (DIM + 0.05) / (ls[Math.floor(ls.length * 0.95)] + 0.05));
    }
    report(`test_contrast_rest ${w}`, boxes.length > 5 && worst >= 4.5, { words: boxes.length, worst: +worst.toFixed(2) });
    await p.context().close();
  }
};

tests.test_back_to_top = async () => {
  const p = await open();
  await jump(p, 1e6, 1500);
  await p.click("#contact footer a");
  const y = await settle(p);
  await p.waitForTimeout(1500);
  await skyOnly(p);
  const g = await geometry(p);
  const img = await shot(p);
  const planet = planetAt(img, g);
  report("test_back_to_top", y === 0 && litPlanet(planet), { y, planet });
  await p.context().close();
};

// runner
for (const [name, fn] of Object.entries(tests)) if (!only.length || only.includes(name)) await fn();
await b.close();
process.exit(fail ? 1 : 0);
