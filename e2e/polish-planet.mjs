import { mkdirSync } from "node:fs";
// Browser checks for the sky polish round (docs/superpowers/specs/2026-10-10-sky-polish-design.md).
// Run: URL=http://localhost:3000/ node e2e/polish-planet.mjs [test names]
import { chromium } from "./no-mail.mjs";
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
const countSubmits = () => {
  window.__submits = 0;
  if (!("gpu" in navigator)) return;
  const submit = GPUQueue.prototype.submit;
  GPUQueue.prototype.submit = function (...a) {
    window.__submits++; (window.__times ??= []).push(performance.now());
    return submit.apply(this, a);
  };
};
// The CSS sky in Chromium: no WebGPU, so the sky falls back as it does without it.
const noGpu = () => {
  delete Navigator.prototype.gpu;
};
const open = async (opts = {}, init, path = "") => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  await p.addInitScript(countSubmits);
  if (init) await p.addInitScript(init);
  await p.goto(URL + path);
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
// The sun's column: its vertical flare and core make the tallest run of saturated pixels near the rim.
// The limb in column x: the row, between y0 and y1, where the light drops most going down.
const limbRow = (img, x, y0, y1) => {
  let best = { y: -1, drop: -Infinity };
  for (let y = Math.round(y0); y < Math.round(y1); y++) {
    const drop = at(img, x, y) - at(img, x, y + 1);
    if (drop > best.drop) best = { y: y + 0.5, drop };
  }
  return best.y;
};
// The planet's rim, its brightest row, in columns across the screen: where the limb crosses each.
const rimRows = (img, g) =>
  [0.2, 0.5, 0.8].map((k) => {
    const x = Math.round(k * g.W);
    const dx = x - g.C[0];
    const y = g.C[1] - Math.sqrt(g.R * g.R - dx * dx);
    // The rim is a plateau a few rows thick, so take the centroid of its top rows: the brightest
    // single row flips on the grain.
    const rows = [];
    for (let yy = Math.round(y - 12); yy <= Math.round(y + 12); yy++) rows.push([yy, at(img, x, yy)]);
    const top = Math.max(...rows.map(([, l]) => l));
    const near = rows.filter(([, l]) => l >= 0.9 * top);
    return +(near.reduce((s, [yy, l]) => s + yy * l, 0) / near.reduce((s, [, l]) => s + l, 0)).toFixed(1);
  });
// Local maxima brighter than `min` inside a rect: the screen's stars.
const peaks = (img, x0, y0, x1, y1, min) => {
  const out = [];
  for (let y = y0 + 1; y < y1 - 1; y++) {
    for (let x = x0 + 1; x < x1 - 1; x++) {
      const l = at(img, x, y);
      if (l < min) continue;
      let top = true;
      for (let dy = -1; dy <= 1 && top; dy++) for (let dx = -1; dx <= 1 && top; dx++) if ((dx || dy) && at(img, x + dx, y + dy) > l) top = false;
      if (top) out.push([x, y]);
    }
  }
  return out;
};
const geometry = (p) =>
  p.evaluate(() => {
    const box = document.querySelector('[data-sky-anchor="planet"]').getBoundingClientRect();
    return {
      W: innerWidth,
      H: innerHeight,
      C: [box.x + box.width / 2, box.y + scrollY + box.height / 2],
      R: box.width / 2,
      apex: box.y + scrollY,
      end: document.querySelector("#home").offsetHeight - innerHeight,
      max: document.documentElement.scrollHeight - innerHeight,
    };
  });
const DIM = lum(0x7c, 0x81, 0x8b);
const contrast = async (p, clip) => {
  const img = await shot(p, { clip });
  const ls = [];
  for (let i = 0; i < img.data.length; i += 4) ls.push(lum(img.data[i], img.data[i + 1], img.data[i + 2]));
  ls.sort((x, y) => x - y);
  return (DIM + 0.05) / (ls[Math.floor(ls.length * 0.95)] + 0.05);
};
const rectOf = (p, sel) =>
  p.$eval(sel, (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

// §2.1: screenshots to judge by eye against the prototypes' screens.
tests.test_shots = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    const g = await geometry(p);
    const stops = { top: 0, runway: g.end * 0.5, hold: g.end, settle: g.end + 0.5 * h, work: g.end + 2 * h, contact: g.max };
    for (const [name, y] of Object.entries(stops)) {
      await jump(p, y);
      await p.screenshot({ path: OUT + `polish-${w}-${name}.png` });
    }
    report(`test_shots ${w}`, p.errors.length === 0, { errors: p.errors });
    await p.context().close();
  }
};

