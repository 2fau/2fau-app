## Why

There is no way to get rid of a vault from inside 2FAU. Someone who forgot the
passphrase, wants to hand the machine on, or wants to start over from a file has
to know where the app keeps its bytes — `app_data_dir()/vault.dat` on desktop, a
chunked blob plus a mirror across `chrome.storage` in the extension — and delete
them by hand. Miss the keyring entry and the next vault silently auto-unlocks
with the old passphrase; miss the mirror and the extension resurrects a vault
that was supposed to be gone.

The first-run wizard makes this worse in a good way: now that a fresh install
offers create / import / connect, "start over" is a real thing to want, and the
only thing standing in the way is the vault that is already there.

## What Changes

- Both hosts gain a **Delete vault** action in Settings, visually separated as a
  destructive action rather than sitting among the ordinary rows.
- Deleting requires the **current passphrase**. A wrong one refuses and deletes
  nothing — an unlocked app left on a desk cannot be wiped by a passer-by.
- Deleting removes the vault **and the secrets that unlock it**: the blob (every
  chunk, the manifest, and the local mirror in the extension), plus the keyring
  passphrase on desktop and the session key in the extension.
- Preferences survive: auto-lock, locale, hotkeys, storage area, launch-on-login,
  and the desktop's paired browsers stay as they were.
- Afterwards the host reports no vault, so the app lands on the first-run wizard
  with its full set of starting points.

## Capabilities

### New Capabilities

<!-- None: this extends capabilities that already exist. -->

### Modified Capabilities

- `shared-ui`: the settings screen gains the destructive delete action and its
  passphrase confirmation, driven through the host backend like every other
  settings operation.
- `desktop-app`: deleting removes the vault file and the keyring passphrase, so
  `try_auto_unlock` cannot silently unlock whatever is created next.
- `chrome-extension`: deleting removes every chunk, the manifest, the local
  mirror, and the session key, and it is unavailable in `client` mode, where the
  vault this browser shows is not its own.

`vault-crypto` needs no delta: deletion is a host storage operation and changes
nothing about the blob format or key derivation.

## Impact

- `packages/ui/src/core/settings.ts` — `SettingsBackend` gains a delete
  operation; extending it means updating the desktop, extension, and test
  implementations together (`pnpm -r typecheck` is what catches a missed one).
- `packages/ui/src/components/settings-view.tsx` — a danger-zone row and its
  confirmation sub-screen.
- `apps/twofau-app` — a Tauri command over `AppVault`; `keyring_delete` already
  exists and is currently only used when locking with "forget me".
- `apps/twofau-extension` — a repo-level wipe (`VaultRepo` knows the chunk key
  layout and the mirror) plus `clearSessionKey`; the options page wires it.
- No change to the vault format, the bridge protocol, or the desktop's paired
  browser list.

## Assumption recorded

In the extension's `client` mode the vault lives in the desktop app, so the
delete action is not offered there; the UI points at the desktop app instead.

In `sync` mode deleting removes only this browser's copy and leaves the desktop
vault alone — but a background reconcile would pull it straight back, so
deleting there also returns the browser to `independent` mode. The pairing is
kept, so turning sync back on is one click. This is the one setting deletion
touches, and it is the difference between the action working and appearing to do
nothing.
