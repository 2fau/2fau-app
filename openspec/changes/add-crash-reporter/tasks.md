## 1. Desktop: capture panics

- [x] 1.1 Add a `crash` module in `src-tauri` with `CrashReport` (id, time, version, os, arch, thread, message, location, backtrace, seen) and a store over `<data_dir>/dev.artkost.2fau/crashes`: atomic write (`.tmp` + rename), list newest-first, prune to 10, mark seen. Verify Rust tests with a `tempdir`: write/read round trip, the 11th write deletes the oldest, mark-seen keeps the file.
- [x] 1.2 Resolve the crashes dir by the same rule as `fallback_vault_path` (no `AppHandle` needed). Verify a Rust test that it is a sibling of `fallback_vault_path()`'s parent dir.
- [x] 1.3 Install a panic hook as the first statement of `run()`: `Backtrace::force_capture()`, thread name, payload (`&str`/`String`, else `"<non-string panic>"`), location; write the report, ignore every error, then chain to the previous hook. Verify a Rust test that installs the hook against a temp dir, panics inside `catch_unwind` on a named thread, and finds a report naming that thread with a non-empty backtrace and no `unwrap` in the hook path (review).
- [x] 1.4 Privacy guard: verify a Rust test that panics with an unlocked `AppVault` holding a known secret and label in scope, and asserts neither string appears in the report. Add one sentence to `docs/ARCHITECTURE.md` hard invariants: never `Debug`/`Display` secret-bearing types into `panic!`/`expect`.
- [x] 1.5 Build the issue URL and markdown body in Rust from `CARGO_PKG_REPOSITORY`: title `Crash: <message ≤80 chars>`, `labels=crash`, body with version/OS/arch/thread/location and the backtrace in a code fence; cap the encoded URL at 7,500 bytes by cutting whole frames and appending the truncation note. Verify Rust tests: short report round-trips through URL decoding; a 500-frame report yields a URL ≤ 7,500 bytes ending in the truncation note.

## 2. Desktop: time sync survives a panic

- [x] 2.1 Wrap each pass of the time-sync loop in `catch_unwind(AssertUnwindSafe(..))` so the thread keeps its schedule. Verify `cargo test` passes and a Rust test that a closure panicking on the first pass still runs the second.
- [x] 2.2 Make `TimeSync::offset_ms`/`store` tolerate a poisoned mutex (`unwrap_or_else(|e| e.into_inner())`). Verify a Rust test that poisons the lock from a panicking thread and then reads the offset without panicking.

## 3. Desktop: IPC and live event

- [x] 3.1 Add Tauri commands `crash_pending` (newest unseen report with `body` and `issue_url`, or null) and `crash_dismiss(id)`; register them in the invoke handler. Verify Rust tests on the underlying store functions and `cargo clippy --all-targets -D warnings` clean.
- [ ] 3.2 Store the `AppHandle` in a `OnceLock` during `setup`; the hook emits `crash://reported` with the id when it is set (best-effort). Verify by code review plus task 7.2 (GUI, not headless).

## 4. Shared UI: port and dialog

- [x] 4.1 Add `CrashReport` type and optional `crashReports?: { pending; dismiss; subscribe }` to `SettingsBackend` in `packages/ui/src/core/settings.ts`. Verify `pnpm -r typecheck` passes with the extension not implementing it.
- [x] 4.2 Add `CrashDialog` (shadcn dialog primitives already in `components/ui`, or the existing overlay pattern): explanation, panic message, scrollable selectable report, Copy (`navigator.clipboard.writeText` of the full report), Report on GitHub (`openLink(issue_url)` then `dismiss`), Dismiss. Verify Vitest cases: renders message and backtrace; Copy writes the full untruncated text; Report calls `openLink` with the URL and `dismiss` with the id; Dismiss calls `dismiss` and closes.
- [x] 4.3 `RootView` calls `crashReports.pending()` on mount and `subscribe` for live reports, rendering `CrashDialog` above the current screen. Verify Vitest cases: a backend with a pending report shows the dialog; one without `crashReports` (extension) or with `pending() → null` renders no dialog; a subscribed report appears without remount.
- [x] 4.4 Add a Storybook story for `CrashDialog` with a long backtrace, (no mock settings backend exists, so the story renders `CrashDialog` directly; `RootView` behaviour is covered by Vitest). Verify `pnpm --filter @twofau/ui build-storybook` succeeds.
- [x] 4.5 Wrap every new string in `t()` and re-extract the `ui` catalog (`node scripts/extract-i18n.mjs --namespace ui --dir packages/ui/src --dir apps/twofau-app/src --dir apps/twofau-extension/src`), filling all locales. Verify `node scripts/check-i18n.mjs` reports the locales in sync.

## 5. Desktop frontend: wire the port

- [x] 5.1 Implement `crashReports` in `apps/twofau-app/src/settings-backend.tsx` over `invoke("crash_pending")`, `invoke("crash_dismiss")` and `listen("crash://reported")` (re-fetching `crash_pending` on event). Verify `pnpm --filter @twofau/app typecheck` and existing app tests pass.
- [x] 5.2 Add a Knope changeset (`feat`, desktop: crash reports with a prefilled GitHub issue). Verify the changeset file exists under the repo's changeset dir.

## 6. Desktop: native crashes

- [x] 6.1 Add `crash-handler`, `minidumper`, `minidump`, `minidump-processor` (no default features), `minidump-unwind`, `backtrace`, `futures-executor`. Verify `cargo build -p twofau-app` succeeds.
- [x] 6.2 Crash monitor mode: `main()` runs `crash::run_monitor(socket)` on `--crash-monitor <socket>` before Tauri; the server stores the anchor message, writes `<id>.dmp`, converts it to a report (reason, address, thread, stack with app frames named), writes `<id>.json`, and exits on disconnect or after one dump. Verify Rust unit tests for anchor-based address mapping and for pruning removing `<id>.dmp`.
- [x] 6.3 Client: `run()` spawns the monitor, connects with retries, sends the anchor, attaches the crash handler (skipping when a panic is in progress), sets the ptracer on Linux; every failure is ignored. Verify `cargo test` passes.
- [x] 6.4 Issue body and dialog text name the minidump and warn against attaching it publicly; the dump is never in the URL. Verify a Rust test on the body/URL for a report with a dump.
- [x] 6.5 End-to-end: a debug-only `--crash-selftest` mode (crash dir from `TWOFAU_CRASH_DIR`, debug builds only) starts the monitor and segfaults; an integration test runs the built binary and asserts a `.dmp` and a report whose reason names the fault and whose stack names the self-test function. Verify `cargo test --test native_crash --target aarch64-apple-darwin` (ignored on x86_64 macOS: Rosetta).

## 7. Verification

- [x] 7.1 Run the full gate: `cargo fmt --check && cargo clippy --all-targets -D warnings && cargo test && pnpm -r test && pnpm -r typecheck`. Note pre-existing failures separately from this change.
- [ ] 7.2 Hand-verify in a release build (`pnpm tauri build`, not headless): temporarily add a debug-only trigger that panics on the main thread → app dies → relaunch shows the dialog with a symbolized backtrace; panic on the time-sync thread → dialog appears live and codes keep working; Report on GitHub opens a prefilled issue page; Dismiss + relaunch shows nothing. Also run `--crash-selftest`-style native crash in a release build and confirm the dialog after relaunch. Remove the trigger. Report these steps as human-verified, not confirmed by tests.
- [x] 7.3 Verify the extension is untouched: popup and options render no crash UI (`pnpm --filter @twofau/extension test`).
