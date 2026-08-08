import {
  modsFromToken,
  modsToToken,
  SettingsGroup,
  SettingsView,
  type QuickCopyConfig,
  type SettingsBackend,
} from "@twofau/ui";
import { useEffect, useMemo, useState } from "react";
import {
  BridgeUnreachableError,
  ensureBridgePermission,
  getBridgeToken,
  pairBridge,
  pingBridge,
} from "../bridge/connection";
import { type BridgeMode, readSettings, writeSettings } from "../vault/settings";
import { clearSessionKey } from "../vault/session-key";
import { downloadBlob, readFileBytes } from "../vault/transfer";
import { syncUsage, type SyncUsage } from "../vault/usage";

/** External links surfaced in Settings. Edit these to point at the real repo. */
const LINKS = {
  sourceCode: "https://github.com/2fau/2fau-app",
  feedback: "https://github.com/2fau/2fau-app/issues",
  translate: "https://github.com/2fau/2fau-app",
};

const SYNC_SUMMARY: Record<BridgeMode, string> = {
  independent: "This browser",
  sync: "Sync with desktop",
  client: "Desktop vault",
};

async function vaultService() {
  const { ExtensionVaultService } = await import("../vault/extension-vault-service");
  return ExtensionVaultService.create();
}

/** The browser-owned summon shortcut (rebindable only at
 * chrome://extensions/shortcuts), or null when the user has cleared it. */
async function readSummonShortcut(): Promise<string | null> {
  const cmds = await chrome.commands.getAll();
  const cmd = cmds.find((c) => c.name === "_execute_action");
  return cmd?.shortcut ? cmd.shortcut : null;
}

export function OptionsView() {
  const [mode, setMode] = useState<BridgeMode | null>(null);

  useEffect(() => {
    void readSettings().then((s) => setMode(s.mode));
  }, []);

  const backend: SettingsBackend = useMemo(
    () => ({
      version: chrome.runtime.getManifest().version,
      links: LINKS,
      exportVault: async () => {
        downloadBlob(await (await vaultService()).exportBlob(), "2fau-vault.dat");
        return true;
      },
      import: {
        kind: "file",
        run: async (file, passphrase) =>
          (await vaultService()).importBlob(await readFileBytes(file), passphrase),
      },
      changePassphrase: async (current, next) => {
        await (await vaultService()).changePassphrase(current, next);
      },
      autoLock: {
        get: async () => (await readSettings()).autoLockMinutes,
        set: async (minutes) => {
          await writeSettings({ autoLockMinutes: minutes });
        },
      },
      sync: {
        summary: mode ? SYNC_SUMMARY[mode] : undefined,
        screen: <SyncScreen onModeChange={setMode} />,
      },
      openLink: (url) => window.open(url, "_blank", "noopener,noreferrer"),
      hotkeys: {
        getQuickCopy: async (): Promise<QuickCopyConfig> => {
          const s = await readSettings();
          return { enabled: s.quickCopyEnabled, mods: modsFromToken(s.quickCopyMods) };
        },
        setQuickCopy: async (c) => {
          await writeSettings({ quickCopyEnabled: c.enabled, quickCopyMods: modsToToken(c.mods) });
        },
        summon: {
          kind: "external",
          get: readSummonShortcut,
          open: () => void chrome.tabs.create({ url: "chrome://extensions/shortcuts" }),
        },
      },
    }),
    [mode],
  );

  return (
    <div className="mx-auto h-screen max-w-md">
      <SettingsView backend={backend} />
    </div>
  );
}

/** The extension's Sync sub-screen: where the vault lives, and (for the bridge
 * modes) the desktop pairing flow. */