// §5.6: a click on Contact's Email link runs the signal out along the rim, then everything stops.
tests.test_signal = async () => {
  const p = await open();
  const g = await geometry(p);
  await jump(p, g.max, 3000);
  await p.mouse.move(5, 5);
  await p.waitForTimeout(1500);
  const rest = await shot(p);
  // The rim's lit lobe rests on the middle, under the sun.
  const x = 0.8 * g.W;
  const row = limbRow(rest, x, 0.8 * g.H, 0.98 * g.H);

  // The front crosses a column in ~0.1 s, so watch just a strip of it, which screenshots fast.
  const strip = { x: Math.round(x) - 1, y: Math.round(row) - 10, width: 3, height: 12 };
  const stripBand = (img) => {
    let s = 0;
    for (let dy = -8; dy <= 0; dy++) s += at(img, 1, Math.round(row) + dy - strip.y);
    return s;
  };
  const base = stripBand(await shot(p, { clip: strip }));
  await p.$eval('#contact a[data-sky-signal][href^="mailto:"]', (a) => a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
  const t0 = Date.now();
  let peak = 0;
  while (Date.now() - t0 < 1500) peak = Math.max(peak, stripBand(await shot(p, { clip: strip })));
  await p.waitForTimeout(Math.max(0, 3500 - (Date.now() - t0)));
  const after = stripBand(await shot(p, { clip: strip }));
  await p.waitForTimeout(150);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(1500);
  const idle = await p.evaluate((s0) => { const t = (window.__times ?? []).slice(s0); return t.length && t[t.length - 1] - t[0] > 1300 ? t.length : 0; }, s0); // one shooting star's burst is allowed
  report("test_signal", peak > 1.3 * base && after <= 1.02 * base && idle === 0, { base: +base.toFixed(4), peak: +peak.toFixed(4), after: +after.toFixed(4), idle });
  await p.context().close();
};

// §5.6: hovering a Contact link lifts the rim's light; leaving lets it go.
tests.test_lift = async () => {
  const p = await open();
  const g = await geometry(p);
  await jump(p, g.max, 3000);
  await p.mouse.move(5, 5);
  await p.waitForTimeout(1500);
  const glow = (img, sx) => {
    let s = 0;
    for (let dy = -30; dy <= 0; dy++) for (let dx = -30; dx <= 30; dx += 3) s += at(img, sx + dx, 0.8 * g.H + dy);
    return s;
  };
  const rest = await shot(p);
  const sx = g.W / 2;
  const link = await rectOf(p, "#contact li a[data-sky-signal]");
  await p.mouse.move(link.x + link.width / 2, link.y + link.height / 2);
  await p.waitForTimeout(1200);
  const lifted = await shot(p);
  report("test_lift", glow(lifted, sx) > 1.15 * glow(rest, sx), { rest: +glow(rest, sx).toFixed(3), lifted: +glow(lifted, sx).toFixed(3) });
  await p.context().close();
};

// §2.4: the CSS sky and the live sky agree on the first frame: the planet's rim, the horizon's limb at the sun, and the stars.
tests.test_css_live = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const live = await open({ viewport: { width: w, height: h } });
    const css = await open({ viewport: { width: w, height: h } }, noGpu);
    // The CSS sky lives in the page, so hide only the copy over it.
    const copyOnly = (p) => p.addStyleTag({ content: "[data-hero-copy], header, #work, #contact > div { visibility: hidden !important; }" });
    await copyOnly(live);
    await copyOnly(css);
    const g = await geometry(live);
    const [a, c] = [await shot(live), await shot(css)];
    const da = rimRows(a, g);
    const dc = rimRows(c, g);
    // Stars: every CSS star in the top band has a live star within 1 px.
    const cssStars = peaks(c, 0, 0, w, Math.min(240, h), 0.05);
    const liveStars = peaks(a, 0, 0, w, Math.min(240, h), 0.02);
    const matched = cssStars.filter(([x, y]) => liveStars.some(([lx, ly]) => Math.hypot(lx - x, ly - y) <= 1)).length;
    await jump(live, g.end);
    await jump(css, g.end);
    const [ha, hc] = [await shot(live), await shot(css)];
    const limb = (img) => limbRow(img, w / 2 - 150, 0.6 * h, 0.72 * h);
    const sky = await css.evaluate(() => document.documentElement.dataset.sky);
    const ok =
      sky === "css" &&
      // Under 864 px the still is scaled down, thinning its rim; its brightest row may sit a pixel further off.
      da.every((y, i) => Math.abs(y - dc[i]) <= (w < 864 ? 2 : 1)) &&
      (w < 864 || Math.abs(limb(ha) - limb(hc)) <= 1) &&
      cssStars.length > 0 &&
      matched / cssStars.length >= 0.98;
    report(`test_css_live ${w}`, ok, { sky, live: da, css: dc, limb: [limb(ha), limb(hc)], stars: `${matched}/${cssStars.length}` });
    await live.context().close();
    await css.context().close();
  }
};

