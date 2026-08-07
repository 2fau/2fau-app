# SP5 Phase C — Sync Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add **sync mode** — the extension keeps its own `chrome.storage` vault as primary and reconciles it with the desktop app in the background, so both hold the same accounts without the extension ever seeing the passphrase.

**Architecture:** Because each vault's blob is locked to a key derived from its own salt (and the desktop rotates its salt every save), the extension can't open the desktop's blob. So the merge is **desktop-mediated**: the extension POSTs its sealed local blob to a new `POST /merge` bridge endpoint; the desktop — the only holder of the passphrase — opens it with `open_with_passphrase`, folds it into its own vault with `twofau_core::merge`, and returns the merged document **re-sealed under the extension's own salt** so the extension can open it with the session key it already has. A `SyncEngine` in the service worker drives this on connect, on a ~60s alarm, and after local changes.

**Tech Stack:** Rust (`tiny_http`, `twofau_core::{merge,derive_key,seal,salt_of,open_with_passphrase}`), TypeScript, MV3 (`chrome.alarms`, `chrome.storage`), `@twofau/core-wasm`, Vitest.

**Scope note:** Phase C of SP5, the final piece. Depends on Phase A (bridge server, `AppVault`, revision) and Phase B (`HttpVaultRepo`, connection module, mode selector), both merged. Resolves the sync-crypto decision recorded for SP5: **desktop-mediated merge** (passphrase stays only on the desktop).

## Global Constraints

- Spec: `docs/specs/2026-07-23-subproject5-desktop-bridge.md`. Sync-crypto approach: desktop-mediated `/merge`.
- The passphrase is **never** sent to or stored by the extension — the desktop opens the extension's blob itself.
- Sync is **best-effort**: every failure path (desktop down, locked, passphrase mismatch) is a quiet no-op that never blocks or corrupts the local vault.
- The merge must not loop: only write the local vault when the merged document actually differs from the local one.
- `POST /merge` is bearer-authenticated like `/vault*` (three-layer defense unchanged) and requires the desktop vault to be **unlocked**.
- Rust: `cargo fmt --all --check` + `cargo clippy -p twofau-app --all-targets -- -D warnings` clean before each commit.
- Extension: `pnpm --filter @twofau/extension exec tsc --noEmit` + `pnpm --filter @twofau/extension test` green before each commit.

## Shared interfaces (contracts across tasks)

```rust
// app vault.rs (Task 1)
pub struct MergeResult { pub revision: u64, pub blob: Vec<u8> }
impl AppVault {
    // Opens `incoming` with the stored passphrase, merges into self, persists,
    // and returns the merged doc re-sealed under the sender's salt.
    pub fn merge_incoming(&self, incoming: &[u8]) -> Result<MergeResult, String>;
}
// bridge: POST /merge {blob} -> 200 {revision, blob} | 409 (locked) | 422 (passphrase) | 401
```

```ts
// extension src/background/sync-engine.ts (Task 2)
export type SyncOutcome =
  | "synced" | "up-to-date" | "skipped" | "locked" | "offline" | "conflict" | "error";
export function syncOnce(): Promise<SyncOutcome>;

// extension src/background/sync-alarm.ts (Task 3)
export const SYNC_ALARM = "2fau.sync";
export const SYNC_PERIOD_MINUTES = 1;
export function ensureSyncAlarm(): Promise<void>;
```

---

### Task 1: Desktop `merge_incoming` + `POST /merge`

**Files:**
- Modify: `apps/twofau-app/src-tauri/src/vault.rs` (imports, `MergeResult`, `merge_incoming`, tests)
- Modify: `apps/twofau-app/src-tauri/src/bridge/http.rs` (route + handler)
- Modify: `apps/twofau-app/src-tauri/Cargo.toml` (add `twofau-core` to dev-deps for the integration test)
- Test: `apps/twofau-app/src-tauri/tests/bridge.rs` (integration)

**Interfaces:**
- Consumes: `AppVault` internals; `twofau_core::{merge, derive_key, seal, salt_of, open_with_passphrase}`.
- Produces: `MergeResult`, `AppVault::merge_incoming`, and the `/merge` endpoint.

- [ ] **Step 1: Write the failing unit tests**

