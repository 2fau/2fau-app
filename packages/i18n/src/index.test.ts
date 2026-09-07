import { describe, expect, it } from "vitest";
import { createTranslator, resolveLocale } from "./index";

describe("createTranslator", () => {
  it("returns the source string when no translation exists (identity fallback)", () => {
    const { t } = createTranslator("de", {});
    expect(t("Auto-Lock")).toBe("Auto-Lock");
  });

  it("returns the translation when present", () => {
    const { t } = createTranslator("de", { "Auto-Lock": "Automatische Sperre" });
    expect(t("Auto-Lock")).toBe("Automatische Sperre");
  });

  it("interpolates {vars}", () => {
    const { t } = createTranslator("en", {});
    expect(t("Use at least {n} characters.", { n: 8 })).toBe("Use at least 8 characters.");
  });

  it("disambiguates by _ctx before the bare source", () => {
    const { t } = createTranslator("de", { "navDownload": "Holen", Download: "Herunterladen" });
    expect(t("Download", { _ctx: "nav" })).toBe("Holen");
    expect(t("Download")).toBe("Herunterladen");
  });

  it("selects the plural category via Intl.PluralRules", () => {
    const { plural } = createTranslator("en", {
      "{count} minutes": { one: "{count} minute", other: "{count} minutes" },
    });
    expect(plural(1, { one: "{count} minute", other: "{count} minutes" }, { count: 1 })).toBe(
      "1 minute",
    );
    expect(plural(5, { one: "{count} minute", other: "{count} minutes" }, { count: 5 })).toBe(
      "5 minutes",
    );
  });

  it("falls back to English plural forms when untranslated", () => {
    const { plural } = createTranslator("de", {});
    expect(plural(2, { one: "1 account", other: "{count} accounts" }, { count: 2 })).toBe(
      "2 accounts",
    );
  });
});

describe("resolveLocale", () => {
  it("maps region tags and falls back to en", () => {
    expect(resolveLocale("pt-BR")).toBe("pt-BR");
    expect(resolveLocale("pt")).toBe("pt-BR");
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("xx")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});
