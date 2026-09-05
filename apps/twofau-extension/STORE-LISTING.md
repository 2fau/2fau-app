# Store listing copy

Ready-to-paste text for the Chrome Web Store and Firefox (AMO) listings. Keep in
sync with the manifest `description` when features change.

## Summary / short description

**Firefox (AMO) — Summary** (max 250 chars) · **250/250**

```
2FAu is a local-first authenticator for your TOTP/HOTP two-factor codes. Everything stays in an encrypted vault in your browser — no account, no server. Scan a QR off the page, copy or autofill codes with a hotkey, and sync with the 2FAu desktop app.
```

**Chrome Web Store — Short description** (max 132 chars) · **130/132**

```
Local-first 2FA: TOTP/HOTP codes in an encrypted vault. No account, no server. Scan a QR, autofill with a hotkey, sync to desktop.
```

## Detailed description (long-form, both stores)

```
2FAu is a fast, local-first authenticator for your two-factor (TOTP/HOTP) codes.

Your accounts live in an encrypted vault right in your browser — there is no
account to create and no server to breach, and your secrets never leave your
device.

Features
• Encrypted vault (AES-256-GCM) unlocked by a single passphrase
• Popup with colour-tinted rows and search-as-you-type
• Hotkeys: open the vault (Ctrl/Cmd+Shift+U), copy a code (Ctrl/Cmd+1–5),
  autofill the focused field (Ctrl/Cmd+Shift+Y)
• Enroll by scanning a QR straight off the current tab — no phone needed
• Sync as encrypted chunks through your browser profile, or point it at your
  own 2FAu desktop app over loopback
• Same Rust crypto core as the 2FAu desktop app for macOS, Windows and Linux
• Open source (MIT)

2FAu never sends your codes or secrets anywhere. No tracking, no analytics,
no data collection.
```

## Permission justifications (Chrome Web Store, ≤100 chars each)

Paste one per permission in the "Privacy practices" tab. All are verified against
the code in `src/`.

| Permission | Justification |
| --- | --- |
| `storage` | Stores your encrypted 2FA vault and settings on this device and via chrome.storage.sync. |
| `contextMenus` | Adds a right-click menu to quickly copy a recent 2FA code. |
| `offscreen` | Copies a code to the clipboard from the service worker via an offscreen document. |
| `activeTab` | Reads the active tab only when you scan a QR from it or autofill a code you triggered. |
| `alarms` | Drives the auto-lock timer and the periodic vault sync check. |
| `scripting` | Injects the 2FA code into the focused field of the active tab when you autofill. |
| `notifications` | Shows brief confirmations and errors, e.g. after copying a code or scanning a QR. |
| `http://127.0.0.1/*` (optional host) | Optional: connect to your own 2FAu desktop app over loopback for local sync. |

**Remote code use:** No remote code; the Rust core is bundled as WebAssembly (needs wasm-unsafe-eval).

