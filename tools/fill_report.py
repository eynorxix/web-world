#!/usr/bin/env python3
"""Genera docs/reporte_pruebas.xlsx a partir de la plantilla H4.

No requiere openpyxl: modifica el XML interno del libro con la librería estándar.
"""

from __future__ import annotations

import html
import math
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs" / "plantilla_reporte_testing_H4.xlsx"
TARGET = ROOT / "docs" / "reporte_pruebas.xlsx"
COLUMNS = "ABCDEFGHIJKLMNOP"


UNIT_ROWS = [
    ["Unitaria", "UT-01", "validateEmail()", "js/security.js", "Correo válido con espacios y mayúsculas", "Camino feliz", "'  Demo@WorldLayers.GG  '", "Retorna cadena vacía (''), sin error", "Retornó ''", "Pasa", "docs/evidencias/unit.log", "Cubre normalización trim + lower-case", "QA"],
    ["Unitaria", "UT-02", "validateEmail()", "js/security.js", "Correo vacío o solo espacios", "Error", "'' / '   '", "Retorna 'El correo es obligatorio.'", "Retornó 'El correo es obligatorio.'", "Pasa", "docs/evidencias/unit.log", "Valida campo obligatorio", "QA"],
    ["Unitaria", "UT-03", "validateEmail()", "js/security.js", "Correos incompletos o sin dominio", "Error", "demo / demo@ / demo@worldlayers / demo world@layers.gg", "Retorna 'Ingresa un correo válido.'", "Retornó 'Ingresa un correo válido.'", "Pasa", "docs/evidencias/unit.log", "Cubre 4 formatos inválidos", "QA"],
    ["Unitaria", "UT-04", "validatePassword()", "js/security.js", "Contraseña válida de 8 caracteres", "Camino feliz", "Abcdefg1 / WorldLayers1", "Retorna cadena vacía (''), sin error", "Retornó ''", "Pasa", "docs/evidencias/unit.log", "Exige letras y números", "QA"],
    ["Unitaria", "UT-05", "validatePassword()", "js/security.js", "Contraseña vacía o demasiado corta", "Borde / Error", "'' / Ab1", "Retorna 'La contraseña debe tener al menos 8 caracteres.'", "Retornó el mensaje esperado", "Pasa", "docs/evidencias/unit.log", "Cubre campo obligatorio y longitud", "QA"],
    ["Unitaria", "UT-06", "validatePassword()", "js/security.js", "Contraseña sin número o sin letra", "Error", "OnlyLetters / 12345678", "Retorna 'La contraseña debe incluir letras y números.'", "Retornó el mensaje esperado", "Pasa", "docs/evidencias/unit.log", "Valida composición mínima", "QA"],
    ["Unitaria", "UT-07", "hashPassword()", "js/security.js", "Misma contraseña y sal producen el mismo hash", "Camino feliz", "WorldLayers1 + sal fija + 1000 iteraciones", "Hashes iguales de 64 caracteres hex", "Hashes iguales de 64 caracteres hex", "Pasa", "docs/evidencias/unit.log", "Determinismo de PBKDF2-SHA256", "QA"],
    ["Unitaria", "UT-08", "hashPassword()", "js/security.js", "Sal distinta produce hash distinto", "Borde", "WorldLayers1 con sal y sal+00", "Hashes diferentes", "Hashes diferentes", "Pasa", "docs/evidencias/unit.log", "Comprueba el efecto de la sal", "QA"],
    ["Unitaria", "UT-09", "hashPassword()", "js/security.js", "Configuración por defecto de 150000 iteraciones", "Camino feliz", "WorldLayers1 + sal fija", "Hash de 256 bits (64 caracteres hex)", "Hash de 64 caracteres hex", "Pasa", "docs/evidencias/unit.log", "Usa PBKDF2_ITERATIONS de config.js", "QA"],
    ["Unitaria", "UT-10", "hashPassword()", "js/security.js", "Contraseña o sal vacías", "Error", "'' + sal / contraseña + ''", "Rechaza con error que menciona 'obligatorias'", "Rechazó con el error esperado", "Pasa", "docs/evidencias/unit.log", "Evita hashes con entradas vacías", "QA"],
]


API_ROWS = [
    ["API", "API-01", "Registro de jugador", "PUT /users/{userKey}.json", "RTDB accesible y reglas permiten escritura en /users", "Content-Type: application/json", "{displayName:'Jugador QA', email:'qa-...@worldlayers.test', passwordHash:'f'*64, salt:'0123...', createdAt:'ISO-8601'}", "200 OK; registro persistido", "Objeto JSON con los mismos campos", "200 OK", "Objeto JSON con los mismos campos", "529 ms", "Pasa", "docs/evidencias/api.log", "Crea el registro; se elimina al final del test", "QA"],
    ["API", "API-02", "Inicio de sesión", "GET /users/{userKey}.json", "El registro API-01 existe", "Sin headers especiales", "No aplica", "200 OK; mismos campos del registro", "Objeto JSON con displayName, email, passwordHash, salt y createdAt", "200 OK", "Objeto JSON con los mismos campos", "454 ms", "Pasa", "docs/evidencias/api.log", "Recupera la cuenta para verificar la contraseña", "QA"],
    ["API", "API-03", "Login con correo no registrado", "GET /users/{userKey}.json", "La clave calculada no existe", "Sin headers especiales", "No aplica", "200 OK; cuerpo null", "null", "200 OK", "null", "210 ms", "Pasa", "docs/evidencias/api.log", "Firebase devuelve null para una ruta inexistente", "QA"],
]


