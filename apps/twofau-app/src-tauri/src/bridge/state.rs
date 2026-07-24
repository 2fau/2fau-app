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
    bytes
        .iter()
        .map(|b| CODE_ALPHABET[(*b as usize) % CODE_ALPHABET.len()] as char)
        .collect()
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
            Err(_) => BridgeState {
                port: DEFAULT_PORT,
                ..Default::default()
            },
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
        assert!(state
            .redeem_code(&code, ORIGIN, 1_000 + PAIRING_TTL_MS + 1)
            .is_none());
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
        let mut state = BridgeState {
            enabled: true,
            port: 4849,
            ..Default::default()
        };
        let code = state.new_pairing_code(0);
        state.redeem_code(&code, ORIGIN, 1).unwrap();
        state.persist(&path).unwrap();

        let mut loaded = BridgeState::load(&path);
        assert!(loaded.enabled);
        assert_eq!(loaded.port, 4849);
        assert_eq!(loaded.browsers.len(), 1);
        // The pending code is in-memory only and does not survive a reload.
        assert!(loaded.redeem_code(&code, ORIGIN, 2).is_none());
    }
}
