use diesel::prelude::*;

pub fn establish_connection(path: String) -> SqliteConnection {
    // Create a sqlite database URL
    let database_url = format!("sqlite://{}", path);
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
