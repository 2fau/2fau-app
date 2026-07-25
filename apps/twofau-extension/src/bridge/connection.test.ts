import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type FakeChrome, installFakeChrome } from "../test/fake-chrome";
import { writeSettings } from "../vault/settings";
import {
  BridgeUnreachableError,
  ensureBridgePermission,
  getBridgeToken,
  pairBridge,
  pingBridge,
} from "./connection";

let fake: FakeChrome;

beforeEach(() => {
  fake = installFakeChrome();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bridge connection", () => {
  it("pings the configured port and returns true on 200", async () => {
    await writeSettings({ bridgePort: 5000 });
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe("http://127.0.0.1:5000/ping");
      return new Response(JSON.stringify({ name: "2fau" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await pingBridge()).toBe(true);
  });

  it("reports unreachable as false rather than throwing from ping", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    expect(await pingBridge()).toBe(false);
  });

  it("pairs, stores the token, and sends it on later requests", async () => {
    const seen: Record<string, string | null> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.endsWith("/pair")) {
          return new Response(JSON.stringify({ token: "tok-123" }), { status: 200 });
        }
        seen.auth = new Headers(init?.headers).get("Authorization");
        return new Response(JSON.stringify({ name: "2fau" }), { status: 200 });
      }),
    );
    await pairBridge("ABCD-EFGH");
    expect(await getBridgeToken()).toBe("tok-123");
    await pingBridge();
    expect(seen.auth).toBe("Bearer tok-123");
  });

  it("rejects a failed pairing without storing a token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 401 })),
    );
    await expect(pairBridge("nope")).rejects.toThrow(/pair/i);
    expect(await getBridgeToken()).toBeNull();
  });

  it("surfaces a network failure as BridgeUnreachableError", async () => {
    await writeSettings({ mode: "client" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(pairBridge("x")).rejects.toBeInstanceOf(BridgeUnreachableError);
  });

  it("requests the loopback host permission", async () => {
    expect(await ensureBridgePermission()).toBe(true);
    expect(fake.permissions.granted.has("http://127.0.0.1/*")).toBe(true);
  });
});
