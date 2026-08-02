import { useState } from "react";
import { AddView } from "@/components/add-view";
import { EditView } from "@/components/edit-view";
import { MenuBarView } from "@/components/menu-bar-view";
import { SetupView } from "@/components/setup-view";
import { UnlockView } from "@/components/unlock-view";
import { prefillFromClipboardText } from "@/lib/prefill";
import { useClipboard } from "@/state/clipboard";
import { useVault } from "@/state/vault-provider";
import { SettingsView } from "@/components/settings-view";

import type { ReactNode } from "react";
import type { AddPrefill } from "@/lib/prefill";
import type { Account } from "@/core/types";
import type { SettingsBackend } from "@/core/settings";

type Screen =
  | { name: "list" }
  | { name: "add"; prefill?: AddPrefill }
  | { name: "edit"; account: Account }
  | { name: "settings" };

/** Port of the Swift `RootView`: inline list/add/edit navigation within a fixed
 * 320px panel (no modals). Gated by the unlock screen when locked. An optional
 * host-provided `settingsSlot` adds a gear that opens a settings screen. */
export function RootView({
  onScan,
  onQuit,
  settingsBackend,
  onOpenSettings,
}: {
  onScan?: () => void;
  onQuit?: () => void;
  settingsBackend?: SettingsBackend;
  onOpenSettings?: () => void;
}) {
  const { locked, needsSetup } = useVault();
  const { readText } = useClipboard();
  const [screen, setScreen] = useState<Screen>({ name: "list" });

  // Open the Add screen seeded from the clipboard, but only when it holds a
  // valid otpauth:// URI or Base32 secret. Returns false (so the caller can
  // flash the icon) when there's nothing usable to import.
  async function openAddFromClipboard(): Promise<boolean> {
    let prefill: AddPrefill | null = null;
    try {
      prefill = await prefillFromClipboardText(await readText());
    } catch {
      prefill = null;
    }
    if (!prefill) return false;
    setScreen({ name: "add", prefill });
    return true;
  }

  const onDone = () => setScreen({ name: "list" });

  // A short view (unlock/setup/add/edit) that fills the fixed panel height and
  // scrolls when its form is taller than the panel.
  const fill = (view: ReactNode) => (
    <div className="macos-scroll min-h-0 flex-1 overflow-y-auto">{view}</div>
  );

  return (
    // Fixed panel height so the popup never resizes between views. The desktop
    // window tracks this (its ResizeObserver now reads a constant height); the
    // extension popup takes it directly. Each view fills it and scrolls its own
    // overflow, exactly like the account list.
    <div className="dark flex h-[458px] w-[320px] flex-col overflow-hidden bg-background text-foreground">
      {(() => {
        if (locked) {
          return fill(needsSetup ? <SetupView /> : <UnlockView />);
        }

        if (screen.name === "add") {
          return fill(<AddView prefill={screen.prefill} onDone={onDone} />);
        }

        if (screen.name === "edit") {
          return fill(<EditView account={screen.account} onDone={onDone} />);
        }

        if (screen.name === "settings" && settingsBackend) {
          return <SettingsView backend={settingsBackend} onClose={onDone} />;
        }

        return (
          <MenuBarView
            onAdd={() => setScreen({ name: "add" })}
            onQuickAdd={openAddFromClipboard}
            onEdit={(account) => setScreen({ name: "edit", account })}
            onScan={onScan}
            onQuit={onQuit}
            onOpenSettings={
              // An explicit external action (extension → options page) wins; else
              // the in-panel slot screen (desktop); else no gear.
              onOpenSettings ??
              (settingsBackend ? () => setScreen({ name: "settings" }) : undefined)
            }
          />
        );
      })()}
    </div>
  );
}
