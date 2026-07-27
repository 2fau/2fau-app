import { parseOtpauth } from "@twofau/core-wasm";
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
 * Build Add-form prefill from arbitrary clipboard text. An `otpauth://` URI is
 * parsed in full (throws if malformed); any other non-empty text is taken as a
 * raw Base32 secret. Returns null for empty/whitespace text.
 */
export async function prefillFromClipboardText(text: string): Promise<AddPrefill | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("otpauth://")) {
    const p = await parseOtpauth(trimmed);
    return {
      issuer: p.issuer,
      label: p.label,
      secret: base32FromBase64(p.secret),
      type: p.otp_type === "Hotp" ? "hotp" : "totp",
      uri: trimmed,
    };
  }

  return { issuer: "", label: "", secret: trimmed, type: "totp" };
}
