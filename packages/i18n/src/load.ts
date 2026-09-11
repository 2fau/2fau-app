import { DEFAULT_LOCALE } from "./locales";
import type { Messages } from "./index";

export type Namespace = "ui" | "site" | "store";

/**
 * Load one locale + namespace catalog. English is the identity fallback, so it
 * resolves to `{}` (no file needed); a missing file resolves to `{}` too. Only
 * the active non-English locale is dynamically imported, so consumers never
 * bundle every locale.
 */
export async function loadMessages(locale: string, ns: Namespace): Promise<Messages> {
  if (locale === DEFAULT_LOCALE) return {};
  try {
    const mod = await import(`../locales/${locale}/${ns}.json`);
    return (mod.default ?? mod) as Messages;
  } catch {
    return {};
  }
}
