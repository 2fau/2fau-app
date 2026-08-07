# SP5 Phase A — Desktop Bridge Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the desktop app an opt-in `127.0.0.1` HTTP bridge that serves and accepts the *sealed* vault blob under a revision guard, gated by a paired bearer token, plus the desktop UI to enable it and show a pairing code.

**Architecture:** A `tiny_http` server runs on a background thread inside the Tauri app, sharing the process's `Arc<AppVault>`. `AppVault` gains a persisted monotonic revision bumped on every save. The server enforces three independent checks (Origin pin, Host check, bearer token) and exposes five endpoints. Bridge enable/pairing/revoke are Tauri commands driven by a `<BridgeSettings>` section reached through a new optional `settingsSlot` in the shared `@twofau/ui` shell.

**Tech Stack:** Rust, `tiny_http` (server), `serde`/`serde_json`, `getrandom` (tokens/codes), `ureq` + `tempfile` (dev-only integration tests); React 19 + `@tauri-apps/api` on the desktop frontend.

**Scope note:** This is Phase A of SP5. It delivers a working, independently testable bridge server the user can turn on and see a pairing code for. Phase B (extension `HttpVaultRepo` + desktop-client mode) and Phase C (sync engine) are separate follow-up plans. Nothing here touches the extension.

## Global Constraints

- Spec: `docs/specs/2026-07-23-subproject5-desktop-bridge.md`. Every task's requirements implicitly include it.
- The bridge transfers the **sealed blob only** — never plaintext accounts, secrets, or codes.
- The server binds `127.0.0.1` **only**, never `0.0.0.0`. Default port **4849**.
- Three independent defenses on the server, each sufficient alone: **Origin pinning** (`chrome-extension://<id>` recorded at pairing), **Host header check** (`127.0.0.1`/`localhost` + port), **bearer token** (constant-time compared).
- The bridge is **off by default**; the server starts only when the user enables it.
- Token compares MUST be constant-time. No `==` on secrets.
- `AppVault.revision` is a monotonic `u64`, persisted, bumped on **every** save including desktop-UI edits.
- Rust: `cargo fmt --all --check` clean and `cargo clippy -p twofau-app --all-targets -- -D warnings` clean before each commit.
- Follow existing patterns in `apps/twofau-app/src-tauri/src/` (error strings via `str_err`, `getrandom` for randomness, `serde_json` for persistence).

## Shared interfaces (defined across tasks — names are contracts)

```rust
// vault.rs (Task 1)
pub enum ReplaceOutcome {
    Committed { revision: u64 },
    Conflict { revision: u64, blob: Vec<u8> },
}
impl AppVault {
    pub fn revision(&self) -> u64;
    pub fn sealed_blob(&self) -> Result<Option<Vec<u8>>, String>;
    pub fn replace_sealed(&self, blob: &[u8], base_revision: u64) -> Result<ReplaceOutcome, String>;
}

// bridge/state.rs (Task 2)
pub struct PairedBrowser { pub id: String, pub origin: String, pub token: String, pub paired_at: u64 }
pub struct BridgeState { pub enabled: bool, pub port: u16, pub browsers: Vec<PairedBrowser> /* + in-mem pending */ }
impl BridgeState {
    pub fn load(path: &Path) -> BridgeState;                 // defaults if absent/corrupt
    pub fn persist(&self, path: &Path) -> Result<(), String>;
    pub fn new_pairing_code(&mut self, now_ms: u64) -> String;
    pub fn redeem_code(&mut self, code: &str, origin: &str, now_ms: u64) -> Option<String>; // -> token
    pub fn token_origin(&self, token: &str) -> Option<&str>; // constant-time match, returns pinned origin
    pub fn revoke(&mut self, id: &str) -> bool;
}

// bridge/mod.rs (Tasks 2–5)
pub struct BrowserInfo { pub id: String, pub origin: String, pub paired_at: u64 }
pub struct BridgeStatus { pub enabled: bool, pub port: u16, pub browsers: Vec<BrowserInfo> }
impl BridgeController {
    pub fn new(vault: Arc<AppVault>, state_path: PathBuf) -> BridgeController;
    pub fn status(&self) -> BridgeStatus;
    pub fn enable(&self, on: bool, port: u16) -> Result<(), String>;
    pub fn pairing_code(&self) -> String;
    pub fn revoke(&self, id: &str) -> Result<(), String>;
    pub fn is_running(&self) -> bool;
    pub fn local_addr(&self) -> Option<SocketAddr>; // for tests (ephemeral port)
}
```

---

### Task 1: `AppVault` revision + sealed-blob accessors

**Files:**
- Modify: `apps/twofau-app/src-tauri/src/vault.rs`

**Interfaces:**
- Consumes: existing `AppVault`, `FileVaultStore`, `open_with_passphrase`.
- Produces: `ReplaceOutcome`, `AppVault::revision`, `AppVault::sealed_blob`, `AppVault::replace_sealed`; revision bumped inside the existing save path.

- [ ] **Step 1: Write the failing tests**

Append to `apps/twofau-app/src-tauri/src/vault.rs` (after the existing code, before the `keyring_*` free fns is fine; put a `#[cfg(test)] mod tests` at the end):

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    const PASS: &str = "correct-horse-battery";

    fn fresh() -> (AppVault, tempfile::TempDir) {
        let dir = tempdir().unwrap();
        let vault = AppVault::new(dir.path().join("vault.dat"));
        (vault, dir)
    }

    #[test]
    fn revision_starts_at_zero_and_bumps_on_each_save() {
        let (vault, _dir) = fresh();
        assert_eq!(vault.revision(), 0);
        vault.unlock(PASS.into(), false).unwrap(); // creates + saves the empty vault
        assert_eq!(vault.revision(), 1);
        vault.add_uri("otpauth://totp/Acme:me?secret=JBSWY3DPEHPK3PXP&issuer=Acme").unwrap();
        assert_eq!(vault.revision(), 2);
    }

    #[test]
    fn revision_survives_reopening_the_vault() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("vault.dat");
        {
            let vault = AppVault::new(path.clone());
            vault.unlock(PASS.into(), false).unwrap();
            vault.add_uri("otpauth://totp/A:b?secret=JBSWY3DPEHPK3PXP").unwrap();
            assert_eq!(vault.revision(), 2);
        }
        let reopened = AppVault::new(path);
        assert_eq!(reopened.revision(), 2);
    }

    #[test]
    fn sealed_blob_round_trips_through_replace() {
        let (vault, _dir) = fresh();
        vault.unlock(PASS.into(), false).unwrap();
        let rev = vault.revision();
        let blob = vault.sealed_blob().unwrap().expect("a vault exists");

        // Re-sealing the same doc under the same passphrase is a valid new blob.
        let outcome = vault.replace_sealed(&blob, rev).unwrap();
        match outcome {
            ReplaceOutcome::Committed { revision } => assert_eq!(revision, rev + 1),
            ReplaceOutcome::Conflict { .. } => panic!("expected commit"),
        }
        assert_eq!(vault.revision(), rev + 1);
    }

    #[test]
    fn replace_with_stale_base_revision_conflicts() {
        let (vault, _dir) = fresh();
        vault.unlock(PASS.into(), false).unwrap();
        let blob = vault.sealed_blob().unwrap().unwrap();
        let current = vault.revision();

        let outcome = vault.replace_sealed(&blob, current - 1).unwrap();
        match outcome {
            ReplaceOutcome::Conflict { revision, blob: got } => {
                assert_eq!(revision, current);
                assert_eq!(got, blob);
            }
            ReplaceOutcome::Committed { .. } => panic!("expected conflict"),
        }
        assert_eq!(vault.revision(), current, "a conflict must not bump");
    }
}
```

Add to `apps/twofau-app/src-tauri/Cargo.toml` under a new `[dev-dependencies]` section:

```toml
[dev-dependencies]
tempfile = "3"
# `json` pulls in `send_json`/`into_json`/`ureq::json!`; no TLS features are
# needed because the bridge is plain http on loopback.
ureq = { version = "2", default-features = false, features = ["json"] }
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cargo test -p twofau-app --lib vault:: 2>&1 | tail -20`
Expected: FAIL — `no method named revision`, `cannot find type ReplaceOutcome`.

- [ ] **Step 3: Add the revision field and sidecar persistence**

In `vault.rs`, add the outcome type above `pub struct AppVault`:

```rust
/// Result of writing an externally-supplied sealed blob under the revision guard.
pub enum ReplaceOutcome {
    Committed { revision: u64 },
    Conflict { revision: u64, blob: Vec<u8> },
}
```

Extend the struct and constructor. Replace the `AppVault` struct and `new` with:

```rust
pub struct AppVault {
    store: FileVaultStore,
    rev_path: PathBuf,
    revision: Mutex<u64>,
    inner: Mutex<Option<Unlocked>>,
}

