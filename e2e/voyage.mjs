// Browser checks for scrolling, motion and the cursor light (docs/superpowers/specs/2026-10-07-motion-and-light-design.md).
// Run: URL=http://localhost:3000/ node e2e/voyage.mjs [test names]; BROWSER=webkit for WebKit.
import { mkdirSync } from "node:fs";
import { chromium, firefox, webkit } from "./no-mail.mjs";
import { PNG } from "pngjs";

const OUT = `${import.meta.dirname}/out/`;
mkdirSync(OUT, { recursive: true });

const URL = process.env.URL ?? "http://localhost:3000/";
const only = process.argv.slice(2);
const b = process.env.BROWSER === "webkit" ? await webkit.launch() : await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] });
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
  await p.waitForTimeout(3500);
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
const shot = async (p, opts) => PNG.sync.read(await p.screenshot(opts));
const diff = (a, b) => {
  let n = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > 24) n++;
  }
  return n;
};
const lum = (r, g, b) => {
  const f = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

tests.test_lenis = async () => {
  const p = await open();
  const cls = await p.evaluate(() => document.documentElement.className);
  await p.mouse.move(720, 450);
  await p.mouse.wheel(0, 600);
  await p.waitForTimeout(120);
  const mid = await p.evaluate(() => scrollY);
  const end = await settle(p);
  report("test_lenis", cls.includes("lenis") && mid > 0 && mid < 560 && Math.abs(end - 600) < 2, { cls, mid, end, errors: p.errors });
  await p.context().close();
};

tests.test_nav_lands = async () => {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await p.click('header a[href="/#work"]');
    await p.waitForTimeout(250);
    const moving = await p.evaluate(() => scrollY);
    const end = await settle(p);
    const r = await p.evaluate(() => ({ top: document.querySelector("#work").getBoundingClientRect().top, hash: location.hash }));
    report(`test_nav_lands ${w}`, Math.abs(r.top) < 2 && r.hash === "#work" && moving > 0 && moving < end - 50, { ...r, moving, end });
    await p.context().close();
  }
};

tests.test_nav_interrupt = async () => {
  const p = await open();
  await p.click('header a[href="/#work"]');
  await p.waitForTimeout(250);
  await p.click('header a[href="/#contact"]');
  const y = await settle(p);
  const r = await p.evaluate(() => ({ top: document.querySelector("#contact").getBoundingClientRect().top, max: document.documentElement.scrollHeight - innerHeight }));
  report("test_nav_interrupt", Math.abs(r.top) < 2 || Math.abs(y - r.max) < 2, { y, ...r });
  await p.context().close();
};

tests.test_keyboard = async () => {
  const p = await open();
  await p.keyboard.press("PageDown");
  const paged = await settle(p);
  await p.evaluate(() => scrollTo(0, 0));
  await settle(p);
  for (let i = 0; i < 30; i++) {
    if (await p.evaluate(() => document.activeElement?.classList.contains("say"))) break;
    // Safari's Tab skips links unless the user opts in; Option-Tab always reaches them.
    await p.keyboard.press(process.env.BROWSER === "webkit" ? "Alt+Tab" : "Tab");
  }
  await settle(p);
  const r = await p.$eval(".say", (e) => {
    const box = e.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, focused: document.activeElement === e };
  });
  report("test_keyboard", paged > 300 && r.focused && r.top >= 0 && r.bottom <= 900, { paged, ...r });
  await p.context().close();
};

tests.test_reduced_native = async () => {
  const p = await open({ reducedMotion: "reduce" });
  const cls = await p.evaluate(() => document.documentElement.className);
  await p.click('header a[href="/#work"]');
  await p.waitForTimeout(100);
  const y = await p.evaluate(() => scrollY);
  const end = await settle(p);
  report("test_reduced_native", !cls.includes("lenis") && y === end && end > 500, { cls, y, end });
  await p.context().close();
};

tests.test_baseline = async () => {
  const p = await open();
  await p.screenshot({ path: OUT + (process.env.SHOT ?? "baseline-rise-1440.png") });
  report("test_baseline", p.errors.length === 0, { errors: p.errors });
  await p.context().close();
};

