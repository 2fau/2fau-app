import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/settings-view";
import { DEFAULT_QUICK_COPY } from "@/lib/hotkeys";
import type { SettingsBackend } from "@/core/settings";

function backend(over: Partial<SettingsBackend> = {}): SettingsBackend {
  return {
    version: "9.9.9",
    links: { feedback: "f", translate: "t", sourceCode: "s" },
    exportVault: async () => true,
    import: { kind: "native", run: async () => 0 },
    changePassphrase: async () => {},
    autoLock: { get: async () => 5, set: async () => {} },
    sync: { summary: "x", screen: <div /> },
    openLink: () => {},
    hotkeys: {
      getQuickCopy: async () => DEFAULT_QUICK_COPY,
      setQuickCopy: async () => {},
      summon: { kind: "rebindable", get: async () => "CmdOrCtrl+Shift+U", set: async () => {} },
    },
    ...over,
  };
}

describe("SettingsView hotkeys", () => {
  it("drills into Hotkeys and writes a new quick-copy config on toggle", async () => {
    const setQuickCopy = vi.fn().mockResolvedValue(undefined);
    const b = backend({
      hotkeys: {
        getQuickCopy: async () => DEFAULT_QUICK_COPY,
        setQuickCopy,
        summon: { kind: "rebindable", get: async () => "CmdOrCtrl+Shift+U", set: async () => {} },
      },
    });
    render(<SettingsView backend={b} />);
    fireEvent.click(await screen.findByText("Hotkeys"));
    const toggle = await screen.findByRole("button", { name: /quick-copy/i });
    fireEvent.click(toggle);
    await waitFor(() => expect(setQuickCopy).toHaveBeenCalled());
    expect(setQuickCopy.mock.calls[0][0].enabled).toBe(false);
  });

  it("offers Never in the Auto-Lock picker and writes 0 when chosen", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const b = backend({ autoLock: { get: async () => 5, set } });
    render(<SettingsView backend={b} />);
    fireEvent.click(await screen.findByText("Auto-Lock"));
    fireEvent.click(await screen.findByText("Never"));
    await waitFor(() => expect(set).toHaveBeenCalledWith(0));
  });

  it("shows the external summon binding and a change-in-browser row", async () => {
    const open = vi.fn();
    const b = backend({
      hotkeys: {
        getQuickCopy: async () => DEFAULT_QUICK_COPY,
        setQuickCopy: async () => {},
        summon: { kind: "external", get: async () => "⌘⇧U", open },
      },
    });
    render(<SettingsView backend={b} />);
    fireEvent.click(await screen.findByText("Hotkeys"));
    expect(await screen.findByText("⌘⇧U")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Change in browser…"));
    expect(open).toHaveBeenCalledTimes(1);
  });
});
