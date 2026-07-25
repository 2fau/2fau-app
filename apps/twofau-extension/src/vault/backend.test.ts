import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChrome } from "../test/fake-chrome";
import { bytesToB64 } from "./base64";
import { createVaultService } from "./backend";
import { writeSettings } from "./settings";

// An in-memory desktop the client mode talks to over fetch.
function fakeDesktop() {
  const box: { state: { revision: number; blob: Uint8Array } | null } = { state: null };
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace(/^http:\/\/127\.0\.0\.1:\d+/, "");
    const method = init?.method ?? "GET";
    if (path === "/vault/revision")
      return box.state
        ? new Response(JSON.stringify({ revision: box.state.revision }), { status: 200 })
        : new Response("{}", { status: 404 });
    if (path === "/vault" && method === "GET")
      return box.state
        ? new Response(
            JSON.stringify({ revision: box.state.revision, blob: bytesToB64(box.state.blob) }),
            { status: 200 },
          )
        : new Response("{}", { status: 404 });
    if (path === "/vault" && method === "PUT") {
      const body = JSON.parse(String(init?.body)) as { base_revision: number; blob: string };
      const cur = box.state?.revision ?? 0;
      if (body.base_revision !== cur)
        return new Response(
          JSON.stringify({ revision: cur, blob: box.state ? bytesToB64(box.state.blob) : "" }),
          { status: 409 },
        );
      box.state = {
        revision: cur + 1,
        blob: Uint8Array.from(atob(body.blob), (c) => c.charCodeAt(0)),
      };
      return new Response(JSON.stringify({ revision: box.state.revision }), { status: 200 });
    }
    return new Response("{}", { status: 404 });
  });
  return fetchMock;
}

const URI = "otpauth://totp/Acme:me@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme";

beforeEach(() => {
  installFakeChrome();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createVaultService — client mode", () => {
  it("runs the full add/list/code cycle against the desktop bridge", async () => {
    const desktop = fakeDesktop();
    vi.stubGlobal("fetch", desktop);
    await writeSettings({ mode: "client" });
    await chrome.storage.local.set({ "bridge.token": "tok" });

    const service = await createVaultService();
    expect(service.needsSetup()).toBe(true); // desktop has no vault yet
    await service.unlock("desktop-passphrase"); // creates the vault on the desktop
    const added = await service.addUri(URI);
    expect(added.issuer).toBe("Acme");
    expect(await service.code(added, 59_000)).toMatch(/^\d{6}$/);

    // It actually went over the bridge, not chrome.storage. Without the switch
    // this fails: fetch is never called and no manifest lands in the desktop.
    expect(desktop).toHaveBeenCalledWith(
      expect.stringContaining("/vault"),
      expect.objectContaining({ method: "PUT" }),
    );
    const local = await chrome.storage.local.get(null);
    const sync = await chrome.storage.sync.get(null);
    expect(local["vault.manifest"]).toBeUndefined();
    expect(sync["vault.manifest"]).toBeUndefined();

    // A fresh service instance sees the same vault via the bridge.
    const reopened = await createVaultService();
    await reopened.unlock("desktop-passphrase");
    expect((await reopened.list()).map((a) => a.id)).toEqual([added.id]);
  });

  it("stays on chrome.storage in independent mode", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await writeSettings({ mode: "independent" });
    const service = await createVaultService();
    await service.unlock("local-passphrase");
    await service.addUri(URI);
    expect(fetchMock).not.toHaveBeenCalled(); // never touches the bridge
  });
});
