import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RootView } from "@/components/root-view";
import { account, fakeService, renderWithVault } from "@/test/test-utils";

describe("VaultProvider out-of-band lock resync", () => {
  it("shows the unlock screen when the vault locked while the popup was hidden", async () => {
    const svc = fakeService([account()]);
    let realLocked = false;
    // The desktop vault can lock out-of-band (idle watchdog); the UI resyncs on
    // show/focus via refreshLockState.
    svc.refreshLockState = async () => realLocked;

    renderWithVault(<RootView />, svc);
    expect(await screen.findByText("Google")).toBeInTheDocument();

    // Host locks the vault, then the popup regains focus.
    realLocked = true;
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(await screen.findByText(/enter your passphrase to unlock/i)).toBeInTheDocument();
    expect(screen.queryByText("Google")).toBeNull();
  });

  it("keeps the account view when the vault is still unlocked on focus", async () => {
    const svc = fakeService([account()]);
    svc.refreshLockState = async () => false;

    renderWithVault(<RootView />, svc);
    expect(await screen.findByText("Google")).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.queryByText(/enter your passphrase/i)).toBeNull();
  });
});