impl AppVault {
    pub fn new(path: PathBuf) -> AppVault {
        let rev_path = path.with_extension("rev");
        let revision = std::fs::read_to_string(&rev_path)
            .ok()
            .and_then(|s| s.trim().parse::<u64>().ok())
            .unwrap_or(0);
        AppVault {
            store: FileVaultStore::new(path),
            rev_path,
            revision: Mutex::new(revision),
            inner: Mutex::new(None),
        }
    }

    pub fn revision(&self) -> u64 {
        *self.revision.lock().expect("revision mutex")
    }

    /// The raw sealed blob on disk (ciphertext), or None on first run.
    pub fn sealed_blob(&self) -> Result<Option<Vec<u8>>, String> {
        self.store.load().map_err(str_err)
    }
```

(Leave the rest of `impl AppVault` in place; the block stays open — the methods below are appended in Step 4/5. Close it after `replace_sealed`.)

- [ ] **Step 4: Route every save through a revision bump**

Replace the existing `seal_and_save` with a version that bumps, and add the shared writer + `replace_sealed`:

```rust
    /// Persist a sealed blob, bump the revision, and persist the revision.
    /// The single choke point every write goes through.
    fn write_blob_locked(&self, rev: &mut u64, blob: &[u8]) -> Result<u64, String> {
        self.store.save(blob).map_err(str_err)?;
        *rev += 1;
        std::fs::write(&self.rev_path, rev.to_string()).map_err(str_err)?;
        Ok(*rev)
    }

    fn seal_and_save(&self, doc: &VaultDocument, passphrase: &str) -> Result<(), String> {
        let salt = random::<SALT_LEN>();
        let nonce = random::<NONCE_LEN>();
        let blob = seal_with_passphrase(doc, passphrase, &salt, &nonce).map_err(str_err)?;
        let mut rev = self.revision.lock().expect("revision mutex");
        self.write_blob_locked(&mut rev, &blob)?;
        Ok(())
    }

    /// Write an externally-supplied sealed blob under the revision guard. If the
    /// vault is unlocked, re-open the new blob so the desktop UI reflects it;
    /// if it can't be opened (a genuinely different passphrase), lock the vault
    /// rather than show stale data.
    pub fn replace_sealed(&self, blob: &[u8], base_revision: u64) -> Result<ReplaceOutcome, String> {
        let mut rev = self.revision.lock().expect("revision mutex");
        if base_revision != *rev {
            let current = self.store.load().map_err(str_err)?.unwrap_or_default();
            return Ok(ReplaceOutcome::Conflict { revision: *rev, blob: current });
        }
        let new_rev = self.write_blob_locked(&mut rev, blob)?;
        drop(rev);

        let mut guard = self.inner.lock().expect("vault mutex");
        if let Some(u) = guard.as_mut() {
            match open_with_passphrase(blob, &u.passphrase) {
                Ok(doc) => u.doc = doc,
                Err(_) => *guard = None,
            }
        }
        Ok(ReplaceOutcome::Committed { revision: new_rev })
    }
}
```

Note the closing `}` above ends `impl AppVault`. Delete the old standalone `seal_and_save` you replaced.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cargo test -p twofau-app --lib vault:: 2>&1 | tail -20`
Expected: PASS — 4 tests.

- [ ] **Step 6: Format, lint, commit**

```bash
cargo fmt --all && cargo clippy -p twofau-app --all-targets -- -D warnings
git add apps/twofau-app/src-tauri/src/vault.rs apps/twofau-app/src-tauri/Cargo.toml
git commit -m "feat(app): persisted vault revision + sealed-blob replace guard"
```

---

### Task 2: Bridge state + pairing bookkeeping

**Files:**
- Create: `apps/twofau-app/src-tauri/src/bridge/mod.rs`
- Create: `apps/twofau-app/src-tauri/src/bridge/state.rs`
- Modify: `apps/twofau-app/src-tauri/src/lib.rs` (add `pub mod bridge;`, `pub mod vault;`)
- Modify: `apps/twofau-app/src-tauri/Cargo.toml` (add `tiny_http`)

**Interfaces:**
- Consumes: nothing from Task 1 at runtime (state is independent); `getrandom`, `serde`.
- Produces: `BridgeState`, `PairedBrowser`, and the pairing/token helpers listed in Shared interfaces.

- [ ] **Step 1: Add the dependency and module declarations**

In `apps/twofau-app/src-tauri/Cargo.toml`, add to `[dependencies]`:

```toml
tiny_http = "0.12"
```

In `apps/twofau-app/src-tauri/src/lib.rs`, change the first line `mod vault;` to:

```rust
pub mod bridge;
pub mod vault;
```

- [ ] **Step 2: Write the failing state tests**

Create `apps/twofau-app/src-tauri/src/bridge/state.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    const ORIGIN: &str = "chrome-extension://abcdefghijklmnop";

    #[test]
    fn code_redeems_once_within_its_window() {
        let mut state = BridgeState::default();
        let code = state.new_pairing_code(1_000);
        // Wrong code, right window.
        assert!(state.redeem_code("WRONG-CODE", ORIGIN, 1_500).is_none());
        // Right code, right window -> a token, and the browser is recorded.
        let token = state.redeem_code(&code, ORIGIN, 1_500).expect("token");
        assert_eq!(state.browsers.len(), 1);
        assert_eq!(state.token_origin(&token), Some(ORIGIN));
        // The code is single-use.
        assert!(state.redeem_code(&code, ORIGIN, 1_600).is_none());
    }

    #[test]
    fn code_expires_after_the_window() {
        let mut state = BridgeState::default();
        let code = state.new_pairing_code(1_000);
        assert!(state.redeem_code(&code, ORIGIN, 1_000 + PAIRING_TTL_MS + 1).is_none());
    }

    #[test]
    fn unknown_token_has_no_origin() {
        let state = BridgeState::default();
        assert_eq!(state.token_origin("nope"), None);
    }

    #[test]
    fn revoke_drops_the_browser_and_its_token() {
        let mut state = BridgeState::default();
        let code = state.new_pairing_code(0);
        let token = state.redeem_code(&code, ORIGIN, 1).unwrap();
        let id = state.browsers[0].id.clone();
        assert!(state.revoke(&id));
        assert_eq!(state.token_origin(&token), None);
        assert!(!state.revoke(&id), "second revoke is a no-op");
    }

    #[test]
    fn persist_and_reload_round_trips_browsers() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("bridge-state.json");
        let mut state = BridgeState::default();
        state.enabled = true;
        state.port = 4849;
        let code = state.new_pairing_code(0);
        state.redeem_code(&code, ORIGIN, 1).unwrap();
        state.persist(&path).unwrap();

        let loaded = BridgeState::load(&path);
        assert!(loaded.enabled);
        assert_eq!(loaded.port, 4849);
        assert_eq!(loaded.browsers.len(), 1);
        // The pending code is in-memory only and does not survive a reload.
        assert!(loaded.redeem_code(&code, ORIGIN, 2).is_none());
    }
}
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cargo test -p twofau-app --lib bridge::state 2>&1 | tail -20`
Expected: FAIL — `cannot find type BridgeState`.

