import { invoke } from "@tauri-apps/api/core";

// The desktop has no background timer of its own, so the inactivity watchdog
// lives in the webview: any user activity re-arms it, and on expiry it calls the
// Rust `lock` command (which also forgets the remembered passphrase). The chosen
// interval persists in localStorage so it survives relaunches.
const KEY = "twofau.autoLockMinutes";
const DEFAULT_MINUTES = 5;
let timer: number | undefined;

export function getAutoLockMinutes(): number {
  const n = Number(localStorage.getItem(KEY));
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MINUTES;
}

export function setAutoLockMinutes(minutes: number): void {
  localStorage.setItem(KEY, String(minutes));
  arm();
}

function arm(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = window.setTimeout(() => void invoke("lock"), getAutoLockMinutes() * 60_000);
}

/** Start the watchdog and reset it on any user activity. Call once on launch. */
export function initAutoLock(): void {
  arm();
  for (const ev of ["mousemove", "keydown", "mousedown", "wheel", "touchstart"]) {
    window.addEventListener(ev, arm, { passive: true });
  }
}
