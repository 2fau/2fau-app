# Configurable hotkeys in Settings — design

**Date:** 2026-08-07
**Repo:** `~/Projects/2fau-tauri` (desktop app + browser extension)
**Status:** approved design, ready for implementation plan
**Builds on:** `2026-08-07-hotkeys-design.md` (the hotkeys this makes configurable)

## Goal

Let the user define, in Settings, the two hotkeys the app added:

1. **Global summon** — the "show 2FAU popup" shortcut.
2. **Quick-copy 1–5** — the ⌘/Ctrl+1..5 copy shortcuts (enable/disable + choose the modifier).

Defining a shortcut uses a **live key recorder** ("Press keys…").

## Decisions (locked)

- Both summon and quick-copy are customizable.
- Recorder UX (capture the actual chord), not a preset list.
- **Extension summon is not programmatically rebindable** (Chrome only allows it at
  `chrome://extensions/shortcuts`). The extension Settings therefore *shows* the
  current binding (read from `chrome.commands.getAll()`) and offers a row that
  opens the Chrome shortcuts page. Desktop summon is rebindable in-app.
- Quick-copy digits (1–5) are fixed; only the **modifier(s)** and an enable
  toggle are configurable. It applies as `<mods>+Digit1..5`.
- `mod` means ⌘ on macOS, Ctrl elsewhere (matches the existing quick-copy check).

## Current state (verified)

- `SettingsBackend` (`packages/ui/src/core/settings.ts`) is the host port; the
  shared `SettingsView` (`packages/ui/src/components/settings-view.tsx`) renders
  iOS-style grouped sections with drill-in sub-screens. **Auto-Lock is the exact
  template** for a backend-driven preference with its own screen.
- Desktop persists prefs in `localStorage` (`apps/twofau-app/src/auto-lock.ts`);
  its `SettingsBackend` is built in `apps/twofau-app/src/settings-backend.tsx`.
- Extension persists prefs in `chrome.storage.local` via a validated `Settings`
  interface (`apps/twofau-extension/src/vault/settings.ts`); its backend is built
  in `apps/twofau-extension/src/options/options-view.tsx`. Settings is a separate
  options **tab**, a different document from the popup.
- The quick-copy handler in `menu-bar-view.tsx` is currently hardcoded:
  `(e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && /^Digit([1-5])$/`.
- Desktop summon is a Rust-registered fixed literal `"CmdOrCtrl+Shift+U"` in
  `apps/twofau-app/src-tauri/src/lib.rs` (via `app.global_shortcut().on_shortcut`).
  `tauri-plugin-global-shortcut` is already a dependency.
- The extension summon is the manifest `_execute_action` command.

## Representation & shared helpers — `packages/ui/src/lib/hotkeys.ts` (new)

```ts
export interface Mods { mod: boolean; shift: boolean; alt: boolean }
export interface Chord extends Mods { key: string } // key: "" for modifier-only; else "KeyU", "Digit1", …
export interface QuickCopyConfig { enabled: boolean; mods: Mods }

export const DEFAULT_SUMMON: Chord;            // Mod+Shift+KeyU
export const DEFAULT_QUICK_COPY: QuickCopyConfig; // { enabled: true, mods: { mod: true, shift: false, alt: false } }

export function isMac(): boolean;                      // navigator.platform check
export function formatChord(c: Chord | Mods): string;  // "⌘⇧U" on mac, "Ctrl+Shift+U" else; mods-only → "⌘⇧"
export function toAccelerator(c: Chord): string;       // Tauri: "CmdOrCtrl+Shift+U"
export function chordFromEvent(e: KeyboardEvent): Chord;
export function isValidSummon(c: Chord): boolean;      // ≥1 modifier AND a non-modifier key
export function isValidQuickCopyMods(m: Mods): boolean;// ≥1 modifier
export function matchesQuickCopy(e: KeyboardEvent, cfg: QuickCopyConfig): number | null; // returns 1..5 or null
```

