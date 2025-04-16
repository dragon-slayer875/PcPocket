use crate::models::{Bookmark, BookmarkNew, Tag};
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
    pub tags: Vec<Tag>,
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
