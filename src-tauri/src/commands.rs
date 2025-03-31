use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub fn save_db(app_handle: AppHandle) {
    let local_db_path = app_handle
        .path()
        .app_config_dir()
        .unwrap()
        .join("bookmarks.tmp");

    let stored_db_path = app_handle
        .store("config.json")
        .unwrap()
        .get("dbPath")
        .unwrap();
    let user_db_path = stored_db_path.as_str().unwrap();

    if user_db_path.is_empty() {
        return;
    }

    let result = fs::copy(local_db_path, user_db_path);
    match result {
        Ok(_) => {
            app_handle
                .notification()
                .builder()
                .title("PcPocket")
                .body("Database saved")
                .show()
                .unwrap();
        }
        Err(e) => {
            app_handle
                .notification()
                .builder()
                .title("PcPocket")
                .body(format!("Error saving database: {}", e))
                .show()
                .unwrap();
        }
    }
}

#[tauri::command]
pub fn open_main_window(app_handle: &AppHandle) {
    #[cfg(target_os = "macos")]
    {
        crate::dock::set_dock_visible(true);
    }
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().unwrap();
        window.set_focus().unwrap();
    } else {
        let open_url;
        if app_handle
            .store("config.json")
            .unwrap()
            .get("dbPath")
            .unwrap()
            .is_string()
        {
            open_url = "main";
        } else {
            open_url = "/";
        }
        let url = tauri::WebviewUrl::App(PathBuf::from_str(open_url).unwrap());
        tauri::WebviewWindowBuilder::new(app_handle, "main", url)
            .title("PcPocket")
            .inner_size(800.0, 600.0)
            .center()
            .visible(true)
            .build()
            .unwrap();
    }
}
