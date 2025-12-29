#!/bin/bash

# Rebuild Web App Script
# Usage: ./rebuild-web.sh [dev|prod]

set -e  # Exit on error

FLAVOR="${1:-dev}"  # Default to dev if not specified

if [ "$FLAVOR" != "dev" ] && [ "$FLAVOR" != "prod" ]; then
  echo "❌ Error: Flavor must be 'dev' or 'prod'"
  echo "Usage: ./rebuild-web.sh [dev|prod]"
  exit 1
fi

echo "🔨 Rebuilding web app for $FLAVOR..."

# Clean previous build
echo "🧹 Cleaning previous build..."
flutter clean

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Build web
echo "🌐 Building web app..."
if [ "$FLAVOR" == "dev" ]; then
  flutter build web -t lib/main_dev.dart
else
  flutter build web -t lib/main_prod.dart
fi

echo "✅ Build complete! Output: build/web/"
echo ""
echo "To test locally, run:"
echo "  flutter run -d chrome -t lib/main_${FLAVOR}.dart"
echo ""
echo "Or use the Makefile:"
echo "  make gen_web_${FLAVOR}"

