use crate::commands::{create_db, open_db};
use crate::custom_parsers::{BrowserJsonParser, Parser, ParserRegistry, PythonParser};
use crate::structs::{AppData, AppDataStorage, ParserConfig};
use crate::tray::EXIT_FLAG;
use config::{Config, File};
use ctrlc;
use log::{debug, trace, warn};
use notify::RecursiveMode;
use notify_debouncer_full::new_debouncer;
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::{self, Write};
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::channel;
use std::sync::Mutex;
use std::{path::Path, time::Duration};
use tauri::AppHandle;
use tauri::Manager;

pub static NOTIF_FAIL_LOG_FLAG: AtomicBool = AtomicBool::new(false);

pub fn read_app_data_from_storage(
    default_config_path: PathBuf,
    config_path: PathBuf,
) -> AppDataStorage {
    let config = match Config::builder()
        .add_source(File::with_name(default_config_path.to_str().unwrap()))
        .add_source(File::with_name(config_path.to_str().unwrap()).required(false))
        .build()
    {
        Ok(config) => config,
        Err(e) => {
            broadcast_info(
                "Config Error",
                &format!("Failed to load config: {}", e),
                log::Level::Error,
                false,
            );
            Config::builder()
                .add_source(File::with_name(default_config_path.to_str().unwrap()))
                .build()
                .unwrap()
        }
    };

    match config.clone().try_deserialize::<AppDataStorage>() {
        Ok(deserialized_config) => {
            return deserialized_config;
        }
        Err(e) => {
            broadcast_info(
                "Config Error",
                &format!("Failed to deserialize config: {}", e),
                log::Level::Error,
                false,
            );
        }
    }

    let config_data: HashMap<String, serde_json::Value> =
        config.try_deserialize().unwrap_or_else(|_| HashMap::new());

    AppDataStorage::from_file_hashmap(config_data)
}

pub fn write_app_data_to_storage(app_handle: &AppHandle) -> io::Result<()> {
    let app_data_binding = app_handle.state::<Mutex<AppData>>();
    let registry_binding = app_handle.state::<Mutex<ParserRegistry>>();
    let app_data = app_data_binding.lock().unwrap();
    let registry = registry_binding.lock().unwrap();

    let path = app_handle
        .path()
        .app_config_dir()
        .unwrap()
        .join("config.json");

    let mut storage = AppDataStorage::default();
    storage.db_path = app_data.db_path.clone();
    storage.custom_parsers = registry
        .parsers
        .values()
        .filter_map(|parser| {
            if parser.info().r#type != "default" {
                Some(parser.info())
            } else {
                None
            }
        })
        .collect();

    // Convert AppDataStorage to JSON string
    let json_content = serde_json::to_string_pretty(&storage)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?;

    // Open file for writing (create if doesn't exist, truncate if exists)
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(path)?;

    // Write JSON content to file
    file.write_all(json_content.as_bytes())?;

    Ok(())
}

pub fn send_notification(title: &str, body: &str) {
    use notify_rust::Notification;
    match Notification::new().summary(title).body(body).show() {
        Ok(_) => {}
        Err(e) => {
            if !NOTIF_FAIL_LOG_FLAG.load(std::sync::atomic::Ordering::Relaxed) {
                warn!("Failed to send notification: {}", e);
                NOTIF_FAIL_LOG_FLAG.store(true, std::sync::atomic::Ordering::Relaxed);
            }
        }
    }
}

pub fn broadcast_info(title: &str, body: &str, level: log::Level, user_action_needed: bool) {
    use log::{error, info, warn};
    match user_action_needed {
        true => send_notification(title, body),
        false => {}
    }
    match level {
        log::Level::Error => error!("{}", body),
        log::Level::Warn => warn!("{}", body),
        log::Level::Info => info!("{}", body),
        log::Level::Debug => debug!("{}", body),
        log::Level::Trace => trace!("{}", body),
    }
}

