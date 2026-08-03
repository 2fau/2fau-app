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
- **Firefox (AMO)**: set the real add-on id in `scripts/firefox-manifest.mjs`
  (`GECKO_ID`), then either upload the zipped `dist-firefox/` on AMO, or let CI
  sign it: add `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` repo secrets (from an AMO
  API key) and the release workflow attaches a signed `.xpi`.

## Per-browser differences

| | Chrome/Edge | Firefox |
| --- | --- | --- |
| Background | service worker | event page (`scripts`, `type: module`) |
| Clipboard | offscreen document | direct DOM write in the background page |
| Options | `options_page` | `options_ui` |
| `offscreen` permission | yes | dropped |
| Min version | Chrome 116 | Firefox 128 |
