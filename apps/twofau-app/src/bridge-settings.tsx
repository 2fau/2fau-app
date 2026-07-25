import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

interface BrowserInfo {
  id: string;
  origin: string;
  paired_at: number;
}
interface BridgeStatus {
  enabled: boolean;
  port: number;
  browsers: BrowserInfo[];
}

export function BridgeSettings() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setStatus(await invoke<BridgeStatus>("bridge_status"));
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function run(work: () => Promise<void>) {
    setError(null);
    try {
      await work();
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  if (!status) return <p className="text-[13px]">Loading…</p>;

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={status.enabled}
          onChange={(e) =>
            void run(async () => {
              setCode(null);
              await invoke("bridge_enable", { on: e.target.checked, port: status.port });
            })
          }
        />
        Enable browser bridge (port {status.port})
      </label>

      {status.enabled && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className="rounded border px-2 py-1 text-left"
            onClick={() =>
              void run(async () => {
                setCode(await invoke<string>("bridge_pairing_code"));
              })
            }
          >
            Show pairing code
          </button>
          {code && (
            <p className="font-mono text-[15px] tracking-wide">
              {code}
              <span className="ml-2 text-[11px] text-muted-foreground">valid ~2 min</span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-medium">Paired browsers</span>
        {status.browsers.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">None yet.</span>
        ) : (
          status.browsers.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px]">{b.origin}</span>
              <button
                type="button"
                className="rounded border px-2 py-0.5 text-[11px]"
                onClick={() => void run(() => invoke("bridge_revoke", { id: b.id }))}
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
