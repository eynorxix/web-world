#!/usr/bin/env bash
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

LOG="docs/evidencias/qa-terminal/05-todo.log"
failures=0

mkdir -p "$QA_EVIDENCE"

if [ -t 1 ] && [ "${NO_CLEAR:-0}" != "1" ]; then
  clear
fi

exec > >(tee "$LOG") 2>&1

qa_init "VALIDACION COMPLETA - 4 CRITERIOS" "unitarias + API + UI + carpeta de tests"

run_script() {
  local script="$1"

  printf '\n============================================================\n'
  printf ' EJECUTANDO: %s\n' "$script"
  printf '============================================================\n'

  NO_PAUSE=1 NO_CLEAR=1 bash "scripts/qa/$script"
  local status=$?

  if [ "$status" -ne 0 ]; then
    failures=$((failures + 1))
  fi
}

run_script "01-unitarias.sh"
run_script "02-api.sh"
run_script "03-ui.sh"
run_script "04-carpeta-tests.sh"

printf '\n============================================================\n'
printf ' RESUMEN GENERAL\n'
printf '============================================================\n'

if [ "$failures" -eq 0 ]; then
  printf 'RESULTADO FINAL: PASA\n'
else
  printf 'RESULTADO FINAL: FALLA (%s criterios con error)\n' "$failures"
fi

printf 'Logs: docs/evidencias/qa-terminal/\n'

qa_finish "$failures" "$LOG"
