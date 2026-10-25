import { useEffect, useState } from "react";
import { loadMessages, resolveLocale, type Messages } from "@twofau/i18n";
import { TwoFAUApp } from "@twofau/ui/src/app";
import { DemoVaultService } from "./demo-vault";

// The real popup focuses its search box on open; inside the homepage that would
// pull keyboard focus into the iframe and break page scrolling. Hold focus()
// until the visitor first clicks into the demo.
const focus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function () {};
addEventListener("pointerdown", () => (HTMLElement.prototype.focus = focus), { once: true, capture: true });

/** The real popup UI over an in-memory demo vault. */
export default function LiveDemo() {
  const [service] = useState(() => new DemoVaultService());
  const [i18n, setI18n] = useState<{ locale: string; messages: Messages } | null>(null);

  useEffect(() => {
    const locale = resolveLocale(new URLSearchParams(location.search).get("lang"));
    void loadMessages(locale, "ui").then((messages) => setI18n({ locale, messages }));
  }, []);

  if (!i18n) return null;
  return <TwoFAUApp service={service} locale={i18n.locale} messages={i18n.messages} />;
}
