import { ChevronRight, DownloadCloud, MonitorSmartphone, ShieldPlus } from "lucide-react";
import { useState } from "react";
import { useT } from "@twofau/i18n/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetupView } from "@/components/setup-view";
import { adoptFailure, type SetupBackend } from "@/core/setup";
import type { ImportSpec } from "@/core/settings";
import { useVault } from "@/state/vault-provider";

type Step = "choices" | "create" | "adopt" | "connect";

/** First run: what to start from. Creating a vault is always possible, so a
 * host that declares nothing else lands straight on the passphrase form and the
 * wizard is invisible. Everything that needs host I/O — picking a file, asking
 * for a permission, pairing — comes from the backend, so no host API reaches
 * this package. */
export function SetupWizard({
  backend,
  onDone,
}: {
  backend?: SetupBackend;
  onDone: () => void;
}) {
  const { t } = useT();
  const connect = backend?.connect;
  const hasChoices = Boolean(backend?.adopt) || connect?.placement === "choice";
  const [step, setStep] = useState<Step>(hasChoices ? "choices" : "create");

  // A vault exists from here on. The desktop has one more (optional) step; for
  // everyone else the wizard is over and the list takes the panel.
  const vaultReady = () => {
    if (connect?.placement === "after-vault") setStep("connect");
    else onDone();
  };

  const back = hasChoices ? () => setStep("choices") : undefined;

  if (step === "create") return <SetupView onDone={vaultReady} onBack={back} />;

  if (step === "adopt" && backend?.adopt) {
    return <AdoptStep spec={backend.adopt} onDone={vaultReady} onBack={back} />;
  }

  if (step === "connect" && connect) {
    return (
      <>
        {connect.screen({
          onDone,
          // Skipping the desktop's follow-up ends the wizard; backing out of the
          // extension's connect choice returns to the choices.
          onSkip: connect.placement === "after-vault" ? onDone : () => setStep("choices"),
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-7">
      <div className="flex flex-col items-center gap-2">
        <ShieldPlus className="size-9 text-primary" />
        <p className="text-[15px] font-semibold">{t("Set up 2FAU")}</p>
        <p className="text-center text-[11px] text-muted-foreground">
          {t("Start a new vault, bring one you already have, or use the one in your desktop app.")}
        </p>
      </div>

      <Choice
        icon={<ShieldPlus className="size-4" />}
        title={t("Create a new vault")}
        description={t("Pick a passphrase and start with an empty vault.")}
        onClick={() => setStep("create")}
      />
      {backend?.adopt && (
        <Choice
          icon={<DownloadCloud className="size-4" />}
          title={t("Import a vault file")}
          description={t("Use a vault you exported from another device.")}
          onClick={() => setStep("adopt")}
        />
      )}
      {connect?.placement === "choice" && (
        <Choice
          icon={<MonitorSmartphone className="size-4" />}
          title={connect.title}
          description={connect.description}
          onClick={() => setStep("connect")}
        />
      )}
    </div>
  );
}

function Choice({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:bg-accent"
    >
      <span className="text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** Adopt an exported vault file: it becomes this device's vault, and the
 * passphrase that opens it becomes this device's passphrase. */
function AdoptStep({
  spec,
  onDone,
  onBack,
}: {
  spec: ImportSpec;
  onDone: () => void;
  onBack?: () => void;
}) {
  const { t } = useT();
  const { unlock } = useVault();
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(adopt: () => Promise<number | null>) {
    setBusy(true);
    setError(null);
    try {
      // null means the user dismissed the host's file picker.
      if ((await adopt()) === null) return;
      await unlock(passphrase);
      onDone();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  function message(err: unknown): string {
    switch (adoptFailure(err)) {
      case "wrong-passphrase":
        return t("That passphrase doesn’t open this file.");
      case "bad-file":
        return t("That file isn’t a 2FAU vault.");
      default:
        return err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8">
      <DownloadCloud className="size-9 text-primary" />
      <p className="text-[15px] font-semibold">{t("Import a vault file")}</p>
      <p className="text-center text-[11px] text-muted-foreground">
        {t("Its accounts become this device’s vault, and its passphrase unlocks it from now on.")}
      </p>

      <Input
        type="password"
        autoFocus
        placeholder={t("Passphrase of the file")}
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
      />

      {spec.kind === "native" ? (
        <Button
          className="w-full"
          disabled={passphrase.length === 0 || busy}
          onClick={() => void run(() => spec.run(passphrase))}
        >
          {busy ? t("Importing…") : t("Choose File & Import")}
        </Button>
      ) : (
        <input
          type="file"
          accept=".dat,application/octet-stream"
          aria-label={t("Vault file")}
          disabled={passphrase.length === 0 || busy}
          className="w-full text-[12px] file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-primary-foreground disabled:opacity-50"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void run(() => spec.run(file, passphrase));
            e.target.value = "";
          }}
        />
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      {onBack && (
        <Button variant="ghost" className="w-full" disabled={busy} onClick={onBack}>
          {t("Back")}
        </Button>
      )}
    </div>
  );
}
