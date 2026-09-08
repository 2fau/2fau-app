Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Stack

- **Rust** workspace: `twofau-core` (pure logic), `twofau-wasm` (wasm-bindgen wrapper),
  `twofau-app/src-tauri` (Tauri 2 desktop shell).
- **pnpm** workspace: `@twofau/core-wasm` (wasm-pack output + typed TS index),
  `@twofau/ui` (shared React components), `@twofau/app` (Tauri frontend).
- React 19 · shadcn/ui (new-york) · lucide-react · Tailwind v4 · Vite · Vitest · Storybook 8.
- Rust stable (needs ≥1.85 for edition2024 deps) · `wasm32-unknown-unknown`.

## Docs

| File                   | What's in it                                                 |
| ---------------------- | ------------------------------------------------------------ |
| `docs/ARCHITECTURE.md` | Module map, data flow, crypto/vault format, hard invariants  |
| `docs/DEVELOPMENT.md`  | Every command, plus the traps that already cost hours        |
| `docs/ROADMAP.md`      | Sub-projects SP0–SP5, what's done, what's next               |
| `docs/specs/*.md`      | Per-sub-project design specs (written before each was built) |

Read `docs/ARCHITECTURE.md` before touching crypto, the vault format, or the
`VaultService` port. Read `docs/DEVELOPMENT.md` before running any build.

## Hard invariants

- **`twofau-core` is pure**: no clock, no RNG, no filesystem, no network. Callers pass
  `unix_time`, ids, salts and nonces in. RNG/uuid live only in `twofau-wasm` and the app.
- **Secrets never reach `Account`** (the UI model). They live only in `StoredAccount`,
  inside the encrypted vault blob. Across the JS boundary secrets are base64 strings.
- **Vault blob is self-describing**: `b"2FAU" | version | kdf_id | salt(16) | nonce(12) |
ciphertext`, and the 6-byte header is bound as AES-GCM associated data. Never change the
  layout without bumping `version`/`kdf_id` and handling the old one.
- **The UI never imports Tauri APIs.** All I/O goes through the `VaultService` port
  (`packages/ui/src/core/vault-service.ts`) so the same components run over Tauri IPC,
  direct WASM, or an HTTP backend. Adding a UI feature that needs I/O means extending that
  interface and every implementation.
- **Desktop vault path is `app_data_dir()/vault.dat`** (bundle id `dev.artkost.2fau`) —
  never the Swift app's `~/Library/Application Support/2fau/`. The two blobs share a magic
  but diverge after byte 5; colliding paths produce "unknown KDF id 0".
- **Codes are computed in Rust, not JS**, in the desktop app — the frontend asks for a code
  by account id and never sees a secret.

## Working style

- Match the surrounding code: comments explain _why_, not _what_; no decorative headers.
- Every behaviour change gets a test (`cargo test` for core, Vitest for UI).
- Before claiming done, actually run: `cargo fmt --check && cargo clippy --all-targets -D
warnings && cargo test && pnpm -r test`. See `docs/DEVELOPMENT.md § Verify`.
- Conventional commits (`feat:`, `fix:`, `ci:`, `chore:`), scope optional (`fix(app):`).
- Interactive tray/popup behaviour cannot be verified headlessly — say so instead of
  claiming a GUI fix is confirmed.
