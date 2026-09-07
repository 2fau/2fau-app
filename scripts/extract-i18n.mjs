// Extract translatable strings from the codebase into the @twofau/i18n source
// catalogs (English-as-key). Scans for `t('…')` / `t("…")` and
// `plural(…, { …, other: '…' })` calls and writes:
//   - locales/en/<ns>.json     identity map { "English": "English" }
//   - locales/<other>/<ns>.json  ensures each key exists (missing -> "")
//
// Usage:
//   node scripts/extract-i18n.mjs --namespace ui   --dir packages/ui/src --dir apps/twofau-app/src --dir apps/twofau-extension/src
//   node scripts/extract-i18n.mjs --namespace site --dir apps/twofau-site/src
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LOCALES_DIR = join(ROOT, "packages/i18n/locales");
const SUPPORTED = [
  "en", "zh-CN", "es", "pt-BR", "ja", "de", "fr", "ru", "ko", "it", "tr", "pl",
];

function parseArgs(argv) {
  const out = { namespace: "ui", dirs: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--namespace") out.namespace = argv[++i];
    else if (argv[i] === "--dir") out.dirs.push(argv[++i]);
  }
  if (out.dirs.length === 0) throw new Error("pass at least one --dir");
  return out;
}

const SRC_EXT = new Set([".ts", ".tsx", ".astro", ".js", ".jsx", ".mjs"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith("dist-")) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, files);
    else if (SRC_EXT.has(extname(p)) && !p.endsWith(".test.ts") && !p.endsWith(".test.tsx")) {
      files.push(p);
    }
  }
  return files;
}

// Match t('…') / t("…") — first string arg. Handles escaped quotes.
const T_RE = /\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1/g;
// Match the `other:` form inside plural(...) calls.
const PLURAL_OTHER_RE = /\bplural\(\s*[^,]+,\s*\{[^}]*?other\s*:\s*(['"])((?:\\.|(?!\1).)*)\1/g;

function unescape(s, quote) {
  return s.replace(new RegExp(`\\\\${quote}`, "g"), quote).replace(/\\\\/g, "\\");
}

function collect(dirs) {
  const keys = new Set();
  for (const rel of dirs) {
    const abs = join(ROOT, rel);
    if (!existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(T_RE)) keys.add(unescape(m[2], m[1]));
      for (const m of src.matchAll(PLURAL_OTHER_RE)) keys.add(unescape(m[2], m[1]));
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}

function writeJson(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

const { namespace, dirs } = parseArgs(process.argv.slice(2));
const keys = collect(dirs);

// en: identity catalog.
const enPath = join(LOCALES_DIR, "en", `${namespace}.json`);
writeJson(enPath, Object.fromEntries(keys.map((k) => [k, k])));

// other locales: keep existing translations, add missing keys as "".
let added = 0;
for (const loc of SUPPORTED) {
  if (loc === "en") continue;
  const path = join(LOCALES_DIR, loc, `${namespace}.json`);
  const existing = readJson(path);
  const meta = existing._meta;
  const next = {};
  if (meta) next._meta = meta;
  for (const k of keys) {
    if (!(k in existing)) added++;
    next[k] = k in existing ? existing[k] : "";
  }
  writeJson(path, next);
}

console.log(`[${namespace}] ${keys.length} source strings; added ${added} empty entries across locales.`);
