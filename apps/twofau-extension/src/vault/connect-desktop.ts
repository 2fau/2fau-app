import { ensureBridgePermission, pairBridge } from "../bridge/connection";
import { writeSettings, type BridgeMode } from "./settings";

export type ConnectOutcome = "paired" | "permission-declined";

/** What `connectToDesktop` needs from the browser; injectable so the ordering
 * rule below can be tested without a live bridge. */
export interface ConnectDeps {
  ensurePermission: () => Promise<boolean>;
  pair: (code: string) => Promise<void>;
  saveMode: (mode: BridgeMode) => Promise<void>;
}

const REAL: ConnectDeps = {
  ensurePermission: ensureBridgePermission,
  pair: pairBridge,
  saveMode: async (mode) => {
    await writeSettings({ mode });
  },
};

/**
 * First-run pairing: ask for the loopback permission, submit the desktop's
 * code, and only then persist the mode. The order is the point — a declined
 * permission or a failed pairing must leave the extension exactly as it was, so
 * the popup never comes back up in a mode it cannot serve.
 */
export async function connectToDesktop(
  code: string,
  mode: BridgeMode,
  deps: ConnectDeps = REAL,
): Promise<ConnectOutcome> {
  if (!(await deps.ensurePermission())) return "permission-declined";
  await deps.pair(code);
  await deps.saveMode(mode);
  return "paired";
}
