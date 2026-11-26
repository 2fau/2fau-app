## Why

A tester's desktop app crashed while it was syncing network time, and the only
thing they could report was "it crashed". The app leaves nothing behind: no log
file, no stack trace, no message — and on macOS/Windows a release build has no
console to print to. We cannot fix a crash we cannot see, and asking a non-developer
to reproduce it under `RUST_BACKTRACE=1` from a terminal is not a realistic path.

## What Changes

- **Desktop** installs a crash handler at startup that, on any Rust panic in any
  thread, writes a crash report (message, location, thread, backtrace, app
  version, OS/arch, timestamp) to a `crashes/` folder in the app data dir before
  the panic continues.
- **Desktop** shows a **crash dialog** listing the report: the full stack trace
  in a scrollable, selectable block, plus **Copy**, **Report on GitHub** and
  **Dismiss** buttons.
  - Shown on the **next launch** when the crash killed the process.
  - Shown **immediately** when the panic happened on a background thread and the
    app is still alive (the time-sync thread is the motivating case).
- **Report on GitHub** opens the browser on a prefilled "new issue" page for
  `github.com/2fau/2fau-app` (title + body with the report). Nothing is sent
  automatically; the user reviews and submits the issue themselves.
- Dismissing (or reporting) marks the report as seen so the dialog doesn't come
  back; only the newest few reports are kept on disk.
- The background time-sync loop survives a panic in one pass: the panic is
  recorded, the thread keeps running with the last known offset instead of
  dying silently.
- **Shared UI** gains a `CrashDialog` component, rendered by `RootView` above
  whatever screen is current.
- **Port change — `SettingsBackend`**: new optional `crashReports` member
  (`pending()`, `dismiss(id)`). Desktop implements it over Tauri IPC; the
  extension omits it (no native process to crash), so no dialog renders there.
- New user-facing strings go through `t()` and every locale catalog.

- **Desktop** also records **native crashes** (segfault, illegal instruction,
  bus error, abort, Windows access violation) that never reach the panic
  machinery. A small crash-monitor process (the app binary re-launched in a
  monitor mode) writes a minidump when the app crashes, walks its stack, names
  the app's own frames, and saves a normal crash report — so the same dialog and
  GitHub button cover native crashes on the next launch.
- The minidump stays on disk next to the report. It can contain process memory,
  so it is **never** put in the issue URL; the issue body names the file and
  says not to attach it publicly.

**Secret handling.** A minidump holds thread stacks and may hold secret bytes
from memory, so it never leaves the machine through the app. A panic message or backtrace is code locations and the panic
string — never vault contents by construction, but a panic string can embed a
`Debug`-formatted value. The report therefore never auto-uploads, the user sees
the full text before anything leaves the machine, and the crash handler must not
`Debug`-print app state. No vault-format change, no data-loss path.

## Capabilities

### New Capabilities

- `crash-reporting`: capturing panics to disk, presenting them to the user, and
  handing them off as a prefilled GitHub issue.

### Modified Capabilities

<!-- None: desktop-app requirements (secrets, vault path, keyring, menu-bar
window) are unchanged; the crash dialog is specified in crash-reporting. -->

## Impact

- `apps/twofau-app/src-tauri`: new crash module (panic hook, report store, two
  IPC commands, event emit), hook installed first thing in `run()`, time-sync
  thread loop wrapped in `catch_unwind`.
- `packages/ui`: `SettingsBackend.crashReports?` in `core/settings.ts`,
  `CrashDialog` component + story + Vitest, `RootView` renders it,
  story for Storybook.
- `apps/twofau-app/src`: `settings-backend.tsx` implements `crashReports`.
- `packages/i18n`: new strings in every catalog.
- Dependencies: `crash-handler`, `minidumper` (catch native crashes, write the dump
  out of process), `minidump`, `minidump-processor`, `minidump-unwind` (walk the
  dump's stack), `backtrace` (name app frames), `futures-executor`.
- Release: Knope changeset (`feat`, desktop).
