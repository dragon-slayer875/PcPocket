use crate::models::{Bookmark, Tag};
use diesel::associations::HasTable;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use serde::Serialize;
use std::fs;
use std::sync::Mutex;
use tauri::WebviewUrl;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt;

use crate::setup::AppData;
use crate::structs::BrowserJsonBookmarkItem;
use crate::{database_cmds, utils};

#[derive(Serialize, Debug)]
pub struct BookmarkWithTags {
    #[serde(flatten)]
    pub bookmark: Bookmark,
    pub tags: Vec<String>,
}

#[tauri::command]
pub fn open_main_window(app_handle: &AppHandle) {
    #[cfg(target_os = "macos")]
    {
        crate::dock::set_dock_visible(true);
    }
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().unwrap();
        window.set_focus().unwrap();
    } else {
        let open_url;
        if app_handle
            .store("config.json")
            .unwrap()
            .get("dbPath")
            .unwrap()
            .is_string()
        {
            open_url = "main";
        } else {
            open_url = "/";
        }
        tauri::WebviewWindowBuilder::new(app_handle, "main", WebviewUrl::App(open_url.into()))
            .title("PcPocket")
            .inner_size(800.0, 600.0)
            .build()
            .unwrap();
    }
}

#[tauri::command]
pub fn get_db_path(state: State<'_, Mutex<AppData>>) -> String {
    let app_data = state.lock().unwrap();
    app_data.db_path.clone()
}

#[tauri::command]
pub fn create_db(state: State<'_, Mutex<AppData>>, path: String) {
    let mut app_data = state.lock().unwrap();
    app_data.db_path = path.clone();
    app_data.db_pool = database_cmds::establish_connection_pool(&path);
    let mut conn = app_data.db_pool.get().unwrap();
    tauri::async_runtime::spawn(async move {
        database_cmds::run_migrations(&mut conn).await.unwrap();
    });
}

#[tauri::command]
pub fn open_db(state: State<'_, Mutex<AppData>>, path: String) {
    let mut app_data = state.lock().unwrap();
    app_data.db_path = path.clone();
    app_data.db_pool = database_cmds::establish_connection_pool(&path);
}

#[tauri::command]
pub fn get_bookmarks(
    state: State<'_, Mutex<AppData>>,
    index: i32,
    page_size: Option<i64>,
    all: Option<bool>,
) -> Vec<BookmarkWithTags> {
    use crate::schema::bookmarks_table::dsl::*;
    use crate::schema::tags_table::dsl::*;

    let app_data = state.lock().unwrap();
    let mut conn = app_data.db_pool.get().unwrap();

    let bookmarks = if all.unwrap_or(false) {
        bookmarks_table::table()
            .left_join(tags_table::table())
            .filter(id.gt(index))
            .load::<(Bookmark, Option<Tag>)>(&mut conn)
            .unwrap()
    } else {
        bookmarks_table::table()
            .left_join(tags_table::table())
            .filter(id.gt(index))
            .limit(page_size.unwrap_or(10))
            .load::<(Bookmark, Option<Tag>)>(&mut conn)
            .unwrap()
    };

    let mut bookmark_map: std::collections::HashMap<i32, BookmarkWithTags> =
        std::collections::HashMap::new();

    for (bookmark, tag) in bookmarks {
        let entry = bookmark_map.entry(bookmark.id).or_insert(BookmarkWithTags {
            bookmark,
            tags: vec![],
        });
        if let Some(tag) = tag {
            entry.tags.push(tag.tag_name);
        }
    }

    println!("Bookmarks: {:?}", bookmark_map);

    return bookmark_map.into_iter().map(|(_, v)| v).collect();
}

#[tauri::command]
pub fn import_bookmarks(app: AppHandle, file_path: String) {
    let file_content = fs::read_to_string(&file_path);
    let bookmarks_json = match file_content {
        Ok(content) => {
            let bookmarks: BrowserJsonBookmarkItem = serde_json::from_str(&content).unwrap();
            bookmarks
        }
        Err(e) => {
            app.notification()
                .builder()
                .title("PcPocket")
                .body(format!("Error reading file: {}", e))
                .show()
                .unwrap();
            return;
        }
    };

    app.app_handle()
        .emit(
            "import-started",
            utils::count_json_bookmarks(bookmarks_json.clone()),
        )
        .unwrap();

    let import_result = utils::batch_browser_json_import(&bookmarks_json, &app);

    match import_result {
        Ok(_) => {
            app.notification()
                .builder()
                .title("PcPocket")
                .body("Bookmarks imported successfully")
                .show()
                .unwrap();
            app.app_handle().emit("import-completed", ()).unwrap();
        }
        Err(e) => {
            app.notification()
                .builder()
                .title("PcPocket")
                .body(format!("Error importing bookmarks: {}", e))
                .show()
                .unwrap();
            app.app_handle().emit("import-failed", ()).unwrap();
        }
    }
}
