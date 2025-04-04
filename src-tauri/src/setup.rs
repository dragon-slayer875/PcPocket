use std::path::Path;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_store::StoreExt;

use crate::database_cmds;
use crate::{database_cmds::DbPool, tray};

pub struct AppData {
    pub db_pool: DbPool,
    pub db_path: String,
}

pub async fn setup_tasks(app: AppHandle) -> Result<(), ()> {
    app.manage(Mutex::new(AppData {
        db_pool: database_cmds::establish_connection_pool(""),
        db_path: "".to_string(),
    }));
    use tauri_plugin_notification::NotificationExt;
    let permission_state = app.notification().permission_state().unwrap();
    if permission_state != tauri_plugin_notification::PermissionState::Granted {
        let _ = app.notification().request_permission();
    }

    let config_path = app.path().app_data_dir().unwrap().join("config.json");

    if Path::new(&config_path).try_exists().unwrap() {
        app.get_webview_window("main")
            .unwrap()
            .eval("window.location.replace('main')")
            .unwrap();
    } else {
        let store = app.store("config.json").unwrap();
        store.set("dbPath", "");
    }

    tray::create_tray(&app).unwrap();

    #[cfg(any(windows, target_os = "linux"))]
    app.deep_link().register_all().unwrap();

    Ok(())
}
