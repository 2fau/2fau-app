/**
 * Injected into the page: if the focused element is an editable text field,
 * insert `text` at the caret and report success. MUST be fully self-contained —
 * `chrome.scripting.executeScript` serializes it with `toString()` and runs it
 * in the page, so it may reference only DOM globals and its own argument (no
 * module-scope names, or the page throws ReferenceError).
 */
export function insertAtCaret(text: string): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;

  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    const field = el as HTMLInputElement & HTMLTextAreaElement;
    if (field.readOnly || field.disabled) return false;
    // Only free-text inputs accept a pasted code (skip checkbox/date/range/…).
    const textual = ["text", "search", "url", "tel", "email", "password", "number", ""];
    if (tag === "INPUT" && !textual.includes(field.type)) return false;

    try {
      const start = field.selectionStart ?? field.value.length;
      const end = field.selectionEnd ?? field.value.length;
      field.setRangeText(text, start, end, "end");
    } catch {
      // Some input types (e.g. number/email) reject setRangeText — append.
      field.value += text;
    }
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  if (el.isContentEditable) {
    try {
      if (document.execCommand("insertText", false, text)) return true;
    } catch {
      // fall through to a manual range insert
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      sel.collapseToEnd();
    } else {
      el.textContent = (el.textContent ?? "") + text;
    }
    return true;
  }

  return false;
}

/**
 * Try to paste `text` at the caret of `tabId`'s focused field. Returns whether
 * it landed in an editable field. Host access comes from `activeTab`, granted
 * just-in-time by the context-menu click — no standing host permission. A
 * restricted page (chrome://, the Web Store, a PDF) simply returns false.
 */
export async function pasteIntoActiveField(tabId: number, text: string): Promise<boolean> {
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: insertAtCaret,
      args: [text],
    });
    return injection?.result === true;
  } catch {
    return false;
  }
}
