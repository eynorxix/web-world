#!/usr/bin/env bash
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

qa_init "PRUEBA 2/4 - API REST FIREBASE" "2 endpoints API (20%)"

LOG="docs/evidencias/qa-terminal/02-api.log"

cat <<'EOF'
Herramienta : Node.js test runner + Firebase Realtime Database REST
Archivo     : tests/api/firebase-users.test.js
Comando     : npm run test:api

Endpoints evaluados:
  1. PUT /users/{userKey}.json
  2. GET /users/{userKey}.json

Casos adicionales del mismo archivo:
  - GET de una clave inexistente (debe responder null)
  - DELETE de limpieza (elimina el usuario temporal)

Ejecutando pruebas de API contra Firebase real...
------------------------------------------------------------
EOF

npm run test:api 2>&1 | tee "$LOG"
status=${PIPESTATUS[0]}

printf '\nResumen: 2 endpoints evaluados, 4 casos ejecutados, limpieza automatica.\n'

qa_finish "$status" "$LOG"
