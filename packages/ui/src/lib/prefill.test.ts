import { describe, expect, it } from "vitest";
import { prefillFromClipboardText } from "./prefill";

// Pure TS (no WASM) so it also works in the desktop webview, which never
// initializes the core module.
describe("prefillFromClipboardText", () => {
  it("returns null for empty or whitespace text", async () => {
    expect(await prefillFromClipboardText("")).toBeNull();
    expect(await prefillFromClipboardText("   \n")).toBeNull();
  });

  it("parses an otpauth:// URI into fields, keeping the URI for fidelity", async () => {
    const p = await prefillFromClipboardText(
      "otpauth://totp/Acme:me@x.com?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Acme&digits=8",
    );
    expect(p).toMatchObject({
      issuer: "Acme",
      label: "me@x.com",
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
    });
    expect(p?.uri).toContain("otpauth://totp/");
  });

  it("derives the issuer from an 'Issuer:Account' label when no issuer param", async () => {
    const p = await prefillFromClipboardText(
      "otpauth://totp/GitHub:octocat?secret=GEZDGNBVGY3TQOJQ",
    );
    expect(p).toMatchObject({ issuer: "GitHub", label: "octocat" });
  });

  it("marks an hotp URI as hotp", async () => {
    const p = await prefillFromClipboardText("otpauth://hotp/x?secret=GEZDGNBVGY3TQOJQ&counter=3");
    expect(p?.type).toBe("hotp");
  });

  it("accepts a raw base32 secret (trimmed/upper-cased), with no URI", async () => {
    const p = await prefillFromClipboardText("  gezdgnbvgy3tqojq  ");
    expect(p).toEqual({
      issuer: "",
      label: "",
      secret: "GEZDGNBVGY3TQOJQ",
      type: "totp",
    });
    expect(p?.uri).toBeUndefined();
  });

  it("returns null for a malformed or secret-less otpauth:// URI", async () => {
    expect(await prefillFromClipboardText("otpauth://totp/no-secret")).toBeNull();
    expect(await prefillFromClipboardText("otpauth://sms/x?secret=GEZDGNBVGY3TQOJQ")).toBeNull();
  });

  it("returns null for text that isn't valid base32 (URL, prose, punctuation)", async () => {
    expect(await prefillFromClipboardText("https://example.com/login")).toBeNull();
    expect(await prefillFromClipboardText("just a note, not a secret!")).toBeNull();
    // Digits 0/1/8/9 are outside the base32 alphabet.
    expect(await prefillFromClipboardText("10891089")).toBeNull();
  });

  it("rejects short all-alphabet words that only look like base32", async () => {
    // Within the Base32 alphabet but far too short to be a real secret, so they
    // must blink rather than open the form.
    expect(await prefillFromClipboardText("hello")).toBeNull();
    expect(await prefillFromClipboardText("helloworld")).toBeNull();
    expect(await prefillFromClipboardText("meetatnoon")).toBeNull();
  });
});
