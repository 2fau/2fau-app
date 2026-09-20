## Purpose

What a host puts in front of someone who has just installed 2FAU and has no
vault yet: the starting points it offers (create, import, connect to the
desktop), the order they run in, and what each one leaves behind.

## ADDED Requirements

### Requirement: First run offers every starting point the host supports

When a host reports no existing vault, the UI SHALL present the wizard rather
than a lone create-a-passphrase form. The wizard SHALL offer creating a new
vault, importing an existing vault file, and — where the host can reach a vault
elsewhere — connecting to it. A host SHALL declare which of these it supports,
and the wizard SHALL render only the declared ones, never a choice that cannot
complete on that host.

#### Scenario: Desktop first launch

- **WHEN** the desktop app launches with no vault at its vault path
- **THEN** the wizard offers creating a new vault and importing a vault file

#### Scenario: Extension first open

- **WHEN** the extension popup opens with no vault in storage
- **THEN** the wizard offers creating a new vault, importing a vault file, and connecting to the desktop app

#### Scenario: Host that cannot import

- **WHEN** a host declares no import support
- **THEN** the import choice is not rendered and the remaining choices are still complete on their own

### Requirement: Creating a new vault

The create path SHALL take a passphrase and its confirmation, SHALL enforce the
same minimum length the setup screen enforces today, and SHALL end with an empty
vault sealed under that passphrase and the session unlocked.

#### Scenario: Passphrase accepted

- **WHEN** a passphrase of at least the minimum length is entered and confirmed
- **THEN** an empty vault is created, the session is unlocked, and the account list is shown

#### Scenario: Passphrase rejected

- **WHEN** the passphrase is too short or the confirmation does not match
- **THEN** the step reports it inline and no vault is created

### Requirement: Importing adopts the file

The import path SHALL take a vault file and the passphrase that opens it, and
SHALL adopt that file as this device's vault: its accounts become the vault's
accounts and its passphrase becomes this device's passphrase. The user SHALL NOT
be asked to invent a second passphrase first. A failure SHALL leave the host with
no vault, still on the wizard, rather than a half-created one.

#### Scenario: Vault file from another device

- **WHEN** a vault exported from another device is imported with its passphrase
- **THEN** the same accounts are present, the session is unlocked, and that passphrase unlocks this device from then on

#### Scenario: Wrong passphrase for the file

- **WHEN** the passphrase does not open the chosen file
- **THEN** the step shows the error, no vault exists, and the user can retry or pick a different starting point

#### Scenario: Unreadable or foreign file

- **WHEN** the chosen file is not a 2FAU vault blob
- **THEN** the step reports it as an unusable file, distinctly from a wrong passphrase

#### Scenario: Import cancelled

- **WHEN** the user dismisses the file picker without choosing a file
- **THEN** the wizard returns to its choices unchanged

### Requirement: Connecting the extension to the desktop

The extension's connect path SHALL request the optional host permission, pair
with the desktop using a code shown by the desktop app, and have the user choose
whether the desktop holds the only vault or this browser keeps a synced copy.
The chosen mode SHALL be persisted before a backend is built, so the first screen
after the wizard already talks to the chosen backend. Declining the permission,
or failing to pair, SHALL leave the extension with no vault and no mode change,
back on the wizard's choices.

#### Scenario: Pairing succeeds

- **WHEN** a valid pairing code is entered and a mode is chosen
- **THEN** the mode is saved, the pairing token is stored, and the popup opens against the desktop vault

#### Scenario: Permission declined

- **WHEN** the user declines the loopback host permission
- **THEN** no pairing is attempted, the mode stays unset, and the wizard explains that connecting needs that permission

#### Scenario: Desktop not reachable

- **WHEN** the desktop app is not running or its bridge is off
- **THEN** the step says so and offers the other starting points, rather than leaving the extension in a mode it cannot serve

#### Scenario: Browser keeps a copy

- **WHEN** the user chooses to keep a synced copy in this browser
- **THEN** the desktop vault's passphrase is what unlocks the browser copy, because both are the same sealed blob

### Requirement: Desktop offers to connect a browser after the vault exists

Once the desktop wizard has created or imported a vault, it SHALL offer one more
optional step that enables the bridge and shows a pairing code. That step SHALL
be skippable, and skipping it SHALL leave the bridge off and no port listening.
The step SHALL NOT be presented as an alternative to having a vault.

#### Scenario: User connects a browser

- **WHEN** the user continues into the connect step
- **THEN** the bridge is enabled and a pairing code is displayed for the extension to consume

#### Scenario: User skips

- **WHEN** the user skips the connect step
- **THEN** the app proceeds to the account list, the bridge is off, nothing is listening, and the same setup remains available in Settings

### Requirement: The wizard is first-run only

The wizard SHALL appear only while the host reports no vault, and SHALL never
stand between an existing vault and its unlock screen. It SHALL NOT be reachable
from Settings; every choice it makes SHALL remain editable there afterwards. A
wizard abandoned before a vault exists SHALL leave nothing behind, so the next
launch starts it again from the choices. Once a vault exists the wizard is done:
any step still outstanding SHALL be reachable in Settings instead.

#### Scenario: Vault already exists

- **WHEN** a host with a vault starts
- **THEN** the unlock screen is shown and the wizard is not rendered

#### Scenario: Abandoned before a vault exists

- **WHEN** the app or popup is closed while still choosing, creating, or importing
- **THEN** no vault, mode, or pairing is left behind and the next start shows the choices again

#### Scenario: Abandoned after the vault exists

- **WHEN** the desktop app is closed during the optional connect step
- **THEN** the next launch goes to unlock, not back into the wizard, and the bridge setup waits in Settings

#### Scenario: Changing a choice later

- **WHEN** the user later wants a different mode, another import, or to pair a second browser
- **THEN** they do it in Settings, which offers all of it without the wizard
