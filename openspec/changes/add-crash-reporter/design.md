## Context

See proposal.md — Why. Relevant current state:

- `run()` in `src-tauri/src/lib.rs` spawns the time-sync loop with a bare
  `std::thread::spawn(move || loop { sync_once(); sleep(REFRESH) })`. A panic
  there kills only that thread (release profile has no `panic = "abort"`), so
  time sync silently stops; a panic on the main thread or inside a Tauri
  callback takes the whole app down. Either way nothing is logged.
- Release profile is `lto = true, opt-level = "z"`, no `debug`, not stripped:
  symbol names survive, file/line info does not.
- The UI reaches the host only through ports; `RootView` already receives the
  optional `settingsBackend`, and `SettingsBackend.openLink` opens URLs via the
  opener plugin on desktop.
- The repository URL is already in the workspace `Cargo.toml`
  (`package.repository = "https://github.com/2fau/2fau-app"`).

## Goals / Non-Goals

**Goals:**
- Capture enough from a field crash to locate it (message, location, thread,
  symbolized function names).
- Zero new dependencies; nothing leaves the machine without a user click.

**Non-Goals:**
- Uploading minidumps or hosting symbols; OS kills (SIGKILL, OOM killer)
  that no handler can observe.
- Fixing the time-sync crash itself — this change makes it reportable and
  stops it from killing sync; the root-cause fix comes with the first report.
- A crash history screen in Settings.

## Decisions

**1. `std::panic::set_hook` + `std::backtrace::Backtrace::force_capture()`.**
Installed as the first statement of `run()`, before the Tauri builder. The hook
needs the crashes dir before Tauri resolves `app_data_dir()`, so it computes the
same path from `dirs::data_dir()/dev.artkost.2fau/crashes` (same rule as the
existing `fallback_vault_path`) — a test asserts both agree on each OS.
The hook writes the report, then calls the previously installed (default) hook
so stderr output in dev is unchanged.
*Alternatives:* `sentry`/`human-panic` crates — rejected: a network SDK for an
offline-first authenticator, or a dependency for ~60 lines.

**2. Report format: one JSON file per crash,** `crash-<unix_ms>.json`, fields
`{id, time, version, os, arch, thread, message, location, backtrace, seen}`.
The hook must not allocate much or take app locks (it may run while a mutex is
held/poisoned), so it only formats what `PanicHookInfo` gives plus
`env!("CARGO_PKG_VERSION")`, `std::env::consts::{OS, ARCH}`, writes to
`<id>.json.tmp`, renames. Pruning to 10 happens in the hook after the write
(sorted by filename = time). `seen` is flipped by rewriting the file.
*Why JSON over text:* the dialog needs fields (title = message), and the
pretty "issue body" is rendered from fields in one place (Rust).

**3. Panic message privacy.** The hook writes only `PanicHookInfo`'s payload
and location — it never touches `VaultState`. The residual risk is a panic
string built from `Debug` of a secret-bearing type; `StoredAccount`/secret
types must not appear in `expect`/`panic!` formatting. Mitigation is the
user-reviewed submission, plus a unit test that panics with a known
`StoredAccount` in scope and asserts the report doesn't contain its secret.

**4. Live notification.** The hook stores the new report id in a
`static LIVE: OnceLock<AppHandle>`; after `setup` sets it, the hook also emits
`crash://reported` with the id. If the process is still alive the frontend
receives it and shows the dialog immediately; if not, the next launch picks it
up via `pending`. Emitting from the hook is best-effort (`let _ =`).

**5. Time-sync loop wraps each pass in `catch_unwind`.**
`loop { let _ = catch_unwind(AssertUnwindSafe(|| time_sync.sync_once())); sleep }`.
The hook has already recorded the panic by the time `catch_unwind` returns.
`TimeSync::offset_ms` uses `lock().expect(...)`; a panic inside `store()` while
holding the lock would poison it and turn every later code request into a
panic, so `offset_ms`/`store` switch to `lock().unwrap_or_else(|e| e.into_inner())`
— an `i64` can't be left half-written.

**6. IPC + port.** Two Tauri commands:
- `crash_pending() -> Option<CrashReport>` — newest unseen report, with a
  pre-rendered `body` (markdown issue body) and `issue_url`.
- `crash_dismiss(id)` — sets `seen`.
`SettingsBackend` gains
`crashReports?: { pending(): Promise<CrashReport | null>; dismiss(id): Promise<void>; subscribe(cb): () => void }`.
Optional, so the extension simply omits it. `RootView` calls `pending()` on
mount and `subscribe` for live reports, and renders `CrashDialog` when there's
one. Copy uses `navigator.clipboard.writeText` (works in the Tauri webview and
avoids widening the port); Report uses the existing `openLink`.
*Alternative:* a separate `CrashReporter` port prop on `RootView` — rejected,
`SettingsBackend` is already the "host-specific optional extras" bag and is
already threaded through.

