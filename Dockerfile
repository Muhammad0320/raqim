# ====================================
# STAGE 1: The Builder (The Heavy Anvil)
# ====================================
# The official, heavy Rust image to compile the OS.
FROM rust:1.77-bookworm AS builder

# Create a sterile working Dir
WORKDIR /usr/src/raqim

# Copy the entire repo into a clean room
COPY . .

# The bleeding-edge sparse registry protocol for fast crate fetching



# Create dummy files to build and cache the dependencies 
RUN mkdir -p raqim-core/src && echo "fn main() {}" > raqim-core/src/main.rs && \
    mkdir -p raqim-mcp/src && echo "fn main() {}" > raqim-mcp/src/main.rs && \
    cargo build --release --target x86_64-unknown-linux-musl || true

# Copy the actual source code and compile the real binary
COPY . .

# We touch the files to force Cargo to rebuild them, bypassing the dummmy cache
RUN touch raqim-core/src/main.rs && \
    cargo build --release --target x86_64-unknown-linux-musl --bin raqim-core 

# STAGE 2: The Void (Distroless runtime)
# Contains NO shell, NO package manager, just root certificates.
FROM gcr.io/distroless/static-debian12

# copy the statically compiled Rust binary from the builder.
