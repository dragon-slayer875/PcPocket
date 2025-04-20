use crate::{
    models::BookmarkNew, parser_errors::ParserError, setup::ParserConfig,
    structs::BrowserJsonBookmarkItem,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::Command;

use crate::structs::{ParseFailBookmark, ParsedBookmarkWithTags};

pub struct ParserRegistry {
    pub parsers: HashMap<String, Box<dyn Parser>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParserSuccess {
    successful: Vec<ParsedBookmarkWithTags>,
    failed: Vec<ParseFailBookmark>,
}

impl ParserSuccess {
    pub fn get_successful(&self) -> &Vec<ParsedBookmarkWithTags> {
        &self.successful
    }

    pub fn get_failed(&self) -> &Vec<ParseFailBookmark> {
        &self.failed
    }
}

impl ParserRegistry {
    pub fn new() -> Self {
        Self {
            parsers: HashMap::new(),
        }
    }

    pub fn register(&mut self, name: String, parser: Box<dyn Parser>) -> Result<(), String> {
        if self.parsers.contains_key(&name) {
            return Err(format!("Parser with name '{}' already exists", name));
        }
        self.parsers.insert(name, parser);
        Ok(())
    }

    pub fn get(&self, name: &str) -> Option<&dyn Parser> {
        self.parsers.get(name).map(|p| p.as_ref())
    }

    pub fn list_parsers_for_format(&self, required_format: String) -> Vec<String> {
        self.parsers
            .iter()
            .filter_map(|(name, parser)| {
                if parser
                    .supported_formats()
                    .contains(&required_format.as_str())
                {
                    Some(name.clone())
                } else {
                    None
                }
            })
            .collect()
    }
}

pub trait Parser: Send + Sync {
    fn name(&self) -> &str;
    fn parse(&self, input_path: &str) -> Result<ParserSuccess, ParserError>;
    fn supported_formats(&self) -> Vec<&str>;
    fn info(&self) -> ParserConfig;
}

pub struct PythonParser {
    pub name: String,
    r#type: String,
    path: String,
    supported_formats: Vec<String>,
}

impl PythonParser {
    pub fn new(
        name: &str,
        r#type: &str,
        path: &str,
        supported_formats: &Vec<String>,
    ) -> Result<Self, ParserError> {
        // Validate that the script exists
        if !Path::new(path).exists() {
            return Err(ParserError::FileReadError(format!(
                "Python script not found: {}",
                path
            )));
        }

        Ok(Self {
            name: name.to_string(),
            r#type: r#type.to_string(),
            path: path.to_string(),
            supported_formats: supported_formats.to_vec(),
        })
    }
}

impl Parser for PythonParser {
    fn name(&self) -> &str {
        &self.name
    }

    fn supported_formats(&self) -> Vec<&str> {
        self.supported_formats.iter().map(|s| s.as_str()).collect()
    }

    fn parse(&self, input_path: &str) -> Result<ParserSuccess, ParserError> {
        // Run the Python script as a subprocess
        let output = Command::new("python")
            .arg(&self.path)
            .arg(input_path)
            .output()
            .map_err(|e| ParserError::PythonError(format!("Failed to run Python script: {}", e)))?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(ParserError::PythonError(format!(
                "Python script error: {}",
                error
            )));
        }

        let json_result = String::from_utf8_lossy(&output.stdout);

        let parse_result: ParserSuccess = serde_json::from_str(&json_result).map_err(|e| {
            ParserError::InvalidFormat(format!("Failed to parse script output: {}", e))
        })?;

        Ok(parse_result)
    }

    fn info(&self) -> ParserConfig {
        ParserConfig {
            name: self.name.to_string(),
            r#type: self.r#type.to_string(),
            path: self.path.to_string(),
            supported_formats: self.supported_formats.clone(),
        }
    }
}

// JSON Parser implementation
pub struct BrowserJsonParser {
    name: String,
    r#type: String,
    path: String,
    supported_formats: Vec<String>,
}

impl BrowserJsonParser {
    pub fn new() -> Self {
        BrowserJsonParser {
            name: "Default JSON".to_string(),
            r#type: "default".to_string(),
            path: "In app".to_string(),
            supported_formats: vec!["json".to_string()],
        }
    }
}

impl Parser for BrowserJsonParser {
    fn name(&self) -> &str {
        &self.name
    }

    fn parse(&self, input_path: &str) -> Result<ParserSuccess, ParserError> {
        // Read the file
        let file_content = fs::read_to_string(&input_path);

        // Parse JSON
        let root = match file_content {
            Ok(content) => {
                let bookmarks: BrowserJsonBookmarkItem = serde_json::from_str(&content).unwrap();
                bookmarks
            }
            Err(e) => {
                eprintln!("Error reading file: {}", e);
                return Err(ParserError::FileReadError(format!(
                    "Error reading file: {}",
                    e
                )));
            }
        };

        // Convert to ParseResult

        let mut successful: Vec<ParsedBookmarkWithTags> = Vec::new();
        let failed: Vec<ParseFailBookmark> = Vec::new();

        // Use a stack for traversal
        let mut stack: Vec<(&BrowserJsonBookmarkItem, Vec<String>)> = vec![(&root, vec![])];

        while let Some((current, current_tags)) = stack.pop() {
            match current {
                BrowserJsonBookmarkItem::Link(bookmark_entry) => {
                    // Create the bookmark with tags
                    let bookmark = ParsedBookmarkWithTags {
                        bookmark: BookmarkNew {
                            title: Some(bookmark_entry.base.title.clone()),
                            link: bookmark_entry.uri.clone(),
                            icon_link: Some(bookmark_entry.icon_uri.clone().unwrap_or_default()),
                            created_at: bookmark_entry.base.date_added / 1000,
                        },
                        tags: current_tags.clone(),
                    };

                    // Add the parsed bookmark to our collection
                    successful.push(bookmark);
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

        return Ok(ParserSuccess { successful, failed });
    }

    fn supported_formats(&self) -> Vec<&str> {
        vec!["json"]
    }

    fn info(&self) -> ParserConfig {
        ParserConfig {
            name: self.name.to_string(),
            r#type: self.r#type.to_string(),
            path: self.path.to_string(),
            supported_formats: self.supported_formats.clone(),
        }
    }
}
