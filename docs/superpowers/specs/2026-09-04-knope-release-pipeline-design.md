# Knope release pipeline

**Status:** design
**Date:** 2026-09-04
**Supersedes:** the Changesets design (removed) — Knope replaces Changesets.

## Why Knope (not Changesets)

Changesets in a monorepo hardcodes tags as `<pkg>@<version>` (no `v` prefix) and
only bumps `package.json` files, forcing a custom sync script and an awkward
single-anchor package. Knope removes both problems:

- A **single `[package]` config tags as `v{version}`** (e.g. `v0.2.0`) and Knope
  creates the GitHub Release itself with the changelog as the body.
- **`versioned_files`** natively updates `Cargo.toml` (including
  `workspace.package.version`), `Cargo.lock`, `package.json`, and **regex**-based
  files (`manifest.json`, `tauri.conf.json`) — one version, kept in sync by Knope.

## Goal

A Knope-driven release process where:

- one product version is shared by the desktop app and both browser extensions,
- a changelog is generated,
- Knope creates the `v{version}` tag and the GitHub Release (with changelog),
- the existing `release.yml` builds desktop + extension assets and attaches them,
- the **Continuous Release (`tip`) path is unchanged**,
- no version string is edited by hand anywhere.

## Current state

- Changesets was initialised (`.changeset/config.json`, `@changesets/cli`
  devDependency, `@changesets/changelog-github` referenced but not installed).
  **This is removed** (see Migration).
- All product versions are `0.1.0`: root `package.json`, `@twofau/app`,
  `@twofau/extension`, `@twofau/ui`, `@twofau/core-wasm`; `@twofau/site` is
  independent at `0.0.1`.
- The version is duplicated in: `apps/twofau-extension/manifest.json`,
  `apps/twofau-app/src-tauri/tauri.conf.json`, `Cargo.toml`
  `[workspace.package]`, `apps/twofau-app/src-tauri/Cargo.toml` (`package.version`),
  `crates/twofau-wasm/Cargo.toml` (`package.version`), and the `twofau-app`,
  `twofau-core`, `twofau-wasm` entries in `Cargo.lock`. `crates/twofau-core`
  uses `version.workspace = true` (covered by the workspace bump).
- `pnpm-workspace.yaml` globs `packages/*` and `apps/*` (root is not a package).
- `release.yml` already: on `v*` tag builds desktop (mac self-hosted / ubuntu /
  windows) + packages/uploads the extensions to that tag's release; on push to
  main re-cuts the rolling `tip` prerelease. `origin` =
  `github.com:2fau/2fau-app`. `secrets.RELEASE_TOKEN` (PAT, Contents:rw) exists;
  the org disables write for the default `GITHUB_TOKEN`.

## Architecture

Knope owns version numbers, the changelog, the release PR, the `v{version}` tag,
and the GitHub Release. `release.yml` owns building and attaching assets. They
connect through the `v{version}` tag.

### Flow

1. A change lands on `main` documented by a **Conventional Commit** (`feat:`,
   `fix:`, `feat!:`/`BREAKING CHANGE:` for major) and/or a Knope **change file**
   in `.changeset/` (authored via `knope document-change` or by hand). Non-user
   changes use ignored prefixes (`ci:`, `chore:`, `docs:`…).
2. **`prepare-release.yml`** (push to `main`) runs `knope prepare-release`:
   `PrepareRelease` (bump every `versioned_file`, write `CHANGELOG.md`, consume
   change files) then `CreatePullRequest` → opens/updates a
   **"chore: Release x.y.z"** PR from branch `release` to `main`. No-ops when
   there is nothing to release.
3. Merging that PR lands the version bumps + changelog on `main`.
4. **`release.yml` gains a `knope-release` job** (push to main, first job): runs
   `knope release`. It is idempotent — it acts only when the version in the files
   is ahead of the latest tag (i.e. right after the release PR merges). It
   creates the `v{version}` tag and a published GitHub Release whose body is the
   changelog section. Uses `RELEASE_TOKEN` so the tag can trigger a workflow.
