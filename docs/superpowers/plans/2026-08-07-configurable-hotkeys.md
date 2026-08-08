# Configurable Hotkeys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user define the global summon shortcut and the quick-copy (1–5) modifier in Settings, via a live key recorder, on both desktop and extension.

**Architecture:** A shared `hotkeys.ts` (types + parse/format/match helpers) and a `HotkeyRecorder` component live in `@twofau/ui`. `MenuBarView` reads a `QuickCopyConfig` (default preserves today's ⌘/Ctrl+1–5). A new `SettingsBackend.hotkeys` port drives a Hotkeys settings screen. Desktop re-registers its Rust global shortcut and persists to a file; the extension shows the browser binding and links to `chrome://extensions/shortcuts`.

**Tech Stack:** React 19 · Vitest + @testing-library · Tauri 2 (`tauri-plugin-global-shortcut`, already a dep) · shadcn settings-list.

## Global Constraints

- The UI never imports Tauri/Chrome APIs — host I/O goes through the `SettingsBackend` port and props. (`CLAUDE.md`)
- `mod` = ⌘ on macOS, Ctrl elsewhere (matches the existing quick-copy check).
- Quick-copy digits 1–5 are fixed; only the modifiers + an enable flag are configurable.
- Default summon `Mod+Shift+U`; default quick-copy `{ enabled: true, mods: { mod: true } }`. Defaults must reproduce today's behaviour exactly.
- Every behaviour change gets a Vitest test. Interactive OS (re)binding is manually GUI-verified — never a headless "confirmed". (`CLAUDE.md`)
- The extension global summon is **not** programmatically rebindable — Settings shows it and links to `chrome://extensions/shortcuts`.
- Conventional commits; scope optional.
- The full-crate `cargo fmt --check`/`clippy -D warnings` gate is already red on `main` from toolchain drift (`time_sync.rs` `map_or`, rustfmt reflows) — unrelated to this work. Verify your *own* diff is clean; don't fix unrelated files here.

Commands from repo root `~/Projects/2fau-tauri`. UI tests: `pnpm --filter @twofau/ui test -- --run <pattern>`.

---

### Task 1: Shared hotkeys library

**Files:**
- Create: `packages/ui/src/lib/hotkeys.ts`
- Create: `packages/ui/src/lib/hotkeys.test.ts`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Produces: `Mods`, `Chord`, `QuickCopyConfig` types; `DEFAULT_SUMMON`, `DEFAULT_QUICK_COPY`; `isMac()`, `chordFromEvent(e)`, `formatChord(c)`, `toAccelerator(c)`, `isValidSummon(c)`, `isValidQuickCopyMods(m)`, `matchesQuickCopy(e, cfg): number | null`, `modsToToken(m)`, `modsFromToken(s)`.

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/lib/hotkeys.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  chordFromEvent,
  DEFAULT_QUICK_COPY,
  formatChord,
  isValidQuickCopyMods,
  isValidSummon,
  matchesQuickCopy,
  modsFromToken,
  modsToToken,
  toAccelerator,
  type Chord,
} from "@/lib/hotkeys";

function key(over: Partial<KeyboardEvent>): KeyboardEvent {
  return { code: "KeyU", metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...over } as KeyboardEvent;
}