pub async fn watch_config<P: AsRef<Path>>(path: P, app_handle: AppHandle) -> notify::Result<()> {
    let (tx, rx) = std::sync::mpsc::channel();

    // Create a new debounced file watcher with a timeout of 2 seconds.
    // The tickrate will be selected automatically, as well as the underlying watch implementation.
    let mut debouncer = match new_debouncer(Duration::from_secs(2), None, tx) {
        Ok(debouncer) => debouncer,
        Err(e) => {
            broadcast_info(
                "File Watcher Error",
                &format!("Failed to create file watcher: {}", e),
                log::Level::Error,
                false,
            );
            return Err(e);
        }
    };

    // Add a path to be watched. All files and directories at that path and
    // below will be monitored for changes.
    debouncer.watch(path.as_ref(), RecursiveMode::NonRecursive)?;

    for result in rx {
        match result {
            Ok(events) => events.iter().for_each(|event| match event.kind {
                notify::EventKind::Modify(_) => {
                    refresh_app_data(&app_handle);
                }
                notify::EventKind::Remove(_) => {
                    broadcast_info(
                        "File Removed",
                        &format!("File removed: {:?}\n Using defaults.", event.paths),
                        log::Level::Warn,
                        false,
                    );
                    refresh_app_data(&app_handle);
                }
                _ => {}
            }),
            Err(errors) => errors.iter().for_each(|error| {
                broadcast_info(
                    "File Watcher Error",
                    &format!("Error watching file: {}", error),
                    log::Level::Error,
                    false,
                )
            }),
        }
    }

    Ok(())
}

pub fn register_parsers(custom_parsers: &Vec<ParserConfig>, registry: &mut ParserRegistry) {
    registry.remove_parsers();

    let default_browser_json_parser = BrowserJsonParser::new();
    registry
        .register(
            default_browser_json_parser.name().to_string(),
            Box::new(default_browser_json_parser),
        )
        .unwrap();

    for parser_info in custom_parsers {
        match parser_info.r#type.as_str() {
            "python" => match PythonParser::new(parser_info) {
                Ok(parser) => match registry.register(parser_info.name.clone(), Box::new(parser)) {
                    Ok(_) => {}
                    Err(e) => {
                        broadcast_info(
                            "Parser Registration Error",
                            &format!("Failed to register parser: {}", e),
                            log::Level::Error,
                            false,
                        );
                    }
                },
                Err(e) => {
                    broadcast_info(
                        "Parser Error",
                        &format!(
                            "Failed to load Python parser from {}: {}",
                            parser_info.path, e
                        ),
                        log::Level::Error,
                        false,
                    );
                }
            },
            _ => {
                broadcast_info(
                    "Parser Error",
                    &format!("Unsupported parser type: {}", parser_info.r#type),
                    log::Level::Warn,
                    false,
                );
            }
        }
    }
}

pub fn refresh_app_data(app_handle: &AppHandle) {
    let config_path = app_handle
        .path()
        .app_config_dir()
        .unwrap()
        .join("config.json");
    let default_config_path = app_handle
        .path()
        .app_config_dir()
        .unwrap()
        .join("default.json");

    let app_data_binding = app_handle.state::<Mutex<AppData>>();
    let registry_binding = app_handle.state::<Mutex<ParserRegistry>>();
    let mut registry = registry_binding.lock().unwrap();

    let app_data_from_storage = read_app_data_from_storage(default_config_path, config_path);

    if app_data_from_storage.db_path.is_empty() {
        broadcast_info(
            "Database Path Error",
            "Database path is empty. Retaining current path.",
            log::Level::Error,
            false,
        );
    } else {
        if Path::new(&app_data_from_storage.db_path).exists() {
            open_db(app_data_binding, app_data_from_storage.db_path);
        } else {
            create_db(app_data_binding, app_data_from_storage.db_path);
        }
    }

    register_parsers(&app_data_from_storage.custom_parsers, &mut registry);
}

pub fn exit_app(app_handle: &AppHandle) {
    EXIT_FLAG.store(true, std::sync::atomic::Ordering::Relaxed);
    write_app_data_to_storage(app_handle).unwrap();
    app_handle.exit(0);
}

pub async fn capture_ctrl_c(app_handle: AppHandle) {
    let (tx, rx) = channel();

    match ctrlc::set_handler(move || match tx.send(()) {
        Ok(_) => {
            broadcast_info(
                "Ctrl-C Detected",
                "Ctrl-C detected. Exiting application.",
                log::Level::Info,
                false,
            );
        }
        Err(e) => {
            broadcast_info(
                "Ctrl-C Error",
                &format!("Failed to send Ctrl-C signal: {}", e),
                log::Level::Error,
                false,
            );
        }
    }) {
        Ok(_) => {
            broadcast_info(
                "Ctrl-C Handler",
                "Ctrl-C handler set successfully.",
                log::Level::Info,
                false,
            );
        }
        Err(e) => {
            broadcast_info(
                "Ctrl-C Error",
                &format!("Failed to set Ctrl-C handler: {}", e),
                log::Level::Error,
                false,
            );
        }
    }

    match rx.recv() {
        Ok(_) => {
            exit_app(&app_handle);
        }
        Err(e) => {
            broadcast_info(
                "Ctrl-C Error",
                &format!("Failed to receive Ctrl-C signal: {}", e),
                log::Level::Error,
                false,
            );
        }
    }
}
