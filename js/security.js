import { PBKDF2_ITERATIONS } from "./config.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function validateEmail(value) {
  const email = normalizeEmail(value);

  if (!email) {
    return "El correo es obligatorio.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Ingresa un correo válido.";
  }

  return "";
}

export function validatePassword(value) {
  const password = String(value ?? "");

  if (!password) {
    return "La contraseña es obligatoria.";
  }

  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "La contraseña debe incluir letras y números.";
  }

  return "";
}

function getCrypto() {
  const webCrypto = globalThis.crypto;

  if (!webCrypto?.subtle) {
    throw new Error("Web Crypto no está disponible. Usa HTTPS o localhost.");
  }

  return webCrypto;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createSalt(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPassword(password, salt, iterations = PBKDF2_ITERATIONS) {
  const secret = String(password ?? "");
  const saltValue = String(salt ?? "");

  if (!secret || !saltValue) {
    throw new Error("La contraseña y la sal son obligatorias.");
  }

  const webCrypto = getCrypto();
  const encoder = new TextEncoder();
  const keyMaterial = await webCrypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await webCrypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(saltValue),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return bytesToHex(new Uint8Array(bits));
}

export async function hashEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("El correo es obligatorio.");
  }

  const digest = await getCrypto().subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizedEmail),
  );

  return bytesToHex(new Uint8Array(digest));
}

export function constantTimeEqual(leftValue, rightValue) {
  const left = String(leftValue ?? "");
  const right = String(rightValue ?? "");
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return difference === 0;
}
