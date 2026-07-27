// @vitest-environment node
import { readFileSync } from "node:fs";
import { ensureReady } from "@twofau/core-wasm";
import { beforeAll, describe, expect, it } from "vitest";
import { prefillFromClipboardText } from "./prefill";

// Uses the real WASM core so otpauth parsing (and the base64→base32 secret
// round-trip) is exercised end to end.
beforeAll(async () => {
  const wasm = readFileSync(
    new URL("../../../core-wasm/pkg/twofau_wasm_bg.wasm", import.meta.url),
  );
  await ensureReady({ module_or_path: wasm });
});

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

  it("marks an hotp URI as hotp", async () => {
    const p = await prefillFromClipboardText(
      "otpauth://hotp/x?secret=GEZDGNBVGY3TQOJQ&counter=3",
    );
    expect(p?.type).toBe("hotp");
  });

  it("treats non-otpauth text as a raw base32 secret with no URI", async () => {
    const p = await prefillFromClipboardText("  GEZDGNBVGY3TQOJQ  ");
    expect(p).toEqual({
      issuer: "",
      label: "",
      secret: "GEZDGNBVGY3TQOJQ",
      type: "totp",
    });
    expect(p?.uri).toBeUndefined();
  });

  it("returns null for a malformed otpauth:// URI", async () => {
    expect(await prefillFromClipboardText("otpauth://totp/no-secret")).toBeNull();
  });

  it("returns null for text that isn't valid base32 (URL, prose, punctuation)", async () => {
    expect(await prefillFromClipboardText("https://example.com/login")).toBeNull();
    expect(await prefillFromClipboardText("just a note, not a secret!")).toBeNull();
    // Digits 0/1/8/9 are outside the base32 alphabet.
    expect(await prefillFromClipboardText("10891089")).toBeNull();
  });
});
