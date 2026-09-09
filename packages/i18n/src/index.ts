export * from "./locales";
export { loadMessages, type Namespace } from "./load";

export type PluralForms = Record<string, string>;
export type Messages = Record<string, string | PluralForms>;
export type Vars = Record<string, string | number> & { _ctx?: string };

/** gettext msgctxt separator between a context and the source string. */
const CTX = "";

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = vars[k];
    return v == null ? `{${k}}` : String(v);
  });
}

/** Build `t`/`plural` bound to a locale + its (already-loaded) catalog. */
export function createTranslator(locale: string, messages: Messages) {
  const t = (source: string, vars?: Vars): string => {
    const ctxKey = vars?._ctx ? `${vars._ctx}${CTX}${source}` : null;
    // An empty string is an untranslated stub, not a translation — fall back to
    // the English source (the key) so a half-filled locale never renders blank.
    const ctxHit = ctxKey != null ? messages[ctxKey] : undefined;
    const hit = typeof ctxHit === "string" && ctxHit !== "" ? ctxHit : messages[source];
    const template = typeof hit === "string" && hit !== "" ? hit : source;
    return interpolate(template, vars);
  };

  const plural = (count: number, forms: PluralForms, vars?: Vars): string => {
    const category = new Intl.PluralRules(locale).select(count); // "one" | "other" | …
    const entry = messages[forms.other]; // catalog key is the English `other` form
    const table: PluralForms = entry != null && typeof entry === "object" ? entry : forms;
    const template = table[category] ?? table.other ?? forms.other;
    return interpolate(template, { count, ...vars });
  };

  return { t, plural, locale };
}

export type Translator = ReturnType<typeof createTranslator>;
