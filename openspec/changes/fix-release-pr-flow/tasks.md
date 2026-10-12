## 1. Release PR branch mechanics

- [x] 1.1 In `knope.toml`, wrap the `prepare-release` workflow's `PrepareRelease` step with `Command` steps: `git switch -c release` before it, then `git commit -m "chore: Release $version"` (with `variables = { "$version" = "Version" }`) and `git push --force --set-upstream origin release` after it, before `CreatePullRequest`. Verify `knope prepare-release --dry-run` lists the three commands in that order around the file edits.
- [x] 1.2 In `.github/workflows/prepare-release.yml`, add a Git identity step after checkout (gated on the same `RELEASE_TOKEN` condition as the surrounding steps) so the commit in 1.1 has an author. Verify the step's `if:` matches the neighbouring steps and the YAML parses (`openspec` aside, e.g. `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/prepare-release.yml'))"`).
- [x] 1.3 Confirm the commit message from 1.1 still satisfies the workflow's `!startsWith(github.event.head_commit.message, 'chore: Release')` loop guard, so merging the release PR does not prepare a release of the release.

## 2. Change-file check exemption

- [x] 2.1 In `.github/workflows/changeset.yml`, pass the PR head branch into the step's `env` and exit 0 early when it is `release`, next to the existing `skip-changeset` label check. Verify the early exit runs before the `.changeset/` diff so no comment is posted on the release PR.
- [x] 2.2 Verify an ordinary PR is unaffected: the diff-based check and its sticky comment still run and still fail when no change file is added and no skip label is present.
- [x] 2.3 Update the workflow's header comment to document the new escape hatch alongside the label.

## 3. End-to-end verification

- [x] 3.1 Run `knope prepare-release --dry-run` locally and verify it computes the next version, stages every versioned file plus `CHANGELOG.md`, deletes the change files, and reports the commit/push commands (the dry run does not execute `git switch`, so it will still print the head as `main`).
- [ ] 3.2 After merging to `main`, verify the `Prepare release` run succeeds, a `release` branch exists on the remote, and a "chore: Release x.y.z" PR is open from `release` into `main`. If `RELEASE_TOKEN` is still unset, verify instead that the job skips with its warning rather than failing.
- [ ] 3.3 Verify the `Changeset` check on that release PR reports success (not skipped) and that the PR is mergeable.
