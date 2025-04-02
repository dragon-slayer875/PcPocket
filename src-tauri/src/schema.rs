diesel::table! {
    bookmarks_table (id) {
        id -> Integer,
        title -> Text,
        link -> Text,
        icon_link -> Text,
        created_at -> Timestamp,
    }
}

diesel::table! {
    tags_table (bookmark_id, tag_name) {
        // table has a composite primary key made of bookmarks_id which is a foreign key and tag_name
        bookmark_id -> Integer,
        tag_name -> Text,
    }
}
