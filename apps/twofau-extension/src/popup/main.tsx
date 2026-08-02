import type { VaultService } from "@twofau/ui";
import { TwoFAUApp } from "@twofau/ui";
import ReactDOM from "react-dom/client";
import { SCAN_MESSAGE } from "../shared/messages";
import { createVaultService } from "../vault/backend";
import { initWasm } from "../wasm";
import "../index.css";

function Failed({ message }: { message: string }) {
  return <p className="p-4 text-[13px] text-destructive">Could not start: {message}</p>;
}

async function bootstrap() {
  const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
  let service: VaultService;
  try {
    // WASM first: building the service already needs it to read the vault.
    await initWasm();
    service = await createVaultService();
  } catch (err) {
    // A blank list would read as an empty vault, which is a lie. Say what broke.
    root.render(<Failed message={err instanceof Error ? err.message : String(err)} />);
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
