# SP5 Phase B — Extension Desktop-Client Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the extension run in **desktop-client mode** — holding no vault of its own, proxying every operation to the Phase A bridge over `http://127.0.0.1:<port>` — selectable from the options page with a pairing step.

**Architecture:** Extract a `VaultRepoPort` interface from the existing `VaultRepo`, then implement `HttpVaultRepo` (the same four methods over the bridge). Client mode is `ExtensionVaultService` over an `HttpVaultRepo` — the SP4 revision-guard/merge logic reused unchanged. A `bridge/connection.ts` module owns the optional host permission, token, `bridgeFetch`, and pairing. The options page gains a mode selector and pair flow.

**Tech Stack:** TypeScript, MV3 (`chrome.permissions`, `chrome.storage.local`), `fetch`, `@twofau/core-wasm` (`vaultSalt`), Vitest + jsdom.

**Scope note:** Phase B of SP5. Depends on Phase A (merged): the bridge server, its endpoints, and pairing. Phase C (sync mode) is a separate plan. This plan does NOT add sync — the options mode selector offers only **Independent** and **Desktop app** here; the `"sync"` value is defined in the type but routes to independent until Phase C.

## Global Constraints

- Spec: `docs/specs/2026-07-23-subproject5-desktop-bridge.md`. Every task implicitly includes it.
- The bridge moves the **sealed blob only** — never plaintext.
- Host permission is **optional** (`http://127.0.0.1/*`, port-agnostic), requested at runtime only when a bridge mode is turned on. Independent-mode users keep zero host access.
- The bearer token lives in `chrome.storage.local` (grants access only to ciphertext, revocable from the desktop). The passphrase is never sent.
- Endpoint contract (Phase A server): `GET /ping`→`{name,version}`; `POST /pair {code,extensionId}`→`{token}`|401; `GET /vault/revision`→`{revision}`|404; `GET /vault`→`{revision,blob}`|404; `PUT /vault {base_revision,blob}`→`{revision}`|409`{revision,blob}`. `blob` is standard padded base64.
- Do not weaken the existing manifest guards: no `host_permissions` (required), no content scripts.
- `pnpm --filter @twofau/extension exec tsc --noEmit` clean and `pnpm --filter @twofau/extension test` green before each commit.

## Shared interfaces (contracts across tasks)

```ts
// vault/vault-repo.ts (Task 1)
export interface VaultRepoPort {
  hasVault(): Promise<boolean>;
  loadManifest(): Promise<VaultManifest | null>;
  load(): Promise<LoadedVault | null>;
  save(blob: Uint8Array, salt: string, kdfId: number, baseRevision: number): Promise<SaveResult>;
}

// vault/settings.ts (Task 2)
export type BridgeMode = "independent" | "client" | "sync";
export interface Settings {
  autoLockMinutes: number;
  storageArea: "sync" | "local";
  mode: BridgeMode;      // default "independent"
  bridgePort: number;    // default 4849
}

// bridge/connection.ts (Task 2)
export const BRIDGE_ORIGIN_PATTERN = "http://127.0.0.1/*";
export class BridgeUnreachableError extends Error {}
export function bridgeBaseUrl(): Promise<string>;
export function bridgeFetch(path: string, init?: RequestInit): Promise<Response>;
export function pingBridge(): Promise<boolean>;
export function pairBridge(code: string): Promise<void>;
export function getBridgeToken(): Promise<string | null>;
export function clearBridgeToken(): Promise<void>;
export function hasBridgePermission(): Promise<boolean>;
export function ensureBridgePermission(): Promise<boolean>;

// vault/http-vault-repo.ts (Task 3)
export class HttpVaultRepo implements VaultRepoPort { /* ... */ }
```

---

### Task 1: Extract `VaultRepoPort` and retype the service

**Files:**
- Modify: `apps/twofau-extension/src/vault/vault-repo.ts`
- Modify: `apps/twofau-extension/src/vault/extension-vault-service.ts`

