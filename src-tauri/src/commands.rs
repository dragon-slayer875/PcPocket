use std::fs;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt;

pub fn save_db(app_handle: &AppHandle) {
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
