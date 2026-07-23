# SP5 — Desktop localhost bridge + device sync

**Status:** designed (2026-07-23)
**Depends on:** SP3 (Tauri desktop app), SP4 (Chrome extension). The extension's
`createVaultService()` seam and the key-based sealed-blob vault API were built in
SP4 specifically for this sub-project.

## Goal

Let the Chrome extension and the desktop app share one vault, three ways the user
chooses between:

1. **Independent** — the SP4 behaviour, `chrome.storage` only, no desktop contact.
2. **Desktop client** — the extension holds no vault of its own; every operation
   goes to the running desktop over a localhost bridge. When the desktop is
   closed, the extension is locked/unavailable.
3. **Sync with desktop** — the extension keeps its own `chrome.storage` vault as
   the primary, and a background engine reconciles it with the desktop's vault on
   connect, on a ~60s timer, and after each local change.

## Guiding principle: the bridge moves ciphertext, never plaintext

The on-disk vault blob is byte-identical between the desktop's `vault.dat` and the
extension's chunked `chrome.storage` copy (proven bidirectionally by SP4's
format-compat tests). So the bridge only ever transfers the **sealed blob**, and
each side opens it with its own derived key. No account, secret, or code crosses
the wire in the clear. This is why SP4 built `deriveKey` / `sealWithKey` /
`openWithKey` / `vaultSalt` and a byte-compatible blob format.

## Architecture

```
Extension (Chrome)                          Desktop (Tauri)
------------------                          ---------------
options: mode selector                      popup → BridgeSettings section
  independent | client | sync                 enable toggle, port, pairing code,
        │                                      paired-browser list + revoke
        ▼                                            │
createVaultService()  ──switch on mode──┐            ▼
  independent → ExtensionVaultService     Tauri commands: bridge_status,
                  over VaultRepo            bridge_enable, bridge_pairing_code,
  client      → ExtensionVaultService      bridge_revoke
                  over HttpVaultRepo ───┐          │
  sync        → ExtensionVaultService    │         ▼
                  over VaultRepo         │   HTTP server @ 127.0.0.1:4849
                  + SyncEngine ──────────┼──▶  GET /ping
                                         └──▶  POST /pair
                                              GET /vault/revision
                                              GET /vault
                                              PUT /vault
                                                    │
                                              AppVault (owns vault.dat + revision)
```

The reuse that makes this cheap: **desktop-client mode is `ExtensionVaultService`
over an `HttpVaultRepo`** — the same class and the same revision-guard/merge logic
SP4 already tested, with only the repo's backing bytes coming from HTTP instead of
`chrome.storage`.

## The bridge server (desktop)

A small HTTP server inside the Tauri app, **off by default**, enabled from the
popup's bridge section. Bound to `127.0.0.1` only (never `0.0.0.0`); default port
`4849`, configurable.

Implementation: a lightweight embedded server (e.g. `tiny_http` on a dedicated
thread) — the surface is tiny and does not justify pulling in a full async stack.
It shares the process's `AppVault`.

### Endpoints

| Method | Path | Auth | Purpose | Responses |
| --- | --- | --- | --- | --- |
| `GET` | `/ping` | origin+host | discovery / health | `200 {name:"2fau", version}` |
| `POST` | `/pair` | pairing code | establish a token | `200 {token}` \| `401` |
| `GET` | `/vault/revision` | bearer | cheap revision peek | `200 {revision}` \| `404` |
| `GET` | `/vault` | bearer | fetch sealed blob | `200 {revision, blob}` \| `404` |
| `PUT` | `/vault` | bearer | write sealed blob | `200 {revision}` \| `409 {revision, blob}` \| `401` |

- `blob` is the base64 of the sealed vault bytes (same encoding the extension's
  `VaultRepo` already uses).
- `/vault/revision` backs `HttpVaultRepo.loadManifest()` so the service's
  read-cache check stays a one-line request.
- `404` on `/vault*` means the desktop has no vault yet (first run) — the extension
  treats it as an empty vault to create, exactly as `chrome.storage` returns null.

### Three independent defenses

Localhost is hostile: any local process, and web pages via DNS-rebinding, can send
requests. Three layers, each sufficient on its own:

1. **Origin pinning.** Pairing records the extension's `chrome-extension://<id>`
   origin. Every later request must carry that exact `Origin`; the server returns
   no permissive CORS headers to anyone else. A web page's origin won't match.
2. **`Host` header check.** Must be `127.0.0.1:<port>` or `localhost:<port>`. A
   DNS-rebinding attack arrives with the attacker's `Host`, so it is rejected.
3. **Bearer token.** Every `/vault*` request needs `Authorization: Bearer <token>`,
   compared in constant time.

Because the payload is already the sealed blob, defeating all three layers still
yields only ciphertext, unopenable without the passphrase.

### Revision (optimistic concurrency)

`AppVault` gains a monotonic `revision: u64`, persisted alongside `vault.dat` (a
small sidecar, e.g. `bridge-state.json`, which also holds the paired tokens). It is
incremented on **every** desktop save — including edits made in the desktop UI —
so the extension always observes desktop changes. `PUT /vault` carries
`base_revision`; a mismatch returns `409` with the current `{revision, blob}`. The
salt for a conflict is recovered by the extension from the returned blob via
`vaultSalt`, so the desktop need not send it separately.

## Pairing handshake

1. Desktop bridge section shows a short code (e.g. `4H7K-9QX2`), valid ~2 minutes.
2. In the extension, selecting a bridge mode triggers a runtime request for the
   optional `http://127.0.0.1/*` host permission, then prompts for the code.
