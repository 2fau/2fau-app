import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MenuBarView } from "@/components/menu-bar-view";
import { ClipboardProvider } from "@/state/clipboard";
import { VaultProvider } from "@/state/vault-provider";
import type { VaultService } from "@/core/vault-service";
import { account, fakeService, renderWithVault } from "@/test/test-utils";

const many = (n: number) =>
  Array.from({ length: n }, (_, i) => account({ id: `id${i}`, issuer: `Issuer${i}`, label: `l${i}` }));

// Quick-copy writes via the injected ClipboardApi, so drive the spy through a
// ClipboardProvider. (navigator.clipboard can't be used here: userEvent.setup()
// installs its own clipboard stub that clobbers any override.)
const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
});

function renderWithClipboard(ui: ReactElement, service: VaultService) {
  return render(
    <ClipboardProvider writeText={writeText}>
      <VaultProvider service={service}>{ui}</VaultProvider>
    </ClipboardProvider>,
  );
}

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

  it("copies the first displayed account on Meta+1 and requests close", async () => {
    const user = userEvent.setup();
    const requestClose = vi.fn();
    const accts = many(6);
    const codes = Object.fromEntries(accts.map((a, i) => [a.id, `10000${i}`]));
    renderWithClipboard(
      <MenuBarView onAdd={() => {}} onEdit={() => {}} requestClose={requestClose} />,
      fakeService(accts, codes),
    );
    await screen.findByText("100 000"); // wait for codes to load, not just the row
    await user.keyboard("{Meta>}1{/Meta}");
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("100000"));
    await waitFor(() => expect(requestClose).toHaveBeenCalledTimes(1));
  });

  it("ignores a digit beyond the shown accounts", async () => {
    const user = userEvent.setup();
    const requestClose = vi.fn();
    const accts = many(6);
    const codes = Object.fromEntries(accts.map((a) => [a.id, "111111"]));
    renderWithClipboard(
      <MenuBarView onAdd={() => {}} onEdit={() => {}} requestClose={requestClose} />,
      fakeService(accts, codes),
    );
    await screen.findAllByText("111 111"); // codes loaded (every row shares it)
    await user.keyboard("{Meta>}6{/Meta}"); // Digit6 is not bound
    expect(writeText).not.toHaveBeenCalled();
    expect(requestClose).not.toHaveBeenCalled();
  });

  it("copies the top filtered account when a search is active", async () => {
    const user = userEvent.setup();
    const requestClose = vi.fn();
    const accts = many(6); // Issuer0..Issuer5
    const codes = Object.fromEntries(accts.map((a, i) => [a.id, `20000${i}`]));
    renderWithClipboard(
      <MenuBarView onAdd={() => {}} onEdit={() => {}} requestClose={requestClose} />,
      fakeService(accts, codes),
    );
    const searchBox = await screen.findByPlaceholderText("Search");
    await user.type(searchBox, "Issuer3"); // filters down to Issuer3 (code 200003)
    await screen.findByText("200 003"); // the only remaining row, codes loaded
    await user.keyboard("{Meta>}1{/Meta}");
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("200003"));
  });

  it("copies on a custom modifier combo (Ctrl+Alt+1)", async () => {
    const user = userEvent.setup();
    const accts = many(6);
    const codes = Object.fromEntries(accts.map((a, i) => [a.id, `30000${i}`]));
    renderWithClipboard(
      <MenuBarView
        onAdd={() => {}}
        onEdit={() => {}}
        quickCopy={{ enabled: true, mods: { mod: true, shift: false, alt: true } }}
      />,
      fakeService(accts, codes),
    );
    await screen.findByText("300 000");
    await user.keyboard("{Control>}{Alt>}1{/Alt}{/Control}");
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("300000"));
  });

  it("copies on nothing when quick-copy is disabled", async () => {
    const user = userEvent.setup();
    const accts = many(6);
    const codes = Object.fromEntries(accts.map((a) => [a.id, "999999"]));
    renderWithClipboard(
      <MenuBarView
        onAdd={() => {}}
        onEdit={() => {}}
        quickCopy={{ enabled: false, mods: { mod: true, shift: false, alt: false } }}
      />,
      fakeService(accts, codes),
    );
    await screen.findAllByText("999 999");
    await user.keyboard("{Meta>}1{/Meta}");
    expect(writeText).not.toHaveBeenCalled();
  });
});
