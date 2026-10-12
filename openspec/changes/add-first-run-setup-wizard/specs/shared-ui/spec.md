## MODIFIED Requirements

### Requirement: Passphrase unlock screen

Because the cross-platform root of trust is a passphrase, the shared UI SHALL
provide an unlock screen with a single secret field and an inline error caption.
For a host reporting no existing vault, the shared UI SHALL render the first-run
wizard, whose steps are driven by what the host declares it supports; the
passphrase-creation form is one of those steps, not the whole first-run screen.
The wizard SHALL stay host-agnostic: the steps that need host I/O (picking a
file, requesting a permission, pairing) SHALL run through the port, not through
host APIs imported into `@twofau/ui`.

#### Scenario: Wrong passphrase

- **WHEN** unlocking fails
- **THEN** the unlock screen shows the error and the vault stays locked

#### Scenario: No vault yet

- **WHEN** the host reports no existing vault
- **THEN** the wizard is rendered with the starting points that host declared, instead of the unlock screen

#### Scenario: Building the UI package standalone

- **WHEN** `@twofau/ui` is built or tested with only `MockVaultService`
- **THEN** the wizard compiles and its steps are exercisable without any host present
