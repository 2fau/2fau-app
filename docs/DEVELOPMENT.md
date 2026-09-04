# Development

## Prerequisites

```bash
rustup update stable            # needs >= 1.85 (deps use edition2024)
rustup target add wasm32-unknown-unknown
cargo install wasm-pack         # >= 0.13; 0.10 cannot parse workspace inheritance
pnpm --version                  # pnpm 9.x (see packageManager in package.json)
```

Linux desktop builds also need:
`libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libglib2.0-dev`.

## First run

```bash
pnpm install
cargo test -p twofau-core       # ALSO emits packages/core-wasm/bindings/*.ts (ts-rs)
pnpm build:core-wasm            # wasm-pack -> packages/core-wasm/pkg
```

Order matters: the TS build fails without the bindings and the wasm `pkg/`.

## Everyday commands

```bash
# Rust
cargo test -p twofau-core
cargo clippy -p twofau-core -p twofau-wasm --all-targets -- -D warnings
cargo fmt --all --check
cargo check -p twofau-app                 # needs apps/twofau-app/dist to exist

# JS
pnpm -r test                              # all Vitest suites
pnpm --filter @twofau/ui test
pnpm --filter @twofau/ui storybook        # component sandbox on :6006 (MockVaultService)
pnpm --filter @twofau/ui typecheck

# Desktop app
pnpm tauri dev                            # run the real tray app
pnpm tauri build                          # installers for the host OS
pnpm tauri build -- --no-bundle           # just the binary, skips installer tooling

# Chrome extension
pnpm --filter @twofau/extension test      # extension unit tests
pnpm --filter @twofau/extension build     # -> apps/twofau-extension/dist (load unpacked)
pnpm --filter @twofau/extension dev       # rebuild on change
```

## Verify (run before claiming anything is done)

```bash
cargo fmt --all --check \
  && cargo clippy -p twofau-core -p twofau-wasm --all-targets -- -D warnings \
  && cargo test -p twofau-core \
  && pnpm build:core-wasm \
  && pnpm -r test
```

Tray/popup behaviour is **not** covered by any of this — it needs `pnpm tauri dev` and a
human looking at the screen. Say so rather than implying a GUI fix was verified.

## Traps (each of these already cost real time)

- **Script name is `build:core-wasm`** at the root (`build:wasm` only exists inside
  `@twofau/core-wasm`). CI referenced the wrong one and failed.
- **`wasm-opt` is disabled** for the wasm build (`[package.metadata.wasm-pack.profile.release]
  wasm-opt = false`) — it crashes on the multi-table output. Don't re-enable it casually.
- **PBKDF2 makes debug tests crawl.** The root Cargo.toml sets `[profile.dev.package."*"]
  opt-level = 3` so dependencies are optimised while our crates stay fast to rebuild. Keep it.
- **Cargo workspace members are listed explicitly**, not globbed, because a stray generated
  directory under `crates/` breaks a glob.
- **NSIS/`makensis` is broken on Apple Silicon Homebrew** (crashes with `std::bad_alloc` on
  any script). Cross-building a Windows *installer* from macOS does not work; use
  `--no-bundle` locally and let CI produce installers.
- **Don't point the app at the Swift vault path.** `dev.artkost.2fau` app-data dir only.
- **jsdom quirks**: `navigator.clipboard` must be installed with `Object.defineProperty`;
  the WASM contract test runs with `// @vitest-environment node`.
- **React types are pinned to 19 workspace-wide.** Mixing 18/19 `@types/react` produces
  "bigint is not assignable to ReactNode" on every lucide icon.
- **The desktop bundle still ships the ~600 KB WASM blob** even though the Tauri app doesn't
  need it (it comes in via `MockVaultService`). Fixable by moving the mock to a subpath
  export; not done yet.
- **The extension's `dist/` entry names are fixed** (`popup.js`, `background.js`,
  `options.js`, `offscreen.js`) because `manifest.json` can't reference hashed files. Don't
  "fix" the Rollup output names.
- **`chrome.storage.sync` is 100 KB total / 8 KB per item.** The vault is chunked at 6144
  chars; a large vault will hit the ceiling and raise `VaultQuotaError`.

## CI / release

- `.github/workflows/ci.yml` — four jobs: `rust` (fmt/clippy/test), `wasm` (wasm-pack +
  JS interop + UI tests), `app` (frontend build + `cargo check`), and `extension`
  (extension tests + build). All actions are pinned to commit SHAs and the token is
  `contents: read`.
- `.github/workflows/release.yml` — pushes to `main` publish a **continuous prerelease**
  under a rolling `tip` tag (the run deletes and recreates the tag itself, so no PAT is
  needed); `v*` tags build and upload installers + extensions to the matching release.
  Matrix: macOS arm64 + x64, Ubuntu, Windows.
- Neither installer is code-signed yet.

### Releasing (Knope)

Versioned releases are automated with [Knope](https://knope.tech); never edit version
strings by hand.

1. Land changes on `main` as **Conventional Commits** — `feat:` (→ patch while pre-1.0,
   minor after), `fix:` (→ patch), `feat!:` / `BREAKING CHANGE:` (→ minor pre-1.0, major
   after). `ci:` / `chore:` / `docs:` / `refactor:` / `test:` don't trigger a release. For
   a hand-written note, add a change file with `knope document-change`.
2. `prepare-release.yml` keeps a **"chore: Release x.y.z"** PR up to date with the next
   version + `CHANGELOG.md`. Review and merge it to release.
3. Merging runs the `knope-release` job in `release.yml`: `knope release` bumps every
   version file (`package.json`s, `Cargo.toml`/`Cargo.lock`, `manifest.json`,
   `tauri.conf.json`), tags `vX.Y.Z`, and creates the GitHub Release with the changelog.
4. That `v*` tag triggers `release.yml`'s build matrix, which uploads the desktop
   installers (`.dmg`/`.msi`/`.AppImage`/`.deb`/`.rpm`/…) and the extension
   `.crx`/`.xpi`/`.zip` to the Knope-created release. If the `AMO_JWT_ISSUER` /
   `AMO_JWT_SECRET` secrets are set, it also submits a **listed** Firefox version
   to addons.mozilla.org for review (`web-ext sign --channel listed`, with a
   git-archive source upload — see `apps/twofau-extension/REVIEWERS.md`). The
   Firefox add-on id is `firefox@2fau.app`; the listed add-on must exist on AMO
   with its metadata filled in before the first version can go public.
5. The rolling **`tip`** prerelease is separate and always tracks the latest `main`
   commit; it never submits to AMO.

`knope.toml` holds the config (single `[package]` → `v{version}` tags). Requires the
`RELEASE_TOKEN` secret so the Knope-created tag can trigger the build.
