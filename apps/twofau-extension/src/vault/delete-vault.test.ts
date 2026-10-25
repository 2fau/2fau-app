import { beforeEach, describe, expect, it } from "vitest";
import { installFakeChrome } from "../test/fake-chrome";
import { createVaultService } from "./backend";
import { deleteLocalVault } from "./delete-vault";
import type { ExtensionVaultService } from "./extension-vault-service";
import { readSettings, writeSettings } from "./settings";

const PASSPHRASE = "correct-horse-battery";
const URI = "otpauth://totp/Acme:me@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme";

const build = () => createVaultService() as Promise<ExtensionVaultService>;

async function seedVault() {
  const service = await build();
  await service.unlock(PASSPHRASE);
  await service.addUri(URI);
}

beforeEach(() => {
  installFakeChrome();
});

describe("deleteLocalVault", () => {
  it("deletes the vault and leaves Independent mode alone", async () => {
    await seedVault();
    await deleteLocalVault(PASSPHRASE, build);

    expect((await build()).needsSetup()).toBe(true);
    expect((await readSettings()).mode).toBe("independent");
  });

  it("leaves Sync mode so a reconcile cannot pull the vault back, keeping the pairing", async () => {
    await seedVault();
    await writeSettings({ mode: "sync" });
    await chrome.storage.local.set({ "bridge.token": "tok" });

    await deleteLocalVault(PASSPHRASE, build);

    expect((await readSettings()).mode).toBe("independent");
    expect((await build()).needsSetup()).toBe(true);
    const local = await chrome.storage.local.get("bridge.token");
    expect(local["bridge.token"]).toBe("tok"); // still paired
  });

  it("refuses in Desktop-vault mode, where the vault is not this browser's", async () => {
    await seedVault();
    await writeSettings({ mode: "client" });

    await expect(deleteLocalVault(PASSPHRASE, build)).rejects.toThrow(/desktop app/i);
    await writeSettings({ mode: "independent" });
    expect((await build()).needsSetup()).toBe(false); // nothing was deleted
  });

  it("keeps the vault and the mode when the passphrase is wrong", async () => {
    await seedVault();
    await writeSettings({ mode: "sync" });

    await expect(deleteLocalVault("not-the-passphrase", build)).rejects.toThrow(/wrong passphrase/i);

    expect((await readSettings()).mode).toBe("sync");
    expect((await build()).needsSetup()).toBe(false);
  });
});
