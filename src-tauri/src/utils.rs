use crate::custom_parsers::ParserRegistry;
use crate::setup::AppData;
use crate::setup::AppDataStorage;
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Write};
use std::path::Path;
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::Manager;

pub fn read_app_data_storage<P: AsRef<Path>>(path: P) -> AppDataStorage {
    // Try to open and read the file
    let file_result = File::open(path);

    match file_result {
        Ok(mut file) => {
            let mut contents = String::new();
            if file.read_to_string(&mut contents).is_ok() {
                // Try to deserialize the JSON content
                match serde_json::from_str::<AppDataStorage>(&contents) {
                    Ok(storage) => storage,
                    Err(_) => {
                        println!("Warning: AppData file content is invalid, using defaults");
                        AppDataStorage::default()
                    }
                }
            } else {
                println!("Warning: Couldn't read AppData file content, using defaults");
                AppDataStorage::default()
            }
        }
        Err(_) => {
            println!("Warning: AppData file doesn't exist, using defaults");
            AppDataStorage::default()
        }
    }
}

pub fn write_app_data_storage<P: AsRef<Path>>(path: P, app_handle: &AppHandle) -> io::Result<()> {
    let app_data_binding = app_handle.state::<Mutex<AppData>>();
    let registry_binding = app_handle.state::<Mutex<ParserRegistry>>();
    let app_data = app_data_binding.lock().unwrap();
    let registry = registry_binding.lock().unwrap();

    let mut storage = AppDataStorage::default();
    storage.db_path = app_data.db_path.clone();
    storage.custom_parsers = registry
        .parsers
        .values()
        .map(|parser| parser.info())
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

pub fn send_notification(title: &str, body: &str) -> Result<(), Box<dyn std::error::Error>> {
    use notify_rust::Notification;
    Notification::new().summary(title).body(body).show()?;
    Ok(())
}
