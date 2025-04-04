use crate::models::TagNew;
use diesel::backend::Backend;
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool, PooledConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use std::error::Error;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

use crate::models::BookmarkNew;
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
    bookmarks: &mut Vec<(BookmarkNew, Vec<String>)>,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get database connection from app state
    let binding = app.app_handle().state::<Mutex<AppData>>();
    let app_data = binding.lock().unwrap();
    let mut conn = app_data.db_pool.get().unwrap();

    // Begin transaction
    conn.transaction(|conn| {
        use crate::schema::{bookmarks_table, tags_table};
        use diesel::prelude::*;

        for (bookmark, tags) in bookmarks.drain(..) {
            // Insert bookmark and get ID
            let bookmark_id: i32 = diesel::insert_into(bookmarks_table::table)
                .values(&bookmark)
                .returning(bookmarks_table::id) // Assuming id is the column name
                .get_result(conn)?;

            // Insert tags for this specific bookmark
            for tag_name in tags {
                // Create a new tag record
                let tag = TagNew {
                    bookmark_id,
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

    app.emit("bookmarks-updated", "bookmarks-updated").unwrap();

    Ok(())
}