tests.test_coast = async () => {
  for (const reduced of [false, true]) {
    const p = await open(reduced ? { reducedMotion: "reduce" } : {});
    // A quiet stretch: Work, where the horizon rests (eclipse spec §5.8).
    await p.evaluate(() => scrollTo(0, document.querySelector("#work").offsetTop + 100));
    await p.waitForTimeout(3500);
    // In the gutter, so no row's hover colour fades in between the shots.
    await p.mouse.move(20, 450);
    await p.mouse.wheel(0, 270);
    await settle(p);
    const a = await shot(p);
    await p.waitForTimeout(500);
    const c = await shot(p);
    await p.waitForTimeout(2000);
    const s0 = await p.evaluate(() => window.__submits);
    await p.waitForTimeout(2000);
    const idle = await p.evaluate((s0) => { const t = (window.__times ?? []).slice(s0); return t.length && t[t.length - 1] - t[0] > 1300 ? t.length : 0; }, s0); // one shooting star's burst is allowed
    const moved = diff(a, c);
    report(`test_coast ${reduced ? "reduced" : "motion"}`, (reduced ? moved === 0 : moved > 20) && idle === 0, { moved, idle });
    await p.context().close();
  }
};

tests.test_hash_idle = async () => {
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
  await p.waitForTimeout(4000);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(2000);
  const idle = await p.evaluate((s0) => { const t = (window.__times ?? []).slice(s0); return t.length && t[t.length - 1] - t[0] > 1300 ? t.length : 0; }, s0); // one shooting star's burst is allowed
  report("test_hash_idle", idle === 0 && s0 > 0, { s0, idle });
  await ctx.close();
};

tests.test_device_loss = async () => {
  const p = await open({}, () => {
    const req = GPUAdapter.prototype.requestDevice;
    GPUAdapter.prototype.requestDevice = async function (...a) {
      const d = await req.apply(this, a);
      (window.__devices ||= []).push(d);
      return d;
    };
  });
  await p.evaluate(() => window.__devices.forEach((d) => d.destroy()));
  await p.waitForTimeout(500);
  for (let i = 0; i < 10; i++) {
    await p.mouse.wheel(0, 40);
    await p.waitForTimeout(50);
  }
  await p.waitForTimeout(1500);
  const s0 = await p.evaluate(() => window.__submits);
  await p.waitForTimeout(2000);
  const after = (await p.evaluate(() => window.__submits)) - s0;
  const sky = await p.evaluate(() => document.documentElement.dataset.sky);
  report("test_device_loss", after === 0 && sky === "css", { after, sky, errors: p.errors });
  await p.context().close();
};

tests.test_contrast = async () => {
  const DIM = lum(0x7c, 0x81, 0x8b);
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await open({ viewport: { width: w, height: h } });
    await p.addStyleTag({ content: "[data-statement], [data-statement] * { color: transparent !important; }" });
    const rows = [];
    for (const id of ["umamin", "omsimos", "stackmap"]) {
      await p.evaluate((id) => document.querySelector(`#${id} [data-statement]`).scrollIntoView({ block: "center" }), id);
      await p.waitForTimeout(3000);
      const clip = await p.$eval(`#${id} [data-statement]`, (e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      const img = await shot(p, { clip });
      const ls = [];
      for (let i = 0; i < img.data.length; i += 4) ls.push(lum(img.data[i], img.data[i + 1], img.data[i + 2]));
      ls.sort((x, y) => x - y);
      const p95 = ls[Math.floor(ls.length * 0.95)];
      rows.push({ id, p95: +p95.toFixed(4), ratio: +((DIM + 0.05) / (p95 + 0.05)).toFixed(2) });
    }
    report(`test_contrast ${w}`, rows.every((r) => r.ratio >= 4.5), rows);
    await p.context().close();
  }
};

const lineAt = (p, sel) => p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; });
const vars = (p, sel) => p.$eval(sel, (e) => ({ lo: e.style.getPropertyValue("--lo"), lx: parseFloat(e.style.getPropertyValue("--lx")) }));
const tx = (p, sel) => p.$eval(sel, (e) => new DOMMatrix(getComputedStyle(e).transform).m41);
const toRow = (p) => p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));

tests.test_edge_light = async () => {
  const p = await open();
  await toRow(p);
  await p.waitForTimeout(800);
  const line = await lineAt(p, "#omsimos [data-hairline]");
  await p.mouse.move(line.x + 200, line.y + 10);
  await p.waitForTimeout(1500);
  const near = await vars(p, "#omsimos [data-hairline]");
  await p.mouse.move(line.x + 200, Math.min(line.y + 620, 895));
  await p.waitForTimeout(2500);
  const far = await vars(p, "#omsimos [data-hairline]");
  report("test_edge_light", +near.lo > 0 && near.lx >= 0 && near.lx <= line.w && +far.lo === 0, { near, far, line });
  await p.context().close();
};

