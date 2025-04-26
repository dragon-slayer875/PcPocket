use crate::custom_parsers::{ParserRegistry, PythonParser};
use crate::database_cmds::batch_insert;
use crate::models::{Bookmark, Tag};
use crate::utils::broadcast_info;
use diesel::dsl::count;
use serde::Deserialize;
use std::sync::Mutex;
use tauri::WebviewUrl;
use tauri::{AppHandle, Manager, State};

use crate::database_cmds;
use crate::structs::{AppData, ParserConfig};
use crate::structs::{BookmarkQueryResponse, BookmarkWithTags};

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum FilterValue {
    Text(String),
    Tags(Vec<String>),
}

#[derive(Debug, Deserialize)]
pub struct FilterItem {
    id: String,
    value: FilterValue,
}

#[derive(Deserialize)]
pub struct SortItem {
    id: String,
    desc: bool,
}

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
            open_url = "main/bookmarks/";
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
    page: Option<i64>,
    page_size: Option<i64>,
    all: Option<bool>,
    filters: Option<Vec<FilterItem>>,
    sort: Option<Vec<SortItem>>,
) -> BookmarkQueryResponse {
    use crate::schema::bookmarks_table::dsl::*;
    use crate::schema::tags_table::{bookmark_id, table as tags_table, tag_name};
    use diesel::prelude::*;

    let app_data = state.lock().unwrap();
    let mut conn = app_data.db_pool.get().unwrap();

    let mut query = bookmarks_table.into_boxed();

    let mut count_query = bookmarks_table.into_boxed();

    if let Some(filter_items) = &filters {
        for filter in filter_items {
            // Apply each filter based on column name
            match filter.id.as_str() {
                "title" => {
                    if let FilterValue::Text(text_value) = &filter.value {
                        query = query.filter(title.like(format!("%{}%", text_value)));
                        count_query = count_query.filter(title.like(format!("%{}%", text_value)));
                    }
                }
                "link" => {
                    if let FilterValue::Text(text_value) = &filter.value {
                        query = query.filter(link.like(format!("%{}%", text_value)));
                        count_query = count_query.filter(link.like(format!("%{}%", text_value)));
                    }
                }
                "created_at" => {
                    if let FilterValue::Text(text_value) = &filter.value {
                        query = query.filter(created_at.eq(text_value.parse::<i64>().unwrap()));
                        count_query =
                            count_query.filter(created_at.eq(text_value.parse::<i64>().unwrap()));
                    }
                }
                "tags" => {
                    if let FilterValue::Tags(tag_values) = &filter.value {
                        let mut bookmarks_with_tag_ids_query = tags_table.into_boxed();
                        for (i, tag_value) in tag_values.iter().enumerate() {
                            if i == 0 {
                                bookmarks_with_tag_ids_query = bookmarks_with_tag_ids_query
                                    .filter(tag_name.like(format!("%{}%", tag_value)));
                            } else {
                                bookmarks_with_tag_ids_query = bookmarks_with_tag_ids_query
                                    .or_filter(tag_name.like(format!("%{}%", tag_value)));
                            }
                        }
                        let bookmark_with_tag_ids = bookmarks_with_tag_ids_query
                            .select(bookmark_id)
                            .load::<i32>(&mut conn)
                            .unwrap();

                        query = query.filter(id.eq_any(bookmark_with_tag_ids.clone()));
                        count_query = count_query.filter(id.eq_any(bookmark_with_tag_ids));
                    }
                }
                // Add more fields as needed
                _ => {
                    // Ignore unknown fields
                }
            }
        }
    }

    if let Some(sort_items) = &sort {
        for sort_item in sort_items {
            match sort_item.id.as_str() {
                "title" => {
                    if sort_item.desc {
                        query = query.order(title.desc());
                    } else {
                        query = query.order(title.asc());
                    }
                }
                "link" => {
                    if sort_item.desc {
                        query = query.order(link.desc());
                    } else {
                        query = query.order(link.asc());
                    }
                }
                "created_at" => {
                    if sort_item.desc {
                        query = query.order(created_at.desc());
                    } else {
                        query = query.order(created_at.asc());
                    }
                }
                // Add other sortable columns
                _ => {
                    // Ignore unknown fields
                }
            }
        }
    }

    let total = match count_query.select(count(id)).first::<i64>(&mut conn) {
        Ok(total) => total,
        Err(e) => {
            broadcast_info(
                "Database Error",
                &format!("Error reading bookmarks: {}", e),
                log::Level::Error,
            );
            return BookmarkQueryResponse::default();
        }
    };

    let mut bookmarks_query = query.select(Bookmark::as_select());

    if !all.unwrap_or(false) {
        let page_size_val = page_size.unwrap_or(10);
        let page_val = page.unwrap_or(0);
        let total_pages = (total as f64 / page_size_val as f64).ceil() as i64;

        bookmarks_query = bookmarks_query
            .limit(page_size_val)
            .offset(page_size_val * page_val);

        let bookmarks = bookmarks_query.load::<Bookmark>(&mut conn).unwrap();

        let tags = Tag::belonging_to(&bookmarks)
            .select(Tag::as_select())
            .load(&mut conn)
            .unwrap();

        let bookmarks_with_tags = tags
            .grouped_by(&bookmarks)
            .into_iter()
            .zip(bookmarks)
            .map(|(tags, bookmark)| BookmarkWithTags {
                bookmark,
                tags: tags.iter().map(|tag| tag.tag_name.clone()).collect(),
            })
            .collect::<Vec<BookmarkWithTags>>();

        return BookmarkQueryResponse {
            bookmarks: bookmarks_with_tags,
            total_count: total,
            total_pages,
            page: page_val,
        };
    } else {
        let bookmarks = bookmarks_query.load::<Bookmark>(&mut conn).unwrap();

        let tags = Tag::belonging_to(&bookmarks)
            .select(Tag::as_select())
            .load(&mut conn)
            .unwrap();

        let bookmarks_with_tags = tags
            .grouped_by(&bookmarks)
            .into_iter()
            .zip(bookmarks)
            .map(|(tags, bookmark)| BookmarkWithTags {
                bookmark,
                tags: tags.iter().map(|tag| tag.tag_name.clone()).collect(),
            })
            .collect::<Vec<BookmarkWithTags>>();

        return BookmarkQueryResponse {
            bookmarks: bookmarks_with_tags,
            total_count: total,
            total_pages: 1,
            page: 0,
        };
    };
}

