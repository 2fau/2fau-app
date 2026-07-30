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
  return c
    ? `conic-gradient(from 270deg at 50% -40%, color-mix(in srgb, ${c} 15%, transparent), color-mix(in srgb, ${c} 4%, transparent) 50%, color-mix(in srgb, ${c} 15%, transparent))`
    : undefined;
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
