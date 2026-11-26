---
default: minor
---

# Crash reports

When the desktop app crashes, it now saves a crash report with the stack trace
and shows it on the next launch (or right away, if the app kept running). From
the dialog you can copy the report or open a prefilled GitHub issue to review
and submit yourself; nothing is sent automatically. A crash during network time
sync no longer stops time sync for the rest of the session.

Native crashes (segfaults, illegal instructions, Windows access violations) are
caught too: a small helper process saves a minidump and a readable stack trace,
shown in the same dialog. The minidump stays on your machine; it is never added
to the GitHub issue.
