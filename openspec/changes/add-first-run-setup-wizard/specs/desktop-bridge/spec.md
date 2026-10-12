## ADDED Requirements

### Requirement: Pairing has a first-run entry point on both sides

The desktop SHALL be able to enable the bridge and show a pairing code from its
first-run wizard, and the extension SHALL be able to request the optional host
permission, submit a code, and select its mode from its own first-run wizard —
neither side requiring a trip through Settings to pair a first browser. These
entry points SHALL reuse the existing pairing rules unchanged: the same
short-lived code, the same token bound to the extension origin, the same paired
list and revocation.

#### Scenario: Pairing from the two wizards

- **WHEN** the desktop wizard shows a code and the extension wizard submits it
- **THEN** a token is minted exactly as it would be from Settings, and the browser appears in the paired list

#### Scenario: Expired code in the wizard

- **WHEN** the code shown by the desktop wizard is submitted after its validity window
- **THEN** pairing fails with `401`, no token is minted, and the extension wizard offers a retry

#### Scenario: Bridge stays off when unused

- **WHEN** the desktop wizard's connect step is skipped
- **THEN** the bridge remains disabled and no port is listening, exactly as on an install that never opened the wizard's connect step
