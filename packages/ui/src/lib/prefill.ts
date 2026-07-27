import { base32Decode, parseOtpauth } from "@twofau/core-wasm";
import { base32FromBase64 } from "./otpauth";

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

/**
 * Build Add-form prefill from arbitrary clipboard text, or null when the text
 * isn't usable. An `otpauth://` URI is parsed in full; any other text is only
 * accepted if it decodes as a non-empty Base32 secret. Callers treat null as
 * "nothing to add" (e.g. flash the paste button) rather than opening a form.
 */
export async function prefillFromClipboardText(text: string): Promise<AddPrefill | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("otpauth://")) {
    try {
      const p = await parseOtpauth(trimmed);
      return {
        issuer: p.issuer,
        label: p.label,
        secret: base32FromBase64(p.secret),
        type: p.otp_type === "Hotp" ? "hotp" : "totp",
        uri: trimmed,
      };
    } catch {
      return null; // malformed otpauth:// — not a valid import
    }
  }

  // A bare secret: accept only if it's genuinely Base32 and non-empty. This
  // rejects URLs, prose, and code that happen to be on the clipboard.
  try {
    const decoded = await base32Decode(trimmed); // base64 of the bytes; throws on bad chars
    if (!decoded) return null;
  } catch {
    return null;
  }
  return { issuer: "", label: "", secret: trimmed, type: "totp" };
}
