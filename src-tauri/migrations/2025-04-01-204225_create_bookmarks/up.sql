-- Table to store bookmarks
CREATE TABLE bookmarks_table (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  link TEXT NOT NULL,
  icon_link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'utc'))
);

-- Table to store tags for bookmarks
CREATE TABLE tags_table (
  id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  bookmark_id INTEGER NOT NULL,
  tag_name TEXT NOT NULL,
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks_table(id) ON DELETE CASCADE
);
