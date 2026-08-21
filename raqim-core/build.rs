fn main() {
    // Compile glibc compatibility shim for older Linux distributions
    #[cfg(target_os = "linux")]
    {
        cc::Build::new()
            .file("c_src/glibc_compat.c")
            .compile("glibc_compat");
    }
}