**Interfaces:**
- Consumes: existing `VaultRepo`, `VaultManifest`, `LoadedVault`, `SaveResult`.
- Produces: `VaultRepoPort`; `ExtensionVaultService` now depends on the port, not the concrete class.

- [ ] **Step 1: Define the port and mark `VaultRepo` as implementing it**

In `apps/twofau-extension/src/vault/vault-repo.ts`, after the `SaveResult` type (around line 29), add:

```ts
/**
 * The surface `ExtensionVaultService` needs from a backing store. Implemented
 * by the chrome.storage `VaultRepo` and, in client mode, by `HttpVaultRepo`.
 */
export interface VaultRepoPort {
  hasVault(): Promise<boolean>;
  loadManifest(): Promise<VaultManifest | null>;
  load(): Promise<LoadedVault | null>;
  save(
    blob: Uint8Array,
    salt: string,
    kdfId: number,
    baseRevision: number,
  ): Promise<SaveResult>;
}
```

Change the class declaration `export class VaultRepo {` to:

```ts
export class VaultRepo implements VaultRepoPort {
```

- [ ] **Step 2: Retype `ExtensionVaultService` to the port**

In `apps/twofau-extension/src/vault/extension-vault-service.ts`:

- Change the import `import { VaultRepo, type VaultManifest } from "./vault-repo";` to:

```ts
import { VaultRepo, type VaultManifest, type VaultRepoPort } from "./vault-repo";
```

- Change the field type `private readonly repo: VaultRepo,` to `private readonly repo: VaultRepoPort,`.
- Change the static factory signature `static async create(repo: VaultRepo = new VaultRepo())` to:

```ts
  static async create(repo: VaultRepoPort = new VaultRepo()): Promise<ExtensionVaultService> {
```

(The default value stays `new VaultRepo()`, which satisfies `VaultRepoPort`.)

- [ ] **Step 3: Run the extension suite to verify nothing broke**

Run: `pnpm --filter @twofau/extension exec tsc --noEmit && pnpm --filter @twofau/extension test 2>&1 | tail -8`
Expected: typecheck clean; all existing suites pass (the `RacingRepo`/`CountingRepo` test doubles extend `VaultRepo`, so they satisfy the port).

- [ ] **Step 4: Commit**

```bash
git add apps/twofau-extension/src/vault/vault-repo.ts apps/twofau-extension/src/vault/extension-vault-service.ts
git commit -m "refactor(extension): extract VaultRepoPort so the service is backend-agnostic"
```

---

### Task 2: Bridge connection module (permission, token, fetch, pairing)

**Files:**
- Modify: `apps/twofau-extension/src/vault/settings.ts` (add `mode`, `bridgePort`)
- Modify: `apps/twofau-extension/src/test/fake-chrome.ts` (add `permissions`, `runtime.id`)
- Create: `apps/twofau-extension/src/bridge/connection.ts`
- Test: `apps/twofau-extension/src/vault/session-key.test.ts` (the `describe("settings", …)` block lives here, not a separate file)
- Test: `apps/twofau-extension/src/bridge/connection.test.ts`

**Interfaces:**
- Consumes: `readSettings`/`writeSettings` (settings), `installFakeChrome` (test double).
- Produces: the `connection.ts` API and the two new `Settings` fields listed in Shared interfaces.

- [ ] **Step 1: Extend `Settings` with mode and port**

Replace the body of `apps/twofau-extension/src/vault/settings.ts` with:

