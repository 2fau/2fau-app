//! Crash reports: a panic hook records every Rust panic (any thread) as a JSON
//! file under `<data_dir>/dev.artkost.2fau/crashes`, and the webview shows the
//! newest unseen one with a prefilled GitHub-issue link. Nothing is uploaded —
//! the user reviews and submits the issue in their browser.
//!
//! The hook runs while the app may be half-broken (a lock held, a mutex
//! poisoned, the disk full), so it touches no app state and ignores every
//! error: a second panic inside a panic hook aborts the process.

use std::backtrace::Backtrace;
use std::panic::{AssertUnwindSafe, PanicHookInfo};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

/// Reports kept on disk; older ones are pruned on each write.
const KEEP: usize = 10;
/// GitHub rejects new-issue URLs around 8 KB; stay safely under.
const MAX_URL_BYTES: usize = 7_500;
const TRUNCATED_NOTE: &str =
    "… truncated — paste the full report from the Copy button in the crash dialog.";
/// Event the webview listens to for a crash that didn't kill the process.
pub const EVENT: &str = "crash://reported";

/// Set in `setup`; lets the hook notify a still-running webview.
static APP: OnceLock<AppHandle> = OnceLock::new();
/// Disambiguates two panics in the same millisecond.
static SEQ: AtomicU32 = AtomicU32::new(0);
/// Set by the panic hook so the native crash handler skips the abort that may
/// follow a panic (one crash, one report).
static PANICKING: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CrashReport {
    pub id: String,
    pub time_ms: u64,
    pub version: String,
    pub os: String,
    pub arch: String,
    pub thread: String,
    pub message: String,
    pub location: String,
    pub backtrace: String,
    #[serde(default)]
    pub seen: bool,
    /// File name of the minidump beside the report (native crashes only).
    #[serde(default)]
    pub dump: Option<String>,
}

/// What the webview gets: the full report text (for display and Copy) plus a
/// ready-made issue URL whose body may be truncated to fit.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CrashView {
    pub id: String,
    pub message: String,
    pub text: String,
    pub issue_url: String,
}

/// Same rule as `vault::fallback_vault_path`, and the same dir Tauri's
/// `app_data_dir()` resolves to — needed before Tauri is up.
pub fn crashes_dir() -> PathBuf {
    // Lets the native-crash integration test keep dumps out of the real dir.
    #[cfg(debug_assertions)]
    if let Some(dir) = std::env::var_os("TWOFAU_CRASH_DIR") {
        return dir.into();
    }
    crate::vault::fallback_vault_path().with_file_name("crashes")
}

pub fn panicking() -> bool {
    PANICKING.load(Ordering::SeqCst)
}

pub fn new_id(time_ms: u64) -> String {
    format!(
        "crash-{time_ms:013}-{:04}",
        SEQ.fetch_add(1, Ordering::Relaxed) % 10_000
    )
}

pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn set_app(app: AppHandle) {
    let _ = APP.set(app);
}

/// Install the recording hook, chaining to the previous one so dev builds
/// still print the panic to stderr.
pub fn install_hook(dir: PathBuf) {
    let previous = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        PANICKING.store(true, Ordering::SeqCst);
        let report = report_from(info);
        if write(&dir, &report).is_ok() {
            if let Some(app) = APP.get() {
                let _ = app.emit(EVENT, &report.id);
            }
        }
        previous(info);
    }));
}

/// Run `f`, turning a panic into `None`. The hook has already recorded it.
pub fn guard<R>(f: impl FnOnce() -> R) -> Option<R> {
    std::panic::catch_unwind(AssertUnwindSafe(f)).ok()
}

