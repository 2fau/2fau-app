# Hotkeys — global summon, focus-search, quick-copy 1–5

**Date:** 2026-08-07
**Repo:** `~/Projects/2fau-tauri` (desktop app + browser extension)
**Status:** approved design, ready for implementation plan

## Goal

Give both the desktop app and the browser extension:

1. A **global hotkey** that summons the popup and drops keyboard focus into the
   search box (when the search box is visible).
2. **Quick-copy hotkeys** ⌘/Ctrl+1 … ⌘/Ctrl+5 that copy the code of the Nth
   account currently shown, then dismiss the popup.

## Decisions (locked)

- **Copy binding:** `⌘/Ctrl + Digit1..5` (modifier + digit). Bare digits would
  collide with the auto-focused search field, so a modifier is required.
- **Mapping:** the accounts *as displayed*, top 5 — i.e. `[...matched, ...rest]`
  from `MenuBarView`, respecting the current search filter and the "For this
  site" ordering. What the user sees at positions 1–5 is what copies.
- **After copy:** copy → flash the row green (~600 ms) → dismiss the popup
  (desktop: hide the window; extension: `window.close()`). Grab-and-go.
- **Desktop summon key:** fixed default **⌘Shift+U** (mac) / **Ctrl+Shift+U**
  (Windows/Linux), matching the extension's existing shortcut. Not user
  configurable yet.
- **Extension summon key:** already implemented as the manifest `_execute_action`
  command (⌘/Ctrl+Shift+U), natively rebindable at `chrome://extensions/shortcuts`.
  No change.

## Current state (verified)

- Shared UI package `@twofau/ui` renders both the extension popup and the desktop
  webview. `MenuBarView` owns the search box (rendered only when `accounts.length
  > MAX_VISIBLE_ROWS`, i.e. > 5) and the account list. `AccountRow.copy()` writes
  `codes[account.id]` through `useClipboard().writeText`.
- `SearchInput` (`packages/ui/src/components/ui/search-input.tsx`) is an
  uncontrolled `<input>` with no ref or autofocus.
- **Extension** (`apps/twofau-extension`): `manifest.json` already declares the
  `_execute_action` summon command. `popup/main.tsx` builds a fresh DOM on every
  open. `onScan` already demonstrates the close pattern via `window.close()`.
- **Desktop** (`apps/twofau-app`): `src-tauri/src/lib.rs` shows the popup only via
  tray click / tray menu "Show", both routed through `toggle_window(app)`
  (show + position + focus, or hide if already visible). There is **no**
  global-shortcut plugin today. `src-tauri/Cargo.toml` lacks
  `tauri-plugin-global-shortcut`. The webview window is hidden and reshown, never
  rebuilt; it hides on focus-loss (`WindowEvent::Focused(false)`).
- `apps/twofau-app/src/main.tsx` already imports `getCurrentWindow` from
  `@tauri-apps/api/window`, so `getCurrentWindow().hide()` and
  `onFocusChanged` are available with no new Rust command.

## Components & changes

### A. Quick-copy 1–5 (shared UI)

`packages/ui/src/components/menu-bar-view.tsx`

- Add a `window` `keydown` effect, active only while the list screen is mounted.
  Match `(e.metaKey || e.ctrlKey) && e.code === "Digit1".."Digit5"` (use
  `e.code` so it is layout-independent). On match:
  - `e.preventDefault()`.
  - Compute the displayed order used for rendering (`[...matched, ...rest]`),
    take index `n-1`; bail if out of range.
  - Copy `codes[id]` via `useClipboard().writeText`.
  - Set `flashId = id` (drives the green tick on that row for ~1 s, matching the
    existing click-copy feedback).
  - After a short delay (~600 ms, long enough for the flash to show), call
    `requestClose?.()`.
