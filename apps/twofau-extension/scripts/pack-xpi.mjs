// Package `dist-firefox/` into a Firefox `.xpi` (a plain zip Firefox and AMO
// accept). Assumes `packFirefox()` already wrote `dist-firefox/`. Uses web-ext's
// builder (already a dependency), then renames its artifact to a stable name.
import webExt from "web-ext";
import { mkdirSync, readFileSync, renameSync } from "node:fs";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

const at = (p) => fileURLToPath(new URL(p, import.meta.url));

/** Build `artifacts/2fau-firefox-<version>.xpi` from `dist-firefox/`. */
export async function packXpi() {
  const distFirefox = at("../dist-firefox");
  const { version } = JSON.parse(readFileSync(`${distFirefox}/manifest.json`, "utf8"));
  const outDir = at("../artifacts");
  mkdirSync(outDir, { recursive: true });
  const { extensionPath } = await webExt.cmd.build(
    { sourceDir: distFirefox, artifactsDir: outDir, overwriteDest: true },
    { shouldExitProgram: false },
  );
  const xpiPath = `${outDir}/2fau-firefox-${version}.xpi`;
  renameSync(extensionPath, xpiPath);
  return { xpiPath };
}

// Run directly: `node scripts/pack-xpi.mjs` (expects `dist-firefox/` present).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  packXpi()
    .then(({ xpiPath }) => console.log(`Wrote ${xpiPath}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
