# 2FAu browser extension

The 2FAu authenticator for Chrome and Firefox, built from one source. Codes are
generated locally in the browser (WASM) and never sent anywhere; an optional
loopback bridge can proxy to the desktop app.

## Build

From the repo root (needs the ts-rs bindings and the WASM package first):

```bash
cargo test -p twofau-core      # emit ts-rs bindings
pnpm build:core-wasm           # build the WASM package
pnpm --filter @twofau/extension build:browsers
```

That produces two unpacked builds:

- `dist/` — **Chrome/Edge** (MV3 service-worker background).
- `dist-firefox/` — **Firefox** (MV3 event-page background), with a Gecko
  manifest derived from the Chrome one by `scripts/firefox-manifest.mjs`.

`pnpm --filter @twofau/extension build` alone builds just the Chrome `dist/`;
`pnpm --filter @twofau/extension pack:firefox` derives `dist-firefox/` from it.

## Package (distributable files)

To build both browsers' shippable files in one step:

```bash
pnpm --filter @twofau/extension package
```

That rebuilds `dist/`, then writes into `artifacts/`:

- `2fau-chrome-<version>.crx` — signed Chrome extension (CRXv3).
- `2fau-chrome-<version>.zip` — the same payload as a plain zip (Chrome Web
  Store uploads want the zip, not the crx).
- `2fau-firefox-<version>.xpi` — the Firefox add-on (Gecko manifest).

`pack:chrome` / `pack:firefox:xpi` build just one browser's file from an
existing `dist/`. The crx is signed with `key.pem`, generated on first run and
reused after — it fixes the extension's id, so keep it (it is gitignored, never
commit it). `artifacts/`, `*.crx`, `*.xpi` and `key.pem` are all gitignored.

## Load unpacked

- **Chrome/Edge**: `chrome://extensions` → enable *Developer mode* → *Load
  unpacked* → select `dist/`.
- **Firefox**: `about:debugging#/runtime/this-firefox` → *Load Temporary
  Add-on* → select any file in `dist-firefox/` (e.g. `manifest.json`).

For an auto-reloading Firefox session (Vite rebuild → re-pack → `web-ext run`
reloads the add-on), run one command instead:

```bash
pnpm --filter @twofau/extension dev:firefox
```

## Lint (Firefox / AMO rules)

```bash
pnpm --filter @twofau/extension lint:firefox
```

Fails on errors only. Expected warnings: the `offscreen.*` calls (Chrome-only,
guarded at runtime and unused on Firefox) and React's `innerHTML` assignments.

## Publish

- **Chrome Web Store**: upload the zipped `dist/`.
- **Firefox (AMO, listed)**: the add-on ships from addons.mozilla.org. The add-on
  id is `firefox@2fau.app` (`GECKO_ID` in `scripts/firefox-manifest.mjs`) and must
  match the AMO listing. On a `v*` tag, the release workflow submits a **listed**
  version for review via `web-ext sign --channel listed` (with a git-archive source
  upload, since the bundles are minified — see `REVIEWERS.md`). It runs only when
  `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` repo secrets are set (addons.mozilla.org →
  Manage API Keys). One-time setup: create the listed add-on on AMO and complete
  its listing metadata before the first version can go public. Listed submissions
  don't produce a self-hosted `.xpi`; users install from the store.

## Per-browser differences

| | Chrome/Edge | Firefox |
| --- | --- | --- |
| Background | service worker | event page (`scripts`, `type: module`) |
| Clipboard | offscreen document | direct DOM write in the background page |
| Options | `options_page` | `options_ui` |
| `offscreen` permission | yes | dropped |
| Min version | Chrome 116 | Firefox 128 |
