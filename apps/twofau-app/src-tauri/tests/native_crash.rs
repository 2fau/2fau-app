//! End-to-end: the debug binary's `--crash-selftest` starts the crash monitor
//! and segfaults; the monitor must leave a minidump and a readable report.
#![cfg(debug_assertions)]

use std::time::{Duration, Instant};

#[test]
// The x86_64 toolchain on Apple Silicon runs this under Rosetta, where dumps
// come out empty; run with `--target aarch64-apple-darwin` there.
#[cfg_attr(
    all(target_os = "macos", target_arch = "x86_64"),
    ignore = "Rosetta cannot dump translated threads"
)]
fn segfault_leaves_a_minidump_and_a_named_report() {
    let dir = tempfile::tempdir().unwrap();
    let status = std::process::Command::new(env!("CARGO_BIN_EXE_twofau-app"))
        .arg("--crash-selftest")
        .env("TWOFAU_CRASH_DIR", dir.path())
        .status()
        .unwrap();
    assert!(!status.success(), "self-test should crash");

    // The monitor finishes walking the dump after the app has died.
    let deadline = Instant::now() + Duration::from_secs(60);
    let report = loop {
        let json = std::fs::read_dir(dir.path())
            .unwrap()
            .flatten()
            .map(|e| e.path())
            .find(|p| p.extension().is_some_and(|x| x == "json"));
        if let Some(p) = json {
            let v: serde_json::Value = serde_json::from_slice(&std::fs::read(p).unwrap()).unwrap();
            break v;
        }
        assert!(Instant::now() < deadline, "no crash report written");
        std::thread::sleep(Duration::from_millis(200));
    };

    let message = report["message"].as_str().unwrap();
    assert!(
        [
            "EXC_BAD_ACCESS",
            "SIGSEGV",
            "SIGBUS",
            "EXCEPTION_ACCESS_VIOLATION"
        ]
        .iter()
        .any(|r| message.contains(r)),
        "{message}"
    );
    let backtrace = report["backtrace"].as_str().unwrap();
    assert!(backtrace.contains("crash_selftest_fault"), "{backtrace}");
    let dump = report["dump"].as_str().unwrap();
    let dump = dir.path().join(dump);
    assert!(dump.exists());
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = |p: &std::path::Path| std::fs::metadata(p).unwrap().permissions().mode() & 0o777;
        assert_eq!(mode(&dump), 0o600, "dump must be owner-only");
        assert_eq!(mode(dir.path()), 0o700, "crashes dir must be owner-only");
    }
}
