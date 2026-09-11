import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createTranslator, type Messages } from "./index";
import { DEFAULT_LOCALE } from "./locales";

const Ctx = createContext(createTranslator(DEFAULT_LOCALE, {}));

/** Provides `t`/`plural` bound to the active locale. Hosts load the active
 * locale's catalog (async) and pass it in; English shows immediately via the
 * identity fallback while a non-English catalog loads. */
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(() => createTranslator(locale, messages), [locale, messages]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Returns `{ t, plural, locale }` bound to the active locale. */
export function useT() {
  return useContext(Ctx);
}
