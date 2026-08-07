import { RootView } from "@/components/root-view";
import type { Account, ParsedOtp } from "@/core/types";
import type { VaultService } from "@/core/vault-service";
import type { SettingsBackend } from "@/core/settings";
import type { QuickCopyConfig } from "@/lib/hotkeys";
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
  parseMigration,
  readClipboard,
  writeClipboard,
  focusNonce,
  requestClose,
  quickCopy,
}: {
  service: VaultService;
  onScan?: () => void;
  onQuit?: () => void;
  /** Optional "belongs to the current page" test (extension smart-filter): the
   * list floats matching accounts to the top under a "For this site" caption. */
  matchAccount?: (a: Account) => boolean;
  /** Host decoder for Google Authenticator `otpauth-migration://` exports, used
   * by the bulk Import screen (WASM in the extension, a command on desktop). */
  parseMigration?: (uri: string) => Promise<ParsedOtp[]>;
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
  /** Bump to re-focus the search box (desktop window re-show). */
  focusNonce?: number;
  /** Dismiss the popup after a quick-copy (desktop hide / popup close). */
  requestClose?: () => void;
  /** Initial quick-copy config from the host's settings store. */
  quickCopy?: QuickCopyConfig;
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
          parseMigration={parseMigration}
          focusNonce={focusNonce}
          requestClose={requestClose}
          quickCopy={quickCopy}
        />
      </VaultProvider>
    </ClipboardProvider>
  );
}
