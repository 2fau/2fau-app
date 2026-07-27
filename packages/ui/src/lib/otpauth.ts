import type { Account } from "@/core/types";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 base32 (no padding) of raw bytes. The core only decodes base32, and
 * the vault stores secrets as base64, so building an otpauth:// URI needs this. */
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** RFC 4648 base32 (no padding) of a base64-encoded secret — the vault's wire
 * form is base64, but the manual-entry field and QR expect base32. */
export function base32FromBase64(secretBase64: string): string {
  return base32Encode(b64ToBytes(secretBase64));
}

function algorithmName(a: Account["algorithm"]): string {
  return a === "Sha256" ? "SHA256" : a === "Sha512" ? "SHA512" : "SHA1";
}

/**
 * Build an `otpauth://` URI for `account` whose secret is base64-encoded raw
 * bytes (the vault's on-disk form). Used to render an account's QR for re-adding
 * it on another device.
 */
export function buildOtpauthUri(account: Account, secretBase64: string): string {
  const type = account.otp_type === "Hotp" ? "hotp" : "totp";
  const label = account.issuer
    ? `${encodeURIComponent(account.issuer)}:${encodeURIComponent(account.label)}`
    : encodeURIComponent(account.label);
  const params = new URLSearchParams();
  params.set("secret", base32Encode(b64ToBytes(secretBase64)));
  if (account.issuer) params.set("issuer", account.issuer);
  params.set("algorithm", algorithmName(account.algorithm));
  params.set("digits", String(account.digits));
  if (type === "totp") params.set("period", String(account.period));
  else params.set("counter", String(account.counter));
  return `otpauth://${type}/${label}?${params.toString()}`;
}