UI_ROWS = [
    ["UI", "UI-01", "Pantalla de acceso", "/ (index.html)", "Usuario sin sesión", "1. Abrir /; 2. Enviar login vacío; 3. Cambiar a Crear cuenta; 4. Probar datos inválidos", "2. Probar login vacío", "3. Probar registro inválido", "Nombre: A; correo: correo-invalido; contraseña: corta; confirmación: diferente", "Cada validación muestra su mensaje y no navega", "Se mostraron los mensajes de nombre, correo, longitud y coincidencia", "Pasa", "Brave Origin 156.1.98.62 / Desktop 1280x720", "docs/evidencias/ui-login.png; docs/evidencias/ui.log", "La pantalla comparte el estado de error entre pestañas", "QA"],
    ["UI", "UI-02", "Registro exitoso y dashboard vacío", "/ (index.html) -> dashboard.html", "Usuario sin sesión y Firebase disponible", "1. Abrir /; 2. Crear cuenta; 3. Enviar formulario; 4. Ver dashboard", "2. Completar nombre y correo", "3. Introducir contraseña válida y confirmación", "Jugador QA; qa@worldlayers.gg; WorldLayers1", "Redirección a dashboard vacío y sesión guardada", "Se abrió el dashboard con 'Tu dashboard está vacío por ahora' y el correo del jugador", "Pasa", "Brave Origin 156.1.98.62 / Desktop 1280x720", "docs/evidencias/ui-dashboard.png; docs/evidencias/ui.log", "Firebase se intercepta en UI; la integración real se cubre con API y smoke live", "QA"],
    ["UI", "UI-03", "Integración real con Firebase", "/ (index.html) -> dashboard.html", "Firebase RTDB pública y navegador con red", "1. Registrar cuenta única; 2. Ver dashboard; 3. Cerrar sesión; 4. Volver a iniciar sesión", "2. Verificar correo en dashboard", "3. Cerrar sesión y usar el formulario de login", "Cuenta qa-live-<timestamp>@worldlayers.test / WorldLayers1", "Registro, logout y login exitosos; cuenta eliminada al final", "Se completaron los tres pasos y la limpieza respondió HTTP 200", "Pasa", "Chromium 156 / Desktop 1280x720", "docs/evidencias/ui-live-dashboard.png; docs/evidencias/live.log", "Prueba real contra Firebase RTDB; no deja datos", "QA"],
    ["UI", "UI-04", "Flujo multiusuario con 4 cuentas reales", "/ (index.html) -> dashboard.html", "Firebase RTDB público y navegador con red", "1. Borrar registros previos; 2. Registrar MU-01..MU-04 desde UI; 3. Verificar GET; 4. Login intercalado MU-03->MU-01->MU-04->MU-02; 5. Abrir 4 sesiones simultáneas; 6. Logout intercalado y recarga; 7. Probar contraseña incorrecta", "2. Registrar los 4 usuarios", "3. Verificar hash/sal y alternar sesiones", "Usuarios MU-01 a MU-04 de tests/multiuser/usuarios.json", "4 registros válidos, sesiones aisladas y rechazo de claves inválidas", "4 registros en Firebase, 4 sesiones simultáneas aisladas y 4 rechazos de contraseña", "Pasa", "Chromium 156 / Desktop 1280x720", "docs/evidencias/multiusuario/multiuser.log; login-MU-*.png; sesion-MU-*.png", "Data-driven con POM; cuentas conservadas para inspección; limpieza opcional", "QA"],
]


BUG_ROWS = [
    ["Bugs", "N/A", "N/A", "Sin defectos detectados", "N/A", "N/A", "Login / Registro / Multiusuario", "Ejecutar npm test y npm run test:multiuser", "No aplica", "Todas las pruebas pasan", "No se observaron fallos", "docs/evidencias/", "Node 26 / Chromium 156 / Firebase RTDB", "Cerrado"],
]


def extract_rows(sheet_xml: str, row_numbers: list[int]) -> str:
    rows = []
    for number in row_numbers:
        match = re.search(rf'<row r="{number}".*?</row>', sheet_xml, re.S)
        if not match:
            raise RuntimeError(f"No se encontró la fila {number} en la plantilla")
        rows.append(match.group(0))
    return "".join(rows)


def cell_xml(column: str, row_number: int, value: str, string_index) -> str:
    index = string_index(value)
    return f'<c r="{column}{row_number}" s="3" t="s"><v>{index}</v></c>'


