# Knope Release Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abandoned Changesets setup with a Knope-driven release pipeline that manages one product version across all files, generates a changelog, creates the `v{version}` GitHub Release, and lets the existing `release.yml` attach desktop + extension assets.

**Architecture:** A single-`[package]` `knope.toml` lists every file carrying the version (`package.json`s, `Cargo.toml`/`Cargo.lock`, and regex-matched `manifest.json` + `tauri.conf.json`), so Knope bumps them together and tags `v{version}`. `prepare-release.yml` opens a "chore: Release" PR from Conventional Commits; merging it triggers a `knope release` job that creates the tag + GitHub Release (with changelog); the tag fires `release.yml`'s existing tag path, which uploads all assets via `gh release upload`. The continuous `tip` build is untouched.

**Tech Stack:** Knope (Rust CLI, `knope-dev/action`), Conventional Commits, pnpm workspace, GitHub Actions, Tauri.

**Spec:** `docs/superpowers/specs/2026-09-04-knope-release-pipeline-design.md`

## Global Constraints

- Repo: `2fau/2fau-app`; default branch `main`; `origin` = `git@github.com:2fau/2fau-app.git`.
- All product version files are currently `0.1.0` and MUST stay mutually consistent: `package.json` (root), `apps/twofau-app/package.json`, `apps/twofau-extension/package.json`, `Cargo.toml` (`[workspace.package]`), `apps/twofau-app/src-tauri/Cargo.toml` (`package.version`), `crates/twofau-wasm/Cargo.toml` (`package.version`), `Cargo.lock` (packages `twofau-app`, `twofau-core`, `twofau-wasm`), `apps/twofau-extension/manifest.json`, `apps/twofau-app/src-tauri/tauri.conf.json`.
- Excluded from the product version: `@twofau/site` (0.0.1), `@twofau/ui`, `@twofau/core-wasm`.
- `secrets.RELEASE_TOKEN` (PAT, Contents: read/write) must be used anywhere a tag/release must trigger another workflow — the org disables write for the default `GITHUB_TOKEN`.
- **The Continuous Release (`tip`) path in `release.yml` must not change** — same `reset-tip` job, `push: branches:[main]` trigger, non-tag tauri-action inputs, and extension steps.
- Conventional Commits are the primary change source; `feat!:`/`BREAKING CHANGE:` → major, `feat:` → minor, `fix:` → patch; `ci:`/`chore:`/`docs:`/`refactor:`/`test:` do not trigger a release.
- Pin all GitHub Actions to commit SHAs (repo convention) with a trailing `# vX` comment.
- Conventional-commit messages for this plan's own commits (e.g. `ci:`, `chore:`, `docs:`), each ending with the standard Co-Authored-By + Claude-Session trailers.

---

### Task 1: Remove the abandoned Changesets setup

**Files:**
- Delete: `.changeset/config.json`, `.changeset/README.md`
- Modify: `package.json` (root — remove `@changesets/*` devDependencies if present)
- Modify: `pnpm-lock.yaml` (regenerated)

**Interfaces:**
- Consumes: nothing.
- Produces: a repo with no Changesets references, ready for Knope config.

- [ ] **Step 1: Inventory the Changesets footprint**

Run:
```bash
cat .changeset/config.json 2>/dev/null; echo "---"
grep -n "changeset\|changesets" package.json || echo "no root refs"
ls .changeset
```
Expected: shows `config.json` + `README.md`, and any `@changesets/*` entries in root `package.json` devDependencies.

- [ ] **Step 2: Remove the Changesets config files**

Run:
```bash
git rm .changeset/config.json .changeset/README.md
```
(If the `.changeset` folder is now empty, leave it removed; Knope re-creates it only if you author change files.)

- [ ] **Step 3: Remove `@changesets/*` devDependencies**

Edit root `package.json`: delete any `@changesets/cli` and `@changesets/changelog-github` lines from `devDependencies` (and any `changeset`/`version`/`release` scripts that reference them — none are committed, but check). Leave all other scripts intact.

- [ ] **Step 4: Refresh the lockfile**

Run:
```bash
pnpm install --lockfile-only
```
Expected: `pnpm-lock.yaml` updates with `@changesets/*` removed, exit 0.

- [ ] **Step 5: Verify no references remain**

