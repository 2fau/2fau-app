## 1. Shared UI: the danger-zone row and its confirmation

- [x] 1.1 Add an optional `deleteVault?: (passphrase: string) => Promise<void>` to `SettingsBackend` in `packages/ui/src/core/settings.ts`. Verify `pnpm -r typecheck` passes with no host implementing it yet (it is optional).
- [x] 1.2 Add a destructive "Delete Vault" row to `SettingsView`, rendered only when the backend supplies `deleteVault`, visually separated from the ordinary rows. Verify a Vitest case for each: a backend with the field renders the row, one without renders no row and leaves the rest of the screen unchanged.
- [x] 1.3 Add the confirmation sub-screen: what is lost, a passphrase field, and a destructive submit. Verify Vitest cases — a correct passphrase calls `deleteVault` with it, a rejected one shows the error and leaves the screen open, backing out calls nothing.
- [x] 1.4 Wrap every new string in `t()` and re-extract the `ui` catalog (`node scripts/extract-i18n.mjs --namespace ui --dir packages/ui/src --dir apps/twofau-app/src --dir apps/twofau-extension/src`). Verify `node scripts/check-i18n.mjs` reports the locales in sync.

## 2. Desktop: delete the vault and its keyring entry

- [x] 2.1 Add an `AppVault::delete_vault(passphrase)` that verifies the passphrase against the stored blob, removes `vault.dat` and its `.rev` sibling, clears the in-memory `Unlocked` state, and deletes the keyring entry last. Verify Rust tests: deleting leaves `has_vault()` false and a reopened `AppVault` reporting first run; a wrong passphrase leaves file, revision, and state intact.
- [x] 2.2 Verify with a Rust test that deletion works from a locked vault (the passphrase authorizes it) and that the revision counter restarts for the next vault rather than resuming the deleted one's.
- [x] 2.3 Expose the Tauri command and wire `deleteVault` in `apps/twofau-app/src/settings-backend.tsx`. Verify `cargo test` passes and the settings screen shows the row in the desktop app.

## 3. Extension: wipe every copy

- [x] 3.1 Add `VaultRepo.wipe()` that removes the mirror, then every chunk named by the manifest (and any stale generation), then the manifest itself. Verify a Vitest case that after a wipe `hasVault()` is false, `load()` returns null, and no fallback to the mirror occurs.
- [x] 3.2 Add `ExtensionVaultService.deleteVault(passphrase)`: derive the key from the stored blob's salt, refuse a passphrase that does not open it, then wipe the repo, clear the session key, and drop the cached document. Verify Vitest cases for success and for a wrong passphrase leaving everything in place.
- [x] 3.3 In `sync` mode, deletion also writes `mode: "independent"`, keeping the pairing. Verify a Vitest case asserting the mode after deletion and that the pairing token is still present.
- [x] 3.4 Wire `deleteVault` into the options page's `SettingsBackend`, omitting the field entirely in `client` mode. Verify a Vitest case (or a direct assertion on the backend object) that the field is absent in `client` mode and present in the other two.

## 4. Verification

- [x] 4.1 Run the full gate: `cargo fmt --check && cargo clippy --all-targets -D warnings && cargo test && pnpm -r test && pnpm -r typecheck`. Note pre-existing lint drift separately from this change.
- [ ] 4.2 Verify the round trip on both hosts by hand: delete with the wrong passphrase (refused), delete with the right one, confirm the app lands on the first-run wizard, and confirm that creating a new vault asks for a passphrase rather than auto-unlocking with the old one. Report the desktop tray/popup parts as human-verified.
- [x] 4.3 Verify the untouched paths: export still works, change-passphrase still works, paired browsers survive a deletion, and an extension in `client` mode never shows the row.