```ts
export const DEFAULT_AUTO_LOCK_MINUTES = 15;
export const DEFAULT_BRIDGE_PORT = 4849;

const SETTINGS_KEY = "settings";

export type BridgeMode = "independent" | "client" | "sync";

export interface Settings {
  /** Minutes of inactivity before the session key is dropped. 0 means never. */
  autoLockMinutes: number;
  /** Where the local vault lives. "local" keeps it on this browser only. */
  storageArea: "sync" | "local";
  /** Which backend the UI talks to. */
  mode: BridgeMode;
  /** Desktop bridge port (host-permission pattern is port-agnostic). */
  bridgePort: number;
}

const DEFAULTS: Settings = {
  autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
  storageArea: "sync",
  mode: "independent",
  bridgePort: DEFAULT_BRIDGE_PORT,
};

const MODES: BridgeMode[] = ["independent", "client", "sync"];

/**
 * Settings live in local storage, not sync: the storage-area choice itself has
 * to be answerable before we know where the vault is, and both the lock timeout
 * and the bridge connection are properties of this browser.
 *
 * Stored values are validated rather than trusted — a junk number reaching
 * chrome.alarms/fetch would throw.
 */
export async function readSettings(): Promise<Settings> {
  const got = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = (got[SETTINGS_KEY] ?? {}) as Partial<Record<keyof Settings, unknown>>;
  const minutes = stored.autoLockMinutes;
  const port = stored.bridgePort;
  return {
    autoLockMinutes:
      typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0
        ? minutes
        : DEFAULTS.autoLockMinutes,
    storageArea: stored.storageArea === "local" ? "local" : DEFAULTS.storageArea,
    mode: MODES.includes(stored.mode as BridgeMode) ? (stored.mode as BridgeMode) : DEFAULTS.mode,
    bridgePort:
      typeof port === "number" && Number.isInteger(port) && port > 0 && port < 65536
        ? port
        : DEFAULTS.bridgePort,
  };
}

export async function writeSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await readSettings()), ...patch };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}
```

- [ ] **Step 2: Extend the settings tests for the new fields**

The settings tests live in `apps/twofau-extension/src/vault/session-key.test.ts`, in its `describe("settings", ...)` block (the outer `let fake: FakeChrome` is already declared). There are **three** `toEqual` objects asserting the full settings shape that must gain the two new fields:

1. the `readSettings()` default → add `mode: "independent", bridgePort: 4849`;
2. the `writeSettings({ storageArea: "local" })` result → add `mode: "independent", bridgePort: 4849`;
3. the "falls back to the defaults when stored values are unusable" `readSettings()` result → add `mode: "independent", bridgePort: 4849`.

Each currently reads like:

```ts
    expect(await readSettings()).toEqual({
      autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
      storageArea: "sync",
    });
```

and becomes:

```ts
    expect(await readSettings()).toEqual({
      autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
      storageArea: "sync",
      mode: "independent",
      bridgePort: 4849,
    });
```

(and likewise for the `storageArea: "local"` object). Then append a new test inside `describe("settings", ...)`:

```ts
  it("persists mode and port, and rejects junk values", async () => {
    expect((await writeSettings({ mode: "client", bridgePort: 5000 })).mode).toBe("client");
    fake.local.data.settings = { mode: "banana", bridgePort: -1 };
    const s = await readSettings();
    expect(s.mode).toBe("independent");
    expect(s.bridgePort).toBe(4849);
  });
```

