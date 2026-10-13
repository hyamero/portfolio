// Runs the browser suites in turn against URL (default http://localhost:3000/) and exits non-zero if any fails.
import { spawnSync } from "node:child_process";

const SUITES = ["polish-planet", "eclipse", "voyage", "lost"];
const only = process.argv.slice(2);
let failed = 0;
for (const suite of SUITES.filter((s) => !only.length || only.includes(s))) {
  console.log(`\n# ${suite}`);
  const { status } = spawnSync("node", [`${import.meta.dirname}/${suite}.mjs`], { stdio: "inherit" });
  if (status) failed++;
}
console.log(failed ? `\n${failed} suite(s) failed` : "\nall suites pass");
process.exit(failed ? 1 : 0);
