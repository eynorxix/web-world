# World Layers Web

Web estática de acceso para el proyecto **World Layers**. Presenta el mundo procedural, permite registrar jugadores, iniciar sesión, mantener la sesión en el navegador y abrir un dashboard vacío.

No requiere backend propio: el registro se guarda directamente en **Firebase Realtime Database** mediante REST y el sitio se puede publicar en **GitHub Pages**.

## Qué incluye

- Portada con información y arte del proyecto de juego.
- Pestañas de **Iniciar sesión** y **Crear cuenta**.
- Validación de correo y contraseña en el cliente.
- Contraseñas protegidas con **PBKDF2-SHA256** (150 000 iteraciones) y sal aleatoria.
- Registro en `/users/{sha256(email)}.json` de Firebase RTDB.
- Login contra el registro de Firebase.
- Sesión persistente en `localStorage`.
- `dashboard.html` protegido y vacío, con opción de cerrar sesión.
- Diseño responsive, sin dependencias de UI ni build.
- Workflow de GitHub Pages.
- Tests unitarios, de API, de UI, un smoke test real contra Firebase y una suite multiusuario con 4 cuentas reales.
- Reporte de pruebas en Excel basado en la plantilla H4.

## Estructura

```text
.
├── index.html                    Portada, login y registro
├── dashboard.html                Dashboard protegido y vacío
├── css/
│   └── styles.css                Estilos de portada, formularios y dashboard
├── js/
│   ├── config.js                 URL de Firebase y constantes
│   ├── security.js               Validaciones, PBKDF2, SHA-256 y comparación segura
│   ├── firebase-client.js        Cliente REST de Firebase RTDB
│   ├── auth-service.js           Registro y login
│   ├── session.js                Persistencia de sesión
│   ├── login-page.js             Controladores de la pantalla de acceso
│   └── dashboard-page.js         Protección y datos del dashboard
├── assets/
│   ├── favicon.svg
│   ├── pico.png
│   ├── hoja.png
│   └── hex-texture.png
├── tests/
│   ├── unit/security.test.js     3 funciones unitarias
│   ├── api/firebase-users.test.js 2 endpoints REST
│   ├── ui/auth-screen.spec.js    Pantalla de acceso
│   └── multiuser/                4 usuarios reales, POM y rondas intercaladas
├── qa.sh                         Menú interactivo de pruebas para capturas
├── scripts/qa/
│   ├── 00-menu.sh                Menú de las 4 pruebas de la rúbrica
│   ├── 01-unitarias.sh           3 funciones unitarias
│   ├── 02-api.sh                 2 endpoints REST
│   ├── 03-ui.sh                  1 pantalla de UI
│   ├── 04-carpeta-tests.sh       Estructura de tests + reporte H4
│   ├── 05-todo.sh                Ejecuta las 4 pruebas y guarda logs
│   └── lib.sh                    Encabezados, pausas y resultado común
├── tools/
│   ├── live-smoke.mjs            Registro/logout/login real y limpieza
│   ├── run-tests.sh              Genera logs de evidencia
│   ├── run-multiuser-tests.sh    Evidencia de la suite multiusuario
│   ├── cleanup-multiuser.mjs     Elimina las 4 cuentas de prueba
│   ├── default-browser.mjs       Detecta el navegador predeterminado
│   └── fill_report.py            Llena la plantilla xlsx
├── docs/
│   ├── plantilla_reporte_testing_H4.xlsx
│   ├── reporte_pruebas.xlsx
│   ├── REPORTE_PRUEBAS.md
│   └── evidencias/               Logs y capturas
├── firebase.rules.json           Reglas sugeridas para RTDB
├── playwright.config.js
├── playwright.multiuser.config.js
├── package.json
└── .github/workflows/deploy-pages.yml
```

## Ejecutar en local

Requisitos: Node.js 20+, Python 3 y un navegador moderno.

```bash
npm install
npx playwright install chromium
npm run serve
```

Abre `http://127.0.0.1:4173`.

La prueba de UI usa el **navegador predeterminado del sistema** mediante `tools/default-browser.mjs` (en este equipo: Brave Origin). `npx playwright install chromium` solo es necesario para la suite multiusuario, que abre varios contextos.

> Web Crypto necesita un contexto seguro: `https://` o `http://localhost`. Abrir el HTML con `file://` no funciona para el registro/login.

