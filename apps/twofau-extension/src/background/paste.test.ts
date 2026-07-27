import { beforeEach, describe, expect, it, vi } from "vitest";
import { type FakeChrome, installFakeChrome } from "../test/fake-chrome";
import { insertAtCaret, pasteIntoActiveField } from "./paste";

let fake: FakeChrome;

beforeEach(() => {
  fake = installFakeChrome();
  document.body.innerHTML = "";
});

describe("insertAtCaret", () => {
  it("inserts at the caret of a focused text input", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = "ab";
    document.body.appendChild(input);
    input.focus();
    input.setSelectionRange(1, 1); // caret between "a" and "b"

    expect(insertAtCaret("XYZ")).toBe(true);
    expect(input.value).toBe("aXYZb");
  });

  it("replaces the current selection in a textarea", () => {
    const ta = document.createElement("textarea");
    ta.value = "one two";
    document.body.appendChild(ta);
    ta.focus();
    ta.setSelectionRange(0, 3); // "one"

    expect(insertAtCaret("123")).toBe(true);
    expect(ta.value).toBe("123 two");
  });

  it("refuses read-only and non-text inputs", () => {
    const ro = document.createElement("input");
    ro.readOnly = true;
    document.body.appendChild(ro);
    ro.focus();
    expect(insertAtCaret("x")).toBe(false);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    document.body.appendChild(checkbox);
    checkbox.focus();
    expect(insertAtCaret("x")).toBe(false);
  });

  it("returns false when nothing editable is focused", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    (document.activeElement as HTMLElement | null)?.blur?.();
    expect(insertAtCaret("x")).toBe(false);
  });
});

describe("pasteIntoActiveField", () => {
  it("runs the injector against the tab and reports the field was filled", async () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.appendChild(input);
    input.focus();

    expect(await pasteIntoActiveField(7, "482913")).toBe(true);
    expect(input.value).toBe("482913");
    expect(fake.scripting.calls[0].target).toEqual({ tabId: 7 });
  });

  it("returns false when nothing editable is focused (falls back to copy)", async () => {
    document.body.innerHTML = "<div>plain page</div>";
    (document.activeElement as HTMLElement | null)?.blur?.();
    expect(await pasteIntoActiveField(7, "482913")).toBe(false);
  });

  it("returns false when injection is blocked (restricted page)", async () => {
    fake.scripting.executeScript = vi.fn().mockRejectedValue(new Error("Cannot access chrome://"));
    expect(await pasteIntoActiveField(7, "482913")).toBe(false);
  });
});