3. Extension `POST /pair {code, extensionId}`.
4. Desktop verifies the code, mints a token bound to that extension origin, returns
   it, and adds the browser to its paired list.
5. Extension stores the token in `chrome.storage.local`. The token grants access
   only to ciphertext and is revocable from the desktop at any time.

## Host permission

Calling `http://127.0.0.1:4849` at all requires a host permission the extension
manifest deliberately omitted in SP4. It is declared **optional** as
`http://127.0.0.1/*` (host-permission match patterns ignore the port, so one
pattern covers whatever port the user configures) and requested at runtime only
when the user turns on a bridge mode. Independent-mode users continue to run with
zero host access, and the permission never appears at install time.

## Extension side

### `HttpVaultRepo` (`apps/twofau-extension/src/vault/http-vault-repo.ts`)

Implements the exact `VaultRepo` shape so `ExtensionVaultService` consumes it
unchanged:

- `hasVault()` → `GET /vault` `404` ⇒ false.
- `loadManifest()` → `GET /vault/revision` ⇒ `{revision}` shaped into a manifest.
- `load()` → `GET /vault` ⇒ `LoadedVault` with `manifest.salt = vaultSalt(blob)`
  and `manifest.revision` from the response.
- `save(blob, salt, kdfId, baseRevision)` → `PUT /vault` ⇒ `{ok:true, manifest}` or
  `{ok:false, conflict}` mapping the `409` body.

A thin `bridgeFetch()` helper wraps the token/`Origin` headers, a timeout, and
maps transport failures to a distinct "desktop unreachable" error.

### `backend.ts`

`Settings` gains a new `mode: "independent" | "client" | "sync"`, orthogonal to the
SP4 `storageArea`. `storageArea` (`sync` | `local`) still governs where the local
`chrome.storage` vault lives, and so applies in `independent` and `sync` modes;
`client` mode ignores it (there is no local vault). `createVaultService()` switches
on `mode`:

- `independent` → `ExtensionVaultService` over `VaultRepo` (unchanged from SP4).
- `client` → `ExtensionVaultService` over `HttpVaultRepo`. When the desktop is
  unreachable, the service reports a distinct "desktop offline" locked state so the
  popup shows a reconnect prompt rather than a misleading empty vault.
- `sync` → `ExtensionVaultService` over the local `VaultRepo`, plus a `SyncEngine`.

### `SyncEngine` (`apps/twofau-extension/src/background/sync-engine.ts`)

Runs in the service worker. One reconcile pass: pull the desktop blob → `merge`
into the local vault → if the merge changed anything, commit locally and `PUT` the
merged blob back to the desktop; a `409` on push folds the remote in and retries,
exactly like `ExtensionVaultService.commit()`. Triggered on connect, on a ~60s
alarm, and on local `storage.onChanged`. Every pass is a silent no-op when the
desktop is absent — sync is best-effort and never blocks the UI.

## Desktop UI

`@twofau/ui`'s `TwoFAUApp` gains one optional `settingsSlot` prop and renders a
header gear only when it is provided. The extension passes nothing. The desktop
passes `<BridgeSettings>`, which lives in `apps/twofau-app` (not the shared
package) and calls new Tauri commands:

- `bridge_status()` → enabled, port, paired browsers.
- `bridge_enable(on, port)` → start/stop the server.
- `bridge_pairing_code()` → a fresh short-lived code.
- `bridge_revoke(browserId)` → drop a token.

No bridge-specific code enters `@twofau/ui`.

## Testing

- **`HttpVaultRepo`** — against a fake-`fetch` double, reusing the SP4 repo test
  patterns (round-trip, `404`→no-vault, `409`→conflict, unreachable→error).
- **`SyncEngine`** — merge and conflict-retry paths headless, with a fake desktop
  repo.
- **Desktop server** — Rust integration tests drive a real TCP client:
  origin/host/token rejection, the pairing flow, the revision guard (`409` on stale
  `base_revision`), and `AppVault.revision` bumping on UI edits.
- **Format compatibility** across sides is already proven by SP4.
- **Manual** (`MANUAL-CHECKS.md`): real-browser-to-real-desktop pairing, each mode
  end to end, revoke, and desktop-offline behaviour in client and sync modes.

## Phasing

One spec, a sequenced implementation plan. Each phase is independently testable and
useful:

- **Phase A** — desktop bridge server, pairing, `bridge_*` Tauri commands,
  `AppVault.revision`. Verified by Rust integration tests.
- **Phase B** — `HttpVaultRepo`, `client` mode wiring, the `@twofau/ui`
  `settingsSlot`, and `<BridgeSettings>`. Client mode ships usable here.
- **Phase C** — `SyncEngine` and `sync` mode.

## Out of scope

- Sync across two browsers with **no** desktop running (that remains
  `chrome.storage.sync` from SP4; the bridge is desktop-mediated only).
- Discovery beyond a single configurable port (no port-range scan).
- Remote/non-loopback access; the server binds `127.0.0.1` only.
- Mobile or non-Chrome browsers.

## Coverage against the goal

| Requirement | Where |
| --- | --- |
| User-selected mode: independent / client / sync | `Settings.mode`, `backend.ts` |
| Ciphertext-only on the wire | sealed-blob endpoints, `HttpVaultRepo` |
| Desktop client reuses SP4 service/merge | `ExtensionVaultService` over `HttpVaultRepo` |
| Background sync with merge | `SyncEngine` + `twofau_core::merge` |
| Pairing consent, revocable | `POST /pair`, paired list + revoke |
| Localhost hardening | origin pinning + Host check + bearer token |
| Zero host access preserved for independent mode | optional host permission |
| Desktop controls without polluting shared UI | `settingsSlot` + `<BridgeSettings>` |