`matchesQuickCopy`: returns the digit (1–5) when `cfg.enabled`, the modifier state
matches (`(e.metaKey||e.ctrlKey) === cfg.mods.mod`, `e.shiftKey === cfg.mods.shift`,
`e.altKey === cfg.mods.alt`), and `e.code` is `Digit1..5`; else `null`.

Serialization for storage/IPC uses a compact string via `toAccelerator` for the
summon, and a plain `{enabled, mods}` object (JSON) for quick-copy.

## Key recorder — `packages/ui/src/components/hotkey-recorder.tsx` (new)

A focusable field that captures the chord:

```ts
export function HotkeyRecorder(props: {
  value: Chord;
  onChange: (c: Chord) => void;
  captureKey: boolean;          // true: summon (needs a main key); false: quick-copy (mods only)
  onReset?: () => void;         // shows a "Reset" affordance when provided
  error?: string | null;
}): JSX.Element
```

- On focus it enters "recording": `keydown` builds a `Chord` via `chordFromEvent`.
  `preventDefault()` so the chord doesn't leak (e.g. into the OS).
- When a valid chord is captured (`isValidSummon` / `isValidQuickCopyMods`), it
  calls `onChange` and shows the formatted result via `formatChord`.
- Ignores lone modifier presses while `captureKey` (waits for a main key); for
  the mods-only variant, commits on the first modifier-inclusive keyup.
- Renders `error` (e.g. an OS registration failure passed back by the host).

## Port change — `packages/ui/src/core/settings.ts`

Add to `SettingsBackend`:

```ts
hotkeys: {
  getQuickCopy: () => Promise<QuickCopyConfig>;
  setQuickCopy: (c: QuickCopyConfig) => Promise<void>;
  summon:
    | { kind: "rebindable"; get: () => Promise<string>; set: (accelerator: string) => Promise<void> }
    | { kind: "external"; get: () => Promise<string | null>; open: () => void };
};
```

`summon.get` returns a display string (accelerator on desktop; the raw
`chrome.commands` shortcut on the extension, or `null` if unset).

## Settings screen — `settings-view.tsx`

Add `Screen = "hotkeys"` and a `HotkeysScreen`:

- Row **Show 2FAU**:
  - `summon.kind === "rebindable"`: a `HotkeyRecorder captureKey` seeded from
    `summon.get()`; on change → `summon.set(toAccelerator(chord))`, surfacing any
    rejection as the recorder's `error` and keeping the prior value.
  - `summon.kind === "external"`: a read-only value (current binding from
    `summon.get()`, or "Not set") plus a `SettingsRow` "Change in browser…" →
    `summon.open()`.
- Row group **Quick-copy codes**: an enable toggle; when enabled, a
  `HotkeyRecorder` (mods only) seeded from `getQuickCopy()`, preview text like
  `⌘ + 1–5`. Writes via `setQuickCopy`.
- Add a **Hotkeys** row under the existing "Preferences" group that drills in.

## List wiring — quick-copy honors the config

- `TwoFAUApp` gains `quickCopy?: QuickCopyConfig` (initial, host-injected) and
  owns it as state; passes it to `RootView` → `MenuBarView`.
- `MenuBarView` replaces its hardcoded modifier check with
  `matchesQuickCopy(e, quickCopy)`; the row badge shows `formatChord(mods)` +
  index (or hides when disabled).
- The in-panel desktop Settings updates this live: `TwoFAUApp` threads an
  `onQuickCopyChange` down to `SettingsView` so a successful `setQuickCopy` also
  updates the in-memory config. The extension popup is a separate document, so it
  simply reads `quickCopy` at mount (new-open applies changes) — acceptable.
- `AccountRow`'s `hotkeyIndex` badge takes an optional `modLabel` (formatted
  modifier) so it reflects the configured modifier instead of a hardcoded `⌘`.

## Desktop specifics

- `apps/twofau-app/src/hotkeys.ts` (new): `getQuickCopy`/`setQuickCopy` over
  `localStorage` (key `twofau.quickCopy`), validated like `auto-lock.ts`.
