pub mod bridge;
pub mod vault;

use std::sync::Arc;

use bridge::{BridgeController, BridgeStatus};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State, WindowEvent,
};
use tauri_plugin_positioner::{Position, WindowExt};
use twofau_core::Account;
use vault::{fallback_vault_path, AppVault};

#[tauri::command]
fn is_locked(vault: State<Arc<AppVault>>) -> bool {
    vault.is_locked()
}

#[tauri::command]
fn try_auto_unlock(vault: State<Arc<AppVault>>) -> bool {
    vault.try_auto_unlock()
}

#[tauri::command]
fn has_vault(vault: State<Arc<AppVault>>) -> bool {
    vault.has_vault()
}

#[tauri::command]
fn unlock(vault: State<Arc<AppVault>>, passphrase: String, remember: bool) -> Result<(), String> {
    vault.unlock(passphrase, remember)
}

#[tauri::command]
fn list_accounts(vault: State<Arc<AppVault>>) -> Result<Vec<Account>, String> {
    vault.list()
}

#[tauri::command]
fn code(vault: State<Arc<AppVault>>, id: String, unix_ms: u64) -> Result<String, String> {
    vault.code(&id, unix_ms)
}

#[tauri::command]
fn add_uri(vault: State<Arc<AppVault>>, uri: String) -> Result<Account, String> {
    vault.add_uri(&uri)
}

#[tauri::command]
fn add_manual(
    vault: State<Arc<AppVault>>,
    issuer: String,
    label: String,
    secret_base32: String,
    kind: String,
) -> Result<Account, String> {
    vault.add_manual(issuer, label, secret_base32, kind)
}

#[tauri::command]
fn update_account(vault: State<Arc<AppVault>>, account: Account) -> Result<(), String> {
    vault.update(account)
}

#[tauri::command]
fn remove_account(vault: State<Arc<AppVault>>, id: String) -> Result<(), String> {
    vault.remove(&id)
}

#[tauri::command]
fn advance_hotp(vault: State<Arc<AppVault>>, id: String) -> Result<(), String> {
    vault.advance_hotp(&id)
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
            let vault = Arc::new(AppVault::new(vault_path));
            app.manage(vault.clone());

            let bridge = BridgeController::new(vault, bridge_state_path);
            // Resume the last enabled/port choice across restarts.
            let status = bridge.status();
            if status.enabled {
                let _ = bridge.enable(true, status.port);
            }
            app.manage(bridge);

            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit 2FAu", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit_item])?;

            TrayIconBuilder::new()
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
                    _ => {}
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
            list_accounts,
            code,
            add_uri,
            add_manual,
            update_account,
            remove_account,
            advance_hotp,
            bridge_status,
            bridge_enable,
            bridge_pairing_code,
            bridge_revoke,
            quit,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
