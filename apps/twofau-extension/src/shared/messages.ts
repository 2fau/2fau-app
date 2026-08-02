// Shared by the service worker (sender) and the offscreen document (receiver).
// A single definition so the two ends can never drift onto different strings.
export const COPY_MESSAGE = "2fau.copy";

export interface CopyMessage {
  type: typeof COPY_MESSAGE;
  text: string;
}

// Popup → service worker: start a drag-to-select QR scan on the active tab. The
// popup can't run it itself (it closes the instant the user clicks the page), so
// the persistent worker captures the tab, injects the selection overlay, and
// decodes the chosen region.
export const SCAN_MESSAGE = "2fau.scan";

export interface ScanMessage {
  type: typeof SCAN_MESSAGE;
}