- [ ] **Step 4: Implement the state module**

Prepend to `apps/twofau-app/src-tauri/src/bridge/state.rs` (above the `#[cfg(test)]` block):

```rust
//! Persisted bridge state (enabled flag, port, paired browsers) plus the
//! in-memory pending pairing code. Serialised to `bridge-state.json`.

use std::path::Path;

use serde::{Deserialize, Serialize};

/// Default bridge port. Match patterns ignore the port, so the extension's
/// optional host permission (`http://127.0.0.1/*`) covers any choice.
pub const DEFAULT_PORT: u16 = 4849;
/// How long a shown pairing code stays redeemable.
pub const PAIRING_TTL_MS: u64 = 120_000;

const CODE_ALPHABET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Crockford-ish, no confusables

#[derive(Serialize, Deserialize, Clone)]
pub struct PairedBrowser {
    pub id: String,
    pub origin: String,
    pub token: String,
    pub paired_at: u64,
}

#[derive(Serialize, Deserialize, Default)]
pub struct BridgeState {
    pub enabled: bool,
    pub port: u16,
    pub browsers: Vec<PairedBrowser>,
    /// In-memory only: the currently displayed code and when it expires.
    #[serde(skip)]
    pending: Option<(String, u64)>,
}

fn random_bytes<const N: usize>() -> [u8; N] {
    let mut b = [0u8; N];
    getrandom::getrandom(&mut b).expect("OS RNG unavailable");
    b
}

fn encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| CODE_ALPHABET[(*b as usize) % CODE_ALPHABET.len()] as char).collect()
}

/// Length-independent, short-circuit-free byte comparison.
fn constant_time_eq(a: &str, b: &str) -> bool {
    let (a, b) = (a.as_bytes(), b.as_bytes());
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

impl BridgeState {
    pub fn load(path: &Path) -> BridgeState {
        match std::fs::read(path) {
            Ok(bytes) => serde_json::from_slice(&bytes).unwrap_or_default(),
            Err(_) => BridgeState { port: DEFAULT_PORT, ..Default::default() },
        }
    }

    pub fn persist(&self, path: &Path) -> Result<(), String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let json = serde_json::to_vec_pretty(self).map_err(|e| e.to_string())?;
        std::fs::write(path, json).map_err(|e| e.to_string())
    }

    /// Generate and store a fresh pairing code (replaces any prior pending one).
    pub fn new_pairing_code(&mut self, now_ms: u64) -> String {
        let raw = encode(&random_bytes::<8>());
        let code = format!("{}-{}", &raw[..4], &raw[4..]);
        self.pending = Some((code.clone(), now_ms + PAIRING_TTL_MS));
        code
    }

    /// Redeem a code for a token bound to `origin`, recording the browser.
    /// Consumes the pending code (single use).
    pub fn redeem_code(&mut self, code: &str, origin: &str, now_ms: u64) -> Option<String> {
        let (expected, expires) = self.pending.clone()?;
        if now_ms > expires || !constant_time_eq(code, &expected) {
            return None;
        }
        self.pending = None;
        let token = encode(&random_bytes::<32>());
        self.browsers.push(PairedBrowser {
            id: encode(&random_bytes::<8>()),
            origin: origin.to_string(),
            token: token.clone(),
            paired_at: now_ms,
        });
        Some(token)
    }

    /// The origin a token is pinned to, matched in constant time.
    pub fn token_origin(&self, token: &str) -> Option<&str> {
        self.browsers
            .iter()
            .find(|b| constant_time_eq(&b.token, token))
            .map(|b| b.origin.as_str())
    }

    pub fn revoke(&mut self, id: &str) -> bool {
        let before = self.browsers.len();
        self.browsers.retain(|b| b.id != id);
        self.browsers.len() != before
    }
}
```

- [ ] **Step 5: Create the module root so it compiles**

Create `apps/twofau-app/src-tauri/src/bridge/mod.rs`:

```rust
//! The localhost bridge: an opt-in HTTP server that serves and accepts the
//! sealed vault blob for the browser extension. Off by default.

mod state;

pub use state::{BridgeState, PairedBrowser, DEFAULT_PORT, PAIRING_TTL_MS};
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cargo test -p twofau-app --lib bridge::state 2>&1 | tail -20`
Expected: PASS — 5 tests.

- [ ] **Step 7: Format, lint, commit**

```bash
cargo fmt --all && cargo clippy -p twofau-app --all-targets -- -D warnings
git add apps/twofau-app/src-tauri/src/bridge apps/twofau-app/src-tauri/src/lib.rs apps/twofau-app/src-tauri/Cargo.toml
git commit -m "feat(app): bridge state, pairing codes, and revocable tokens"
```

---

### Task 3: The server, routing, and the three-layer defense

**Files:**
- Create: `apps/twofau-app/src-tauri/src/bridge/http.rs`
- Modify: `apps/twofau-app/src-tauri/src/bridge/mod.rs` (the `BridgeController`)
- Test: `apps/twofau-app/src-tauri/tests/bridge.rs`

**Interfaces:**
- Consumes: `AppVault` (Task 1), `BridgeState` (Task 2).
- Produces: `BridgeController` with `new`/`enable`/`status`/`pairing_code`/`revoke`/`is_running`/`local_addr`; `/ping` reachable; Origin/Host/token enforcement in `http::handle`.

- [ ] **Step 1: Write the failing integration tests**

Create `apps/twofau-app/src-tauri/tests/bridge.rs`:

```rust
//! Integration tests: a real BridgeController on an ephemeral port, driven with
//! a real HTTP client. Proves the localhost defenses and the vault endpoints.

use std::sync::Arc;

use tempfile::TempDir;
use twofau_app_lib::bridge::BridgeController;
use twofau_app_lib::vault::AppVault;

const ORIGIN: &str = "chrome-extension://abcdefghijklmnop";
const PASS: &str = "correct-horse-battery";

struct Harness {
    ctrl: BridgeController,
    base: String,
    _dir: TempDir,
}

fn start() -> Harness {
    let dir = tempfile::tempdir().unwrap();
    let vault = Arc::new(AppVault::new(dir.path().join("vault.dat")));
    vault.unlock(PASS.into(), false).unwrap();
    let ctrl = BridgeController::new(vault, dir.path().join("bridge-state.json"));
    ctrl.enable(true, 0).unwrap(); // port 0 -> OS-assigned
    let addr = ctrl.local_addr().expect("listening");
    Harness { ctrl, base: format!("http://127.0.0.1:{}", addr.port()), _dir: dir }
}

