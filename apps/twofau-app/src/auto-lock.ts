import { invoke } from "@tauri-apps/api/core";

// The desktop has no background timer of its own, so the inactivity watchdog
// lives in the webview: any user activity re-arms it, and on expiry it calls the
// Rust `lock` command (which also forgets the remembered passphrase). The chosen
// interval persists in localStorage so it survives relaunches.
const KEY = "twofau.autoLockMinutes";
const DEFAULT_MINUTES = 5;
let timer: number | undefined;

export function getAutoLockMinutes(): number {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return DEFAULT_MINUTES;
  const n = Number(raw);
  // 0 is a valid stored value meaning "never lock"; only junk falls back.
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MINUTES;
}

export function setAutoLockMinutes(minutes: number): void {
  localStorage.setItem(KEY, String(minutes));
  arm();
}

function arm(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
  const minutes = getAutoLockMinutes();
  // 0 means never: leave the watchdog disarmed until the interval changes.
  if (minutes <= 0) return;
  timer = window.setTimeout(() => void invoke("lock"), minutes * 60_000);
}

/** Start the watchdog and reset it on any user activity. Call once on launch. */
export function initAutoLock(): void {
  arm();
  for (const ev of ["mousemove", "keydown", "mousedown", "wheel", "touchstart"]) {
    window.addEventListener(ev, arm, { passive: true });
  }
}
