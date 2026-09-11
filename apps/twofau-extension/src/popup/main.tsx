import type { VaultService } from "@twofau/ui";
import {
  I18nProvider,
  loadMessages,
  modsFromToken,
  resolveLocale,
  StatusScreen,
  TwoFAUApp,
  useT,
} from "@twofau/ui";
import { parseMigration } from "@twofau/core-wasm";
import { MonitorOff } from "lucide-react";
import type { ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BridgeUnreachableError } from "../bridge/connection";
import { SCAN_MESSAGE } from "../shared/messages";
import { createVaultService } from "../vault/backend";
import { readSettings } from "../vault/settings";
import { accountMatchesSite, hostOf } from "../vault/site-match";
import { initWasm } from "../wasm";
import "../index.css";

function Failed({ message }: { message: string }) {
  const { t } = useT();
  return (
    <p className="p-4 text-[13px] text-destructive">{t("Could not start: {error}", { error: message })}</p>
  );
}

function openSettings() {
  void chrome.runtime.openOptionsPage();
}

/** In Desktop-vault (client) mode the whole vault lives in the desktop app, so
 * if it's closed there's nothing to show. Render a proper empty state with a way
 * to reach Settings and switch modes, instead of a raw error. */
function DesktopUnavailable({ unreachable }: { unreachable: boolean }) {
  const { t } = useT();
  return (
    <StatusScreen
      icon={<MonitorOff className="size-10" />}
      title={unreachable ? t("Desktop app is closed") : t("Can’t reach the desktop vault")}
      message={
        unreachable
          ? t(
              "You’re using the desktop vault, so there’s nothing to show until the 2FAU desktop app is running (with the bridge enabled). Open the app, or switch modes in Settings.",
            )
          : t(
              "The desktop app is reachable but refused this browser. Re-pair it, or switch modes in Settings.",
            )
      }
      actions={[
        { label: t("Open Settings"), onClick: openSettings },
        { label: t("Retry"), variant: "secondary", onClick: () => window.location.reload() },
      ]}
    />
  );
}

async function bootstrap() {
  const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
  const settings = await readSettings().catch(() => null);
  const locale = settings?.locale || resolveLocale(navigator.language);
  const messages = await loadMessages(locale, "ui");
  const withI18n = (node: ReactNode) => (
    <I18nProvider locale={locale} messages={messages}>
      {node}
    </I18nProvider>
  );

  let service: VaultService;
  try {
    // WASM first: building the service already needs it to read the vault.
    await initWasm();
    service = await createVaultService();
  } catch (err) {
    // In client mode a failure here means the desktop app is down or unpaired —
    // show a recoverable empty state, not a dead error. Any other mode is a
    // genuine startup failure worth surfacing verbatim.
    if (settings?.mode === "client") {
      root.render(withI18n(<DesktopUnavailable unreachable={err instanceof BridgeUnreachableError} />));
    } else {
      root.render(withI18n(<Failed message={err instanceof Error ? err.message : String(err)} />));
    }
    return;
  }
  // Smart filter: the active tab's host lets the list surface matching accounts.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  const host = hostOf(tab?.url);

  const quickCopy = {
    enabled: settings?.quickCopyEnabled ?? true,
    mods: modsFromToken(settings?.quickCopyMods ?? "mod"),
  };

  root.render(
    <TwoFAUApp
      service={service}
      locale={locale}
      messages={messages}
      quickCopy={quickCopy}
      matchAccount={host ? (a) => accountMatchesSite(a, host) : undefined}
      parseMigration={parseMigration}
      requestClose={() => window.close()}
      onOpenSettings={() => chrome.runtime.openOptionsPage()}
      onScan={() => {
        // The worker drives the drag-to-select scan: the popup closes the
        // instant the user clicks into the page, so it can't run the overlay
        // itself. It captures the tab, injects the selection UI, decodes the
        // chosen region, and reports back with a notification.
        void chrome.runtime.sendMessage({ type: SCAN_MESSAGE });
        window.close();
      }}
    />,
  );
}

void bootstrap();
