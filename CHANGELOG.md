# Changelog

## 0.1.1 (2026-10-25)

### Features

- add @twofau/i18n core runtime (English-as-key)
- wire I18nProvider + wrap most shared UI strings
- translate shared UI, add locale setting + selector
- localize extension manifest via generated _locales
- localize the marketing site with routed locales
- machine-translate ui strings for de, es, zh-CN
- machine-translate ui + site for Russian
- introduce language selection
- migrate to openspec release
- add changeset
- migrate to openspec release
- openspec, initial wizard setup
- delete vault
- first-run setup wizard
- first run wizard + delete vault
- impeccable
- improve site
- live app popup demo on the homepage
- translate app, extension and site into all site locales
- improve site 

#### First-run setup wizard

A fresh install now asks where your vault should come from instead of only
offering to create one: start a new vault, import a vault file you exported
elsewhere, or — in the extension — use the vault in the desktop app. Importing
on first run adopts the file, so the passphrase that opens it unlocks this
device too. After creating a vault the desktop app offers to turn on the browser
bridge and show a pairing code.

#### Introduce language support

Now you can select lanugage in Settings

### Fixes

- claude
- fall back to source for empty-string stubs
- translation
- keep the popup open while a native file dialog is up
- link Windows download to setup.exe; build macOS dmg headless
- migrate to openspec

#### Accurate security claims and a mobile layout for the site

The home page now matches the vault the app actually uses (PBKDF2, a 34-byte header) and drops unverified ratings. The site works on phones, every call to action is a real link, and text contrast meets WCAG AA.

## 0.1.0

Initial release baseline.
