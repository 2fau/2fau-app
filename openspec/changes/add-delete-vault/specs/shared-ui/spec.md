## ADDED Requirements

### Requirement: Deleting the vault from settings

The settings screen SHALL offer a delete-vault action, separated from the
ordinary rows as a destructive action, and SHALL render it only for a host that
supplies one. Activating it SHALL open a confirmation screen that states what is
lost and requires the vault's current passphrase; nothing SHALL be deleted until
that passphrase is submitted and accepted. The shared UI SHALL reach the host's
deletion through the settings backend, never through a host API of its own.

#### Scenario: Confirming with the right passphrase

- **WHEN** the user submits the current passphrase on the confirmation screen
- **THEN** the host deletes the vault and the UI returns to the first-run wizard, because the host now reports no vault

#### Scenario: Wrong passphrase

- **WHEN** the submitted passphrase is not the vault's
- **THEN** the screen shows the error, the vault still exists, and the user can retry or back out

#### Scenario: Backing out

- **WHEN** the user leaves the confirmation screen without submitting
- **THEN** nothing is deleted

#### Scenario: Host that does not offer deletion

- **WHEN** the host supplies no delete operation
- **THEN** no delete row is rendered and the rest of the settings screen is unchanged

#### Scenario: Deletion fails

- **WHEN** the host reports that deletion failed
- **THEN** the error is shown on the confirmation screen rather than the UI claiming success