def build_rows(rows, start_row: int, string_index) -> str:
    xml_rows = []
    for offset, values in enumerate(rows):
        row_number = start_row + offset
        cells = []
        for column, value in zip(COLUMNS, values):
            if value not in (None, ""):
                cells.append(cell_xml(column, row_number, str(value), string_index))
        longest = max((len(str(value)) for value in values if value), default=1)
        height = min(180, max(54, math.ceil(longest / 24) * 15 + 6))
        xml_rows.append(
            f'<row r="{row_number}" spans="1:{len(values)}" ht="{height}" x14ac:dyDescent="0.3">'
            + "".join(cells)
            + "</row>"
        )
    return "".join(xml_rows)


def replace_sheet(sheet_xml: str, rows, start_row: int, last_column: str, string_index) -> str:
    header_rows = extract_rows(sheet_xml, [1, 2])
    data_rows = build_rows(rows, start_row, string_index)
    last_row = start_row + len(rows) - 1
    sheet_xml = re.sub(
        r"<dimension ref=\"[^\"]+\"/>",
        f'<dimension ref="A1:{last_column}{last_row}"/>',
        sheet_xml,
        count=1,
    )
    return re.sub(
        r"<sheetData>.*?</sheetData>",
        f"<sheetData>{header_rows}{data_rows}</sheetData>",
        sheet_xml,
        count=1,
        flags=re.S,
    )


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"No existe la plantilla: {SOURCE}")

    with zipfile.ZipFile(SOURCE) as archive:
        files = {item.filename: archive.read(item.filename) for item in archive.infolist()}
        infos = archive.infolist()

    shared_xml = files["xl/sharedStrings.xml"].decode("utf-8")
    shared_items = re.findall(r"<si>(.*?)</si>", shared_xml, re.S)
    text_to_index = {}
    for index, item in enumerate(shared_items):
        text = html.unescape(re.sub(r"<[^>]+>", "", item))
        text_to_index.setdefault(text, index)

    def string_index(value: str) -> int:
        if value in text_to_index:
            return text_to_index[value]
        index = len(shared_items)
        escaped = html.escape(value, quote=False)
        shared_items.append(f'<si><t xml:space="preserve">{escaped}</t></si>')
        text_to_index[value] = index
        return index

    files["xl/worksheets/sheet1.xml"] = replace_sheet(
        files["xl/worksheets/sheet1.xml"].decode("utf-8"),
        UNIT_ROWS,
        3,
        "M",
        string_index,
    ).encode("utf-8")
    files["xl/worksheets/sheet2.xml"] = replace_sheet(
        files["xl/worksheets/sheet2.xml"].decode("utf-8"),
        API_ROWS,
        3,
        "P",
        string_index,
    ).encode("utf-8")
    files["xl/worksheets/sheet3.xml"] = replace_sheet(
        files["xl/worksheets/sheet3.xml"].decode("utf-8"),
        UI_ROWS,
        3,
        "P",
        string_index,
    ).encode("utf-8")

    bugs_xml = files["xl/worksheets/sheet4.xml"].decode("utf-8")
    existing_bugs = extract_rows(bugs_xml, [1, 2, 3, 4])
    bug_rows = build_rows(BUG_ROWS, 5, string_index)
    bugs_xml = re.sub(
        r"<dimension ref=\"[^\"]+\"/>",
        '<dimension ref="A1:N5"/>',
        bugs_xml,
        count=1,
    )
    bugs_xml = re.sub(
        r"<sheetData>.*?</sheetData>",
        f"<sheetData>{existing_bugs}{bug_rows}</sheetData>",
        bugs_xml,
        count=1,
        flags=re.S,
    )
    files["xl/worksheets/sheet4.xml"] = bugs_xml.encode("utf-8")

    shared_header = re.search(r"<sst[^>]*>", shared_xml).group(0)
    new_header = re.sub(r'count="\d+"', f'count="{len(shared_items)}"', shared_header)
    new_header = re.sub(r'uniqueCount="\d+"', f'uniqueCount="{len(shared_items)}"', new_header)
    shared_xml = shared_xml.replace(shared_header, new_header, 1)
    shared_xml = re.sub(
        r"<si>.*</si>",
        "".join(shared_items),
        shared_xml,
        count=1,
        flags=re.S,
    )
    files["xl/sharedStrings.xml"] = shared_xml.encode("utf-8")

    workbook_xml = files["xl/workbook.xml"].decode("utf-8")
    files["xl/workbook.xml"] = workbook_xml.replace('activeTab="3"', 'activeTab="0"').encode("utf-8")

    with zipfile.ZipFile(TARGET, "w", zipfile.ZIP_DEFLATED) as archive:
        for info in infos:
            archive.writestr(info, files[info.filename])

    print(f"Reporte generado: {TARGET}")
    print(f"Filas: {len(UNIT_ROWS)} unitarias, {len(API_ROWS)} API, {len(UI_ROWS)} UI, {len(BUG_ROWS)} bugs")


if __name__ == "__main__":
    main()
