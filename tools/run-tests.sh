#!/usr/bin/env bash
set -euo pipefail

mkdir -p docs/evidencias

export NO_COLOR=1

npm run test:unit 2>&1 | tee docs/evidencias/unit.log
npm run test:api 2>&1 | tee docs/evidencias/api.log
npm run test:ui 2>&1 | tee docs/evidencias/ui.log

echo "Evidencias guardadas en docs/evidencias/"
