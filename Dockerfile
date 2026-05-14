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
RUN cargo build --release --bin raqim-core

# ====================================
# STAGE 2: THE RUNTIME (The Distroless Void)
# ====================================
# We abandon the heavy rust container. We use Google's 'distroless/cc'
# It contains NO shells, NO package manager, NO coreutils. 
FROM gcr.io/distroless/cc-debian12

# Establishing the Mount Point for the Brain and Memory 
VOLUME ["/var/lib/raqim/data"]

# Set the working directory for the OS data
WORKDIR /var/lib/raqim

# Physically extract ONLY the compiled binary from Stage 1.
COPY --from=builder /usr/src/raqim/target/release/raqim-core /usr/local/bin/raqim-core

# Expose the TCP Firehose (8080), Zenoh Mesh (7447) and HTTP Admin (8081)
EXPOSE 8080 7447 8081

# The container execute the binary directly 
ENTRYPOINT ["/usr/local/bin/raqim-core"]