/// Redeem a fresh code and return a paired token.
fn pair(h: &Harness) -> String {
    let code = h.ctrl.pairing_code();
    let resp = ureq::post(&format!("{}/pair", h.base))
        .set("Origin", ORIGIN)
        .send_json(ureq::json!({ "code": code, "extensionId": "abcdefghijklmnop" }))
        .expect("pair ok");
    resp.into_json::<serde_json::Value>().unwrap()["token"].as_str().unwrap().to_string()
}

#[test]
fn ping_answers_with_the_app_name() {
    let h = start();
    let body: serde_json::Value = ureq::get(&format!("{}/ping", h.base))
        .set("Origin", ORIGIN)
        .call()
        .unwrap()
        .into_json()
        .unwrap();
    assert_eq!(body["name"], "2fau");
}

#[test]
fn rejects_a_foreign_origin() {
    let h = start();
    let err = ureq::get(&format!("{}/ping", h.base))
        .set("Origin", "https://evil.example")
        .call()
        .unwrap_err();
    assert!(matches!(err, ureq::Error::Status(403, _)), "got {err:?}");
}

#[test]
fn rejects_a_rebound_host_header() {
    let h = start();
    // A DNS-rebinding attacker reaches the socket but carries a foreign Host.
    let err = ureq::get(&format!("{}/ping", h.base))
        .set("Origin", ORIGIN)
        .set("Host", "attacker.example")
        .call()
        .unwrap_err();
    assert!(matches!(err, ureq::Error::Status(403, _)), "got {err:?}");
}

#[test]
fn vault_endpoints_need_a_bearer_token() {
    let h = start();
    let err = ureq::get(&format!("{}/vault", h.base))
        .set("Origin", ORIGIN)
        .call()
        .unwrap_err();
    assert!(matches!(err, ureq::Error::Status(401, _)), "got {err:?}");
}

#[test]
fn a_valid_token_from_a_different_origin_is_refused() {
    let h = start();
    let token = pair(&h);
    // Right token, wrong Origin: the token is pinned to ORIGIN.
    let err = ureq::get(&format!("{}/vault", h.base))
        .set("Origin", "https://evil.example")
        .set("Authorization", &format!("Bearer {token}"))
        .call()
        .unwrap_err();
    assert!(matches!(err, ureq::Error::Status(403, _)), "got {err:?}");
}

#[test]
fn enable_false_stops_the_server() {
    let h = start();
    assert!(h.ctrl.is_running());
    h.ctrl.enable(false, 0).unwrap();
    assert!(!h.ctrl.is_running());
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cargo test -p twofau-app --test bridge 2>&1 | tail -20`
Expected: FAIL — `no function or associated item named new found for struct BridgeController` (won't compile).

- [ ] **Step 3: Implement request parsing and the defenses**

Create `apps/twofau-app/src-tauri/src/bridge/http.rs`:

```rust
//! Request routing and the three-layer localhost defense. Pure over an
//! `AppVault` + `BridgeState` so it is exercised by integration tests.

use std::io::Read;
use std::sync::Mutex;

use tiny_http::{Header, Request, Response};

use super::state::BridgeState;
use crate::vault::{AppVault, ReplaceOutcome};

/// Shared handler context held by the server thread.
pub struct Ctx<'a> {
    pub vault: &'a AppVault,
    pub state: &'a Mutex<BridgeState>,
    pub state_path: &'a std::path::Path,
    pub port: u16,
}

/// A header value as an owned `String`. tiny_http stores header values as
/// `AsciiString`, so we copy out to a plain `String` rather than juggle ascii
/// borrows through the handlers.
fn header(req: &Request, name: &str) -> Option<String> {
    req.headers()
        .iter()
        .find(|h| h.field.as_str().as_str().eq_ignore_ascii_case(name))
        .map(|h| h.value.as_str().to_string())
}

fn json(status: u16, body: String) -> Response<std::io::Cursor<Vec<u8>>> {
    let ct = Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap();
    Response::from_string(body).with_status_code(status).with_header(ct)
}

/// Host must be loopback on our port — defeats DNS rebinding.
fn host_ok(req: &Request, port: u16) -> bool {
    match header(req, "Host") {
        Some(h) => h == format!("127.0.0.1:{port}") || h == format!("localhost:{port}"),
        None => false,
    }
}

fn bearer(req: &Request) -> Option<String> {
    header(req, "Authorization")?
        .strip_prefix("Bearer ")
        .map(str::to_string)
}

