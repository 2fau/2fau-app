## Why

The release PR has never been created. `knope prepare-release` runs on a push to
`main` and its `CreatePullRequest` step opens the PR **from the current branch**,
which is `main` — so GitHub rejects it with `422 Validation Failed: No commits
between main and main` and the whole pipeline stalls before a single release.
Even once the PR opens, the `Changeset` check would fail it: `prepare-release`
consumes the change files in `.changeset/`, so the release PR adds none and the
gate that every PR into `main` must add one blocks the only PR that never can.

## What Changes

- `knope prepare-release` creates a disposable `release` branch, commits the
  version bump + changelog there, force-pushes it, and opens the PR from
  `release` → `main` (the branch mechanics the release-pipeline spec already
  describes but the config never implemented).
- The `Prepare release` job configures a Git identity, since the workflow now
  commits inside Knope's steps.
- The `Changeset` check exempts PRs whose head branch is `release`, alongside the
  existing `skip-changeset` label escape hatch.

## Capabilities

### New Capabilities

<!-- None: this change fixes an existing capability's behavior. -->

### Modified Capabilities

- `release-pipeline`: the "Release PR is the single human action" requirement
  gains the branch mechanics that make the PR creatable (head ≠ base, committed
  and pushed by the workflow), plus a new requirement that the change-file check
  exempts the release PR.

## Impact

- `knope.toml` — `prepare-release` workflow gains `Command` steps around
  `PrepareRelease`.
- `.github/workflows/prepare-release.yml` — adds a Git identity step.
- `.github/workflows/changeset.yml` — adds the `release` head-branch exemption.
- A `release` branch now exists on the remote, rewritten on every push to `main`.
- No product code, no crates, no packages. Requires the `RELEASE_TOKEN` secret to
  be set before any of this runs (still outstanding).
