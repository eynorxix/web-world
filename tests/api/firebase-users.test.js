import assert from "node:assert/strict";
import { test } from "node:test";

import { FIREBASE_DB_URL } from "../../js/config.js";
import { hashEmail } from "../../js/security.js";

const testEmail = `qa-${Date.now()}-${Math.random().toString(16).slice(2)}@worldlayers.test`;
const testRecord = {
  displayName: "Jugador QA",
  email: testEmail,
  passwordHash: "f".repeat(64),
  salt: "0123456789abcdef0123456789abcdef",
  createdAt: new Date().toISOString(),
};

test("API REST de Firebase: PUT y GET sobre /users", async (t) => {
  const userKey = await hashEmail(testEmail);
  const url = `${FIREBASE_DB_URL}/users/${userKey}.json`;

  try {
    await t.test("PUT /users/{userKey}.json crea el registro", async () => {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testRecord),
      });
      const body = await response.json();

      console.log(`[API] PUT ${url} -> ${response.status} Created`);
      assert.equal(response.status, 200);
      assert.deepEqual(body, testRecord);
    });

    await t.test("GET /users/{userKey}.json recupera el registro", async () => {
      const response = await fetch(url);
      const body = await response.json();

      console.log(`[API] GET ${url} -> ${response.status} OK`);
      assert.equal(response.status, 200);
      assert.deepEqual(body, testRecord);
    });

    await t.test("GET /users/{userKey}.json devuelve null si no existe", async () => {
      const missingKey = await hashEmail(`missing-${testEmail}`);
      const missingUrl = `${FIREBASE_DB_URL}/users/${missingKey}.json`;
      const response = await fetch(missingUrl);
      const body = await response.json();

      console.log(`[API] GET ${missingUrl} -> ${response.status} null`);
      assert.equal(response.status, 200);
      assert.equal(body, null);
    });
  } finally {
    const cleanup = await fetch(url, { method: "DELETE" });
    console.log(`[API] DELETE ${url} -> ${cleanup.status} (limpieza)`);
  }
});