(The `fake` variable already exists in that test file from the SP4 tests. If the file's outer scope names it differently, use that name.)

- [ ] **Step 3: Add `permissions` and `runtime.id` to the fake chrome**

In `apps/twofau-extension/src/test/fake-chrome.ts`, add an interface and wire it in.

Add to the interfaces near `FakeContextMenus`:

```ts
export interface FakePermissions {
  granted: Set<string>;
  request(perms: { origins?: string[] }): Promise<boolean>;
  contains(perms: { origins?: string[] }): Promise<boolean>;
  remove(perms: { origins?: string[] }): Promise<boolean>;
}
```

Add `permissions: FakePermissions;` to the `FakeChrome` interface. Inside `installFakeChrome`, before building `fake`, add:

```ts
  const permissions: FakePermissions = {
    granted: new Set<string>(),
    async request(perms) {
      for (const o of perms.origins ?? []) permissions.granted.add(o);
      return true; // the fake always grants; real Chrome shows a prompt
    },
    async contains(perms) {
      return (perms.origins ?? []).every((o) => permissions.granted.has(o));
    },
    async remove(perms) {
      for (const o of perms.origins ?? []) permissions.granted.delete(o);
      return true;
    },
  };
```

Add `permissions` to the returned `fake` object, and to the assigned `chrome` global add `permissions` and give runtime an id:

```ts
    runtime: { id: "abcdefghijklmnop", getURL: (path: string) => `chrome-extension://test/${path}` },
    permissions,
```

- [ ] **Step 4: Write the failing connection tests**

Create `apps/twofau-extension/src/bridge/connection.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChrome, type FakeChrome } from "../test/fake-chrome";
import {
  BridgeUnreachableError,
  ensureBridgePermission,
  getBridgeToken,
  pairBridge,
  pingBridge,
} from "./connection";
import { writeSettings } from "../vault/settings";

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
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));
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
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    await expect(pairBridge("nope")).rejects.toThrow(/pair/i);
    expect(await getBridgeToken()).toBeNull();
  });

  it("surfaces a network failure as BridgeUnreachableError", async () => {
    await writeSettings({ mode: "client" });
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));
    await expect(pairBridge("x")).rejects.toBeInstanceOf(BridgeUnreachableError);
  });

  it("requests the loopback host permission", async () => {
    expect(await ensureBridgePermission()).toBe(true);
    expect(fake.permissions.granted.has("http://127.0.0.1/*")).toBe(true);
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `pnpm --filter @twofau/extension test connection 2>&1 | tail -8`
Expected: FAIL — `Failed to resolve import "./connection"`.

- [ ] **Step 6: Implement the connection module**

Create `apps/twofau-extension/src/bridge/connection.ts`:

```ts
import { readSettings } from "../vault/settings";

/** Port-agnostic loopback pattern — one optional permission covers any port. */
export const BRIDGE_ORIGIN_PATTERN = "http://127.0.0.1/*";

const TOKEN_KEY = "bridge.token";

/** The desktop app isn't answering on the configured port. */
export class BridgeUnreachableError extends Error {
  constructor() {
    super("The 2FAU desktop app isn't reachable. Is it running with the bridge enabled?");
    this.name = "BridgeUnreachableError";
  }
}

export async function getBridgeToken(): Promise<string | null> {
  const got = await chrome.storage.local.get(TOKEN_KEY);
  return (got[TOKEN_KEY] as string | undefined) ?? null;
}

async function setBridgeToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearBridgeToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}

export async function bridgeBaseUrl(): Promise<string> {
  const { bridgePort } = await readSettings();
  return `http://127.0.0.1:${bridgePort}`;
}

/**
 * Fetch a bridge endpoint with the bearer token attached. A transport failure
 * (desktop down, wrong port) becomes a `BridgeUnreachableError`; HTTP status
 * codes are returned to the caller to interpret.
 */
export async function bridgeFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = await bridgeBaseUrl();
  const token = await getBridgeToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new BridgeUnreachableError();
  }
}

/** True if the desktop bridge answers a /ping. Never throws. */
export async function pingBridge(): Promise<boolean> {
  try {
    return (await bridgeFetch("/ping")).ok;
  } catch {
    return false;
  }
}

/** Redeem a pairing code for a token and store it. */
export async function pairBridge(code: string): Promise<void> {
  const base = await bridgeBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}/pair`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, extensionId: chrome.runtime.id }),
    });
  } catch {
    throw new BridgeUnreachableError();
  }
  if (!res.ok) throw new Error("Pairing failed — check the code and try again.");
  const { token } = (await res.json()) as { token: string };
  await setBridgeToken(token);
}

export async function hasBridgePermission(): Promise<boolean> {
  return chrome.permissions.contains({ origins: [BRIDGE_ORIGIN_PATTERN] });
}

/** Prompt for the loopback host permission (a no-op if already granted). */
export async function ensureBridgePermission(): Promise<boolean> {
  return chrome.permissions.request({ origins: [BRIDGE_ORIGIN_PATTERN] });
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm --filter @twofau/extension test 2>&1 | tail -10`
Expected: PASS — connection tests plus the extended settings tests and all prior suites.

