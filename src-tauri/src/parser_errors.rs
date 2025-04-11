use std::error::Error;
use std::fmt;
use std::io;

#[derive(Debug)]
pub enum ParserError {
    FileReadError(String),
    InvalidFormat(String),
    MissingField(String),
    ConfigError(String),
    PythonError(String),
    LuaError(String),
    IoError(io::Error),
}

impl fmt::Display for ParserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParserError::FileReadError(msg) => write!(f, "File read error: {}", msg),
            ParserError::InvalidFormat(msg) => write!(f, "Invalid format: {}", msg),
            ParserError::MissingField(field) => write!(f, "Missing required field: {}", field),
            ParserError::ConfigError(msg) => write!(f, "Configuration error: {}", msg),
            ParserError::PythonError(msg) => write!(f, "Python error: {}", msg),
            ParserError::LuaError(msg) => write!(f, "Lua error: {}", msg),
            ParserError::IoError(e) => write!(f, "IO error: {}", e),
        }
    }
}

impl Error for ParserError {}

// Implement From traits for various error types
impl From<io::Error> for ParserError {
    fn from(err: io::Error) -> Self {
        ParserError::IoError(err)
    }
}

impl From<mlua::Error> for ParserError {
    fn from(err: mlua::Error) -> Self {
        ParserError::LuaError(err.to_string())
    }
}

impl From<pyo3::PyErr> for ParserError {
    fn from(err: pyo3::PyErr) -> Self {
        ParserError::PythonError(err.to_string())
    }
}

impl From<String> for ParserError {
    fn from(s: String) -> Self {
        ParserError::ConfigError(s)
    }
}

impl From<&str> for ParserError {
    fn from(s: &str) -> Self {
        ParserError::ConfigError(s.to_string())
    }
}
