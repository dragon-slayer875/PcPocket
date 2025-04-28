use crate::logger::init_logger;
use database_cmds::bookmark_insert;
use models::BookmarkNew;
use tauri::async_runtime::spawn;
use tauri::Manager;
use time::OffsetDateTime;
use url::Url;
use utils::{capture_ctrl_c, watch_config};

mod commands;
mod custom_parsers;
mod database_cmds;
mod logger;
mod models;
mod parser_errors;
mod runtime;
mod schema;
mod setup;
mod structs;
mod tray;
mod utils;

#[cfg(target_os = "macos")]
mod dock;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();
    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
                if args.len() > 0 {
                    let arg = args[1].to_string();
                    if arg.starts_with("pcpocket://") {
                        let app_handle = app.app_handle().clone();
                        let url = Url::parse(&arg).unwrap();
                        let title = url
                            .query_pairs()
                            .find(|(key, _)| key == "title")
                            .map(|(_, value)| value.to_string())
                            .unwrap_or_default();
                        let link = url
                            .query_pairs()
                            .find(|(key, _)| key == "link")
                            .map(|(_, value)| value.to_string())
                            .unwrap_or_default();
                        let icon_link = url
                            .query_pairs()
                            .find(|(key, _)| key == "icon_link")
                            .map(|(_, value)| value.to_string())
                            .unwrap_or_default();
                        let tags = url
                            .query_pairs()
                            .find(|(key, _)| key == "tags")
                            .map(|(_, value)| value.to_string())
                            .unwrap_or_default();
                        let tags: Vec<String> = tags.split(',').map(|s| s.to_string()).collect();
                        let bookmark = BookmarkNew {
                            title: Some(title),
                            link,
                            icon_link: Some(icon_link),
                            created_at: OffsetDateTime::now_utc().unix_timestamp(),
                        };
                        bookmark_insert(app_handle, bookmark, tags);
                    }
                }
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
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let log_path = app.path().app_config_dir().unwrap().join("log.txt");
            init_logger(log_path.to_str().unwrap(), false);
            spawn(setup::setup_tasks(app.handle().clone()));
            let config_path = app.path().app_config_dir().unwrap().join("config.json");
            spawn(capture_ctrl_c(app.handle().clone()));
            spawn(watch_config(config_path, app.handle().clone()));
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_db_path,
            commands::create_db,
            commands::open_db,
            commands::get_bookmarks,
            commands::get_all_tags,
            commands::import_bookmarks,
            commands::list_all_custom_parsers,
            commands::list_supported_parsers,
            commands::add_custom_parser,
            database_cmds::bookmark_insert,
            database_cmds::bookmark_update,
            database_cmds::bookmark_delete,
            database_cmds::tags_update,
            database_cmds::batch_delete,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(runtime::on_run_event);
}
