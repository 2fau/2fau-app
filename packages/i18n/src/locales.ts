export const DEFAULT_LOCALE = "en";

/** Order = display order in selectors. */
export const SUPPORTED_LOCALES = [
  "en",
  "zh-CN",
  "es",
  "pt-BR",
  "ja",
  "de",
  "fr",
  "ru",
  "ko",
  "it",
  "tr",
  "pl",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Endonyms (name of the language in that language). */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  es: "Español",
  "pt-BR": "Português (Brasil)",
  ja: "日本語",
  de: "Deutsch",
  fr: "Français",
  ru: "Русский",
  ko: "한국어",
  it: "Italiano",
  tr: "Türkçe",
  pl: "Polski",
};

/**
 * Map a BCP-47 tag to a supported locale, else DEFAULT_LOCALE. Tries an exact
 * (case-insensitive) match, then the first supported locale sharing the language
 * subtag (so `pt` → `pt-BR`, `en-US` → `en`).
 */
export function resolveLocale(tag?: string | null): Locale {
  if (!tag) return DEFAULT_LOCALE;
  const norm = tag.trim();
  const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === norm.toLowerCase());
  if (exact) return exact;
  const lang = norm.split("-")[0].toLowerCase();
  const byLang = SUPPORTED_LOCALES.find((l) => l.split("-")[0].toLowerCase() === lang);
  return byLang ?? DEFAULT_LOCALE;
}