In `apps/twofau-app/src-tauri/src/vault.rs`, add to the `#[cfg(test)] mod tests` block:

```rust
    #[test]
    fn merge_incoming_merges_both_sides_and_replies_under_the_senders_salt() {
        let (desktop, _d) = fresh();
        desktop.unlock(PASS.into(), false).unwrap();
        let d = desktop
            .add_uri("otpauth://totp/D:d?secret=JBSWY3DPEHPK3PXP")
            .unwrap();

        // A second vault stands in for the extension: same passphrase, its own salt.
        let (ext, _e) = fresh();
        ext.unlock(PASS.into(), false).unwrap();
        let e = ext
            .add_uri("otpauth://totp/E:e?secret=JBSWY3DPEHPK3PXP")
            .unwrap();
        let ext_blob = ext.sealed_blob().unwrap().unwrap();
        let ext_salt = salt_of(&ext_blob).unwrap();

        let before = desktop.revision();
        let res = desktop.merge_incoming(&ext_blob).unwrap();
        assert!(res.revision > before);

        // The desktop now holds both accounts.
        let ids: Vec<_> = desktop.list().unwrap().into_iter().map(|a| a.id).collect();
        assert!(ids.contains(&d.id) && ids.contains(&e.id));

        // The reply is sealed under the sender's salt (so the extension's key
        // opens it) and carries the merged document.
        assert_eq!(salt_of(&res.blob).unwrap(), ext_salt);
        let doc = open_with_passphrase(&res.blob, PASS).unwrap();
        assert_eq!(doc.entries.len(), 2);
    }

    #[test]
    fn merge_incoming_rejects_a_different_passphrase() {
        let (desktop, _d) = fresh();
        desktop.unlock(PASS.into(), false).unwrap();
        let (ext, _e) = fresh();
        ext.unlock("a-different-passphrase".into(), false).unwrap();
        let ext_blob = ext.sealed_blob().unwrap().unwrap();
        let err = desktop.merge_incoming(&ext_blob).unwrap_err();
        assert!(err.contains("passphrase"), "got {err}");
    }

    #[test]
    fn merge_incoming_needs_an_unlocked_vault() {
        let (desktop, _d) = fresh(); // never unlocked
        let (ext, _e) = fresh();
        ext.unlock(PASS.into(), false).unwrap();
        let ext_blob = ext.sealed_blob().unwrap().unwrap();
        let err = desktop.merge_incoming(&ext_blob).unwrap_err();
        assert!(err.contains("locked"), "got {err}");
    }
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cargo test -p twofau-app --lib vault::tests::merge 2>&1 | tail -15`
Expected: FAIL — `no method named merge_incoming`, `cannot find function salt_of` (not yet imported here).

- [ ] **Step 3: Add the imports and `MergeResult`**

In `apps/twofau-app/src-tauri/src/vault.rs`, extend the `twofau_core` use to add the merge helpers:

```rust
use twofau_core::{
    base32_decode, derive_key, hotp, merge, open_with_passphrase, parse_otpauth, salt_of, seal,
    seal_with_passphrase, totp, Account, FileVaultStore, OtpAlgorithm, OtpType, StoredAccount,
    Tombstone, VaultDocument, VaultStore, NONCE_LEN, SALT_LEN,
};
```

Add the result type next to `ReplaceOutcome`:

```rust
/// Result of a desktop-mediated merge: the new desktop revision and the merged
/// document re-sealed under the *sender's* salt so they can open it themselves.
pub struct MergeResult {
    pub revision: u64,
    pub blob: Vec<u8>,
}
```

- [ ] **Step 4: Implement `merge_incoming`**

Add the method inside `impl AppVault` (after `replace_sealed`):

