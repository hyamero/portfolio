// Renders the CSS sky's stills from the live sky's own shader (sky polish spec §7.1) and writes
// them to public/sky with a manifest. `--check` re-renders and compares instead, and checks the CSS
// star map against the live stars. On Linux, install the CPU renderer once per machine for
// identical pixels: `bunx vgpu install-software-renderer`.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { resolveShader } from "@vgpu/wgsl/runtime";
import { effect, init, sampler, target } from "vgpu/node";

import { INTERIOR, ROOT, screenInverse, STAR_CHECK_ENTRY, STILLS, STILLS_ENTRY, stillsHash, type Still } from "@/components/sky/stills-source";
import { brightStars } from "@/lib/star-field";

const OUT = path.join(ROOT, "public/sky");
const MANIFEST = path.join(ROOT, "src/components/sky/stills.json");
const BUDGET = 320 * 1024;
const check = process.argv.includes("--check");

// The software adapter renders the same pixels on every machine, but it only exists for Linux.
// Elsewhere the GPU renders them; --check's tolerance absorbs the difference.
const gpu = await init({ adapter: "software" }).catch(() => {
  console.log("software renderer unavailable: rendering on the GPU");
  return init();
});
const stillsShader = (await resolveShader({ entry: STILLS_ENTRY })).wgsl;

async function render(still: Still) {
  const [w, h] = still.size;
  const out = target(gpu, { size: still.size, format: "rgba16float" });
  const params = {
    resolution: still.size,
    dpr: still.dpr,
    W: still.W,
    time: still.time,
    beads: still.beads,
    body: [...still.body, 1],
    sun: still.sun,
    glare: still.glare,
  };
  effect(gpu, stillsShader, { set: { params } }).draw(out);
  const px = await out.color.readFloats({ mipLevel: 0, region: "all" });
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const s = screenInverse([px[i * 4], px[i * 4 + 1], px[i * 4 + 2]], px[i * 4 + 3], INTERIOR[still.interior]);
    rgb.set([Math.round(s[0] * 255), Math.round(s[1] * 255), Math.round(s[2] * 255)], i * 3);
  }
  return sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).avif({ quality: 60, chromaSubsampling: "4:4:4" }).toBuffer();
}

const decoded = (file: Buffer) => sharp(file).raw().toBuffer();

/** The share of the CSS star map's stars that sit within 1 px of a live star, at 1440 × 900. */
async function starMatch() {
  const [W, H] = [1440, 900];
  const out = target(gpu, { size: [W, H], format: "rgba16float" });
  const unused = target(gpu, { size: [1, 1], format: "rgba16float" });
  const shader = (await resolveShader({ entry: STAR_CHECK_ENTRY })).wgsl;
  effect(gpu, shader, { set: { params: { resolution: [W, H], dpr: 1 }, milky: unused, milkySampler: sampler(gpu, {}) } }).draw(out);
  const px = await out.color.readFloats({ mipLevel: 0, region: "all" });
  const lum = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return 0;
    const i = (y * W + x) * 4;
    return 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
  };
  const stars = brightStars(W, H);
  let near = 0;
  for (const star of stars) {
    // The light's centroid over the 3 × 3 px round the map's star; any wider and a neighbour pulls it.
    let sum = 0;
    let sx = 0;
    let sy = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = Math.floor(star.x) + dx;
        const y = Math.floor(star.y) + dy;
        const l = lum(x, y);
        sum += l;
        sx += l * (x + 0.5);
        sy += l * (y + 0.5);
      }
    }
    if (sum > 0 && Math.hypot(sx / sum - star.x, sy / sum - star.y) <= 1) near++;
  }
  return near / stars.length;
}

const hash = await stillsHash();
const files = new Map<string, Buffer>();
for (const still of STILLS) files.set(still.file, await render(still));
const total = [...files.values()].reduce((sum, file) => sum + file.length, 0);
let ok = total <= BUDGET;
console.log(`stills: ${(total / 1024).toFixed(1)} KB of ${BUDGET / 1024} KB`);

if (check) {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  if (manifest.hash !== hash) {
    ok = false;
    console.log("stale: the shaders or parameters changed since the stills were rendered");
  }
  for (const [file, fresh] of files) {
    const [a, b] = await Promise.all([decoded(fresh), decoded(await readFile(path.join(OUT, file)))]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff += Math.abs(a[i] - b[i]);
    const mean = a.length === b.length ? diff / a.length : Infinity;
    console.log(`${file}: mean difference ${mean.toFixed(3)} / 255`);
    if (mean > 0.5) ok = false;
  }
  const match = await starMatch();
  console.log(`star map: ${(match * 100).toFixed(1)}% within 1 px of a live star`);
  if (match < 0.98) ok = false;
} else {
  for (const [file, buffer] of files) await writeFile(path.join(OUT, file), buffer);
  const stills = Object.fromEntries(STILLS.map((s) => [s.file, { size: s.size, bytes: files.get(s.file)!.length }]));
  await writeFile(MANIFEST, `${JSON.stringify({ hash, stills }, null, 2)}\n`);
}

gpu.dispose();
if (!ok) process.exit(1);
