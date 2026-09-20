## 1. Shared UI: the wizard shell

- [x] 1.1 Add the `SetupBackend` type in `packages/ui/src/core/` — optional `adopt?: ImportSpec` and `connect?: { screen: ReactNode; optional: boolean }`, with create implied — and thread it through `TwoFAUApp`/`RootView` as an optional prop. Verify `pnpm -r typecheck` passes with no host updated yet.
- [x] 1.2 Add the wizard component that renders the choices present in the backend and routes to a step; render it from `RootView` in place of `SetupView` when `needsSetup` is true. Verify a Vitest case: with no backend passed, the wizard shows only the create choice and behaves exactly as today's setup screen.
- [x] 1.3 Move the existing `SetupView` form in as the create step, unchanged in validation and in its `unlock()` call. Verify `setup-view.test.tsx` still passes (adapted to its new mount point) and a too-short passphrase still creates nothing.
- [x] 1.4 Add the import step over `ImportSpec` (both `native` and `file` kinds) with distinct inline errors for a wrong passphrase and an unusable file. Verify Vitest cases for success, wrong passphrase, unreadable file, and a cancelled picker — each asserting no vault is left behind on failure.
- [x] 1.5 Render `connect.screen` as a step and handle its skip. Verify a Vitest case that the wizard finishes when the step is skipped and reports completion when it is not.
- [x] 1.6 Wrap every new user-facing string in `t()` and add the English entries to the `ui` catalog. Verify `pnpm -r test` passes and no literal string reaches the rendered output untranslated.

## 2. Desktop: adopt an imported vault

- [x] 2.1 Add an `AppVault` method that adopts a blob when no vault exists: open it with the supplied passphrase, write those bytes to the vault path, unlock. Verify a Rust test that adopting a vault exported elsewhere yields its accounts and that its own passphrase unlocks a reopened `AppVault`.
- [x] 2.2 Make adoption refuse when a vault already exists, with a distinct error. Verify a Rust test asserting the existing vault is untouched.
- [x] 2.3 Expose the Tauri command (file picker + adopt, guarded by `DialogGuard` like the other dialog commands) and wire it as the desktop's `adopt: { kind: "native" }`. Verify `cargo test` passes and the popup does not hide while the picker is up (interactive check — report it as such).

## 3. Desktop: the wizard

- [x] 3.1 Supply `setupBackend` from the desktop host with the native adopt spec and a connect step reusing the existing bridge-enable and pairing-code commands. Verify the wizard on a fresh profile offers create and import, and the connect step appears only after the vault exists.
- [x] 3.2 Verify skipping the connect step leaves the bridge disabled and nothing listening (check no socket on the configured port after the wizard closes).
- [ ] 3.3 Verify a human run on a fresh profile: create → list, import → list, connect → code shown and consumable. Report the tray/popup parts as human-verified, never as headlessly confirmed.

## 4. Extension: adopt and connect before a backend exists

- [x] 4.1 Add the adopt path to the extension vault layer: verify the uploaded blob opens with the passphrase, write it as the first generation through the repo, put the derived key in session storage. Verify a Vitest case that a desktop-exported blob adopts and lists its accounts.
- [x] 4.2 Change the popup bootstrap to detect no vault and no pairing token and render the wizard without calling `createVaultService()`. Verify an existing install (vault present) never reaches the wizard, and that a fresh one does not render `DesktopUnavailable`.
- [x] 4.3 Build the connect step: request the optional `http://127.0.0.1/*` permission, submit the pairing code, choose the mode, and persist the mode before any backend is built. Verify Vitest cases for a declined permission, an unreachable desktop, and an expired code — each leaving no vault and no mode change.
- [x] 4.4 Re-bootstrap the popup once a step completes, so the first screen after the wizard talks to the chosen backend. Verify by asserting the service built after a `client`-mode wizard run is the HTTP-backed one.

## 5. Verification

- [x] 5.1 Run the full gate: `cargo fmt --check && cargo clippy --all-targets -D warnings && cargo test && pnpm -r test && pnpm -r typecheck`. Note any pre-existing lint drift on `main` separately from this change.
- [ ] 5.2 Verify the end-to-end pairing story across both wizards on a real machine: desktop wizard creates a vault and shows a code, extension wizard consumes it, popup opens against the desktop vault.
- [x] 5.3 Verify the untouched paths still work: Settings → import still merges into an unlocked vault, Settings → Sync still changes mode and re-pairs, and an existing install upgrades straight to its unlock screen.
