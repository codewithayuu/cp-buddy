#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RELEASE="$ROOT/release"
VERSION="1.0.3"

usage() {
  echo "Usage: $0 [-v] [-c] [-f] [-a]"
  echo "  -v    Build VS Code extension"
  echo "  -c    Build Chrome extension"
  echo "  -f    Build Firefox extension"
  echo "  -a    Build all (VS Code + Chrome + Firefox)"
  exit 1
}

[[ $# -eq 0 ]] && usage

BUILD_VSCODE=false
BUILD_CHROME=false
BUILD_FIREFOX=false

while getopts "vcfa" opt; do
  case $opt in
    v) BUILD_VSCODE=true ;;
    c) BUILD_CHROME=true ;;
    f) BUILD_FIREFOX=true ;;
    a) BUILD_VSCODE=true; BUILD_CHROME=true; BUILD_FIREFOX=true ;;
    *) usage ;;
  esac
done

# VS Code extension
if $BUILD_VSCODE; then
  echo ">>> Building VS Code extension..."

  pnpm --filter @cpbuddy/vscode-webview compile
  pnpm --filter @cpbuddy/local-router compile
  pnpm --filter cpbuddy compile

  cp -r "$ROOT/packages/vscode-webview/dist/." "$ROOT/packages/vscode-ext/dist/"
  cp -r "$ROOT/packages/local-router/dist/." "$ROOT/packages/vscode-ext/dist/"

  pnpm --filter cpbuddy package

  mkdir -p "$RELEASE"
  cp "$ROOT/packages/vscode-ext/cpbuddy-$VERSION.vsix" "$RELEASE/"
  echo ">>> Copied VSIX to release/"
fi

# Chrome extension
if $BUILD_CHROME; then
  echo ">>> Building Chrome extension..."

  pnpm --filter @cpbuddy/browser-ext clean
  (cd "$ROOT/packages/browser-ext" && npx wxt zip)

  mkdir -p "$RELEASE"
  cp "$ROOT/packages/browser-ext/dist/cpbuddy-submit-$VERSION-chrome.zip" "$RELEASE/"
  echo ">>> Copied Chrome zip to release/"
fi

# Firefox extension
if $BUILD_FIREFOX; then
  echo ">>> Building Firefox extension..."

  pnpm --filter @cpbuddy/browser-ext clean
  (cd "$ROOT/packages/browser-ext" && npx wxt zip -b firefox)

  mkdir -p "$RELEASE"
  cp "$ROOT/packages/browser-ext/dist/cpbuddy-submit-$VERSION-firefox.zip" "$RELEASE/"
  cp "$ROOT/packages/browser-ext/dist/cpbuddy-submit-$VERSION-sources.zip" "$RELEASE/"
  echo ">>> Copied Firefox zip + sources zip to release/"
fi

echo ">>> Done. Files in $RELEASE:"
ls -lh "$RELEASE"
