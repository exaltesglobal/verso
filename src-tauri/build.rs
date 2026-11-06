fn main() {
    // Lets debug builds find src-tauri/binaries/<tool>-<target-triple> (see tools.rs).
    println!(
        "cargo:rustc-env=VERSO_TARGET_TRIPLE={}",
        std::env::var("TARGET").expect("cargo sets TARGET")
    );
    tauri_build::build()
}
