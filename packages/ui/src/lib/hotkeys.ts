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
  "MetaLeft",
  "MetaRight",
  "ControlLeft",
  "ControlRight",
  "ShiftLeft",
  "ShiftRight",
  "AltLeft",
  "AltRight",
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

/** Parse a Tauri accelerator ("CmdOrCtrl+Shift+U") back into a Chord for the
 * recorder's initial display. Unknown tokens are ignored. */
export function parseAccelerator(accel: string | null): Chord | null {
  if (!accel) return null;
  const c: Chord = { mod: false, shift: false, alt: false, key: "" };
  for (const p of accel.split("+")) {
    const t = p.toLowerCase();
    if (t === "cmdorctrl" || t === "command" || t === "control" || t === "ctrl" || t === "super" || t === "meta") {
      c.mod = true;
    } else if (t === "shift") {
      c.shift = true;
    } else if (t === "alt" || t === "option") {
      c.alt = true;
    } else {
      c.key = /^\d$/.test(p) ? `Digit${p}` : p.length === 1 ? `Key${p.toUpperCase()}` : p;
    }
  }
  return c;
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