- `apps/twofau-app/src/settings-backend.tsx`: wire `hotkeys` — quick-copy via the
  new store; `summon` = `{ kind: "rebindable", get: () => invoke("get_global_shortcut"),
  set: (a) => invoke("set_global_shortcut", { accelerator: a }) }`.
- `apps/twofau-app/src/main.tsx`: read quick-copy config at mount, pass to
  `TwoFAUApp`.
- Rust `apps/twofau-app/src-tauri/src/lib.rs`:
  - Persist the summon accelerator in a `shortcut` file beside `vault.dat`
    (like the existing `time-offset` file). Setup reads it (or `DEFAULT`) and
    registers, replacing the hardcoded literal.
  - New commands:
    - `get_global_shortcut() -> String` (reads the file or default).
    - `set_global_shortcut(app, accelerator: String) -> Result<(), String>`:
      `global_shortcut().unregister_all()`, then `on_shortcut(accelerator, …)`
      re-registering `toggle_window`; on parse/registration error return the
      message (UI keeps the old value); on success persist the file.
  - Add both to `invoke_handler`. No capability entry needed (Rust registration
    isn't ACL-gated; IPC commands ride `core:default`).
  - Default summon literal stays `CmdOrCtrl+Shift+U`.

## Extension specifics

- `apps/twofau-extension/src/vault/settings.ts`: add validated fields
  `quickCopyEnabled: boolean` (default true) and `quickCopyMods: string`
  (default `"mod"`, a compact token like `"mod"`, `"mod+shift"`; parsed to `Mods`).
- `apps/twofau-extension/src/options/options-view.tsx`: build `hotkeys` —
  quick-copy get/set via `readSettings`/`writeSettings`; `summon = { kind:
  "external", get: readSummonShortcut, open: () => chrome.tabs.create({ url:
  "chrome://extensions/shortcuts" }) }`. `readSummonShortcut` reads
  `chrome.commands.getAll()` and returns the `_execute_action` `shortcut` (or null).
- `apps/twofau-extension/src/popup/main.tsx`: read quick-copy from settings, pass
  `quickCopy` to `TwoFAUApp`.

## Edge cases

- Recorder rejects invalid chords (no main key for summon; no modifier for
  quick-copy) — no `onChange` fires.
- Desktop `set_global_shortcut` failure (unparseable, or OS reports the combo
  taken): the command returns an error string; the screen shows it and the prior
  binding stays registered (because we only persist after a successful register;
  on failure we re-register the previous accelerator).
- Quick-copy disabled → `matchesQuickCopy` returns null → handler inert; badge
  hidden.
- Extension `chrome.commands.getAll()` may report an empty shortcut (user cleared
  it) → show "Not set".
- Steam/HOTP codes copy unchanged (still read from `codes[id]`).

## Testing

Vitest (`packages/ui`):
- `hotkeys.test.ts`: `chordFromEvent`, `formatChord` (mac/non-mac), `toAccelerator`,
  `isValidSummon`/`isValidQuickCopyMods`, and `matchesQuickCopy` (match, wrong
  modifier, disabled, digit out of range).
- `hotkey-recorder.test.tsx`: captures a valid chord and calls `onChange`; ignores
  a lone modifier in summon mode; commits mods-only in quick-copy mode.
- `settings-view.test.tsx` (or new): the Hotkeys screen renders both summon
  variants and the quick-copy toggle; toggling calls `setQuickCopy`.
- `menu-bar-view.test.tsx`: a custom modifier config copies on that combo; a
  disabled config copies on nothing.

Rust (`apps/twofau-app`):
- Unit-test the accelerator persistence helper (read/default/round-trip) where it
  can be isolated from the plugin. The live OS (re)binding is interactive and
  **manually GUI-verified** — no headless claim (per `CLAUDE.md`).

## Verification before done

`cargo test -p twofau-app && pnpm -r test && pnpm -r typecheck`, plus fmt/clippy on
changed Rust (note: the full-crate fmt/clippy gate is red from pre-existing
toolchain drift on `main`, unrelated to this work). Manual GUI check of the
summon rebind (desktop) and the Chrome shortcuts link (extension).
