## Context

See proposal.md — Why. The pieces that constrain the approach:

- `RootView` renders `SetupView` when `useVault().needsSetup` is true. `SetupView`
  calls `VaultService.unlock(passphrase)`, which on a host with no vault *creates*
  one — so the create path already exists and needs no new operation.
- `@twofau/ui` may not import `chrome.*` or Tauri APIs. Host I/O reaches it
  either through `VaultService` or through an injected backend object; the
  settings screen already uses the second shape (`SettingsBackend`, including
  `ImportSpec`'s `native` / `file` split and a ready-made `sync` sub-screen).
- Importing today is `AppVault::import_blob`, which fails with "vault is locked"
  unless a vault is already open, and merges into it. It cannot serve first run.
- The extension popup builds its backend *before* rendering: `createVaultService()`
  reads `mode` and, in `client` mode with no pairing, throws — the popup then
  renders `DesktopUnavailable`. Only that mode throws, so a first-run user (whose
  `mode` still reads its `independent` default) gets a working local backend.

## Goals / Non-Goals

**Goals:**

- One wizard component in `@twofau/ui`, rendered for every host, with the
  host-specific steps injected.
- First run cannot end in a state the user did not pick — no silent
  `independent` mode, no vault created just to get past a screen.

**Non-Goals:**

- Changing the vault format, the bridge protocol, or the pairing rules.
- Any Settings re-entry point, any "redo setup" affordance.
- Migrating existing installs: they have a vault, so they never see the wizard.

## Decisions

**The wizard is a `SetupBackend` injected next to `SettingsBackend`, not new
`VaultService` methods.** `TwoFAUApp` grows an optional `setupBackend` whose
fields describe the starting points: `create` is implied (it is `unlock()`),
`adopt?: ImportSpec` reuses the existing `native` | `file` union verbatim, and
`connect?: { screen: ReactNode }` is a host-rendered sub-screen exactly like
`SettingsBackend.sync`. Which choices the wizard shows is which fields are
present. Alternative: add `adopt()` and `setupOptions()` to `VaultService`. That
port is the steady-state contract every screen uses and every implementation
(Tauri, extension, mock) must satisfy; hanging first-run-only I/O and a whole
pairing sub-screen off it means `MockVaultService` grows machinery no test needs.
The `SettingsBackend` precedent already says host-shaped screens travel as
injected props.

**Import adopts by replacing, not merging.** With no vault present there is
nothing to merge into, and asking for a local passphrase first would mean two
passphrases for one vault. Desktop: a new command verifies the chosen blob opens
with the supplied passphrase, writes those bytes to `app_data_dir()/vault.dat`,
then unlocks normally — the file's own salt, nonce, and KDF id carry over
untouched. Extension: the same, writing the blob through the existing repo as the
first generation and putting the derived key in session storage. `import_blob`
stays as it is for the Settings path, where merging is the right behavior.

**Adopt refuses when a vault already exists.** The command is first-run only;
guarding it there keeps "import" (merge, from Settings) and "adopt" (replace,
from the wizard) from ever being the same button pointed at different states.

**The extension represents "not yet onboarded" by the absence of a vault, not by
a new flag.** `service.needsSetup()` is already that signal, so the popup keeps
its current bootstrap: `createVaultService()` in the default `independent` mode
builds the local backend without touching the bridge, and the wizard renders
over it. Only the connect step changes the backend, and it reloads the popup
after writing the mode, so a `client`-mode service is never built before a
pairing exists. An earlier draft of this design had the popup render the wizard
*instead of* calling `createVaultService()`; that turned out to be unnecessary —
only `client` mode can throw there, and no first-run user is in it. An explicit
`onboarded` boolean would also be a second source of truth that upgrades would
have to backfill for every existing install.

**The connect step runs after the vault exists on desktop, and instead of a vault
on the extension.** That asymmetry is inherent: the desktop *is* the vault, so
the bridge is an extra; the extension in `client` mode has no vault of its own, so
connecting is a complete starting point. The wizard reflects the host rather than
forcing one shape on both.

**Existing `SetupView` becomes the create step.** Same form, same minimum length,
same `unlock()` call — moved one level down in the tree rather than rewritten.

## Risks / Trade-offs

- A second injected backend object next to `SettingsBackend` is more surface than
  extending `VaultService` → both are already established shapes; the wizard adds
  no new *kind* of seam, and its fields are optional so hosts opt in.
- Adopting a blob writes a file whose KDF id and version came from another
  install, possibly older → the blob is opened before it is adopted, so an
  unsupported version fails as `UnsupportedVersion`/`UnknownKdf` at that point,
  before anything is written.
- The connect step changes which backend the popup should be using → it reloads
  the popup right after pairing, so the next start reads the new mode. A reload
  mid-wizard is safe: pairing and the mode are already persisted.
- Every new string needs a translation pass across the locale catalogs → English
  is the key, untranslated locales fall back to it, so a partial pass ships
  correct English rather than blanks.
- The desktop wizard's tray/popup interactions cannot be verified headlessly →
  Vitest covers the wizard against `MockVaultService`; the desktop path is
  confirmed by a human running the app, and reported that way.

## Migration Plan

Nothing to migrate: the wizard is gated on the host reporting no vault, so every
existing install goes straight to unlock as before. Rollback is reverting the UI
package and the two hosts; an adopted vault stays readable, since adoption
produces an ordinary vault file with no new format.

## Open Questions

Resolved during implementation: the extension's connect step offers `client` and
`sync` on the same screen, defaulting to `client`.
