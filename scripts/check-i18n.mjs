// Verify every locale catalog matches the English source set (no missing or
// orphaned keys) for each namespace. Exits non-zero on drift. Empty-string
// values (untranslated) are reported as a warning, not a failure.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LOCALES_DIR = join(ROOT, "packages/i18n/locales");
const NAMESPACES = ["ui", "site", "store"];

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}

const locales = readdirSync(LOCALES_DIR).filter((d) => d !== "en");
let failed = false;
let untranslated = 0;

for (const ns of NAMESPACES) {
  const enPath = join(LOCALES_DIR, "en", `${ns}.json`);
  if (!existsSync(enPath)) continue;
  const source = Object.keys(readJson(enPath));
  const sourceSet = new Set(source);

  for (const loc of locales) {
    const cat = readJson(join(LOCALES_DIR, loc, `${ns}.json`));
    const keys = Object.keys(cat).filter((k) => k !== "_meta");
    const missing = source.filter((k) => !(k in cat));
    const orphaned = keys.filter((k) => !sourceSet.has(k));
    const empty = keys.filter((k) => cat[k] === "" || cat[k] == null);

    if (missing.length || orphaned.length) {
      failed = true;
      console.error(`✗ ${loc}/${ns}: ${missing.length} missing, ${orphaned.length} orphaned`);
      if (missing.length) console.error(`    missing: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? " …" : ""}`);
      if (orphaned.length) console.error(`    orphaned: ${orphaned.slice(0, 5).join(", ")}${orphaned.length > 5 ? " …" : ""}`);
    }
    untranslated += empty.length;
  }
}

if (untranslated) console.warn(`⚠ ${untranslated} untranslated (empty) entries across locales.`);
if (failed) {
  console.error("i18n check failed: run `pnpm i18n:extract` and translate new keys.");
  process.exit(1);
}
console.log("i18n check passed (all locales in sync with the English source).");
