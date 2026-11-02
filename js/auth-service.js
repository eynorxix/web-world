import { getUserRecord, putUserRecord } from "./firebase-client.js";
import {
  constantTimeEqual,
  createSalt,
  hashPassword,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "./security.js";

function toPublicUser(record) {
  return {
    displayName: record.displayName,
    email: record.email,
  };
}

export async function registerUser({ displayName, email, password }) {
  const name = String(displayName ?? "").trim();
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (name.length < 2) {
    throw new Error("El nombre debe tener al menos 2 caracteres.");
  }

  if (emailError) {
    throw new Error(emailError);
  }

  if (passwordError) {
    throw new Error(passwordError);
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await getUserRecord(normalizedEmail);

  if (existingUser) {
    throw new Error("Ese correo ya está registrado.");
  }

  const salt = createSalt();
  const passwordHash = await hashPassword(password, salt);
  const record = {
    displayName: name,
    email: normalizedEmail,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  await putUserRecord(normalizedEmail, record);
  return toPublicUser(record);
}

export async function loginUser({ email, password }) {
  const emailError = validateEmail(email);

  if (emailError) {
    throw new Error(emailError);
  }

  if (!String(password ?? "")) {
    throw new Error("La contraseña es obligatoria.");
  }

  const record = await getUserRecord(email);

  if (!record) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  const candidateHash = await hashPassword(password, record.salt);

  if (!constantTimeEqual(candidateHash, record.passwordHash)) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  return toPublicUser(record);
}
