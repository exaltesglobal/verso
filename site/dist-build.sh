#!/bin/sh
# Build the deployable static site into site/dist/
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/img
python3 src/build-mock.py dist/index.html
python3 src/build-pages.py dist --strict
cp public/img/*.webp dist/img/; cp public/img/*.mp4 dist/img/ 2>/dev/null || true
cp public/robots.txt public/waitlist.php public/.htaccess public/favicon-32.png public/apple-touch-icon.png public/og.png dist/
