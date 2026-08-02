import type { VaultService } from "@twofau/ui";
import { StatusScreen, TwoFAUApp } from "@twofau/ui";
import { MonitorOff } from "lucide-react";
import ReactDOM from "react-dom/client";
import { BridgeUnreachableError } from "../bridge/connection";
import { SCAN_MESSAGE } from "../shared/messages";
import { createVaultService } from "../vault/backend";
import { readSettings } from "../vault/settings";
import { initWasm } from "../wasm";
import "../index.css";

function Failed({ message }: { message: string }) {
  return <p className="p-4 text-[13px] text-destructive">Could not start: {message}</p>;
}

function openSettings() {
  void chrome.runtime.openOptionsPage();
}

/** In Desktop-vault (client) mode the whole vault lives in the desktop app, so
 * if it's closed there's nothing to show. Render a proper empty state with a way
 * to reach Settings and switch modes, instead of a raw error. */
function DesktopUnavailable({ unreachable }: { unreachable: boolean }) {
  return (
    <StatusScreen
      icon={<MonitorOff className="size-10" />}
      title={unreachable ? "Desktop app is closed" : "Can’t reach the desktop vault"}
      message={
        unreachable
          ? "You’re using the desktop vault, so there’s nothing to show until the 2FAU desktop app is running (with the bridge enabled). Open the app, or switch modes in Settings."
          : "The desktop app is reachable but refused this browser. Re-pair it, or switch modes in Settings."
      }
      actions={[
        { label: "Open Settings", onClick: openSettings },
        { label: "Retry", variant: "secondary", onClick: () => window.location.reload() },
      ]}
    />
  );
}

async function bootstrap() {
  const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
  let service: VaultService;
  try {
    // WASM first: building the service already needs it to read the vault.
    await initWasm();
    service = await createVaultService();
  } catch (err) {
    // In client mode a failure here means the desktop app is down or unpaired —
    // show a recoverable empty state, not a dead error. Any other mode is a
    // genuine startup failure worth surfacing verbatim.
    const mode = await readSettings()
      .then((s) => s.mode)
      .catch(() => null);
    if (mode === "client") {
      root.render(<DesktopUnavailable unreachable={err instanceof BridgeUnreachableError} />);
    } else {
      root.render(<Failed message={err instanceof Error ? err.message : String(err)} />);
    }
    return;
  }
  root.render(
    <TwoFAUApp
      service={service}
      onOpenSettings={() => chrome.runtime.openOptionsPage()}
      onScan={() => {
        // The worker drives the drag-to-select scan: the popup closes the
        // instant the user clicks into the page, so it can't run the overlay
        // itself. It captures the tab, injects the selection UI, decodes the
        // chosen region, and reports back with a notification.
        void chrome.runtime.sendMessage({ type: SCAN_MESSAGE });
        window.close();
      }}
    />,
  );
}

void bootstrap();
