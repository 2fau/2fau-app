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
    pub name: String,
    pub version: String,
    pub os: String,
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
        BridgeController {
            vault,
            state,
            state_path,
            running: Mutex::new(None),
        }
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
                let ctx = Ctx {
                    vault: &vault,
                    state: &state,
                    state_path: &state_path,
                    port: bound_port,
                };
                http::handle(&ctx, req);
            }
        });
        *self.running.lock().expect("running") = Some(Running {
            server,
            handle: Some(handle),
            addr,
        });
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
        self.running
            .lock()
            .expect("running")
            .as_ref()
            .map(|r| r.addr)
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
                .map(|b| BrowserInfo {
                    id: b.id.clone(),
                    origin: b.origin.clone(),
                    paired_at: b.paired_at,
                    name: b.name.clone(),
                    version: b.version.clone(),
                    os: b.os.clone(),
                })
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