## Firebase Realtime Database

Base usada por la aplicación:

```text
https://fir-apiclass-default-rtdb.firebaseio.com/
```

### Estructura de usuario

```json
{
  "displayName": "Jugador",
  "email": "jugador@correo.com",
  "passwordHash": "<64 caracteres hex>",
  "salt": "<32 caracteres hex>",
  "createdAt": "2026-11-01T00:00:00.000Z"
}
```

Ruta:

```text
/users/{sha256(email_normalizado)}.json
```

### Endpoints usados

| Método | Ruta | Uso |
|---|---|---|
| `PUT` | `/users/{userKey}.json` | Crear el registro del jugador |
| `GET` | `/users/{userKey}.json` | Buscar la cuenta para el login |

Firebase devuelve `200 OK` con cuerpo `null` cuando la ruta no existe.

### Reglas sugeridas

El archivo `firebase.rules.json` contiene una configuración de demostración. Para aplicarla:

1. Abre Firebase Console → Realtime Database → Rules.
2. Pega el contenido de `firebase.rules.json`.
3. Publica los cambios.

Las reglas permiten leer y escribir en `/users` para que el cliente estático pueda registrarse y autenticarse sin Firebase Auth. **No son reglas de producción**: exponen los hashes y permiten escritura pública. Para un proyecto real se recomienda Firebase Authentication, reglas cerradas y un backend/Cloud Functions.

## Pruebas

| Comando | Qué ejecuta |
|---|---|
| `./qa.sh` | Menú de 4 scripts para ejecutar y capturar cada criterio |
| `npm run test:unit` | 3 funciones: `validateEmail`, `validatePassword`, `hashPassword` |
| `npm run test:api` | 2 endpoints reales: `PUT /users` y `GET /users` |
| `npm run test:ui` | Pantalla de acceso + dashboard vacío con Playwright y navegador predeterminado |
| `npm run test:multiuser` | Registra 4 usuarios reales y ejecuta rondas API+UI intercaladas |
| `npm run test:multiuser:evidence` | Ejecuta la suite multiusuario y guarda log/capturas |
| `npm run test:multiuser:cleanup` | Elimina las 4 cuentas `qa.multi.*@worldlayers.test` |
| `npm run test:all` | Unit + API + UI + multiusuario |
| `npm run test:live` | Smoke real: registro, logout, login y limpieza en Firebase |
| `npm run test:evidence` | Unit + API + UI y guarda logs en `docs/evidencias/` |
| `npm run report` | Regenera `docs/reporte_pruebas.xlsx` |

Los tests de UI interceptan Firebase para no crear datos y detectan el navegador predeterminado (`Brave Origin` en este equipo). Si no se encuentra uno compatible, Playwright usa su Chromium incluido. El smoke test `test:live` sí usa Firebase real, con un correo único, y elimina la cuenta al final.

### Prueba multiusuario con 4 cuentas reales

Sigue el enfoque de las notas del curso: **Playwright** con **Page Object Model** y datos externos en JSON.

- Datos: `tests/multiuser/usuarios.json` (`MU-01` a `MU-04`).
- Page Object: `tests/multiuser/pages/AuthPage.js`.
- Suite: `tests/multiuser/multiuser.spec.js`.

La suite primero elimina registros previos y **registra los 4 usuarios desde la UI real**. Después ejecuta:

1. `GET` de los 4 registros en Firebase y validación de hash/sal.
2. Ronda mixta API + UI con orden intercalado `MU-03 → MU-01 → MU-04 → MU-02`.
3. Cuatro sesiones simultáneas en contextos aislados, con logout intercalado y recarga de una sesión.
4. Rechazo de contraseña incorrecta para los 4 usuarios en orden intercalado.

Las cuentas se conservan por defecto para inspección manual. Para eliminarlas al terminar:

```bash
MULTIUSER_CLEANUP=1 npm run test:multiuser
# o después de la prueba
npm run test:multiuser:cleanup
```

Evidencias: `docs/evidencias/multiusuario/multiuser.log`, `registro.json`, `login-MU-*.png` y `sesion-MU-*.png`.

### Scripts de terminal para capturas QA

Cada script limpia la pantalla, imprime el criterio, ejecuta la herramienta correspondiente, muestra `RESULTADO: PASA/FALLA` y espera `Enter` para que puedas tomar la captura.

