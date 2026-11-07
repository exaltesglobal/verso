#!/usr/bin/env bash
# Builds ONNX Runtime as static libraries for Intel Macs, where `ort` has no prebuilt binaries.
# Point ORT_LIB_LOCATION at the printed directory and `ort` links it statically into Verso.
#
# Usage: scripts/build-onnxruntime-macos.sh <out-dir>
# Output: <out-dir>/Release/*.a plus <out-dir>/Release/_deps/**.a (the layout ort-sys expects).
# Needs: Xcode command line tools, cmake, python3. Takes about an hour on a 4-core runner.
set -euo pipefail

ORT_VERSION=1.31.0 # must match the ONNX Runtime version of the `ort` crate (ort 2.0.0-rc.15)
OUT="$(mkdir -p "$1" && cd "$1" && pwd)"
WORK="${WORK:-$PWD/.ort-build}"

mkdir -p "$WORK"
[ -d "$WORK/onnxruntime" ] || git clone --depth 1 --branch "v$ORT_VERSION" https://github.com/microsoft/onnxruntime.git "$WORK/onnxruntime"
cd "$WORK/onnxruntime"
./build.sh --config Release --build_dir "$WORK/build" --parallel --skip_tests --skip_submodule_sync \
  --compile_no_warning_as_error --cmake_extra_defines CMAKE_OSX_ARCHITECTURES="$(uname -m)" \
  onnxruntime_BUILD_UNIT_TESTS=OFF onnxruntime_USE_TELEMETRY=OFF
# re2 backs the RegexFullMatch kernel but is not part of the default targets in 1.31.
cmake --build "$WORK/build/Release" --target re2 --parallel

# Keep only the static libraries, in the same layout.
cd "$WORK/build"
find Release -name '*.a' -print0 | while IFS= read -r -d '' f; do
  mkdir -p "$OUT/$(dirname "$f")" && cp "$f" "$OUT/$f"
done
ls "$OUT/Release/libonnxruntime_common.a" "$OUT/Release/_deps/re2-build/libre2.a" >/dev/null
echo "ORT_LIB_LOCATION=$OUT/Release"
