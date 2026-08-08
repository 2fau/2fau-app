export const DEFAULT_AUTO_LOCK_MINUTES = 15;
export const DEFAULT_BRIDGE_PORT = 4849;

const SETTINGS_KEY = "settings";

export type BridgeMode = "independent" | "client" | "sync";

export interface Settings {
  /** Minutes of inactivity before the session key is dropped. 0 means never. */
  autoLockMinutes: number;
  /** Where the local vault lives. "local" keeps it on this browser only. */
  storageArea: "sync" | "local";
  /** Which backend the UI talks to. */
  mode: BridgeMode;
  /** Desktop bridge port (host-permission pattern is port-agnostic). */
  bridgePort: number;
  /** Quick-copy 1–5 enable flag. */
  quickCopyEnabled: boolean;
  /** Quick-copy modifier token, e.g. "mod" or "mod+shift". */
  quickCopyMods: string;
}

const DEFAULTS: Settings = {
  autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
  storageArea: "sync",
  mode: "independent",
  bridgePort: DEFAULT_BRIDGE_PORT,
  quickCopyEnabled: true,
  quickCopyMods: "mod",
};

const MODES: BridgeMode[] = ["independent", "client", "sync"];

/**
 * Settings live in local storage, not sync: the storage-area choice itself has
 * to be answerable before we know where the vault is, and both the lock timeout
 * and the bridge connection are properties of this browser.
 *
 * Stored values are validated rather than trusted — a junk number reaching
 * chrome.alarms/fetch would throw.
 */
export async function readSettings(): Promise<Settings> {
  const got = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = (got[SETTINGS_KEY] ?? {}) as Partial<Record<keyof Settings, unknown>>;
  const minutes = stored.autoLockMinutes;
  const port = stored.bridgePort;
  return {
    autoLockMinutes:
      typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0
        ? minutes
        : DEFAULTS.autoLockMinutes,
    storageArea: stored.storageArea === "local" ? "local" : DEFAULTS.storageArea,
    mode: MODES.includes(stored.mode as BridgeMode) ? (stored.mode as BridgeMode) : DEFAULTS.mode,
    bridgePort:
      typeof port === "number" && Number.isInteger(port) && port > 0 && port < 65536
        ? port
        : DEFAULTS.bridgePort,
    quickCopyEnabled:
      typeof stored.quickCopyEnabled === "boolean"
        ? stored.quickCopyEnabled
        : DEFAULTS.quickCopyEnabled,
    quickCopyMods:
      typeof stored.quickCopyMods === "string" ? stored.quickCopyMods : DEFAULTS.quickCopyMods,
  };
}

export async function writeSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await readSettings()), ...patch };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}