- [ ] **Step 8: Typecheck and commit**

```bash
pnpm --filter @twofau/extension exec tsc --noEmit
git add apps/twofau-extension/src/vault/settings.ts apps/twofau-extension/src/vault/settings.test.ts \
        apps/twofau-extension/src/test/fake-chrome.ts apps/twofau-extension/src/bridge
git commit -m "feat(extension): bridge connection module — permission, token, fetch, pairing"
```

---

### Task 3: `HttpVaultRepo`

**Files:**
- Create: `apps/twofau-extension/src/vault/http-vault-repo.ts`
- Test: `apps/twofau-extension/src/vault/http-vault-repo.test.ts`

**Interfaces:**
- Consumes: `bridgeFetch` (Task 2); `VaultRepoPort`, `VaultManifest`, `LoadedVault`, `SaveResult`, `MANIFEST_VERSION` (Task 1 / vault-repo); `KDF_ID` (extension-vault-service); `bytesToB64`/`b64ToBytes` (base64); `vaultSalt` (core-wasm).
- Produces: `HttpVaultRepo`.

- [ ] **Step 1: Write the failing tests**

Create `apps/twofau-extension/src/vault/http-vault-repo.test.ts`:

```ts
import { newSalt, sealWithKey, deriveKey } from "@twofau/core-wasm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChrome } from "../test/fake-chrome";
import { bytesToB64 } from "./base64";
import { HttpVaultRepo } from "./http-vault-repo";

// A tiny in-memory stand-in for the desktop bridge over fetch.
function fakeDesktop(initial?: { revision: number; blob: Uint8Array }) {
  const state: { revision: number; blob: Uint8Array } | null = initial ?? null;
  const box = { state };
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
          JSON.stringify({
            revision: cur,
            blob: box.state ? bytesToB64(box.state.blob) : "",
          }),
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

    const salt = (await repo.load())!.manifest.salt;
    const result = await repo.save(blob, salt, 1, 1);
    expect(result.ok && result.manifest.revision).toBe(2);
    expect(box.state?.revision).toBe(2);
  });

  it("returns a conflict with the remote blob on a stale write", async () => {
    const blob = await sealedBlob();
    const { fetchMock } = fakeDesktop({ revision: 5, blob });
    vi.stubGlobal("fetch", fetchMock);
    const repo = new HttpVaultRepo();

    const salt = (await repo.load())!.manifest.salt;
    const result = await repo.save(blob, salt, 1, 1); // base 1 != current 5
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.conflict.manifest.revision).toBe(5);
      expect(result.conflict.blob).toEqual(blob);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @twofau/extension test http-vault-repo 2>&1 | tail -8`
Expected: FAIL — `Failed to resolve import "./http-vault-repo"`.

- [ ] **Step 3: Implement `HttpVaultRepo`**

Create `apps/twofau-extension/src/vault/http-vault-repo.ts`:

```ts
import { vaultSalt } from "@twofau/core-wasm";
import { bridgeFetch } from "../bridge/connection";
import { b64ToBytes, bytesToB64 } from "./base64";
import { KDF_ID } from "./extension-vault-service";
import {
  type LoadedVault,
  MANIFEST_VERSION,
  type SaveResult,
  type VaultManifest,
  type VaultRepoPort,
} from "./vault-repo";

/**
 * A `VaultRepoPort` backed by the desktop bridge. Moves the sealed blob over
 * HTTP; the salt is recovered from the blob itself (the desktop only tracks a
 * revision), and cached so the cheap revision peek can still report it.
 */
export class HttpVaultRepo implements VaultRepoPort {
  private lastSalt: string | null = null;

  async hasVault(): Promise<boolean> {
    const res = await bridgeFetch("/vault");
    if (res.status === 404) return false;
    if (!res.ok) throw new Error(`Bridge error ${res.status}`);
    return true;
  }

  async loadManifest(): Promise<VaultManifest | null> {
    const res = await bridgeFetch("/vault/revision");
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Bridge error ${res.status}`);
    const { revision } = (await res.json()) as { revision: number };
    // The revision peek carries no salt; recover it once via a full load.
    if (this.lastSalt === null) {
      const loaded = await this.load();
      return loaded?.manifest ?? null;
    }
    return this.manifest(revision, this.lastSalt);
  }

  async load(): Promise<LoadedVault | null> {
    const res = await bridgeFetch("/vault");
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Bridge error ${res.status}`);
    const { revision, blob } = (await res.json()) as { revision: number; blob: string };
    const bytes = b64ToBytes(blob);
    this.lastSalt = await vaultSalt(bytes);
    return { blob: bytes, manifest: this.manifest(revision, this.lastSalt) };
  }

  async save(
    blob: Uint8Array,
    salt: string,
    _kdfId: number,
    baseRevision: number,
  ): Promise<SaveResult> {
    const res = await bridgeFetch("/vault", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_revision: baseRevision, blob: bytesToB64(blob) }),
    });
    if (res.ok) {
      const { revision } = (await res.json()) as { revision: number };
      this.lastSalt = salt;
      return { ok: true, manifest: this.manifest(revision, salt) };
    }
    if (res.status === 409) {
      const { revision, blob: remote } = (await res.json()) as { revision: number; blob: string };
      const bytes = b64ToBytes(remote);
      this.lastSalt = await vaultSalt(bytes);
      return { ok: false, conflict: { blob: bytes, manifest: this.manifest(revision, this.lastSalt) } };
    }
    throw new Error(`Bridge refused the write (${res.status}).`);
  }

  private manifest(revision: number, salt: string): VaultManifest {
    // chunks is always 1 over HTTP — the blob travels whole, not chunked.
    return { version: MANIFEST_VERSION, revision, chunks: 1, salt, kdfId: KDF_ID };
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @twofau/extension test http-vault-repo 2>&1 | tail -10`
Expected: PASS — 4 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm --filter @twofau/extension exec tsc --noEmit
git add apps/twofau-extension/src/vault/http-vault-repo.ts apps/twofau-extension/src/vault/http-vault-repo.test.ts
git commit -m "feat(extension): HttpVaultRepo — the vault port over the desktop bridge"
```

---

### Task 4: Client mode in `backend.ts`

**Files:**
- Modify: `apps/twofau-extension/src/vault/backend.ts`
- Test: `apps/twofau-extension/src/vault/backend.test.ts`

**Interfaces:**
- Consumes: `HttpVaultRepo` (Task 3), `ExtensionVaultService`, `VaultRepo`, `readSettings`.
- Produces: `createVaultService()` routes `mode: "client"` to `ExtensionVaultService` over `HttpVaultRepo`. The strongest test drives the full service over an in-memory fake desktop.

- [ ] **Step 1: Write the failing test**

Create `apps/twofau-extension/src/vault/backend.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChrome } from "../test/fake-chrome";
import { bytesToB64 } from "./base64";
import { createVaultService } from "./backend";
import { writeSettings } from "./settings";

// An in-memory desktop the client mode talks to over fetch, with pairing.
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @twofau/extension test backend 2>&1 | tail -8`
Expected: FAIL — the client-mode test's `expect(desktop).toHaveBeenCalledWith(..., { method: "PUT" })` fails: `createVaultService` still always uses `VaultRepo`, so the bridge `fetch` is never called and the write lands in chrome.storage instead.

- [ ] **Step 3: Implement the switch**

Replace `apps/twofau-extension/src/vault/backend.ts` with:

```ts
import type { VaultService } from "@twofau/ui";
import { ExtensionVaultService } from "./extension-vault-service";
import { HttpVaultRepo } from "./http-vault-repo";
import { readSettings } from "./settings";
import { VaultRepo } from "./vault-repo";

