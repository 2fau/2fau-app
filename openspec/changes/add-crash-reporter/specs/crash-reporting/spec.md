## Purpose

Makes desktop crashes diagnosable: every Rust panic is recorded on disk, shown to
the user with its stack trace, and can be handed off as a prefilled GitHub issue
that the user reviews and submits themselves.

## ADDED Requirements

### Requirement: Panics are recorded to disk

The desktop app SHALL record every Rust panic, on any thread, as a crash report
file in a `crashes` folder inside its app data directory, before the panic
continues to unwind or abort. A report SHALL contain: the panic message, the
source location, the thread name, a stack trace, the app version, the OS and
CPU architecture, and the time of the crash. Recording SHALL work without the
user setting any environment variable.

#### Scenario: Panic on the main thread kills the app

- **WHEN** a panic occurs on the main thread and the process exits
- **THEN** a crash report containing the panic message and a stack trace exists in the crashes folder

#### Scenario: Panic on a background thread

- **WHEN** a panic occurs on a background thread (e.g. during time sync)
- **THEN** a crash report naming that thread is written

#### Scenario: Release build without RUST_BACKTRACE

- **WHEN** a release build panics with `RUST_BACKTRACE` unset
- **THEN** the report still contains a stack trace

#### Scenario: Recording itself fails

- **WHEN** the crashes folder cannot be written
- **THEN** the original panic proceeds unchanged and the handler does not panic again

### Requirement: Crash reports contain no vault secrets

A crash report SHALL NOT include OTP secrets, the vault passphrase, decrypted
vault contents, or account labels. The report SHALL consist only of the panic
message, code locations, and the environment fields listed above.

#### Scenario: Panic while the vault is unlocked

- **WHEN** the app panics while a vault is unlocked
- **THEN** the written report contains no secret, passphrase, or account name

### Requirement: Native crashes are recorded

The desktop app SHALL record native crashes that bypass the panic machinery
(segmentation fault, bus error, illegal instruction, floating-point exception,
abort, and Windows structured exceptions such as access violation). For each,
it SHALL save a minidump file and a crash report in the crashes folder. The
report SHALL contain the crash reason (signal or exception name), the faulting
address, the crashing thread, a stack trace in which frames inside the app's own
binary are named by function, and the same environment fields as a panic
report. Native crash reports SHALL appear in the crash dialog on the next launch
exactly like panic reports.

#### Scenario: Segmentation fault

- **WHEN** the app dereferences an invalid pointer and the OS kills it
- **THEN** a minidump and a crash report naming the crash reason and the app function that faulted exist in the crashes folder

#### Scenario: Crash dialog after a native crash

- **WHEN** the app is launched after a native crash
- **THEN** the crash dialog shows that crash's reason and stack trace

#### Scenario: Panic that aborts

- **WHEN** a panic aborts the process
- **THEN** only the panic report is shown, not a second native report for the same crash

#### Scenario: Crash monitor unavailable

- **WHEN** the crash monitor cannot be started
- **THEN** the app launches and works normally, and panics are still recorded

### Requirement: Minidumps stay local

A minidump SHALL never be sent by the app and SHALL never be included in the
GitHub issue link. The issue body and the dialog text SHALL name the minidump
file and state that it can contain data from memory and must not be attached
publicly.

#### Scenario: Reporting a native crash

- **WHEN** the user clicks Report on GitHub for a native crash
- **THEN** the prefilled issue names the minidump file and warns against attaching it publicly, and the dump's bytes are not in the URL

### Requirement: Old reports are pruned

The desktop app SHALL keep at most the 10 most recent crash reports and delete
older ones, together with their minidumps, when a new report is written.

#### Scenario: Eleventh crash

- **WHEN** a crash report is written and 10 reports already exist
- **THEN** the oldest report and its minidump, if any, are deleted and 10 remain

### Requirement: Crash dialog on next launch

When the app starts and one or more crash reports have not been dismissed, the
app SHALL show a crash dialog for the most recent unseen report, above whatever
screen is current. The dialog SHALL show a short explanation, the panic message,
and the full report text in a scrollable, selectable area.

#### Scenario: Relaunch after a crash

- **WHEN** the app crashed and the user launches it again
- **THEN** the crash dialog appears showing that crash's message and stack trace

#### Scenario: No pending crash

- **WHEN** the app launches and every report has been dismissed (or none exist)
- **THEN** no crash dialog is shown

### Requirement: Crash dialog while still running

When a panic occurs on a background thread and the app keeps running, the app
SHALL show the crash dialog for that report without requiring a restart.

#### Scenario: Time sync panics

- **WHEN** the time-sync background work panics
- **THEN** the crash dialog appears in the running app with that report

### Requirement: Time sync survives a panic

A panic during one time-sync pass SHALL NOT stop future passes. The app SHALL
keep using the last known clock offset and retry on the normal schedule.

#### Scenario: One pass panics

- **WHEN** a time-sync pass panics
- **THEN** the report is recorded, codes keep using the previous offset, and the next scheduled pass runs

### Requirement: Report on GitHub

The crash dialog SHALL offer a Report on GitHub action that opens the system
browser on a new-issue page of the project's GitHub repository, prefilled with
a title naming the panic and a body containing the report. The app SHALL NOT
send the report anywhere by itself; the user reviews and submits the issue in
the browser. When the report is too long for a URL, the body SHALL be truncated
with a visible note asking the user to paste the full report, which the dialog
can copy.

#### Scenario: User reports a crash

- **WHEN** the user clicks Report on GitHub
- **THEN** the browser opens the repository's new-issue page with the title and report prefilled, and no network request is made by the app itself

#### Scenario: Very long stack trace

- **WHEN** the report would make the issue URL exceed the safe length
- **THEN** the prefilled body is truncated and states that the full report should be pasted from the clipboard

### Requirement: Copy and dismiss

The crash dialog SHALL offer Copy, which puts the full report text on the
clipboard, and Dismiss, which closes the dialog and marks the report as seen so
it is not shown again. Reporting on GitHub SHALL also mark the report as seen.
Marking seen SHALL NOT delete the report file.

#### Scenario: Dismiss

- **WHEN** the user clicks Dismiss and later relaunches the app
- **THEN** the dialog does not reappear for that report and the report file still exists

#### Scenario: Copy

- **WHEN** the user clicks Copy
- **THEN** the clipboard holds the full, untruncated report text

### Requirement: Hosts without a native process show no dialog

A host that cannot crash natively (the browser extension) SHALL NOT render the
crash dialog or any crash-reporting UI.

#### Scenario: Extension popup

- **WHEN** the extension popup renders
- **THEN** no crash dialog or crash-related control appears
