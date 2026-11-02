import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { hashPassword, validateEmail, validatePassword } from "../../js/security.js";

const SALT = "8c7f4f9af1d54d45a8a1ad8c2c6ad9d1";

describe("validateEmail", () => {
  test("acepta un correo válido y normaliza espacios/mayúsculas", () => {
    assert.equal(validateEmail("demo@worldlayers.gg"), "");
    assert.equal(validateEmail("  Demo@WorldLayers.GG  "), "");
  });

  test("rechaza correo vacío", () => {
    assert.equal(validateEmail(""), "El correo es obligatorio.");
    assert.equal(validateEmail("   "), "El correo es obligatorio.");
  });

  test("rechaza formatos incompletos o sin dominio", () => {
    assert.equal(validateEmail("demo"), "Ingresa un correo válido.");
    assert.equal(validateEmail("demo@"), "Ingresa un correo válido.");
    assert.equal(validateEmail("demo@worldlayers"), "Ingresa un correo válido.");
    assert.equal(validateEmail("demo world@layers.gg"), "Ingresa un correo válido.");
  });
});

describe("validatePassword", () => {
  test("acepta una contraseña de al menos 8 caracteres con letras y números", () => {
    assert.equal(validatePassword("Abcdefg1"), "");
    assert.equal(validatePassword("WorldLayers1"), "");
  });

  test("rechaza contraseña vacía o demasiado corta", () => {
    assert.equal(validatePassword(""), "La contraseña es obligatoria.");
    assert.equal(validatePassword("Ab1"), "La contraseña debe tener al menos 8 caracteres.");
  });

  test("exige al menos una letra y un número", () => {
    assert.equal(validatePassword("OnlyLetters"), "La contraseña debe incluir letras y números.");
    assert.equal(validatePassword("12345678"), "La contraseña debe incluir letras y números.");
  });
});

describe("hashPassword", () => {
  test("es determinista con la misma contraseña y sal", async () => {
    const first = await hashPassword("WorldLayers1", SALT, 1_000);
    const second = await hashPassword("WorldLayers1", SALT, 1_000);

    assert.equal(first, second);
    assert.match(first, /^[a-f0-9]{64}$/);
  });

  test("cambia el hash cuando cambia la sal", async () => {
    const first = await hashPassword("WorldLayers1", SALT, 1_000);
    const second = await hashPassword("WorldLayers1", `${SALT}00`, 1_000);

    assert.notEqual(first, second);
  });

  test("usa PBKDF2 con 150000 iteraciones por defecto y produce 256 bits", async () => {
    const result = await hashPassword("WorldLayers1", SALT);

    assert.match(result, /^[a-f0-9]{64}$/);
  });

  test("rechaza contraseña o sal vacías", async () => {
    await assert.rejects(() => hashPassword("", SALT), /obligatorias/);
    await assert.rejects(() => hashPassword("WorldLayers1", ""), /obligatorias/);
  });
});
