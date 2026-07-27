import { readSettings } from "../vault/settings";
import { detectBrowser } from "./browser-info";

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
      body: JSON.stringify({ code, extensionId: chrome.runtime.id, browser: detectBrowser() }),
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
