// Produce a Firefox build directory (`dist-firefox/`) from the already-built
// Chrome `dist/`: same assets, a Gecko-flavoured manifest. Run after `vite build`.
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import { toFirefoxManifest } from "./firefox-manifest.mjs";

const at = (p) => fileURLToPath(new URL(p, import.meta.url));

/** Rebuild `dist-firefox/` from `dist/`. Assumes `dist/` was just built. */
export function packFirefox() {
  const dist = at("../dist");
  const distFirefox = at("../dist-firefox");
  const chrome = JSON.parse(readFileSync(`${dist}/manifest.json`, "utf8"));
  const firefox = toFirefoxManifest(chrome);
  rmSync(distFirefox, { recursive: true, force: true });
  cpSync(dist, distFirefox, { recursive: true });
  writeFileSync(`${distFirefox}/manifest.json`, `${JSON.stringify(firefox, null, 2)}\n`);
}

// Run directly: `node scripts/pack-firefox.mjs`.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  packFirefox();
  console.log("Wrote dist-firefox/ (Firefox manifest)");
}
