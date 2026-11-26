// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use twofau_app_lib::native;

fn main() {
    let mut args = std::env::args_os().skip(1);
    match args.next() {
        // The crash monitor is this binary re-launched; it must not start Tauri.
        Some(flag) if flag == native::MONITOR_FLAG => {
            if let Some(socket) = args.next() {
                native::run_monitor(std::path::Path::new(&socket));
            }
        }
        #[cfg(debug_assertions)]
        Some(flag) if flag == "--crash-selftest" => native::selftest(),
        _ => twofau_app_lib::run(),
    }
}