```rust
    /// Fold an externally-sealed blob (same passphrase, any salt) into this
    /// vault and return the merged document re-sealed under the sender's salt.
    /// Requires the vault unlocked — only the passphrase can open a foreign salt.
    pub fn merge_incoming(&self, incoming: &[u8]) -> Result<MergeResult, String> {
        let (merged, pass, sender_salt) = {
            let mut guard = self.inner.lock().expect("vault mutex");
            let u = guard.as_mut().ok_or("vault is locked")?;
            let doc_ext = open_with_passphrase(incoming, &u.passphrase)
                .map_err(|_| "passphrase mismatch".to_string())?;
            let merged = merge(&u.doc, &doc_ext);
            u.doc = merged.clone();
            let sender_salt = salt_of(incoming).map_err(str_err)?;
            (merged, u.passphrase.clone(), sender_salt)
        };
        // Persist the merged doc as our own next generation (fresh salt + rev).
        self.seal_and_save(&merged, &pass)?;
        // Re-seal it under the sender's salt so the extension's existing key opens it.
        let key = derive_key(&pass, &sender_salt);
        let nonce = random::<NONCE_LEN>();
        let blob = seal(&merged, &key, &sender_salt, &nonce).map_err(str_err)?;
        Ok(MergeResult {
            revision: self.revision(),
            blob,
        })
    }
```

- [ ] **Step 5: Run the unit tests to verify they pass**

Run: `cargo test -p twofau-app --lib vault::tests::merge 2>&1 | tail -15`
Expected: PASS — 3 tests.

- [ ] **Step 6: Add the `/merge` route and handler**

In `apps/twofau-app/src-tauri/src/bridge/http.rs`, add a route in the `match (method.as_str(), url.as_str())` block, next to the `PUT /vault` arm:

```rust
        ("POST", "/merge") => match authorize(ctx, &req, &origin) {
            Ok(()) => handle_merge(ctx, req),
            Err(resp) => {
                let _ = req.respond(resp);
            }
        },
```

Add the handler (near `handle_put_vault`):

```rust
fn handle_merge(ctx: &Ctx, mut req: Request) {
    let mut body = String::new();
    if req.as_reader().read_to_string(&mut body).is_err() {
        let _ = req.respond(json(400, r#"{"error":"unreadable body"}"#.into()));
        return;
    }
    let blob = serde_json::from_str::<serde_json::Value>(&body)
        .ok()
        .and_then(|v| v["blob"].as_str().and_then(base64_lite::decode_b64));
    let Some(blob) = blob else {
        let _ = req.respond(json(400, r#"{"error":"bad body"}"#.into()));
        return;
    };
    match ctx.vault.merge_incoming(&blob) {
        Ok(res) => {
            let body = format!(
                r#"{{"revision":{},"blob":"{}"}}"#,
                res.revision,
                base64_lite::encode_b64(&res.blob)
            );
            let _ = req.respond(json(200, body));
        }
        Err(e) if e.contains("locked") => {
            let _ = req.respond(json(409, r#"{"error":"desktop locked"}"#.into()));
        }
        Err(e) if e.contains("passphrase") => {
            let _ = req.respond(json(422, r#"{"error":"passphrase mismatch"}"#.into()));
        }
        Err(e) => {
            let _ = req.respond(json(500, format!(r#"{{"error":{e:?}}}"#)));
        }
    }
}
```

`Request` already needs `mut` for `as_reader()`; note the `handle_merge(ctx, req)` call passes `req` by value into a `mut req` parameter, which is fine.

- [ ] **Step 7: Add the integration test (and the dev-dep it needs)**

In `apps/twofau-app/src-tauri/Cargo.toml`, add `twofau-core` and `base64` to `[dev-dependencies]` so the black-box test can mint, encode, decode, and open blobs:

```toml
[dev-dependencies]
tempfile = "3"
# `json` pulls in `send_json`/`into_json`/`ureq::json!`; no TLS features are
# needed because the bridge is plain http on loopback.
ureq = { version = "2", default-features = false, features = ["json"] }
twofau-core = { path = "../../../crates/twofau-core" }
base64 = "0.22"
```

Append to `apps/twofau-app/src-tauri/tests/bridge.rs` (add `use base64::prelude::{Engine as _, BASE64_STANDARD};` to the imports at the top of the file):