function SyncScreen({ onModeChange }: { onModeChange: (m: BridgeMode) => void }) {
  const [mode, setMode] = useState<BridgeMode>("independent");
  const [storageArea, setStorageArea] = useState<"sync" | "local">("sync");
  const [port, setPort] = useState(4849);
  const [code, setCode] = useState("");
  const [usage, setUsage] = useState<SyncUsage | null>(null);
  const [conn, setConn] = useState<{ paired: boolean; reachable: boolean } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshConn() {
    const token = await getBridgeToken();
    const reachable = token !== null && (await pingBridge());
    setConn({ paired: token !== null, reachable });
  }

  useEffect(() => {
    void (async () => {
      const s = await readSettings();
      setMode(s.mode);
      setStorageArea(s.storageArea);
      setPort(s.bridgePort);
      setUsage(await syncUsage());
      await refreshConn();
    })();
  }, []);

  async function choose(next: BridgeMode) {
    setError(null);
    setStatus(null);
    if (next !== "independent" && !(await ensureBridgePermission())) {
      setError("Permission to reach the desktop app was declined.");
      return;
    }
    // The desktop vault and the local vault use different keys, so a session key
    // unlocked for one can't open the other. Drop it when crossing that boundary
    // so the popup re-prompts for the right passphrase instead of showing an
    // empty list it silently failed to decrypt.
    if (next === "client" || mode === "client") {
      await clearSessionKey();
    }
    setMode(next);
    onModeChange(next);
    await writeSettings({ mode: next });
    await refreshConn();
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
      setStatus("Paired. Open the popup and unlock with your desktop passphrase.");
      await refreshConn();
    } catch (err) {
      setError(err instanceof BridgeUnreachableError ? err.message : String(err));
    }
  }

  const MODE_LABELS: { value: BridgeMode; label: string }[] = [
    { value: "independent", label: "This browser" },
    { value: "sync", label: "Sync with desktop" },
    { value: "client", label: "Desktop vault" },
  ];

  return (
    <>
      <SettingsGroup header="Where the vault lives" footer={modeHelp(mode)}>
        {MODE_LABELS.map((m) => (
          <label
            key={m.value}
            className="flex min-h-[42px] cursor-pointer items-center gap-3 px-3.5 text-[13px]"
          >
            <input
              type="radio"
              name="sync-mode"
              className="accent-primary"
              checked={mode === m.value}
              onChange={() => void choose(m.value)}
            />
            {m.label}
          </label>
        ))}
      </SettingsGroup>

      {mode === "independent" && (
        <SettingsGroup
          footer={
            usage
              ? `Using ${(usage.bytes / 1024).toFixed(1)} KB of ${(usage.quota / 1024).toFixed(0)} KB (${usage.percent.toFixed(0)}%).`
              : undefined
          }
        >
          <label className="flex min-h-[42px] cursor-pointer items-center gap-3 px-3.5 text-[13px]">
            <input
              type="checkbox"
              className="accent-primary"
              checked={storageArea === "sync"}
              onChange={(e) => {
                const area = e.target.checked ? "sync" : "local";
                setStorageArea(area);
                void writeSettings({ storageArea: area });
              }}
            />
            Sync across my Chrome profile
          </label>
        </SettingsGroup>
      )}

      {mode !== "independent" && (
        <SettingsGroup header="Desktop pairing">
          <div className="flex items-center gap-2 px-3.5 py-2.5 text-[13px]">
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${
                conn?.reachable
                  ? "bg-success"
                  : conn?.paired
                    ? "bg-[color:var(--acct-orange)]"
                    : "bg-destructive"
              }`}
            />
            <span>
              {conn == null
                ? "Checking…"
                : conn.reachable
                  ? "Paired — desktop connected"
                  : conn.paired
                    ? "Paired — desktop unreachable"
                    : "Not paired yet"}
            </span>
          </div>
          <div className="flex flex-col gap-2 p-3 text-[13px]">
            <label className="flex items-center justify-between gap-2">
              Port
              <input
                type="number"
                className="w-24 rounded-md border px-2 py-1"
                value={port}
                min={1}
                max={65535}
                onChange={(e) => {
                  const p = Number(e.target.value) || 4849;
                  setPort(p);
                  void writeSettings({ bridgePort: p });
                }}
              />
            </label>
            <input
              className="rounded-md border px-2 py-1.5"
              placeholder="Pairing code from the desktop app"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="button"
              className="rounded-md border px-2 py-1.5 active:bg-muted"
              onClick={() => void pair()}
            >
              Pair with desktop
            </button>
          </div>
        </SettingsGroup>
      )}

      {status && <p className="px-1 text-[11px] text-muted-foreground">{status}</p>}
      {error && <p className="px-1 text-[11px] text-destructive">{error}</p>}
    </>
  );
}

function modeHelp(mode: BridgeMode): string {
  if (mode === "client") return "Vaults live in the desktop app; this browser is a client.";
  if (mode === "sync")
    return "This browser keeps its own vault and syncs it with the desktop app when it's running.";
  return "This browser keeps its own vault.";
}
