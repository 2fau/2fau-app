import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { SettingsBackend } from "@twofau/ui";
import { BridgeSettings } from "./bridge-settings";
import { getAutoLockMinutes, setAutoLockMinutes } from "./auto-lock";
import { getQuickCopy, setQuickCopy } from "./hotkeys";

/** External links surfaced in Settings. Edit these to point at the real repo. */
const LINKS = {
  sourceCode: "https://github.com/2fau/2fau-app",
  feedback: "https://github.com/2fau/2fau-app/issues",
  translate: "https://github.com/2fau/2fau-app",
};

/** The desktop's SettingsBackend: vault ops are Tauri commands (secrets stay in
 * Rust), auto-lock is the webview watchdog, and Sync is the bridge panel. */
export function tauriSettingsBackend(version: string): SettingsBackend {
  return {
    version,
    links: LINKS,
    exportVault: () => invoke<boolean>("export_vault"),
    import: {
      kind: "native",
      run: (passphrase) => invoke<number | null>("import_vault", { passphrase }),
    },
    changePassphrase: (current, next) =>
      invoke("change_passphrase", { current, next }),
    autoLock: {
      get: async () => getAutoLockMinutes(),
      set: async (minutes) => setAutoLockMinutes(minutes),
    },
    sync: { summary: "Desktop bridge", screen: <BridgeSettings /> },
    openLink: (url) => void openUrl(url),
    hotkeys: {
      getQuickCopy: async () => getQuickCopy(),
      setQuickCopy: async (c) => setQuickCopy(c),
      summon: {
        kind: "rebindable",
        get: () => invoke<string>("get_global_shortcut"),
        set: (accelerator) => invoke("set_global_shortcut", { accelerator }),
      },
    },
  };
}
