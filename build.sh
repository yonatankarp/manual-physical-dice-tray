#!/bin/bash
set -e
if ! command -v jq >/dev/null 2>&1; then
  echo "jq required but not found. Install it."
  exit 1
fi
VERSION=$(jq -r '.version' module.json)
ZIPNAME="manual-physical-dice-tray-v${VERSION}.zip"
rm -f "$ZIPNAME"
zip -r "$ZIPNAME" module.json scripts styles README.md
echo "Built $ZIPNAME"
