#!/usr/bin/env bash
# Builds a self-contained LGPL FFmpeg (ffmpeg + ffprobe) for the macOS host architecture.
# All third-party libraries are built from source as static libs, so the binaries only link
# system frameworks (/usr/lib, /System) and run on macOS 11+ without Homebrew.
#
# Usage: scripts/build-ffmpeg-macos.sh <out-dir>
# Output: <out-dir>/ffmpeg, <out-dir>/ffprobe, <out-dir>/FFMPEG-LICENSE.txt
# Needs: Xcode command line tools, pkg-config, nasm, meson, ninja (brew install pkg-config nasm meson ninja).
set -euo pipefail

OUT="$(mkdir -p "$1" && cd "$1" && pwd)"
WORK="${WORK:-$PWD/.ffmpeg-build}"
PREFIX="$WORK/prefix"
JOBS="$(sysctl -n hw.ncpu)"

FFMPEG_VERSION=7.1.1
OPUS_VERSION=1.5.2
VPX_VERSION=1.15.0
FREETYPE_VERSION=2.13.3
FRIBIDI_VERSION=1.0.16
HARFBUZZ_VERSION=10.1.0
LIBASS_VERSION=0.17.3

export MACOSX_DEPLOYMENT_TARGET=11.0
export CFLAGS="-O2 -mmacosx-version-min=11.0"
export CXXFLAGS="$CFLAGS"
export LDFLAGS="-mmacosx-version-min=11.0"
# Only our own .pc files: Homebrew libraries must never leak into the build as dylibs.
export PKG_CONFIG_LIBDIR="$PREFIX/lib/pkgconfig"
unset PKG_CONFIG_PATH

case "$(uname -m)" in
  arm64) VPX_TARGET=arm64-darwin20-gcc ;;
  x86_64) VPX_TARGET=x86_64-darwin20-gcc ;;
  *) echo "unsupported arch $(uname -m)"; exit 1 ;;
esac

mkdir -p "$WORK/src" "$PREFIX"
cd "$WORK/src"

fetch() { # url dir
  [ -d "$2" ] && return
  curl -fsSL --retry 3 "$1" -o "$2.tar"
  mkdir "$2" && tar -xf "$2.tar" -C "$2" --strip-components 1
}

fetch "https://downloads.xiph.org/releases/opus/opus-$OPUS_VERSION.tar.gz" opus
fetch "https://github.com/webmproject/libvpx/archive/refs/tags/v$VPX_VERSION.tar.gz" libvpx
fetch "https://downloads.sourceforge.net/project/freetype/freetype2/$FREETYPE_VERSION/freetype-$FREETYPE_VERSION.tar.xz" freetype
fetch "https://github.com/fribidi/fribidi/releases/download/v$FRIBIDI_VERSION/fribidi-$FRIBIDI_VERSION.tar.xz" fribidi
fetch "https://github.com/harfbuzz/harfbuzz/releases/download/$HARFBUZZ_VERSION/harfbuzz-$HARFBUZZ_VERSION.tar.xz" harfbuzz
fetch "https://github.com/libass/libass/releases/download/$LIBASS_VERSION/libass-$LIBASS_VERSION.tar.xz" libass
fetch "https://ffmpeg.org/releases/ffmpeg-$FFMPEG_VERSION.tar.xz" ffmpeg

(cd opus && ./configure --prefix="$PREFIX" --disable-shared --enable-static --disable-doc --disable-extra-programs \
  && make -j"$JOBS" && make install)

(cd libvpx && ./configure --prefix="$PREFIX" --target="$VPX_TARGET" --disable-shared --enable-static --enable-pic \
  --disable-examples --disable-tools --disable-docs --disable-unit-tests --enable-vp9-highbitdepth \
  && make -j"$JOBS" && make install)

(cd freetype && ./configure --prefix="$PREFIX" --disable-shared --enable-static \
  --without-zlib --without-bzip2 --without-png --without-harfbuzz --without-brotli \
  && make -j"$JOBS" && make install)

