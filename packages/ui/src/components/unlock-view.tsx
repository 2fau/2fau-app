import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/ui/logo";
import { useVault } from "@/state/vault-provider";

/** Net-new screen (no Swift equivalent): passphrase unlock, since the
 * cross-platform root of trust is a passphrase, not the Secure Enclave. */
export function UnlockView() {
  const { unlock } = useVault();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await unlock(passphrase);
    } catch (err) {
      setError(`Could not unlock: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="flex min-h-[320px] flex-col items-center justify-center gap-5 px-8 py-10"
      onSubmit={submit}
    >
      <div className="flex flex-col items-center gap-3">
        <AppIcon size={60} />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[19px] font-semibold tracking-[-0.02em]">
            2FA<span style={{ color: "var(--primary)" }}>u</span>
          </span>
          <p className="text-[12px] text-muted-foreground">
            Enter your passphrase to unlock
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        <Input
          type="password"
          autoFocus
          placeholder="Passphrase"
          aria-invalid={!!error}
          value={passphrase}
          onChange={(e) => {
            setPassphrase(e.target.value);
            if (error) setError(null);
          }}
        />
        {error && (
          <p className="text-center text-[11px] text-destructive">{error}</p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={busy || passphrase.length === 0}
        >
          {busy ? "Unlocking…" : "Unlock"}
        </Button>
      </div>
    </form>
  );
}
