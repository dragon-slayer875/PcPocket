use config::{Config, File};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::create_dir;
use std::fs::rename;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

use crate::custom_parsers::{BrowserJsonParser, Parser, ParserRegistry, PythonParser};
use crate::database_cmds;
use crate::utils::send_notification;
use crate::{database_cmds::DbPool, tray};

#[derive(Serialize, Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
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

impl AppDataStorage {
    pub fn from_file_hashmap(storage: HashMap<String, serde_json::Value>) -> Self {
        let db_path = storage
            .get("db_path")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let custom_parsers = storage
            .get("custom_parsers")
            .and_then(|v| v.as_array())
            .map(|v| {
                v.iter()
                    .filter_map(|p| serde_json::from_value(p.clone()).ok())
                    .collect()
            });

        AppDataStorage {
            db_path,
            custom_parsers: custom_parsers.unwrap_or_default(),
        }
    }
}

#[derive(Debug, Clone)]
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

fn load_app_config(app: &AppHandle) -> AppDataStorage {
    let config_dir = app.path().app_config_dir().unwrap();

    if !PathBuf::new().join(&config_dir).exists() {
        create_dir(&config_dir).ok();
    }

    let default_config_path = app.path().app_data_dir().unwrap().join("default.json");
    let config_path = app.path().app_config_dir().unwrap().join("config.json");

    if !default_config_path.exists() {
        let default_config = AppDataStorage::default();
        let json_content = serde_json::to_string_pretty(&default_config).unwrap();
        std::fs::write(&default_config_path, json_content).unwrap();
    }

    let config = match Config::builder()
        .add_source(File::with_name(default_config_path.to_str().unwrap()))
        .add_source(File::with_name(config_path.to_str().unwrap()).required(false))
        .build()
    {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Failed to load config: {}", e);
            send_notification(app, "Config Error", e.to_string().as_str()).unwrap_or_default();
            Config::builder()
                .add_source(File::with_name(default_config_path.to_str().unwrap()))
                .build()
                .unwrap()
        }
    };

    match config.clone().try_deserialize::<AppDataStorage>() {
        Ok(_) => {}
        Err(e) => {
            rename(&config_path, config_path.with_extension("bak")).ok();
            eprintln!("Failed to load config: {}", e);
            send_notification(app, "Config Error", e.to_string().as_str()).unwrap_or_default();
        }
    }

    let config_data: HashMap<String, serde_json::Value> =
        config.try_deserialize().unwrap_or_else(|_| HashMap::new());

    AppDataStorage::from_file_hashmap(config_data)
}

pub async fn setup_tasks(app: AppHandle) -> Result<(), ()> {
    use tauri_plugin_notification::NotificationExt;
    let permission_state = app.notification().permission_state().unwrap();
    if permission_state != tauri_plugin_notification::PermissionState::Granted {
        let _ = app.notification().request_permission();
    }

    let app_data_storage = load_app_config(&app);
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
    registry
        .register(
            default_browser_json_parser.name().to_string(),
            Box::new(default_browser_json_parser),
        )
        .unwrap();

    for parser_info in &app_data_storage.custom_parsers {
        match parser_info.r#type.as_str() {
            "python" => match PythonParser::new(parser_info) {
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
                        &format!(
                            "Failed to load Python parser from {}: {}",
                            parser_info.path, e
                        ),
                    )
                    .unwrap_or_default();
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
