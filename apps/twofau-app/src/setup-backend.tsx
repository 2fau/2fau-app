import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useT } from "@twofau/ui";
import type { AdoptError, AdoptFailure, SetupBackend } from "@twofau/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** `adopt_vault` rejects with a bare code; hand the wizard a tagged Error so it
 * can say which of the two went wrong. */
function adoptError(err: unknown): AdoptError {
  const raw = String(err);
  const code: AdoptFailure | undefined =
    raw === "wrong-passphrase" || raw === "bad-file" ? raw : undefined;
  const tagged: AdoptError = new Error(raw);
  tagged.code = code;
  return tagged;
}

/** The desktop's first-run extras: adopt a vault file, then (optionally) turn on
 * the bridge so a browser can use this vault. */
export function tauriSetupBackend(): SetupBackend {
  return {
    adopt: {
      kind: "native",
      run: async (passphrase) => {
        try {
          return await invoke<number | null>("adopt_vault", { passphrase });
        } catch (err) {
          throw adoptError(err);
        }
      },
    },
    connect: {
      placement: "after-vault",
      title: "Connect your browser",
      description: "Let the 2FAU extension use this vault.",
      screen: ({ onDone, onSkip }) => <ConnectBrowserStep onDone={onDone} onSkip={onSkip} />,
    },
  };
}

function ConnectBrowserStep({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { t } = useT();
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enabling and minting the code are one action here: the only reason to be on
  // this screen is to pair a browser. Skipping leaves the bridge off.
  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const status = await invoke<{ port: number }>("bridge_status");
      await invoke("bridge_enable", { on: true, port: status.port });
      setCode(await invoke<string>("bridge_pairing_code"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8">
      <p className="text-[15px] font-semibold">{t("Connect your browser")}</p>
      <p className="text-center text-[11px] text-muted-foreground">
        {t(
          "The 2FAU extension can use this vault instead of keeping its own. You can also do this later in Settings.",
        )}
      </p>

      {code === null ? (
        <Button className="w-full" disabled={busy} onClick={() => void enable()}>
          {busy ? t("Starting…") : t("Turn on the bridge")}
        </Button>
      ) : (
        <>
          <Input
            readOnly
            value={code}
            aria-label={t("Pairing code")}
            onFocus={(e) => e.currentTarget.select()}
            className="text-center font-mono text-[16px] tracking-[0.35em] tabular-nums"
          />
          <p className="text-center text-[11px] text-muted-foreground">
            {t("Enter this code in the extension. It expires in about two minutes.")}
          </p>
          <Button className="w-full" onClick={onDone}>
            {t("Done")}
          </Button>
        </>
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      <Button variant="ghost" className="w-full" disabled={busy} onClick={onSkip}>
        {code === null ? t("Skip for now") : t("Close")}
      </Button>
    </div>
  );
}
