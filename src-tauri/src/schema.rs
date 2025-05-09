// @generated automatically by Diesel CLI.

diesel::table! {
    bookmarks_table (id) {
        id -> Integer,
        title -> Nullable<Text>,
        link -> Text,
        icon_link -> Nullable<Text>,
        created_at -> BigInt,
    }
}

diesel::table! {
    tags_table (id) {
        id -> Integer,
        bookmark_id -> Integer,
        tag_name -> Text,
    }
}

diesel::joinable!(tags_table -> bookmarks_table (bookmark_id));

diesel::allow_tables_to_appear_in_same_query!(
    bookmarks_table,
    tags_table,
);
