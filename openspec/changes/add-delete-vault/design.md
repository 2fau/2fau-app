## Context

See proposal.md — Why. What shapes the approach:

- `SettingsBackend` (`packages/ui/src/core/settings.ts`) is how every settings
  operation reaches a host; it already carries `changePassphrase(current, next)`,
  which is the precedent for "an operation the host authorizes with the current
  passphrase".
- Desktop deletion has three pieces of state: `vault.dat`, the sibling `.rev`
  file `AppVault` keeps the revision in, and the keyring entry. `keyring_delete`
  already exists.
- The extension's blob is chunked as `v{revision}.chunk.{n}` under a
  `vault.manifest` record, in `chrome.storage.sync` or `.local` depending on the
  storage-area setting, and `VaultRepo` also mirrors the last-known-good blob in
  `chrome.storage.local` under `vault.mirror`. A read falls back to that mirror
  when a chunk is missing — exactly the behavior that would resurrect a
  half-deleted vault.
- `RootView` shows the wizard when the service reports `needsSetup()`, so a host
  that reports "no vault" after deletion lands on the wizard with no extra work.

## Goals / Non-Goals

**Goals:**

- One deletion path per host that leaves nothing behind that could unlock or
  restore the vault.
- Deleting is authorized by the passphrase, not by being in front of an unlocked
  app.

**Non-Goals:**

- Deleting a *remote* vault: neither host reaches across the bridge to delete the
  other's.
- A recovery or undo path. Export exists for that, and the confirmation says so.
- Wiping preferences. That is a different feature ("reset everything") and is not
  what was asked for.

## Decisions

**Deletion goes on `SettingsBackend`, not `VaultService`.** It is a settings
action with a host-shaped implementation, and `changePassphrase` already lives
there with the same "verify the current passphrase, then act" shape. Putting it
on `VaultService` would oblige `MockVaultService` and every screen's contract to
carry an operation only one screen ever calls. The field is optional, so a host
that cannot offer it (the extension in `client` mode) simply omits it and the row
disappears — which is also how the spec's "offered only where the vault lives"
requirement is satisfied, with no mode knowledge in `@twofau/ui`.

**The passphrase is verified by the host, against the stored blob.** Desktop
compares against the vault it can open; the extension derives a key from the
blob's own salt and opens it. Neither trusts an unlocked session: the vault can
be unlocked and still require the passphrase, which is the point of the gate.

**Desktop deletes file, revision marker, in-memory document, and keyring
entry — in that order, keyring last.** If the process dies mid-way, the worst
state is a keyring entry with no vault, which `unlock` ignores on first run,
rather than a vault whose passphrase was just forgotten.

**The extension deletes through `VaultRepo`, which owns the key layout.** The
repo is the only place that knows chunk names, the manifest, and the mirror; a
`wipe()` there keeps that knowledge in one file instead of spreading storage keys
into the options page. Order: mirror first, then chunks, then the manifest last —
the manifest is the commit point, so a torn wipe leaves a manifest pointing at
missing chunks with no mirror to fall back on, which reads as an absent vault
rather than a restored one.

**Sync mode drops back to `independent` on delete.** Otherwise the next
reconcile pass pulls the desktop vault straight back and the action looks broken.
The pairing is left in place, so re-enabling sync is one click. This is the only
setting deletion touches, and the confirmation screen says it.

**No "delete" in `client` mode.** There is no local vault to delete, and deleting
the desktop's over the bridge is a different, more dangerous feature. The Sync
screen already explains where the vault lives.

## Risks / Trade-offs

- Someone who deletes without an export loses every account → the confirmation
  names the account count and says it cannot be undone; Export Vault sits in the
  same settings screen.
- A wiped `chrome.storage.sync` vault propagates the deletion to the user's other
  Chrome profiles → that is what `sync` storage means, and it is the same
  propagation any vault edit has; the confirmation says the copy is removed from
  this browser's storage.
- The keyring entry is deleted last, so a crash between the file and the keyring
  leaves a stale credential → harmless: with no vault, `unlock` creates a new one
  and overwrites it, and `try_auto_unlock` reports that it did not unlock.
- A second context (service worker, another popup) may hold a decrypted copy in
  memory at the moment of deletion → the session key is cleared as part of the
  wipe, so the next operation in that context fails its key read and re-locks.

## Migration Plan

Nothing to migrate; the action is additive and does nothing until invoked.
Rollback is removing the backend field and its two host implementations — no data
shape changes, so a vault written before or after is identical.
