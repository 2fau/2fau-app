/** Predefined account row tints. Each key maps to a vivid base accent CSS
 * variable (`--acct-<key>`, defined per-theme in globals.css); row backgrounds
 * and avatars derive translucent tints from it via `color-mix`, so a single
 * base colour drives a theme-aware gradient. This list drives the picker and
 * validates stored keys. */
export interface AccountColor {
  key: string;
  label: string;
}

export const ACCOUNT_COLORS: AccountColor[] = [
  { key: "red", label: "Red" },
  { key: "orange", label: "Orange" },
  { key: "yellow", label: "Yellow" },
  { key: "green", label: "Green" },
  { key: "teal", label: "Teal" },
  { key: "blue", label: "Blue" },
  { key: "purple", label: "Purple" },
  { key: "pink", label: "Pink" },
];

const KEYS = new Set(ACCOUNT_COLORS.map((c) => c.key));

/** The vivid base accent for a key, or undefined for none/unknown. Used for the
 * picker's solid swatches. */
export function accountColorVar(key: string): string | undefined {
  return key && KEYS.has(key) ? `var(--acct-${key})` : undefined;
}

/** A soft diagonal gradient for a row's background — the accent at low opacity,
 * composited over the theme background so it reads as a light tint in light mode
 * and a muted one in dark mode. Undefined for none. */
export function accountRowBackground(key: string): string | undefined {
  const c = accountColorVar(key);
  if (!c) return undefined;
  const mix = (pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
  // A soft "mesh" of overlapping radial blobs of the one accent — organic depth
  // rather than a flat wash. Blobs sit off the edges so the pooling reads as a
  // gentle glow behind the row content.
  return [
    `radial-gradient(110% 170% at 100% 0%, ${mix(34)} 0%, transparent 55%)`,
    `radial-gradient(90% 150% at 88% 115%, ${mix(26)} 0%, transparent 55%)`,
    `radial-gradient(80% 130% at 45% 130%, ${mix(14)} 0%, transparent 55%)`,
  ].join(", ");
}

/** A slightly stronger fill for the row's avatar, keeping it distinct from the
 * row tint. Undefined for none (the avatar then falls back to a muted fill). */
export function accountColorAccent(key: string): string | undefined {
  const c = accountColorVar(key);
  return c ? `color-mix(in srgb, ${c} 30%, transparent)` : undefined;
}

/** A crisp colored edge for the row card, so a tinted row reads as intentional
 * rather than a muddy fill (especially in dark mode). Undefined for none. */
export function accountColorBorder(key: string): string | undefined {
  const c = accountColorVar(key);
  return c ? `color-mix(in srgb, ${c} 24%, transparent)` : undefined;
}
