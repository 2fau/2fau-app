## MODIFIED Requirements

### Requirement: Release PR is the single human action

A push to `main` SHALL run `knope prepare-release`, which bumps the versioned
files, writes the changelog, consumes change files, and opens or updates a
"chore: Release x.y.z" pull request from the `release` branch. The prepared
commit SHALL live on the `release` branch and be pushed there before the pull
request is opened, so the pull request's head and base are never the same
branch. The `release` branch SHALL be disposable: each run overwrites it with the
current preparation. The workflow SHALL skip its own release commits so it does
not loop, and SHALL check out full history so commits since the last tag can be
read.

#### Scenario: Release PR merged

- **WHEN** the release PR merges to `main`
- **THEN** the version bumps and changelog land, and the tag, release, and asset uploads follow with no further human action

#### Scenario: Preparation runs from main

- **WHEN** `knope prepare-release` runs on a push to `main` and there is something to release
- **THEN** the bump is committed to the `release` branch and the pull request is created from `release` into `main`, never from `main` into `main`

#### Scenario: A release PR is already open

- **WHEN** a later push to `main` prepares a release while the previous release PR is still open
- **THEN** the `release` branch is overwritten with the new preparation and the existing pull request's title, body, and diff are updated in place

## ADDED Requirements

### Requirement: The change-file check exempts the release PR

The check that requires every pull request into `main` to add a change file in
`.changeset/` SHALL NOT apply to the Knope release pull request, which consumes
change files rather than adding one. The check SHALL report success for that pull
request so branch protection does not block the merge.

#### Scenario: Release PR opened

- **WHEN** the change-file check runs on the pull request from the `release` branch
- **THEN** it passes without requiring a change file and without demanding a manual label

#### Scenario: Ordinary PR without a change file

- **WHEN** the check runs on any other pull request that adds no change file and carries no skip label
- **THEN** it still fails, unchanged by this exemption
