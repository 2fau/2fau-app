# i18n Specification

## Purpose

`@twofau/i18n` and the wiring that makes the desktop app, the browser extension,
and the marketing site translatable from one shared set of locale catalogs, with
language selection in Settings and on the site.

## Requirements

### Requirement: English source strings are the keys

Translation SHALL use the gettext/Lingui convention: the English source string is
the lookup key — `t('Auto-Lock')`, `t('{count} minutes', { count })`. No invented
dot-path ids. A missing key SHALL fall back to the English source, so the UI is
never blank. Identical English needing different translations SHALL be
disambiguated with an optional `_ctx`, stored as `` `${_ctx}${source}` `` and
looked up before the bare source.

#### Scenario: Locale lacks a string

- **WHEN** the active catalog has no entry for a source string
- **THEN** the English source renders

#### Scenario: Catalog entry is an empty string

- **WHEN** a catalog maps a source string to an empty value
- **THEN** it is treated as untranslated and the English source renders

#### Scenario: Ambiguous English

- **WHEN** two surfaces use `Download` with different meanings
- **THEN** each passes a distinct `_ctx` and receives its own translation

### Requirement: Supported locales and resolution

The system SHALL support twelve locales — `en` (source), `zh-CN`, `es`, `pt-BR`,
`ja`, `de`, `fr`, `ru`, `ko`, `it`, `tr`, `pl` — and `resolveLocale(tag)` SHALL
map any BCP-47 tag to the closest supported locale, falling back to `en`.

#### Scenario: Regional variant

- **WHEN** `resolveLocale` receives `pt` or `en-US`
- **THEN** it returns `pt-BR` and `en` respectively

#### Scenario: Unsupported language

- **WHEN** `resolveLocale` receives an unsupported tag
- **THEN** it returns `en`

### Requirement: Namespaced catalogs per surface

Catalogs SHALL be split by surface — `ui` (app, extension, shared components),
`site` (marketing), and `store` (extension manifest name, description, commands)
— so each target bundles only what it needs. `loadMessages(locale, namespace)`
SHALL dynamically import a single locale's namespace, and no target SHALL bundle
all twelve locales.

#### Scenario: Extension popup bundle

- **WHEN** the extension is built
- **THEN** it loads only the active non-English `ui` catalog at runtime, and English needs no catalog at all

### Requirement: Plural selection

`plural(count, forms, vars?)` SHALL choose a CLDR category via
`Intl.PluralRules` for the active locale, keyed in the catalog by the English
`other` form, and SHALL fall back to the matching English form when the category
is absent. `{count}` SHALL be interpolated.

#### Scenario: Locale with more categories than English

- **WHEN** a Russian catalog provides `one`, `few`, and `many` for a count
- **THEN** the category matching the count is selected

#### Scenario: Untranslated plural

- **WHEN** no translated object exists for the key
- **THEN** the English `one`/`other` form matching the count renders

### Requirement: Locale is a user setting

`SettingsBackend` SHALL expose `locale: { get, set }`, persisted in
`localStorage` on desktop and `chrome.storage.local` in the extension, defaulting
to `resolveLocale(navigator.language)` when unset. A Settings screen SHALL list
the supported locales by native name and switch the provider live.

#### Scenario: Switching language

- **WHEN** the user picks another language in Settings
- **THEN** the setting is persisted and the UI re-renders in that language without a restart

### Requirement: Every user-facing string is wrapped

Text nodes, `placeholder`, `aria-label`, and `title` values in `@twofau/ui` and
the site SHALL go through `t()` or `plural()`. `scripts/check-i18n.mjs` SHALL
verify every locale carries exactly the extracted `en` source set and SHALL run in
CI.

#### Scenario: A new literal is added

- **WHEN** a component adds an unwrapped user-facing string
- **THEN** extraction and `check-i18n` surface it as missing from the catalogs

#### Scenario: Orphaned key

- **WHEN** a source string is removed from the code but remains in a catalog
- **THEN** `check-i18n` reports it as orphaned

### Requirement: Extension store metadata is localized by generation

The manifest SHALL declare `default_locale` and use `__MSG_*__` placeholders for
`name`, `description`, and each command description. `scripts/gen-locales.mjs`
SHALL generate `_locales/<locale>/messages.json` from the `store` namespace, whose
keys are short stable ids rather than English sources because placeholders must be
identifiers. `_locales/` SHALL be generated at build time and not committed.

#### Scenario: Packaging the extension

- **WHEN** the extension is built or packaged
- **THEN** `_locales` is regenerated for all supported locales before bundling

### Requirement: Site is routed per locale

The site SHALL use Astro's built-in i18n routing with `/` as English and other
locales prefixed, localized `title`/`description`/`og:locale`, `hreflang`
alternates including `x-default`, a canonical per localized URL, and a nav
language selector linking to the current path under each locale. React islands
SHALL receive only the strings they use as props.

#### Scenario: Visiting a localized page

- **WHEN** a visitor opens `/es/`
- **THEN** the page renders in Spanish with Spanish metadata and hreflang alternates for every locale

#### Scenario: Island bundle size

- **WHEN** a React island is hydrated
- **THEN** it carries only its own resolved strings, not a full locale catalog

### Requirement: Machine translations are marked for review

Non-English catalogs shipped without human review SHALL carry
`"_meta": { "review": "machine" }`.

#### Scenario: Adding a locale

- **WHEN** a machine-translated catalog is committed
- **THEN** it is marked for review so a later human pass can find it
