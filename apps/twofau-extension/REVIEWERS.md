# Firefox add-on — source & build instructions (for AMO reviewers)

This add-on's `popup.js`, `background.js`, `options.js` and `offscreen.js` are
produced by a build step (Vite/Rollup bundling plus a Rust→WebAssembly compile),
so the shipped files are not the human-readable source. This document explains
how to reproduce the exact contents of `dist-firefox/` (the reviewed package)
from the accompanying source archive.

## What the source archive contains

All tracked files of the project at the released tag — a pnpm + Cargo monorepo.
The Firefox extension lives in `apps/twofau-extension/` but depends on two
workspace packages that must be built first:

- `packages/core-wasm` — the Rust cryptographic/OTP core compiled to WebAssembly
  (source in `crates/`), and
- `packages/ui` — the shared React UI.

## Build environment

- **Node.js 24** with **pnpm 9.12.0** (`corepack enable` picks this up from the
  root `package.json` `packageManager` field).
- **Rust stable** (≥ 1.85; see `rust-toolchain.toml`) with the
  `wasm32-unknown-unknown` target.
- **wasm-pack** ≥ 0.13.

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
corepack enable
```

## Build steps

Run from the repository root:

```sh
pnpm install --frozen-lockfile
# ts-rs emits shared TypeScript bindings consumed by the UI:
cargo test -p twofau-core
# Build the WebAssembly core into packages/core-wasm/pkg:
pnpm build:core-wasm
# Build the extension and derive the Firefox (Gecko-manifest) output:
pnpm --filter @twofau/extension build:browsers
```

The result is `apps/twofau-extension/dist-firefox/`, byte-equivalent to the
submitted package (the Firefox manifest is derived from the Chrome one by
`apps/twofau-extension/scripts/firefox-manifest.mjs`).

## Notes

- No minifier obfuscates identifiers beyond standard Vite production bundling;
  source maps are not shipped in the add-on but the full source is in this
  archive.
- `wasm-opt` is disabled for the WASM build (see the crate's
  `package.metadata.wasm-pack.profile.release` settings), so the `.wasm` is the
  direct `wasm-pack` output.
