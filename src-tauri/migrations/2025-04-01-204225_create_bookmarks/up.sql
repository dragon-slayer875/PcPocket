-- Table to store bookmarks
CREATE TABLE bookmarks_table (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  icon_link TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Table to store tags for bookmarks
CREATE TABLE tags_table (
  bookmark_id INTEGER NOT NULL,
  tag_name TEXT NOT NULL,
  PRIMARY KEY (bookmark_id, tag_name),
  FOREIGN KEY (bookmark_id) REFERENCES bookmarks_table(id) ON DELETE CASCADE
);
