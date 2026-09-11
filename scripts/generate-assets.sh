#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="assets/social/hero-2400.jpg"

MAGICK_BIN="$(command -v magick || command -v convert)"
if [ -z "$MAGICK_BIN" ]; then
  echo "ImageMagick is required." >&2
  exit 1
fi

"$MAGICK_BIN" "$SRC" -resize 1200x630! -strip -quality 85 -interlace plane assets/social/hero-1200.jpg
"$MAGICK_BIN" "$SRC" -resize 2400x1260! -strip -quality 80 -interlace plane assets/social/hero-2400.jpg
"$MAGICK_BIN" "$SRC" -gravity center -crop 411x411+0+0 +repage \
  -sigmoidal-contrast 3x25% -resize 32x32 assets/favicon-32.png
"$MAGICK_BIN" "$SRC" -gravity center -crop 411x411+0+0 +repage \
  -sigmoidal-contrast 3x25% -resize 180x180 assets/apple-touch-icon.png

echo "assets: hero-1200/2400.jpg, favicon-32.png, apple-touch-icon.png regenerated"