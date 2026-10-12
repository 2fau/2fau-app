## ADDED Requirements

### Requirement: Deleting the desktop vault clears its unlock secrets

Deleting the vault SHALL verify the supplied passphrase against the current
vault, then remove the vault file and its revision marker, drop the decrypted
document from memory, and delete the keyring passphrase, so `try_auto_unlock`
cannot silently open whatever vault is created next. A wrong passphrase SHALL
delete nothing. Settings, hotkeys, launch-on-login, and the bridge's paired
browsers SHALL be untouched.

#### Scenario: Deleting and relaunching

- **WHEN** the vault is deleted and the app is relaunched
- **THEN** no vault exists, nothing auto-unlocks, and the first-run wizard is shown

#### Scenario: Wrong passphrase

- **WHEN** deletion is attempted with a passphrase that does not open the vault
- **THEN** it is refused and the vault file, the revision marker, and the keyring entry all survive

#### Scenario: Locked vault

- **WHEN** deletion is attempted while the vault is locked
- **THEN** the passphrase is still what authorizes it, and a correct one deletes the vault without unlocking it first

#### Scenario: Bridge left running

- **WHEN** the bridge is enabled and the vault is deleted
- **THEN** the paired browsers remain paired, and the bridge answers as it does for a desktop that has no vault yet