#[tauri::command]
pub fn get_all_tags(state: State<'_, Mutex<AppData>>) -> Vec<String> {
    use crate::schema::tags_table::dsl::*;
    use diesel::prelude::*;

    let app_data = state.lock().unwrap();
    let mut conn = app_data.db_pool.get().unwrap();

    match tags_table
        .select(tag_name)
        .distinct()
        .load::<String>(&mut conn)
    {
        Ok(tags) => tags,
        Err(e) => {
            broadcast_info(
                "Database Error",
                &format!("Error reading tags: {}", e),
                log::Level::Error,
            );
            return vec![];
        }
    }
}

#[tauri::command]
pub fn import_bookmarks(app: AppHandle, file_path: String, parser_name: String) {
    let binding = app.state::<Mutex<ParserRegistry>>();
    let registry = binding.lock().unwrap();
    let parser = registry.get(&parser_name).unwrap();
    let parser_result = parser.parse(&file_path);

    match parser_result {
        Ok(parsed_bookmarks) => match batch_insert(&app, parsed_bookmarks.get_successful()) {
            Ok(_) => {
                broadcast_info(
                    "Bookmarks Imported",
                    &format!(
                        "Successfully imported {} bookmarks",
                        parsed_bookmarks.get_successful().len()
                    ),
                    log::Level::Info,
                );
            }
            Err(e) => {
                broadcast_info(
                    "Bookmarks Import Error",
                    &format!("Error inserting bookmarks: {}", e),
                    log::Level::Error,
                );
            }
        },
        Err(e) => {
            broadcast_info(
                "Bookmarks Import Error",
                &format!("Error parsing bookmarks: {}", e),
                log::Level::Error,
            );
        }
    }
}

#[tauri::command]
pub fn list_all_custom_parsers(app: AppHandle) -> Vec<ParserConfig> {
    let binding = app.state::<Mutex<ParserRegistry>>();
    let registry = binding.lock().unwrap();
    registry
        .parsers
        .values()
        .map(|parser| parser.info())
        .collect()
}

#[tauri::command]
pub fn list_supported_parsers(app: AppHandle, required_format: String) -> Vec<String> {
    let binding = app.state::<Mutex<ParserRegistry>>();
    let registry = binding.lock().unwrap();
    registry.list_parsers_for_format(required_format)
}

#[tauri::command]
pub fn add_custom_parser(app: AppHandle, parser_config: ParserConfig) {
    let registry_binding = app.state::<Mutex<ParserRegistry>>();
    let mut registry = registry_binding.lock().unwrap();
    match parser_config.r#type.as_str() {
        "python" => match PythonParser::new(&parser_config) {
            Ok(parser) => match registry.register(parser.name.clone(), Box::new(parser)) {
                Ok(_) => {
                    broadcast_info(
                        "Parser Registered",
                        &format!("Registered parser: {}", parser_config.name),
                        log::Level::Info,
                    );
                }
                Err(e) => {
                    broadcast_info(
                        "Parser Registration Error",
                        &format!("Failed to register parser: {}", e),
                        log::Level::Error,
                    );
                }
            },
            Err(e) => {
                broadcast_info(
                    "Parser Error",
                    &format!(
                        "Failed to load Python parser from {}: {}",
                        parser_config.path, e
                    ),
                    log::Level::Error,
                );
            }
        },
        _ => {
            broadcast_info(
                "Parser Error",
                &format!("Unsupported parser type: {}", parser_config.r#type),
                log::Level::Warn,
            );
        }
    }
}