meson_build() { # dir options...
  local d="$1"; shift
  (cd "$d" && meson setup build --prefix="$PREFIX" --libdir=lib --default-library=static --buildtype=release "$@" \
    && ninja -C build && ninja -C build install)
}
meson_build fribidi -Ddocs=false -Dbin=false -Dtests=false
meson_build harfbuzz -Dfreetype=enabled -Dglib=disabled -Dgobject=disabled -Dcairo=disabled -Dicu=disabled \
  -Dchafa=disabled -Dgraphite2=disabled -Dtests=disabled -Ddocs=disabled -Dutilities=disabled -Dintrospection=disabled

(cd libass && ./configure --prefix="$PREFIX" --disable-shared --enable-static --disable-fontconfig \
  --disable-require-system-font-provider --disable-asm --disable-libunibreak \
  && make -j"$JOBS" && make install)

# LGPL only: no --enable-gpl / --enable-version3 / --enable-nonfree. --disable-autodetect keeps
# Homebrew libraries (lzma, sdl2, ...) out; everything wanted is enabled explicitly.
CONFIGURE_FLAGS=(
  --prefix="$PREFIX" --pkg-config-flags=--static --disable-autodetect
  --disable-gpl --disable-nonfree --disable-doc --disable-ffplay --disable-debug
  --enable-zlib --enable-bzlib --enable-iconv --enable-securetransport
  --enable-videotoolbox --enable-audiotoolbox
  --enable-libass --enable-libfreetype --enable-libfribidi --enable-libharfbuzz
  --enable-libvpx --enable-libopus
  --extra-cflags="$CFLAGS -I$PREFIX/include" --extra-ldflags="$LDFLAGS -L$PREFIX/lib" --extra-libs=-lc++
)
(cd ffmpeg && ./configure "${CONFIGURE_FLAGS[@]}" && make -j"$JOBS")

cp ffmpeg/ffmpeg ffmpeg/ffprobe "$OUT/"
strip "$OUT/ffmpeg" "$OUT/ffprobe"

# Checks: LGPL build, no non-system dylibs, wanted features present.
for b in ffmpeg ffprobe; do
  if otool -L "$OUT/$b" | tail -n +2 | grep -vE '^\s*(/usr/lib/|/System/)'; then
    echo "$b links non-system libraries (above)"; exit 1
  fi
done
"$OUT/ffmpeg" -hide_banner -version | tee "$WORK/version.txt"
if grep -q -- '--enable-gpl' "$WORK/version.txt"; then echo "GPL build"; exit 1; fi
# Captured first: grep -q on a pipe can SIGPIPE ffmpeg and trip pipefail.
lic="$("$OUT/ffmpeg" -hide_banner -L)"; enc="$("$OUT/ffmpeg" -hide_banner -encoders)"; flt="$("$OUT/ffmpeg" -hide_banner -filters)"
grep -q 'Lesser General Public License' <<<"$lic" || { echo "not LGPL"; exit 1; }
for e in h264_videotoolbox libvpx-vp9 libopus aac; do grep -qw -- "$e" <<<"$enc" || { echo "missing encoder $e"; exit 1; }; done
for f in ass subtitles drawtext loudnorm arnndn; do grep -qw -- "$f" <<<"$flt" || { echo "missing filter $f"; exit 1; }; done

{
  echo "Verso ships FFmpeg $FFMPEG_VERSION for macOS ($(uname -m)), built under the GNU LGPL v2.1 or later."
  echo "Source: https://ffmpeg.org/releases/ffmpeg-$FFMPEG_VERSION.tar.xz"
  echo "Build script: scripts/build-ffmpeg-macos.sh in the Verso repository."
  echo "Configured with: ${CONFIGURE_FLAGS[*]}" | sed "s#$PREFIX#<prefix>#g"
  echo "Statically linked: opus $OPUS_VERSION (BSD), libvpx $VPX_VERSION (BSD), freetype $FREETYPE_VERSION (FTL),"
  echo "fribidi $FRIBIDI_VERSION (LGPL 2.1), harfbuzz $HARFBUZZ_VERSION (MIT), libass $LIBASS_VERSION (ISC)."
  echo "You may replace these binaries with your own build of the same FFmpeg source."
  for f in ffmpeg/COPYING.LGPLv2.1 opus/COPYING libvpx/LICENSE freetype/docs/FTL.TXT fribidi/COPYING harfbuzz/COPYING libass/COPYING; do
    printf '\n\n===== %s =====\n\n' "$f"
    cat "$f"
  done
} > "$OUT/FFMPEG-LICENSE.txt"
echo "FFmpeg built into $OUT"