```rust
#[test]
fn merge_endpoint_folds_a_foreign_vault_and_replies_under_its_salt() {
    let h = start(); // desktop unlocked with PASS (empty vault, revision 1)
    let token = pair(&h);

    // An "extension" vault: same passphrase, its own salt, one account.
    let edir = tempfile::tempdir().unwrap();
    let ext = AppVault::new(edir.path().join("v.dat"));
    ext.unlock(PASS.into(), false).unwrap();
    ext.add_uri("otpauth://totp/E:e?secret=JBSWY3DPEHPK3PXP").unwrap();
    let ext_blob = ext.sealed_blob().unwrap().unwrap();

    let resp: serde_json::Value = ureq::post(&format!("{}/merge", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .send_json(ureq::json!({ "blob": BASE64_STANDARD.encode(&ext_blob) }))
        .unwrap()
        .into_json()
        .unwrap();

    // The reply opens under the extension's passphrase and holds the account,
    // sealed under the sender's salt (so the extension's key opens it).
    let returned = BASE64_STANDARD.decode(resp["blob"].as_str().unwrap()).unwrap();
    let doc = twofau_core::open_with_passphrase(&returned, PASS).unwrap();
    assert_eq!(doc.entries.len(), 1);
    assert_eq!(
        twofau_core::salt_of(&returned).unwrap(),
        twofau_core::salt_of(&ext_blob).unwrap()
    );
}
```

No changes to `lib.rs`/`bridge/mod.rs` are needed — the `base64` dev-dependency handles encoding both directions.

- [ ] **Step 8: Run the full app suite**

Run: `cargo test -p twofau-app 2>&1 | tail -6`
Expected: PASS — vault unit tests (incl. the 3 merge tests), bridge integration (incl. `merge_endpoint_...`).

- [ ] **Step 9: Format, lint, commit**

```bash
cargo fmt --all && cargo clippy -p twofau-app --all-targets -- -D warnings
git add apps/twofau-app/src-tauri/src/vault.rs apps/twofau-app/src-tauri/src/bridge \
        apps/twofau-app/src-tauri/tests/bridge.rs apps/twofau-app/src-tauri/Cargo.toml Cargo.lock
git commit -m "feat(app): desktop-mediated /merge endpoint for extension sync"
```

---

### Task 2: `SyncEngine` — the reconcile pass

**Files:**
- Create: `apps/twofau-extension/src/background/sync-engine.ts`
- Test: `apps/twofau-extension/src/background/sync-engine.test.ts`

**Interfaces:**
- Consumes: `readSettings` (settings), `getSessionKey` (session-key), `VaultRepo` (vault-repo), `bridgeFetch`/`BridgeUnreachableError` (connection), `bytesToB64`/`b64ToBytes` (base64), `openWithKey` (core-wasm), `KDF_ID` (extension-vault-service).
- Produces: `syncOnce(): Promise<SyncOutcome>`.

- [ ] **Step 1: Write the failing tests**

Create `apps/twofau-extension/src/background/sync-engine.test.ts`:

```ts
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
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));
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
    const doc = await openWithKey(loaded!.blob, key);
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @twofau/extension test sync-engine 2>&1 | tail -8`
Expected: FAIL — `Failed to resolve import "./sync-engine"`.

- [ ] **Step 3: Implement the engine**

Create `apps/twofau-extension/src/background/sync-engine.ts`:

```ts
import { openWithKey, type VaultDocument } from "@twofau/core-wasm";
import { BridgeUnreachableError, bridgeFetch } from "../bridge/connection";
import { b64ToBytes, bytesToB64 } from "../vault/base64";
import { KDF_ID } from "../vault/extension-vault-service";
import { getSessionKey } from "../vault/session-key";
import { readSettings } from "../vault/settings";
import { VaultRepo } from "../vault/vault-repo";

export type SyncOutcome =
  | "synced"
  | "up-to-date"
  | "skipped"
  | "locked"
  | "offline"
  | "conflict"
  | "error";

/** Ask the desktop to merge our local blob and return the merged doc re-sealed
 *  under our salt. Throws BridgeUnreachableError if the desktop is down. */
async function mergeBlob(blob: Uint8Array): Promise<{ revision: number; blob: Uint8Array }> {
  const res = await bridgeFetch("/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blob: bytesToB64(blob) }),
  });
  if (!res.ok) throw new Error(`merge failed (${res.status})`);
  const { revision, blob: merged } = (await res.json()) as { revision: number; blob: string };
  return { revision, blob: b64ToBytes(merged) };
}

/** Stable serialisation so an unchanged document compares equal regardless of
 *  entry order — the guard that stops sync from looping on its own writes. */
function canonical(doc: VaultDocument): string {
  const entries = [...doc.entries].sort((a, b) => a.account.id.localeCompare(b.account.id));
  const tombstones = [...doc.tombstones].sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify({ entries, tombstones });
}

/**
 * One reconcile pass. Best-effort: any failure is a quiet no-op that leaves the
 * local vault untouched. Writes locally only when the merge actually changed
 * the document, so a converged pair never re-triggers.
 */
export async function syncOnce(): Promise<SyncOutcome> {
  const { mode, storageArea } = await readSettings();
  if (mode !== "sync") return "skipped";
  const key = await getSessionKey();
  if (key === null) return "locked";

  const local = new VaultRepo(storageArea);
  const localLoaded = await local.load();
  if (!localLoaded) return "up-to-date"; // no local vault yet — nothing to send

  let reply: { revision: number; blob: Uint8Array };
  try {
    reply = await mergeBlob(localLoaded.blob);
  } catch (err) {
    if (err instanceof BridgeUnreachableError) return "offline";
    return "error"; // desktop locked / passphrase mismatch / bad status
  }

  const before = await openWithKey(localLoaded.blob, key);
  const after = await openWithKey(reply.blob, key);
  if (canonical(before) === canonical(after)) return "up-to-date";

  // Persist under our own salt at the revision we read; a local write that
  // raced us returns a conflict and the next pass retries.
  const result = await local.save(
    reply.blob,
    localLoaded.manifest.salt,
    KDF_ID,
    localLoaded.manifest.revision,
  );
  return result.ok ? "synced" : "conflict";
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @twofau/extension test sync-engine 2>&1 | tail -12`
Expected: PASS — 5 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm --filter @twofau/extension exec tsc --noEmit
git add apps/twofau-extension/src/background/sync-engine.ts \
        apps/twofau-extension/src/background/sync-engine.test.ts
git commit -m "feat(extension): SyncEngine — desktop-mediated reconcile pass"
```

---

### Task 3: Service-worker sync triggers

**Files:**
- Modify: `apps/twofau-extension/src/test/fake-chrome.ts` (record alarm period)
- Create: `apps/twofau-extension/src/background/sync-alarm.ts`
- Modify: `apps/twofau-extension/src/background/index.ts` (wire triggers)
- Test: `apps/twofau-extension/src/background/sync-alarm.test.ts`

**Interfaces:**
- Consumes: `readSettings` (settings), `syncOnce` (Task 2), `chrome.alarms`.
- Produces: `SYNC_ALARM`, `SYNC_PERIOD_MINUTES`, `ensureSyncAlarm()`.

- [ ] **Step 1: Let the fake alarms record a period**

In `apps/twofau-extension/src/test/fake-chrome.ts`, the `FakeAlarms.create` currently stores `info.delayInMinutes`. Change it to record whichever field is present so periodic alarms are observable. Replace the `create` in the `alarms` object:

```ts
    create(name, info) {
      alarms.created[name] = info.delayInMinutes ?? info.periodInMinutes ?? 0;
    },
```

and widen the type on the interface's `create`:

```ts
  create(name: string, info: { delayInMinutes?: number; periodInMinutes?: number }): void;
```

- [ ] **Step 2: Write the failing alarm tests**

Create `apps/twofau-extension/src/background/sync-alarm.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { type FakeChrome, installFakeChrome } from "../test/fake-chrome";
import { writeSettings } from "../vault/settings";
import { ensureSyncAlarm, SYNC_ALARM, SYNC_PERIOD_MINUTES } from "./sync-alarm";

let fake: FakeChrome;

beforeEach(() => {
  fake = installFakeChrome();
});

