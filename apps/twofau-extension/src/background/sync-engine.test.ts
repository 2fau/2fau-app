import { deriveKey, newSalt, openWithKey, sealWithKey, vaultSalt } from "@twofau/core-wasm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChrome } from "../test/fake-chrome";
import { bytesToB64 } from "../vault/base64";
import { setSessionKey } from "../vault/session-key";
import { writeSettings } from "../vault/settings";
import { VaultRepo } from "../vault/vault-repo";
import { syncOnce } from "./sync-engine";

const PASS = "correct-horse-battery";
const SECRET = "JBSWY3DPEHPK3PXP";

function account(id: string, issuer: string) {
  return {
    account: {
      id,
      issuer,
      label: issuer.toLowerCase(),
      otp_type: "Totp" as const,
      algorithm: "Sha1" as const,
      digits: 6,
      period: 30,
      counter: 0,
      color: "",
    },
    secret: btoa(SECRET),
    modified_at: 1,
  };
}

// Seed a local sync-mode vault under a known key; return its salt and key.
async function seedLocal(entries: ReturnType<typeof account>[]) {
  const salt = await newSalt();
  const key = await deriveKey(PASS, salt);
  const blob = await sealWithKey({ entries, tombstones: [] }, key, salt);
  await new VaultRepo("sync").save(blob, salt, 1, 0);
  await setSessionKey(key);
  return { salt, key };
}

/** A fake desktop /merge: unions the sent doc with `desktopEntries`, replies
 *  sealed under the sender's salt. */
function fakeMergeDesktop(desktopEntries: ReturnType<typeof account>[]) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (!url.endsWith("/merge")) return new Response("{}", { status: 404 });
    const sent = JSON.parse(String(init?.body)) as { blob: string };
    const bytes = Uint8Array.from(atob(sent.blob), (c) => c.charCodeAt(0));
    const salt = await vaultSalt(bytes);
    const key = await deriveKey(PASS, salt);
    const doc = await openWithKey(bytes, key);
    const byId = new Map(doc.entries.map((e) => [e.account.id, e]));
    for (const e of desktopEntries) if (!byId.has(e.account.id)) byId.set(e.account.id, e);
    const merged = { entries: [...byId.values()], tombstones: doc.tombstones };
    const reply = await sealWithKey(merged, key, salt);
    return new Response(JSON.stringify({ revision: 9, blob: bytesToB64(reply) }), { status: 200 });
  });
}

beforeEach(() => {
  installFakeChrome();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("syncOnce", () => {
  it("skips unless in sync mode", async () => {
    await writeSettings({ mode: "independent" });
    expect(await syncOnce()).toBe("skipped");
  });

  it("reports locked when there is no session key", async () => {
    await writeSettings({ mode: "sync" });
    expect(await syncOnce()).toBe("locked");
  });

  it("reports offline when the desktop is unreachable", async () => {
    await writeSettings({ mode: "sync" });
    await seedLocal([account("11111111-1111-4111-8111-111111111111", "Local")]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    expect(await syncOnce()).toBe("offline");
  });

  it("folds the desktop's accounts into the local vault", async () => {
    await writeSettings({ mode: "sync" });
    const local = account("11111111-1111-4111-8111-111111111111", "Local");
    const { key } = await seedLocal([local]);
    const remote = account("22222222-2222-4222-8222-222222222222", "Remote");
    vi.stubGlobal("fetch", fakeMergeDesktop([remote]));

    expect(await syncOnce()).toBe("synced");

    const loaded = await new VaultRepo("sync").load();
    const doc = await openWithKey(loaded?.blob as Uint8Array, key);
    expect(doc.entries.map((e) => e.account.issuer).sort()).toEqual(["Local", "Remote"]);
  });

  it("is a no-op (up-to-date) when nothing changed", async () => {
    await writeSettings({ mode: "sync" });
    const local = account("11111111-1111-4111-8111-111111111111", "Local");
    await seedLocal([local]);
    vi.stubGlobal("fetch", fakeMergeDesktop([])); // desktop adds nothing

    const before = (await new VaultRepo("sync").loadManifest())?.revision;
    expect(await syncOnce()).toBe("up-to-date");
    const after = (await new VaultRepo("sync").loadManifest())?.revision;
    expect(after).toBe(before); // no wasteful re-write -> no sync loop
  });
});