fn report_from(info: &PanicHookInfo) -> CrashReport {
    let payload = info.payload();
    let message = payload
        .downcast_ref::<&str>()
        .map(|s| s.to_string())
        .or_else(|| payload.downcast_ref::<String>().cloned())
        .unwrap_or_else(|| "<non-string panic>".into());
    let time_ms = now_ms();
    CrashReport {
        id: new_id(time_ms),
        time_ms,
        version: env!("CARGO_PKG_VERSION").into(),
        os: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
        thread: std::thread::current()
            .name()
            .unwrap_or("<unnamed>")
            .to_string(),
        message,
        location: info
            .location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_default(),
        // force_capture: works without RUST_BACKTRACE in release builds.
        backtrace: Backtrace::force_capture().to_string(),
        seen: false,
        dump: None,
    }
}

/// Ids come back over IPC; only accept the shape we generate so a crafted id
/// can't name a path outside the crashes dir.
fn valid_id(id: &str) -> bool {
    id.strip_prefix("crash-").is_some_and(|rest| {
        !rest.is_empty() && rest.chars().all(|c| c.is_ascii_digit() || c == '-')
    })
}

fn path_for(dir: &Path, id: &str) -> PathBuf {
    dir.join(format!("{id}.json"))
}

/// Atomic write (tmp + rename), then prune to `KEEP`.
pub fn write(dir: &Path, report: &CrashReport) -> std::io::Result<()> {
    std::fs::create_dir_all(dir)?;
    let json = serde_json::to_vec_pretty(report).map_err(std::io::Error::other)?;
    let path = path_for(dir, &report.id);
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, json)?;
    std::fs::rename(&tmp, &path)?;
    for old in ids(dir).into_iter().skip(KEEP) {
        let _ = std::fs::remove_file(path_for(dir, &old));
        let _ = std::fs::remove_file(dir.join(format!("{old}.dmp")));
    }
    Ok(())
}

/// Report ids, newest first (ids sort by time).
fn ids(dir: &Path) -> Vec<String> {
    let mut ids: Vec<String> = std::fs::read_dir(dir)
        .into_iter()
        .flatten()
        .flatten()
        .filter_map(|e| {
            let name = e.file_name().into_string().ok()?;
            let id = name.strip_suffix(".json")?;
            valid_id(id).then(|| id.to_string())
        })
        .collect();
    ids.sort_unstable_by(|a, b| b.cmp(a));
    ids
}

fn read(dir: &Path, id: &str) -> Option<CrashReport> {
    serde_json::from_slice(&std::fs::read(path_for(dir, id)).ok()?).ok()
}

pub fn list(dir: &Path) -> Vec<CrashReport> {
    ids(dir).iter().filter_map(|id| read(dir, id)).collect()
}

pub fn newest_unseen(dir: &Path) -> Option<CrashReport> {
    list(dir).into_iter().find(|r| !r.seen)
}

/// Flag a report as seen; the file stays for later inspection.
pub fn mark_seen(dir: &Path, id: &str) -> Result<(), String> {
    if !valid_id(id) {
        return Err("invalid crash id".into());
    }
    let mut report = read(dir, id).ok_or("crash report not found")?;
    report.seen = true;
    write(dir, &report).map_err(|e| e.to_string())
}

/// Markdown issue body. `backtrace` is passed separately so the URL builder
/// can shorten it without touching the rest.
fn body(r: &CrashReport, backtrace: &str) -> String {
    format!(
        "**What were you doing when it crashed?**\n\n\n\n\
         ---\n\
         - Version: {}\n- OS: {} ({})\n- Thread: {}\n- Location: {}\n- Time (unix ms): {}\n\n\
         **Crash:** {}\n\n```\n{}\n```\n{}",
        r.version,
        r.os,
        r.arch,
        r.thread,
        r.location,
        r.time_ms,
        r.message,
        backtrace.trim_end(),
        r.dump.as_deref().map(dump_note).unwrap_or_default()
    )
}

fn dump_note(file: &str) -> String {
    format!(
        "\nA minidump (`{file}`) was saved in the app's crashes folder. It can contain \
         data from memory, so please don't attach it here; a maintainer may ask for it \
         privately.\n"
    )
}