// §2.5: contrast behind the dim words with the pointer on the text and away, live and on the CSS sky.
tests.test_contrast_pointer = async () => {
  const targets = [
    ["hero", 0, "#home h1 [data-head-word]:not(.text-ink)", "#home h1, #home h1 * { color: transparent !important; } .full-stop { visibility: hidden !important; }"],
    ["work", null, "#omsimos [data-statement]", "[data-statement], [data-statement] * { color: transparent !important; }"],
    ["contact", "max", '#contact [data-sky-text="contact"]', "#contact [data-sky-text] * { color: transparent !important; text-shadow: none !important; background-image: none !important; }"],
  ];
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    for (const gpu of [true, false]) {
      const p = await open({ viewport: { width: w, height: h } }, gpu ? undefined : noGpu);
      const rows = [];
      for (const [name, y, sel, hide] of targets) {
        if (!gpu && name !== "hero") continue;
        const g = await geometry(p);
        if (y === null) await p.evaluate(() => document.querySelector("#omsimos [data-statement]").scrollIntoView({ block: "center" }));
        else await p.evaluate((v) => scrollTo(0, v), y === "max" ? g.max : y);
        await settle(p);
        await p.addStyleTag({ content: hide });
        const box = await rectOf(p, sel);
        for (const pointer of ["away", "on"]) {
          await p.mouse.move(pointer === "on" ? box.x + box.width / 2 : 5, pointer === "on" ? box.y + box.height / 2 : 5);
          await p.waitForTimeout(2500);
          rows.push({ name, pointer, ratio: +(await contrast(p, box)).toFixed(2) });
        }
      }
      report(`test_contrast_pointer ${w} ${gpu ? "live" : "css"}`, rows.every((r) => r.ratio >= 4.5), rows);
      await p.context().close();
    }
  }
};

// With WebGPU the CSS planet's dawn waits unseen while the sky is pending; without it, it plays.
tests.test_dawn = async () => {
  const live = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const lp = await live.newPage();
  await lp.goto(URL);
  await lp.waitForTimeout(1000);
  const pending = await lp.evaluate(() => ({ sky: document.documentElement.dataset.sky, opacity: getComputedStyle(document.querySelector(".css-dawn")).opacity }));
  await live.close();
  const css = await open({}, noGpu);
  const lit = await css.evaluate(() => ({ sky: document.documentElement.dataset.sky, opacity: getComputedStyle(document.querySelector(".css-dawn")).opacity }));
  await css.context().close();
  const nojs = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const np = await nojs.newPage();
  await np.goto(URL);
  await np.waitForTimeout(3500);
  const box = await rectOf(np, '[data-sky-anchor="planet"]');
  const img = await shot(np);
  let rim = 0;
  for (let y = Math.round(box.y) - 10; y <= Math.round(box.y) + 10; y++) rim = Math.max(rim, at(img, Math.round(box.x + box.width / 2), y));
  await nojs.close();
  report("test_dawn", ["pending", "live"].includes(pending.sky) && pending.opacity === "0" && lit.sky === "css" && Number(lit.opacity) > 0.99 && rim > 0.4, { pending, lit, rim: +rim.toFixed(3) });
};

// §2.9: the stills fit their budget, only the screen's own horizon still loads, and the 404 page loads no still.
tests.test_network = async () => {
  const sizes = async (w, path) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage();
    await p.addInitScript(noGpu);
    const seen = [];
    p.on("response", async (r) => {
      if (!new globalThis.URL(r.url()).pathname.startsWith("/sky/")) return;
      seen.push({ path: new globalThis.URL(r.url()).pathname, bytes: (await r.body()).length, gzip: r.headers()["content-encoding"] ?? "" });
    });
    await p.goto(URL + path);
    await p.waitForTimeout(3000);
    await ctx.close();
    return seen;
  };
  const wide = await sizes(1440, "");
  const narrow = await sizes(390, "");
  const missing = await sizes(1440, "no-such-page");
  const stills = (list) => list.filter((r) => r.path.endsWith(".avif"));
  const bytes = (list) => stills(list).reduce((s, r) => s + r.bytes, 0);
  const ok =
    bytes(wide) <= 320 * 1024 &&
    stills(wide).some((r) => r.path === "/sky/horizon-1440.avif") &&
    !stills(wide).some((r) => r.path === "/sky/horizon-390.avif") &&
    stills(narrow).some((r) => r.path === "/sky/horizon-390.avif") &&
    !stills(narrow).some((r) => r.path === "/sky/horizon-1440.avif") &&
    stills(missing).length === 0;
  report("test_network", ok, { wide, narrow, missing });
};

for (const [name, fn] of Object.entries(tests)) if (!only.length || only.includes(name)) await fn();
await b.close();
console.log(fail ? `${fail} FAILED` : "ALL PASS");
process.exit(fail ? 1 : 0);
