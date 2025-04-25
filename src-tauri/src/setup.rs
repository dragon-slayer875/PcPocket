use crate::structs::{AppData, AppDataStorage};
use crate::utils::read_app_data_from_storage;
use crate::utils::register_parsers;
use std::fs::create_dir;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

use crate::custom_parsers::ParserRegistry;
use crate::tray;

fn init_app_state(app: &AppHandle) {
    let config_dir = app.path().app_config_dir().unwrap();

    if !PathBuf::new().join(&config_dir).exists() {
        create_dir(&config_dir).ok();
    }

    let default_config_path = config_dir.join("default.json");
    let config_path = config_dir.join("config.json");

    if !default_config_path.exists() {
        let default_config = AppDataStorage::default();
        let json_content = serde_json::to_string_pretty(&default_config).unwrap();
        std::fs::write(&default_config_path, json_content).unwrap();
    }

    let app_data_from_storage = read_app_data_from_storage(default_config_path, config_path);

    app.manage(Mutex::new(AppData::from_storage(
        app_data_from_storage.clone(),
    )));

    let mut registry = ParserRegistry::new();

    register_parsers(&app_data_from_storage.custom_parsers, &mut registry);

    app.manage(Mutex::new(registry));
}

pub async fn setup_tasks(app: AppHandle) -> Result<(), ()> {
    init_app_state(&app);

    if !app
        .state::<Mutex<AppData>>()
        .lock()
        .unwrap()
        .db_path
        .is_empty()
    {
        app.get_webview_window("main")
            .unwrap()
            .eval("window.location.replace('main/bookmarks/')")
            .unwrap();
    }

    tray::create_tray(&app).unwrap();

    #[cfg(any(windows, target_os = "linux"))]
    app.deep_link().register_all().unwrap();

    Ok(())
}
