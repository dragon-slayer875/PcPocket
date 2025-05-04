# Start with the latest Arch Linux base image
FROM archlinux:latest

# Update the system and install necessary dependencies
RUN pacman -Syu --noconfirm && \
    pacman -S --noconfirm \
    base-devel \
    git \
    nodejs \
    npm \
    rust \
    cargo \
    webkit2gtk-4.1 \
    libappindicator-gtk3 \
    librsvg \
    openssl \
    appmenu-gtk-module \
    curl \
    wget \
    python \
    xdg-utils \
    file 

# Create and set working directory
WORKDIR /app

# Copy everything from the current directory to the container
COPY . .

# Install npm dependencies
RUN npm install

# Build the Tauri application and copy the output
CMD sh -c "NO_STRIP=true npm run tauri build -- -b appimage && \
    cp -v src-tauri/target/release/bundle/appimage/*.AppImage /github/workspace/ || \
    echo 'Build output not found. Check build logs for errors.'"