Run:
```bash
grep -rn "changeset" package.json pnpm-lock.yaml .changeset 2>/dev/null || echo "clean"
```
Expected: `clean` (or only unrelated substring hits — inspect).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove abandoned changesets setup

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BXhirwhLQu9aou4Vxar4eL"
```

---

### Task 2: Add and validate `knope.toml` + `CHANGELOG.md` (keystone)

This task installs Knope locally and **proves the config bumps exactly the right files to one version** and records Knope's real "nothing to release" behavior, which Tasks 3–4 depend on.

**Files:**
- Create: `knope.toml`
- Create: `CHANGELOG.md`

**Interfaces:**
- Consumes: the version-file list from Global Constraints.
- Produces: a working `knope.toml` with workflows `prepare-release`, `release`, `document-change`; a seeded `CHANGELOG.md`; and two recorded facts used later — the pinned `KNOPE_VERSION`, and Knope's exact stdout/exit when there is nothing to release.

- [ ] **Step 1: Install Knope locally and pin the version**

Run:
```bash
# Determine the latest release and pin it.
gh release view --repo knope-dev/knope --json tagName -q .tagName
```
Record that as `KNOPE_VERSION` (used in the workflows too). Then install it:
```bash
cargo install knope --locked --version "${KNOPE_VERSION#v}"
knope --version
```
Expected: prints the same version. (If `cargo install` is undesirable, download the matching binary from `https://github.com/knope-dev/knope/releases`.)

- [ ] **Step 2: Write `knope.toml`**

Create `knope.toml`:
```toml
[package]
versioned_files = [
    "package.json",
    "apps/twofau-app/package.json",
    "apps/twofau-extension/package.json",
    "Cargo.toml",
    "apps/twofau-app/src-tauri/Cargo.toml",
    "crates/twofau-wasm/Cargo.toml",
    "Cargo.lock",
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

- [ ] **Step 3: Seed `CHANGELOG.md`**

Create `CHANGELOG.md`:
```markdown
# Changelog

## 0.1.0

Initial release baseline.
```

- [ ] **Step 4: Validate the config parses**

Run:
```bash
knope --help
```
Expected: lists the custom workflows `prepare-release`, `release`, `document-change` (Knope surfaces configured workflows as subcommands). A config error would print here instead — fix it before continuing.

- [ ] **Step 5: Prove a dry-run bump touches exactly the right files**

Create a scratch commit so there is something to release, then dry-run:
```bash
git commit --allow-empty -m "feat: scratch commit to exercise knope"
knope prepare-release --dry-run
```
Expected: dry-run output shows it would bump to `0.2.0` and lists changes to **only** these files: `package.json`, `apps/twofau-app/package.json`, `apps/twofau-extension/package.json`, `Cargo.toml`, `apps/twofau-app/src-tauri/Cargo.toml`, `crates/twofau-wasm/Cargo.toml`, `Cargo.lock`, `apps/twofau-extension/manifest.json`, `apps/twofau-app/src-tauri/tauri.conf.json`, and `CHANGELOG.md`. Confirm `manifest.json`'s `manifest_version`/`minimum_chrome_version` are NOT matched. Then drop the scratch commit:
```bash
git reset --hard HEAD~1
```

- [ ] **Step 6: Record the "nothing to release" behavior**

With no new release-worthy commits (clean state), run and capture exit + message:
```bash
knope prepare-release; echo "prepare exit: $?"
knope release; echo "release exit: $?"
```
Expected: each exits non-zero with a message like "There is nothing to release." **Record the exact message string and exit code** in a comment at the bottom of `knope.toml` (e.g. `# no-op message: "<exact text>"`). Tasks 3 and 4 grep for this string.

- [ ] **Step 7: Commit**

```bash
git add knope.toml CHANGELOG.md
git commit -m "ci: add knope config and changelog baseline

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BXhirwhLQu9aou4Vxar4eL"
```

---

### Task 3: `prepare-release.yml` workflow

**Files:**
- Create: `.github/workflows/prepare-release.yml`

**Interfaces:**
- Consumes: `knope.toml` `prepare-release` workflow; the recorded no-op message from Task 2; `KNOPE_VERSION`; `secrets.RELEASE_TOKEN`.
- Produces: on every non-release push to `main`, an up-to-date "chore: Release x.y.z" PR (branch `release`); a clean no-op (green) when there is nothing to release.

- [ ] **Step 1: Resolve the `knope-dev/action` SHA**

Run:
```bash
gh api repos/knope-dev/action/tags --jq '.[0] | "\(.name) \(.commit.sha)"'
```
Record the tag (e.g. `v2.x.y`) and its commit SHA for pinning.

- [ ] **Step 2: Write the workflow**

Create `.github/workflows/prepare-release.yml` (substitute the pinned SHAs/versions and the exact no-op message from Task 2 Step 6):
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
    # Skip the release PR's own merge commit so we don't loop.
    if: ${{ !startsWith(github.event.head_commit.message, 'chore: Release') }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
        with:
          fetch-depth: 0
          token: ${{ secrets.RELEASE_TOKEN }}
      - uses: knope-dev/action@<PINNED_SHA> # <PINNED_TAG>
        with:
          version: <KNOPE_VERSION>
      - name: Prepare release PR
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN }}
        run: |
          set +e
          OUT="$(knope prepare-release --verbose 2>&1)"; CODE=$?
          printf '%s\n' "$OUT"
          if [ "$CODE" -ne 0 ]; then
            # Tolerate the "nothing to release" no-op; fail on anything else.
            printf '%s' "$OUT" | grep -qi 'nothing to release' && exit 0
            exit "$CODE"
          fi
