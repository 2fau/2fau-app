import type { ReactNode } from "react";
import { RootView } from "@/components/root-view";
import type { VaultService } from "@/core/vault-service";
import { VaultProvider } from "@/state/vault-provider";

/** Top-level entry: wraps the panel in a VaultProvider bound to a host's
 * `VaultService`. Host-specific actions (screen scan, clipboard, quit) and an
 * optional settings panel are injected as props. */
export function TwoFAUApp({
  service,
  onScan,
  onQuit,
  settingsSlot,
  onOpenSettings,
  readClipboard,
}: {
  service: VaultService;
  onScan?: () => void;
  onQuit?: () => void;
  /** In-panel settings content (desktop): the gear opens a screen showing this. */
  settingsSlot?: ReactNode;
  /** External settings action (extension): the gear calls this instead — e.g.
   * opening the options page. Takes precedence over `settingsSlot`. */
  onOpenSettings?: () => void;
  /** How to read clipboard text for the quick-add icon. Injected because the
   * desktop must go through the Tauri clipboard plugin (the webview's
   * `navigator.clipboard` is unreliable); defaults to `navigator.clipboard`. */
  readClipboard?: () => Promise<string>;
}) {
  return (
    <VaultProvider service={service}>
      <RootView
        onScan={onScan}
        onQuit={onQuit}
        settingsSlot={settingsSlot}
        onOpenSettings={onOpenSettings}
        readClipboard={readClipboard}
      />
    </VaultProvider>
  );
}
