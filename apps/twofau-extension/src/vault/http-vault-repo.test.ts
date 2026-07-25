import { deriveKey, newSalt, sealWithKey } from "@twofau/core-wasm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChrome } from "../test/fake-chrome";
import { bytesToB64 } from "./base64";
import { HttpVaultRepo } from "./http-vault-repo";

// A tiny in-memory stand-in for the desktop bridge over fetch.
function fakeDesktop(initial?: { revision: number; blob: Uint8Array }) {
  const box: { state: { revision: number; blob: Uint8Array } | null } = { state: initial ?? null };
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace(/^http:\/\/127\.0\.0\.1:\d+/, "");
    if (path === "/vault/revision") {
      return box.state
        ? new Response(JSON.stringify({ revision: box.state.revision }), { status: 200 })
        : new Response("{}", { status: 404 });
    }
    if (path === "/vault" && (init?.method ?? "GET") === "GET") {
      return box.state
        ? new Response(
            JSON.stringify({ revision: box.state.revision, blob: bytesToB64(box.state.blob) }),
            { status: 200 },
          )
        : new Response("{}", { status: 404 });
    }
    if (path === "/vault" && init?.method === "PUT") {
      const body = JSON.parse(String(init.body)) as { base_revision: number; blob: string };
      const cur = box.state?.revision ?? 0;
      if (body.base_revision !== cur) {
        return new Response(
          JSON.stringify({ revision: cur, blob: box.state ? bytesToB64(box.state.blob) : "" }),
          { status: 409 },
        );
      }
      const bytes = Uint8Array.from(atob(body.blob), (c) => c.charCodeAt(0));
      box.state = { revision: cur + 1, blob: bytes };
      return new Response(JSON.stringify({ revision: box.state.revision }), { status: 200 });
    }
    return new Response("{}", { status: 404 });
  });
  return { box, fetchMock };
}

async function sealedBlob(): Promise<Uint8Array> {
  const salt = await newSalt();
  const key = await deriveKey("pw-for-the-test", salt);
  return sealWithKey({ entries: [], tombstones: [] }, key, salt);
}

beforeEach(() => {
  installFakeChrome();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpVaultRepo", () => {
  it("reports no vault on 404", async () => {
    const { fetchMock } = fakeDesktop();
    vi.stubGlobal("fetch", fetchMock);
    const repo = new HttpVaultRepo();
    expect(await repo.hasVault()).toBe(false);
    expect(await repo.load()).toBeNull();
    expect(await repo.loadManifest()).toBeNull();
  });

  it("loads a blob with a revision and a real salt", async () => {
    const blob = await sealedBlob();
    const { fetchMock } = fakeDesktop({ revision: 3, blob });
    vi.stubGlobal("fetch", fetchMock);
    const repo = new HttpVaultRepo();

    const loaded = await repo.load();
    expect(loaded?.blob).toEqual(blob);
    expect(loaded?.manifest.revision).toBe(3);
    expect(loaded?.manifest.salt.length).toBeGreaterThan(0);
  });

  it("saves at the current revision and reports the new one", async () => {
    const blob = await sealedBlob();
    const { box, fetchMock } = fakeDesktop({ revision: 1, blob });
    vi.stubGlobal("fetch", fetchMock);
    const repo = new HttpVaultRepo();

    const salt = (await repo.load())?.manifest.salt as string;
    const result = await repo.save(blob, salt, 1, 1);
    expect(result.ok && result.manifest.revision).toBe(2);
    expect(box.state?.revision).toBe(2);
  });

  it("returns a conflict with the remote blob on a stale write", async () => {
    const blob = await sealedBlob();
    const { fetchMock } = fakeDesktop({ revision: 5, blob });
    vi.stubGlobal("fetch", fetchMock);
    const repo = new HttpVaultRepo();

    const salt = (await repo.load())?.manifest.salt as string;
    const result = await repo.save(blob, salt, 1, 1); // base 1 != current 5
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.conflict.manifest.revision).toBe(5);
      expect(result.conflict.blob).toEqual(blob);
    }
  });
});
