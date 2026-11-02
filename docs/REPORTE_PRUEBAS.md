# Reporte de pruebas — World Layers Web

Fecha de ejecución: **2026-11-01**

## Resumen

| Tipo | Casos | Resultado |
|---|---:|---|
| Unitarias | 10 | 10 pasan, 0 fallan |
| API REST Firebase | 3 subtests / 2 endpoints | 4 pasan, 0 fallan |
| UI Playwright | 2 escenarios / 1 pantalla | 2 pasan, 0 fallan |
| Multiusuario Playwright | 4 escenarios / 4 cuentas reales | 4 pasan, 0 fallan |
| Smoke real Firebase | 1 flujo completo | Registro, logout, login y limpieza correctos |
| Bugs | 0 | Sin defectos detectados |

Reporte Excel: `docs/reporte_pruebas.xlsx`  
Plantilla: `docs/plantilla_reporte_testing_H4.xlsx`  
Evidencias: `docs/evidencias/`

## Entorno

| Elemento | Valor |
|---|---|
| Sistema | Linux |
| Node.js | v26.12.0 |
| npm | 11.20.0 |
| Playwright | 1.64.1 |
| Navegador UI | Brave Origin 156.1.98.62 (predeterminado del sistema) |
| Navegador multiusuario | Chromium incluido por Playwright 156 |
| Servidor local | `python3 -m http.server 4173` |
| Firebase RTDB | `https://fir-apiclass-default-rtdb.firebaseio.com/` |

## Pruebas unitarias

Archivo: `tests/unit/security.test.js`  
Comando: `npm run test:unit`  
Resultado: **10 tests, 3 suites, 10 pass, 0 fail**  
Duración: ~173 ms

| Función | Casos cubiertos |
|---|---|
| `validateEmail()` | Correo válido, normalización de espacios/mayúsculas, vacío, formatos incompletos o sin dominio |
| `validatePassword()` | Contraseña válida de 8 caracteres, vacía/corta, sin número, sin letra |
| `hashPassword()` | Determinismo con misma sal, cambio de hash con otra sal, 150 000 iteraciones por defecto, rechazo de entradas vacías |

Evidencia: `docs/evidencias/unit.log`

## Pruebas de API

Archivo: `tests/api/firebase-users.test.js`  
Comando: `npm run test:api`  
Resultado: **4 pass, 0 fail**

| Endpoint | Caso | Resultado real |
|---|---|---|
| `PUT /users/{userKey}.json` | Crear registro | `200 OK` + objeto persistido |
| `GET /users/{userKey}.json` | Recuperar registro existente | `200 OK` + mismo objeto |
| `GET /users/{userKey}.json` | Clave inexistente | `200 OK` + `null` |
| `DELETE /users/{userKey}.json` | Limpieza del test | `200 OK` |

Tiempos observados: PUT ~529 ms, GET existente ~454 ms, GET inexistente ~210 ms.

Evidencia: `docs/evidencias/api.log`

## Pruebas de UI

Archivo: `tests/ui/auth-screen.spec.js`  
Comando: `npm run test:ui` o `bash scripts/qa/03-ui.sh`  
Navegador: **Brave Origin 156.1.98.62** (detectado automáticamente como predeterminado)  
Modo captura: navegador visible, `slowMo=500 ms`, pausas de `1200 ms` en cada validación  
Resultado: **2 passed**

| Escenario | Validación |
|---|---|
| Login/registro con datos inválidos | Mensajes para correo vacío, nombre corto, correo inválido, contraseña corta y confirmación distinta |
| Registro exitoso | Redirección a `dashboard.html`, sesión guardada y dashboard vacío visible con el correo del jugador |

Capturas:

- `docs/evidencias/ui-login.png`
- `docs/evidencias/ui-dashboard.png`

Evidencia: `docs/evidencias/ui.log`

## Prueba multiusuario con 4 cuentas reales

Archivos:

- `tests/multiuser/multiuser.spec.js`
- `tests/multiuser/pages/AuthPage.js` (Page Object Model)
- `tests/multiuser/usuarios.json` (datos de los 4 usuarios)

Comando: `npm run test:multiuser:evidence`  
Resultado: **4 pasan, 0 fallan** (~1.2 min)

| Orden | ID | Nombre | Correo |
|---:|---|---|---|
| 1 | MU-01 | Jugador QA 01 | `qa.multi.01@worldlayers.test` |
| 2 | MU-02 | Jugador QA 02 | `qa.multi.02@worldlayers.test` |
| 3 | MU-03 | Jugador QA 03 | `qa.multi.03@worldlayers.test` |
| 4 | MU-04 | Jugador QA 04 | `qa.multi.04@worldlayers.test` |

