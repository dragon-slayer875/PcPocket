use crate::models::{BookmarkNew, TagNew};
use crate::schema::bookmarks_table::id;
use crate::schema::tags_table::bookmark_id;
use crate::structs::ParsedBookmarkWithTags;
use crate::utils::send_notification;
use diesel::backend::Backend;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use std::error::Error;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

use crate::setup::AppData;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

pub type DbPool = Pool<ConnectionManager<SqliteConnection>>;
pub type DbConnection = PooledConnection<ConnectionManager<SqliteConnection>>;

pub async fn run_migrations<DB: Backend>(
    connection: &mut impl MigrationHarness<DB>,
) -> Result<(), Box<dyn Error + Send + Sync + 'static>> {
    // This will run the necessary migrations.
    connection.run_pending_migrations(MIGRATIONS)?;

    Ok(())
}

// Initialize the connection pool
pub fn establish_connection_pool(path: &str) -> DbPool {
    let database_url = format!("sqlite://{}", path);

    let manager = ConnectionManager::<SqliteConnection>::new(database_url);
    Pool::builder()
        .max_size(5)
        .build(manager)
        .expect("Failed to create connection pool")
}

// Function to get a connection from the pool
pub fn get_connection(pool: &DbPool) -> DbConnection {
    pool.get().expect("Failed to get connection from pool")
}

pub fn batch_insert(
    app: &AppHandle,
    bookmarks: &Vec<ParsedBookmarkWithTags>,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get database connection from app state
    let binding = app.app_handle().state::<Mutex<AppData>>();
    let app_data = binding.lock().unwrap();
    let mut conn = get_connection(&app_data.db_pool);

    let bookmarks_temp: Vec<(BookmarkNew, Vec<String>)> = bookmarks
        .iter()
        .cloned()
        .map(|bookmark_with_tags| (bookmark_with_tags.bookmark, bookmark_with_tags.tags))
        .collect();

    // Begin transaction
    conn.transaction(|conn| {
        use crate::schema::{bookmarks_table, tags_table};
        use diesel::prelude::*;

        for (bookmark, tags) in bookmarks_temp {
            // Insert bookmark and get ID
            let curr_bookmark_id: i32 = diesel::insert_into(bookmarks_table::table)
                .values(&bookmark)
                .returning(bookmarks_table::id) // Assuming id is the column name
                .get_result(conn)?;

            // Insert tags for this specific bookmark
            for tag_name in tags {
                // Create a new tag record
                let tag = TagNew {
                    bookmark_id: curr_bookmark_id,
                    tag_name,
                };

                // Insert tag with ON CONFLICT DO NOTHING behavior
                diesel::insert_into(tags_table::table)
                    .values(&tag)
                    .on_conflict_do_nothing()
                    .execute(conn)?;
            }
        }

        Ok(()) as Result<(), diesel::result::Error>
    })?;

    app.emit("bookmarks-updated", {}).unwrap();

    Ok(())
}

#[tauri::command]
pub fn bookmark_insert(app: AppHandle, bookmark: BookmarkNew, tags: Vec<String>) {
    // Get database connection from app state
    let binding = app.app_handle().state::<Mutex<AppData>>();
    let app_data = binding.lock().unwrap();
    let mut conn = get_connection(&app_data.db_pool);

    // Begin transaction
    conn.transaction(|conn| {
        use crate::schema::{bookmarks_table, tags_table};
        use diesel::prelude::*;

        // Insert bookmark and get ID
        let insert_id: i32 = diesel::insert_into(bookmarks_table::table)
            .values(&bookmark)
            .returning(bookmarks_table::id) // Assuming id is the column name
            .get_result(conn)?;

        // Insert tags for this specific bookmark
        for tag_name in tags {
            if tag_name.is_empty() {
                continue; // Skip empty tags
            }
            // Create a new tag record
            let tag = TagNew {
                bookmark_id: insert_id,
                tag_name,
            };

            // Insert tag with ON CONFLICT DO NOTHING behavior
            diesel::insert_into(tags_table::table)
                .values(&tag)
                .on_conflict_do_nothing()
                .execute(conn)?;
        }

        Ok(()) as Result<(), diesel::result::Error>
    })
    .unwrap();

    app.emit("bookmarks-updated", "bookmarks-updated").unwrap();
    send_notification("PcPocket", "Bookmark added successfully")
        .expect("Failed to send notification");
}

