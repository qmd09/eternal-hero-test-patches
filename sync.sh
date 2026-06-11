#!/bin/bash
MSG=${1:-"update"}
cd "$(dirname "$0")"
git add .
git commit -m "$MSG"
git push
echo "✓ Pushed: $MSG"
