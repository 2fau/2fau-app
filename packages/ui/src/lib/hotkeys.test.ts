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
  return {
    code: "KeyU",
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...over,
  } as KeyboardEvent;
}

describe("hotkeys", () => {
  it("builds a chord from an event, ignoring lone modifier codes", () => {
    expect(chordFromEvent(key({ code: "KeyU", metaKey: true, shiftKey: true }))).toEqual({
      mod: true,
      shift: true,
      alt: false,
      key: "KeyU",
    });
    expect(chordFromEvent(key({ code: "MetaLeft", metaKey: true }))).toEqual({
      mod: true,
      shift: false,
      alt: false,
      key: "",
    });
  });

  it("treats ctrl as mod", () => {
    expect(chordFromEvent(key({ code: "KeyU", ctrlKey: true })).mod).toBe(true);
  });

  it("produces a Tauri accelerator", () => {
    const c: Chord = { mod: true, shift: true, alt: false, key: "KeyU" };
    expect(toAccelerator(c)).toBe("CmdOrCtrl+Shift+U");
    expect(toAccelerator({ mod: true, shift: false, alt: false, key: "Digit1" })).toBe(
      "CmdOrCtrl+1",
    );
  });

  it("formats for non-mac", () => {
    vi.stubGlobal("navigator", { platform: "Win32" });
    expect(formatChord({ mod: true, shift: true, alt: false, key: "KeyU" })).toBe("Ctrl+Shift+U");
    expect(formatChord({ mod: true, shift: false, alt: false })).toBe("Ctrl");
    vi.unstubAllGlobals();
  });

  it("validates summon and quick-copy mods", () => {
    expect(isValidSummon({ mod: true, shift: false, alt: false, key: "KeyU" })).toBe(true);
    expect(isValidSummon({ mod: true, shift: false, alt: false, key: "" })).toBe(false);
    expect(isValidSummon({ mod: false, shift: false, alt: false, key: "KeyU" })).toBe(false);
    expect(isValidQuickCopyMods({ mod: true, shift: false, alt: false })).toBe(true);
    expect(isValidQuickCopyMods({ mod: false, shift: false, alt: false })).toBe(false);
  });

  it("matches quick-copy only on the configured modifier + Digit1..5", () => {
    const cfg = DEFAULT_QUICK_COPY; // { enabled, mods:{mod:true} }
    expect(matchesQuickCopy(key({ code: "Digit1", metaKey: true }), cfg)).toBe(1);
    expect(matchesQuickCopy(key({ code: "Digit5", ctrlKey: true }), cfg)).toBe(5);
    expect(matchesQuickCopy(key({ code: "Digit6", metaKey: true }), cfg)).toBeNull();
    expect(matchesQuickCopy(key({ code: "Digit1", metaKey: true, shiftKey: true }), cfg)).toBeNull();
    expect(matchesQuickCopy(key({ code: "Digit1" }), cfg)).toBeNull();
    expect(matchesQuickCopy(key({ code: "Digit1", metaKey: true }), { ...cfg, enabled: false })).toBeNull();
  });

  it("round-trips mods tokens", () => {
    expect(modsToToken({ mod: true, shift: true, alt: false })).toBe("mod+shift");
    expect(modsFromToken("mod+shift")).toEqual({ mod: true, shift: true, alt: false });
    expect(modsFromToken("")).toEqual({ mod: false, shift: false, alt: false });
  });
});
