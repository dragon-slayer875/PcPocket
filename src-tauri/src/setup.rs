use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

use crate::custom_parsers::{BrowserJsonParser, Parser, ParserRegistry, PythonParser};
use crate::database_cmds;
use crate::utils::{read_app_data_storage, send_notification};
use crate::{database_cmds::DbPool, tray};

#[derive(Serialize, Debug, Clone, Deserialize)]
pub struct ParserConfig {
    pub name: String,
    pub r#type: String,
    pub path: String,
    pub supported_formats: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppDataStorage {
    pub db_path: String,
    pub custom_parsers: Vec<ParserConfig>,
    // Add other serializable fields here
}

pub struct AppData {
    pub db_pool: DbPool,
    pub db_path: String,
    pub custom_parsers: Vec<ParserConfig>,
}

impl AppData {
    // Create from storage format + a DbPool
    pub fn from_storage(storage: AppDataStorage) -> Self {
        AppData {
            db_pool: database_cmds::establish_connection_pool(&storage.db_path),
            db_path: storage.db_path,
            custom_parsers: storage.custom_parsers,
        }
    }

    // Convert to storage format (dropping the DbPool)
    pub fn to_storage(&self) -> AppDataStorage {
        AppDataStorage {
            db_path: self.db_path.clone(),
            custom_parsers: self.custom_parsers.clone(),
        }
    }
}

impl Default for AppDataStorage {
    fn default() -> Self {
        AppDataStorage {
            db_path: "".to_string(),
            custom_parsers: vec![],
        }
    }
}

pub async fn setup_tasks(app: AppHandle) -> Result<(), ()> {
    use tauri_plugin_notification::NotificationExt;
    let permission_state = app.notification().permission_state().unwrap();
    if permission_state != tauri_plugin_notification::PermissionState::Granted {
        let _ = app.notification().request_permission();
    }

    let config_path = app.path().app_data_dir().unwrap().join("config.json");

    let app_data_storage = read_app_data_storage(&config_path);
    app.manage(Mutex::new(AppData::from_storage(app_data_storage.clone())));

    if !app_data_storage.db_path.is_empty() {
        app.get_webview_window("main")
            .unwrap()
            .eval("window.location.replace('main/bookmarks')")
            .unwrap();
    }

    tray::create_tray(&app).unwrap();

    #[cfg(any(windows, target_os = "linux"))]
    app.deep_link().register_all().unwrap();

    // Create and initialize parser registry
    let mut registry = ParserRegistry::new();

    // // Load default parsers
    // registry.register("html".to_string(), Box::new(BrowserHtmlParser::new()));
    let default_browser_json_parser = BrowserJsonParser::new();
    registry.register(
        default_browser_json_parser.name().to_string(),
        Box::new(default_browser_json_parser),
    );

    for parser_info in &app_data_storage.custom_parsers {
        match parser_info.r#type.as_str() {
            "python" => match PythonParser::new(
                &parser_info.path,
                &parser_info.name,
                &parser_info.supported_formats,
            ) {
                Ok(parser) => {
                    println!("Loaded Python parser: {}", parser_info.name);
                    registry
                        .register(parser_info.name.clone(), Box::new(parser))
                        .unwrap();
                }
                Err(e) => {
                    eprintln!(
                        "Failed to load Python parser from {}: {}",
                        parser_info.path, e
                    );
                    send_notification(
                        &app,
                        "Parser Error",
                        &format!("Failed to load Lua parser from {}: {}", parser_info.path, e),
                    );
                }
            },
            _ => {
                eprintln!("Unknown parser type: {}", parser_info.r#type);
            }
        }
    }

    app.manage(Mutex::new(registry));

    Ok(())
}
