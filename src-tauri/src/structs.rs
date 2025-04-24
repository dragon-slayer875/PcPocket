use std::collections::HashMap;

use crate::{
    database_cmds::{self, DbPool},
    models::{Bookmark, BookmarkNew, Tag},
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserJsonBookmarkItemBase {
    guid: String,
    pub title: String,
    index: i32,
    pub date_added: i64,
    last_modified: i64,
    id: i32,
    type_code: i32,
    r#type: String,
    root: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct BrowserJsonBookmarkFolder {
    #[serde(flatten)]
    pub base: BrowserJsonBookmarkItemBase,
    #[serde(default)]
    pub children: Vec<BrowserJsonBookmarkItem>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserJsonBookmarkLink {
    #[serde(flatten)]
    pub base: BrowserJsonBookmarkItemBase,
    pub icon_uri: Option<String>,
    pub uri: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(untagged)]
pub enum BrowserJsonBookmarkItem {
    Link(BrowserJsonBookmarkLink),
    Folder(BrowserJsonBookmarkFolder),
}

#[derive(Serialize, Debug, Clone, Deserialize)]
pub struct BookmarkWithTags {
    #[serde(flatten)]
    pub bookmark: Bookmark,
    pub tags: Vec<String>,
}

#[derive(Serialize, Debug, Clone, Deserialize)]
pub struct ParsedBookmarkWithTags {
    #[serde(flatten)]
    pub bookmark: BookmarkNew,
    pub tags: Vec<String>,
}

#[derive(Serialize, Debug, Clone, Deserialize)]
pub struct ParseFailBookmark {
    note_index: i32,
    note_title: String,
    error: String,
}

#[derive(Serialize, Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BookmarkQueryResponse {
    pub bookmarks: Vec<BookmarkWithTags>,
    pub total_count: i64,
    pub total_pages: i64,
    pub page: i64,
}

impl Default for BookmarkQueryResponse {
    fn default() -> Self {
        BookmarkQueryResponse {
            bookmarks: Vec::new(),
            total_count: 0,
            total_pages: 0,
            page: 0,
        }
    }
}

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
}

impl AppDataStorage {
    pub fn from_file_hashmap(storage: HashMap<String, serde_json::Value>) -> Self {
        let db_path = storage
            .get("db_path")
            .and_then(|value| value.as_str())
            .unwrap_or("")
            .to_string();

        let custom_parsers: Vec<ParserConfig> = storage
            .get("custom_parsers")
            .and_then(|value| value.as_array())
            .map(|value| {
                value
                    .iter()
                    .filter_map(|parser| serde_json::from_value(parser.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        AppDataStorage {
            db_path,
            custom_parsers,
        }
    }
}

#[derive(Debug, Clone)]
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
}

impl Default for AppDataStorage {
    fn default() -> Self {
        AppDataStorage {
            db_path: "".to_string(),
            custom_parsers: vec![],
        }
    }
}
