# desktop-app Specification

## Purpose

The Tauri 2 desktop app (`apps/twofau-app`, bundle id `dev.artkost.2fau`): a
tray-toggled menu-bar agent whose webview mounts `@twofau/ui` over a Rust-owned
encrypted vault, on macOS, Windows, and Linux.

## Requirements

### Requirement: Rust owns secrets and codes

The vault SHALL be decrypted and OTP codes SHALL be computed in the Rust process.
The webview SHALL receive account metadata and the current code string only, and
SHALL never see a secret. `code(id, unix_ms)` SHALL be a Tauri command.

#### Scenario: Rendering the list

- **WHEN** the frontend needs a code for an account
- **THEN** it invokes the `code` command with the account id and receives only the resulting string

#### Scenario: Frontend has no crypto path

- **WHEN** the desktop webview runs
- **THEN** it never initializes the WASM core, which is the native path's whole point

### Requirement: Vault path

The desktop vault SHALL live at `app_data_dir()/vault.dat` for bundle id
`dev.artkost.2fau`, never at the legacy Swift app's location.

#### Scenario: Colliding with the legacy app

- **WHEN** a path resolves to the Swift app's support directory
- **THEN** that is a defect: the two blobs share a magic but diverge after byte 5, surfacing as "unknown KDF id 0"

### Requirement: Keyring-cached passphrase

`unlock(passphrase, remember)` SHALL optionally store the passphrase in the OS
keyring (macOS Keychain, Windows Credential Manager, libsecret), and
`try_auto_unlock()` SHALL silently unlock on launch when one is stored.

#### Scenario: First launch

- **WHEN** no passphrase is in the keyring
- **THEN** `try_auto_unlock` reports that it did not unlock and the UI shows setup or unlock

#### Scenario: Later launches

- **WHEN** the user chose to be remembered
- **THEN** the app unlocks without prompting

### Requirement: Re-seal on every mutation

Every vault mutation SHALL re-seal the document with a freshly generated salt and
nonce and persist it through the store before reporting success.

#### Scenario: Adding an account

- **WHEN** an account is added and the app is relaunched
- **THEN** the account is present, sealed under a new salt and nonce

### Requirement: Menu-bar agent window behavior

The app SHALL run as an accessory agent with no Dock or taskbar entry. The tray
icon SHALL toggle a frameless, transparent, always-on-top popup anchored at the
tray, and the window SHALL hide when it loses focus. The window SHALL be hidden
and reshown, never rebuilt, and SHALL resize to its content height.

#### Scenario: Clicking the tray icon

- **WHEN** the popup is hidden and the tray icon is clicked
- **THEN** the popup is shown, positioned at the tray, and focused; clicking again hides it

#### Scenario: Native file dialog open

- **WHEN** a native file dialog takes focus during import or export
- **THEN** the popup does not hide out from under it

#### Scenario: Interactive verification

- **WHEN** tray and popup behavior is changed
- **THEN** it is verified by a human running the app, and is never reported as headlessly confirmed
