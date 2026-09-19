# shared-ui Specification

## Purpose

`@twofau/ui`, the React component package that renders the account list, add,
edit, unlock, and settings screens for every host. It talks only to the
`VaultService` port, so the same components run over Tauri IPC, direct WASM, or an
HTTP backend, and its layout is a 1:1 port of the original Swift menu-bar app.

## Requirements

### Requirement: Host-agnostic VaultService port

The UI SHALL NOT import Tauri APIs, `chrome.*`, or any host-specific module. All
I/O SHALL go through the `VaultService` interface in
`packages/ui/src/core/vault-service.ts`. Adding a UI feature that needs I/O SHALL
mean extending that interface and every implementation.

#### Scenario: Building the UI package standalone

- **WHEN** `@twofau/ui` is built or tested outside any host
- **THEN** it compiles and its tests pass against `MockVaultService` alone

#### Scenario: Extending the port

- **WHEN** a new operation is added to `VaultService`
- **THEN** the Tauri, extension, and mock implementations are all updated, and `pnpm -r typecheck` is what catches a missed one

### Requirement: Capability-gated host affordances

`VaultService.capabilities()` SHALL report `scanScreen`, `qrImage`, and `paste`,
and the UI SHALL hide any affordance the active host does not support while
keeping the position and icon of the ones it does.

#### Scenario: Host without screen capture

- **WHEN** `capabilities().scanScreen` is false
- **THEN** the QR-scan header action is not rendered and the remaining actions keep their positions

### Requirement: Layout parity with the original app

The root panel SHALL be 320px wide with inline navigation between the list, add,
and edit screens rather than modals. The list SHALL use 64px rows, cap at five
visible rows before scrolling, and render the search bar only when there are more
than five accounts.

#### Scenario: Small vault

- **WHEN** the vault holds five or fewer accounts
- **THEN** no search bar is rendered

#### Scenario: Empty vault

- **WHEN** the vault holds no accounts
- **THEN** the empty state is shown instead of the list

### Requirement: Shared countdown and code rendering

A single timer ring SHALL drive the countdown for all TOTP accounts, ticking once
per second. Codes SHALL be split in half with a space for readability and
rendered in a tabular monospaced face.

#### Scenario: Six-digit code

- **WHEN** a TOTP account's current code is `492810`
- **THEN** the row displays `492 810`

### Requirement: Copy feedback

Activating a row SHALL copy its current code through the injected clipboard and
flash the row green with a check for about one second. A row with no available
code SHALL copy nothing.

#### Scenario: Copying a code

- **WHEN** the user clicks an account row
- **THEN** the code is written to the clipboard and the row shows the copied state briefly

#### Scenario: Missing code

- **WHEN** a row has no computed code
- **THEN** the copy is a no-op and no success feedback is shown

### Requirement: Passphrase unlock screen

Because the cross-platform root of trust is a passphrase, the shared UI SHALL
provide an unlock screen with a single secret field and an inline error caption,
and a setup screen for a host reporting no existing vault.

#### Scenario: Wrong passphrase

- **WHEN** unlocking fails
- **THEN** the unlock screen shows the error and the vault stays locked

### Requirement: Host-provided settings slot

`TwoFAUApp` SHALL accept an optional `settingsSlot` and render the header gear
only when one is provided, so host-specific settings (such as the desktop bridge)
stay out of the shared package.

#### Scenario: Extension popup

- **WHEN** the host passes no `settingsSlot`
- **THEN** no gear is rendered and no host-specific settings code is bundled
