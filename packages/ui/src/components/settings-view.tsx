import {
  Check,
  Clock,
  Code2,
  Download,
  Info,
  KeyRound,
  Languages,
  MessageSquare,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/ui/logo";
import { SettingsGroup, SettingsPage, SettingsRow } from "@/components/ui/settings-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTO_LOCK_OPTIONS, type SettingsBackend } from "@/core/settings";

type Screen = "main" | "password" | "import" | "autolock" | "sync" | "about";

function lockLabel(minutes: number): string {
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

/** The shared iPhone-Settings-style screen: inset-grouped sections with drill-in
 * sub-screens, driven by a host `SettingsBackend`. The desktop renders it in its
 * popup; the extension renders it on its options page. */
export function SettingsView({
  backend,
  onClose,
}: {
  backend: SettingsBackend;
  /** Back out of settings entirely (to the account list). Omitted on a
   * standalone page (e.g. the extension options tab), which then shows no root
   * back button. */
  onClose?: () => void;
}) {
  const [screen, setScreen] = useState<Screen>("main");
  const [autoLock, setAutoLock] = useState<number | null>(null);

  useEffect(() => {
    void backend.autoLock.get().then(setAutoLock);
  }, [backend]);

  if (screen === "password") {
    return <ChangePasswordScreen backend={backend} onBack={() => setScreen("main")} />;
  }
  if (screen === "import") {
    return <ImportScreen backend={backend} onBack={() => setScreen("main")} />;
  }
  if (screen === "autolock") {
    return (
      <AutoLockScreen
        value={autoLock}
        onPick={async (m) => {
          setAutoLock(m);
          await backend.autoLock.set(m);
        }}
        onBack={() => setScreen("main")}
      />
    );
  }
  if (screen === "sync") {
    return (
      <SettingsPage title="Sync" onBack={() => setScreen("main")}>
        {backend.sync.screen}
      </SettingsPage>
    );
  }
  if (screen === "about") {
    return <AboutScreen backend={backend} onBack={() => setScreen("main")} />;
  }

  const footer = (
    <>
      2FA<span style={{ color: "var(--primary)" }}>u</span> · Version {backend.version}
    </>
  );

  return (
    <SettingsPage title="Settings" onBack={onClose} backLabel="Done" footer={footer}>
      <SettingsGroup header="Vault">
        <ExportRow backend={backend} />
        <SettingsRow
          icon={<Download />}
          iconBg="#0a84ff"
          label="Import Vault"
          chevron
          onClick={() => setScreen("import")}
        />
        <SettingsRow
          icon={<KeyRound />}
          iconBg="#8e8e93"
          label="Change Password"
          chevron
          onClick={() => setScreen("password")}
        />
      </SettingsGroup>

      <SettingsGroup header="Preferences">
        <SettingsRow
          icon={<Clock />}
          iconBg="#ff9f0a"
          label="Auto-Lock"
          value={autoLock == null ? "…" : lockLabel(autoLock)}
          chevron
          onClick={() => setScreen("autolock")}
        />
      </SettingsGroup>

      <SettingsGroup header="Sync">
        <SettingsRow
          icon={<RefreshCw />}
          iconBg="#30d158"
          label="Sync"
          value={backend.sync.summary}
          chevron
          onClick={() => setScreen("sync")}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon={<MessageSquare />}
          iconBg="#ff9f0a"
          label="Feedback"
          chevron
          onClick={() => backend.openLink(backend.links.feedback)}
        />
        <SettingsRow
          icon={<Languages />}
          iconBg="#30b0c7"
          label="Translate"
          chevron
          onClick={() => backend.openLink(backend.links.translate)}
        />
        <SettingsRow
          icon={<Code2 />}
          iconBg="#af52de"
          label="Source Code"
          chevron
          onClick={() => backend.openLink(backend.links.sourceCode)}
        />
        <SettingsRow
          icon={<Info />}
          iconBg="#8e8e93"
          label="About"
          chevron
          onClick={() => setScreen("about")}
        />
      </SettingsGroup>
    </SettingsPage>
  );
}

/** Status line shared by the action sub-screens. */
function Status({ ok, error }: { ok?: string | null; error?: string | null }) {
  if (error) return <p className="px-1 text-[11px] text-destructive">{error}</p>;
  if (ok) return <p className="px-1 text-[11px] text-muted-foreground">{ok}</p>;
  return null;
}

function ExportRow({ backend }: { backend: SettingsBackend }) {
  const [busy, setBusy] = useState(false);
  return (
    <SettingsRow
      icon={<Upload />}
      iconBg="#0a84ff"
      label="Export Vault"
      disabled={busy}
      trailing={busy ? <span className="text-[11px]">…</span> : undefined}
      onClick={() => {
        setBusy(true);
        void backend.exportVault().finally(() => setBusy(false));
      }}
    />
  );
}

function ChangePasswordScreen({
  backend,
  onBack,
}: {
  backend: SettingsBackend;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && confirm !== next;
  const valid = current.length > 0 && next.length >= 8 && confirm === next;

  async function submit() {
    setBusy(true);
    setOk(null);
    setError(null);
    try {
      await backend.changePassphrase(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setOk("Password changed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsPage title="Change Password" onBack={onBack}>
      <SettingsGroup footer="Your password encrypts the vault on this device and can't be recovered.">
        <div className="flex flex-col gap-2 p-3">
          <Input
            type="password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New password"
            aria-invalid={tooShort}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            aria-invalid={mismatch}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </SettingsGroup>
      {tooShort && (
        <p className="-mt-3 px-1 text-[11px] text-muted-foreground">Use at least 8 characters.</p>
      )}
      {mismatch && <p className="-mt-3 px-1 text-[11px] text-destructive">Passwords don't match.</p>}
      <Button disabled={!valid || busy} onClick={() => void submit()}>
        {busy ? "Changing…" : "Change Password"}
      </Button>
      <Status ok={ok} error={error} />
    </SettingsPage>
  );
}

function ImportScreen({ backend, onBack }: { backend: SettingsBackend; onBack: () => void }) {
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(work: () => Promise<number | null>) {
    setBusy(true);
    setOk(null);
    setError(null);
    try {
      const count = await work();
      if (count == null) return; // cancelled a native picker
      setPassphrase("");
      setOk(`Imported. The vault now holds ${count} account${count === 1 ? "" : "s"}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const spec = backend.import;

  return (
    <SettingsPage title="Import Vault" onBack={onBack}>
      <SettingsGroup footer="Merges an exported .dat file into this vault. Enter the password the file was exported with.">
        <div className="flex flex-col gap-2 p-3">
          <Input
            type="password"
            placeholder="Password of the file"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          {spec.kind === "native" ? (
            <Button
              disabled={passphrase.length === 0 || busy}
              onClick={() => void run(() => spec.run(passphrase))}
            >
              {busy ? "Importing…" : "Choose File & Import"}
            </Button>
          ) : (
            <input
              type="file"
              accept=".dat,application/octet-stream"
              disabled={passphrase.length === 0 || busy}
              className="text-[12px] file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-primary-foreground disabled:opacity-50"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void run(() => spec.run(file, passphrase));
                e.target.value = "";
              }}
            />
          )}
        </div>
      </SettingsGroup>
      <Status ok={ok} error={error} />
    </SettingsPage>
  );
}

function AutoLockScreen({
  value,
  onPick,
  onBack,
}: {
  value: number | null;
  onPick: (minutes: number) => void | Promise<void>;
  onBack: () => void;
}) {
  return (
    <SettingsPage title="Auto-Lock" onBack={onBack}>
      <SettingsGroup footer="How long the app can sit idle before it locks and asks for your password again.">
        {AUTO_LOCK_OPTIONS.map((m) => (
          <SettingsRow
            key={m}
            label={lockLabel(m)}
            trailing={value === m ? <Check className="size-4 text-primary" /> : undefined}
            onClick={() => void onPick(m)}
          />
        ))}
      </SettingsGroup>
    </SettingsPage>
  );
}

function AboutScreen({ backend, onBack }: { backend: SettingsBackend; onBack: () => void }) {
  return (
    <SettingsPage title="About" onBack={onBack}>
      <div className="flex flex-col items-center gap-2 py-2">
        <LogoMark size={54} />
        <span className="text-[17px] font-semibold tracking-[-0.02em]">
          2FA<span style={{ color: "var(--primary)" }}>u</span>
        </span>
        <span className="text-[12px] text-muted-foreground">Version {backend.version}</span>
      </div>
      <SettingsGroup footer="Your codes are generated on this device and never leave it.">
        <SettingsRow
          label="Source Code"
          chevron
          onClick={() => backend.openLink(backend.links.sourceCode)}
        />
        <SettingsRow
          label="Feedback"
          chevron
          onClick={() => backend.openLink(backend.links.feedback)}
        />
      </SettingsGroup>
    </SettingsPage>
  );
}
