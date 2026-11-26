//! Native crashes (segfault, illegal instruction, abort, Windows exceptions)
//! never reach the panic hook. The app re-launches its own binary as a small
//! crash monitor; on a crash the monitor writes a minidump, walks its stack and
//! saves an ordinary crash report beside it, so the same dialog shows it on the
//! next launch.
//!
//! The crashed process only asks the monitor for the dump — no file I/O or
//! stack walking in a broken process. (On macOS the callback even runs on a
//! separate exception thread, so an in-process trace would show the wrong
//! stack; the dump holds the real crashed thread.)
//!
//! Known limit: an x86_64 build running under Rosetta gets an empty dump —
//! `thread_get_state` fails for translated processes — so no native report.
//! Native arm64 and Intel builds work.

use std::ffi::c_void;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicBool;
use std::sync::Mutex;
use std::time::Duration;

use minidump::Module;
use minidumper::{Client, LoopAction, MinidumpBinary, Server, ServerHandler, SocketName};

use crate::crash::{self, CrashReport};

pub const MONITOR_FLAG: &str = "--crash-monitor";
/// Message carrying the app's runtime address of `anchor()` (8 bytes, LE).
const ANCHOR_MSG: u32 = 1;

/// A fixed function whose runtime address lets the monitor — the same binary,
/// loaded at a different ASLR slide — map the app's frame addresses onto its
/// own image and name them.
#[inline(never)]
fn anchor() -> u64 {
    anchor as fn() -> u64 as usize as u64
}

fn socket_path(pid: u32) -> PathBuf {
    // Short path: macOS caps Unix socket paths at 104 bytes.
    std::env::temp_dir().join(format!("2fau-crash-{pid}.sock"))
}

/// Start the monitor and attach the crash handler. Best-effort: any failure
/// leaves the app running without native crash capture (panics still work).
pub fn start() {
    let _ = try_start();
}

fn try_start() -> Option<()> {
    let socket = socket_path(std::process::id());
    let _ = std::fs::remove_file(&socket);
    let mut child = std::process::Command::new(std::env::current_exe().ok()?)
        .arg(MONITOR_FLAG)
        .arg(&socket)
        .spawn()
        .ok()?;

    let client = (0..50).find_map(|_| {
        Client::with_name(SocketName::Path(&socket))
            .map_err(|_| std::thread::sleep(Duration::from_millis(20)))
            .ok()
    });
    let Some(client) = client else {
        let _ = child.kill();
        let _ = child.wait();
        return None;
    };
    client
        .send_message(ANCHOR_MSG, anchor().to_le_bytes())
        .ok()?;
    // Round trip so the anchor is processed before any crash can arrive (on
    // macOS crash requests travel a different channel than messages).
    client.ping().ok()?;

    #[allow(unsafe_code)]
    let handler = crash_handler::CrashHandler::attach(unsafe {
        crash_handler::make_crash_event(move |ctx: &crash_handler::CrashContext| {
            if !crash::panicking() {
                let _ = client.request_dump(ctx);
            }
            // Always fall through to the default action so the process dies
            // (and the OS crash reporter still runs) — never resume a fault.
            crash_handler::CrashEventResult::Handled(false)
        })
    })
    .ok()?;
    #[cfg(target_os = "linux")]
    let _ = handler.set_ptracer(Some(child.id()));
    // Detaches on drop; it must live as long as the process.
    std::mem::forget(handler);
    // Reap the monitor when it exits so it doesn't linger as a zombie.
    std::thread::spawn(move || child.wait());
    Some(())
}

/// The monitor process: serve one app until it disconnects or crashes.
pub fn run_monitor(socket: &Path) {
    let Ok(mut server) = Server::with_name(SocketName::Path(socket)) else {
        return;
    };
    let handler = Monitor {
        dir: crash::crashes_dir(),
        anchor: Mutex::new(None),
        id: Mutex::new(None),
    };
    let _ = server.run(Box::new(handler), &AtomicBool::new(false), None);
    let _ = std::fs::remove_file(socket);
}

