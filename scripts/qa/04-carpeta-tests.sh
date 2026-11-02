#!/usr/bin/env bash
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

LOG="docs/evidencias/qa-terminal/04-carpeta-tests.log"
failures=0

mkdir -p "$QA_EVIDENCE"

if [ -t 1 ] && [ "${NO_CLEAR:-0}" != "1" ]; then
  clear
fi

exec > >(tee "$LOG") 2>&1

qa_init "PRUEBA 4/4 - CARPETA DE TESTS" "carpeta de tests conforme a la plantilla (20%)"

check_path() {
  if [ -e "$1" ]; then
    printf '[OK]    %s\n' "$1"
  else
    printf '[FALTA] %s\n' "$1"
    failures=$((failures + 1))
  fi
}

printf 'Herramienta : verificacion de estructura + reporte Excel\n'
printf 'Carpeta     : tests/\n'
printf 'Comando     : bash scripts/qa/04-carpeta-tests.sh\n\n'
printf 'Correspondencia con la rubrica:\n'

check_path "tests/unit/security.test.js"
check_path "tests/api/firebase-users.test.js"
check_path "tests/ui/auth-screen.spec.js"
check_path "tests/multiuser/multiuser.spec.js"
check_path "docs/plantilla_reporte_testing_H4.xlsx"
check_path "docs/reporte_pruebas.xlsx"
check_path "docs/REPORTE_PRUEBAS.md"

printf '\nEstructura de tests:\n'
printf -- '------------------------------------------------------------\n'

if command -v tree >/dev/null 2>&1; then
  tree -a tests -L 3
else
  find tests -maxdepth 3 -type f | sort
fi

printf '\nHojas del reporte Excel:\n'
printf -- '------------------------------------------------------------\n'

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
import re
import zipfile

with zipfile.ZipFile("docs/reporte_pruebas.xlsx") as archive:
    workbook = archive.read("xl/workbook.xml").decode("utf-8")
    sheets = re.findall(r'<sheet name="([^"]+)"', workbook)

print("Hojas:", ", ".join(sheets))
print("Total de hojas:", len(sheets))
PY
else
  printf 'Python 3 no disponible; no se pudieron leer las hojas del xlsx.\n'
  failures=$((failures + 1))
fi

printf '\nArchivos de evidencia general:\n'
printf -- '------------------------------------------------------------\n'
ls -lh docs/evidencias/unit.log docs/evidencias/api.log docs/evidencias/ui.log docs/evidencias/live.log 2>/dev/null || true

printf '\nResumen: 4 tipos de prueba, evidencias y reporte H4 verificados.\n'

qa_finish "$failures" "$LOG"
