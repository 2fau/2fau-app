import { createTranslator, type Messages } from "@twofau/i18n";

// Static glob so every locale's `site` catalog is bundled at build time (SSG).
// English is the identity fallback, so it resolves to {} (no file needed).
const catalogs = import.meta.glob<{ default: Messages }>(
  "../../../../packages/i18n/locales/*/site.json",
  { eager: true },
);

function messagesFor(locale: string): Messages {
  if (locale === "en") return {};
  const mod = catalogs[`../../../../packages/i18n/locales/${locale}/site.json`];
  return mod?.default ?? {};
}

/** Server-side translator for a given locale (from `Astro.currentLocale`). */
export function getT(locale: string | undefined) {
  const loc = locale ?? "en";
  return createTranslator(loc, messagesFor(loc));
}

/** Build a locale-prefixed URL. Unlike Astro's `getRelativeLocaleUrl`, this
 * preserves the exact locale casing (`zh-CN`, not `zh-cn`) so links match the
 * `[locale]` route params that generate the pages. English stays unprefixed. */
export function localeUrl(locale: string | undefined, path: string): string {
  const clean = path.replace(/^\//, "");
  const base = !locale || locale === "en" ? "/" : `/${locale}/`;
  return clean ? `${base}${clean}` : base;
}
