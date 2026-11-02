#!/usr/bin/env bash
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

qa_init "PRUEBA 1/4 - FUNCIONES UNITARIAS" "3 funciones unitarias (20%)"

LOG="docs/evidencias/qa-terminal/01-unitarias.log"

cat <<'EOF'
Herramienta : Node.js test runner (node:test)
Archivo     : tests/unit/security.test.js
Comando     : npm run test:unit

Funciones evaluadas:
  1. validateEmail()
  2. validatePassword()
  3. hashPassword()

Ejecutando pruebas unitarias...
------------------------------------------------------------
EOF

npm run test:unit 2>&1 | tee "$LOG"
status=${PIPESTATUS[0]}

printf '\nResumen: 3 funciones, 10 casos, 3 suites.\n'

qa_finish "$status" "$LOG"
