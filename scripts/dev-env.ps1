# Build environment for Verso on Windows (captions engine needs CMake + libclang).
# Usage: . .\scripts\dev-env.ps1   (dot-source, then run pnpm tauri dev)
$env:Path = "$env:USERPROFILE\.cargo\bin;C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin;" + $env:Path
if (-not $env:LIBCLANG_PATH) { $env:LIBCLANG_PATH = "C:\vt\libclang\x\libclang-18.1.1.data\platlib\clang\native" }
# MSBuild fails on very long paths; build in a short target dir.
if (-not $env:CARGO_TARGET_DIR) { $env:CARGO_TARGET_DIR = "C:\vt\verso-target" }