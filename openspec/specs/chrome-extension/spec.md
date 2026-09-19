# chrome-extension Specification

## Purpose

The Manifest V3 browser extension (`apps/twofau-extension`) with full desktop
parity: it reuses `@twofau/ui` unchanged over the Rust core compiled to WASM, and
keeps its vault as the same sealed blob the desktop writes, chunked across
`chrome.storage`.

## Requirements

### Requirement: Byte-compatible vault blob

The extension SHALL seal its vault with exactly the header and layout the desktop
writes, so encrypted export/import and the desktop bridge are byte-compatible in
both directions.

#### Scenario: Importing a desktop vault

- **WHEN** a `vault.dat` blob exported from the desktop is imported
- **THEN** it opens with the same passphrase and yields the same accounts

### Requirement: Chunked storage with a manifest commit point

The sealed blob SHALL be stored as base64 chunks of at most 6 KB under
`v{revision}.chunk.{n}`, described by a `vault.manifest` record holding
`{ version, revision, chunks, salt, kdfId }`. A write SHALL put the new
generation's chunks first, then the manifest, then delete the previous
generation's chunks.

#### Scenario: Concurrent reader during a write

- **WHEN** a read happens mid-write
- **THEN** it sees either the old manifest with the intact old generation or the new manifest with the intact new one, never a mix

#### Scenario: Torn remote write

- **WHEN** a chunk named by the manifest is missing
- **THEN** the read falls back to the last-known-good blob mirrored in `chrome.storage.local` instead of reporting an empty vault

### Requirement: Revision guard on commit

Immediately before committing, the writer SHALL re-read `vault.manifest`. If its
revision advanced past the one the write was derived from, the writer SHALL
decrypt the remote blob, `merge` it with the local document, and commit the merged
result at `remote.revision + 1`; otherwise it SHALL commit at
`loaded.revision + 1`.

#### Scenario: Two browsers editing concurrently

- **WHEN** another browser committed since this write was derived
- **THEN** both sets of changes survive the merge and neither vault is erased

### Requirement: Quota refusal leaves the vault intact

A write that would exceed the storage quota SHALL be refused with a distinct
error, leaving the existing vault untouched, and usage SHALL be surfaced in the
options page.

#### Scenario: Oversized vault

- **WHEN** a save would exceed `QUOTA_BYTES`
- **THEN** the write is refused, the stored vault is unchanged, and the UI shows the quota error

### Requirement: Session-held derived key and auto-lock

The derived key — not the passphrase — SHALL be held in
`chrome.storage.session`, read per operation by every context that needs it, and
never persisted to `local` or `sync`. Decrypted accounts SHALL never be
persisted. A `chrome.alarms` auto-lock (default 15 minutes, configurable) SHALL
remove the session key, and any vault operation SHALL reschedule it.

#### Scenario: Service worker restart

- **WHEN** the service worker is torn down and restarted while unlocked
- **THEN** the next operation reads the key from session storage and succeeds without re-deriving it

#### Scenario: Auto-lock fires

- **WHEN** the auto-lock alarm fires
- **THEN** the session key is removed and `isLocked()` reports true

### Requirement: Minimal permissions

The extension SHALL declare `storage`, `contextMenus`, `offscreen`, `activeTab`,
and `alarms`, plus `commands._execute_action`, and SHALL ship no content script
and no install-time host permission.

#### Scenario: A feature would need host access

- **WHEN** a feature cannot work without a host permission or a content script
- **THEN** the feature is dropped or deferred rather than the permissions widened

### Requirement: Context menu copies codes

A parent "2FAU" menu SHALL list up to five recently used accounts titled
`issuer — label`. Titles SHALL never contain codes. Activating one SHALL have the
service worker read the session key, decrypt, compute the current code, and copy
it through an offscreen document, which works on `chrome://` pages and PDFs
without host permissions. While locked, the submenu SHALL hold a single disabled
"Locked — open 2FAU" item.

#### Scenario: Copying from a chrome:// page

- **WHEN** a menu item is activated on a `chrome://` page
- **THEN** the code reaches the clipboard via the offscreen document

#### Scenario: Locked vault

- **WHEN** the vault is locked
- **THEN** the item is disabled and its handler re-checks and no-ops

### Requirement: Failures are never a silent empty vault

If the WASM core fails to initialize, the popup SHALL show a hard error rather
than an empty account list.

#### Scenario: WASM init failure

- **WHEN** the WASM module cannot load
- **THEN** the popup renders an error state, not an empty vault

### Requirement: Backend seam

`createVaultService()` SHALL be the single place that decides which backend the
extension runs on, so the popup and options page only ever see a `VaultService`.

#### Scenario: Adding a backend

- **WHEN** a new backend such as the desktop bridge is introduced
- **THEN** only `createVaultService()` changes and no surface knows which backend it has