5. The `v{version}` tag triggers **`release.yml`'s existing tag path** → builds
   desktop installers, packages the extensions, and uploads every asset to the
   `v{version}` release.
6. The **Continuous (`tip`) path is untouched** and keeps building each `main`
   commit into the rolling prerelease.

Merging the release PR is the single human action; the tag, release, and asset
uploads follow automatically.

### Why the tag/release must be created with RELEASE_TOKEN

A tag/release created by the default `GITHUB_TOKEN` does not trigger other
workflows. `knope release` must run with `GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN }}`
so `release.yml`'s tag path fires.

### knope-release vs the tag build (no double release)

`knope release` runs in `release.yml` on the **push** event; the asset build runs
on the **tag** event. They are different triggers of the same file. `knope
release` creates the release + changelog; the tag build only *uploads assets* to
that existing release. The release already exists when the tag build runs, so the
tag path must **not** recreate or overwrite it (see Risk).

## Components

### `knope.toml` (new, repo root)

```toml
[package]
versioned_files = [
    "package.json",                            # root
    "apps/twofau-app/package.json",
    "apps/twofau-extension/package.json",
    "Cargo.toml",                              # workspace.package.version
    "apps/twofau-app/src-tauri/Cargo.toml",    # package.version
    "crates/twofau-wasm/Cargo.toml",           # package.version
    "Cargo.lock",                              # native support
    { path = "apps/twofau-extension/manifest.json", regex = '"version": "(?<version>\d+\.\d+\.\d+)"' },
    { path = "apps/twofau-app/src-tauri/tauri.conf.json", regex = '"version": "(?<version>\d+\.\d+\.\d+)"' },
]
changelog = "CHANGELOG.md"

[github]
owner = "2fau"
repo = "2fau-app"

[[workflows]]
name = "prepare-release"
[[workflows.steps]]
type = "PrepareRelease"
[[workflows.steps]]
type = "CreatePullRequest"
base = "main"
[workflows.steps.title]
template = "chore: Release {version}"
variables = { "{version}" = "Version" }
[workflows.steps.body]
template = "Automated release. Merging publishes:\n\n{changelog}"
variables = { "{changelog}" = "ChangelogEntry" }

[[workflows]]
name = "release"
[[workflows.steps]]
type = "Release"

[[workflows]]
name = "document-change"
[[workflows.steps]]
type = "CreateChangeFile"
```

Notes:
- **Single `[package]`** ⇒ tag format `v{version}`.
- All listed files are currently `0.1.0`; Knope requires them to share a version.
- `@twofau/site` (0.0.1), `@twofau/ui`, `@twofau/core-wasm` are **excluded** — the
  product version does not track them.
- The `manifest.json` regex is safe: `"manifest_version"` /
  `"minimum_chrome_version"` do not contain the literal `"version": "`.
- `crates/twofau-core` is not listed; its `version.workspace = true` follows the
  root `Cargo.toml` workspace bump. `Cargo.lock` is updated by Knope's native
  support for the three member packages.
- No `assets` in `knope.toml`: assets are attached by `release.yml` (see Risk for
  the alternative of letting Knope own assets).

### `CHANGELOG.md` (new, repo root)

Seeded with an initial entry (e.g. `## 0.1.0`) so Knope has a base to append to.

### `.github/workflows/prepare-release.yml` (new)

```yaml
name: Prepare release
on:
  push:
    branches: [main]
concurrency:
  group: prepare-release
  cancel-in-progress: true
permissions:
  contents: write
  pull-requests: write
jobs:
  prepare:
    # Don't loop on the release PR's own merge commit or Knope's bump commit.
    if: ${{ !startsWith(github.event.head_commit.message, 'chore: Release') }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@... # v4, fetch-depth: 0, token: RELEASE_TOKEN
      - uses: knope-dev/action@... # pinned SHA, with: version: <pinned knope version>
      - run: knope prepare-release --verbose
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN }}
```

