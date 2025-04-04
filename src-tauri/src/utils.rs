use crate::database_cmds::batch_insert;
use crate::{models::BookmarkNew, structs::BrowserJsonBookmarkItem};
use tauri::AppHandle;
use time::OffsetDateTime;

pub fn count_json_bookmarks(root: BrowserJsonBookmarkItem) -> usize {
    let mut count = 0;
    let mut stack = vec![root];

    while let Some(current) = stack.pop() {
        match current {
            BrowserJsonBookmarkItem::Link(_) => {
                count += 1; // Count each link
            }
            BrowserJsonBookmarkItem::Folder(folder) => {
                // Add all children to the stack
                for child in &folder.children {
                    stack.push(child.clone());
                }
            }
        }
    }
    count
}

pub fn batch_browser_json_import(
    root: &BrowserJsonBookmarkItem,
    app: &AppHandle,
) -> Result<(), Box<dyn std::error::Error>> {
    // Create batch containers
    let mut bookmark_batch: Vec<(BookmarkNew, Vec<String>)> = Vec::new();
    let batch_size = 50;

    // Use a stack for traversal
    let mut stack: Vec<(&BrowserJsonBookmarkItem, Vec<String>)> = vec![(root, vec![])];

    while let Some((current, current_tags)) = stack.pop() {
        match current {
            BrowserJsonBookmarkItem::Link(link) => {
                // Create the bookmark
                let bookmark = BookmarkNew {
                    title: Some(link.base.title.clone()),
                    link: link.uri.clone(),
                    icon_link: Some(link.icon_uri.clone().unwrap_or_default()),
                    created_at: Some(
                        OffsetDateTime::from_unix_timestamp(link.base.date_added / 1000)
                            .unwrap_or(OffsetDateTime::now_utc())
                            .to_string(),
                    ),
                };

                // Add bookmark to batch with its specific tags
                bookmark_batch.push((bookmark, current_tags.clone()));

                // Process batch if it reaches the defined size
                if bookmark_batch.len() >= batch_size {
                    batch_insert(app, &mut bookmark_batch).unwrap();
                }
            }
            BrowserJsonBookmarkItem::Folder(folder) => {
                // Create new tags list with folder title added
                let mut new_tags = current_tags.clone();
                if !folder.base.title.trim().is_empty() {
                    new_tags.push(folder.base.title.trim().to_string());
                }

                // Add children to stack in reverse order to maintain traversal order
                for child in folder.children.iter().rev() {
                    stack.push((child, new_tags.clone()));
                }
            }
        }
    }

    // Process any remaining items in batch
    if !bookmark_batch.is_empty() {
        batch_insert(app, &mut bookmark_batch).unwrap();
    }

    Ok(())
}
