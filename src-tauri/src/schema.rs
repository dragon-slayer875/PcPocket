// @generated automatically by Diesel CLI.

diesel::table! {
    bookmarks_table (id) {
        id -> Integer,
        title -> Text,
        link -> Text,
        icon_link -> Nullable<Text>,
        created_at -> Integer,
    }
}

diesel::table! {
    tags_table (bookmark_id, tag_name) {
        bookmark_id -> Integer,
        tag_name -> Text,
    }
}

diesel::joinable!(tags_table -> bookmarks_table (bookmark_id));

diesel::allow_tables_to_appear_in_same_query!(
    bookmarks_table,
    tags_table,
);
