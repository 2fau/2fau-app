---
target: shared UI (packages/ui)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/jilizart/Projects/2fau/packages/ui/packages/ui/src"
timestamp: 2026-10-25T12-54-10Z
slug: packages-ui-src
closed: true
---
Method: dual-agent (A: design review · B: detector + browser overlay), Storybook :6007 at 360px

## Design Health Score — 25/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Countdown bar + amber expiry is strong; "Copied" is visual only, no live region (account-row.tsx:208) |
| 2 | Match System / Real World | 2 | "Bulk", "Label", "Base32", TOTP/HOTP/Steam shown to everyone (add-view.tsx:152,205) |
| 3 | User Control and Freedom | 3 | Inline delete confirm good; Add's Save enabled with empty fields (add-view.tsx:227) |
| 4 | Consistency and Standards | 2 | "Passphrase" vs "Password" (settings-view.tsx:310,391); cards hardcode dark while tokens follow OS |
| 5 | Error Prevention | 3 | Delete Vault gated on passphrase; "Generate a new code" not gated on timeBased (account-row.tsx:216) |
| 6 | Recognition Rather Than Recall | 2 | Row actions hover-only; header icons unlabeled; tap-to-copy undiscoverable |
| 7 | Flexibility and Efficiency | 3 | ⌘1-5 + autofocused search; only ~3.5 rows visible so ⌘4/⌘5 copy blind |
| 8 | Aesthetic and Minimalist Design | 3 | Cards handsome; 11-row settings root and Add screen heavy |
| 9 | Error Recovery | 2 | Raw err.message shown (unlock-view.tsx:24, settings-view.tsx:297); import gives no failed-entry list |
| 10 | Help and Documentation | 2 | Import prose mixes code fragments (import-view.tsx:118-122) |

## Design Specificity
Half-authored. Account card is product-specific (glow, issuer chip, mono code, countdown bar, ⌘N badge — account-row.tsx:95-277). Everything else is stock shadcn forms + iOS-copy settings. Two visual languages don't meet: cards hardcode near-black/zinc, tokens follow prefers-color-scheme.

Detector: CLI scan of src/components clean (0). Browser overlay: 13 low-contrast (account label text-zinc-500 ≈3.4:1, account-row.tsx:178; countdown rgba(161,161,170,.65) ≈3.7:1, account-row.tsx:257-258; empty-state hint 4.0:1, menu-bar-view.tsx:66), 1 tiny-text (11px helper, setup-view.tsx:49-50; same pattern in setup-wizard.tsx:63,114,168). Agrees with design review on contrast. No false positives.

## Priority Issues
1. [P1] Light theme broken — root forces `dark` class (root-view.tsx:94) but tokens key off @media prefers-color-scheme (globals.css:28,67,150); cards hardcode dark. On light-OS: dark cards on white panel, invisible wordmark. Fix: Tailwind `@custom-variant dark` + `.dark` token block, or commit fully to dark; move cards onto tokens. → colorize / harden
2. [P1] Contrast below AA on the most-read secondary text (account label, countdown, empty hint, 11px helpers). → audit
3. [P2] Regenerate action on every row regardless of otp_type. Gate on timeBased. → harden
4. [P2] Placeholder-as-label forms; search lacks aria-label and focus ring (search-input.tsx); back chevron unlabeled. → clarify / audit
5. [P2] Add screen overload: 3 paste sources + 3 fields + 3 types + 9 colours at once. Lead with paste/QR, collapse type+colour. → distill

## Persona Red Flags
Alex: ~3.5 rows visible, ⌘4/⌘5 blind; no arrow-key list nav.
Sam: "Copied" not announced; ~4 tab stops/row; labels fail contrast; search has no focus ring.
Jordan: first run drops straight into "Create a passphrase" with no welcome; "Bulk"/"HOTP" jargon; tap-to-copy undiscoverable.

## Minor
Long issuer names don't truncate (account-row.tsx:154 shrink-0); EXPIRY_WARNING_S duplicated (menu-bar-view.tsx:58, account-row.tsx:12); header ring assumes 30s; "Tap + to add one" is mobile wording; commented-out settings rows.

## Questions
Dense code-first list instead of 3.5 big cards? Commit to dark-only? Can paste/QR infer OTP type so first-timers never see TOTP/HOTP/Steam?
