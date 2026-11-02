#!/usr/bin/env bash
set -euo pipefail

mkdir -p docs/evidencias/multiusuario

export NO_COLOR=1

npm run test:multiuser 2>&1 | tee docs/evidencias/multiusuario/multiuser.log

echo "Evidencias multiusuario guardadas en docs/evidencias/multiusuario/"