describe("ensureSyncAlarm", () => {
  it("arms a periodic alarm in sync mode", async () => {
    await writeSettings({ mode: "sync" });
    await ensureSyncAlarm();
    expect(fake.alarms.created[SYNC_ALARM]).toBe(SYNC_PERIOD_MINUTES);
  });

  it("clears the alarm outside sync mode", async () => {
    await writeSettings({ mode: "sync" });
    await ensureSyncAlarm();
    await writeSettings({ mode: "independent" });
    await ensureSyncAlarm();
    expect(fake.alarms.created[SYNC_ALARM]).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm --filter @twofau/extension test sync-alarm 2>&1 | tail -8`
Expected: FAIL — `Failed to resolve import "./sync-alarm"`.

- [ ] **Step 4: Implement the alarm helper**

Create `apps/twofau-extension/src/background/sync-alarm.ts`:

```ts
import { readSettings } from "../vault/settings";

export const SYNC_ALARM = "2fau.sync";
/** chrome.alarms enforces a 1-minute floor for periodic alarms. */
export const SYNC_PERIOD_MINUTES = 1;

/** Arm the periodic sync alarm in sync mode; clear it otherwise. */
export async function ensureSyncAlarm(): Promise<void> {
  const { mode } = await readSettings();
  if (mode === "sync") {
    chrome.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_PERIOD_MINUTES });
  } else {
    await chrome.alarms.clear(SYNC_ALARM);
  }
}
```

- [ ] **Step 5: Wire the triggers into the service worker**

In `apps/twofau-extension/src/background/index.ts`, add imports at the top:

```ts
import { ensureSyncAlarm, SYNC_ALARM } from "./sync-alarm";
import { syncOnce } from "./sync-engine";
```

Add trigger registrations. After the existing `chrome.runtime.onInstalled`/`onStartup` handlers, extend them to also arm the alarm and sync on connect:

```ts
chrome.runtime.onInstalled.addListener(() => void ensureSyncAlarm());
chrome.runtime.onStartup.addListener(() => {
  void ensureSyncAlarm();
  void syncOnce(); // sync on connect
});
```

In the existing `chrome.storage.onChanged` listener, also re-arm the alarm when settings change and sync when the local vault changed. Extend its body:

```ts
chrome.storage.onChanged.addListener((changes, area) => {
  const relevant =
    (area === "session" && "vault.key" in changes) ||
    (area !== "session" && ("vault.manifest" in changes || "recent" in changes));
  if (relevant) void refreshContextMenu();

  if (area === "local" && "settings" in changes) void ensureSyncAlarm();
  // A local vault edit should push promptly; the engine's canonical-diff guard
  // makes its own resulting write a no-op, so this can't loop.
  if (area !== "session" && "vault.manifest" in changes) void syncOnce();
});
```

In the existing `chrome.alarms.onAlarm` listener, handle the sync alarm alongside auto-lock. Extend it:

```ts
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === AUTO_LOCK_ALARM) {
    await clearSessionKey();
    await refreshContextMenu();
    return;
  }
  if (alarm.name === SYNC_ALARM) {
    await syncOnce();
  }
});
```

(If the existing `onAlarm` handler is written as an early-return on `alarm.name !== AUTO_LOCK_ALARM`, replace that guard with the branched form above so both alarms are handled.)

- [ ] **Step 6: Run the extension suite and typecheck**

Run: `pnpm --filter @twofau/extension test 2>&1 | tail -8 && pnpm --filter @twofau/extension exec tsc --noEmit`
Expected: PASS — the alarm tests plus every prior suite; typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add apps/twofau-extension/src/test/fake-chrome.ts apps/twofau-extension/src/background
git commit -m "feat(extension): drive sync on connect, a 60s alarm, and local changes"
```

---

### Task 4: Options sync toggle + roadmap

**Files:**
- Modify: `apps/twofau-extension/src/options/options-view.tsx` (3-way mode toggle)
- Modify: `docs/ROADMAP.md` (SP5 done)

**Interfaces:**
- Consumes: the connection/pairing helpers already imported in `ConnectionSection` (Phase B).
- Produces: a user-selectable `sync` mode; no downstream interface.

- [ ] **Step 1: Make the mode picker three-way**

In `apps/twofau-extension/src/options/options-view.tsx`, widen `ConnectionSection`'s mode state and toggle to include `sync`. Replace the state declaration:

```tsx
  const [mode, setMode] = useState<"independent" | "client">("independent");
```

with:

```tsx
  const [mode, setMode] = useState<"independent" | "client" | "sync">("independent");
```

Replace the `useEffect` that seeds it:

```tsx
  useEffect(() => {
    void (async () => {
      const s = await readSettings();
      setMode(s.mode === "client" ? "client" : "independent");
      setPort(s.bridgePort);
    })();
  }, []);
```

