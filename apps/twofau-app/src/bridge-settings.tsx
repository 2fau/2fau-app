import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BrowserInfo {
  id: string;
  origin: string;
  paired_at: number;
  name: string;
  version: string;
  os: string;
}

/** "Google Chrome 128", falling back to the raw origin for browsers paired
 * before they reported an identity. */
function browserTitle(b: BrowserInfo): string {
  return [b.name, b.version].filter(Boolean).join(" ") || b.origin;
}

/** The muted second line: OS and, when we have a real name above, the origin. */
function browserDetail(b: BrowserInfo): string {
  const hasTitle = Boolean(b.name || b.version);
  return [b.os, hasTitle ? b.origin : ""].filter(Boolean).join(" · ");
}

/** First letter for the avatar (C for Chrome, F for Firefox, …). */
function monogram(b: BrowserInfo): string {
  const s = (b.name || b.origin).trim();
  return s ? s[0]!.toUpperCase() : "?";
}

/** A stable hue per browser id so each avatar keeps its own colour. */
function hueFor(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
}

interface BridgeStatus {
  enabled: boolean;
  port: number;
  browsers: BrowserInfo[];
}

export function BridgeSettings() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setStatus(await invoke<BridgeStatus>("bridge_status"));
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function run(work: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await work();
      await refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!status) return <p className="text-[13px] text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-col gap-5 text-[13px]">
      {/* Enable toggle */}
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="font-medium">Browser bridge</p>
          <p className="text-[11px] text-muted-foreground">
            Let paired browser extensions read codes · port {status.port}
          </p>
        </div>
        <input
          type="checkbox"
          className="size-4 accent-[var(--primary)]"
          checked={status.enabled}
          onChange={(e) =>
            void run(async () => {
              setCode(null);
              await invoke("bridge_enable", {
                on: e.target.checked,
                port: status.port,
              });
            })
          }
        />
      </label>

      {/* Pairing code */}
      {status.enabled && (
        <section className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Pairing code
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={code ?? ""}
              placeholder="— — — — — —"
              aria-label="Pairing code"
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 text-center font-mono text-[16px] tracking-[0.35em] tabular-nums"
            />
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setCode(await invoke<string>("bridge_pairing_code"));
                })
              }
            >
              {code ? "Regenerate" : "Generate"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enter this in your browser extension to pair. Expires in about 2
            minutes.
          </p>
        </section>
      )}

      {/* Paired browsers */}
      <section className="flex flex-col gap-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Paired browsers
        </p>
        {status.browsers.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-4 text-center text-[11px] text-muted-foreground">
            No browsers paired yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {status.browsers.map((b) => {
              const detail = browserDetail(b);
              return (
                <li
                  key={b.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                    style={{ backgroundColor: `hsl(${hueFor(b.id)} 60% 45%)` }}
                  >
                    {monogram(b)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium" title={b.origin}>
                      {browserTitle(b)}
                    </p>
                    {detail && (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {detail}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    className="text-destructive hover:text-destructive"
                    onClick={() =>
                      void run(() => invoke("bridge_revoke", { id: b.id }))
                    }
                  >
                    Revoke
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
