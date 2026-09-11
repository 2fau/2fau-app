import { I18nProvider, loadMessages, resolveLocale } from "@twofau/ui";
import ReactDOM from "react-dom/client";
import { readSettings } from "../vault/settings";
import { initWasm } from "../wasm";
import { OptionsView } from "./options-view";
import "../index.css";

async function bootstrap() {
  await initWasm();
  const settings = await readSettings().catch(() => null);
  const locale = settings?.locale || resolveLocale(navigator.language);
  const messages = await loadMessages(locale, "ui");
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <I18nProvider locale={locale} messages={messages}>
      <OptionsView />
    </I18nProvider>,
  );
}

void bootstrap();
