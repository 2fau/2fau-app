// Generate the extension's _locales/<locale>/messages.json from the shared
// @twofau/i18n `store` catalogs. Chrome resolves __MSG_<key>__ in the manifest
// against these. English is the source; any missing/empty translation falls back
// to the English value so every listed locale fully resolves.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const EXT_ROOT = join(HERE, "..");
const I18N_LOCALES = join(EXT_ROOT, "../../packages/i18n/locales");
const OUT = join(EXT_ROOT, "_locales");

const SUPPORTED = [
  "en", "zh-CN", "es", "pt-BR", "ja", "de", "fr", "ru", "ko", "it", "tr", "pl",
];

// Chrome and Firefox only accept underscore folder names (zh_CN, pt_BR); a
// "zh-CN" folder is never matched, so those users silently got English.
const folderName = (loc) => loc.replace("-", "_");

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}

const en = readJson(join(I18N_LOCALES, "en", "store.json"));
const keys = Object.keys(en);

// Start clean so a renamed or dropped locale doesn't linger in the build.
rmSync(OUT, { recursive: true, force: true });
for (const loc of SUPPORTED) {
  const cat = loc === "en" ? en : readJson(join(I18N_LOCALES, loc, "store.json"));
  const messages = {};
  for (const key of keys) {
    const value = typeof cat[key] === "string" && cat[key] ? cat[key] : en[key];
    messages[key] = { message: value };
  }
  const dir = join(OUT, folderName(loc));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "messages.json"), JSON.stringify(messages, null, 2) + "\n");
}

console.log(`[_locales] wrote ${SUPPORTED.length} locales (${keys.length} messages each).`);
