import { BookmarkInsertItem, BookmarkItem, BookmarkSelectItem } from "@/types";
import Database from "@tauri-apps/plugin-sql";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getBookmarks() {
  const db = await Database.load("sqlite:bookmarks.tmp");
  const queryResults: BookmarkSelectItem[] = await db.select(
    `SELECT b.*, t.tag_name FROM bookmarks_table b LEFT JOIN tags_table t ON b.id = t.bookmark_id`,
  );

  const bookmarks = new Map();
  queryResults.forEach((row) => {
    const bookmarkId = row.id;
    if (!bookmarks.has(bookmarkId)) {
      const bookmark = {
        id: bookmarkId,
        title: row.title,
        link: row.link,
        icon_link: row.icon_link,
        created_at: row.created_at,
        tags: [],
      };
      bookmarks.set(bookmarkId, bookmark);
    }
    if (row.tag_name) {
      bookmarks.get(bookmarkId).tags.push(row.tag_name);
    }
  });

  return Array.from(bookmarks.values());
}

export async function importBookmarks(path: string) {
  const db = await Database.load("sqlite:bookmarks.tmp");
  const bookmarks = JSON.parse(await readTextFile(path));
  await traverseFirefoxBookmarks(bookmarks, [], db);
}

async function traverseFirefoxBookmarks(
  bookmark: BookmarkItem,
  tags: string[],
  db: Database,
) {
  if (!bookmark?.children && bookmark.uri) {
    const bookmarkData: BookmarkInsertItem = {
      title: bookmark.title?.trim() || bookmark.uri,
      link: bookmark.uri,
      icon_link: bookmark.iconUri ?? null,
      created_at: new Date(bookmark.dateAdded / 1000),
    };

    const bookmarkId = await db
      .execute(
        `INSERT INTO bookmarks_table (${Object.keys(bookmarkData).join(", ")}) VALUES (${Object.keys(
          bookmarkData,
        )
          .map((_, i) => `$${i + 1}`)
          .join(", ")}) RETURNING id`,
        Object.values(bookmarkData),
      )
      .then((result) => {
        return result.lastInsertId;
      });

    if (bookmarkId) {
      const tagInserts = tags.map((tag) =>
        db.execute(
          `INSERT INTO tags_table (bookmark_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [bookmarkId, tag],
        ),
      );
      await Promise.all(tagInserts);
    }
  }

  if (bookmark.children) {
    const newTags = [...tags, bookmark.title?.trim()];
    await Promise.all(
      bookmark.children.map((child) =>
        traverseFirefoxBookmarks(child, newTags, db),
      ),
    );
  }
}
