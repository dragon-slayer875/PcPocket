use std::fs;
use std::path::Path;
use tauri::AppHandle;
use tauri::Manager;
use tauri::WindowEvent;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_store::StoreExt;

fn save_db(app_handle: &AppHandle) {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE bookmarks_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  icon_link TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
            CREATE TABLE tags_table (
  bookmark_id INTEGER NOT NULL,
  tag_name TEXT NOT NULL,
  PRIMARY KEY (bookmark_id, tag_name),
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks_table(id) ON DELETE CASCADE
);",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:bookmarks.tmp", migrations)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            use tauri_plugin_notification::NotificationExt;
            let permission_state = app.notification().permission_state().unwrap();
            if permission_state != tauri_plugin_notification::PermissionState::Granted {
                let _ = app.notification().request_permission();
            }
            let config_path = app.path().app_data_dir().unwrap().join("config.json");

            if Path::new(&config_path).try_exists().unwrap() {
                app.get_webview_window("main")
                    .unwrap()
                    .eval("window.location.replace('main')")?;
            } else {
                let store = app.store("config.json")?;
                store.set("dbPath", "");
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .on_window_event(|_window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                let app_handle = _window.app_handle();
                api.prevent_close();
                save_db(app_handle);
                std::process::exit(0);
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
