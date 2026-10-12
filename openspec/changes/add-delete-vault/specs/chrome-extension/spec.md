## ADDED Requirements

### Requirement: Deleting the extension vault leaves nothing to resurrect

Deleting the vault SHALL verify the supplied passphrase against the stored blob,
then remove every chunk of every generation, the `vault.manifest` record, the
last-known-good mirror in `chrome.storage.local`, and the session key. A read
after deletion SHALL report no vault rather than falling back to the mirror. A
wrong passphrase SHALL delete nothing. Auto-lock, storage area, locale, hotkeys,
and the bridge pairing SHALL be untouched.

#### Scenario: Deleting and reopening the popup

- **WHEN** the vault is deleted and the popup is reopened
- **THEN** the extension reports no vault and shows the first-run wizard, with no fallback to the mirrored blob

#### Scenario: Wrong passphrase

- **WHEN** deletion is attempted with a passphrase that does not open the stored blob
- **THEN** it is refused and the manifest, chunks, and mirror survive

#### Scenario: Another context is open

- **WHEN** the service worker or options page reads the vault after a deletion
- **THEN** it observes an absent vault and a cleared session key, not a stale unlocked state

### Requirement: Deletion follows where the vault lives

The delete action SHALL be offered only when this browser holds the vault it
would delete. In `client` mode it SHALL NOT be offered, and the UI SHALL say the
vault lives in the desktop app. In `sync` mode deleting SHALL remove only this
browser's copy, leave the desktop vault alone, and return this browser to
`independent` mode so a background reconcile does not pull the vault back; the
pairing SHALL be kept.

#### Scenario: Client mode

- **WHEN** the extension is in `client` mode
- **THEN** no delete action is offered, because the vault shown is the desktop's

#### Scenario: Sync mode

- **WHEN** the vault is deleted in `sync` mode
- **THEN** the local copy is gone, the desktop vault is unchanged, the browser is back in `independent` mode, and no reconcile restores the deleted copy
