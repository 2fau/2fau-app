import {
  Check,
  Clock,
  Code2,
  Download,
  Globe,
  Info,
  Keyboard,
  KeyRound,
  Languages,
  MessageSquare,
  Power,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@twofau/i18n/react";
import { LOCALE_NAMES, SUPPORTED_LOCALES } from "@twofau/i18n";
import { HotkeyRecorder } from "@/components/hotkey-recorder";
import { LogoMark } from "@/components/ui/logo";
import { SettingsGroup, SettingsPage, SettingsRow } from "@/components/ui/settings-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { AUTO_LOCK_OPTIONS, type SettingsBackend } from "@/core/settings";
import {
  DEFAULT_SUMMON,
  formatChord,
  toAccelerator,
  type Chord,
  type QuickCopyConfig, parseAccelerator,
} from "@/lib/hotkeys";

type Screen =
  | "main"
  | "password"
  | "import"
  | "autolock"
  | "sync"
  | "about"
  | "hotkeys"
  | "language";

type Translator = ReturnType<typeof useT>;

function lockLabel(minutes: number, tr: Translator): string {
  if (minutes === 0) return tr.t("Never");
  return tr.plural(minutes, { one: "1 minute", other: "{count} minutes" }, { count: minutes });
}

/** The shared iPhone-Settings-style screen: inset-grouped sections with drill-in
 * sub-screens, driven by a host `SettingsBackend`. The desktop renders it in its
 * popup; the extension renders it on its options page. */
export function SettingsView({
  backend,
  onClose,
  onQuickCopyChange,
}: {
  backend: SettingsBackend;
  /** Back out of settings entirely (to the account list). Omitted on a
   * standalone page (e.g. the extension options tab), which then shows no root
   * back button. */
  onClose?: () => void;
  /** Called after a successful quick-copy write so an in-panel host (desktop)
   * can apply it to the open list immediately. */
  onQuickCopyChange?: (c: QuickCopyConfig) => void;
}) {
  const tr = useT();
  const { t } = tr;
  const [screen, setScreen] = useState<Screen>("main");
  const [autoLock, setAutoLock] = useState<number | null>(null);
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [summon, setSummon] = useState<string | null>(null);
  const [locale, setLocale] = useState<string | null>(null);

  useEffect(() => {
    void backend.autoLock.get().then(setAutoLock);
    void backend.autostart?.get().then(setAutostart);
    void backend.hotkeys.summon.get().then(setSummon);
    void backend.locale.get().then(setLocale);

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
      <SettingsPage title={t("Sync")} onBack={() => setScreen("main")}>
        {backend.sync.screen}
      </SettingsPage>
    );
  }
  if (screen === "about") {
    return <AboutScreen backend={backend} onBack={() => setScreen("main")} />;
  }
  if (screen === "hotkeys") {
    return (
      <HotkeysScreen
        backend={backend}
        onQuickCopyChange={onQuickCopyChange}
        onBack={() => setScreen("main")}
      />
    );
  }
  if (screen === "language") {
    return (
      <LanguageScreen
        backend={backend}
        current={locale}
        onBack={() => setScreen("main")}
      />
    );
  }

  const footer = (
    <>
      2FA<span style={{ color: "var(--primary)" }}>u</span> · {t("Version")} {backend.version}
    </>
  );

  return (
    <SettingsPage title={t("Settings")} onBack={onClose} backLabel={t("Done")} footer={footer}>
      <SettingsGroup header={t("Vault")}>
        <ExportRow backend={backend} />
        <SettingsRow
          icon={<Download />}
          iconBg="#0a84ff"
          label={t("Import Vault")}
          chevron
          onClick={() => setScreen("import")}
        />
        <SettingsRow
          icon={<KeyRound />}
          iconBg="#8e8e93"
          label={t("Change Password")}
          chevron
          onClick={() => setScreen("password")}
        />
      </SettingsGroup>

      <SettingsGroup header={t("Preferences")}>
        <SettingsRow
          icon={<Clock />}
          iconBg="#ff9f0a"
          label={t("Auto-Lock")}
          value={autoLock == null ? "…" : lockLabel(autoLock, tr)}
          chevron
          onClick={() => setScreen("autolock")}
        />
        <SettingsRow
          icon={<Keyboard />}
          iconBg="#5e5ce6"
          label={t("Hotkeys")}
          value={formatChord(parseAccelerator(summon) ?? DEFAULT_SUMMON)}
          chevron
          onClick={() => setScreen("hotkeys")}
        />
        <SettingsRow
          icon={<Globe />}
          iconBg="#30b0c7"
          label={t("Language")}
          value={locale ? (LOCALE_NAMES[locale as keyof typeof LOCALE_NAMES] ?? locale) : "…"}
          chevron
          onClick={() => setScreen("language")}
        />
        {backend.autostart && (
          <SettingsRow
            icon={<Power />}
            iconBg="#34c759"
            label={t("Open at Login")}
            trailing={
              <Toggle
                aria-label={t("Open at Login")}
                pressed={autostart ?? false}
                disabled={autostart == null}
                onPressedChange={(on) => {
                  setAutostart(on);
                  void backend.autostart?.set(on).catch(() => backend.autostart?.get().then(setAutostart));
                }}
              >
                {autostart ? t("On") : t("Off")}
              </Toggle>
            }
          />
        )}
      </SettingsGroup>

      <SettingsGroup header={t("Sync")}>
        <SettingsRow
          icon={<RefreshCw />}
          iconBg="#30d158"
          label={t("Sync")}
          value={backend.sync.summary}
          chevron
          onClick={() => setScreen("sync")}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon={<MessageSquare />}
          iconBg="#ff9f0a"
          label={t("Feedback")}
          chevron
          onClick={() => backend.openLink(backend.links.feedback)}
        />
        <SettingsRow
          icon={<Languages />}
          iconBg="#5856d6"
          label={t("Help Translate")}
          chevron
          onClick={() => backend.openLink(backend.links.translate)}
        />
        <SettingsRow
          icon={<Code2 />}
          iconBg="#af52de"
          label={t("Source Code")}
          chevron
          onClick={() => backend.openLink(backend.links.sourceCode)}
        />
        <SettingsRow
          icon={<Info />}
          iconBg="#8e8e93"
          label={t("About")}
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
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  return (
    <SettingsRow
      icon={<Upload />}
      iconBg="#0a84ff"
      label={t("Export Vault")}
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
  const { t } = useT();
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
      setOk(t("Password changed."));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsPage title={t("Change Password")} onBack={onBack}>
      <SettingsGroup footer={t("Your password encrypts the vault on this device and can't be recovered.")}>
        <div className="flex flex-col gap-2 p-3">
          <Input
            type="password"
            placeholder={t("Current password")}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <Input
            type="password"
            placeholder={t("New password")}
            aria-invalid={tooShort}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <Input
            type="password"
            placeholder={t("Confirm new password")}
            aria-invalid={mismatch}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </SettingsGroup>
      {tooShort && (
        <p className="-mt-3 px-1 text-[11px] text-muted-foreground">{t("Use at least 8 characters.")}</p>
      )}
      {mismatch && <p className="-mt-3 px-1 text-[11px] text-destructive">{t("Passwords don't match.")}</p>}
      <Button disabled={!valid || busy} onClick={() => void submit()}>
        {busy ? t("Changing…") : t("Change Password")}
      </Button>
      <Status ok={ok} error={error} />
    </SettingsPage>
  );
}

function ImportScreen({ backend, onBack }: { backend: SettingsBackend; onBack: () => void }) {
  const { t, plural } = useT();
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
      setOk(
        plural(
          count,
          {
            one: "Imported. The vault now holds 1 account.",
            other: "Imported. The vault now holds {count} accounts.",
          },
          { count },
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const spec = backend.import;

  return (
    <SettingsPage title={t("Import Vault")} onBack={onBack}>
      <SettingsGroup footer={t("Merges an exported .dat file into this vault. Enter the password the file was exported with.")}>
        <div className="flex flex-col gap-2 p-3">
          <Input
            type="password"
            placeholder={t("Password of the file")}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
          />
          {spec.kind === "native" ? (
            <Button
              disabled={passphrase.length === 0 || busy}
              onClick={() => void run(() => spec.run(passphrase))}
            >
              {busy ? t("Importing…") : t("Choose File & Import")}
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
  const tr = useT();
  const { t } = tr;
  return (
    <SettingsPage title={t("Auto-Lock")} onBack={onBack}>
      <SettingsGroup footer={t("How long the app can sit idle before it locks and asks for your password again.")}>
        {AUTO_LOCK_OPTIONS.map((m) => (
          <SettingsRow
            key={m}
            label={lockLabel(m, tr)}
            trailing={value === m ? <Check className="size-4 text-primary" /> : undefined}
            onClick={() => void onPick(m)}
          />
        ))}
      </SettingsGroup>
    </SettingsPage>
  );
}

function HotkeysScreen({
  backend,
  onQuickCopyChange,
  onBack,
}: {
  backend: SettingsBackend;
  onQuickCopyChange?: (c: QuickCopyConfig) => void;
  onBack: () => void;
}) {
  const { t } = useT();
  const [quickCopy, setQuickCopy] = useState<QuickCopyConfig | null>(null);
  const [summon, setSummon] = useState<string | null>(null);
  const [summonError, setSummonError] = useState<string | null>(null);

  useEffect(() => {
    void backend.hotkeys.getQuickCopy().then(setQuickCopy);
    void backend.hotkeys.summon.get().then(setSummon);
  }, [backend]);

  async function writeQuickCopy(next: QuickCopyConfig) {
    setQuickCopy(next);
    await backend.hotkeys.setQuickCopy(next);
    onQuickCopyChange?.(next);
  }

  async function writeSummon(chord: Chord) {
    if (backend.hotkeys.summon.kind !== "rebindable") return;
    const accel = toAccelerator(chord);
    setSummonError(null);
    try {
      await backend.hotkeys.summon.set(accel);
      setSummon(accel);
    } catch (e) {
      setSummonError(e instanceof Error ? e.message : String(e));
    }
  }

  const summonCap = backend.hotkeys.summon;

  return (
    <SettingsPage title={t("Hotkeys")} onBack={onBack}>
      <SettingsGroup header={t("Show 2FAU")} footer={t("The shortcut that opens the 2FAU popup from anywhere.")}>
        {summonCap.kind === "rebindable" ? (
          <div className="p-3">
            <HotkeyRecorder
              value={parseAccelerator(summon) ?? DEFAULT_SUMMON}
              onChange={(c) => void writeSummon(c)}
              captureKey
              error={summonError}
            />
          </div>
        ) : (
          <>
            <SettingsRow label={t("Current")} value={summon ?? t("Not set")} />
            <SettingsRow label={t("Change in browser…")} chevron onClick={() => summonCap.open()} />
          </>
        )}
      </SettingsGroup>

      <SettingsGroup
        header={t("Quick-copy codes")}
        footer={t("Copy an account's code with this modifier plus its number (1–5).")}
      >
        <SettingsRow
          label={t("Quick-copy 1–5")}
          trailing={
            <Toggle
              aria-label={t("Quick-copy 1–5")}
              pressed={quickCopy?.enabled ?? false}
              onPressedChange={(on) =>
                void writeQuickCopy({
                  enabled: on,
                  mods: quickCopy?.mods ?? { mod: true, shift: false, alt: false },
                })
              }
            >
              {quickCopy?.enabled ? t("On") : t("Off")}
            </Toggle>
          }
        />
        {quickCopy?.enabled && (
          <div className="p-3">
            <HotkeyRecorder
              value={{ ...quickCopy.mods, key: "" }}
              onChange={(c) =>
                void writeQuickCopy({
                  enabled: true,
                  mods: { mod: c.mod, shift: c.shift, alt: c.alt },
                })
              }
              captureKey={false}
            />
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              {formatChord(quickCopy.mods)} + 1–5
            </p>
          </div>
        )}
      </SettingsGroup>
    </SettingsPage>
  );
}

function AboutScreen({ backend, onBack }: { backend: SettingsBackend; onBack: () => void }) {
  const { t } = useT();
  return (
    <SettingsPage title={t("About")} onBack={onBack}>
      <div className="flex flex-col items-center gap-2 py-2">
        <LogoMark size={54} />
        <span className="text-[17px] font-semibold tracking-[-0.02em]">
          2FA<span style={{ color: "var(--primary)" }}>u</span>
        </span>
        <span className="text-[12px] text-muted-foreground">{t("Version")} {backend.version}</span>
      </div>
      <SettingsGroup footer={t("Your codes are generated on this device and never leave it.")}>
        <SettingsRow
          label={t("Source Code")}
          chevron
          onClick={() => backend.openLink(backend.links.sourceCode)}
        />
        <SettingsRow
          label={t("Feedback")}
          chevron
          onClick={() => backend.openLink(backend.links.feedback)}
        />
      </SettingsGroup>
    </SettingsPage>
  );
}

/** Pick the UI language. Persists via the host `locale` port, then reloads so the
 * host re-bootstraps with the new catalog (both hosts re-read the locale on load). */
function LanguageScreen({
  backend,
  current,
  onBack,
}: {
  backend: SettingsBackend;
  current: string | null;
  onBack: () => void;
}) {
  const { t } = useT();
  return (
    <SettingsPage title={t("Language")} onBack={onBack}>
      <SettingsGroup footer={t("Translations are community-contributed and may be incomplete.")}>
        {SUPPORTED_LOCALES.map((l) => (
          <SettingsRow
            key={l}
            label={LOCALE_NAMES[l]}
            trailing={current === l ? <Check className="size-4 text-primary" /> : undefined}
            onClick={async () => {
              await backend.locale.set(l);
              location.reload();
            }}
          />
        ))}
      </SettingsGroup>
    </SettingsPage>
  );
}
