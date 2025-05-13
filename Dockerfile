# Start with the latest Arch Linux base image
FROM archlinux:latest as arch-builder

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
RUN NO_STRIP=true npm run tauri build -- -b appimage,deb

# Second stage: Fedora for RPM build
FROM fedora:latest as fedora-builder

# Update the system and install necessary dependencies
RUN dnf update -y && \
    dnf install -y webkit2gtk4.1-devel \
    openssl-devel \
    curl \
    wget \
    file \
    gcc \
    gcc-c++ \
    make \
    git \
    nodejs \
    npm \
    rust \
    cargo \
    python3-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel

# Create and set working directory
WORKDIR /app

# Copy everything from the current directory to the container
COPY . .

# Install npm dependencies
RUN npm install

# Build the Tauri application as RPM
RUN npm run tauri build -- -b rpm

# Final stage: Copy builds from both images
FROM alpine:latest

# Create output directory
WORKDIR /output

# Copy the AppImage from the arch-builder
COPY --from=arch-builder /app/src-tauri/target/release/bundle/appimage/*.AppImage /output/

# Copy the Deb from the arch-builder
COPY --from=arch-builder /app/src-tauri/target/release/bundle/deb/*.deb /output/

# Copy the RPM from the fedora-builder
COPY --from=fedora-builder /app/src-tauri/target/release/bundle/rpm/*.rpm /output/

# Create an entrypoint script to copy files to the # Create an entrypoint script to copy files to the host
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'echo "Copying built artifacts to mounted directory..."' >> /entrypoint.sh && \
    echo 'cp -v /output/* /mnt/' >> /entrypoint.sh && \
    echo 'echo "Build artifacts copied successfully!"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
