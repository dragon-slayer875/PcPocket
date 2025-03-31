use std::path::Path;
use tauri::Manager;
use tauri::WindowEvent;
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_store::StoreExt;

mod commands;
mod runtime;
mod tray;

#[cfg(target_os = "macos")]
mod dock;

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

    let mut builder = tauri::Builder::default();
    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
                commands::open_main_window(app);
            }))
            .setup(|app| {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;

                let _ = app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--minimized"]),
                ));

                // Get the autostart manager
                let autostart_manager = app.autolaunch();
                // Enable autostart
                let _ = autostart_manager.enable();
                // Check enable state
                println!(
                    "registered for autostart? {}",
                    autostart_manager.is_enabled().unwrap()
                );
                // Disable autostart
                let _ = autostart_manager.disable();

                Ok(())
            })
    }
    builder
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
        .plugin(tauri_plugin_deep_link::init())
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

            tray::create_tray(&app.handle())?;

            #[cfg(any(windows, target_os = "linux"))]
            app.deep_link().register_all()?;

            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![commands::save_db])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(runtime::on_run_event);
}
