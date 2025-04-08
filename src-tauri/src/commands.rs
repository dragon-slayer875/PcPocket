use crate::models::{Bookmark, Tag};
use crate::utils::send_notification;
use diesel::associations::HasTable;
use diesel::BelongingToDsl;
use diesel::{GroupedBy, QueryDsl, RunQueryDsl, SelectableHelper};
use std::fs;
use std::sync::Mutex;
use tauri::WebviewUrl;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_notification::NotificationExt;

use crate::setup::AppData;
use crate::structs::{BookmarkWithTags, BrowserJsonBookmarkItem};
use crate::{database_cmds, utils};

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
        let binding = app_handle.state::<Mutex<AppData>>();
        let app_data = binding.lock().unwrap();
        if !app_data.db_path.is_empty() {
            open_url = "main/bookmarks";
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

    let app_data = state.lock().unwrap();
    let mut conn = app_data.db_pool.get().unwrap();

    if all.unwrap_or(false) {
        let bookmarks = bookmarks_table::table()
            .select(Bookmark::as_select())
            .load::<Bookmark>(&mut conn)
            .unwrap();

        if bookmarks.is_empty() {
            return vec![];
        }

        let tags = Tag::belonging_to(&bookmarks)
            .select(Tag::as_select())
            .load(&mut conn)
            .unwrap();

        let bookmarks_with_tags = tags
            .grouped_by(&bookmarks)
            .into_iter()
            .zip(bookmarks)
            .map(|(tags, bookmark)| BookmarkWithTags { bookmark, tags })
            .collect::<Vec<BookmarkWithTags>>();

        return bookmarks_with_tags;
    } else {
        let bookmarks = bookmarks_table::table()
            .select(Bookmark::as_select())
            .limit(page_size.unwrap_or(10))
            .load::<Bookmark>(&mut conn)
            .unwrap();

        if bookmarks.is_empty() {
            return vec![];
        }

        let tags = Tag::belonging_to(&bookmarks)
            .select(Tag::as_select())
            .load(&mut conn)
            .unwrap();

        let bookmarks_with_tags = tags
            .grouped_by(&bookmarks)
            .into_iter()
            .zip(bookmarks)
            .map(|(tags, bookmark)| BookmarkWithTags { bookmark, tags })
            .collect::<Vec<BookmarkWithTags>>();

        return bookmarks_with_tags;
    };
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

    let import_result = utils::batch_browser_json_import(&bookmarks_json, &app);

    match import_result {
        Ok(_) => {
            send_notification(&app, "PcPocket", "Bookmarks imported successfully")
                .expect("Failed to send notification");
        }
        Err(e) => {
            send_notification(
                &app,
                "PcPocket",
                &format!("Error importing bookmarks: {}", e),
            )
            .expect("Failed to send notification");
        }
    }
}
