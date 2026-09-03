// Package `dist-firefox/` into the two Firefox deliverables — a `.zip` (for AMO
// / store upload) and an identical `.xpi` (the add-on file extension Firefox
// expects). Assumes `packFirefox()` already wrote `dist-firefox/`. Uses web-ext's
// builder (already a dependency), then names its artifact stably.
import webExt from "web-ext";
import { copyFileSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

const at = (p) => fileURLToPath(new URL(p, import.meta.url));

/** Build `artifacts/2fau-firefox-<version>.{zip,xpi}` from `dist-firefox/`. */
export async function packXpi() {
  const distFirefox = at("../dist-firefox");
  const { version } = JSON.parse(readFileSync(`${distFirefox}/manifest.json`, "utf8"));
  const outDir = at("../artifacts");
  mkdirSync(outDir, { recursive: true });
  const { extensionPath } = await webExt.cmd.build(
    { sourceDir: distFirefox, artifactsDir: outDir, overwriteDest: true },
    { shouldExitProgram: false },
  );
  // web-ext emits a zip; keep it under a stable name and mirror it as .xpi (an
  // xpi is just a zip — same bytes, the name is what Firefox keys off).
  const zipPath = `${outDir}/2fau-firefox-${version}.zip`;
  const xpiPath = `${outDir}/2fau-firefox-${version}.xpi`;
  renameSync(extensionPath, zipPath);
  copyFileSync(zipPath, xpiPath);
  return { zipPath, xpiPath };
}

// Run directly: `node scripts/pack-xpi.mjs` (expects `dist-firefox/` present).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  packXpi()
    .then(({ zipPath, xpiPath }) => {
      console.log(`Wrote ${zipPath}`);
      console.log(`Wrote ${xpiPath}`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
