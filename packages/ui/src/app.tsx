import { RootView } from "@/components/root-view";
import type { Account } from "@/core/types";
import type { VaultService } from "@/core/vault-service";
import type { SettingsBackend } from "@/core/settings";
import { ClipboardProvider } from "@/state/clipboard";
import { VaultProvider } from "@/state/vault-provider";

/** Top-level entry: wraps the panel in a VaultProvider bound to a host's
 * `VaultService`. Host-specific actions (screen scan, clipboard, quit) and an
 * optional settings panel are injected as props. */
export function TwoFAUApp({
  service,
  onScan,
  onQuit,
  settingsBackend,
  onOpenSettings,
  matchAccount,
  readClipboard,
  writeClipboard,
}: {
  service: VaultService;
  onScan?: () => void;
  onQuit?: () => void;
  /** Optional "belongs to the current page" test (extension smart-filter): the
   * list floats matching accounts to the top under a "For this site" caption. */
  matchAccount?: (a: Account) => boolean;
  /** In-panel settings (desktop): the gear opens the shared SettingsView driven
   * by this backend. */
  settingsBackend?: SettingsBackend;
  /** External settings action (extension): the gear calls this instead — e.g.
   * opening the options page. Takes precedence over `settingsBackend`. */
  onOpenSettings?: () => void;
  /** How to read/write the clipboard. Injected because the desktop must go
   * through the Tauri clipboard plugin (the webview's `navigator.clipboard` is
   * unreliable and ACL-gated); both default to `navigator.clipboard`. */
  readClipboard?: () => Promise<string>;
  writeClipboard?: (text: string) => Promise<void>;
}) {
  return (
    <ClipboardProvider readText={readClipboard} writeText={writeClipboard}>
      <VaultProvider service={service}>
        <RootView
          onScan={onScan}
          onQuit={onQuit}
          settingsBackend={settingsBackend}
          onOpenSettings={onOpenSettings}
          matchAccount={matchAccount}
        />
      </VaultProvider>
    </ClipboardProvider>
  );
}