#[tauri::command]
pub fn bookmark_update(app: AppHandle, index: i32, bookmark: BookmarkNew, tags: Vec<String>) {
    // Get database connection from app state
    let binding = app.app_handle().state::<Mutex<AppData>>();
    let app_data = binding.lock().unwrap();
    let mut conn = get_connection(&app_data.db_pool);

    // Begin transaction
    conn.transaction(|conn| {
        use crate::schema::{bookmarks_table, tags_table};
        use diesel::prelude::*;

        // Update bookmark
        diesel::update(bookmarks_table::table)
            .filter(id.eq(index))
            .set(&bookmark)
            .execute(conn)?;

        // Delete existing tags for this bookmark
        diesel::delete(tags_table::table)
            .filter(bookmark_id.eq(index))
            .execute(conn)?;

        // Insert new tags for this specific bookmark
        for tag_name in tags {
            // Create a new tag record
            let tag = TagNew {
                bookmark_id: index,
                tag_name,
            };

            // Insert tag with ON CONFLICT DO NOTHING behavior
            diesel::insert_into(tags_table::table)
                .values(&tag)
                .on_conflict_do_nothing()
                .execute(conn)
                .unwrap();
        }
        Ok(()) as Result<(), diesel::result::Error>
    })
    .unwrap();

    app.emit("bookmarks-updated", "bookmarks-updated").unwrap();
    send_notification("PcPocket", "Bookmark updated successfully")
        .expect("Failed to send notification");
}

#[tauri::command]
pub fn bookmark_delete(app: AppHandle, delete_id: i32) {
    // Get database connection from app state
    let binding = app.app_handle().state::<Mutex<AppData>>();
    let app_data = binding.lock().unwrap();
    let mut conn = get_connection(&app_data.db_pool);

    // Begin transaction
    conn.transaction(|conn| {
        use crate::schema::bookmarks_table;
        use diesel::prelude::*;

        // Delete the bookmark and its associated tags
        diesel::delete(bookmarks_table::table.filter(id.eq(delete_id))).execute(conn)?;

        Ok(()) as Result<(), diesel::result::Error>
    })
    .unwrap();

    app.emit("bookmarks-updated", "bookmarks-updated").unwrap();
    send_notification("PcPocket", "Bookmark deleted successfully")
        .expect("Failed to send notification");
}

#[tauri::command]
pub fn tags_update(
    app: AppHandle,
    ids: Vec<i32>,
    tags_to_add: Vec<String>,
    tags_to_delete: Vec<String>,
) {
    // Get database connection from app state
    let binding = app.app_handle().state::<Mutex<AppData>>();
    let app_data = binding.lock().unwrap();
    let mut conn = get_connection(&app_data.db_pool);

    // Begin transaction
    conn.transaction(|conn| {
        use crate::schema::tags_table;
        use diesel::prelude::*;

        // Delete specified tags
        for tag_name in tags_to_delete {
            diesel::delete(
                tags_table::table
                    .filter(tags_table::tag_name.eq(tag_name))
                    .filter(tags_table::bookmark_id.eq_any(&ids)),
            )
            .execute(conn)?;
        }

        // Insert new tags for the specified bookmarks
        for tag_update_id in ids {
            for tag_name in &tags_to_add {
                let tag = TagNew {
                    bookmark_id: tag_update_id,
                    tag_name: tag_name.clone(),
                };

                diesel::insert_into(tags_table::table)
                    .values(&tag)
                    .on_conflict_do_nothing()
                    .execute(conn)?;
            }
        }

        Ok(()) as Result<(), diesel::result::Error>
    })
    .unwrap();

    app.emit("bookmarks-updated", "bookmarks-updated").unwrap();
    send_notification("PcPocket", "Tags updated successfully")
        .expect("Failed to send notification");
}

#[tauri::command]
pub fn batch_delete(app: AppHandle, ids: Vec<i32>) {
    // Get database connection from app state
    let binding = app.app_handle().state::<Mutex<AppData>>();
    let app_data = binding.lock().unwrap();
    let mut conn = get_connection(&app_data.db_pool);

    // Begin transaction
    conn.transaction(|conn| {
        use crate::schema::bookmarks_table;
        use diesel::prelude::*;

        // Delete the bookmarks and their associated tags
        diesel::delete(bookmarks_table::table.filter(id.eq_any(&ids))).execute(conn)?;

        Ok(()) as Result<(), diesel::result::Error>
    })
    .unwrap();

    app.emit("bookmarks-updated", "bookmarks-updated").unwrap();
    send_notification("PcPocket", "Bookmarks deleted successfully")
        .expect("Failed to send notification");
}
