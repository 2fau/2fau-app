# Roadmap

The rewrite is split into six sub-projects, built in order. Each shipped one behind a design
spec; those are now maintained as capability specs in `openspec/specs/`.

| #   | Sub-project                                                               | Status   | Spec                               |
| --- | ------------------------------------------------------------------------- | -------- | ---------------------------------- |
| SP0 | Monorepo scaffold + shared Rust core (OTP, base32, otpauth, model, merge) | **done** | `openspec/specs/otp-core/`         |
| SP1 | Crypto + storage (PBKDF2 → AES-GCM vault blob, `VaultStore`)              | **done** | `openspec/specs/vault-crypto/`     |
| SP2 | Shared React UI (`@twofau/ui`, `VaultService` port, Storybook)            | **done** | `openspec/specs/shared-ui/`        |
| SP3 | Tauri desktop app (tray, popup, keyring, setup/unlock)                    | **done** | `openspec/specs/desktop-app/`      |
| SP4 | Chrome extension (MV3), full parity, `chrome.storage` backend             | **done** | `openspec/specs/chrome-extension/` |
| SP5 | Desktop localhost bridge + sync (independent / client / sync modes)       | **done** | `openspec/specs/desktop-bridge/`   |

## SP4 — Chrome extension (done)

Standalone MV3 extension reusing `@twofau/ui` unchanged, with a third `VaultService` over the
WASM core and `chrome.storage`. Full spec: `openspec/specs/chrome-extension/spec.md`.

Shape, in one paragraph: the vault is the same sealed blob format as `vault.dat`, chunked
across `chrome.storage.sync` behind a manifest that acts as the commit point, with a revision
guard that runs `twofau_core::merge` only when a concurrent write beat us. The derived key
(not the passphrase) sits in `chrome.storage.session`, cleared by a `chrome.alarms` auto-lock.
Surfaces: popup, options page, a context menu that copies codes for the five most recent
accounts via an offscreen document, a keyboard shortcut, and QR capture from the current tab.
No content script and no host permissions.

`createVaultService()` is the seam SP5 plugs the desktop bridge into.

## SP5 — sync

Desktop hosts a localhost HTTP server on a configured port; the extension can be pointed at
it instead of `chrome.storage`. Bidirectional sync uses `twofau-core::merge` (newest-wins +
tombstones), the same algorithm the Swift app uses, so all three can interoperate.

## Known debt

- Desktop bundle carries an unused ~600 KB WASM blob (see `DEVELOPMENT.md § Traps`).
- Continuous release runs in parallel with CI rather than gating on it.
- No code signing for Windows/macOS installers.
- No end-to-end test that drives the actual tray popup.