tests.test_magnet = async () => {
  for (const reduced of [false, true]) {
    const p = await open(reduced ? { reducedMotion: "reduce" } : {});
    await toRow(p);
    await p.waitForTimeout(800);
    const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.move(c.x - 30, c.y);
    await p.waitForTimeout(900);
    const pulled = await tx(p, "#omsimos .visit");
    await p.mouse.move(c.x - 400, c.y + 300);
    await p.waitForTimeout(1200);
    const back = await tx(p, "#omsimos .visit");
    const ok = reduced ? pulled === 0 : pulled < -1 && Math.abs(back) < 0.5;
    report(`test_magnet ${reduced ? "reduced" : "motion"}`, ok, { pulled, back });
    await p.context().close();
  }
};

tests.test_touch_none = async () => {
  const p = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await toRow(p);
  await p.waitForTimeout(800);
  const line = await lineAt(p, "#omsimos [data-hairline]");
  await p.touchscreen.tap(line.x + 100, line.y + 5);
  await p.waitForTimeout(1000);
  const written = await p.$$eval("[data-catch-light]", (els) => els.filter((e) => e.style.getPropertyValue("--lo")).length);
  const pulled = await p.$$eval("[data-magnet]", (els) => els.filter((e) => new DOMMatrix(getComputedStyle(e).transform).m41 !== 0).length);
  report("test_touch_none", written === 0 && pulled === 0, { written, pulled });
  await p.context().close();
};

tests.test_resize_realign = async () => {
  const p = await open();
  await p.setViewportSize({ width: 1100, height: 900 });
  await p.waitForTimeout(800);
  await toRow(p);
  await p.waitForTimeout(800);
  const line = await lineAt(p, "#omsimos [data-hairline]");
  await p.mouse.move(line.x + 150, line.y + 10);
  await p.waitForTimeout(1500);
  const near = await vars(p, "#omsimos [data-hairline]");
  const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(c.x - 30, c.y);
  await p.waitForTimeout(900);
  const pulled = await tx(p, "#omsimos .visit");
  report("test_resize_realign", +near.lo > 0 && Math.abs(near.lx - 150) < 40 && pulled < -1, { near, pulled });
  await p.context().close();
};

tests.test_pointer_leave = async () => {
  const p = await open();
  await toRow(p);
  await p.waitForTimeout(800);
  const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(c.x - 30, c.y);
  await p.waitForTimeout(900);
  await p.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent("pointerleave")));
  await p.waitForTimeout(2500);
  const lit = await p.$$eval("[data-catch-light]", (els) => els.filter((e) => +e.style.getPropertyValue("--lo") > 0).length);
  const back = await tx(p, "#omsimos .visit");
  report("test_pointer_leave", lit === 0 && Math.abs(back) < 0.5, { lit, back });
  await p.context().close();
};

tests.test_glint_shot = async () => {
  const p = await open();
  await toRow(p);
  await p.waitForTimeout(800);
  const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(c.x - 60, c.y - 60);
  await p.waitForTimeout(1800);
  await p.screenshot({ path: OUT + "glint.png", clip: { x: Math.max(c.x - 500, 0), y: Math.max(c.y - 260, 0), width: 1000, height: 520 } });
  report("test_glint_shot", true, {});
  await p.context().close();
};

tests.test_row_hover = async () => {
  const p = await open();
  await p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(800);
  const color = () => p.$eval("#omsimos [data-statement]", (e) => getComputedStyle(e).color);
  const before = await color();
  const at = await p.$eval("#omsimos [data-statement]", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + 20, y: r.y + 10 }; });
  await p.mouse.move(at.x, at.y);
  await p.waitForTimeout(900);
  const hover = await color();
  const shift = await p.$eval("#omsimos h3", (e) => getComputedStyle(e).translate);
  await p.mouse.move(5, 5);
  await p.waitForTimeout(900);
  const after = await color();
  await p.focus("#omsimos .visit");
  await p.waitForTimeout(700);
  const focused = await color();
  const ok = before === "rgb(124, 129, 139)" && hover === "rgb(161, 166, 175)" && shift.startsWith("4px") && after === before && focused === hover;
  report("test_row_hover", ok, { before, hover, shift, after, focused });
  await p.context().close();
};

tests.test_marker = async () => {
  const p = await open();
  const state = () => p.evaluate(() => ({
    current: [...document.querySelectorAll("header [aria-current]")].map((e) => e.textContent.trim()).join(),
    opacity: getComputedStyle(document.querySelector("[data-marker]")).opacity,
  }));
  const top = await state();
  await p.evaluate(() => document.querySelector("#umamin").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1200);
  const work = await state();
  await p.evaluate(() => scrollTo(0, 1e6));
  await p.waitForTimeout(1200);
  const contact = await state();
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(1200);
  const back = await state();
  const ok = top.current === "" && top.opacity === "0" && work.current === "Work" && work.opacity === "1" && contact.current === "Contact" && back.current === "" && back.opacity === "0";
  report("test_marker", ok, { top, work, contact, back });
  await p.context().close();
};

