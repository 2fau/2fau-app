# Privacy Policy

**Last updated: 2026-09-05**

This privacy policy covers the **2FAu** authenticator — the desktop app (macOS,
Windows, Linux) and the browser extension (Chrome, Edge, Firefox).

## Summary

**2FAu does not collect any personal data.** There is no account to create, no
server operated by us, and no tracking, analytics, telemetry, or advertising.
Your two-factor secrets and codes are generated and stored **on your own
device** and never leave it except by mechanisms you explicitly control (browser
sync or a connection to your own computer). We — the developers — never receive,
see, or have access to your data.

## What 2FAu stores, and where

2FAu stores the data **you** add (your two-factor accounts: issuer, label, and
the secret used to generate codes) inside an **encrypted vault**. The vault is
encrypted with AES-256-GCM using a key derived from a passphrase you choose; the
passphrase and the plaintext secrets exist only in memory while the app is
unlocked.

- **Desktop app:** the encrypted vault is a file in the app's local data
  directory on your computer. It never leaves your machine unless you export it
  yourself.
- **Browser extension:** the encrypted vault is stored in your browser's
  extension storage on your device (`chrome.storage.local`), and the in-memory
  key is held in `chrome.storage.session` (cleared when the browser closes).
- **Optional browser sync:** if you enable sync, the **already-encrypted** vault
  is written to your browser profile's sync storage (`chrome.storage.sync`),
  which your browser replicates across your own devices via your browser account
  (for example, your Google account for Chrome). It is stored and transmitted as
  ciphertext that only your passphrase can open; we cannot read it and never
  receive it.
- **Optional desktop connection:** if you pair the extension with the 2FAu
  desktop app, they communicate directly over your computer's loopback interface
  (`http://127.0.0.1`). This traffic stays on your own machine and is not sent to
  us or any third party.

## What 2FAu does **not** do

- No analytics, telemetry, crash reporting, or usage tracking.
- No advertising and no advertising identifiers.
- No selling or sharing of data with third parties.
- No remote servers operated by us; the app has no backend to send data to.
- No collection of your browsing history. The extension only reads a page when
  **you** ask it to (see permissions below).

## Browser extension permissions

The extension requests the minimum permissions needed for its features. None of
them are used to collect or transmit your data to us:

- **storage** — save your encrypted vault and settings on your device (and, if you
  enable it, your browser's sync storage).
- **activeTab** — read the current tab **only** when you scan a QR code from it or
  autofill a code you triggered.
- **scripting** — insert a code into the focused field on the current tab when you
  use autofill.
- **offscreen** — copy a code to the clipboard from the background worker.
- **contextMenus** — provide a right-click menu to copy a recent code.
- **alarms** — run the auto-lock timer and the periodic sync check.
- **notifications** — show brief confirmations and errors (e.g. after copying a
  code or scanning a QR).
- **http://127.0.0.1/\*** (optional) — connect to your own 2FAu desktop app over
  loopback, only if you enable it.

QR scanning captures the visible tab and decodes it **locally on your device**;
the image is not uploaded anywhere.

## Data retention and deletion

Your data lives only where it is stored on your devices. To delete it:

- **Desktop app:** delete your accounts in the app, or remove the vault file /
  uninstall the app.
- **Browser extension:** remove accounts in the extension, clear its storage, or
  uninstall it. Uninstalling removes local storage; if you used browser sync,
  also clear the extension's synced data through your browser.

Because we never receive your data, there is nothing for us to delete on your
behalf.

## Children

2FAu is a general-purpose utility and is not directed at children, and we do not
knowingly collect any data from anyone.

## Changes to this policy

If this policy changes, we will update this document and the "Last updated" date
above. Material changes will be noted in the project's release notes.

## Contact

Questions about privacy? Open an issue at
<https://github.com/2fau/2fau-app/issues> or email privacy@2fau.app.
