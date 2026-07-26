import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { account, fakeService, renderWithVault } from "@/test/test-utils";
import { RootView } from "./root-view";

function renderRoot(settingsSlot?: React.ReactNode) {
  return renderWithVault(<RootView settingsSlot={settingsSlot} />, fakeService([account()]));
}

describe("RootView settings slot", () => {
  it("shows no settings gear when no slot is provided", () => {
    renderRoot();
    expect(screen.queryByRole("button", { name: /settings/i })).toBeNull();
  });

  it("opens the slot content from the gear and returns via Back", async () => {
    const user = userEvent.setup();
    renderRoot(<p>bridge settings here</p>);

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByText("bridge settings here")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.queryByText("bridge settings here")).toBeNull();
  });

  it("calls onOpenSettings from the gear instead of opening an in-panel screen", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    renderWithVault(<RootView onOpenSettings={onOpenSettings} />, fakeService([account()]));

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    // It's an external action (open the options page), not the slot screen.
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
  });
});