tests.test_blur_in = async () => {
  const p = await open();
  const read = (sel) => p.$$eval(sel, (els) => els.map((e) => [getComputedStyle(e).filter, getComputedStyle(e).opacity]));
  const clear = (rows) => rows.length > 0 && rows.every(([f, o]) => f === "none" && o === "1");
  const hero = await read("#home [data-head-word]");
  const sayBefore = await read(".say [data-head-word]");
  await p.evaluate(() => scrollTo(0, 1e6));
  await p.waitForTimeout(2800);
  const say = await read(".say [data-head-word]");
  report("test_blur_in", hero.length === 19 && clear(hero) && sayBefore.length === 3 && sayBefore.every(([, o]) => o === "0") && clear(say), { hero, sayBefore, say });
  await p.context().close();
};

tests.test_words_visible = async () => {
  for (const opts of [{ reducedMotion: "reduce" }, { javaScriptEnabled: false }]) {
    const p = await open(opts);
    const words = await p.$$eval("[data-head-word]", (els) => els.map((e) => getComputedStyle(e).opacity));
    report(`test_words_visible ${Object.keys(opts)[0]}`, words.length === 22 && words.every((o) => o === "1"), { words });
    await p.context().close();
  }
};

const frameProbe = () => {
  window.__dts = [];
  window.__cls = 0;
  let last = 0;
  const loop = (t) => {
    if (last) window.__dts.push(t - last);
    last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
};

tests.test_frames = async () => {
  const p = await open({}, frameProbe);
  await p.mouse.move(720, 450);
  await p.evaluate(() => (window.__dts = []));
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (const dir of [1, -1]) {
    for (let i = 0; i < 400; i++) {
      await p.mouse.wheel(0, 120 * dir);
      await p.waitForTimeout(16);
      const y = await p.evaluate(() => scrollY);
      if ((dir > 0 && y >= max - 1) || (dir < 0 && y <= 0)) break;
    }
  }
  const { dts, cls } = await p.evaluate(() => ({ dts: window.__dts, cls: window.__cls }));
  const s = [...dts].sort((x, y) => x - y);
  const p95 = s[Math.floor(s.length * 0.95)];
  const over50 = s.filter((d) => d > 50).length;
  report("test_frames", p95 <= 17 && over50 === 0 && cls < 0.05, { frames: s.length, p95: +p95.toFixed(2), over50, cls: +cls.toFixed(4) });
  await p.context().close();
};

tests.test_firefox = async () => {
  const ff = await firefox.launch();
  const p = await ff.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto(URL);
  await p.waitForTimeout(3500);
  const cls = await p.evaluate(() => document.documentElement.className);
  await p.evaluate(() => document.querySelector("#omsimos").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1000);
  const line = await p.$eval("#omsimos [data-hairline]", (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y }; });
  await p.mouse.move(line.x + 200, line.y + 10);
  await p.waitForTimeout(1500);
  const lo = await p.$eval("#omsimos [data-hairline]", (e) => +e.style.getPropertyValue("--lo"));
  const current = await p.evaluate(() => [...document.querySelectorAll("header [aria-current]")].map((e) => e.textContent.trim()).join());
  const sky = await p.evaluate(() => document.documentElement.dataset.sky);
  report("test_firefox", errors.length === 0 && cls.includes("lenis") && lo > 0 && current === "Work" && sky === "css", { errors, cls, lo, current, sky });
  await ff.close();
};

tests.test_mobile_width = async () => {
  const p = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  for (const y of [600, 1200, 1800, 2400, 1e6]) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(400);
  }
  const width = await p.evaluate(() => document.documentElement.scrollWidth);
  report("test_mobile_width", width === 390 && p.errors.length === 0, { width, errors: p.errors });
  await p.context().close();
};

// From 360px the hero's and Contact's link rows fit on one line, so no link is left alone on a second.
tests.test_link_rows = async () => {
  for (const w of [360, 375, 390]) {
    const p = await open({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true });
    const rows = await p.evaluate(() => {
      const count = (sel) => new Set([...document.querySelectorAll(sel)].map((e) => Math.round(e.getBoundingClientRect().top))).size;
      return { hero: count('nav[aria-label="Start here"] > a'), contact: count("#contact ul li") };
    });
    report(`test_link_rows ${w}`, rows.hero === 1 && rows.contact === 1, rows);
    await p.context().close();
  }
};

