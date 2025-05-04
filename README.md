# ![PCPocket Banner](https://github.com/user-attachments/assets/98e1ef3f-9e2d-47bc-8e6a-0a6f26b7ea36)

A cross-platform, lightning fast and offline-first bookmark manager built with Tauri, React, and Vite.

![PcPocket screenshot](https://github.com/user-attachments/assets/eebf43a1-9f1e-4707-89e2-549e9792a909)

## Overview

PCPocket is a modern bookmark management solution designed to work seamlessly across all major desktop platforms. Unlike traditional browser-based bookmarks, PCPocket stores your bookmarks locally in SQLite, ensuring you always have access to your important links even without an internet connection.

## Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Browser Extension**: Available for Firefox and Chromium-based browsers (Chrome, Edge, Brave, Zen, Waterfox etc.)
- **Offline-First**: All bookmarks stored locally in SQLite database with optional cloud sync
- **Lightning fast**: Operate over 100,000+ bookmarks instantly
- **Modern UI**: Built with React for a responsive and intuitive user experience
- **Tag System**: Organize bookmarks with customizable tags and categories
- **Quick Search**: Find bookmarks by title and tags
- **Data Export/Import**: Seamlessly migrate from browser bookmarks
- **Privacy-Focused**: Your data stays on your device by default

## Installation

### Desktop Application

Pre-built installers are available for:

- Windows (.exe)
- Linux (.deb, .AppImage, .rpm)

> [!NOTE]
> Due to some inconsistencies in Tauri's current build system, all builds except AppImages suffer from a performance hit.

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

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](LICENSE) file for details.

---

## Contact

Profile Link: [https://github.com/dragon-slayer875](https://github.com/dragon-slayer875)

## Roadmap

- Mobile companion app
- Sync options with end-to-end encryption
