#!/usr/bin/env bash
set -uo pipefail

QA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$QA_DIR/../.." && pwd)"
cd "$ROOT" || exit 1

while true; do
  if [ -t 1 ]; then
    clear
  fi

  printf '============================================================\n'
  printf ' WORLD LAYERS WEB - MENU DE PRUEBAS PARA CAPTURAS QA\n'
  printf '============================================================\n'
  printf 'Carpeta: %s\n' "$ROOT"
  printf 'Fecha  : %s\n' "$(date '+%Y-%m-%d %H:%M:%S')"
  printf -- '------------------------------------------------------------\n'
  printf ' 1) 3 funciones unitarias          (20%%)\n'
  printf ' 2) 2 endpoints API                (20%%)\n'
  printf ' 3) 1 pantalla de UI               (20%%)\n'
  printf ' 4) Carpeta de tests + reporte     (20%%)\n'
  printf ' 5) Ejecutar las 4 pruebas y guardar logs\n'
  printf ' 0) Salir\n'
  printf -- '------------------------------------------------------------\n'

  read -r -p "Selecciona una opcion: " option

  case "$option" in
    1) bash "$QA_DIR/01-unitarias.sh" ;;
    2) bash "$QA_DIR/02-api.sh" ;;
    3) bash "$QA_DIR/03-ui.sh" ;;
    4) bash "$QA_DIR/04-carpeta-tests.sh" ;;
    5) NO_CLEAR=1 bash "$QA_DIR/05-todo.sh" ;;
    0) exit 0 ;;
    *)
      printf '\nOpcion invalida.\n'
      sleep 1
      ;;
  esac
done
