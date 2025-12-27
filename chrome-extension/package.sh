#!/bin/bash
set -e

# Move to script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DIST_DIR="dist"
ZIP_NAME="extension.zip"

# Check dist directory
if [ ! -d "$DIST_DIR" ]; then
    echo "❌ Error: '$DIST_DIR' directory not found."
    echo "👉 Run 'npm run build' first."
    exit 1
fi

# Check manifest.json exists in dist root
if [ ! -f "$DIST_DIR/manifest.json" ]; then
    echo "❌ Error: manifest.json not found in '$DIST_DIR'."
    echo "👉 Chrome requires manifest.json at ZIP root."
    exit 1
fi

# Remove old zip
if [ -f "$ZIP_NAME" ]; then
    echo "🧹 Removing old $ZIP_NAME..."
    rm -f "$ZIP_NAME"
fi

# Create zip (contents of dist, not the folder)
echo "📦 Creating $ZIP_NAME..."
cd "$DIST_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store"

# Back to project root
cd "$SCRIPT_DIR"

echo "-----------------------------------"
echo "✅ Chrome Extension package ready:"
echo "📍 $SCRIPT_DIR/$ZIP_NAME"
