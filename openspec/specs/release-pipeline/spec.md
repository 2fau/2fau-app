# release-pipeline Specification

## Purpose

The Knope-driven release process: one product version shared by the desktop app
and both browser extensions, a generated changelog, a `v{version}` tag and GitHub
Release, and the existing workflow that builds and attaches assets.

## Requirements

### Requirement: One version, no hand-edited version strings

A single Knope `[package]` SHALL own the product version and update every
versioned file — the root and app/extension `package.json` files, the workspace
and crate `Cargo.toml` files, `Cargo.lock`, and the regex-matched `version` fields
in `manifest.json` and `tauri.conf.json`. No version string SHALL be edited by
hand. `@twofau/site`, `@twofau/ui`, and `@twofau/core-wasm` are excluded — the
product version does not track them.

#### Scenario: Bumping a release

- **WHEN** Knope prepares a release
- **THEN** every listed file lands on the same new version and the changelog is the only other diff

#### Scenario: Regex safety

- **WHEN** the manifest regex runs
- **THEN** only the intended `"version"` line changes, leaving `manifest_version` and `minimum_chrome_version` untouched

### Requirement: Conventional Commits drive the changelog

Changes SHALL be documented by Conventional Commits (`feat:`, `fix:`, `feat!:` or
`BREAKING CHANGE:` for major), optionally supplemented by Knope change files in
`.changeset/`. Non-user-facing prefixes such as `ci:`, `chore:`, and `docs:` SHALL
not trigger a release.

#### Scenario: Only chores landed

- **WHEN** the commits since the last tag are all ignored prefixes
- **THEN** there is nothing to release and the prepare step no-ops

### Requirement: Release PR is the single human action

A push to `main` SHALL run `knope prepare-release`, which bumps the versioned
files, writes the changelog, consumes change files, and opens or updates a
"chore: Release x.y.z" pull request from the `release` branch. The workflow SHALL
skip its own release commits so it does not loop, and SHALL check out full history
so commits since the last tag can be read.

#### Scenario: Release PR merged

- **WHEN** the release PR merges to `main`
- **THEN** the version bumps and changelog land, and the tag, release, and asset uploads follow with no further human action

### Requirement: Tag and release are created with a token that triggers workflows

`knope release` SHALL run on pushes to `main`, acting only when the version in the
files is ahead of the latest tag, and SHALL create the `v{version}` tag and a
published GitHub Release whose body is the changelog section. It SHALL authenticate
with `RELEASE_TOKEN`, because a tag created by the default `GITHUB_TOKEN` does not
trigger other workflows.

#### Scenario: Ordinary push to main

- **WHEN** the file version equals the latest tag
- **THEN** `knope release` no-ops

#### Scenario: Missing token

- **WHEN** `RELEASE_TOKEN` is not configured
- **THEN** the release path cannot create a workflow-triggering tag and the pipeline does not complete

### Requirement: Asset build attaches without overwriting the release body

The `v*` tag SHALL trigger the existing build, which packages desktop installers
and both extensions and uploads them to the already-created release without
replacing its body or notes.

#### Scenario: Uploading assets

- **WHEN** the tag build uploads artifacts
- **THEN** the Knope-written changelog body is preserved

### Requirement: Continuous `tip` path is unaffected

The rolling `tip` prerelease built from each push to `main` SHALL remain
unchanged, and the release job SHALL neither gate nor alter it.

#### Scenario: Push to main

- **WHEN** a commit lands on `main`
- **THEN** the `tip` prerelease is rebuilt exactly as before, whether or not a release is cut
