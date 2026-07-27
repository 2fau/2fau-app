//! Integration tests: a real BridgeController on an ephemeral port, driven with
//! a real HTTP client. Proves the localhost defenses and the vault endpoints.

use std::sync::Arc;

use base64::prelude::{Engine as _, BASE64_STANDARD};
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
fn ping_allows_a_missing_origin() {
    // Chrome omits the Origin header on the extension's GET fetch to a permitted
    // host (confirmed from a live request capture). ureq likewise sends none.
    let h = start();
    let body: serde_json::Value = ureq::get(&format!("{}/ping", h.base))
        .call()
        .unwrap()
        .into_json()
        .unwrap();
    assert_eq!(body["name"], "2fau");
}

#[test]
fn vault_read_allows_a_missing_origin_with_a_valid_token() {
    // The real client case: paired token, but Chrome sent no Origin on the GET.
    // The token is the gate; an absent Origin must not be treated as a mismatch.
    let h = start();
    let token = pair(&h);
    let body: serde_json::Value = ureq::get(&format!("{}/vault", h.base))
        .set("Authorization", &format!("Bearer {token}"))
        .call()
        .unwrap()
        .into_json()
        .unwrap();
    assert!(body["revision"].as_u64().unwrap() >= 1);
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
        .call()
        .unwrap()
        .into_json()
        .unwrap();

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
    assert_eq!(
        put["revision"].as_u64().unwrap(),
        current["revision"].as_u64().unwrap() + 1
    );
}

#[test]
fn put_vault_with_a_stale_revision_conflicts() {
    let h = start();
    let token = pair(&h);
    let current: serde_json::Value = ureq::get(&format!("{}/vault", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .call()
        .unwrap()
        .into_json()
        .unwrap();

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
    let vault = Arc::new(AppVault::new(dir.path().join("vault.dat")));
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

#[test]
fn merge_endpoint_folds_a_foreign_vault_and_replies_under_its_salt() {
    let h = start(); // desktop unlocked with PASS (empty vault, revision 1)
    let token = pair(&h);

    // An "extension" vault: same passphrase, its own salt, one account.
    let edir = tempfile::tempdir().unwrap();
    let ext = AppVault::new(edir.path().join("v.dat"));
    ext.unlock(PASS.into(), false).unwrap();
    ext.add_uri("otpauth://totp/E:e?secret=JBSWY3DPEHPK3PXP")
        .unwrap();
    let ext_blob = ext.sealed_blob().unwrap().unwrap();

    let resp: serde_json::Value = ureq::post(&format!("{}/merge", h.base))
        .set("Origin", ORIGIN)
        .set("Authorization", &format!("Bearer {token}"))
        .send_json(ureq::json!({ "blob": BASE64_STANDARD.encode(&ext_blob) }))
        .unwrap()
        .into_json()
        .unwrap();

    // The reply opens under the extension's passphrase and holds the account,
    // sealed under the sender's salt (so the extension's key opens it).
    let returned = BASE64_STANDARD
        .decode(resp["blob"].as_str().unwrap())
        .unwrap();
    let doc = twofau_core::open_with_passphrase(&returned, PASS).unwrap();
    assert_eq!(doc.entries.len(), 1);
    assert_eq!(
        twofau_core::salt_of(&returned).unwrap(),
        twofau_core::salt_of(&ext_blob).unwrap()
    );
}
