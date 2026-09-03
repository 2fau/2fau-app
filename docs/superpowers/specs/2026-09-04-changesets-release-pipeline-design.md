# Changesets → tag → build release pipeline

**Status:** design (approved model: app+extension share one version; release
carries full changelog + all assets, initiated by the Changesets flow)
**Date:** 2026-09-04

## Goal

Replace ad-hoc version bumps with a Changesets-driven release process that:

- manages one product version shared by the desktop app and both browser
  extensions,
- generates a changelog,
- cuts a GitHub Release carrying that full changelog **and** every build asset
  (desktop mac/win/linux installers + Chrome/Firefox `.crx`/`.xpi`/`.zip`),
- requires no manual editing of version strings anywhere.

## Current state

- Changesets is initialised: `.changeset/config.json` (repo `2fau/2fau-app`,
  `baseBranch: main`, `changelog: @changesets/changelog-github`), and
  `@changesets/cli ^3.0.1` is a root devDependency.
- **`@changesets/changelog-github` is referenced by config but NOT installed** —
  `changeset version` will fail until it is added.
- Everything is at `0.1.0`: root `package.json`, `@twofau/app`,
  `@twofau/extension`, `@twofau/ui`, `@twofau/core-wasm`
  (`@twofau/site` is independent at `0.0.1`).
- The version string is duplicated outside package.json in:
  `apps/twofau-extension/manifest.json`, `apps/twofau-app/src-tauri/tauri.conf.json`,
  `Cargo.toml` `[workspace.package]`, `apps/twofau-app/src-tauri/Cargo.toml`,
  `crates/twofau-wasm/Cargo.toml`, and the three matching `[[package]]` entries
  in `Cargo.lock`.
- `release.yml` already builds desktop apps (mac self-hosted / ubuntu / windows)
  and, in the Linux leg, packages the extensions (`pnpm --filter
  @twofau/extension package` → crx/xpi/zips) and uploads them. On a `v*` tag it
  builds a **draft** release with an **empty body**; on push to main it re-cuts
  the rolling `tip` prerelease.
- `origin` = `git@github.com:2fau/2fau-app.git`. `secrets.RELEASE_TOKEN` (a PAT
  with Contents: read/write) already exists and is used by `release.yml`; the
  org disables write for the default `GITHUB_TOKEN`.

## Architecture

Responsibilities split across two workflows joined by a git tag:

- **Changesets owns** version numbers, the changelog, the "Version Packages" PR,
  and creating the GitHub Release shell (with changelog body).
- **`release.yml` owns** building and uploading all assets, then publishing the
  release.

### Flow

1. A contributor runs `pnpm changeset`, writes a summary, picks a bump. The
   changeset file is committed with the change.
2. **`version.yml`** (push to `main`) runs `changesets/action@v1`:
   - **version command** `pnpm run version` →
     `changeset version` (bumps package.json versions + writes `CHANGELOG.md`),
     then `node scripts/sync-versions.mjs` (propagates the version to the non-JS
     files), then `pnpm install --lockfile-only` (refreshes `pnpm-lock.yaml`).
   - The action opens/updates a **"Version Packages" PR** containing all of
     the above.
3. When that PR is **merged**, `version.yml` runs again; no changesets remain, so
   `changesets/action` runs its **publish command** `pnpm run release` →
   `node scripts/create-release.mjs`:
   - reads the new version `V` from `apps/twofau-app/package.json`,
   - extracts the `V` section from `apps/twofau-app/CHANGELOG.md` as release notes,
   - `gh release create vV --draft --title "2FAU vV" --notes-file <notes>` —
     creates the tag `vV` and a **draft** release with the full changelog,
   - idempotent: if the tag/release already exists, it exits 0 without error.
4. Creating the tag with `RELEASE_TOKEN` (a PAT) triggers **`release.yml`** on the
   `v*` tag. It builds desktop installers and packages the extensions and uploads
   every asset to the existing `vV` draft release.
5. A new **`finalize`** job in `release.yml` (`needs: [bundle]`, tag path only)
   flips the release **draft → published** and marks it `--latest`, so the
   release only goes public once its assets are attached.

Draft-until-complete is what guarantees the published release is never
half-empty. Merging the Version PR is the single human action; everything after
is automatic.

### Why RELEASE_TOKEN (not GITHUB_TOKEN)

A tag created by the default `GITHUB_TOKEN` does not trigger other workflows
(GitHub loop-prevention), so `release.yml` would never fire. `version.yml` must
use `secrets.RELEASE_TOKEN` for checkout and for the `gh` release/tag creation.

### Interaction with the existing continuous build

When the Version PR merges, the push to `main` also triggers `release.yml`'s
continuous path (re-cut `tip`). That is unchanged and independent of the
versioned `vV` release. No conflict.

## Components

### `.changeset/config.json` (edit)

Add the fixed group so the two shipped products always share one version:

```jsonc
"fixed": [["@twofau/app", "@twofau/extension"]],
```

