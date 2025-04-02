use diesel::prelude::*;

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::bookmarks_table)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Bookmark {
    pub id: i32,
    pub title: String,
    pub link: String,
    pub icon_link: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::tags_table)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Tag {
    pub bookmarks_id: i32,
    pub tag_name: String,
}
