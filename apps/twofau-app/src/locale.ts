import { resolveLocale } from "@twofau/ui";

// The chosen UI language persists in localStorage; absent a stored choice we
// negotiate from the OS/browser language. Mirrors auto-lock.ts.
const KEY = "twofau.locale";

export function getLocale(): string {
  return localStorage.getItem(KEY) ?? resolveLocale(navigator.language);
}

export function setLocale(locale: string): void {
  localStorage.setItem(KEY, locale);
}
