import type { Account } from "@twofau/ui";

/** The distinctive label of a hostname — the second-level domain. e.g.
 * "github.com" → "github", "accounts.google.com" → "google". Used to match a
 * page against an account's issuer/label. */
export function siteKey(host: string): string {
  const h = host.toLowerCase().replace(/^www\./, "");
  const parts = h.split(".").filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : h;
}

/** True if `account` plausibly belongs to `host` — its issuer or label contains
 * the site's distinctive label (or vice versa). Deliberately loose: a false
 * positive only reorders the list, it never hides anything. */
export function accountMatchesSite(account: Account, host: string): boolean {
  const key = siteKey(host);
  if (key.length < 3) return false;
  const hay = `${account.issuer} ${account.label}`.toLowerCase();
  return hay.includes(key) || key.includes(hay.trim());
}

/** Extract a hostname from a tab URL, or null for pages we can't match against
 * (chrome://, extension pages, blank tabs). */
export function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return null;
    return hostname || null;
  } catch {
    return null;
  }
}
