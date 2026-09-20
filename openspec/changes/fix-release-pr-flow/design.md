## Context

See proposal.md — Why. Two facts shape the approach:

- Knope's `CreatePullRequest` step reads the repository's current branch as the
  PR head. Nothing in the step takes a head parameter, so the only way to change
  the head is to change the branch Knope is standing on when the step runs. The
  workflow triggers on a push to `main`, so without intervention head = base.
- `PrepareRelease` stages its edits (a `git add` of the versioned files, the
  changelog, and the deleted change files) but does not commit or push them.

Knope documents exactly this shape in its "preview releases with pull requests"
recipe; the repo's config had the two `CreatePullRequest`/`PrepareRelease` steps
without the surrounding Git commands.

## Goals / Non-Goals

**Goals:**

- The prepare workflow reaches the point of an open, updatable release PR.
- The PR is mergeable: every required check on it can pass unattended.

**Non-Goals:**

- The `RELEASE_TOKEN` secret. Both workflows already gate on it and warn when
  absent; setting it is an account action outside this change.
- Any change to `knope release`, the tag path, the `tip` prerelease, or asset
  uploads.

## Decisions

**A single `release` branch, force-pushed.** `git switch -c release` →
`PrepareRelease` → commit → `git push --force --set-upstream origin release`.
Alternatives: a per-version branch (`release/0.1.1`) leaves dead branches behind
and orphans the open PR when the version changes mid-cycle; a branch derived from
the commit SHA opens a new PR per push. One reused branch keeps exactly one
release PR open, which is the behavior the spec asks for. Force-push is safe
because the branch holds no history worth keeping — it is regenerated from `main`
on every run.

**Commit message `chore: Release $version`.** It matches the PR title and the
`startsWith(head_commit.message, 'chore: Release')` guard that stops the prepare
workflow from preparing a release of the release.

**Git identity configured in the workflow, not in `knope.toml`.** The commit
happens inside Knope's step list, but `user.name`/`user.email` are environment
concerns; a CI-only step keeps `knope.toml` runnable on a developer machine with
their own identity.

**The changeset check exits 0 rather than skipping the job.** A job-level `if:`
would report the check as skipped; a step that exits 0 reports success. Success
is unambiguous under branch protection, so the exemption goes next to the
existing `skip-changeset` label check, sharing its early-exit shape.

**Exempt by head branch, not by PR title or author.** The branch name is set by
our own config one file away; a title is editable by anyone with write access and
an author depends on which PAT `RELEASE_TOKEN` happens to hold.

## Risks / Trade-offs

- Anyone with write access can push a branch named `release` and bypass the
  change-file check → the check is a release-notes hygiene gate, not a security
  control, and pushing to `release` means fighting the next force-push.
- A long-lived release PR accumulates force-pushes, so review comments on old
  diffs go stale → the PR is machine-generated and read for its changelog, not
  line-reviewed.
- `git switch -c release` fails if a local `release` branch already exists. On a
  fresh runner checkout it never does; running `knope prepare-release` locally a
  second time will fail this way → run it in CI, or delete the local branch.
- Verified only as far as `knope prepare-release --dry-run` locally. The dry run
  does not execute the `git switch`, so it still prints the head as `main`; the
  real head can only be confirmed by a run on `main`.

## Migration Plan

Merge to `main`; the push triggers the prepare workflow, which either opens the
release PR or no-ops. Rollback is reverting the three files — the pipeline
returns to its current state of never producing a PR. A stale `release` branch
can be deleted afterwards without consequence.
