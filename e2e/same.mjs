// Pixel diff of two builds (A, B) under reduced motion, which freezes the sky's clock: a refactor or an
// optimisation of the sky must report 0px everywhere.
import { chromium } from "./no-mail.mjs";
import { PNG } from "pngjs";
const A = process.env.A ?? "http://localhost:3001/";
const B = process.env.B ?? "http://localhost:3000/";
const b = await chromium.launch({ channel: "chromium", args: ["--enable-unsafe-webgpu"] });
const grab = async (url, w, h) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(url);
  await p.waitForTimeout(4000);
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const out = [];
  for (const y of [0, 0.25, 0.5, 0.75, 1].map((k) => Math.round(k * max))) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(700);
    out.push(PNG.sync.read(await p.screenshot()));
  }
  const sky = await p.evaluate(() => document.documentElement.dataset.sky);
  await ctx.close();
  return { out, sky };
};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const a = await grab(A, w, h);
  const c = await grab(B, w, h);
  const diffs = a.out.map((img, i) => { let n = 0, max = 0; for (let j = 0; j < img.data.length; j++) { const d = Math.abs(img.data[j] - c.out[i].data[j]); if (d) n++; max = Math.max(max, d); } return `${n}px/max${max}`; });
  console.log(w, a.sky, c.sky, diffs.join(" "));
}
await b.close();
