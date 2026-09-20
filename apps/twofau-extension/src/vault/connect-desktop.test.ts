import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChrome } from "../test/fake-chrome";
import { createVaultService } from "./backend";
import { connectToDesktop, type ConnectDeps } from "./connect-desktop";
import { readSettings, writeSettings } from "./settings";

function deps(over: Partial<ConnectDeps> = {}) {
  return {
    ensurePermission: vi.fn(async () => true),
    pair: vi.fn(async () => {}),
    saveMode: vi.fn(async () => {}),
    ...over,
  };
}

beforeEach(() => {
  installFakeChrome();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("connectToDesktop", () => {
  it("pairs first and only then saves the mode", async () => {
    const d = deps();
    expect(await connectToDesktop("123456", "client", d)).toBe("paired");
    expect(d.pair).toHaveBeenCalledWith("123456");
    expect(d.saveMode).toHaveBeenCalledWith("client");
  });

  it("saves nothing when the loopback permission is declined", async () => {
    const d = deps({ ensurePermission: vi.fn(async () => false) });
    expect(await connectToDesktop("123456", "client", d)).toBe("permission-declined");
    expect(d.pair).not.toHaveBeenCalled();
    expect(d.saveMode).not.toHaveBeenCalled();
    expect((await readSettings()).mode).toBe("independent");
  });

  it("saves nothing when the desktop is unreachable", async () => {
    const d = deps({ pair: vi.fn(async () => Promise.reject(new Error("Desktop app not reachable"))) });
    await expect(connectToDesktop("123456", "sync", d)).rejects.toThrow(/not reachable/i);
    expect(d.saveMode).not.toHaveBeenCalled();
    expect((await readSettings()).mode).toBe("independent");
  });

  it("leaves the next popup start talking to the desktop, not chrome.storage", async () => {
    // What the reload after a successful connect does: the mode written here is
    // what picks the backend.
    const fetchMock = vi.fn(async () => new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    await writeSettings({ mode: "independent" });

    await connectToDesktop("123456", "client", {
      ...deps(),
      saveMode: async (mode) => {
        await writeSettings({ mode });
      },
    });

    const service = await createVaultService();
    expect(service.needsSetup()).toBe(true); // 404: the desktop has no vault yet
    expect(fetchMock).toHaveBeenCalled(); // …asked the desktop, not local storage
  });

  it("saves nothing when the pairing code has expired", async () => {
    const d = deps({ pair: vi.fn(async () => Promise.reject(new Error("Pairing failed (401)"))) });
    await expect(connectToDesktop("000000", "client", d)).rejects.toThrow(/401/);
    expect(d.saveMode).not.toHaveBeenCalled();
    expect((await readSettings()).mode).toBe("independent");
  });
});
