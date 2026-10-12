import type { SetupBackend, Translator } from "@twofau/ui";
import { useT } from "@twofau/ui";
import { useState } from "react";
import { connectToDesktop } from "../vault/connect-desktop";
import { readFileBytes } from "../vault/transfer";
import type { BridgeMode } from "../vault/settings";
import type { ExtensionVaultService } from "../vault/extension-vault-service";

/**
 * The extension's first-run extras: adopt a vault file, or hand the whole vault
 * over to the desktop app. `t` is passed in because the choice's title and
 * description are read before any component mounts.
 */
export function extensionSetupBackend(
  service: ExtensionVaultService,
  { t }: Translator,
): SetupBackend {
  return {
    adopt: {
      kind: "file",
      run: async (file, passphrase) => service.adoptBlob(await readFileBytes(file), passphrase),
    },
    connect: {
      placement: "choice",
      title: t("Use my desktop app"),
      description: t("Keep the vault in 2FAU on this computer."),
      screen: ({ onDone, onSkip }) => <ConnectDesktop onDone={onDone} onSkip={onSkip} />,
    },
  };
}

/** Pair with the desktop bridge and pick where the vault lives. Nothing is
 * written until pairing succeeds, so a failure leaves the extension exactly as
 * it was — no vault, no mode change. */
function ConnectDesktop({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const { t } = useT();
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<BridgeMode>("client");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      if ((await connectToDesktop(code.trim(), mode)) === "permission-declined") {
        setError(t("2FAU needs permission to talk to 127.0.0.1 to reach the desktop app."));
        return;
      }
      // The backend is chosen at startup from the mode we just wrote, so the
      // popup has to come back up against the desktop vault.
      onDone();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 px-6 py-8">
      <p className="text-center text-[15px] font-semibold">{t("Use my desktop app")}</p>
      <p className="text-center text-[11px] text-muted-foreground">
        {t(
          "Open 2FAU on this computer, turn on the browser bridge in its settings, and enter the pairing code it shows.",
        )}
      </p>

      <input
        autoFocus
        value={code}
        aria-label={t("Pairing code from the desktop app")}
        placeholder={t("Pairing code")}
        onChange={(e) => setCode(e.target.value)}
        className="rounded-md border bg-input/30 px-3 py-2 text-center font-mono text-[16px] tracking-[0.35em] tabular-nums"
      />

      <div className="flex flex-col gap-1.5">
        {(
          [
            ["client", t("Desktop vault"), t("Nothing is stored in this browser.")],
            ["sync", t("Sync with desktop"), t("Keep a copy here, unlocked by the same passphrase.")],
          ] as const
        ).map(([value, label, help]) => (
          <label key={value} className="flex items-start gap-2 text-[12px]">
            <input
              type="radio"
              name="setup-mode"
              className="mt-0.5 accent-[var(--primary)]"
              checked={mode === value}
              onChange={() => setMode(value)}
            />
            <span>
              <span className="block font-medium">{label}</span>
              <span className="block text-[11px] text-muted-foreground">{help}</span>
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        disabled={busy || code.trim().length === 0}
        onClick={() => void connect()}
        className="rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground disabled:opacity-50"
      >
        {busy ? t("Pairing…") : t("Pair")}
      </button>

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={onSkip}
        className="text-[12px] text-muted-foreground underline-offset-2 hover:underline"
      >
        {t("Back")}
      </button>
    </div>
  );
}
