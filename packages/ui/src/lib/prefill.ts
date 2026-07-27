/** Initial values for the Add-account form, derived from the clipboard. */
export interface AddPrefill {
  issuer: string;
  label: string;
  /** Base32, ready for the form's secret field. */
  secret: string;
  type: "totp" | "hotp";
  /** The original `otpauth://` URI when the source was one. Lets the form save
   * via `addUri` — preserving algorithm/digits/period/counter — as long as the
   * user leaves the parsed fields untouched. Absent for a raw-secret paste. */
  uri?: string;
}

/** Normalize a Base32 string for the secret field: drop whitespace/padding,
 * uppercase. */
function normalizeBase32(s: string): string {
  return s.replace(/[\s=]/g, "").toUpperCase();
}

/** True if `s` is a usable Base32 secret: only alphabet chars (case/space/pad
 * tolerant, matching the Rust decoder) and long enough to yield ≥1 byte. */
function isValidBase32(s: string): boolean {
  const cleaned = s.replace(/[\s=]/g, "");
  return /^[A-Za-z2-7]+$/.test(cleaned) && Math.floor((cleaned.length * 5) / 8) >= 1;
}

/** Parse an `otpauth://` URI with the platform URL parser. Pure — no WASM — so
 * it works in the desktop webview, which never initializes the core module. */
function parseOtpauthUri(uri: string): AddPrefill | null {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return null;
  }
  if (url.protocol !== "otpauth:") return null;
  const type = url.hostname === "hotp" ? "hotp" : url.hostname === "totp" ? "totp" : null;
  if (!type) return null;

  const secret = url.searchParams.get("secret") ?? "";
  if (!isValidBase32(secret)) return null;

  // The path (minus the leading '/') is the label, possibly "Issuer:Account".
  const rawLabel = decodeURIComponent(url.pathname.replace(/^\//, ""));
  let issuer = url.searchParams.get("issuer") ?? "";
  let label = rawLabel;
  const colon = rawLabel.indexOf(":");
  if (colon >= 0) {
    if (!issuer) issuer = rawLabel.slice(0, colon).trim();
    label = rawLabel.slice(colon + 1).trim();
  }

  return { issuer, label, secret: normalizeBase32(secret), type, uri };
}

/**
 * Build Add-form prefill from arbitrary clipboard text, or null when the text
 * isn't usable. An `otpauth://` URI is parsed in full; any other text is only
 * accepted if it is a non-empty Base32 secret. Callers treat null as "nothing
 * to add" (e.g. flash the paste button) rather than opening a form.
 */
export async function prefillFromClipboardText(text: string): Promise<AddPrefill | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("otpauth://")) return parseOtpauthUri(trimmed);
  if (isValidBase32(trimmed)) {
    return { issuer: "", label: "", secret: normalizeBase32(trimmed), type: "totp" };
  }
  return null;
}
