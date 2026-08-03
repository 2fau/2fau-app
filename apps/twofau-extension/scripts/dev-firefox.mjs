// One-command Firefox dev loop:
//   - Vite rebuilds dist/ on every change (watch mode),
//   - each rebuild re-derives dist-firefox/ (Gecko manifest),
//   - web-ext runs Firefox with the add-on and reloads it when dist-firefox/
//     changes.
// Ctrl-C stops everything.
import { spawn } from "node:child_process";
import { existsSync, watch } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { packFirefox } from "./pack-firefox.mjs";

const extDir = fileURLToPath(new URL("..", import.meta.url));
const dist = fileURLToPath(new URL("../dist", import.meta.url));

const children = [];
function run(cmd, args) {
  const child = spawn(cmd, args, {
    cwd: extDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  child.on("error", (e) => console.error(`[dev-firefox] ${cmd} failed: ${e.message}`));
  children.push(child);
  return child;
}

function shutdown() {
  for (const c of children) c.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// 1) Vite watch build -> dist/.
run("pnpm", ["exec", "vite", "build", "--watch", "--mode", "development"]);

let timer;
function schedulePack() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      packFirefox();
    } catch (e) {
      console.error(`[dev-firefox] pack failed: ${e.message}`);
    }
  }, 300);
}

// 2) Once the first build lands, keep dist-firefox/ in sync and launch Firefox.
(async () => {
  while (!existsSync(`${dist}/manifest.json`)) await delay(200);
  packFirefox();
  // Non-recursive: Vite rewrites the top-level entry files on each rebuild,
  // which is enough to trigger a re-pack (recursive fs.watch isn't portable).
  watch(dist, schedulePack);
  run("pnpm", [
    "exec",
    "web-ext",
    "run",
    "--source-dir",
    "dist-firefox",
    "--target",
    "firefox-desktop",
    "--no-config-discovery",
  ]);
})();
