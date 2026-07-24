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
    Harness {
        ctrl,
        base: format!("http://127.0.0.1:{}", addr.port()),
        _dir: dir,
    }
}

/// Redeem a fresh code and return a paired token.
fn pair(h: &Harness) -> String {
    let code = h.ctrl.pairing_code();
    let resp = ureq::post(&format!("{}/pair", h.base))
        .set("Origin", ORIGIN)
        .send_json(ureq::json!({ "code": code, "extensionId": "abcdefghijklmnop" }))
        .expect("pair ok");
    resp.into_json::<serde_json::Value>().unwrap()["token"]
        .as_str()
        .unwrap()
        .to_string()
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
