import { describe, expect, it } from "vitest";
import { base32Encode, buildOtpauthUri } from "./otpauth";

describe("base32Encode", () => {
  it("encodes 'Hello!' to its known base32", () => {
    // RFC 4648: base32("Hello!") = JBSWY3DPEE (6 bytes -> 10 chars, no padding).
    expect(base32Encode(new TextEncoder().encode("Hello!"))).toBe("JBSWY3DPEE");
  });

  it("is empty for empty input", () => {
    expect(base32Encode(new Uint8Array())).toBe("");
  });
});

describe("buildOtpauthUri", () => {
  const acme = {
    id: "a",
    issuer: "Acme",
    label: "me@x.com",
    otp_type: "Totp" as const,
    algorithm: "Sha1" as const,
    digits: 6,
    period: 30,
    counter: 0,
  };

  it("builds a totp uri with issuer, label, and base32 secret", () => {
    const uri = buildOtpauthUri(acme, "SGVsbG8h"); // base64 of "Hello!"
    expect(uri.startsWith("otpauth://totp/Acme:me%40x.com?")).toBe(true);
    expect(uri).toContain("secret=JBSWY3DPEE");
    expect(uri).toContain("issuer=Acme");
    expect(uri).toContain("period=30");
  });

  it("uses a counter for hotp and no issuer prefix when issuer is empty", () => {
    const uri = buildOtpauthUri(
      { ...acme, issuer: "", otp_type: "Hotp", counter: 4 },
      "SGVsbG8h",
    );
    expect(uri.startsWith("otpauth://hotp/me%40x.com?")).toBe(true);
    expect(uri).toContain("counter=4");
    expect(uri).not.toContain("issuer=");
  });
});
