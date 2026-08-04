import { invoke } from "@tauri-apps/api/core";
import type { Account, AddManualFields, Capabilities, VaultService } from "@twofau/ui";

/**
 * Desktop VaultService: every operation is a Tauri command handled by the
 * Rust-owned vault. Secrets stay in Rust — only account metadata and code
 * strings cross the boundary.
 */
export class TauriVaultService implements VaultService {
  private locked: boolean;
  private setup: boolean;

  constructor(startUnlocked: boolean, needsSetup: boolean) {
    this.locked = !startUnlocked;
    this.setup = needsSetup;
  }

  capabilities(): Capabilities {
    // Screen-scan is deferred; clipboard paste + QR image import work in the webview.
    return { scanScreen: false, qrImage: true, paste: true };
  }

  isLocked(): boolean {
    return this.locked;
  }

  /** Re-read the real lock state from Rust. The webview persists across the
   * popup's hide/show, so the idle watchdog can lock the vault out from under a
   * stale unlocked view; the UI calls this on show/focus to resync. */
  async refreshLockState(): Promise<boolean> {
    this.locked = await invoke<boolean>("is_locked");
    return this.locked;
  }

  needsSetup(): boolean {
    return this.setup;
  }

  async unlock(passphrase: string): Promise<void> {
    await invoke("unlock", { passphrase, remember: true });
    this.locked = false;
  }

  async lock(): Promise<void> {
    await invoke("lock");
    this.locked = true;
  }

  list(): Promise<Account[]> {
    return invoke("list_accounts");
  }

  addUri(otpauthUri: string): Promise<Account> {
    return invoke("add_uri", { uri: otpauthUri });
  }

  addManual(f: AddManualFields): Promise<Account> {
    return invoke("add_manual", {
      issuer: f.issuer,
      label: f.label,
      secretBase32: f.secretBase32,
      kind: f.type,
    });
  }

  async update(account: Account): Promise<void> {
    await invoke("update_account", { account });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await invoke("reorder", { ids: orderedIds });
  }

  async remove(id: string): Promise<void> {
    await invoke("remove_account", { id });
  }

  code(account: Account, unixTimeMs: number): Promise<string> {
    return invoke("code", { id: account.id, unixMs: Math.floor(unixTimeMs) });
  }

  async advanceHotp(id: string): Promise<void> {
    await invoke("advance_hotp", { id });
  }

  secretUri(id: string): Promise<string> {
    return invoke("secret_uri", { id });
  }

  /** The Rust-owned network time offset (trusted − local ms). Matches what the
   * tray's quick-copy uses, so displayed and copied codes stay in sync. */
  getTimeOffsetMs(): Promise<number> {
    return invoke("time_offset");
  }
}
