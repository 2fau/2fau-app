import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CrashReport, SettingsBackend } from "@/core/settings";
import { account, fakeService, renderWithVault } from "@/test/test-utils";
import { RootView } from "./root-view";

const fakeBackend: SettingsBackend = {
  version: "9.9.9",
  links: { feedback: "#", translate: "#", sourceCode: "#" },
  exportVault: async () => true,
  import: { kind: "native", run: async () => 0 },
  changePassphrase: async () => {},
  autoLock: { get: async () => 5, set: async () => {} },
  locale: { get: async () => "en", set: async () => {} },
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

const crash: CrashReport = {
  id: "crash-0000000000001-0000",
  message: "time sync exploded",
  text: "full report text",
  issueUrl: "https://github.com/2fau/2fau-app/issues/new?title=x",
};

function withCrashes(pending: CrashReport | null) {
  let notify = () => {};
  const crashReports = {
    pending: vi.fn(async () => pending),
    dismiss: vi.fn(async () => {}),
    subscribe: vi.fn((cb: () => void) => {
      notify = cb;
      return () => {};
    }),
  };
  const openLink = vi.fn();
  const backend: SettingsBackend = { ...fakeBackend, openLink, crashReports };
  return { backend, crashReports, openLink, notify: () => notify() };
}

describe("RootView crash dialog", () => {
  it("shows a pending crash on mount", async () => {
    renderRoot(withCrashes(crash).backend);
    expect(await screen.findByText("time sync exploded")).toBeInTheDocument();
  });

  it("renders nothing when there is no pending crash or no crashReports port", async () => {
    const { backend, crashReports } = withCrashes(null);
    renderRoot(backend);
    await waitFor(() => expect(crashReports.pending).toHaveBeenCalled());
    expect(screen.queryByRole("alertdialog")).toBeNull();

    renderRoot(fakeBackend);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("Report opens the issue URL and dismisses the report", async () => {
    const user = userEvent.setup();
    const { backend, crashReports, openLink } = withCrashes(crash);
    renderRoot(backend);
    await user.click(await screen.findByRole("button", { name: "Report on GitHub" }));
    expect(openLink).toHaveBeenCalledWith(crash.issueUrl);
    expect(crashReports.dismiss).toHaveBeenCalledWith(crash.id);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("Dismiss closes the dialog and marks the report seen", async () => {
    const user = userEvent.setup();
    const { backend, crashReports } = withCrashes(crash);
    renderRoot(backend);
    await user.click(await screen.findByRole("button", { name: "Dismiss" }));
    expect(crashReports.dismiss).toHaveBeenCalledWith(crash.id);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("shows a crash reported live without remounting", async () => {
    const h = withCrashes(null);
    renderRoot(h.backend);
    await waitFor(() => expect(h.crashReports.pending).toHaveBeenCalledTimes(1));
    h.crashReports.pending.mockResolvedValue(crash);
    act(() => h.notify());
    expect(await screen.findByText("time sync exploded")).toBeInTheDocument();
  });
});
