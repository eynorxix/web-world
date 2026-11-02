#!/usr/bin/env bash

QA_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
QA_EVIDENCE="$QA_ROOT/docs/evidencias/qa-terminal"

qa_init() {
  local title="$1"
  local criterion="$2"

  mkdir -p "$QA_EVIDENCE"
  cd "$QA_ROOT" || exit 1

  if [ -t 1 ] && [ "${NO_CLEAR:-0}" != "1" ]; then
    clear
  fi

  printf '============================================================\n'
  printf ' WORLD LAYERS WEB - %s\n' "$title"
  printf '============================================================\n'
  printf 'Criterio : %s\n' "$criterion"
  printf 'Fecha    : %s\n' "$(date '+%Y-%m-%d %H:%M:%S')"
  printf 'Equipo   : %s\n' "$(uname -sr)"
  printf 'Node     : %s | npm %s\n' "$(node -v 2>/dev/null || printf 'no disponible')" "$(npm -v 2>/dev/null || printf 'no disponible')"
  printf 'Carpeta  : %s\n' "$QA_ROOT"
  printf -- '------------------------------------------------------------\n\n'
}

qa_pause() {
  if [ -t 0 ] && [ "${NO_PAUSE:-0}" != "1" ]; then
    printf '\nToma la captura de esta salida.\n'
    printf 'Presiona Enter para continuar...'
    read -r _
    printf '\n'
  fi
}

qa_finish() {
  local status="$1"
  local log="$2"

  printf '\n------------------------------------------------------------\n'

  if [ "$status" -eq 0 ]; then
    printf 'RESULTADO: PASA\n'
  else
    printf 'RESULTADO: FALLA (codigo %s)\n' "$status"
  fi

  printf 'Evidencia: %s\n' "$log"
  printf -- '------------------------------------------------------------\n'
  qa_pause
  exit "$status"
}
