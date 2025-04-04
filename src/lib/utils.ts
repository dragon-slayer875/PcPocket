import { BookmarkMutationItem, BookmarkSelectItem } from "@/types";
import Database from "@tauri-apps/plugin-sql";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { load } from "@tauri-apps/plugin-store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function accessStore(
  mode: "get" | "set",
  key: string,
  value?: any,
) {
  const store = await load("config.json");

  if (mode === "get") {
    return store.get<string>(key);
  }
  if (mode === "set") {
    await store.set(key, value);
  }
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

export async function insertBookmark(bookmark: BookmarkMutationItem) {
  const db = await Database.load("sqlite:bookmarks.tmp");
  let bookmarkInsert = structuredClone(bookmark);
  if (bookmarkInsert.tags) {
    delete bookmarkInsert.tags;
  }
  const bookmarkId = await db
    .execute(
      `INSERT INTO bookmarks_table (${Object.keys(bookmarkInsert).join(", ")}) VALUES (${Object.keys(
        bookmarkInsert,
      )
        .map((_, i) => `$${i + 1}`)
        .join(", ")}) RETURNING id`,
      Object.values(bookmarkInsert),
    )
    .then((result) => {
      return result.lastInsertId;
    });

  if (bookmarkId && bookmark.tags) {
    const tagInserts = bookmark.tags.map((tag) =>
      db.execute(
        `INSERT INTO tags_table (bookmark_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [bookmarkId, tag],
      ),
    );
    await Promise.all(tagInserts);
  }
}

export async function updateBookmark(bookmark: BookmarkMutationItem) {
  const db = await Database.load("sqlite:bookmarks.tmp");
  let bookmarkUpdate = structuredClone(bookmark);
  if (bookmarkUpdate.tags) {
    delete bookmarkUpdate.tags;
  }
  await db.execute(
    `UPDATE bookmarks_table SET ${Object.keys(bookmarkUpdate)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(", ")} WHERE id = $${Object.keys(bookmarkUpdate).length + 1}`,
    [...Object.values(bookmarkUpdate), bookmark.id],
  );

  if (bookmark.tags) {
    await db.execute(`DELETE FROM tags_table WHERE bookmark_id = $1`, [
      bookmark.id,
    ]);
    const tagInserts = bookmark.tags.map((tag) =>
      db.execute(
        `INSERT INTO tags_table (bookmark_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [bookmark.id, tag],
      ),
    );
    await Promise.all(tagInserts);
  }
}

export async function deleteBookmark(bookmarkId: number) {
  const db = await Database.load("sqlite:bookmarks.tmp");
  await db.execute(`DELETE FROM bookmarks_table WHERE id = $1`, [bookmarkId]);
}

export async function updateTags(
  bookmarkIds: number[],
  tagsToAdd: string[],
  tagsToDelete: string[],
) {
  const db = await Database.load("sqlite:bookmarks.tmp");
  const tagInserts = bookmarkIds.map((id) =>
    tagsToAdd.map((tag) =>
      db.execute(
        `INSERT INTO tags_table (bookmark_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, tag],
      ),
    ),
  );
  await Promise.all(tagInserts.flat());

  const tagDeletes = bookmarkIds.map((id) =>
    tagsToDelete.map((tag) =>
      db.execute(
        `DELETE FROM tags_table WHERE bookmark_id = $1 AND tag_name = $2`,
        [id, tag],
      ),
    ),
  );
  await Promise.all(tagDeletes.flat());
}