```

- [ ] **Step 3: Validate the YAML**

Run:
```bash
node -e "const s=require('fs').readFileSync('.github/workflows/prepare-release.yml','utf8'); if(/\t/.test(s)) throw new Error('tabs'); console.log('no tabs, lines:', s.split(String.fromCharCode(10)).length)"
command -v actionlint >/dev/null && actionlint .github/workflows/prepare-release.yml && echo "actionlint OK" || echo "actionlint not installed (skipped)"
```
Expected: no tabs; actionlint passes if installed.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/prepare-release.yml
git commit -m "ci: add knope prepare-release workflow

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BXhirwhLQu9aou4Vxar4eL"
```

---

### Task 4: `release.yml` — add the `knope-release` job and switch the tag path to `gh release upload`

**Files:**
- Modify: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: `knope.toml` `release` workflow; `KNOPE_VERSION` + pinned action SHA (from Task 3); `secrets.RELEASE_TOKEN`; the recorded no-op message.
- Produces: on the release-PR merge, a `v{version}` tag + published GitHub Release with changelog (created by Knope); on that `v*` tag, all desktop + extension assets uploaded to it via `gh release upload`, with the Knope-set release body preserved. The `tip` path is unchanged.

- [ ] **Step 1: Read the current `release.yml` and locate the two edit points**

Run:
```bash
grep -n "tauri-action\|releaseDraft\|releaseBody\|gh release upload\|jobs:\|bundle:\|reset-tip:" .github/workflows/release.yml
```
Identify: (a) the top of `jobs:` (to add `knope-release` before `reset-tip`), (b) the tauri-action step and the extension upload step in the `bundle` job (tag path).

- [ ] **Step 2: Add the `knope-release` job**

Insert as the first job under `jobs:` (substitute pinned SHA/version + the exact no-op message):
```yaml
  # Create the versioned tag + GitHub Release (with changelog) once the
  # "chore: Release" PR is merged. Idempotent: a no-op on ordinary pushes.
  # Uses RELEASE_TOKEN so the tag it creates triggers the tag path below.
  knope-release:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
        with:
          fetch-depth: 0
          token: ${{ secrets.RELEASE_TOKEN }}
      - uses: knope-dev/action@<PINNED_SHA> # <PINNED_TAG>
        with:
          version: <KNOPE_VERSION>
      - name: Create release + tag
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN }}
        run: |
          set +e
          OUT="$(knope release --verbose 2>&1)"; CODE=$?
          printf '%s\n' "$OUT"
          if [ "$CODE" -ne 0 ]; then
            printf '%s' "$OUT" | grep -qi 'nothing to release' && exit 0
            exit "$CODE"
          fi
```

- [ ] **Step 3: Make the tag path upload via `gh` instead of tauri-action's release manager**

In the `bundle` job's tauri-action step, on the **tag path only**, stop tauri-action from creating/owning the release (so it can't overwrite the Knope-set body). When `tagName` is empty, tauri-action **builds only** and still exposes `artifactPaths` — the gh step in the next step uploads them. The `tip` (non-tag) branch of every ternary stays exactly as today. Add `id: tauri` to the step and set its `with:` to:

```yaml
      - uses: tauri-apps/tauri-action@84b9d35b5fc46c1e45415bdb6144030364f7ebc5 # v0
        id: tauri
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN || github.token }}
        with:
          projectPath: apps/twofau-app
          # tip path keeps managing its own release; the tag path builds only and
          # is uploaded by the gh step below (preserves Knope's release body).
          tagName: ${{ github.ref_type == 'tag' && '' || 'tip' }}
          releaseName: ${{ github.ref_type == 'tag' && '' || 'Continuous Release' }}
          releaseBody: ${{ github.ref_type == 'tag' && '' || 'Automatically built from the latest commit on main. Unstable.' }}
          releaseDraft: false
          prerelease: ${{ github.ref_type != 'tag' }}
          args: ${{ matrix.target && format('--target {0}', matrix.target) || '' }}
```
(`releaseDraft` was `${{ github.ref_type == 'tag' }}` — its `tip` value was already `false`, so a bare `false` leaves `tip` unchanged. Verify in the post-impl E2E that empty `tagName` builds without erroring; if a build-only run ever fails, the fallback is to keep `tagName: ${{ github.ref_name }}` on the tag path and omit `releaseBody` so tauri-action uploads to the existing Knope release without touching its body.)

- [ ] **Step 4: Upload the desktop artifacts to the Knope release on the tag path**