- Guard against copying an empty/absent code (mirror `AccountRow.copy`'s `if
  (!raw) return`).

`packages/ui/src/components/account-row.tsx`

- Add optional props:
  - `flash?: boolean` — when true, show the green "copied" tick/color exactly as
    the internal `copied` state does. The row's own click-copy behavior and its
    local `copied` state are unchanged; `flash || copied` drives the visual.
  - `hotkeyIndex?: number` (1–5) — render a subtle `kbd` hint (e.g. `⌘1`) on the
    row so the shortcut is discoverable. Shown only for the top 5 rows.
- `MenuBarView` passes `hotkeyIndex` to the first five rendered rows (across
  matched + rest) and `flash={row.id === flashId}`.

### B. Focus search on open (shared UI)

`packages/ui/src/components/ui/search-input.tsx`

- Forward a `ref` to the `<input>` and accept an `autoFocus` prop (passed
  through to the input).

`packages/ui/src/components/menu-bar-view.tsx`

- Hold a ref to the search input. Focus it on mount, and in an effect keyed on a
  new `focusNonce` prop, focus it again whenever `focusNonce` changes (and the
  search box is rendered). This is what lets a *reshown* desktop window re-focus
  search without a remount.

### C. Prop threading

`TwoFAUApp` (`packages/ui/src/app.tsx`) → `RootView`
(`packages/ui/src/components/root-view.tsx`) → `MenuBarView` gain two optional
props:

- `requestClose?: () => void` — dismiss the popup after a quick-copy.
- `focusNonce?: number` — bump to re-focus the search box on the desktop.

### D. Extension wiring

`apps/twofau-extension/src/popup/main.tsx`

- Pass `requestClose={() => window.close()}` to `TwoFAUApp`.
- No `focusNonce` needed — the popup mounts fresh each open, so `autoFocus`
  handles the search focus.
- No manifest change: `_execute_action` already opens the popup.

### E. Desktop wiring

`apps/twofau-app/src/main.tsx`

- Pass `requestClose={() => void getCurrentWindow().hide()}`.
- Maintain a `focusNonce` in `Root` state; subscribe with
  `getCurrentWindow().onFocusChanged(({ payload: focused }) => { if (focused)
  bumpNonce() })` and pass it down. This fires when the window is summoned
  (global shortcut or tray), moving focus into search.

`apps/twofau-app/src-tauri/`

- Add `tauri-plugin-global-shortcut = "2"` to `Cargo.toml`.
- Register the plugin in `run()` and, in `setup`, register the default shortcut
  (`CmdOrCtrl+Shift+U`) with a handler that calls `toggle_window(app)` on
  key-press. Reuse the existing `toggle_window` — no duplicated show/position
  logic.
- Add the matching global-shortcut permission to
  `src-tauri/capabilities/default.json`.

## Edge cases

- Digit N greater than the number of shown accounts → no-op.
- Locked / setup / add / edit / import / settings screens: `MenuBarView` isn't
  mounted there, so the copy handler and its listener don't exist — inert by
  construction.
- Steam (5-char) and HOTP codes copy identically (both read from `codes[id]`).
- `⌘/Ctrl+1..5` is unused by the desktop webview and by an extension popup (a
  popup has no tab strip), so hijacking it is safe; `preventDefault` guards
  anyway.
- Empty search-filtered list → nothing to copy, handler bails.

## Testing

Vitest (`packages/ui`):

- `menu-bar-view.test.tsx`: with >5 accounts, `⌘+Digit1` writes `codes` of the
  first displayed account and calls `requestClose`; `Digit6` no-ops; with an
  active search filter, `⌘+Digit1` copies the top *filtered* account.
- `search-input` / `menu-bar-view`: search input is focused on mount, and
  re-focused when `focusNonce` changes.
- `account-row.test.tsx`: `hotkeyIndex` renders the kbd hint; `flash` shows the
  copied state.

Rust (`apps/twofau-app`):

- Global-shortcut registration and the summon→focus flow are interactive and
  cannot be verified headlessly (per `CLAUDE.md`). They will be **manually
  GUI-verified** and reported as such — no headless "confirmed" claim.

## Verification before done

`cargo fmt --check && cargo clippy --all-targets -D warnings && cargo test &&
pnpm -r test && pnpm -r typecheck`, per `docs/DEVELOPMENT.md § Verify`.
