// @vitest-environment node
import { readFileSync } from "node:fs";
import { ensureReady } from "@twofau/core-wasm";
import { beforeAll, describe, expect, it } from "vitest";
import { MockVaultService } from "./mock-vault-service";

// The contract test runs against the REAL WASM core (not a fake), so codes are
// genuine. Init the module from the built .wasm bytes (node has no fetch URL).
beforeAll(async () => {
  const wasm = readFileSync(
    new URL("../../../core-wasm/pkg/twofau_wasm_bg.wasm", import.meta.url),
  );
  await ensureReady({ module_or_path: wasm });
});

describe("MockVaultService (real core)", () => {
  it("imports an otpauth URI and computes the RFC 6238 code", async () => {
    const svc = new MockVaultService();
    const acct = await svc.addUri(
      "otpauth://totp/Acme:me?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&digits=8",
    );
    expect(acct.issuer).toBe("Acme");
    expect(acct.label).toBe("me");
    expect(await svc.code(acct, 59_000)).toBe("94287082");
  });

  it("adds a manual account and removes it", async () => {
    const svc = new MockVaultService();
    const a = await svc.addManual({
      issuer: "X",
      label: "y",
      secretBase32: "GEZDGNBVGY3TQOJQ",
      type: "totp",
    });
    expect((await svc.list()).length).toBe(1);
    await svc.remove(a.id);
    expect((await svc.list()).length).toBe(0);
  });

  it("advances an HOTP counter", async () => {
    const svc = new MockVaultService();
    const a = await svc.addManual({
      issuer: "H",
      label: "otp",
      secretBase32: "GEZDGNBVGY3TQOJQ",
      type: "hotp",
    });
    await svc.advanceHotp(a.id);
    const [updated] = await svc.list();
    expect(updated.counter).toBe(1);
  });

  it("round-trips an account through its secretUri", async () => {
    const svc = new MockVaultService();
    const original = await svc.addUri(
      "otpauth://totp/Acme:me?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&digits=8",
    );
    const uri = await svc.secretUri(original.id);
    // Re-importing the emitted URI must yield the same secret (same 8-digit code).
    const reimported = await svc.addUri(uri);
    expect(uri.startsWith("otpauth://totp/Acme:me?")).toBe(true);
    expect(uri).toContain("secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(await svc.code(reimported, 59_000)).toBe("94287082");
  });

  it("rejects secretUri for an unknown id", async () => {
    const svc = new MockVaultService();
    await expect(svc.secretUri("nope")).rejects.toThrow();
  });
});
