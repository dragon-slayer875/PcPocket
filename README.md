# ![PCPocket Banner](https://github.com/user-attachments/assets/98e1ef3f-9e2d-47bc-8e6a-0a6f26b7ea36)

A cross-platform, lightning fast and offline-first bookmark manager built with Tauri, React, and Vite.

![PcPocket screenshot](https://github.com/user-attachments/assets/eebf43a1-9f1e-4707-89e2-549e9792a909)

## Overview

PcPocket is a modern bookmark management solution designed to work seamlessly across all major desktop platforms. Unlike traditional browser-based bookmarks, PcPocket stores your bookmarks locally in SQLite, ensuring you always have access to your important links even without an internet connection.

## Features

- **Cross-Platform**: Works on Windows and Linux
- **Browser Extension**: Available for Firefox and Chromium-based browsers (Chrome, Edge, Brave, Zen, Waterfox etc.)
- **Offline-First**: All bookmarks stored locally in SQLite database
- **Lightning fast**: Operate over 100,000+ bookmarks instantly
- **Modern UI**: Built with React for a responsive and intuitive user experience
- **Tag System**: Organize bookmarks with customizable tags and categories
- **Quick Search**: Find bookmarks by title and tags
- **Data Export/Import**: Seamlessly migrate from browser bookmarks
- **Custom Parsers**: Use custom parsers to import data from your own sources
- **Lightweight**: Minimal system resource usage
- **Hotswappable Config**: Change settings without restarting the app

## Installation

### Desktop Application

Pre-built installers are available for:

- Windows (.exe)
- Linux (.deb, .AppImage, .rpm)

> [!NOTE]
> Due to some inconsistencies in Tauri's current build system, all Windows builds crash when displaying unpaginated 20K+ rows.

Visit the [releases page](https://github.com/dragon-slayer875/PcPocket/releases) to download the appropriate version.

### Browser Extension

The PCPocket extension is available for:

- Edge, Brave, and other Chromium-based browsers
- Zen, Waterfox, and other firefox based browsers

[Source](https://github.com/dragon-slayer875/pcpocket-extension) [Download](https://github.com/dragon-slayer875/pcpocket-extension/releases)

### Build from Source / Contribute

[Prerequisites](https://tauri.app/start/prerequisites/)

```bash
# Clone the repository
git clone https://github.com/dragon-slayer875/PcPocket.git
cd PcPocket

# Install dependencies
npm install

# Development
npm run tauri dev

# Build for production
npm run tauri build
```

## Technical Details

### Data Storage

PCPocket uses SQLite for local storage, providing:

- Efficient data storage with minimal footprint
- Fast search and retrieval operations
- Data integrity and reliability
- Easy backup and portability

### Search Capabilities

The current version supports searching by:

- Bookmark titles
- Tags

Tested to operate flawlessly on over 100,000+ rows, with room for more!

### Custom Parsers

PCPocket allows you to create custom parsers for importing data from various sources. This feature is designed for advanced users who want to integrate their own data formats into the application.
To create a custom parser, follow these steps:

1. Create a python script that reads your data source and outputs it to stdout in the following format:

```json
{
  "successful": [
    {
      "title": "Bookmark Title" (optional),
      "link": "https://example.com",
      "icon_link": "https://example_icon.com" (optional),
      "created_at": <UTC timestamp>,
      "tags": ["tag1", "tag2"],
    },
    ...
  ],
  "failed": [
    {
      "index": <index of the failed item>,
      "item": "Item that failed to parse",
      "error": "Error message"
    },
    ...
  ]
}
```

2. Use the config options in app to add the parser to the list of parsers.
   Or add your parser to the config file located at:

```bash
config/com.pcpocket.app/config.json
(config is the standard config directory for your OS)

# Format:
{
  "parsers": [
    {
      "name": "Parser Name",
      "type": "python", (more types coming soon)
      "path": "/path/to/your/parser.py",
      "supportedFormats": ["file_format1", "file_format2"],
    },
    ...
  ]
}
```

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](LICENSE) file for details.

---

## Contact

Profile Link: [https://github.com/dragon-slayer875](https://github.com/dragon-slayer875)

## Roadmap

- Mobile companion app
- Sync options with end-to-end encryption