/**
 * Picks the backend the UI talks to, from the saved mode.
 *
 * - `client`: no local vault — proxy everything to the desktop bridge.
 * - `independent` (and, until Phase C, `sync`): the local chrome.storage vault.
 *
 * Every backend is the same `ExtensionVaultService` over a different repo, so
 * the revision-guard and merge logic is shared.
 */
export async function createVaultService(): Promise<VaultService> {
  const { mode, storageArea } = await readSettings();
  if (mode === "client") {
    return ExtensionVaultService.create(new HttpVaultRepo());
  }
  return ExtensionVaultService.create(new VaultRepo(storageArea));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @twofau/extension test 2>&1 | tail -12`
Expected: PASS — both backend tests plus every prior suite.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm --filter @twofau/extension exec tsc --noEmit
git add apps/twofau-extension/src/vault/backend.ts apps/twofau-extension/src/vault/backend.test.ts
git commit -m "feat(extension): route client mode to the desktop bridge backend"
```

---

### Task 5: Manifest permission + options-page connection UI

**Files:**
- Modify: `apps/twofau-extension/manifest.json` (add `optional_host_permissions`)
- Modify: `apps/twofau-extension/src/manifest.test.ts` (assert it, and that required host access is still absent)
- Modify: `apps/twofau-extension/src/options/options-view.tsx` (mode + pairing section)

**Interfaces:**
- Consumes: `readSettings`/`writeSettings` (settings), the `connection.ts` API (Task 2).
- Produces: the user-facing mode selector and pair flow; the loopback permission declared optional.

- [ ] **Step 1: Declare the optional permission**

In `apps/twofau-extension/manifest.json`, add after the `permissions` array:

```json
  "optional_host_permissions": ["http://127.0.0.1/*"],
```

- [ ] **Step 2: Extend the manifest guard test**

In `apps/twofau-extension/src/manifest.test.ts`, add inside `describe("manifest.json", ...)`:

```ts
  it("declares the loopback bridge permission as optional, not required", () => {
    expect(manifest.optional_host_permissions).toEqual(["http://127.0.0.1/*"]);
    expect(manifest).not.toHaveProperty("host_permissions");
  });
```

- [ ] **Step 3: Run the manifest test**

Run: `pnpm --filter @twofau/extension test manifest 2>&1 | tail -8`
Expected: PASS — including the new assertion; the existing "no host access" test still holds (optional is a different key).

- [ ] **Step 4: Add the connection section to the options page**

In `apps/twofau-extension/src/options/options-view.tsx`, add the import at the top:

```tsx
import {
  BridgeUnreachableError,
  ensureBridgePermission,
  pairBridge,
  pingBridge,
} from "../bridge/connection";
```

Then, inside the returned `<div className="mx-auto ...">`, add a new `<section>` after the Storage section and before `<VaultSection />`:

```tsx
      <ConnectionSection />
```

Append this component to the same file (it reads/writes settings itself, mirroring `VaultSection`):

```tsx
function ConnectionSection() {
  const [mode, setMode] = useState<"independent" | "client">("independent");
  const [port, setPort] = useState(4849);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { readSettings } = await import("../vault/settings");
      const s = await readSettings();
      setMode(s.mode === "client" ? "client" : "independent");
      setPort(s.bridgePort);
    })();
  }, []);

  async function persist(next: { mode?: "independent" | "client"; bridgePort?: number }) {
    const { writeSettings } = await import("../vault/settings");
    await writeSettings(next);
  }

  async function chooseClient() {
    setError(null);
    setStatus(null);
    const granted = await ensureBridgePermission();
    if (!granted) {
      setError("Permission to reach the desktop app was declined.");
      return;
    }
    setMode("client");
    await persist({ mode: "client" });
  }

  async function chooseIndependent() {
    setMode("independent");
    setStatus(null);
    setError(null);
    await persist({ mode: "independent" });
  }

  async function pair() {
    setError(null);
    setStatus(null);
    try {
      if (!(await pingBridge())) {
        setError("Desktop app not found on that port. Is the bridge enabled?");
        return;
      }
      await pairBridge(code.trim());
      setCode("");
      setStatus("Paired. This browser now uses the desktop vault.");
    } catch (err) {
      setError(err instanceof BridgeUnreachableError ? err.message : String(err));
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <span className="text-[13px] font-medium">Connection</span>

      <label className="flex items-center gap-2 text-[13px]">
        <input type="radio" checked={mode === "independent"} onChange={() => void chooseIndependent()} />
        This browser only (independent)
      </label>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="radio" checked={mode === "client"} onChange={() => void chooseClient()} />
        Use the 2FAU desktop app
      </label>

      {mode === "client" && (
        <div className="flex flex-col gap-1.5 pl-5">
          <label className="flex items-center gap-2 text-[12px]">
            Port
            <input
              type="number"
              className="w-20 rounded border px-1"
              value={port}
              min={1}
              max={65535}
              onChange={(e) => {
                const p = Number(e.target.value) || 4849;
                setPort(p);
                void persist({ bridgePort: p });
              }}
            />
          </label>
          <input
            className="rounded border px-2 py-1 text-[13px]"
            placeholder="Pairing code from the desktop app"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="button" className="rounded border px-2 py-1 text-[13px]" onClick={() => void pair()}>
            Pair with desktop
          </button>
        </div>
      )}

      {status && <p className="text-[11px] text-muted-foreground">{status}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </section>
  );
}
```

Ensure `useEffect` and `useState` are imported in the file (they already are for `OptionsView`/`VaultSection`).

- [ ] **Step 5: Typecheck and build**

Run: `pnpm --filter @twofau/extension exec tsc --noEmit && pnpm --filter @twofau/extension build 2>&1 | tail -6`
Expected: clean typecheck; `dist/` builds (`options.js` emitted).

- [ ] **Step 6: Run the full extension suite**

Run: `pnpm --filter @twofau/extension test 2>&1 | tail -8`
Expected: PASS — every suite.

- [ ] **Step 7: Manual check — client mode end to end**

With the desktop app running and its bridge enabled (Phase A), load the built extension, open Options → Connection → "Use the 2FAU desktop app" (accept the permission prompt), enter the desktop's pairing code, click Pair. Then open the popup.
Expected: the popup shows the **desktop's** accounts (unlock with the desktop passphrase); adding/removing in the popup reflects on the desktop, and vice-versa after reopening the popup. Turning the desktop app off and reopening the popup shows a "desktop not reachable" error rather than an empty vault.
**Manual check — report exactly what happened.**

- [ ] **Step 8: Commit**

```bash
git add apps/twofau-extension/manifest.json apps/twofau-extension/src/manifest.test.ts \
        apps/twofau-extension/src/options/options-view.tsx
git commit -m "feat(extension): options connection section — mode selector and desktop pairing"
```

---

## Spec coverage (Phase B)

| Spec item (SP5) | Task |
| --- | --- |
| Desktop-client mode reuses `ExtensionVaultService` over an HTTP repo | 1, 3, 4 |
| `HttpVaultRepo` maps the port to the bridge endpoints | 3 |
| Sealed-blob only on the wire; salt recovered via `vaultSalt` | 3 |
| Optional `http://127.0.0.1/*` permission, requested on mode change | 2, 5 |
| Token in `chrome.storage.local`; passphrase never sent | 2 |
| Pairing via `POST /pair` with the extension id | 2, 5 |
| Mode + port settings, validated | 2 |
| `createVaultService()` seam switches on mode | 4 |
| Independent mode unchanged, zero host access | 4, 5 |
| Desktop-unreachable surfaces as an error, not an empty vault | 2 (`BridgeUnreachableError`), 5 (manual) |

## Deferred to Phase C

- `SyncEngine` and `sync` mode (the options selector offers only independent/client here; `"sync"` routes to independent until then).
- A polished offline/reconnect state in the popup (Phase B surfaces the error via the existing error rendering).
- `MANUAL-CHECKS.md` additions for the browser↔desktop flow.
