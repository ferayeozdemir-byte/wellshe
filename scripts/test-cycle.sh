#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TMP_DIR=".cycle-test-dist"
rm -rf "$TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

if [ -x "./node_modules/.bin/tsc" ]; then
  TSC="./node_modules/.bin/tsc"
else
  echo "HATA: TypeScript compiler bulunamadı. Önce npm install çalıştırılmalı."
  exit 1
fi

"$TSC" lib/cycle.ts \
  --target ES2020 \
  --module commonjs \
  --outDir "$TMP_DIR" \
  --skipLibCheck

node tests/cycle-regression.cjs
