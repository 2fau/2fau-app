// Package the built Chrome extension (`dist/`) into a signed `.crx` plus a
// store-upload `.zip`. The signing key lives at `key.pem` (gitignored); crx3
// creates it on first run and reuses it afterwards — the key determines the
// extension's stable id, so keep it safe and out of git. Run after `vite build`.
import crx3 from "crx3";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

const at = (p) => fileURLToPath(new URL(p, import.meta.url));

/** Build `artifacts/2fau-chrome-<version>.{crx,zip}` from `dist/`. */
export async function packCrx() {
  const dist = at("../dist");
  const { version } = JSON.parse(readFileSync(`${dist}/manifest.json`, "utf8"));
  const outDir = at("../artifacts");
  mkdirSync(outDir, { recursive: true });
  const crxPath = `${outDir}/2fau-chrome-${version}.crx`;
  const zipPath = `${outDir}/2fau-chrome-${version}.zip`;
  await crx3([`${dist}/manifest.json`], { keyPath: at("../key.pem"), crxPath, zipPath });
  return { crxPath, zipPath };
}

// Run directly: `node scripts/pack-crx.mjs` (expects `dist/` already built).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  packCrx()
    .then(({ crxPath, zipPath }) => {
      console.log(`Wrote ${crxPath}`);
      console.log(`Wrote ${zipPath} (Chrome Web Store upload)`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
