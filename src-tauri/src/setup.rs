use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_deep_link::DeepLinkExt;

use crate::database_cmds;
use crate::utils::read_app_data_storage;
use crate::{database_cmds::DbPool, tray};

// Create a separate struct for serialization that excludes DbPool
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppDataStorage {
    pub db_path: String,
    // Add other serializable fields here
}

pub struct AppData {
    pub db_pool: DbPool,
    pub db_path: String,
}

impl AppData {
    // Create from storage format + a DbPool
    pub fn from_storage(storage: AppDataStorage) -> Self {
        AppData {
            db_pool: database_cmds::establish_connection_pool(&storage.db_path),
            db_path: storage.db_path,
        }
    }

    // Convert to storage format (dropping the DbPool)
    pub fn to_storage(&self) -> AppDataStorage {
        AppDataStorage {
            db_path: self.db_path.clone(),
        }
    }
}

// Default values for the storage format
impl Default for AppDataStorage {
    fn default() -> Self {
        AppDataStorage {
            db_path: "".to_string(),
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
            .eval("window.location.replace('main')")
            .unwrap();
    }

    tray::create_tray(&app).unwrap();

    #[cfg(any(windows, target_os = "linux"))]
    app.deep_link().register_all().unwrap();

    Ok(())
}
