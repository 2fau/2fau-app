//! Request routing and the three-layer localhost defense. Pure over an
//! `AppVault` + `BridgeState` so it is exercised by integration tests.

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
    Response::from_string(body)
        .with_status_code(status)
        .with_header(ct)
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
            let body = format!(
                r#"{{"name":"2fau","version":"{}"}}"#,
                env!("CARGO_PKG_VERSION")
            );
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
            let _ = req.respond(json(
                200,
                format!(r#"{{"revision":{}}}"#, ctx.vault.revision()),
            ));
        }
        Ok(None) => {
            let _ = req.respond(json(404, r#"{"error":"no vault"}"#.into()));
        }
        Err(e) => {
            let _ = req.respond(json(500, format!(r#"{{"error":{e:?}}}"#)));
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
            let _ = req.respond(json(500, format!(r#"{{"error":{e:?}}}"#)));
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
            let body = format!(
                r#"{{"revision":{revision},"blob":"{}"}}"#,
                base64_lite::encode_b64(&blob)
            );
            let _ = req.respond(json(409, body));
        }
        Err(e) => {
            let _ = req.respond(json(500, format!(r#"{{"error":{e:?}}}"#)));
        }
    }
}

/// Minimal std-only base64 (standard alphabet, padded) — the blob is the only
/// binary payload, and pulling a crate in for it isn't worth it.
mod base64_lite {
    const A: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    pub fn encode_b64(data: &[u8]) -> String {
        let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
        for chunk in data.chunks(3) {
            let b = [
                chunk[0],
                *chunk.get(1).unwrap_or(&0),
                *chunk.get(2).unwrap_or(&0),
            ];
            let n = (b[0] as u32) << 16 | (b[1] as u32) << 8 | b[2] as u32;
            out.push(A[(n >> 18 & 63) as usize] as char);
            out.push(A[(n >> 12 & 63) as usize] as char);
            out.push(if chunk.len() > 1 {
                A[(n >> 6 & 63) as usize] as char
            } else {
                '='
            });
            out.push(if chunk.len() > 2 {
                A[(n & 63) as usize] as char
            } else {
                '='
            });
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
        let clean: Vec<u8> = s
            .bytes()
            .filter(|&c| c != b'=' && !c.is_ascii_whitespace())
            .collect();
        let mut out = Vec::with_capacity(clean.len() / 4 * 3);
        for chunk in clean.chunks(4) {
            let mut n = 0u32;
            for (i, &c) in chunk.iter().enumerate() {
                n |= val(c)? << (18 - 6 * i);
            }
            out.push((n >> 16) as u8);
            if chunk.len() > 2 {
                out.push((n >> 8) as u8);
            }
            if chunk.len() > 3 {
                out.push(n as u8);
            }
        }
        Some(out)
    }
}