tests.test_remeasure_unlit = async () => {
  const p = await open();
  await toRow(p);
  await p.waitForTimeout(800);
  const c = await p.$eval("#omsimos .visit", (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.move(c.x - 40, c.y - 40);
  await p.waitForTimeout(1500);
  const before = await p.$eval("#omsimos .visit", (e) => +e.style.getPropertyValue("--lo"));
  // A reflow that re-measures and carries the ring out of the light's reach.
  await p.evaluate(() => (document.querySelector("#omsimos h3").style.paddingRight = "900px"));
  await p.waitForTimeout(500);
  await p.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent("pointerleave")));
  await p.waitForTimeout(2500);
  const lit = await p.$$eval("[data-catch-light]", (els) => els.filter((e) => +e.style.getPropertyValue("--lo") > 0).map((e) => e.className));
  report("test_remeasure_unlit", before > 0 && lit.length === 0, { before, lit });
  await p.context().close();
};

tests.test_say_focus_firefox = async () => {
  const ff = await firefox.launch();
  for (const [w, h] of [[1440, 900], [1024, 768], [1280, 600]]) {
  const p = await ff.newPage({ viewport: { width: w, height: h } });
  await p.goto(URL);
  await p.waitForTimeout(3500);
  await p.focus("#stackmap .visit");
  await p.waitForTimeout(800);
  await p.keyboard.press("Tab");
  await p.waitForTimeout(2500);
  const r = await p.$eval(".say", (e) => ({ focused: document.activeElement === e, top: e.getBoundingClientRect().top, ops: [...e.querySelectorAll("[data-head-word]")].map((w) => getComputedStyle(w).opacity) }));
  report(`test_say_focus_firefox ${w}x${h}`, r.focused && r.ops.length === 3 && r.ops.every((o) => o === "1"), r);
  await p.close();
  }
  await ff.close();
};

tests.test_marker_route = async () => {
  const p = await open();
  await p.evaluate(() => document.querySelector("#umamin").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1200);
  await p.goto(URL + "missing-page-xyz");
  await p.waitForTimeout(1500);
  await p.click("text=Return home");
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector("#umamin").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1200);
  await p.goBack();
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ path: location.pathname, current: [...document.querySelectorAll("header [aria-current]")].map((e) => e.textContent.trim()).join(), opacity: getComputedStyle(document.querySelector("[data-marker]")).opacity }));
  report("test_marker_route", r.path !== "/" && r.current === "" && r.opacity === "0", r);
  await p.context().close();
};

tests.test_marker_reduced_toggle = async () => {
  const p = await open();
  await p.evaluate(() => document.querySelector("#umamin").scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1200);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.waitForTimeout(300);
  const x = () => p.$eval("[data-marker]", (e) => new DOMMatrix(getComputedStyle(e).transform).m41);
  await p.evaluate(() => scrollTo(0, 1e6));
  await p.waitForTimeout(120);
  const soon = await x();
  await p.waitForTimeout(1200);
  const final = await x();
  report("test_marker_reduced_toggle", Math.abs(soon - final) < 0.5 && final > 0, { soon, final });
  await p.context().close();
};

tests.test_key_during_glide = async () => {
  const p = await open();
  await p.mouse.move(720, 450);
  await p.mouse.wheel(0, 600);
  await p.waitForTimeout(150);
  const mid = await p.evaluate(() => scrollY);
  await p.keyboard.press("PageDown");
  const end = await settle(p);
  report("test_key_during_glide", end - mid > 500, { mid, end });
  await p.context().close();
};

tests.test_recalc_per_frame = async () => {
  const p = await open();
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("Performance.enable");
  const metric = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  await p.mouse.move(720, 450);
  await p.evaluate(() => scrollTo(0, 820));
  await p.waitForTimeout(3000);
  const a = await metric();
  for (let i = 0; i < 12; i++) {
    await p.mouse.wheel(0, i % 2 ? -80 : 80);
    await p.waitForTimeout(100);
  }
  await p.waitForTimeout(400);
  const b = await metric();
  const frames = await p.evaluate(() => window.__submits);
  report("test_recalc_per_frame", true, { recalc: b.RecalcStyleCount - a.RecalcStyleCount, layout: b.LayoutCount - a.LayoutCount, span: +(b.Timestamp - a.Timestamp).toFixed(2), submits: frames });
  await p.context().close();
};

// runner
for (const [name, fn] of Object.entries(tests)) if (!only.length || only.includes(name)) await fn();
await b.close();
process.exit(fail ? 1 : 0);