**7. Issue URL is built in Rust.**
`{repository}/issues/new?title=<enc>&labels=crash&body=<enc>`, title
`Crash: <message, first 80 chars>`. If the encoded URL exceeds 7,500 bytes
(GitHub rejects ~8 KB), the backtrace is cut at a frame boundary and a line
`… truncated — paste the full report from the Copy button` is appended. Built
in Rust so it's unit-testable next to the format and the repository URL comes
from `env!("CARGO_PKG_REPOSITORY")`.

**8. Symbol quality.** Keep release as is: function names resolve because the
binary isn't stripped, which is enough to find the panicking frame alongside
the `location` (file:line comes from the panic itself, not the backtrace).
Adding `debug = "line-tables-only"` would give per-frame lines at a binary-size
cost; deferred until a report shows it's needed.

**9. Native crashes: out-of-process monitor.**
`run()` spawns `current_exe --crash-monitor <socket>`; `main()` branches on that
flag before Tauri starts, so the monitor has no window, tray or Dock icon. The
app connects a `minidumper::Client` and attaches a `crash_handler::CrashHandler`
whose callback only calls `request_dump` — the crashed process does no file
I/O, allocation-heavy work or stack walking. The monitor writes
`<id>.dmp`, then walks the dump with `minidump-processor` (frame pointers / stack
scanning, no symbol files) and writes a normal `<id>.json` via the same
`crash::write`. Monitor exits when the app disconnects or after one dump.
*Why not an in-process trace:* on macOS `crash-handler` runs the callback on a
separate exception-handler thread, so `backtrace::trace` there captures the
wrong stack. The dump has the real crashed thread on every OS.
*Socket:* `<crashes dir>/mon-<pid>.sock`; the dir is 0700 on Unix, so another
local user cannot squat the name as in a shared `/tmp` (a path over macOS's
104-byte limit just disables native capture). Linux: `set_ptracer(monitor pid)` so Yama allows the dump.

**10. Naming app frames without symbol files.** The app sends the monitor one
message at startup: the runtime address of `run`. The monitor is the same
binary, so for a frame inside the app's module its own address is
`monitor_run + (frame − app_run)` (ASLR slides the whole image), which
`backtrace::resolve` turns into a function name (release builds keep the symbol
table). Frames in other modules print as `module + 0xoffset`. If no anchor
arrived, app frames also print as module + offset.

**11. Dedup with panics.** The panic hook sets a static flag; the crash callback
returns `Handled(false)` without a dump when it is set, so a panic that aborts
yields one (panic) report and the OS crash flow continues.

**12. Minidump privacy.** The dump holds stacks and may hold secret bytes, so
the report stores only its file name; the issue body says it exists locally and
must not be attached publicly. Pruning deletes `<id>.dmp` with `<id>.json`.

## Risks / Trade-offs

- [Monitor spawn/connect fails] → logged nowhere, app continues; panic hook
  still works. Connect retries for ~1 s, then gives up.
- [Stack scanning on x86_64 without CFI] → may include spurious frames; marked
  by lower trust, acceptable for triage. aarch64 macOS has frame pointers.
- [x86_64 build under Rosetta on Apple Silicon] → `thread_get_state` fails for
  translated threads, the dump is empty and no native report is written
  (panics still are). Native arm64 and Intel builds are verified/unaffected;
  the integration test is ignored on x86_64 macOS for this reason.
- [Extra process per app run] → idle, a few MB RSS, exits with the app.

- [Panic during the hook (disk full, permission)] → every hook step is
  `Result`-ignored; no `unwrap` in the hook; double panic would abort, so the
  write path is kept to `create_dir_all` + `write` + `rename`.
- [Hook runs before Tauri knows `app_data_dir`] → shared path rule + test.
- [Report contains a secret via a careless `panic!("{:?}", x)`] → user reviews
  before submitting; test guards the obvious type; documented in ARCHITECTURE.
- [Crash loops on startup show the dialog every launch] → dismiss marks seen;
  only unseen reports show.
- [macOS "app quit unexpectedly" dialog also appears] → expected for aborts;
  ours adds the actionable report on the next launch.

## Migration Plan

Additive. Older versions ignore the `crashes/` folder; downgrading leaves the
files untouched. Rollback = revert; leftover files are harmless.
