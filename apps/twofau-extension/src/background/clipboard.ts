import { COPY_MESSAGE, type CopyMessage } from "../shared/messages";

export { COPY_MESSAGE };

const OFFSCREEN_PATH = "offscreen.html";

/** Copy `text` to the clipboard. Needs no host permission and works on
 *  chrome:// pages and PDFs.
 *
 *  Chrome's service-worker background has no DOM, so it writes through an
 *  offscreen document. Firefox has no `offscreen` API, but its background is an
 *  event page *with* a DOM, so it writes directly. */
export async function copyToClipboard(text: string): Promise<void> {
  if ("offscreen" in chrome) {
    await ensureOffscreen();
    const message: CopyMessage = { type: COPY_MESSAGE, text };
    const response = (await chrome.runtime.sendMessage(message)) as { ok: boolean } | undefined;
    if (!response?.ok) throw new Error("Could not write to the clipboard.");
    return;
  }
  copyViaDom(text);
}

/** Direct clipboard write for a background page with a DOM (Firefox). execCommand
 *  is deprecated on the web but is the reliable path here — navigator.clipboard
 *  needs the document focus a background page lacks. */
function copyViaDom(text: string): void {
  const sink = document.createElement("textarea");
  sink.value = text;
  sink.style.position = "fixed";
  sink.style.top = "-1000px";
  sink.style.opacity = "0";
  document.body.append(sink);
  sink.select();
  const ok = document.execCommand("copy");
  sink.remove();
  if (!ok) throw new Error("Could not write to the clipboard.");
}

async function ensureOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
    justification: "Copy a one-time code to the clipboard from the context menu.",
  });
}
