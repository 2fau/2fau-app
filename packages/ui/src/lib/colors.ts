/** Predefined account row tints. The actual colours are theme-aware CSS custom
 * properties (`--acct-<key>`, defined in globals.css) so each key renders a
 * light tint in light mode and a muted dark tint in dark mode. This list drives
 * the picker and validates stored keys. */
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

/** The CSS background value for a stored colour key, or undefined for none /
 * an unknown key (which then renders untinted). */
export function accountColorVar(key: string): string | undefined {
  return key && KEYS.has(key) ? `var(--acct-${key})` : undefined;
}