Flujo ejecutado:

1. Eliminación de registros previos de los 4 correos.
2. Registro de los 4 usuarios desde la UI real (`index.html`), con logout después de cada uno.
3. Verificación `GET` de los 4 registros en Firebase: correo, nombre, hash de 64 hex, sal de 32 hex y fecha.
4. Ronda mixta API + UI en orden intercalado: `MU-03 → MU-01 → MU-04 → MU-02`.
5. Cuatro sesiones simultáneas en contextos aislados; cierres intercalados `MU-02 → MU-04 → MU-01 → MU-03` con recarga de `MU-04` para comprobar persistencia.
6. Rechazo de contraseña incorrecta para los 4 usuarios en el mismo orden intercalado.

Evidencias:

- `docs/evidencias/multiuser/multiuser.log`
- `docs/evidencias/multiuser/registro.json`
- `docs/evidencias/multiuser/estado-cuentas.json`
- `docs/evidencias/multiuser/login-MU-01.png` a `login-MU-04.png`
- `docs/evidencias/multiuser/sesion-MU-01.png` a `sesion-MU-04.png`

También se verificó `npm run test:multiuser:cleanup`: eliminó las 4 cuentas y Firebase quedó en `total_usuarios=0`. Después se volvió a ejecutar la suite y quedaron registradas las 4 cuentas para inspección.

## Smoke test real contra Firebase

Archivo: `tools/live-smoke.mjs`  
Comando: `npm run test:live`  
Resultado: **correcto**

Flujo ejecutado:

1. Registro de una cuenta única desde la UI real.
2. Verificación del correo en el dashboard.
3. Cierre de sesión.
4. Login con las mismas credenciales.
5. Verificación del dashboard vacío.
6. Eliminación de la cuenta de prueba (`DELETE` → `200`).

Evidencia:

- `docs/evidencias/live.log`
- `docs/evidencias/ui-live-dashboard.png`

## Bugs

No se detectaron defectos en los casos ejecutados. La hoja `Bugs` del reporte queda con una fila de cierre “Sin defectos detectados”.

## Observaciones

- Las pruebas de UI interceptan Firebase para no crear datos reales.
- La suite multiusuario sí usa Firebase real: registra 4 cuentas y las conserva por defecto para inspección.
- El smoke test sí usa Firebase real y limpia la cuenta al final.
- Las reglas públicas de RTDB son adecuadas para esta demo académica, no para producción.
- No hay Firebase Auth, recuperación de contraseña, verificación de correo ni backend propio.
- La sesión se guarda en `localStorage` y puede ser manipulada por el usuario.

## Scripts de terminal para capturas QA

Menú interactivo:

```bash
./qa.sh
```

Scripts individuales:

| Criterio | Script |
|---|---|
| 3 funciones unitarias (20%) | `bash scripts/qa/01-unitarias.sh` |
| 2 endpoints API (20%) | `bash scripts/qa/02-api.sh` |
| 1 pantalla UI (20%) | `bash scripts/qa/03-ui.sh` |
| Carpeta de tests (20%) | `bash scripts/qa/04-carpeta-tests.sh` |
| Ejecutar todo | `bash scripts/qa/05-todo.sh` |

Cada script muestra encabezado, comando, herramienta, salida de la prueba y un bloque `RESULTADO: PASA/FALLA`, y se detiene para que se pueda capturar la pantalla. El script de UI detecta y muestra el navegador predeterminado antes de ejecutar. Los logs quedan en `docs/evidencias/qa-terminal/`.

## Cómo reproducir

```bash
npm install
npx playwright install chromium
npm run test:evidence
npm run test:multiuser:evidence
npm run test:live
npm run report
```

Para eliminar las 4 cuentas multiusuario:

```bash
npm run test:multiuser:cleanup
```

Para regenerar solo el reporte:

```bash
npm run report
```

## Correspondencia con la rúbrica

| Criterio | Evidencia |
|---|---|
| 3 funciones unitarias (20%) | `tests/unit/security.test.js` + hoja `PruebasUnitarias` |
| 2 endpoints API (20%) | `tests/api/firebase-users.test.js` + hoja `PruebasAPI` |
| 1 pantalla UI (20%) | `tests/ui/auth-screen.spec.js` + hoja `PruebasUI` |
| Carpeta de tests según plantilla (20%) | `tests/unit`, `tests/api`, `tests/ui`, `tests/multiuser` + `docs/reporte_pruebas.xlsx` |
| Verificación adicional multiusuario | `tests/multiuser/` + `docs/evidencias/multiusuario/` |