with:

```tsx
  useEffect(() => {
    void (async () => {
      const s = await readSettings();
      setMode(s.mode);
      setPort(s.bridgePort);
    })();
  }, []);
```

Replace `chooseClient`/`chooseIndependent` with a single handler that also covers sync (both `client` and `sync` need the loopback permission):

```tsx
  async function choose(next: "independent" | "client" | "sync") {
    setError(null);
    setStatus(null);
    if (next !== "independent") {
      const granted = await ensureBridgePermission();
      if (!granted) {
        setError("Permission to reach the desktop app was declined.");
        return;
      }
    }
    setMode(next);
    await writeSettings({ mode: next });
  }
```

Replace the two-item `ToggleGroup` with a three-item one and adapt the explanation:

```tsx
      <ToggleGroup
        type="single"
        variant="outline"
        value={mode}
        onValueChange={(v) => {
          if (v === "independent" || v === "client" || v === "sync") void choose(v);
        }}
        className="w-full"
      >
        <ToggleGroupItem value="independent" className="flex-1">
          This browser
        </ToggleGroupItem>
        <ToggleGroupItem value="sync" className="flex-1">
          Sync
        </ToggleGroupItem>
        <ToggleGroupItem value="client" className="flex-1">
          Desktop
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-[11px] text-muted-foreground">
        {mode === "client"
          ? "Vaults live in the desktop app; this browser is a client."
          : mode === "sync"
            ? "This browser keeps its own vault and syncs it with the desktop app when it's running."
            : "This browser keeps its own vault (synced across your Chrome profile)."}
      </p>
```

Finally, show the port + pairing controls for **both** bridge modes. Change the guard `{mode === "client" && (` around the port/code block to:

```tsx
      {mode !== "independent" && (
```

- [ ] **Step 2: Typecheck, test, build**

Run: `pnpm --filter @twofau/extension exec tsc --noEmit && pnpm --filter @twofau/extension test 2>&1 | tail -4 && pnpm --filter @twofau/extension build 2>&1 | tail -4`
Expected: clean typecheck; all suites pass; `dist/` builds.

- [ ] **Step 3: Update the roadmap**

In `docs/ROADMAP.md`, change the SP5 row's status to `**done**` and its "next"/"in progress" note accordingly, and under the SP5 section note all three modes shipped (independent, desktop-client, sync). Replace the SP5 table row:

```markdown
| SP5 | Desktop localhost bridge + sync | **next** | — |
```

with:

```markdown
| SP5 | Desktop localhost bridge + sync (independent / client / sync modes) | **done** | `specs/2026-07-23-subproject5-desktop-bridge.md` |
```

- [ ] **Step 4: Manual check — sync end to end**

With the desktop app running (bridge enabled, unlocked, same passphrase as the extension), set the extension to **Sync** and pair. Add an account in the extension; within ~60s it appears in the desktop. Add one in the desktop; within ~60s (or on reopening the popup) it appears in the extension. Turn the desktop off — the extension keeps working on its local vault; turning it back on re-converges.
**Manual check — report exactly what happened.**

- [ ] **Step 5: Commit**

```bash
git add apps/twofau-extension/src/options/options-view.tsx docs/ROADMAP.md
git commit -m "feat(extension): selectable sync mode; SP5 complete"
```

---

## Spec coverage (Phase C)

| Spec item (SP5) | Task |
| --- | --- |
| Sync mode: local primary + background reconcile with desktop | 2, 3 |
| Reconcile via `twofau_core::merge`, newest-wins/tombstones | 1 (desktop merge) |
| Passphrase never leaves the desktop (desktop-mediated) | 1 |
| Triggers: on connect, ~60s alarm, after local change | 3 |
| Best-effort, no-op when desktop absent; no sync loop | 2 (offline + canonical guard) |
| Mode selector offers all three modes | 4 |
| `POST /merge` bearer-authenticated, needs unlocked desktop | 1 |
| Roadmap reflects SP5 done | 4 |

## Out of scope (SP5 complete after this)

- Real-time push (sync is timer + event driven, ≤60s latency).
- Popup live-refresh while open during a background sync (it refreshes on its next read tick).
- Conflict UI beyond automatic newest-wins merge.
