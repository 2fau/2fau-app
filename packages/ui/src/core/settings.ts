import type { ReactNode } from "react";
import type { QuickCopyConfig } from "@/lib/hotkeys";

/** External links surfaced in the second settings section. */
export interface SettingsLinks {
  feedback: string;
  translate: string;
  sourceCode: string;
}

/**
 * How the host imports a vault file. The two platforms differ:
 * - `native`: the host opens its own file picker (desktop → Tauri dialog).
 * - `file`: the shared UI renders an `<input type="file">` and hands the File
 *   back (extension → browser download/upload).
 * Both resolve with the resulting account count; `native.run` resolves `null`
 * when the user cancels the picker.
 */
export type ImportSpec =
  | { kind: "native"; run: (passphrase: string) => Promise<number | null> }
  | { kind: "file"; run: (file: File, passphrase: string) => Promise<number> };

/** Everything the shared `SettingsView` needs from a host. Sync is a platform
 * component (the desktop bridge vs. the extension's mode + pairing), injected as
 * a ready-made sub-screen. */
export interface SettingsBackend {
  /** App/extension version, shown in the footer and About screen. */
  version: string;
  links: SettingsLinks;
  /** Save the encrypted vault. Resolves true if saved, false if cancelled. */
  exportVault: () => Promise<boolean>;
  import: ImportSpec;
  changePassphrase: (current: string, next: string) => Promise<void>;
  autoLock: {
    get: () => Promise<number>;
    set: (minutes: number) => Promise<void>;
  };
  /** Launch-on-login toggle. Desktop-only; omitted where the platform can't
   * self-register at startup (e.g. the browser extension). */
  autostart?: {
    get: () => Promise<boolean>;
    set: (enabled: boolean) => Promise<void>;
  };
  /** Platform-specific Sync sub-screen, plus a short summary for its row. */
  sync: { summary?: string; screen: ReactNode };
  /** Open an external URL (opener plugin on desktop, `window.open` in the ext). */
  openLink: (url: string) => void;
  /** Configurable hotkeys. `summon` differs by platform: desktop rebinds in
   * place; the extension can only show the binding and open the browser page. */
  hotkeys: {
    getQuickCopy: () => Promise<QuickCopyConfig>;
    setQuickCopy: (c: QuickCopyConfig) => Promise<void>;
    summon:
      | { kind: "rebindable"; get: () => Promise<string>; set: (accelerator: string) => Promise<void> }
      | { kind: "external"; get: () => Promise<string | null>; open: () => void };
  };
}

/** Auto-lock choices offered in the picker, in minutes. `0` means never. */
export const AUTO_LOCK_OPTIONS = [1, 5, 15, 30, 60, 0] as const;
