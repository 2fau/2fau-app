import { describe, expect, it } from "vitest";
import { DemoVaultService } from "./demo-vault";

// RFC 6238 appendix B: SHA-1 seed "12345678901234567890", 8 digits.
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("DemoVaultService", () => {
  it("computes RFC 6238 TOTP codes", async () => {
    const vault = new DemoVaultService();
    const a = await vault.addUri(`otpauth://totp/Test:me?secret=${RFC_SECRET}&digits=8`);
    expect(await vault.code(a, 59_000)).toBe("94287082");
    expect(await vault.code(a, 1_111_111_109_000)).toBe("07081804");
    expect(await vault.code(a, 20_000_000_000_000)).toBe("65353130");
  });

  it("parses issuer and label from an otpauth link", async () => {
    const vault = new DemoVaultService();
    const a = await vault.addUri(`otpauth://totp/ACME%20Co:jane@acme.test?secret=${RFC_SECRET}`);
    expect(a.issuer).toBe("ACME Co");
    expect(a.label).toBe("jane@acme.test");
  });

  it("advances HOTP codes with the counter", async () => {
    const vault = new DemoVaultService();
    const a = await vault.addManual({ issuer: "X", label: "y", secretBase32: RFC_SECRET, type: "hotp" });
    // RFC 4226 appendix D, counters 0 and 1.
    expect(await vault.code(a, 0)).toBe("755224");
    await vault.advanceHotp(a.id);
    const [, , , , , , next] = await vault.list();
    expect(await vault.code(next, 0)).toBe("287082");
  });
});
