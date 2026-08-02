import { decodeQrRegion } from "@twofau/ui";
import { createVaultService } from "../vault/backend";
import { initWasm } from "../wasm";
import { refreshContextMenu } from "./context-menu";

/** What the injected overlay resolves with: the selected rectangle in CSS
 * pixels plus the tab's devicePixelRatio, so the worker can map it onto the
 * (device-pixel) screenshot. */
interface Selection {
  x: number;
  y: number;
  width: number;
  height: number;
  devicePixelRatio: number;
}

/**
 * Runs *inside the page* (serialized by `executeScript`, so it must be fully
 * self-contained — no imports, no outer-scope references). Draws a macOS
 * screenshot-style dimmed overlay, lets the user drag a rectangle, and resolves
 * with it (or null on Escape / a too-small drag).
 */
function regionSelectOverlay(): Promise<Selection | null> {
  return new Promise((resolve) => {
    const w = window as unknown as { __twofauScan?: boolean };
    if (w.__twofauScan) {
      resolve(null);
      return;
    }
    w.__twofauScan = true;

    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      cursor: "crosshair",
      background: "rgba(0,0,0,0.28)",
    } as CSSStyleDeclaration);

    const hint = document.createElement("div");
    hint.textContent = "Drag to select the QR code  ·  Esc to cancel";
    Object.assign(hint.style, {
      position: "fixed",
      top: "14px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      font: "13px -apple-system, system-ui, sans-serif",
      color: "#fff",
      background: "rgba(0,0,0,0.65)",
      padding: "6px 12px",
      borderRadius: "8px",
      pointerEvents: "none",
    } as CSSStyleDeclaration);

    const sel = document.createElement("div");
    Object.assign(sel.style, {
      position: "fixed",
      display: "none",
      border: "1.5px solid #0a84ff",
      background: "rgba(10,132,255,0.12)",
      // Dims everything outside the selection (the macOS "hole" effect).
      boxShadow: "0 0 0 100vmax rgba(0,0,0,0.28)",
      pointerEvents: "none",
    } as CSSStyleDeclaration);

    overlay.appendChild(sel);
    document.documentElement.appendChild(overlay);
    document.documentElement.appendChild(hint);

    let startX = 0;
    let startY = 0;
    let dragging = false;

    function rectOf(e: MouseEvent) {
      return {
        x: Math.min(startX, e.clientX),
        y: Math.min(startY, e.clientY),
        width: Math.abs(e.clientX - startX),
        height: Math.abs(e.clientY - startY),
      };
    }

    function cleanup() {
      w.__twofauScan = false;
      document.removeEventListener("keydown", onKey, true);
      overlay.remove();
      hint.remove();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup();
        resolve(null);
      }
    }

    overlay.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      // Hand the dimming over to the selection's box-shadow so the chosen area
      // stays bright.
      overlay.style.background = "transparent";
      Object.assign(sel.style, {
        display: "block",
        left: `${startX}px`,
        top: `${startY}px`,
        width: "0px",
        height: "0px",
      } as CSSStyleDeclaration);
      e.preventDefault();
    });

    overlay.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const r = rectOf(e);
      Object.assign(sel.style, {
        left: `${r.x}px`,
        top: `${r.y}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
      } as CSSStyleDeclaration);
    });

    overlay.addEventListener("mouseup", (e) => {
      if (!dragging) return;
      dragging = false;
      const r = rectOf(e);
      cleanup();
      if (r.width < 8 || r.height < 8) {
        resolve(null);
        return;
      }
      resolve({ ...r, devicePixelRatio: window.devicePixelRatio || 1 });
    });

    document.addEventListener("keydown", onKey, true);
  });
}

/** Small toast so a background scan (popup already gone) still reports back. */
async function notify(message: string): Promise<void> {
  await chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
    title: "2FAU",
    message,
  });
}

/**
 * Capture the active tab, let the user drag-select the QR region, decode it, and
 * add the account. Orchestrated here (not in the popup) because the popup closes
 * the moment the user clicks into the page.
 */
export async function startRegionScan(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id == null) return;

    // Capture BEFORE injecting the overlay, so the dimming isn't in the shot.
    const dataUrl = await chrome.tabs.captureVisibleTab();

    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: regionSelectOverlay,
    });
    const sel = injection?.result as Selection | null | undefined;
    if (!sel) return; // cancelled, or the drag was too small to be intentional

    const dpr = sel.devicePixelRatio || 1;
    const uri = await decodeQrRegion(dataUrl, {
      x: sel.x * dpr,
      y: sel.y * dpr,
      width: sel.width * dpr,
      height: sel.height * dpr,
    });

    if (!uri) {
      await notify("No QR code found in the selection.");
      return;
    }
    if (!uri.startsWith("otpauth://")) {
      await notify("That QR code isn't a 2FA enrolment code.");
      return;
    }

    await initWasm();
    const service = await createVaultService();
    const account = await service.addUri(uri);
    await refreshContextMenu();
    await notify(`Added ${account.issuer || account.label || "account"} from QR code.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await notify(
      /lock/i.test(message) ? "Unlock 2FAU, then scan again." : "Couldn't scan this page.",
    );
  }
}
