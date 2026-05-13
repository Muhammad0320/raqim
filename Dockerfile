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
ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse

# Compile the daemon with extreme optimizations
RUN cargo build --release --bin raqim-daemon

# ====================================
# STAGE 2: THE RUNTIME (The Distroless Void)
# ====================================
# We abandon the heavy rust container. We use Google's 'distroless/cc'
# It contains NO shells, NO package manager, NO coreutils. 
FROM gcr.io/distroless/cc-debian12

# Set the working directory for the OS data
WORKDIR /var/lib/raqim

# Physically extract ONLY the compiled binary from Stage 1.
COPY --from=builder /usr/src/raqim/target/release/raqim-daemon /usr/local/bin/raqim-daemon

# Expose the TCP Firehose (8080), Zenoh Mesh (7447) and HTTP Admin (8081)
EXPOSE 8080 7447 8081

# The container execute the binary directly 
ENTRYPOINT ["/usr/local/bin/raqim-daemon"]


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