struct Monitor {
    dir: PathBuf,
    anchor: Mutex<Option<u64>>,
    id: Mutex<Option<String>>,
}

impl Monitor {
    fn save_report(&self, dump: &Path, id: String) {
        let anchor = *self.anchor.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(report) = report_from_dump(dump, id, anchor) {
            let _ = crash::write(&self.dir, &report);
        }
    }
}

impl ServerHandler for Monitor {
    fn create_minidump_file(&self) -> std::io::Result<(std::fs::File, PathBuf)> {
        // Dumps can hold memory contents (secrets): owner-only on Unix. Windows
        // relies on the per-user ACL of the app data dir.
        let mut dir = std::fs::DirBuilder::new();
        let mut file = std::fs::OpenOptions::new();
        file.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::{DirBuilderExt, OpenOptionsExt};
            dir.mode(0o700);
            file.mode(0o600);
        }
        dir.recursive(true).create(&self.dir)?;
        #[cfg(unix)]
        {
            // `mode` only applies to a newly created dir; tighten an existing one.
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&self.dir, std::fs::Permissions::from_mode(0o700))?;
        }
        let id = crash::new_id(crash::now_ms());
        let path = self.dir.join(format!("{id}.dmp"));
        *self.id.lock().unwrap_or_else(|e| e.into_inner()) = Some(id);
        Ok((file.open(&path)?, path))
    }

    fn on_minidump_created(&self, result: Result<MinidumpBinary, minidumper::Error>) -> LoopAction {
        let id = self.id.lock().unwrap_or_else(|e| e.into_inner()).take();
        if let (Ok(mut bin), Some(id)) = (result, id) {
            use std::io::Write;
            let _ = bin.file.flush();
            self.save_report(&bin.path, id);
        }
        LoopAction::Exit
    }

    fn on_message(&self, kind: u32, buffer: Vec<u8>) {
        if let (ANCHOR_MSG, Ok(bytes)) = (kind, <[u8; 8]>::try_from(buffer.as_slice())) {
            *self.anchor.lock().unwrap_or_else(|e| e.into_inner()) =
                Some(u64::from_le_bytes(bytes));
        }
    }

    fn on_client_disconnected(&self, num_clients: usize) -> LoopAction {
        if num_clients == 0 {
            LoopAction::Exit
        } else {
            LoopAction::Continue
        }
    }
}

/// Walk the dump's crashed thread (frame pointers / stack scanning — we ship
/// no symbol files) and turn it into a report.
fn report_from_dump(path: &Path, id: String, app_anchor: Option<u64>) -> Option<CrashReport> {
    let dump = minidump::Minidump::read_path(path).ok()?;
    let symbols =
        minidump_unwind::Symbolizer::new(minidump_unwind::simple_symbol_supplier(Vec::new()));
    let state =
        futures_executor::block_on(minidump_processor::process_minidump(&dump, &symbols)).ok()?;
    let stack = state.threads.get(state.requesting_thread.unwrap_or(0))?;

    let exe = std::env::current_exe().ok();
    let exe_name = exe.as_deref().and_then(Path::file_name);
    let frames: Vec<String> = stack
        .frames
        .iter()
        .enumerate()
        .map(|(i, f)| {
            let module = f.module.as_ref().map(|m| {
                let file = m.code_file();
                let name = Path::new(file.as_ref())
                    .file_name()
                    .map(|n| n.to_string_lossy().into_owned())
                    .unwrap_or_else(|| file.into_owned());
                (name, m.base_address())
            });
            let own = module
                .as_ref()
                .is_some_and(|(n, _)| Some(std::ffi::OsStr::new(n)) == exe_name);
            describe(
                i,
                f.instruction,
                module,
                own.then_some(app_anchor).flatten(),
            )
        })
        .collect();

    let message = match &state.exception_info {
        Some(e) => format!("{} at {}", e.reason, e.address),
        None => "native crash".to_string(),
    };
    // Location: the first frame we could name (our code), else the top frame.
    let first_line = |f: &String| {
        let line = f.lines().next().unwrap_or("").trim();
        line.split_once(": ")
            .map_or(line, |(_, rest)| rest)
            .to_string()
    };
    let location = frames
        .iter()
        .find(|f| !first_line(f).contains(" + 0x") && !first_line(f).starts_with("0x"))
        .or(frames.first())
        .map(first_line)
        .unwrap_or_default();

    Some(CrashReport {
        dump: path.file_name().map(|n| n.to_string_lossy().into_owned()),
        thread: stack
            .thread_name
            .clone()
            .unwrap_or_else(|| format!("thread {}", stack.thread_id)),
        id,
        time_ms: crash::now_ms(),
        version: env!("CARGO_PKG_VERSION").into(),
        os: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
        message,
        location,
        backtrace: frames.join("\n"),
        seen: false,
    })
}

