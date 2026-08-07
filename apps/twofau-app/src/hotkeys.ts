import { DEFAULT_QUICK_COPY, type QuickCopyConfig } from "@twofau/ui";

// The quick-copy modifier + enable flag persist in localStorage (like the
// auto-lock interval) so they survive relaunches. The summon shortcut is
// separate — it's an OS-level binding owned by the Rust side.
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
