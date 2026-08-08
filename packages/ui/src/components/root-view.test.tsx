import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SettingsBackend } from "@/core/settings";
import { account, fakeService, renderWithVault } from "@/test/test-utils";
import { RootView } from "./root-view";

const fakeBackend: SettingsBackend = {
  version: "9.9.9",
  links: { feedback: "#", translate: "#", sourceCode: "#" },
  exportVault: async () => true,
  import: { kind: "native", run: async () => 0 },
  changePassphrase: async () => {},
  autoLock: { get: async () => 5, set: async () => {} },
  sync: { summary: "Off", screen: <p>sync body</p> },
  openLink: () => {},
  hotkeys: {
    getQuickCopy: async () => ({ enabled: true, mods: { mod: true, shift: false, alt: false } }),
    setQuickCopy: async () => {},
    summon: { kind: "rebindable", get: async () => "CmdOrCtrl+Shift+U", set: async () => {} },
  },
};

function renderRoot(settingsBackend?: SettingsBackend) {
  return renderWithVault(
    <RootView settingsBackend={settingsBackend} />,
    fakeService([account()]),
  );
}

describe("RootView settings", () => {
  it("shows no settings gear when no backend is provided", () => {
    renderRoot();
    expect(screen.queryByRole("button", { name: /settings/i })).toBeNull();
  });

  it("opens the settings screen from the gear and returns via Done", async () => {
    const user = userEvent.setup();
    renderRoot(fakeBackend);

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByText("Export Vault")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(screen.queryByText("Export Vault")).toBeNull();
  });

  it("calls onOpenSettings from the gear instead of opening an in-panel screen", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    renderWithVault(<RootView onOpenSettings={onOpenSettings} />, fakeService([account()]));

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    // It's an external action (open the options page), not the in-panel screen.
    expect(screen.queryByText("Export Vault")).toBeNull();
  });
});
