use tauri_plugin_sql::{Migration, MigrationKind};
use tauri_plugin_store::StoreExt;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:bookmarks.tmp", migrations)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let store = app.store("config.json")?;
            store.set("dbPath", "");
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