pub fn view(r: &CrashReport) -> CrashView {
    CrashView {
        id: r.id.clone(),
        message: r.message.clone(),
        text: body(r, &r.backtrace),
        issue_url: issue_url(r),
    }
}

fn encode(s: &str) -> String {
    let mut out = String::with_capacity(s.len() * 3);
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.' | b'~') {
            out.push(b as char);
        } else {
            out.push_str(&format!("%{b:02X}"));
        }
    }
    out
}

/// `std::backtrace` frames look like `  12: name` followed by `at file:line`
/// lines; we only cut right before a frame header.
fn is_frame_start(line: &str) -> bool {
    line.trim_start()
        .split_once(':')
        .is_some_and(|(n, _)| !n.is_empty() && n.chars().all(|c| c.is_ascii_digit()))
}

pub fn issue_url(r: &CrashReport) -> String {
    let title: String = r
        .message
        .lines()
        .next()
        .unwrap_or("")
        .chars()
        .take(80)
        .collect();
    let base = format!(
        "{}/issues/new?labels=crash&title={}&body=",
        env!("CARGO_PKG_REPOSITORY"),
        encode(&format!("Crash: {title}"))
    );
    let full = base.clone() + &encode(&body(r, &r.backtrace));
    if full.len() <= MAX_URL_BYTES {
        return full;
    }
    let lines: Vec<&str> = r.backtrace.lines().collect();
    let mut keep = lines.len();
    loop {
        // Step back to the previous frame boundary.
        keep = (0..keep)
            .rev()
            .find(|&i| is_frame_start(lines[i]))
            .unwrap_or(0);
        let bt = format!("{}\n{TRUNCATED_NOTE}", lines[..keep].join("\n"));
        let url = base.clone() + &encode(&body(r, &bt));
        if url.len() <= MAX_URL_BYTES || keep == 0 {
            return url;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn sample(id: &str, frames: usize) -> CrashReport {
        let backtrace = (0..frames)
            .map(|i| {
                format!(
                    "  {i}: twofau_app_lib::some::function_{i}\n             at ./src/x.rs:{i}:5"
                )
            })
            .collect::<Vec<_>>()
            .join("\n");
        CrashReport {
            id: id.into(),
            time_ms: 1,
            version: "0.0.0".into(),
            os: "macos".into(),
            arch: "aarch64".into(),
            thread: "time-sync".into(),
            message: "boom & bust".into(),
            location: "src/time_sync.rs:1:1".into(),
            backtrace,
            seen: false,
            dump: None,
        }
    }

    fn decode(s: &str) -> String {
        let b = s.as_bytes();
        let mut out = Vec::new();
        let mut i = 0;
        while i < b.len() {
            if b[i] == b'%' {
                out.push(u8::from_str_radix(&s[i + 1..i + 3], 16).unwrap());
                i += 3;
            } else {
                out.push(b[i]);
                i += 1;
            }
        }
        String::from_utf8(out).unwrap()
    }

    #[test]
    fn write_read_round_trip_and_mark_seen_keeps_file() {
        let dir = tempdir().unwrap();
        let r = sample("crash-0000000000001-0000", 3);
        write(dir.path(), &r).unwrap();
        assert_eq!(newest_unseen(dir.path()), Some(r.clone()));
        mark_seen(dir.path(), &r.id).unwrap();
        assert_eq!(newest_unseen(dir.path()), None);
        assert!(path_for(dir.path(), &r.id).exists());
        assert!(list(dir.path())[0].seen);
    }

    #[test]
    fn eleventh_write_prunes_the_oldest() {
        let dir = tempdir().unwrap();
        std::fs::write(dir.path().join("crash-0000000000000-0000.dmp"), b"x").unwrap();
        for i in 0..11 {
            write(dir.path(), &sample(&format!("crash-{i:013}-0000"), 1)).unwrap();
        }
        let ids = ids(dir.path());
        assert_eq!(ids.len(), 10);
        assert!(!ids.contains(&"crash-0000000000000-0000".to_string()));
        assert!(!dir.path().join("crash-0000000000000-0000.dmp").exists());
        assert_eq!(ids[0], "crash-0000000000010-0000");
    }

    #[test]
    fn mark_seen_rejects_path_like_ids() {
        let dir = tempdir().unwrap();
        assert!(mark_seen(dir.path(), "../vault").is_err());
        assert!(mark_seen(dir.path(), "crash-../../x").is_err());
    }

    #[test]
    fn crashes_dir_sits_beside_the_vault() {
        assert_eq!(
            crashes_dir().parent(),
            crate::vault::fallback_vault_path().parent()
        );
    }

    #[test]
    fn short_report_url_round_trips() {
        let r = sample("crash-0000000000001-0000", 3);
        let url = issue_url(&r);
        assert!(url.starts_with("https://github.com/2fau/2fau-app/issues/new?labels=crash&title="));
        let (head, body_enc) = url.split_once("&body=").unwrap();
        assert!(decode(head).ends_with("title=Crash: boom & bust"));
        assert_eq!(decode(body_enc), view(&r).text);
    }

    #[test]
    fn long_report_is_truncated_at_a_frame_boundary() {
        let r = sample("crash-0000000000001-0000", 500);
        let url = issue_url(&r);
        assert!(url.len() <= MAX_URL_BYTES, "{}", url.len());
        let body = decode(url.split_once("&body=").unwrap().1);
        assert!(body.contains(TRUNCATED_NOTE));
        // The line before the note closes a whole frame (an `at` line).
        let before = body
            .lines()
            .take_while(|l| !l.contains("truncated"))
            .last()
            .unwrap();
        assert!(before.trim_start().starts_with("at "), "{before}");
        // Copy text is untouched.
        assert!(view(&r).text.contains("function_499"));
    }

    #[test]
    fn dump_is_named_but_never_in_the_url() {
        let mut r = sample("crash-0000000000001-0000", 3);
        r.dump = Some("crash-0000000000001-0000.dmp".into());
        let text = view(&r).text;
        assert!(text.contains("crash-0000000000001-0000.dmp") && text.contains("don't attach"));
        let body = decode(issue_url(&r).split_once("&body=").unwrap().1);
        assert_eq!(body, text);
    }

    #[test]
    fn guard_survives_a_panic_and_keeps_going() {
        let mut passes = 0;
        for i in 0..2 {
            guard(|| {
                passes += 1;
                if i == 0 {
                    panic!("first pass");
                }
            });
        }
        assert_eq!(passes, 2);
    }

    #[test]
    fn hook_records_background_thread_panic_without_secrets() {
        use crate::vault::AppVault;
        const SECRET: &str = "JBSWY3DPEHPK3PXP";
        const LABEL: &str = "SecretLabelXyz";

        let dir = tempdir().unwrap();
        install_hook(dir.path().to_path_buf());

        // An unlocked vault holding a known secret is in scope during the panic.
        let vdir = tempdir().unwrap();
        let vault = AppVault::new(vdir.path().join("vault.dat"));
        vault.unlock("correct-horse-battery".into(), false).unwrap();
        vault
            .add_uri(&format!(
                "otpauth://totp/Acme:{LABEL}?secret={SECRET}&issuer=Acme"
            ))
            .unwrap();

        let joined = std::thread::Builder::new()
            .name("crash-test".into())
            .spawn(move || {
                let _keep = &vault;
                panic!("deliberate test panic");
            })
            .unwrap()
            .join();
        assert!(joined.is_err());

        let report = list(dir.path())
            .into_iter()
            .find(|r| r.thread == "crash-test")
            .expect("report for the panicking thread");
        assert_eq!(report.message, "deliberate test panic");
        assert!(report.location.contains("crash.rs"));
        assert!(!report.backtrace.is_empty());
        let json = std::fs::read_to_string(path_for(dir.path(), &report.id)).unwrap();
        assert!(!json.contains(SECRET) && !json.contains(LABEL));
    }
}
