## Why

A fresh install drops the user straight onto "Create a passphrase" — the only
path the UI offers. Someone who already has a vault (exported from another
machine, or living in the desktop app) has no way to say so: they must create a
throwaway vault first, then find Settings → import or Settings → Sync and undo
what the setup screen just made them do. The extension is worse: its mode
silently defaults to `independent`, so a user who installed it *because* they run
the desktop app ends up with a second, disconnected vault and no hint that
pairing exists.

Every capability needed is already built — import, bridge pairing, the three
extension modes. What is missing is the one screen that offers them at the moment
the choice is actually being made.

## What Changes

- A first-run wizard replaces the bare `SetupView` as what the UI renders when
  the host reports no vault. It presents the host's available starting points
  rather than assuming "create".
- **Desktop**: choose *create a new vault* or *import a vault file*, then an
  optional *connect your browser* step that enables the bridge and shows the
  pairing code. The connect step is skippable and stays available in Settings.
- **Extension**: choose *create a new vault*, *import a vault file*, or *connect
  to the desktop app* — the last pairs with the desktop and sets `client` or
  `sync` mode, so the extension's mode is chosen deliberately instead of
  defaulting.
- Importing on first run **adopts** the file: the blob becomes this device's
  vault and the passphrase that opens the file becomes this device's passphrase.
  This is a new host operation — today's import merges into an already-unlocked
  vault and cannot run before one exists.
- The wizard is first-run only. It is not added to Settings; everything it sets
  up remains editable there.

## Capabilities

### New Capabilities

- `onboarding`: what a host offers the user on first run — the available starting
  points, the order of the steps, what each one leaves behind, and what happens
  when one is skipped or fails.

### Modified Capabilities

- `shared-ui`: "Passphrase unlock screen" currently promises "a setup screen for
  a host reporting no existing vault"; the host now supplies wizard steps and the
  shared UI renders the wizard instead.
- `desktop-bridge`: pairing gains a first-run entry point on both sides — the
  desktop can enable the bridge and show a code from its wizard, the extension
  can pair and pick its mode from its own, without either passing through
  Settings.

`desktop-app` and `chrome-extension` need no delta: neither spec fixes what the
first-run screen offers, and no existing requirement of theirs changes behavior.

## Impact

- `packages/ui`: new wizard screens and a host-supplied step descriptor; the
  existing `SetupView` becomes the create-a-passphrase step inside it.
- `packages/ui/src/core/vault-service.ts` (or an adjacent port): the adopt-a-blob
  operation and a description of which starting points the host supports —
  extending the port means updating the Tauri, extension, and mock
  implementations together.
- `apps/twofau-app`: a Tauri command to adopt an imported blob before any vault
  exists, and the wizard's bridge step reusing the existing enable + pair-code
  commands.
- `apps/twofau-extension`: first-run wizard in the popup, writing `mode` (and
  pairing) before `createVaultService()` picks a backend; the optional host
  permission is requested inside the connect step.
- `packages/i18n`: new user-facing strings in the `ui` catalog, English source
  plus the machine-translated locales.
- No change to the vault format, the crypto layer, or the bridge wire protocol.
