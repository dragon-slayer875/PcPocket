use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Queryable, Selectable, Debug, Serialize, Deserialize, Identifiable, Clone, PartialEq)]
#[diesel(table_name = crate::schema::bookmarks_table)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Bookmark {
    pub id: i32,
    pub title: Option<String>,
    pub link: String,
    pub icon_link: Option<String>,
    pub created_at: i64,
}

#[derive(Insertable, Serialize, Clone, Deserialize, Debug, AsChangeset)]
#[diesel(table_name = crate::schema::bookmarks_table)]
pub struct BookmarkNew {
    pub title: Option<String>,
    pub link: String,
    pub icon_link: Option<String>,
    pub created_at: i64,
}

#[derive(
    Queryable,
    Selectable,
    Identifiable,
    Associations,
    Serialize,
    Deserialize,
    Debug,
    PartialEq,
    Clone,
)]
#[diesel(belongs_to(Bookmark))]
#[diesel(table_name = crate::schema::tags_table)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Tag {
    pub id: i32,
    pub bookmark_id: i32,
    pub tag_name: String,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = crate::schema::tags_table)]
pub struct TagNew {
    pub bookmark_id: i32,
    pub tag_name: String,
}