/// Route one request. All error paths return JSON so the client sees a message.
pub fn handle(ctx: &Ctx, req: Request) {
    let origin = header(&req, "Origin").unwrap_or_default();
    let method = req.method().to_string(); // tiny_http Method: Display
    let url = req.url().to_string();

    // Layer 2: Host header.
    if !host_ok(&req, ctx.port) {
        let _ = req.respond(json(403, r#"{"error":"bad host"}"#.into()));
        return;
    }

    match (method.as_str(), url.as_str()) {
        ("GET", "/ping") => {
            // /ping only needs a plausible extension origin (Layer 1, light).
            if !origin.starts_with("chrome-extension://") {
                let _ = req.respond(json(403, r#"{"error":"forbidden origin"}"#.into()));
                return;
            }
            let body = format!(r#"{{"name":"2fau","version":"{}"}}"#, env!("CARGO_PKG_VERSION"));
            let _ = req.respond(json(200, body));
        }
        ("POST", "/pair") => handle_pair(ctx, req, &origin),
        ("GET", "/vault/revision") => match authorize(ctx, &req, &origin) {
            Ok(()) => handle_revision(ctx, req),
            Err(resp) => {
                let _ = req.respond(resp);
            }
        },
        ("GET", "/vault") => match authorize(ctx, &req, &origin) {
            Ok(()) => handle_get_vault(ctx, req),
            Err(resp) => {
                let _ = req.respond(resp);
            }
        },
        ("PUT", "/vault") => match authorize(ctx, &req, &origin) {
            Ok(()) => handle_put_vault(ctx, req),
            Err(resp) => {
                let _ = req.respond(resp);
            }
        },
        _ => {
            let _ = req.respond(json(404, r#"{"error":"not found"}"#.into()));
        }
    }
}

/// Layers 1+3 for the authenticated endpoints: the bearer token must exist and
/// be pinned to exactly this request's Origin. `Ok(())` means proceed; `Err`
/// carries the ready-to-send rejection.
fn authorize(
    ctx: &Ctx,
    req: &Request,
    origin: &str,
) -> Result<(), Response<std::io::Cursor<Vec<u8>>>> {
    let token = match bearer(req) {
        Some(t) => t,
        None => return Err(json(401, r#"{"error":"missing token"}"#.into())),
    };
    match ctx.state.lock().expect("state").token_origin(&token) {
        Some(o) if o == origin => Ok(()),
        Some(_) => Err(json(403, r#"{"error":"origin mismatch"}"#.into())),
        None => Err(json(401, r#"{"error":"unknown token"}"#.into())),
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn handle_pair(ctx: &Ctx, mut req: Request, origin: &str) {
    if !origin.starts_with("chrome-extension://") {
        let _ = req.respond(json(403, r#"{"error":"forbidden origin"}"#.into()));
        return;
    }
    let mut body = String::new();
    if req.as_reader().read_to_string(&mut body).is_err() {
        let _ = req.respond(json(400, r#"{"error":"unreadable body"}"#.into()));
        return;
    }
    let code = serde_json::from_str::<serde_json::Value>(&body)
        .ok()
        .and_then(|v| v["code"].as_str().map(String::from))
        .unwrap_or_default();

    let mut state = ctx.state.lock().expect("state");
    match state.redeem_code(&code, origin, now_ms()) {
        Some(token) => {
            let _ = state.persist(ctx.state_path);
            drop(state);
            let _ = req.respond(json(200, format!(r#"{{"token":"{token}"}}"#)));
        }
        None => {
            let _ = req.respond(json(401, r#"{"error":"invalid or expired code"}"#.into()));
        }
    }
}

fn handle_revision(ctx: &Ctx, req: Request) {
    match ctx.vault.sealed_blob() {
        Ok(Some(_)) => {
            let _ = req.respond(json(200, format!(r#"{{"revision":{}}}"#, ctx.vault.revision())));
        }
        Ok(None) => {
            let _ = req.respond(json(404, r#"{"error":"no vault"}"#.into()));
        }
        Err(e) => {
            let _ = req.respond(json(500, format!(r#"{{"error":{:?}}}"#, e)));
        }
    }
}

fn handle_get_vault(ctx: &Ctx, req: Request) {
    match ctx.vault.sealed_blob() {
        Ok(Some(blob)) => {
            let body = format!(
                r#"{{"revision":{},"blob":"{}"}}"#,
                ctx.vault.revision(),
                base64_lite::encode_b64(&blob)
            );
            let _ = req.respond(json(200, body));
        }
        Ok(None) => {
            let _ = req.respond(json(404, r#"{"error":"no vault"}"#.into()));
        }
        Err(e) => {
            let _ = req.respond(json(500, format!(r#"{{"error":{:?}}}"#, e)));
        }
    }
}

fn handle_put_vault(ctx: &Ctx, mut req: Request) {
    let mut body = String::new();
    if req.as_reader().read_to_string(&mut body).is_err() {
        let _ = req.respond(json(400, r#"{"error":"unreadable body"}"#.into()));
        return;
    }
    let parsed = serde_json::from_str::<serde_json::Value>(&body).ok();
    let base = parsed.as_ref().and_then(|v| v["base_revision"].as_u64());
    let blob = parsed
        .as_ref()
        .and_then(|v| v["blob"].as_str())
        .and_then(base64_lite::decode_b64);
    let (Some(base), Some(blob)) = (base, blob) else {
        let _ = req.respond(json(400, r#"{"error":"bad body"}"#.into()));
        return;
    };
    match ctx.vault.replace_sealed(&blob, base) {
        Ok(ReplaceOutcome::Committed { revision }) => {
            let _ = req.respond(json(200, format!(r#"{{"revision":{revision}}}"#)));
        }
        Ok(ReplaceOutcome::Conflict { revision, blob }) => {
            let body = format!(r#"{{"revision":{revision},"blob":"{}"}}"#, base64_lite::encode_b64(&blob));
            let _ = req.respond(json(409, body));
        }
        Err(e) => {
            let _ = req.respond(json(500, format!(r#"{{"error":{:?}}}"#, e)));
        }
    }
}

/// Minimal std-only base64 (standard alphabet, padded) — the blob is the only
/// binary payload, and pulling a crate in for it isn't worth it.
mod base64_lite {
    const A: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    pub fn encode_b64(data: &[u8]) -> String {
        let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
        for chunk in data.chunks(3) {
            let b = [chunk[0], *chunk.get(1).unwrap_or(&0), *chunk.get(2).unwrap_or(&0)];
            let n = (b[0] as u32) << 16 | (b[1] as u32) << 8 | b[2] as u32;
            out.push(A[(n >> 18 & 63) as usize] as char);
            out.push(A[(n >> 12 & 63) as usize] as char);
            out.push(if chunk.len() > 1 { A[(n >> 6 & 63) as usize] as char } else { '=' });
            out.push(if chunk.len() > 2 { A[(n & 63) as usize] as char } else { '=' });
        }
        out
    }

    pub fn decode_b64(s: &str) -> Option<Vec<u8>> {
        fn val(c: u8) -> Option<u32> {
            match c {
                b'A'..=b'Z' => Some((c - b'A') as u32),
                b'a'..=b'z' => Some((c - b'a' + 26) as u32),
                b'0'..=b'9' => Some((c - b'0' + 52) as u32),
                b'+' => Some(62),
                b'/' => Some(63),
                _ => None,
            }
        }
        let clean: Vec<u8> = s.bytes().filter(|&c| c != b'=' && !c.is_ascii_whitespace()).collect();
        let mut out = Vec::with_capacity(clean.len() / 4 * 3);
        for chunk in clean.chunks(4) {
            let mut n = 0u32;
            for (i, &c) in chunk.iter().enumerate() {
                n |= val(c)? << (18 - 6 * i);
            }
            out.push((n >> 16) as u8);
            if chunk.len() > 2 { out.push((n >> 8) as u8); }
            if chunk.len() > 3 { out.push(n as u8); }
        }
        Some(out)
    }
}
```

- [ ] **Step 4: Implement the controller and server thread**

Replace `apps/twofau-app/src-tauri/src/bridge/mod.rs` with:

```rust
//! The localhost bridge: an opt-in HTTP server that serves and accepts the
//! sealed vault blob for the browser extension. Off by default.

mod http;
mod state;

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;

use serde::Serialize;
use tiny_http::Server;

use crate::vault::AppVault;
use http::Ctx;
pub use state::{BridgeState, PairedBrowser, DEFAULT_PORT, PAIRING_TTL_MS};

#[derive(Serialize)]
pub struct BrowserInfo {
    pub id: String,
    pub origin: String,
    pub paired_at: u64,
}

#[derive(Serialize)]
pub struct BridgeStatus {
    pub enabled: bool,
    pub port: u16,
    pub browsers: Vec<BrowserInfo>,
}

struct Running {
    server: Arc<Server>,
    handle: Option<JoinHandle<()>>,
    addr: SocketAddr,
}

pub struct BridgeController {
    vault: Arc<AppVault>,
    state: Arc<Mutex<BridgeState>>,
    state_path: PathBuf,
    running: Mutex<Option<Running>>,
}

impl BridgeController {
    pub fn new(vault: Arc<AppVault>, state_path: PathBuf) -> BridgeController {
        let state = Arc::new(Mutex::new(BridgeState::load(&state_path)));
        BridgeController { vault, state, state_path, running: Mutex::new(None) }
    }

    /// Start (or restart) the bridge if `on`, else stop it. Persists the choice.
    pub fn enable(&self, on: bool, port: u16) -> Result<(), String> {
        self.stop();
        {
            let mut s = self.state.lock().expect("state");
            s.enabled = on;
            if port != 0 {
                s.port = port;
            }
            s.persist(&self.state_path)?;
        }
        if on {
            self.start(port)?;
        }
        Ok(())
    }

    fn start(&self, port: u16) -> Result<(), String> {
        let server = Server::http(("127.0.0.1", port)).map_err(|e| e.to_string())?;
        let addr = server.server_addr().to_ip().ok_or("no ip addr")?;
        let server = Arc::new(server);

        let vault = self.vault.clone();
        let state = self.state.clone();
        let state_path = self.state_path.clone();
        let bound_port = addr.port();
        let srv = server.clone();
        let handle = std::thread::spawn(move || {
            for req in srv.incoming_requests() {
                let ctx = Ctx { vault: &vault, state: &state, state_path: &state_path, port: bound_port };
                http::handle(&ctx, req);
            }
        });
        *self.running.lock().expect("running") = Some(Running { server, handle: Some(handle), addr });
        Ok(())
    }

    fn stop(&self) {
        if let Some(mut r) = self.running.lock().expect("running").take() {
            r.server.unblock(); // ends incoming_requests()
            if let Some(h) = r.handle.take() {
                let _ = h.join();
            }
        }
    }

    pub fn is_running(&self) -> bool {
        self.running.lock().expect("running").is_some()
    }

    pub fn local_addr(&self) -> Option<SocketAddr> {
        self.running.lock().expect("running").as_ref().map(|r| r.addr)
    }

    pub fn pairing_code(&self) -> String {
        let now = now_ms();
        self.state.lock().expect("state").new_pairing_code(now)
    }

    pub fn revoke(&self, id: &str) -> Result<(), String> {
        let mut s = self.state.lock().expect("state");
        s.revoke(id);
        s.persist(&self.state_path)
    }

    pub fn status(&self) -> BridgeStatus {
        let s = self.state.lock().expect("state");
        BridgeStatus {
            enabled: s.enabled,
            port: s.port,
            browsers: s
                .browsers
                .iter()
                .map(|b| BrowserInfo { id: b.id.clone(), origin: b.origin.clone(), paired_at: b.paired_at })
                .collect(),
        }
    }
}

impl Drop for BridgeController {
    fn drop(&mut self) {
        self.stop();
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
```

- [ ] **Step 5: Run the integration tests to verify they pass**

Run: `cargo test -p twofau-app --test bridge 2>&1 | tail -25`
Expected: PASS — `ping_answers_with_the_app_name`, `rejects_a_foreign_origin`, `rejects_a_rebound_host_header`, `vault_endpoints_need_a_bearer_token`, `a_valid_token_from_a_different_origin_is_refused`, `enable_false_stops_the_server`.

- [ ] **Step 6: Format, lint, commit**

```bash
cargo fmt --all && cargo clippy -p twofau-app --all-targets -- -D warnings
git add apps/twofau-app/src-tauri/src/bridge apps/twofau-app/src-tauri/tests/bridge.rs
git commit -m "feat(app): bridge HTTP server with origin/host/token defenses"
```

---

### Task 4: Vault endpoints — round-trip and the revision guard

**Files:**
- Modify: `apps/twofau-app/src-tauri/tests/bridge.rs` (add cases; the handlers already exist from Task 3)

**Interfaces:**
- Consumes: everything from Task 3 (`pair`, `start`, the running endpoints).
- Produces: no new code — this task proves `/vault*` behaviour end-to-end. (The endpoints were written in Task 3 so the module compiles as a whole; this task is where they earn their tests.)

- [ ] **Step 1: Add the endpoint tests**

Append to `apps/twofau-app/src-tauri/tests/bridge.rs`:

```rust
#[test]
fn get_vault_returns_a_blob_and_revision() {
    let h = start();
    let token = pair(&h);
    let body: serde_json::Value = ureq::get(&format!("{}/vault", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .call()
        .unwrap()
        .into_json()
        .unwrap();
    assert!(body["revision"].as_u64().unwrap() >= 1);
    assert!(!body["blob"].as_str().unwrap().is_empty());
}

#[test]
fn revision_endpoint_matches_get_vault() {
    let h = start();
    let token = pair(&h);
    let rev: serde_json::Value = ureq::get(&format!("{}/vault/revision", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .call()
        .unwrap()
        .into_json()
        .unwrap();
    let full: serde_json::Value = ureq::get(&format!("{}/vault", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .call()
        .unwrap()
        .into_json()
        .unwrap();
    assert_eq!(rev["revision"], full["revision"]);
}

#[test]
fn put_vault_round_trips_at_the_current_revision() {
    let h = start();
    let token = pair(&h);
    let current: serde_json::Value = ureq::get(&format!("{}/vault", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .call().unwrap().into_json().unwrap();

    let put: serde_json::Value = ureq::put(&format!("{}/vault", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .send_json(ureq::json!({
            "base_revision": current["revision"],
            "blob": current["blob"],
        }))
        .unwrap()
        .into_json()
        .unwrap();
    assert_eq!(put["revision"].as_u64().unwrap(), current["revision"].as_u64().unwrap() + 1);
}

#[test]
fn put_vault_with_a_stale_revision_conflicts() {
    let h = start();
    let token = pair(&h);
    let current: serde_json::Value = ureq::get(&format!("{}/vault", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .call().unwrap().into_json().unwrap();

    let err = ureq::put(&format!("{}/vault", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .send_json(ureq::json!({
            "base_revision": current["revision"].as_u64().unwrap() - 1,
            "blob": current["blob"],
        }))
        .unwrap_err();
    match err {
        ureq::Error::Status(409, resp) => {
            let body: serde_json::Value = resp.into_json().unwrap();
            assert_eq!(body["revision"], current["revision"]);
            assert!(!body["blob"].as_str().unwrap().is_empty());
        }
        other => panic!("expected 409, got {other:?}"),
    }
}

#[test]
fn get_vault_is_404_before_any_vault_exists() {
    // A controller over a vault path that was never unlocked/created.
    let dir = tempfile::tempdir().unwrap();
    let vault = std::sync::Arc::new(AppVault::new(dir.path().join("vault.dat")));
    let ctrl = BridgeController::new(vault, dir.path().join("bridge-state.json"));
    ctrl.enable(true, 0).unwrap();
    let base = format!("http://127.0.0.1:{}", ctrl.local_addr().unwrap().port());

    // Pair first (pairing doesn't need a vault).
    let code = ctrl.pairing_code();
    let token = ureq::post(&format!("{base}/pair"))
        .set("Origin", ORIGIN)
        .send_json(ureq::json!({ "code": code, "extensionId": "abcdefghijklmnop" }))
        .unwrap()
        .into_json::<serde_json::Value>()
        .unwrap()["token"]
        .as_str()
        .unwrap()
        .to_string();

    let err = ureq::get(&format!("{base}/vault"))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .call()
        .unwrap_err();
    assert!(matches!(err, ureq::Error::Status(404, _)), "got {err:?}");
}
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `cargo test -p twofau-app --test bridge 2>&1 | tail -25`
Expected: PASS — all Task 3 tests plus the 5 new ones.

- [ ] **Step 3: Commit**

```bash
git add apps/twofau-app/src-tauri/tests/bridge.rs
git commit -m "test(app): bridge vault round-trip, revision guard, and empty-vault 404"
```

---

### Task 5: Tauri commands + managed state

**Files:**
- Modify: `apps/twofau-app/src-tauri/src/lib.rs`

**Interfaces:**
- Consumes: `BridgeController` (Tasks 3–4), `AppVault` (Task 1).
- Produces: Tauri commands `bridge_status`, `bridge_enable`, `bridge_pairing_code`, `bridge_revoke`; `AppVault` managed as `Arc<AppVault>`; `BridgeController` managed.

- [ ] **Step 1: Migrate the vault to `Arc` and add the bridge commands**

In `apps/twofau-app/src-tauri/src/lib.rs`:

1. Extend the `use` block:

```rust
use std::sync::Arc;

use bridge::{BridgeController, BridgeStatus};
use vault::{fallback_vault_path, AppVault};
```

2. Change **every** existing command's `vault: State<AppVault>` to `vault: State<Arc<AppVault>>`. `Arc<AppVault>` derefs to `AppVault`, so the method bodies are unchanged. (There are 10: `is_locked`, `try_auto_unlock`, `has_vault`, `unlock`, `list_accounts`, `code`, `add_uri`, `add_manual`, `update_account`, `remove_account`, `advance_hotp`.)

3. Add the bridge commands:

```rust
#[tauri::command]
fn bridge_status(bridge: State<BridgeController>) -> BridgeStatus {
    bridge.status()
}

#[tauri::command]
fn bridge_enable(bridge: State<BridgeController>, on: bool, port: u16) -> Result<(), String> {
    bridge.enable(on, port)
}

#[tauri::command]
fn bridge_pairing_code(bridge: State<BridgeController>) -> String {
    bridge.pairing_code()
}

#[tauri::command]
fn bridge_revoke(bridge: State<BridgeController>, id: String) -> Result<(), String> {
    bridge.revoke(&id)
}
```

- [ ] **Step 2: Manage the state in `setup` and register the commands**

In the `.setup(|app| { ... })` closure, replace the `app.manage(AppVault::new(vault_path));` line with:

```rust
            let bridge_state_path = vault_path.with_file_name("bridge-state.json");
            let vault = Arc::new(AppVault::new(vault_path));
            app.manage(vault.clone());

            let bridge = BridgeController::new(vault, bridge_state_path);
            // Resume the last enabled/port choice across restarts.
            let status = bridge.status();
            if status.enabled {
                let _ = bridge.enable(true, status.port);
            }
            app.manage(bridge);
```

Add the four commands to `tauri::generate_handler![...]` (after `advance_hotp,`):

```rust
            bridge_status,
            bridge_enable,
            bridge_pairing_code,
            bridge_revoke,
```

- [ ] **Step 3: Verify it compiles and the whole app suite is green**

Run: `cargo test -p twofau-app 2>&1 | tail -20`
Expected: PASS — lib `vault::` + `bridge::state` unit tests and the `bridge` integration tests; `cargo check` clean.

- [ ] **Step 4: Format, lint, commit**

```bash
cargo fmt --all && cargo clippy -p twofau-app --all-targets -- -D warnings
git add apps/twofau-app/src-tauri/src/lib.rs
git commit -m "feat(app): expose bridge_status/enable/pairing_code/revoke commands"
```

---

### Task 6: `settingsSlot` in the shared UI shell

**Files:**
- Modify: `packages/ui/src/app.tsx`
- Modify: `packages/ui/src/components/root-view.tsx`
- Modify: `packages/ui/src/components/menu-bar-view.tsx`
- Test: `packages/ui/src/components/root-view.test.tsx`

**Interfaces:**
- Consumes: existing `TwoFAUApp`, `RootView`, `MenuBarView`.
- Produces: `TwoFAUApp` accepts `settingsSlot?: ReactNode`; a gear button appears only when it is provided, opening a settings screen that renders the slot with a Back button.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/components/root-view.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MockVaultService } from "@/core/mock-vault-service";
import { VaultProvider } from "@/state/vault-provider";
import { RootView } from "./root-view";

function renderRoot(settingsSlot?: React.ReactNode) {
  return render(
    <VaultProvider service={new MockVaultService({ startUnlocked: true })}>
      <RootView settingsSlot={settingsSlot} />
    </VaultProvider>,
  );
}

describe("RootView settings slot", () => {
  it("shows no settings gear when no slot is provided", () => {
    renderRoot();
    expect(screen.queryByRole("button", { name: /settings/i })).toBeNull();
  });

  it("opens the slot content from the gear and returns via Back", async () => {
    const user = userEvent.setup();
    renderRoot(<p>bridge settings here</p>);

    await user.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByText("bridge settings here")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.queryByText("bridge settings here")).toBeNull();
  });
});
```

The existing UI suite tests pure functions, so React Testing Library is likely not installed yet. If `@testing-library/react`, `@testing-library/user-event`, or `@testing-library/jest-dom` are missing from `packages/ui/package.json`, add them as devDependencies (`^16`, `^14`, `^6` respectively) and re-run `pnpm install`. Ensure the UI package's Vitest config uses the `jsdom` environment (check whichever file holds the `test` block — `vite.config.ts` or a `vitest.config.ts`), and register the matchers by adding `"@testing-library/jest-dom/vitest"` to that config's `test.setupFiles`. Create a one-line setup file if the project prefers that pattern.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @twofau/ui test root-view 2>&1 | tail -15`
Expected: FAIL — `RootView` doesn't accept `settingsSlot`; no settings button.

- [ ] **Step 3: Thread the slot through `TwoFAUApp`**

In `packages/ui/src/app.tsx`, replace the component with:

```tsx
import type { ReactNode } from "react";
import { RootView } from "@/components/root-view";
import type { VaultService } from "@/core/vault-service";
import { VaultProvider } from "@/state/vault-provider";

/** Top-level entry: wraps the panel in a VaultProvider bound to a host's
 * `VaultService`. Host-specific actions (screen scan, clipboard, quit) and an
 * optional settings panel are injected as props. */
export function TwoFAUApp({
  service,
  onScan,
  onQuit,
  settingsSlot,
}: {
  service: VaultService;
  onScan?: () => void;
  onQuit?: () => void;
  settingsSlot?: ReactNode;
}) {
  return (
    <VaultProvider service={service}>
      <RootView onScan={onScan} onQuit={onQuit} settingsSlot={settingsSlot} />
    </VaultProvider>
  );
}
```

- [ ] **Step 4: Add the settings screen to `RootView`**

In `packages/ui/src/components/root-view.tsx`, replace the file with:

```tsx
import { ChevronLeft } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AddView } from "@/components/add-view";
import { EditView } from "@/components/edit-view";
import { MenuBarView } from "@/components/menu-bar-view";
import { SetupView } from "@/components/setup-view";
import { Button } from "@/components/ui/button";
import { UnlockView } from "@/components/unlock-view";
import type { Account } from "@/core/types";
import { useVault } from "@/state/vault-provider";

type Screen =
  | { name: "list" }
  | { name: "add" }
  | { name: "edit"; account: Account }
  | { name: "settings" };

/** Port of the Swift `RootView`: inline list/add/edit navigation within a fixed
 * 320px panel (no modals). Gated by the unlock screen when locked. An optional
 * host-provided `settingsSlot` adds a gear that opens a settings screen. */
export function RootView({
  onScan,
  onQuit,
  settingsSlot,
}: {
  onScan?: () => void;
  onQuit?: () => void;
  settingsSlot?: ReactNode;
}) {
  const { locked, needsSetup } = useVault();
  const [screen, setScreen] = useState<Screen>({ name: "list" });

  return (
    <div className="w-[320px] bg-background text-foreground">
      {locked ? (
        needsSetup ? (
          <SetupView />
        ) : (
          <UnlockView />
        )
      ) : screen.name === "add" ? (
        <AddView onDone={() => setScreen({ name: "list" })} />
      ) : screen.name === "edit" ? (
        <EditView account={screen.account} onDone={() => setScreen({ name: "list" })} />
      ) : screen.name === "settings" ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 border-b p-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Back"
              onClick={() => setScreen({ name: "list" })}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-[13px] font-medium">Settings</span>
          </div>
          <div className="p-3">{settingsSlot}</div>
        </div>
      ) : (
        <MenuBarView
          onAdd={() => setScreen({ name: "add" })}
          onEdit={(account) => setScreen({ name: "edit", account })}
          onScan={onScan}
          onQuit={onQuit}
          onOpenSettings={settingsSlot ? () => setScreen({ name: "settings" }) : undefined}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Add the gear button to `MenuBarView`**

In `packages/ui/src/components/menu-bar-view.tsx`:

1. Add `Settings` to the `lucide-react` import list (keep the others):

```tsx
import { ClipboardPaste, Plus, ScanLine, Search, Settings, ShieldCheck, X } from "lucide-react";
```

2. Add the prop to the signature:

```tsx
export function MenuBarView({
  onAdd,
  onEdit,
  onScan,
  onQuit,
  onOpenSettings,
}: {
  onAdd: () => void;
  onEdit: (a: Account) => void;
  onScan?: () => void;
  onQuit?: () => void;
  onOpenSettings?: () => void;
}) {
```

3. Render the gear in the footer action row. Add the block below alongside the existing controls — but **at the row level, not inside any `{onQuit && …}` conditional**, since the gear must show whenever `onOpenSettings` is set regardless of whether `onQuit` was passed (the test provides the former but not the latter):

```tsx
          {onOpenSettings && (
            <Button variant="ghost" size="icon" aria-label="Settings" onClick={onOpenSettings}>
              <Settings className="size-4" />
            </Button>
          )}
```

Read the current footer JSX first: place this as a sibling of the `onQuit`/`ShieldCheck` buttons inside the same flex row container, so it participates in the row layout but has its own independent visibility condition.

- [ ] **Step 6: Run the test to verify it passes, and the whole UI suite**

Run: `pnpm --filter @twofau/ui test 2>&1 | tail -15`
Expected: PASS — the 2 new `RootView` tests plus the existing suite. Then `pnpm --filter @twofau/ui exec tsc --noEmit` clean.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/app.tsx packages/ui/src/components/root-view.tsx \
        packages/ui/src/components/menu-bar-view.tsx packages/ui/src/components/root-view.test.tsx \
        packages/ui/package.json packages/ui/vitest.config.ts pnpm-lock.yaml
git commit -m "feat(ui): optional settingsSlot with a gear-reachable settings screen"
```

---

### Task 7: Desktop `<BridgeSettings>` wired to the bridge commands

**Files:**
- Create: `apps/twofau-app/src/bridge-settings.tsx`
- Modify: `apps/twofau-app/src/main.tsx`

**Interfaces:**
- Consumes: Tauri commands `bridge_status`/`bridge_enable`/`bridge_pairing_code`/`bridge_revoke` (Task 5); `TwoFAUApp`'s `settingsSlot` (Task 6).
- Produces: a desktop-only bridge control panel; no interface consumed downstream (Phase A ends here).

- [ ] **Step 1: Build the component**

Create `apps/twofau-app/src/bridge-settings.tsx`:

```tsx
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

interface BrowserInfo {
  id: string;
  origin: string;
  paired_at: number;
}
interface BridgeStatus {
  enabled: boolean;
  port: number;
  browsers: BrowserInfo[];
}

export function BridgeSettings() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setStatus(await invoke<BridgeStatus>("bridge_status"));
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function run(work: () => Promise<void>) {
    setError(null);
    try {
      await work();
      await refresh();
    } catch (err) {
      setError(String(err));
    }
  }

  if (!status) return <p className="text-[13px]">Loading…</p>;

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={status.enabled}
          onChange={(e) =>
            void run(async () => {
              setCode(null);
              await invoke("bridge_enable", { on: e.target.checked, port: status.port });
            })
          }
        />
        Enable browser bridge (port {status.port})
      </label>

      {status.enabled && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className="rounded border px-2 py-1 text-left"
            onClick={() =>
              void run(async () => {
                setCode(await invoke<string>("bridge_pairing_code"));
              })
            }
          >
            Show pairing code
          </button>
          {code && (
            <p className="font-mono text-[15px] tracking-wide">
              {code}
              <span className="ml-2 text-[11px] text-muted-foreground">valid ~2 min</span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="font-medium">Paired browsers</span>
        {status.browsers.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">None yet.</span>
        ) : (
          status.browsers.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px]">{b.origin}</span>
              <button
                type="button"
                className="rounded border px-2 py-0.5 text-[11px]"
                onClick={() => void run(() => invoke("bridge_revoke", { id: b.id }))}
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>

      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Pass it into `TwoFAUApp`**

In `apps/twofau-app/src/main.tsx`, add the import and the prop:

```tsx
import { BridgeSettings } from "./bridge-settings";
```

and change the render line to:

```tsx
      <TwoFAUApp
        service={service}
        onQuit={() => void invoke("quit")}
        settingsSlot={<BridgeSettings />}
      />
```

- [ ] **Step 3: Typecheck the desktop frontend and build it**

Run: `pnpm --filter @twofau/app build 2>&1 | tail -8`
Expected: `tsc` clean, `vite` build succeeds.

- [ ] **Step 4: Manual check — the desktop bridge UI**

Run the app (`pnpm --filter @twofau/app tauri dev`), unlock, open the popup's gear → Settings.
Expected: the bridge section renders; toggling **Enable** starts the server (no error); **Show pairing code** displays a `XXXX-XXXX` code; the paired-browsers list is empty. Toggling off and reopening the app: the enable state persists.
**Manual check — report exactly what happened, including anything that didn't work.**

- [ ] **Step 5: Commit**

```bash
git add apps/twofau-app/src/bridge-settings.tsx apps/twofau-app/src/main.tsx
git commit -m "feat(app): desktop bridge settings panel (enable, pairing code, revoke)"
```

---

## Spec coverage (Phase A)

| Spec item (SP5) | Task |
| --- | --- |
| `AppVault` monotonic revision, bumped on every save, persisted | 1 |
| Sealed-blob accessors + revision-guarded replace | 1 |
| Bridge off by default; enable/port persisted | 2, 3, 5 |
| Pairing code (short, ~2 min, single-use) → token bound to origin | 2, 4 |
| Revocable paired browsers | 2, 5, 7 |
| Server binds `127.0.0.1` only, default port 4849 | 2, 3 |
| `/ping`, `/pair`, `/vault/revision`, `/vault` GET/PUT | 3, 4 |
| Origin pinning + Host check + bearer token | 3 |
| Sealed-blob only on the wire (base64 blob payloads) | 3, 4 |
| Revision `409` conflict returns current `{revision, blob}` | 1, 4 |
| `404` when no vault yet | 4 |
| Tauri `bridge_*` commands | 5 |
| Desktop controls via `settingsSlot` + `<BridgeSettings>`, no shared-UI pollution | 6, 7 |
| Rust integration tests for the server | 3, 4 |

## Deferred to later Phase-A-adjacent plans

- **Phase B:** extension `HttpVaultRepo`, the optional `http://127.0.0.1/*` permission request, desktop-client mode in `backend.ts`, and pairing UX in the extension options.
- **Phase C:** `SyncEngine` and sync mode.
- **`MANUAL-CHECKS.md`** for the desktop app gets the bridge rows when Phase B makes an end-to-end browser↔desktop flow real.
```
