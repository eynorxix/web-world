#!/usr/bin/env bash
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

qa_init "PRUEBA 3/4 - PANTALLA DE UI" "1 pantalla UI (20%)"

LOG="docs/evidencias/qa-terminal/03-ui.log"
BROWSER_INFO="$(node tools/default-browser.mjs 2>/dev/null || printf 'Chromium incluido por Playwright (respaldo)')"
HEADED="${HEADED:-1}"
SLOWMO="${PLAYWRIGHT_SLOWMO:-0}"
CAPTURE_DELAY="${QA_CAPTURE_DELAY:-1200}"
PLAY_ARGS=()
MODE="headless"

if [ "$HEADED" = "1" ] && { [ -n "${WAYLAND_DISPLAY:-}" ] || [ -n "${DISPLAY:-}" ]; }; then
  PLAY_ARGS+=(--headed)
  MODE="navegador visible"
  SLOWMO="${PLAYWRIGHT_SLOWMO:-500}"
  export QA_CAPTURE=1
  export QA_CAPTURE_DELAY="$CAPTURE_DELAY"
else
  export QA_CAPTURE=0
fi

export PLAYWRIGHT_SLOWMO="$SLOWMO"

printf 'Herramienta : Playwright + navegador predeterminado\n'
printf 'Navegador   : %s\n' "$BROWSER_INFO"
printf 'Modo        : %s\n' "$MODE"
printf 'Slow motion : %s ms por accion\n' "$SLOWMO"
printf 'Pausa pasos : %s ms\n' "$CAPTURE_DELAY"
cat <<'EOF'
Archivo     : tests/ui/auth-screen.spec.js
Comando     : npx playwright test --headed

Pantalla evaluada:
  index.html -> login / registro -> dashboard.html

Escenarios:
  1. Validacion de datos invalidos en login y registro
  2. Registro exitoso, sesion guardada y dashboard vacio

No cierres la ventana de Brave hasta que termine la prueba.
Ejecutando pruebas de UI en modo captura...
------------------------------------------------------------
EOF

npx playwright test "${PLAY_ARGS[@]}" 2>&1 | tee "$LOG"
status=${PIPESTATUS[0]}

printf '\nCapturas generadas por la prueba:\n'
printf '  docs/evidencias/ui-login.png\n'
printf '  docs/evidencias/ui-dashboard.png\n'

qa_finish "$status" "$LOG"
