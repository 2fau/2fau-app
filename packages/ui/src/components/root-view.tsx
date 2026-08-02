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
  settingsSlot,
  onOpenSettings,
}: {
  onScan?: () => void;
  onQuit?: () => void;
  settingsSlot?: ReactNode;
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

  const onDone = () => setScreen({ name: "list" })

  return (
    <div className="w-[320px] bg-background text-foreground">
      {(() =>{
        if (locked) {
          if (needsSetup) {
            return <SetupView />
          }

          return <UnlockView />
        }

        if (screen.name === "add") {
          return <AddView prefill={screen.prefill} onDone={onDone} />

        }

        if (screen.name === "edit") {
          return <EditView account={screen.account} onDone={onDone} />
        }

        if (screen.name === "settings") {
          return <SettingsView onDone={onDone}>{settingsSlot}</SettingsView>
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
                    onOpenSettings ?? (settingsSlot ? () => setScreen({ name: "settings" }) : undefined)
                }
            />
        )
      })()}
    </div>
  );
}