describe("hotkeys", () => {
  it("builds a chord from an event, ignoring lone modifier codes", () => {
    expect(chordFromEvent(key({ code: "KeyU", metaKey: true, shiftKey: true }))).toEqual({
      mod: true, shift: true, alt: false, key: "KeyU",
    });
    expect(chordFromEvent(key({ code: "MetaLeft", metaKey: true }))).toEqual({
      mod: true, shift: false, alt: false, key: "",
    });
  });

  it("treats ctrl as mod", () => {
    expect(chordFromEvent(key({ code: "KeyU", ctrlKey: true })).mod).toBe(true);
  });

  it("produces a Tauri accelerator", () => {
    const c: Chord = { mod: true, shift: true, alt: false, key: "KeyU" };
    expect(toAccelerator(c)).toBe("CmdOrCtrl+Shift+U");
    expect(toAccelerator({ mod: true, shift: false, alt: false, key: "Digit1" })).toBe("CmdOrCtrl+1");
  });

  it("formats for non-mac", () => {
    vi.stubGlobal("navigator", { platform: "Win32" });
    expect(formatChord({ mod: true, shift: true, alt: false, key: "KeyU" })).toBe("Ctrl+Shift+U");
    expect(formatChord({ mod: true, shift: false, alt: false })).toBe("Ctrl");
    vi.unstubAllGlobals();
  });

  it("validates summon and quick-copy mods", () => {
    expect(isValidSummon({ mod: true, shift: false, alt: false, key: "KeyU" })).toBe(true);
    expect(isValidSummon({ mod: true, shift: false, alt: false, key: "" })).toBe(false); // no main key
    expect(isValidSummon({ mod: false, shift: false, alt: false, key: "KeyU" })).toBe(false); // no modifier
    expect(isValidQuickCopyMods({ mod: true, shift: false, alt: false })).toBe(true);
    expect(isValidQuickCopyMods({ mod: false, shift: false, alt: false })).toBe(false);
  });

  it("matches quick-copy only on the configured modifier + Digit1..5", () => {
    const cfg = DEFAULT_QUICK_COPY; // { enabled, mods:{mod:true} }
    expect(matchesQuickCopy(key({ code: "Digit1", metaKey: true }), cfg)).toBe(1);
    expect(matchesQuickCopy(key({ code: "Digit5", ctrlKey: true }), cfg)).toBe(5);
    expect(matchesQuickCopy(key({ code: "Digit6", metaKey: true }), cfg)).toBeNull();
    expect(matchesQuickCopy(key({ code: "Digit1", metaKey: true, shiftKey: true }), cfg)).toBeNull(); // extra shift
    expect(matchesQuickCopy(key({ code: "Digit1" }), cfg)).toBeNull(); // no modifier
    expect(matchesQuickCopy(key({ code: "Digit1", metaKey: true }), { ...cfg, enabled: false })).toBeNull();
  });

  it("round-trips mods tokens", () => {
    expect(modsToToken({ mod: true, shift: true, alt: false })).toBe("mod+shift");
    expect(modsFromToken("mod+shift")).toEqual({ mod: true, shift: true, alt: false });
    expect(modsFromToken("")).toEqual({ mod: false, shift: false, alt: false });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @twofau/ui test -- --run hotkeys`
Expected: FAIL — module `@/lib/hotkeys` not found.

- [ ] **Step 3: Implement `hotkeys.ts`**

Create `packages/ui/src/lib/hotkeys.ts`:

```ts
export interface Mods {
  mod: boolean; // ⌘ on macOS, Ctrl elsewhere
  shift: boolean;
  alt: boolean;
}
export interface Chord extends Mods {
  /** "" for a modifier-only chord (quick-copy); else a KeyboardEvent.code like "KeyU" / "Digit1". */
  key: string;
}
export interface QuickCopyConfig {
  enabled: boolean;
  mods: Mods;
}

export const DEFAULT_SUMMON: Chord = { mod: true, shift: true, alt: false, key: "KeyU" };
export const DEFAULT_QUICK_COPY: QuickCopyConfig = {
  enabled: true,
  mods: { mod: true, shift: false, alt: false },
};

export function isMac(): boolean {
  return typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
}

const MOD_CODES = new Set([
  "MetaLeft", "MetaRight", "ControlLeft", "ControlRight",
  "ShiftLeft", "ShiftRight", "AltLeft", "AltRight",
]);

export function chordFromEvent(e: KeyboardEvent): Chord {
  return {
    mod: e.metaKey || e.ctrlKey,
    shift: e.shiftKey,
    alt: e.altKey,
    key: MOD_CODES.has(e.code) ? "" : e.code,
  };
}

function keyLabel(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}

export function formatChord(c: Chord | Mods): string {
  const mac = isMac();
  const parts: string[] = [];
  if (c.mod) parts.push(mac ? "⌘" : "Ctrl");
  if (c.alt) parts.push(mac ? "⌥" : "Alt");
  if (c.shift) parts.push(mac ? "⇧" : "Shift");
  const key = "key" in c && c.key ? keyLabel(c.key) : "";
  const sep = mac ? "" : "+";
  const mods = parts.join(sep);
  if (!key) return mods;
  return mods ? `${mods}${sep}${key}` : key;
}

export function toAccelerator(c: Chord): string {
  const parts: string[] = [];
  if (c.mod) parts.push("CmdOrCtrl");
  if (c.shift) parts.push("Shift");
  if (c.alt) parts.push("Alt");
  parts.push(keyLabel(c.key));
  return parts.join("+");
}

export function isValidSummon(c: Chord): boolean {
  return !!c.key && (c.mod || c.alt || c.shift);
}
export function isValidQuickCopyMods(m: Mods): boolean {
  return m.mod || m.alt || m.shift;
}

export function matchesQuickCopy(e: KeyboardEvent, cfg: QuickCopyConfig): number | null {
  if (!cfg.enabled) return null;
  const m = cfg.mods;
  if ((e.metaKey || e.ctrlKey) !== m.mod) return null;
  if (e.shiftKey !== m.shift) return null;
  if (e.altKey !== m.alt) return null;
  const hit = /^Digit([1-5])$/.exec(e.code);
  return hit ? Number(hit[1]) : null;
}

export function modsToToken(m: Mods): string {
  return [m.mod && "mod", m.shift && "shift", m.alt && "alt"].filter(Boolean).join("+");
}
export function modsFromToken(s: string): Mods {
  const set = new Set(s.split("+"));
  return { mod: set.has("mod"), shift: set.has("shift"), alt: set.has("alt") };
}
```

- [ ] **Step 4: Export from the package index**

In `packages/ui/src/index.ts`, after the `format` export line (`export { algorithmArg, formatCode, ... }`), add:

```ts
export {
  type Chord,
  type Mods,
  type QuickCopyConfig,
  DEFAULT_SUMMON,
  DEFAULT_QUICK_COPY,
  isMac,
  formatChord,
  toAccelerator,
  modsToToken,
  modsFromToken,
} from "@/lib/hotkeys";
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm --filter @twofau/ui test -- --run hotkeys`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/lib/hotkeys.ts packages/ui/src/lib/hotkeys.test.ts packages/ui/src/index.ts
git commit -m "feat(ui): hotkeys chord/config helpers"
```

---

### Task 2: HotkeyRecorder component

**Files:**
- Create: `packages/ui/src/components/hotkey-recorder.tsx`
- Create: `packages/ui/src/components/hotkey-recorder.test.tsx`

**Interfaces:**
- Consumes: `Chord`, `chordFromEvent`, `formatChord`, `isValidSummon`, `isValidQuickCopyMods` from Task 1.
- Produces: `HotkeyRecorder({ value, onChange, captureKey, error? })`.

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/components/hotkey-recorder.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HotkeyRecorder } from "@/components/hotkey-recorder";
import { DEFAULT_SUMMON, type Chord } from "@/lib/hotkeys";

describe("HotkeyRecorder", () => {
  it("captures a valid summon chord on keydown", () => {
    const onChange = vi.fn();
    render(<HotkeyRecorder value={DEFAULT_SUMMON} onChange={onChange} captureKey />);
    const field = screen.getByRole("button");
    fireEvent.focus(field);
    fireEvent.keyDown(field, { code: "KeyJ", metaKey: true, shiftKey: true });
    expect(onChange).toHaveBeenCalledWith<[Chord]>({ mod: true, shift: true, alt: false, key: "KeyJ" });
  });

  it("ignores a lone modifier in summon mode", () => {
    const onChange = vi.fn();
    render(<HotkeyRecorder value={DEFAULT_SUMMON} onChange={onChange} captureKey />);
    const field = screen.getByRole("button");
    fireEvent.focus(field);
    fireEvent.keyDown(field, { code: "MetaLeft", metaKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("captures modifiers-only on keyup in quick-copy mode", () => {
    const onChange = vi.fn();
    render(
      <HotkeyRecorder
        value={{ mod: true, shift: false, alt: false, key: "" }}
        onChange={onChange}
        captureKey={false}
      />,
    );
    const field = screen.getByRole("button");
    fireEvent.focus(field);
    fireEvent.keyDown(field, { code: "ShiftLeft", metaKey: true, shiftKey: true });
    fireEvent.keyUp(field, { code: "ShiftLeft" });
    expect(onChange).toHaveBeenCalledWith({ mod: true, shift: true, alt: false, key: "" });
  });

  it("shows an error message", () => {
    render(<HotkeyRecorder value={DEFAULT_SUMMON} onChange={() => {}} captureKey error="Taken by the OS" />);
    expect(screen.getByText("Taken by the OS")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @twofau/ui test -- --run hotkey-recorder`
Expected: FAIL — component missing.

- [ ] **Step 3: Implement the recorder**

Create `packages/ui/src/components/hotkey-recorder.tsx`:

```tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  chordFromEvent,
  formatChord,
  isValidQuickCopyMods,
  isValidSummon,
  type Chord,
} from "@/lib/hotkeys";

/** A "Press keys…" capture field. `captureKey` true records a full chord
 * (summon, needs a main key); false records modifiers only (quick-copy),
 * committing on key release so multi-modifier combos are captured. */
export function HotkeyRecorder({
  value,
  onChange,
  captureKey,
  error,
}: {
  value: Chord;
  onChange: (c: Chord) => void;
  captureKey: boolean;
  error?: string | null;
}) {
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<Chord | null>(null);

  function commit(c: Chord, el: HTMLElement) {
    onChange(c);
    setDraft(null);
    setRecording(false);
    el.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const c = chordFromEvent(e.nativeEvent);
    setDraft(c);
    if (captureKey && isValidSummon(c)) commit(c, e.currentTarget);
  }

  function onKeyUp(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!captureKey && draft && isValidQuickCopyMods(draft)) commit(draft, e.currentTarget);
  }

  const label = recording ? (draft ? formatChord(draft) : "Press keys…") : formatChord(value);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onFocus={() => setRecording(true)}
        onBlur={() => {
          setRecording(false);
          setDraft(null);
        }}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        className={cn(
          "rounded-md border px-3 py-1.5 text-center font-mono text-[13px]",
          recording && "ring-2 ring-primary",
        )}
      >
        {label}
      </button>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @twofau/ui test -- --run hotkey-recorder`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/hotkey-recorder.tsx packages/ui/src/components/hotkey-recorder.test.tsx
git commit -m "feat(ui): HotkeyRecorder capture field"
```

---

### Task 3: MenuBarView honours a QuickCopyConfig

**Files:**
- Modify: `packages/ui/src/components/menu-bar-view.tsx`
- Modify: `packages/ui/src/components/account-row.tsx`
- Modify: `packages/ui/src/app.tsx`
- Modify: `packages/ui/src/components/root-view.tsx`
- Test: `packages/ui/src/components/menu-bar-view.test.tsx`

**Interfaces:**
- Consumes: `matchesQuickCopy`, `formatChord`, `DEFAULT_QUICK_COPY`, `QuickCopyConfig` (Task 1).
- Produces: `MenuBarView`/`RootView`/`TwoFAUApp` accept `quickCopy?: QuickCopyConfig` (default `DEFAULT_QUICK_COPY`); `AccountRow` accepts `modLabel?: string`.

- [ ] **Step 1: Write the failing tests**

Append inside `describe("MenuBarView", ...)` in `menu-bar-view.test.tsx`:

```tsx
  it("copies on a custom modifier combo (Ctrl+Alt+1)", async () => {
    const user = userEvent.setup();
    const accts = many(6);
    const codes = Object.fromEntries(accts.map((a, i) => [a.id, `30000${i}`]));
    renderWithClipboard(
      <MenuBarView
        onAdd={() => {}}
        onEdit={() => {}}
        quickCopy={{ enabled: true, mods: { mod: true, shift: false, alt: true } }}
      />,
      fakeService(accts, codes),
    );
    await screen.findByText("300 000");
    await user.keyboard("{Control>}{Alt>}1{/Alt}{/Control}");
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("300000"));
  });

  it("copies on nothing when quick-copy is disabled", async () => {
    const user = userEvent.setup();
    const accts = many(6);
    const codes = Object.fromEntries(accts.map((a) => [a.id, "999999"]));
    renderWithClipboard(
      <MenuBarView
        onAdd={() => {}}
        onEdit={() => {}}
        quickCopy={{ enabled: false, mods: { mod: true, shift: false, alt: false } }}
      />,
      fakeService(accts, codes),
    );
    await screen.findAllByText("999 999");
    await user.keyboard("{Meta>}1{/Meta}");
    expect(writeText).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @twofau/ui test -- --run menu-bar-view`
Expected: FAIL — `quickCopy` prop unknown; disabled config still copies.

- [ ] **Step 3: Update MenuBarView**

In `packages/ui/src/components/menu-bar-view.tsx`:

Add to the imports at the top:
```tsx
import { DEFAULT_QUICK_COPY, formatChord, matchesQuickCopy, type QuickCopyConfig } from "@/lib/hotkeys";
```

Add `quickCopy` to the prop list with a default, and its type:
```tsx
  requestClose,
  quickCopy = DEFAULT_QUICK_COPY,
}: {
  // ...existing props...
  /** Which modifier + enable state drives the ⌘/Ctrl+1..5 quick-copy. */
  quickCopy?: QuickCopyConfig;
}) {
```

Replace the keydown handler's guard/match. Change the body of `onKey` from the
`(e.metaKey || e.ctrlKey) …` regex block to:
```tsx
    function onKey(e: KeyboardEvent) {
      const n = matchesQuickCopy(e, quickCopy);
      if (n == null) return;
      const target = displayed[n - 1];
      if (!target) return;
      const raw = codes[target.id] ?? "";
      if (!raw) return;
      e.preventDefault();
      void writeText(raw);
      setFlashId(target.id);
      window.setTimeout(() => setFlashId(null), 1000);
      window.setTimeout(() => requestClose?.(), 600);
    }
```
Add `quickCopy` to that effect's dependency array: `}, [displayed, codes, writeText, requestClose, quickCopy]);`

Update `hotkeyIndexOf` to hide badges when disabled:
```tsx
  const hotkeyIndexOf = (id: string) => {
    if (!quickCopy.enabled) return undefined;
    const i = displayed.findIndex((a) => a.id === id);
    return i >= 0 && i < MAX_VISIBLE_ROWS ? i + 1 : undefined;
  };
  const modLabel = formatChord(quickCopy.mods);
```

Pass `modLabel` to both `AccountRow` render sites (matched + rest), alongside the existing `flash`/`hotkeyIndex`:
```tsx
                        modLabel={modLabel}
```

- [ ] **Step 4: Update AccountRow badge**

In `packages/ui/src/components/account-row.tsx`, add `modLabel` to props:
```tsx
  flash,
  hotkeyIndex,
  modLabel,
}: {
  account: Account;
  onEdit: () => void;
  flash?: boolean;
  hotkeyIndex?: number;
  /** Formatted modifier shown before the digit in the hotkey hint (e.g. "⌘"). */
  modLabel?: string;
}) {
```

Replace the existing `hotkeyLabel` computation with:
```tsx
  const hotkeyLabel =
    hotkeyIndex != null
      ? `${modLabel ?? (navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl ")}${hotkeyIndex}`
      : null;
```

- [ ] **Step 5: Thread `quickCopy` through TwoFAUApp and RootView**

In `packages/ui/src/app.tsx`: add `quickCopy?: QuickCopyConfig` to the props type + destructure, import the type from `@/lib/hotkeys`, and pass `quickCopy={quickCopy}` to `RootView`.

In `packages/ui/src/components/root-view.tsx`: add `quickCopy?: QuickCopyConfig` to the props type + destructure, import the type, and pass `quickCopy={quickCopy}` to `MenuBarView`.

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm --filter @twofau/ui test -- --run menu-bar-view`
Expected: PASS (new cases + the existing ⌘+1 tests, which rely on the default config).

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/components/menu-bar-view.tsx packages/ui/src/components/account-row.tsx packages/ui/src/app.tsx packages/ui/src/components/root-view.tsx packages/ui/src/components/menu-bar-view.test.tsx
git commit -m "feat(ui): quick-copy honours a configurable modifier"
```

---

### Task 4: Settings port + Hotkeys screen + live state

**Files:**
- Modify: `packages/ui/src/core/settings.ts`
- Modify: `packages/ui/src/components/settings-view.tsx`
- Modify: `packages/ui/src/app.tsx`
- Modify: `packages/ui/src/components/root-view.tsx`
- Create: `packages/ui/src/components/settings-view.test.tsx`

**Interfaces:**
- Consumes: `HotkeyRecorder` (Task 2); `Chord`, `QuickCopyConfig`, `toAccelerator`, `formatChord`, `DEFAULT_SUMMON`, `DEFAULT_QUICK_COPY` (Task 1); `quickCopy` prop plumbing (Task 3).
- Produces: `SettingsBackend.hotkeys`; `SettingsView` accepts `onQuickCopyChange?`; `TwoFAUApp` owns quick-copy state seeded from its `quickCopy` prop.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/settings-view.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/settings-view";
import { DEFAULT_QUICK_COPY } from "@/lib/hotkeys";
import type { SettingsBackend } from "@/core/settings";

function backend(over: Partial<SettingsBackend> = {}): SettingsBackend {
  return {
    version: "9.9.9",
    links: { feedback: "f", translate: "t", sourceCode: "s" },
    exportVault: async () => true,
    import: { kind: "native", run: async () => 0 },
    changePassphrase: async () => {},
    autoLock: { get: async () => 5, set: async () => {} },
    sync: { summary: "x", screen: <div /> },
    openLink: () => {},
    hotkeys: {
      getQuickCopy: async () => DEFAULT_QUICK_COPY,
      setQuickCopy: async () => {},
      summon: { kind: "rebindable", get: async () => "CmdOrCtrl+Shift+U", set: async () => {} },
    },
    ...over,
  };
}

describe("SettingsView hotkeys", () => {
  it("drills into Hotkeys and writes a new quick-copy config on toggle", async () => {
    const setQuickCopy = vi.fn().mockResolvedValue(undefined);
    const b = backend({
      hotkeys: {
        getQuickCopy: async () => DEFAULT_QUICK_COPY,
        setQuickCopy,
        summon: { kind: "rebindable", get: async () => "CmdOrCtrl+Shift+U", set: async () => {} },
      },
    });
    render(<SettingsView backend={b} />);
    fireEvent.click(await screen.findByText("Hotkeys"));
    // Enable toggle present; turn quick-copy off.
    const toggle = await screen.findByRole("button", { name: /quick-copy/i });
    fireEvent.click(toggle);
    await waitFor(() => expect(setQuickCopy).toHaveBeenCalled());
    expect(setQuickCopy.mock.calls[0][0].enabled).toBe(false);
  });

  it("shows the external summon binding and a change-in-browser row", async () => {
    const open = vi.fn();
    const b = backend({
      hotkeys: {
        getQuickCopy: async () => DEFAULT_QUICK_COPY,
        setQuickCopy: async () => {},
        summon: { kind: "external", get: async () => "⌘⇧U", open },
      },
    });
    render(<SettingsView backend={b} />);
    fireEvent.click(await screen.findByText("Hotkeys"));
    expect(await screen.findByText("⌘⇧U")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Change in browser…"));
    expect(open).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @twofau/ui test -- --run settings-view`
Expected: FAIL — `hotkeys` missing on the port / no Hotkeys row.

- [ ] **Step 3: Extend the port**

In `packages/ui/src/core/settings.ts`, import the hotkey types at the top:
```ts
import type { Chord, QuickCopyConfig } from "@/lib/hotkeys";
```
Add to the `SettingsBackend` interface:
```ts
  /** Configurable hotkeys. `summon` differs by platform: desktop rebinds in
   * place; the extension can only show the binding and open the browser page. */
  hotkeys: {
    getQuickCopy: () => Promise<QuickCopyConfig>;
    setQuickCopy: (c: QuickCopyConfig) => Promise<void>;
    summon:
      | { kind: "rebindable"; get: () => Promise<string>; set: (accelerator: string) => Promise<void> }
      | { kind: "external"; get: () => Promise<string | null>; open: () => void };
  };
```
(The unused `Chord` import will be used once the screen imports through the package; if `tsc` flags it as unused here, drop it — the screen imports `Chord` from `@/lib/hotkeys` directly.)

- [ ] **Step 4: Add the Hotkeys screen to SettingsView**

In `packages/ui/src/components/settings-view.tsx`:

Add imports:
```tsx
import { Keyboard } from "lucide-react";
import { HotkeyRecorder } from "@/components/hotkey-recorder";
import { Toggle } from "@/components/ui/toggle";
import {
  DEFAULT_SUMMON,
  formatChord,
  toAccelerator,
  type Chord,
  type QuickCopyConfig,
} from "@/lib/hotkeys";
```

Extend the `Screen` union with `"hotkeys"`:
```tsx
type Screen = "main" | "password" | "import" | "autolock" | "sync" | "about" | "hotkeys";
```

Give `SettingsView` an `onQuickCopyChange` prop (used by the desktop to apply live):
```tsx
export function SettingsView({
  backend,
  onClose,
  onQuickCopyChange,
}: {
  backend: SettingsBackend;
  onClose?: () => void;
  /** Called after a successful quick-copy write so an in-panel host (desktop)
   * can apply it to the open list immediately. */
  onQuickCopyChange?: (c: QuickCopyConfig) => void;
}) {
```

Add the drill-in dispatch near the other `if (screen === …)` blocks:
```tsx
  if (screen === "hotkeys") {
    return (
      <HotkeysScreen
        backend={backend}
        onQuickCopyChange={onQuickCopyChange}
        onBack={() => setScreen("main")}
      />
    );
  }
```

Add a Hotkeys row inside the existing "Preferences" `SettingsGroup`, right after the Auto-Lock row:
```tsx
        <SettingsRow
          icon={<Keyboard />}
          iconBg="#5e5ce6"
          label="Hotkeys"
          chevron
          onClick={() => setScreen("hotkeys")}
        />
```

Add the screen component (near the other screen functions, e.g. before `AboutScreen`):
```tsx
function HotkeysScreen({
  backend,
  onQuickCopyChange,
  onBack,
}: {
  backend: SettingsBackend;
  onQuickCopyChange?: (c: QuickCopyConfig) => void;
  onBack: () => void;
}) {
  const [quickCopy, setQuickCopy] = useState<QuickCopyConfig | null>(null);
  const [summon, setSummon] = useState<string | null>(null);
  const [summonError, setSummonError] = useState<string | null>(null);

  useEffect(() => {
    void backend.hotkeys.getQuickCopy().then(setQuickCopy);
    void backend.hotkeys.summon.get().then(setSummon);
  }, [backend]);

  async function writeQuickCopy(next: QuickCopyConfig) {
    setQuickCopy(next);
    await backend.hotkeys.setQuickCopy(next);
    onQuickCopyChange?.(next);
  }

  async function writeSummon(chord: Chord) {
    if (backend.hotkeys.summon.kind !== "rebindable") return;
    const accel = toAccelerator(chord);
    setSummonError(null);
    try {
      await backend.hotkeys.summon.set(accel);
      setSummon(accel);
    } catch (e) {
      setSummonError(e instanceof Error ? e.message : String(e));
    }
  }

  const summonCap = backend.hotkeys.summon;

  return (
    <SettingsPage title="Hotkeys" onBack={onBack}>
      <SettingsGroup
        header="Show 2FAU"
        footer="The shortcut that opens the 2FAU popup from anywhere."
      >
        {summonCap.kind === "rebindable" ? (
          <div className="p-3">
            <HotkeyRecorder
              value={parseAccelerator(summon) ?? DEFAULT_SUMMON}
              onChange={(c) => void writeSummon(c)}
              captureKey
              error={summonError}
            />
          </div>
        ) : (
          <>
            <SettingsRow label="Current" value={summon ?? "Not set"} />
            <SettingsRow label="Change in browser…" chevron onClick={() => summonCap.open()} />
          </>
        )}
      </SettingsGroup>

      <SettingsGroup
        header="Quick-copy codes"
        footer="Copy an account's code with this modifier plus its number (1–5)."
      >
        <SettingsRow
          label="Quick-copy 1–5"
          trailing={
            <Toggle
              aria-label="Quick-copy 1–5"
              pressed={quickCopy?.enabled ?? false}
              onPressedChange={(on) =>
                void writeQuickCopy({
                  enabled: on,
                  mods: quickCopy?.mods ?? { mod: true, shift: false, alt: false },
                })
              }
            >
              {quickCopy?.enabled ? "On" : "Off"}
            </Toggle>
          }
        />
        {quickCopy?.enabled && (
          <div className="p-3">
            <HotkeyRecorder
              value={{ ...quickCopy.mods, key: "" }}
              onChange={(c) =>
                void writeQuickCopy({ enabled: true, mods: { mod: c.mod, shift: c.shift, alt: c.alt } })
              }
              captureKey={false}
            />
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              {formatChord(quickCopy.mods)} + 1–5
            </p>
          </div>
        )}
      </SettingsGroup>
    </SettingsPage>
  );
}

/** Parse a Tauri accelerator ("CmdOrCtrl+Shift+U") back into a Chord for the
 * recorder's initial display. Unknown tokens are ignored. */
function parseAccelerator(accel: string | null): Chord | null {
  if (!accel) return null;
  const parts = accel.split("+");
  const c: Chord = { mod: false, shift: false, alt: false, key: "" };
  for (const p of parts) {
    const t = p.toLowerCase();
    if (t === "cmdorctrl" || t === "command" || t === "control" || t === "ctrl" || t === "super" || t === "meta") c.mod = true;
    else if (t === "shift") c.shift = true;
    else if (t === "alt" || t === "option") c.alt = true;
    else c.key = /^\d$/.test(p) ? `Digit${p}` : p.length === 1 ? `Key${p.toUpperCase()}` : p;
  }
  return c;
}
```

- [ ] **Step 5: Own quick-copy state in TwoFAUApp (live desktop update)**

In `packages/ui/src/app.tsx`:
- Import `useState` from React and `DEFAULT_QUICK_COPY` from `@/lib/hotkeys`.
- Replace the pass-through of `quickCopy` with owned state:
```tsx
  const [quickCopy, setQuickCopy] = useState<QuickCopyConfig>(
    quickCopyProp ?? DEFAULT_QUICK_COPY,
  );
```
  Rename the incoming prop to `quickCopy: quickCopyProp` in the destructure.
- Pass both `quickCopy={quickCopy}` and `onQuickCopyChange={setQuickCopy}` to `RootView`.

In `packages/ui/src/components/root-view.tsx`:
- Add `onQuickCopyChange?: (c: QuickCopyConfig) => void` to the props type + destructure.
- Pass `onQuickCopyChange={onQuickCopyChange}` into the `SettingsView` render (the `screen.name === "settings"` branch).

- [ ] **Step 6: Run to verify it passes**

Run: `pnpm --filter @twofau/ui test -- --run settings-view && pnpm --filter @twofau/ui test`
Expected: PASS (new settings-view tests + whole suite).

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/core/settings.ts packages/ui/src/components/settings-view.tsx packages/ui/src/app.tsx packages/ui/src/components/root-view.tsx packages/ui/src/components/settings-view.test.tsx
git commit -m "feat(ui): Hotkeys settings screen + live quick-copy state"
```

---

### Task 5: Desktop frontend wiring

**Files:**
- Create: `apps/twofau-app/src/hotkeys.ts`
- Modify: `apps/twofau-app/src/settings-backend.tsx`
- Modify: `apps/twofau-app/src/main.tsx`

**Interfaces:**
- Consumes: `SettingsBackend.hotkeys` shape (Task 4); `QuickCopyConfig`, `DEFAULT_QUICK_COPY` (Task 1); the `get_global_shortcut`/`set_global_shortcut` commands (Task 6).
- Produces: desktop quick-copy persistence; `main.tsx` passes `quickCopy` to `TwoFAUApp`.

- [ ] **Step 1: Quick-copy localStorage store**

Create `apps/twofau-app/src/hotkeys.ts`:

```ts
import { DEFAULT_QUICK_COPY, type QuickCopyConfig } from "@twofau/ui";

const KEY = "twofau.quickCopy";

export function getQuickCopy(): QuickCopyConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_QUICK_COPY;
    const p = JSON.parse(raw) as Partial<QuickCopyConfig>;
    const m = (p.mods ?? {}) as Partial<QuickCopyConfig["mods"]>;
    return {
      enabled: typeof p.enabled === "boolean" ? p.enabled : DEFAULT_QUICK_COPY.enabled,
      mods: { mod: !!m.mod, shift: !!m.shift, alt: !!m.alt },
    };
  } catch {
    return DEFAULT_QUICK_COPY;
  }
}

export function setQuickCopy(c: QuickCopyConfig): void {
  localStorage.setItem(KEY, JSON.stringify(c));
}
```

- [ ] **Step 2: Wire the backend**

In `apps/twofau-app/src/settings-backend.tsx`:
- Import: `import { getQuickCopy, setQuickCopy } from "./hotkeys";`
- Add to the returned backend object:
```tsx
    hotkeys: {
      getQuickCopy: async () => getQuickCopy(),
      setQuickCopy: async (c) => setQuickCopy(c),
      summon: {
        kind: "rebindable",
        get: () => invoke<string>("get_global_shortcut"),
        set: (accelerator) => invoke("set_global_shortcut", { accelerator }),
      },
    },
```

- [ ] **Step 3: Pass quick-copy into the app**

In `apps/twofau-app/src/main.tsx`:
- Import: `import { getQuickCopy } from "./hotkeys";`
- In `Root`, compute once: `const quickCopy = useMemo(() => getQuickCopy(), []);`
- Add `quickCopy={quickCopy}` to the `<TwoFAUApp … />` props.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @twofau/app exec tsc --noEmit`
Expected: PASS. (Uses the workspace TS — a bare `npx tsc` picks up a stale global and errors on `allowImportingTsExtensions`.)

- [ ] **Step 5: Commit**

```bash
git add apps/twofau-app/src/hotkeys.ts apps/twofau-app/src/settings-backend.tsx apps/twofau-app/src/main.tsx
git commit -m "feat(app): wire configurable hotkeys into desktop settings"
```

---

### Task 6: Desktop global shortcut is configurable (Rust)

**Files:**
- Modify: `apps/twofau-app/src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: existing `toggle_window(&AppHandle)`, the `AppVault` path setup.
- Produces: `get_global_shortcut() -> String` and `set_global_shortcut(accelerator) -> Result<(), String>` commands; a persisted `shortcut` file; setup registers the persisted (or default) accelerator.

- [ ] **Step 1: Add a persisted-accelerator path + default constant**

In `apps/twofau-app/src-tauri/src/lib.rs`, near the other consts (e.g. after `const TRAY_RECENT`):
```rust
/// Default global summon accelerator, matching the extension's suggested key.
const DEFAULT_SHORTCUT: &str = "CmdOrCtrl+Shift+U";
```

Introduce a helper to hold the shortcut file path in managed state. Simplest:
store the path alongside the vault. In `setup`, after `let vault_path = …`, add:
```rust
            let shortcut_path = vault_path.with_file_name("shortcut");
            app.manage(ShortcutPath(shortcut_path.clone()));
```
And define near the top-level types:
```rust
/// Filesystem location of the persisted summon accelerator.
struct ShortcutPath(std::path::PathBuf);

fn read_shortcut(path: &std::path::Path) -> String {
    std::fs::read_to_string(path)
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_SHORTCUT.to_string())
}
```

- [ ] **Step 2: Register the persisted shortcut at setup**

Replace the hardcoded registration added previously:
```rust
            #[cfg(desktop)]
            app.global_shortcut()
                .on_shortcut("CmdOrCtrl+Shift+U", |app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })?;
```
with:
```rust
            #[cfg(desktop)]
            {
                let accel = read_shortcut(&shortcut_path);
                app.global_shortcut()
                    .on_shortcut(accel.as_str(), |app, _shortcut, event| {
                        if event.state() == ShortcutState::Pressed {
                            toggle_window(app);
                        }
                    })?;
            }
```

- [ ] **Step 3: Add the get/set commands**

Add these command fns (near the other `#[tauri::command]` fns):
```rust
#[tauri::command]
fn get_global_shortcut(path: State<ShortcutPath>) -> String {
    read_shortcut(&path.0)
}

/// Re-register the summon shortcut and persist it. On an invalid accelerator or
/// an OS registration failure, restore the previous binding and return the
/// error so the UI can show it and keep the old value.
#[tauri::command]
fn set_global_shortcut(
    app: AppHandle,
    path: State<ShortcutPath>,
    accelerator: String,
) -> Result<(), String> {
    let gs = app.global_shortcut();
    let previous = read_shortcut(&path.0);
    gs.unregister_all().map_err(|e| e.to_string())?;

    let register = |accel: &str| {
        app.global_shortcut()
            .on_shortcut(accel, |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    toggle_window(app);
                }
            })
    };

    if let Err(e) = register(accelerator.as_str()) {
        let _ = register(previous.as_str()); // best-effort rollback
        return Err(e.to_string());
    }
    std::fs::write(&path.0, &accelerator).map_err(|e| e.to_string())?;
    Ok(())
}
```
Add `State` to the `tauri::` import if not already imported (it is — used by other commands).

- [ ] **Step 4: Register the commands in the handler**

In the `tauri::generate_handler![…]` list, add:
```rust
            get_global_shortcut,
            set_global_shortcut,
```

- [ ] **Step 5: Build, test, and check your own formatting**

Run: `cargo build -p twofau-app`
Then: `cargo test -p twofau-app`
Then (your diff only): `rustfmt --check --edition 2021 apps/twofau-app/src-tauri/src/lib.rs` — inspect the diff; ensure no hunk touches the lines you added (pre-existing reflows elsewhere are expected — see Global Constraints).
Expected: build OK; tests pass; your new lines need no reformatting.

- [ ] **Step 6: Commit**

```bash
git add apps/twofau-app/src-tauri/src/lib.rs Cargo.lock
git commit -m "feat(app): configurable global summon shortcut (get/set commands + persistence)"
```

---

### Task 7: Extension wiring

**Files:**
- Modify: `apps/twofau-extension/src/vault/settings.ts`
- Modify: `apps/twofau-extension/src/options/options-view.tsx`
- Modify: `apps/twofau-extension/src/popup/main.tsx`

**Interfaces:**
- Consumes: `SettingsBackend.hotkeys` shape (Task 4); `QuickCopyConfig`, `modsToToken`, `modsFromToken`, `DEFAULT_QUICK_COPY` (Task 1).
- Produces: extension quick-copy persistence; the summon `external` capability; popup passes `quickCopy`.

- [ ] **Step 1: Add quick-copy fields to Settings**

In `apps/twofau-extension/src/vault/settings.ts`:
- Add to the `Settings` interface:
```ts
  /** Quick-copy 1–5 enable flag. */
  quickCopyEnabled: boolean;
  /** Quick-copy modifier token, e.g. "mod" or "mod+shift". */
  quickCopyMods: string;
```
- Add to `DEFAULTS`:
```ts
  quickCopyEnabled: true,
  quickCopyMods: "mod",
```
- In `readSettings`, validate and return them:
```ts
    quickCopyEnabled:
      typeof stored.quickCopyEnabled === "boolean" ? stored.quickCopyEnabled : DEFAULTS.quickCopyEnabled,
    quickCopyMods:
      typeof stored.quickCopyMods === "string" ? stored.quickCopyMods : DEFAULTS.quickCopyMods,
```

- [ ] **Step 2: Build the hotkeys backend in options**

In `apps/twofau-extension/src/options/options-view.tsx`:
- Import: `import { modsFromToken, modsToToken, type QuickCopyConfig } from "@twofau/ui";`
- Add a reader for the browser's summon binding:
```tsx
async function readSummonShortcut(): Promise<string | null> {
  const cmds = await chrome.commands.getAll();
  const cmd = cmds.find((c) => c.name === "_execute_action");
  return cmd?.shortcut ? cmd.shortcut : null;
}
```
- Add `hotkeys` to the `backend` object built in `useMemo`:
```tsx
      hotkeys: {
        getQuickCopy: async (): Promise<QuickCopyConfig> => {
          const s = await readSettings();
          return { enabled: s.quickCopyEnabled, mods: modsFromToken(s.quickCopyMods) };
        },
        setQuickCopy: async (c) => {
          await writeSettings({ quickCopyEnabled: c.enabled, quickCopyMods: modsToToken(c.mods) });
        },
        summon: {
          kind: "external",
          get: readSummonShortcut,
          open: () => void chrome.tabs.create({ url: "chrome://extensions/shortcuts" }),
        },
      },
```

- [ ] **Step 3: Pass quick-copy into the popup**

In `apps/twofau-extension/src/popup/main.tsx`:
- Import: `import { modsFromToken } from "@twofau/ui";`
- After `const [tab] = …` / before `root.render`, read the config:
```tsx
  const settings = await readSettings();
  const quickCopy = {
    enabled: settings.quickCopyEnabled,
    mods: modsFromToken(settings.quickCopyMods),
  };
```
  (`readSettings` is already imported in this file.)
- Add `quickCopy={quickCopy}` to the `<TwoFAUApp … />` props.

- [ ] **Step 4: Typecheck + build**

Run: `pnpm -r typecheck`
Then: `pnpm --filter @twofau/extension build`
Expected: typecheck PASS; extension builds. (`chrome.commands`/`chrome.tabs` are typed via `@types/chrome`.)

- [ ] **Step 5: Commit**

```bash
git add apps/twofau-extension/src/vault/settings.ts apps/twofau-extension/src/options/options-view.tsx apps/twofau-extension/src/popup/main.tsx
git commit -m "feat(ext): configurable quick-copy + summon shortcut link in settings"
```

---

### Task 8: Full verify + manual GUI check

**Files:** none.

- [ ] **Step 1: Full automated verify**

Run: `cargo test -p twofau-app && pnpm -r test && pnpm -r typecheck`
Expected: all PASS. (Skip the full-crate `cargo fmt --check`/`clippy` gate — pre-existing red on `main`; you already checked your own Rust diff in Task 6.)

- [ ] **Step 2: Manual GUI verification (report honestly — not headless)**

Desktop (`docs/DEVELOPMENT.md` run command):
- Settings → Hotkeys. Record a new summon (e.g. ⌘⌥K); confirm the popup now toggles on that combo and the old one no longer does; relaunch and confirm it persisted.
- Try an obviously-taken combo and confirm the error shows and the previous binding still works.
- Toggle quick-copy off → the ⌘1–5 shortcuts and row badges disappear; change the modifier → badges + copy follow it.

Extension (load the build):
- Options → Hotkeys shows the current summon binding; "Change in browser…" opens `chrome://extensions/shortcuts`.
- Change the quick-copy modifier; reopen the popup and confirm copy + badges follow it.

Report outcomes as manually verified; do not claim headless confirmation of the interactive paths.

---

## Self-Review

**Spec coverage:**
- Shared representation + helpers → Task 1. ✓
- Live key recorder → Task 2. ✓
- Quick-copy honours config (list + badge) → Task 3. ✓
- `SettingsBackend.hotkeys` port + Hotkeys screen + live desktop update → Task 4. ✓
- Desktop persistence + backend + summon rebind (JS) → Task 5; (Rust) → Task 6. ✓
- Extension quick-copy persistence + external summon (chrome.commands + shortcuts page) → Task 7. ✓
- Defaults reproduce current behaviour → `DEFAULT_QUICK_COPY`/`DEFAULT_SUMMON` (Task 1); existing ⌘1 tests still pass (Task 3 Step 6). ✓
- Testing + honest GUI-only reporting → Tasks 1–4 Vitest, Task 8 manual. ✓

**Placeholder scan:** none — every code/test step has literal content.

**Type consistency:** `Chord`/`Mods`/`QuickCopyConfig` are defined in Task 1 and used identically in Tasks 3–7. `SettingsBackend.hotkeys` (Task 4) matches what the desktop (Task 5) and extension (Task 7) construct — `getQuickCopy`/`setQuickCopy`/`summon.{kind,get,set|open}`. `matchesQuickCopy` returns `number | null`, consumed as the 1-based index in Task 3. `toAccelerator`/`parseAccelerator` are inverse (`"CmdOrCtrl+Shift+U"` ↔ chord). Desktop `set_global_shortcut(accelerator)` (Task 6) matches the JS `invoke("set_global_shortcut", { accelerator })` (Task 5).

**Note for the executor:** package names are `@twofau/ui`, `@twofau/app`, `@twofau/extension`; the Rust crate is `twofau-app`. Use the workspace TS (`pnpm --filter … exec tsc`), not a bare `npx tsc`.
