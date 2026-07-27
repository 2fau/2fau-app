import { ChevronLeft } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AddView } from "@/components/add-view";
import { EditView } from "@/components/edit-view";
import { MenuBarView } from "@/components/menu-bar-view";
import { SetupView } from "@/components/setup-view";
import { Button } from "@/components/ui/button";
import { UnlockView } from "@/components/unlock-view";
import type { Account } from "@/core/types";
import { type AddPrefill, prefillFromClipboardText } from "@/lib/prefill";
import { useVault } from "@/state/vault-provider";

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
  const [screen, setScreen] = useState<Screen>({ name: "list" });

  // Open the Add screen with fields seeded from the clipboard. Any failure
  // (empty/unreadable clipboard, unparseable otpauth) just opens an empty form.
  async function openAddFromClipboard() {
    let prefill: AddPrefill | undefined;
    try {
      prefill = (await prefillFromClipboardText(await navigator.clipboard.readText())) ?? undefined;
    } catch {
      prefill = undefined;
    }
    setScreen({ name: "add", prefill });
  }

  return (
    <div className="w-[320px] bg-background text-foreground">
      {locked ? (
        needsSetup ? (
          <SetupView />
        ) : (
          <UnlockView />
        )
      ) : screen.name === "add" ? (
        <AddView prefill={screen.prefill} onDone={() => setScreen({ name: "list" })} />
      ) : screen.name === "edit" ? (
        <EditView account={screen.account} onDone={() => setScreen({ name: "list" })} />
      ) : screen.name === "settings" ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 border-b p-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Back"
              onClick={() => setScreen({ name: "list" })}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-[13px] font-medium">Settings</span>
          </div>
          <div className="p-3">{settingsSlot}</div>
        </div>
      ) : (
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
      )}
    </div>
  );
}
