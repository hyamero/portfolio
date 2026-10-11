// Perf probe: load cost, main-thread cost while scrolling and at rest, and GPU latency per submit.
import { chromium } from "./no-mail.mjs";

const URL = process.env.URL ?? "http://localhost:3000/";
const b = await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] });
const PROFILES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, cpu: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, cpu: 4 },
};
const which = process.argv[2] ?? "desktop";
const { cpu, ...opts } = PROFILES[which];

const ctx = await b.newContext(opts);
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send("Performance.enable");
if (cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
const bytes = { js: 0, css: 0, font: 0, img: 0, doc: 0, other: 0 };
p.on("response", async (r) => {
  try {
    const len = Number(r.headers()["content-length"]) || (await r.body()).length;
    const t = r.request().resourceType();
    const k = t === "script" ? "js" : t === "stylesheet" ? "css" : t === "font" ? "font" : t === "image" ? "img" : t === "document" ? "doc" : "other";
    bytes[k] += len;
  } catch {}
});
await p.addInitScript(() => {
  window.__gpu = [];
  window.__dts = [];
  window.__long = [];
  let last = 0;
  const loop = (t) => { if (last) window.__dts.push(t - last); last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: "longtask", buffered: true });
  window.__lcp = 0;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  if (!("gpu" in navigator)) return;
  const submit = GPUQueue.prototype.submit;
  GPUQueue.prototype.submit = function (...a) {
    const t = performance.now();
    const r = submit.apply(this, a);
    this.onSubmittedWorkDone().then(() => window.__gpu.push(performance.now() - t));
    return r;
  };
});
await p.goto(URL, { waitUntil: "load" });
await p.waitForTimeout(5000);
const load = await p.evaluate(() => {
  const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
  return { fcp: Math.round(fcp), lcp: Math.round(window.__lcp), longTasks: window.__long.map(Math.round), tbt: Math.round(window.__long.reduce((s, d) => s + Math.max(0, d - 50), 0)), sky: document.documentElement.dataset.sky, canvas: [...document.querySelectorAll("canvas")].map((c) => `${c.width}x${c.height}`) };
});
const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
const window_ = async (label, fn) => {
  await p.evaluate(() => { window.__dts = []; window.__gpu = []; });
  const a = await metrics();
  const t0 = Date.now();
  await fn();
  const el = (Date.now() - t0) / 1000;
  const z = await metrics();
  const { dts, gpu } = await p.evaluate(() => ({ dts: window.__dts, gpu: window.__gpu }));
  const q = (arr, f) => { const s = [...arr].sort((x, y) => x - y); return s.length ? +s[Math.floor(s.length * f)].toFixed(1) : null; };
  const per = (k) => +(((z[k] - a[k]) / el) * 1000).toFixed(0);
  console.log(label, JSON.stringify({
    secs: +el.toFixed(1),
    "script ms/s": per("ScriptDuration"), "task ms/s": per("TaskDuration"), "layout ms/s": per("LayoutDuration"), "style ms/s": per("RecalcStyleDuration"),
    frames: dts.length, "dt p50": q(dts, 0.5), "dt p95": q(dts, 0.95),
    submits: gpu.length, "gpu p50": q(gpu, 0.5), "gpu p95": q(gpu, 0.95),
  }));
};
console.log(which, "load", JSON.stringify({ ...load, kb: Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, Math.round(v / 1024)])) }));
await window_("idle-top", () => p.waitForTimeout(3000));
if (!opts.isMobile) await p.mouse.move(700, 400);
await window_("pointer-top", async () => { for (let i = 0; i < 90; i++) { await p.mouse.move(400 + i * 5, 300 + (i % 20) * 4); await p.waitForTimeout(16); } });
const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await window_("scroll", async () => {
  for (let y = 0; y <= max; y += opts.isMobile ? 40 : 60) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(16); }
});
await p.evaluate(() => document.querySelector("#work").scrollIntoView());
await p.waitForTimeout(1500);
await window_("idle-work", () => p.waitForTimeout(3000));
await p.evaluate(() => scrollTo(0, 1e6));
await p.waitForTimeout(1500);
await window_("idle-contact", () => p.waitForTimeout(3000));
await b.close();
