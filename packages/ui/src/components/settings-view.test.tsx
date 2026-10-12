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
    locale: { get: async () => "en", set: async () => {} },
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

describe("SettingsView delete vault", () => {
  it("renders no delete row when the host cannot delete", () => {
    render(<SettingsView backend={backend()} />);
    expect(screen.queryByText(/delete vault/i)).not.toBeInTheDocument();
    // The rest of the screen is untouched.
    expect(screen.getByText(/export vault/i)).toBeInTheDocument();
  });

  it("deletes with the entered passphrase and leaves the confirmation", async () => {
    const deleteVault = vi.fn().mockResolvedValue(undefined);
    render(<SettingsView backend={backend({ deleteVault })} />);

    fireEvent.click(screen.getByText("Delete Vault"));
    fireEvent.change(await screen.findByPlaceholderText(/current password/i), {
      target: { value: "correct-horse" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^delete vault$/i }));

    await waitFor(() => expect(deleteVault).toHaveBeenCalledWith("correct-horse"));
    await waitFor(() => expect(screen.getByText(/export vault/i)).toBeInTheDocument());
  });

  it("shows the error and stays put when the passphrase is refused", async () => {
    const deleteVault = vi.fn().mockRejectedValue(new Error("Wrong password."));
    render(<SettingsView backend={backend({ deleteVault })} />);

    fireEvent.click(screen.getByText("Delete Vault"));
    fireEvent.change(await screen.findByPlaceholderText(/current password/i), {
      target: { value: "nope" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^delete vault$/i }));

    expect(await screen.findByText(/wrong password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/current password/i)).toBeInTheDocument();
  });

  it("deletes nothing when the user backs out", async () => {
    const deleteVault = vi.fn();
    render(<SettingsView backend={backend({ deleteVault })} />);

    fireEvent.click(screen.getByText("Delete Vault"));
    // The sub-screen's back button is labelled with the parent screen's name.
    fireEvent.click(await screen.findByRole("button", { name: /settings/i }));

    expect(deleteVault).not.toHaveBeenCalled();
  });
});
