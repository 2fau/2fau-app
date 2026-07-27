import { readSettings } from "../vault/settings";

export const SYNC_ALARM = "2fau.sync";
/** chrome.alarms enforces a 1-minute floor for periodic alarms. */
export const SYNC_PERIOD_MINUTES = 1;

/** Arm the periodic sync alarm in sync mode; clear it otherwise. */
export async function ensureSyncAlarm(): Promise<void> {
  const { mode } = await readSettings();
  if (mode === "sync") {
    chrome.alarms.create(SYNC_ALARM, { periodInMinutes: SYNC_PERIOD_MINUTES });
  } else {
    await chrome.alarms.clear(SYNC_ALARM);
  }
}