`PrepareRelease` needs full history (`fetch-depth: 0`) to read commits since the
last tag. If there is nothing to release, `knope prepare-release` exits non-zero
by design; the step tolerates that (`continue-on-error` or a `|| true` guard that
still surfaces real errors — decided in the plan).

### `.github/workflows/release.yml` (edit — add one job, tag path unchanged in spirit)

Add a first job on the **push** path that creates the tag + release:

```yaml
  knope-release:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@... # v4, fetch-depth: 0, token: RELEASE_TOKEN
      - uses: knope-dev/action@... # pinned SHA + version
      - run: knope release --verbose
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN }}
```

Idempotent: on a normal push the version equals the latest tag and `knope
release` no-ops; on the release-PR merge it creates `v{version}` + the release.

**Continuous (`tip`) path stays byte-for-byte as today** — `reset-tip`, the
`push: branches:[main]` trigger, and the non-tag tauri-action inputs and
extension steps are unchanged. `knope-release` is a separate job and does not gate
or alter them.

**Tag path (asset attach):** the existing `bundle` job already runs on `v*` and
uploads assets. Because Knope pre-created the release, the tag path must not
overwrite its body/notes. Preferred implementation: on the tag path, upload with
`gh release upload "$TAG" <artifacts> --clobber` (which never touches the release
body) rather than letting tauri-action manage release metadata. During
implementation, verify whether tauri-action already preserves an existing
release's body when uploading by `tagName`; if it does, no tag-path change is
needed. This is a tag-path-only change and does not affect the `tip` path.

### Migration: remove Changesets

- Delete `.changeset/config.json` and `.changeset/README.md` (the `.changeset`
  folder is reused by Knope for change files; recreate empty if Knope needs it).
- Remove `@changesets/cli` (and the unused `@changesets/changelog-github`
  reference) from the root `package.json` devDependencies; refresh the lockfile.
- Remove the `changeset`/`version`/`release` npm scripts if any were added
  (none are committed yet).

### Root `package.json` scripts (optional convenience)

```jsonc
"changeset": "knope document-change",   // author a change file locally
"release:prepare": "knope prepare-release"
```

## Testing / verification

- **Local dry run:** `knope --version` (via a locally installed Knope) then, on a
  scratch branch with a dummy `feat:` commit, `knope prepare-release --dry-run`
  and confirm the six version files + `CHANGELOG.md` are the only diffs and all
  land on the same version.
- **Regex safety:** unit-check the two regexes against the real `manifest.json` /
  `tauri.conf.json` (only the intended `"version"` line changes).
- **Cargo.lock:** after a dry bump, `cargo metadata`/`git diff` shows the three
  member versions updated and the lock still valid.
- **End-to-end (GitHub only):** land a `feat:` commit → the "chore: Release" PR
  appears with correct bumps + changelog → merge → `knope release` creates
  `v0.2.0` + the release with changelog → the tag fires `release.yml` → assets
  attach → `tip` continuous build still works untouched.

## Out of scope

- The paid Knope Bot (GitHub App). We use the free `knope-dev/action` CLI.
- npm / store publishing (all packages private; AMO-signing step in `release.yml`
  is untouched).
- Letting Knope own asset upload directly (its `assets` + draft→upload→publish).
  Rejected for now because the assets are built across multiple OS runners; that
  would require a gather job and would duplicate the `tip` build matrix. Recorded
  as the alternative if the tag-path attach proves fragile.

## Open decisions (confirm before planning)

1. **Change documentation:** Conventional Commits as the primary source (with
   Knope change files allowed), vs. change-files-only. Recommended: Conventional
   Commits primary.
2. **Asset attach mechanism:** reuse `release.yml`'s tag path via `gh release
   upload` (recommended, minimal), vs. Knope-owns-assets gather job.