Add a step immediately after tauri-action, gated to tags, that uploads the built installers to the existing `v{version}` release:
```yaml
      - name: Attach desktop installers to the release (tag)
        if: github.ref_type == 'tag'
        env:
          GH_TOKEN: ${{ secrets.RELEASE_TOKEN || github.token }}
          REPO: ${{ github.repository }}
          TAG: ${{ github.ref_name }}
          ARTIFACTS: ${{ steps.tauri.outputs.artifactPaths }}
        run: |
          # artifactPaths is a JSON array of file paths.
          printf '%s' "$ARTIFACTS" | node -e '
            const fs=require("fs");
            const paths=JSON.parse(fs.readFileSync(0,"utf8"));
            fs.writeFileSync("artifacts.txt", paths.join("\n"));
          '
          xargs -a artifacts.txt -d '\n' gh release upload "$TAG" --repo "$REPO" --clobber
```

- [ ] **Step 5: Point the extension upload at the tag release (already `gh release upload`)**

The extension "Attach the extensions to the release" step already uses `gh release upload "$TAG" ...`. Confirm its `TAG` expression resolves to `github.ref_name` on the tag path (it currently uses `github.ref_type == 'tag' && github.ref_name || 'tip'`, which is correct) — no change needed. Confirm by:
```bash
grep -n "Attach the extensions to the release" -A8 .github/workflows/release.yml
```

- [ ] **Step 6: Confirm the `tip` (continuous) path is unchanged**

Run:
```bash
grep -n "reset-tip\|tip'\|Continuous Release\|Automatically built" .github/workflows/release.yml
```
Expected: the `reset-tip` job, the `'tip'` tagName branch, "Continuous Release", and the "Automatically built…" body are all still present and unchanged.

- [ ] **Step 7: Validate the YAML**

Run:
```bash
node -e "const s=require('fs').readFileSync('.github/workflows/release.yml','utf8'); if(/\t/.test(s)) throw new Error('tabs'); console.log('no tabs')"
command -v actionlint >/dev/null && actionlint .github/workflows/release.yml && echo "actionlint OK" || echo "actionlint not installed (skipped)"
```
Expected: no tabs; actionlint clean if installed.

- [ ] **Step 8: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: create versioned release via knope, attach assets on tag

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BXhirwhLQu9aou4Vxar4eL"
```

---

### Task 5: Document the release process

**Files:**
- Modify: `docs/DEVELOPMENT.md` (add a "Releasing" section)

**Interfaces:**
- Consumes: the finished pipeline.
- Produces: contributor-facing docs for cutting a release.

- [ ] **Step 1: Add a "Releasing" section**

Append to `docs/DEVELOPMENT.md`:
```markdown
## Releasing

Releases are automated with [Knope](https://knope.tech).

1. Land changes on `main` with Conventional Commits (`feat:`, `fix:`,
   `feat!:`/`BREAKING CHANGE:` for a major). `ci:`/`chore:`/`docs:`/`refactor:`/
   `test:` don't trigger a release. For a hand-written note, add a change file:
   `knope document-change`.
2. `prepare-release.yml` keeps a **"chore: Release x.y.z"** PR up to date with the
   next version + changelog. Review and merge it to release.
3. Merging runs `knope release`, which bumps every version file, tags `vX.Y.Z`,
   and creates the GitHub Release with the changelog. That tag triggers
   `release.yml`, which builds the desktop apps and extensions and uploads all
   assets (`.dmg`/`.msi`/`.AppImage`/…, plus `.crx`/`.xpi`/`.zip`) to the release.
4. The rolling **`tip`** prerelease is separate and always tracks the latest
   `main` commit.

Version strings live in one place conceptually — Knope keeps `package.json`s,
`Cargo.toml`/`Cargo.lock`, `manifest.json` and `tauri.conf.json` in sync. Never
edit versions by hand.
```

- [ ] **Step 2: Commit**

```bash
git add docs/DEVELOPMENT.md
git commit -m "docs: document the knope release process

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BXhirwhLQu9aou4Vxar4eL"
```

---

## Post-implementation: end-to-end verification (GitHub only)

These cannot run locally — perform them on GitHub after merging the pipeline:

1. Land a `feat:` commit on `main` → confirm the "chore: Release 0.2.0" PR appears with correct bumps across all version files + a `CHANGELOG.md` entry.
2. Merge the PR → confirm `knope-release` creates tag `v0.2.0` and a published Release whose body is the changelog.
3. Confirm the `v0.2.0` tag run of `release.yml` uploads desktop installers + extension `.crx`/`.xpi`/`.zip` to that release, and the release body is still the changelog (not overwritten).
4. Confirm a normal `main` push still re-cuts the `tip` prerelease unchanged, and that `prepare-release`/`knope-release` are green no-ops when there's nothing to release.
