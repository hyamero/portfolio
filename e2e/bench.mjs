// GPU bench: at fixed scroll positions, wiggle the pointer so every frame redraws; report GPU latency per submit.
import { chromium } from "./no-mail.mjs";
const URL = process.env.URL ?? "http://localhost:3000/";
const b = await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] });
const runs = Number(process.env.RUNS ?? 2);
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.addInitScript(() => {
  window.__gpu = []; window.__dts = [];
  let last = 0; const loop = (t) => { if (last) window.__dts.push(t - last); last = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
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
const spots = await p.evaluate(() => {
  const top = (s) => document.querySelector(s).getBoundingClientRect().top + scrollY;
  return { top: 0, runway: Math.round(innerHeight * 0.9), work: top("#work"), workMid: Math.round((top("#work") + top("#contact")) / 2), contact: document.documentElement.scrollHeight - innerHeight };
});
const out = {};
for (const [name, y] of Object.entries(spots)) {
  await p.evaluate((v) => scrollTo(0, v), y);
  await p.waitForTimeout(1200);
  const all = []; const dts = [];
  for (let r = 0; r < runs; r++) {
    await p.evaluate(() => { window.__gpu = []; window.__dts = []; });
    if (process.env.SWEEP) {
      await p.evaluate(async (y0) => {
        const t0 = performance.now();
        await new Promise((done) => { const step = (t) => { const k = (t - t0) / 1000; scrollTo(0, y0 + Math.sin(k * Math.PI * 2) * 600); if (k < 1.5) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
      }, Math.max(y, 600));
    } else for (let i = 0; i < 60; i++) { await p.mouse.move(300 + (i % 30) * 25, 200 + (i % 7) * 30); await p.waitForTimeout(16); }
    all.push(...(await p.evaluate(() => window.__gpu)));
    dts.push(...(await p.evaluate(() => window.__dts.splice(0))));
  }
  const s = all.sort((a, b) => a - b);
  const d = dts.sort((a, b) => a - b);
  out[name] = [+s[Math.floor(s.length / 2)].toFixed(1), +s[Math.floor(s.length * 0.9)].toFixed(1), d.filter((x) => x > 25).length, d.length];
}
console.log(JSON.stringify({ label: process.env.LABEL ?? "bench", ...out }));
await b.close();
