pub mod bridge;
pub mod time_sync;
pub mod vault;

use std::sync::Arc;

use bridge::{BridgeController, BridgeStatus};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State, WindowEvent,
};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_positioner::{Position, WindowExt};
use time_sync::TimeSync;
use twofau_core::{Account, ParsedOtp};
use vault::{fallback_vault_path, AppVault};

/// Tray menu id for looking it up to rebuild after the vault changes.
const TRAY_ID: &str = "main";
/// How many recent accounts to surface in the tray's quick-copy section.
const TRAY_RECENT: usize = 5;

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Build the tray context menu: Show, then up to `TRAY_RECENT` quick-copy
/// accounts (only while unlocked), then Quit.
fn build_tray_menu<M: Manager<tauri::Wry>>(
    manager: &M,
    vault: &AppVault,
) -> tauri::Result<Menu<tauri::Wry>> {
    let show = MenuItem::with_id(manager, "show", "Show", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(manager, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::new(manager)?;
    menu.append(&show)?;

    let recent = vault.recent(TRAY_RECENT);
    if !recent.is_empty() {
        menu.append(&PredefinedMenuItem::separator(manager)?)?;
        for a in &recent {
            let title = if a.issuer.is_empty() {
                &a.label
            } else {
                &a.issuer
            };
            let item =
                MenuItem::with_id(manager, format!("otp:{}", a.id), title, true, None::<&str>)?;
            menu.append(&item)?;
        }
    }

    menu.append(&PredefinedMenuItem::separator(manager)?)?;
    menu.append(&quit_item)?;
    Ok(menu)
}

/// Rebuild the tray menu to reflect the current vault. macOS menu mutations must
/// happen on the main thread, so this hops there; it is a no-op if the tray or
/// vault state has gone away.
fn refresh_tray(handle: &AppHandle) {
    let app = handle.clone();
    let _ = handle.run_on_main_thread(move || {
        let vault = app.state::<Arc<AppVault>>().inner().clone();
        if let (Ok(menu), Some(tray)) = (build_tray_menu(&app, &vault), app.tray_by_id(TRAY_ID)) {
            let _ = tray.set_menu(Some(menu));
        }
    });
}

/// Compute an account's current code and put it on the clipboard. Uses the
/// network-corrected time so a wrong machine clock doesn't copy a stale code.
fn copy_code(app: &AppHandle, id: &str) {
    let vault = app.state::<Arc<AppVault>>();
    let offset = app.state::<Arc<TimeSync>>().offset_ms();
    let now = (now_ms() as i64 + offset).max(0) as u64;
    if let Ok(code) = vault.code(id, now) {
        let _ = app.clipboard().write_text(code);
    }
}

#[tauri::command]
fn is_locked(vault: State<Arc<AppVault>>) -> bool {
    vault.is_locked()
}

// Off the main thread: try_auto_unlock derives the key (600k PBKDF2 rounds,
// ~1s), which would otherwise freeze the webview. A JoinError only happens if
// the blocking task panics — treat that as "couldn't unlock".
#[tauri::command]
async fn try_auto_unlock(app: AppHandle, vault: State<'_, Arc<AppVault>>) -> Result<bool, String> {
    let v = vault.inner().clone();
    let ok = tauri::async_runtime::spawn_blocking(move || v.try_auto_unlock())
        .await
        .unwrap_or(false);
    if ok {
        refresh_tray(&app);
    }
    Ok(ok)
}

#[tauri::command]
fn has_vault(vault: State<Arc<AppVault>>) -> bool {
    vault.has_vault()
}

#[tauri::command]
async fn unlock(
    app: AppHandle,
    vault: State<'_, Arc<AppVault>>,
    passphrase: String,
    remember: bool,
) -> Result<(), String> {
    let v = vault.inner().clone();
    tauri::async_runtime::spawn_blocking(move || v.unlock(passphrase, remember))
        .await
        .map_err(|e| e.to_string())??;
    refresh_tray(&app);
    Ok(())
}

#[tauri::command]
fn lock(app: AppHandle, vault: State<Arc<AppVault>>) {
    vault.lock();
    refresh_tray(&app);
}

#[tauri::command]
fn list_accounts(vault: State<Arc<AppVault>>) -> Result<Vec<Account>, String> {
    vault.list()
}

/// Save the encrypted vault to a file the user picks. Returns false if they
/// cancel the dialog. The blob is sealed with the current passphrase.
// `async` so Tauri runs these off the main thread — the blocking file dialog
// deadlocks the event loop if invoked on it (macOS).
#[tauri::command]
async fn export_vault(app: AppHandle, vault: State<'_, Arc<AppVault>>) -> Result<bool, String> {
    let blob = vault.export_blob()?;
    let Some(path) = app
        .dialog()
        .file()
        .set_file_name("2fau-vault.dat")
        .add_filter("2FAU vault", &["dat"])
        .blocking_save_file()
    else {
        return Ok(false);
    };
    let path = path.into_path().map_err(|e| e.to_string())?;
    std::fs::write(&path, &blob).map_err(|e| e.to_string())?;
    Ok(true)
}

/// Pick an exported vault file and merge it in under `passphrase` (the one the
/// file was sealed with). Returns the resulting account count, or None if the
/// user cancels the file picker.
#[tauri::command]
async fn import_vault(
    app: AppHandle,
    vault: State<'_, Arc<AppVault>>,
    passphrase: String,
) -> Result<Option<usize>, String> {
    let Some(path) = app
        .dialog()
        .file()
        .add_filter("2FAU vault", &["dat"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    let path = path.into_path().map_err(|e| e.to_string())?;
    let blob = std::fs::read(&path).map_err(|e| e.to_string())?;
    let count = vault.import_blob(&blob, &passphrase)?;
    refresh_tray(&app);
    Ok(Some(count))
}

#[tauri::command]
async fn change_passphrase(
    vault: State<'_, Arc<AppVault>>,
    current: String,
    next: String,
) -> Result<(), String> {
    let v = vault.inner().clone();
    tauri::async_runtime::spawn_blocking(move || v.change_passphrase(&current, &next))
        .await
        .map_err(|e| e.to_string())?
}

/// Decode a Google Authenticator `otpauth-migration://` export into accounts.
/// Pure parsing — no vault access, so it works before unlock.
#[tauri::command]
fn parse_migration(uri: String) -> Result<Vec<ParsedOtp>, String> {
    twofau_core::parse_migration(&uri).map_err(|e| e.to_string())
}

#[tauri::command]
fn code(vault: State<Arc<AppVault>>, id: String, unix_ms: u64) -> Result<String, String> {
    vault.code(&id, unix_ms)
}

// Every write below re-seals the vault, which re-derives the key (600k PBKDF2
// rounds, ~1s). Run that on the blocking pool so the webview's main thread
// stays responsive instead of freezing on each save/delete/reorder.
#[tauri::command]
async fn add_uri(
    app: AppHandle,
    vault: State<'_, Arc<AppVault>>,
    uri: String,
) -> Result<Account, String> {
    let v = vault.inner().clone();
    let account = tauri::async_runtime::spawn_blocking(move || v.add_uri(&uri))
        .await
        .map_err(|e| e.to_string())??;
    refresh_tray(&app);
    Ok(account)
}

#[tauri::command]
async fn add_manual(
    app: AppHandle,
    vault: State<'_, Arc<AppVault>>,
    issuer: String,
    label: String,
    secret_base32: String,
    kind: String,
) -> Result<Account, String> {
    let v = vault.inner().clone();
    let account = tauri::async_runtime::spawn_blocking(move || {
        v.add_manual(issuer, label, secret_base32, kind)
    })
    .await
    .map_err(|e| e.to_string())??;
    refresh_tray(&app);
    Ok(account)
}

#[tauri::command]
async fn update_account(
    app: AppHandle,
    vault: State<'_, Arc<AppVault>>,
    account: Account,
) -> Result<(), String> {
    let v = vault.inner().clone();
    tauri::async_runtime::spawn_blocking(move || v.update(account))
        .await
        .map_err(|e| e.to_string())??;
    refresh_tray(&app);
    Ok(())
}

#[tauri::command]
async fn remove_account(
    app: AppHandle,
    vault: State<'_, Arc<AppVault>>,
    id: String,
) -> Result<(), String> {
    let v = vault.inner().clone();
    tauri::async_runtime::spawn_blocking(move || v.remove(&id))
        .await
        .map_err(|e| e.to_string())??;
    refresh_tray(&app);
    Ok(())
}

#[tauri::command]
async fn reorder(
    app: AppHandle,
    vault: State<'_, Arc<AppVault>>,
    ids: Vec<String>,
) -> Result<(), String> {
    let v = vault.inner().clone();
    tauri::async_runtime::spawn_blocking(move || v.reorder(&ids))
        .await
        .map_err(|e| e.to_string())??;
    refresh_tray(&app);
    Ok(())
}

#[tauri::command]
async fn advance_hotp(
    app: AppHandle,
    vault: State<'_, Arc<AppVault>>,
    id: String,
) -> Result<(), String> {
    let v = vault.inner().clone();
    tauri::async_runtime::spawn_blocking(move || v.advance_hotp(&id))
        .await
        .map_err(|e| e.to_string())??;
    refresh_tray(&app);
    Ok(())
}

#[tauri::command]
fn secret_uri(vault: State<Arc<AppVault>>, id: String) -> Result<String, String> {
    vault.secret_uri(&id)
}

/// The webview adds this to its local clock so displayed + copied codes match
/// the network-corrected time the tray uses.
#[tauri::command]
fn time_offset(time: State<Arc<TimeSync>>) -> i64 {
    time.offset_ms()
}

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

#[tauri::command]
fn quit(app: AppHandle) {
    app.exit(0);
}

/// Show the popup anchored at the tray, or hide it if already visible.
fn toggle_window(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        // TrayCenter flips per-OS: below a top macOS menu-bar tray, above a
        // bottom Windows/Linux taskbar tray. The *constrained* variant also
        // clamps to the monitor so the popup is never cut off at a screen edge.
        let _ = window.move_window_constrained(Position::TrayCenter);
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Menu-bar agent: no Dock icon on macOS.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Use this app's own data dir (keyed by the bundle identifier), NOT
            // the legacy Swift app's ~/Library/Application Support/2fau — the two
            // share a magic+version but differ after, so colliding paths make the
            // old blob unreadable here.
            let vault_path = app
                .path()
                .app_data_dir()
                .map(|dir| dir.join("vault.dat"))
                .unwrap_or_else(|_| fallback_vault_path());
            let bridge_state_path = vault_path.with_file_name("bridge-state.json");
            let time_path = vault_path.with_file_name("time-offset");
            let vault = Arc::new(AppVault::new(vault_path));
            app.manage(vault.clone());

            let bridge = BridgeController::new(vault.clone(), bridge_state_path);
            // Resume the last enabled/port choice across restarts.
            let status = bridge.status();
            if status.enabled {
                let _ = bridge.enable(true, status.port);
            }
            app.manage(bridge);

            // Network time correction: start from the last persisted offset, then
            // keep it fresh on a background thread (immediate first sync, then
            // every REFRESH). Failures are silent — we simply keep the last
            // known offset (or zero) until a sync succeeds.
            let time_sync = Arc::new(TimeSync::new(time_path));
            app.manage(time_sync.clone());
            std::thread::spawn(move || loop {
                let _ = time_sync.sync_once();
                std::thread::sleep(time_sync::REFRESH);
            });

            let menu = build_tray_menu(app, &vault)?;

            TrayIconBuilder::with_id(TRAY_ID)
                .icon(
                    app.default_window_icon()
                        .expect("bundled window icon")
                        .clone(),
                )
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => toggle_window(app),
                    "quit" => app.exit(0),
                    other => {
                        if let Some(id) = other.strip_prefix("otp:") {
                            copy_code(app, id);
                        }
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // Global summon: CmdOrCtrl+Shift+U shows/hides the popup from
            // anywhere. Registered in Rust (not via the JS/IPC ACL), so no
            // capability entry is needed. Interactive — GUI-verified, not covered
            // by cargo test.
            #[cfg(desktop)]
            app.global_shortcut()
                .on_shortcut("CmdOrCtrl+Shift+U", |app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // Dismiss the popup when it loses focus (menu-bar behaviour).
            if let WindowEvent::Focused(false) = event {
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            is_locked,
            try_auto_unlock,
            has_vault,
            unlock,
            lock,
            list_accounts,
            export_vault,
            import_vault,
            change_passphrase,
            parse_migration,
            code,
            add_uri,
            add_manual,
            update_account,
            remove_account,
            reorder,
            advance_hotp,
            secret_uri,
            time_offset,
            bridge_status,
            bridge_enable,
            bridge_pairing_code,
            bridge_revoke,
            quit,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