`@twofau/ui` / `@twofau/core-wasm` bump as internal patch dependencies
(`updateInternalDependencies: "patch"`, already set) and are invisible to users.
`@twofau/site` stays out of the group. `access: public` is irrelevant (nothing
is npm-published) and left as-is.

### `scripts/sync-versions.mjs` (new)

Pure, unit-tested. Exports `syncVersions(version, { root })` that writes
`version` into:

- `apps/twofau-extension/manifest.json` — JSON `version` field.
- `apps/twofau-app/src-tauri/tauri.conf.json` — JSON `version` field.
- `Cargo.toml` — the `version = "..."` line inside `[workspace.package]`.
- `apps/twofau-app/src-tauri/Cargo.toml` — the top-level `version = "..."`.
- `crates/twofau-wasm/Cargo.toml` — the top-level `version = "..."`.
- `Cargo.lock` — the `version` line of the `[[package]]` blocks named
  `twofau-app`, `twofau-core`, `twofau-wasm`.

TOML/lock edits are scoped regex replacements (no cargo toolchain needed, keeping
the version job JS-only). CLI entry reads the version from
`apps/twofau-app/package.json` when run with no argument, so `pnpm run version`
just calls `node scripts/sync-versions.mjs`.

Tests (Vitest, run via the extension or a root test) cover: manifest/tauri JSON
rewrite, each Cargo.toml scoped replacement (only the intended line changes), and
Cargo.lock updating exactly the three named packages.

### `scripts/create-release.mjs` (new)

Reads `V` from `apps/twofau-app/package.json`. Extracts the first version section
from `apps/twofau-app/CHANGELOG.md` matching `## V`. Runs
`gh release create vV --draft --title "2FAU vV" --notes-file <tmp>`. Skips
cleanly if `vV` already exists (`gh release view vV` succeeds). Relies on
`GH_TOKEN=RELEASE_TOKEN` in the workflow env.

### root `package.json` scripts (edit)

```jsonc
"changeset": "changeset",
"version": "changeset version && node scripts/sync-versions.mjs && pnpm install --lockfile-only",
"release": "node scripts/create-release.mjs"
```

### root devDependencies (edit)

Add `@changesets/changelog-github` (config already references it).

### `.github/workflows/version.yml` (new)

```yaml
name: Version
on:
  push:
    branches: [main]
concurrency:
  group: version-${{ github.ref }}
  cancel-in-progress: false
permissions:
  contents: write
  pull-requests: write
jobs:
  version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@... # v4, with token: RELEASE_TOKEN, fetch-depth: 0
      - uses: pnpm/action-setup@...
      - uses: actions/setup-node@... # node 24, cache pnpm
      - run: pnpm install --frozen-lockfile=false
      - uses: changesets/action@... # pinned SHA
        with:
          version: pnpm run version
          publish: pnpm run release
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN }}
          GH_TOKEN: ${{ secrets.RELEASE_TOKEN }}
```

Actions are pinned to commit SHAs (repo convention).

### `.github/workflows/release.yml` (edit)

- Tag path: set `releaseDraft: false` in the tauri-action step is **not** used —
  instead leave tauri-action to upload into the pre-created draft by `tagName`
  and do **not** pass a `releaseBody` on the tag path (so the changelog body set
  by `create-release.mjs` is preserved). Verify during implementation that
  tauri-action uploads to the existing release without clearing its body; if it
  does clear it, pass the same extracted changelog as `releaseBody` instead.
- Add a `finalize` job:

```yaml
finalize:
  needs: [bundle]
  if: github.ref_type == 'tag'
  runs-on: ubuntu-latest
  permissions:
    contents: write
  steps:
    - name: Publish the release
      env:
        GH_TOKEN: ${{ secrets.RELEASE_TOKEN || github.token }}
        REPO: ${{ github.repository }}
        TAG: ${{ github.ref_name }}
      run: gh release edit "$TAG" --repo "$REPO" --draft=false --latest
```

`needs: [bundle]` with default (success) gating means `finalize` runs after the
build matrix; the self-hosted mac leg is already `continue-on-error`, so its
absence does not block publishing.

## Testing / verification

- `sync-versions.mjs`: Vitest unit tests (fixtures for each file type), asserting
  only the intended lines change.
- Dry run locally: `node scripts/sync-versions.mjs 9.9.9` then
  `git diff` shows exactly the six files updated correctly; revert.
- `create-release.mjs`: extraction logic unit-testable against a sample
  CHANGELOG; the `gh` call is verified by inspection / a first real run.
- End-to-end can only be confirmed on GitHub: add a changeset, watch the Version
  PR appear, merge it, confirm the draft release with changelog is created, the
  tag fires `release.yml`, assets attach, and `finalize` publishes.
- `changeset status` in CI is optional; not adding a PR gate for now (YAGNI).

## Out of scope

- npm publishing (all packages private).
- AMO/Chrome Web Store store submission (the existing optional AMO-signing step in
  `release.yml` is untouched).
- Changelog aggregation across packages: the app's `CHANGELOG.md` is the
  canonical release notes; the extension's near-identical CHANGELOG is not merged
  in.
