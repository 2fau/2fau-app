import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MenuBarView } from "@/components/menu-bar-view";
import { VaultProvider } from "@/state/vault-provider";
import { account, fakeService, renderWithVault } from "@/test/test-utils";

const many = (n: number) =>
  Array.from({ length: n }, (_, i) => account({ id: `id${i}`, issuer: `Issuer${i}`, label: `l${i}` }));

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  // jsdom's navigator.clipboard is getter-only; defineProperty overrides it.
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});

describe("MenuBarView", () => {
  it("shows the empty state with no accounts", async () => {
    renderWithVault(<MenuBarView onAdd={() => {}} onEdit={() => {}} />, fakeService([]));
    expect(await screen.findByText("No accounts yet")).toBeInTheDocument();
    expect(screen.getByText("0 accounts")).toBeInTheDocument();
  });

  it("hides the search bar at 5 accounts", async () => {
    renderWithVault(<MenuBarView onAdd={() => {}} onEdit={() => {}} />, fakeService(many(5)));
    await screen.findByText("Issuer0");
    expect(screen.queryByPlaceholderText("Search")).toBeNull();
    expect(screen.getByText("5 accounts")).toBeInTheDocument();
  });

  it("shows the search bar past 5 accounts", async () => {
    renderWithVault(<MenuBarView onAdd={() => {}} onEdit={() => {}} />, fakeService(many(6)));
    await screen.findByText("Issuer0");
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    expect(screen.getByText("6 accounts")).toBeInTheDocument();
  });

  it("flashes the clipboard icon red when nothing is importable", async () => {
    const user = userEvent.setup();
    const onQuickAdd = vi.fn().mockResolvedValue(false);
    renderWithVault(
      <MenuBarView onAdd={() => {}} onQuickAdd={onQuickAdd} onEdit={() => {}} />,
      fakeService([account()]),
    );
    const btn = screen.getByTitle("Add from clipboard");
    await user.click(btn);

    expect(onQuickAdd).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(btn).toHaveClass("text-destructive"));
  });

  it("does not flash when the clipboard opens the Add view", async () => {
    const user = userEvent.setup();
    const onQuickAdd = vi.fn().mockResolvedValue(true);
    renderWithVault(
      <MenuBarView onAdd={() => {}} onQuickAdd={onQuickAdd} onEdit={() => {}} />,
      fakeService([account()]),
    );
    const btn = screen.getByTitle("Add from clipboard");
    await user.click(btn);

    expect(onQuickAdd).toHaveBeenCalledTimes(1);
    expect(btn).not.toHaveClass("text-destructive");
  });

  it("focuses the search box on mount when it is visible", async () => {
    renderWithVault(<MenuBarView onAdd={() => {}} onEdit={() => {}} />, fakeService(many(6)));
    const input = await screen.findByPlaceholderText("Search");
    expect(input).toHaveFocus();
  });

  it("re-focuses the search box when focusNonce changes", async () => {
    const svc = fakeService(many(6));
    const { rerender } = render(
      <VaultProvider service={svc}>
        <MenuBarView onAdd={() => {}} onEdit={() => {}} focusNonce={0} />
      </VaultProvider>,
    );
    const input = await screen.findByPlaceholderText("Search");
    input.blur();
    expect(input).not.toHaveFocus();
    rerender(
      <VaultProvider service={svc}>
        <MenuBarView onAdd={() => {}} onEdit={() => {}} focusNonce={1} />
      </VaultProvider>,
    );
    await waitFor(() => expect(input).toHaveFocus());
  });
});
