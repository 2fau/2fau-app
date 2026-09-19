# hotkeys Specification

## Purpose

Keyboard access to the vault: a global shortcut that summons the popup and drops
focus into search, quick-copy shortcuts for the first five displayed accounts, and
the Settings screen that lets the user rebind them.

## Requirements

### Requirement: Quick-copy the first five displayed accounts

While the list screen is mounted, the configured modifier plus `Digit1`–`Digit5`
SHALL copy the code of the Nth account _as displayed_ — honoring the current
search filter and ordering — then flash that row green for about 600 ms and
dismiss the popup. Matching SHALL use `e.code` so it is keyboard-layout
independent.

#### Scenario: Copying the top account

- **WHEN** the user presses the quick-copy modifier with `Digit1`
- **THEN** the first displayed account's code is copied, its row flashes, and the popup closes

#### Scenario: Filtered list

- **WHEN** a search filter is active
- **THEN** the digits address the filtered order, not the unfiltered one

#### Scenario: Digit beyond the list

- **WHEN** the digit exceeds the number of displayed accounts, or the account has no code
- **THEN** nothing is copied and the popup stays open

#### Scenario: Another screen is showing

- **WHEN** the unlock, setup, add, edit, or settings screen is showing
- **THEN** the handler does not exist and the keys are inert

### Requirement: Discoverable hotkey hints

The first five rows SHALL render a subtle keyboard hint showing the configured
modifier and the row's index, and the hint SHALL be hidden when quick-copy is
disabled.

#### Scenario: Custom modifier configured

- **WHEN** the user sets the quick-copy modifier to something other than the default
- **THEN** the row hints show the configured modifier

### Requirement: Summon focuses search

Summoning the popup SHALL focus the search input when it is rendered. The
extension popup mounts fresh on each open and SHALL rely on autofocus; the desktop
window is reshown rather than remounted and SHALL re-focus search on each
window-focus event.

#### Scenario: Desktop summon

- **WHEN** the desktop window is summoned by shortcut or tray
- **THEN** focus lands in the search box without a remount

#### Scenario: Fewer than six accounts

- **WHEN** no search box is rendered
- **THEN** summoning simply shows the popup with nothing focused

### Requirement: Desktop global summon shortcut is rebindable

The desktop SHALL register a global shortcut, default `CmdOrCtrl+Shift+U`,
persisted beside the vault, and SHALL expose commands to read and set it. On a
parse or OS registration failure the command SHALL return the error message, the
previous binding SHALL stay registered, and the new value SHALL NOT be persisted.

#### Scenario: Rebinding succeeds

- **WHEN** the user records a valid chord in Settings
- **THEN** the old shortcut is unregistered, the new one is registered and persisted, and it summons the popup

#### Scenario: Combination already taken

- **WHEN** the OS refuses the requested combination
- **THEN** Settings shows the error and the prior shortcut keeps working

### Requirement: Extension summon shortcut is browser-owned

The extension summon SHALL be the manifest `_execute_action` command. Because it
cannot be rebound programmatically, Settings SHALL display the current binding
read from `chrome.commands.getAll()` — or "Not set" — and offer a row that opens
the browser's own shortcuts page.

#### Scenario: User cleared the shortcut

- **WHEN** `chrome.commands.getAll()` reports an empty shortcut
- **THEN** Settings shows "Not set" alongside the link to change it

### Requirement: Configurable quick-copy chord

Quick-copy SHALL be configurable as an enable toggle plus modifiers; the digits
1–5 are fixed. A valid configuration SHALL require at least one modifier, since
bare digits would collide with the auto-focused search field. Configuration SHALL
be captured with a live key recorder rather than a preset list, and an invalid
chord SHALL NOT be committed.

#### Scenario: Quick-copy disabled

- **WHEN** the user disables quick-copy
- **THEN** no digit combination copies anything and the row hints disappear

#### Scenario: Recording a modifier-only chord

- **WHEN** the recorder is in modifier-only mode and the user releases a chord containing at least one modifier
- **THEN** the chord is committed; a chord with no modifier is rejected

#### Scenario: Live update on desktop

- **WHEN** the user changes the quick-copy modifier in the desktop's in-panel Settings
- **THEN** the list honors the new modifier without a restart; the extension popup, being a separate document, applies it on its next open

### Requirement: Global shortcut behavior is GUI-verified

Registration of an OS-level shortcut and the summon-to-focus flow cannot be
verified headlessly and SHALL be reported as manually verified, never as a
headless pass.

#### Scenario: Reporting a hotkey change

- **WHEN** the global shortcut path is changed
- **THEN** the report states it was checked by running the app, or that it was not checked