/// Map an app address onto this process's copy of the same binary.
fn to_local(addr: u64, app_anchor: u64) -> u64 {
    anchor().wrapping_add(addr.wrapping_sub(app_anchor))
}

/// One frame in `std::backtrace` style (`  N: name` + `at file:line`), so the
/// issue-URL truncation cuts native and panic traces the same way.
fn describe(i: usize, addr: u64, module: Option<(String, u64)>, app_anchor: Option<u64>) -> String {
    if let Some(anchor) = app_anchor {
        // One address can resolve to several (inlined) functions, innermost
        // first; list them all like std does, numbering only the first.
        let mut out = String::new();
        backtrace::resolve(to_local(addr, anchor) as *mut c_void, |sym| {
            if let Some(name) = sym.name() {
                if out.is_empty() {
                    out = format!("{i:4}: {name:#}");
                } else {
                    out.push_str(&format!("\n      {name:#}"));
                }
                if let (Some(file), Some(no)) = (sym.filename(), sym.lineno()) {
                    out.push_str(&format!("\n             at {}:{no}", file.display()));
                }
            }
        });
        if !out.is_empty() {
            return out;
        }
    }
    match module {
        Some((name, base)) => format!("{i:4}: {name} + {:#x}", addr.wrapping_sub(base)),
        None => format!("{i:4}: {addr:#x}"),
    }
}

/// Debug-only: start the monitor and segfault, for the integration test.
#[cfg(debug_assertions)]
pub fn selftest() -> ! {
    start();
    crash_selftest_fault();
    unreachable!("the self-test fault returned");
}

#[cfg(debug_assertions)]
#[inline(never)]
fn crash_selftest_fault() {
    #[allow(unsafe_code)]
    // SAFETY: none — this deliberately faults to exercise the crash monitor.
    unsafe {
        std::ptr::without_provenance_mut::<u32>(8).write_volatile(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[inline(never)]
    fn some_named_function() -> u64 {
        some_named_function as fn() -> u64 as usize as u64
    }

    #[test]
    fn own_frames_are_named_through_the_anchor() {
        // Pretend the app was loaded 0x10000 higher than us.
        let slide = 0x10000;
        let app_addr = some_named_function() + 1 + slide;
        let line = describe(
            3,
            app_addr,
            Some(("twofau-app".into(), 0)),
            Some(anchor() + slide),
        );
        assert!(line.starts_with("   3: "), "{line}");
        assert!(line.contains("some_named_function"), "{line}");
    }

    #[test]
    fn foreign_frames_print_module_and_offset() {
        let line = describe(
            0,
            0x1234,
            Some(("libsystem_kernel.dylib".into(), 0x1000)),
            None,
        );
        assert_eq!(line, "   0: libsystem_kernel.dylib + 0x234");
        assert_eq!(describe(1, 0xdead, None, None), "   1: 0xdead");
    }
}