La opción 3 abre **Brave Origin visible**, con `slowMo=500 ms` y pausas de `1200 ms` entre validaciones, para que puedas capturar cómo Playwright manipula el navegador. Para ejecutarla sin ventana: `HEADED=0 bash scripts/qa/03-ui.sh`. Para hacerla más lenta: `PLAYWRIGHT_SLOWMO=900 QA_CAPTURE_DELAY=2000 bash scripts/qa/03-ui.sh`.

```bash
./qa.sh
```

Menú:

| Opción | Script | Criterio |
|---:|---|---|
| 1 | `scripts/qa/01-unitarias.sh` | 3 funciones unitarias (20%) |
| 2 | `scripts/qa/02-api.sh` | 2 endpoints API (20%) |
| 3 | `scripts/qa/03-ui.sh` | 1 pantalla UI (20%) |
| 4 | `scripts/qa/04-carpeta-tests.sh` | Carpeta de tests + reporte (20%) |
| 5 | `scripts/qa/05-todo.sh` | Ejecuta las 4 y guarda logs |

También puedes ejecutar uno directo:

```bash
bash scripts/qa/01-unitarias.sh
bash scripts/qa/02-api.sh
bash scripts/qa/03-ui.sh
bash scripts/qa/04-carpeta-tests.sh
```

Logs de terminal: `docs/evidencias/qa-terminal/`.  
Para ejecutar sin pausas: `NO_PAUSE=1 bash scripts/qa/05-todo.sh`.

### Reporte

- Plantilla original: `docs/plantilla_reporte_testing_H4.xlsx` (hojas `PruebasUnitarias`, `PruebasAPI`, `PruebasUI`, `Bugs`).
- Reporte lleno: `docs/reporte_pruebas.xlsx`.
- Resumen legible: `docs/REPORTE_PRUEBAS.md`.
- Evidencias: `docs/evidencias/unit.log`, `api.log`, `ui.log`, `live.log`, capturas PNG y `docs/evidencias/multiusuario/`.

No se encontró un archivo `.zip` de plantilla; se usó la plantilla `.xlsx` disponible en Descargas.

## Publicar en GitHub Pages

1. Crea un repositorio y sube el contenido de esta carpeta a la rama `main`.
2. En GitHub, entra a **Settings → Pages**.
3. En **Build and deployment**, selecciona **Source: GitHub Actions**.
4. El workflow `.github/workflows/deploy-pages.yml` publicará `index.html`, `dashboard.html`, `css/`, `js/`, `assets/` y `.nojekyll`.
5. La URL será similar a `https://<usuario>.github.io/<repositorio>/`.

El sitio usa rutas relativas, por lo que funciona tanto en la raíz del dominio como en una subcarpeta de proyecto de GitHub Pages.

## Rúbrica cubierta

| Criterio | Implementación |
|---|---|
| 3 funciones unitarias (20%) | `tests/unit/security.test.js`: `validateEmail`, `validatePassword`, `hashPassword` |
| 2 endpoints API (20%) | `tests/api/firebase-users.test.js`: `PUT /users/{key}.json`, `GET /users/{key}.json` |
| 1 pantalla UI (20%) | `tests/ui/auth-screen.spec.js`: pantalla de acceso y dashboard vacío |
| Carpeta de tests según plantilla (20%) | `tests/unit`, `tests/api`, `tests/ui`, `tests/multiuser` + reporte xlsx con las 4 hojas |

Verificación adicional: `tests/multiuser/` registra 4 cuentas reales y comprueba login intercalado, sesiones simultáneas aisladas y credenciales inválidas.

## Límites conocidos

- No hay Firebase Auth ni recuperación de contraseña.
- La sesión vive en `localStorage`; puede editarse desde el navegador. Es una demo académica.
- Las reglas públicas de RTDB no son seguras para producción.
- El dashboard es intencionalmente vacío.

## Skill de opencode

Se creó la skill global `~/.config/opencode/skills/world-layers-web-auth/SKILL.md` con el mapa de archivos, contrato Firebase, comandos de prueba, generación del reporte y despliegue en GitHub Pages.

Reinicia opencode para que la skill quede disponible en futuras sesiones.

## Documentación adicional

- `docs/REPORTE_PRUEBAS.md`: resultados, evidencias y criterios.
- `firebase.rules.json`: reglas sugeridas.
- `tools/fill_report.py`: generador del reporte Excel sin dependencias externas.
