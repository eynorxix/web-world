import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { getUserRecord, deleteUserRecord } from "../../js/firebase-client.js";
import { hashEmail } from "../../js/security.js";
import { AuthPage } from "./pages/AuthPage.js";

const data = JSON.parse(fs.readFileSync(new URL("./usuarios.json", import.meta.url), "utf8"));
const users = data.usuarios;
const evidenceDir = path.resolve("docs/evidencias/multiusuario");
const loginOrder = [2, 0, 3, 1];
const logoutOrder = [1, 3, 0, 2];

fs.mkdirSync(evidenceDir, { recursive: true });

test.describe.configure({ mode: "serial" });

test.describe("Flujo multiusuario real con 4 cuentas", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const auth = new AuthPage(page);

    for (const user of users) {
      await deleteUserRecord(user.correo);
    }

    for (const user of users) {
      await auth.goto();
      await auth.register(user);
      console.log(`[MULTI] Registro UI OK: ${user.id} -> ${user.correo}`);
      await auth.logout();
    }

    await page.close();

    fs.writeFileSync(
      path.join(evidenceDir, "registro.json"),
      JSON.stringify(
        {
          fecha: new Date().toISOString(),
          metodo: "Registro real desde index.html con Playwright",
          total: users.length,
          usuarios: users.map(({ id, nombre, correo }) => ({ id, nombre, correo })),
        },
        null,
        2,
      ),
    );
  });

  test.afterAll(async () => {
    const cleanup = process.env.MULTIUSER_CLEANUP === "1";

    if (cleanup) {
      for (const user of users) {
        await deleteUserRecord(user.correo);
      }
    }

    fs.writeFileSync(
      path.join(evidenceDir, "estado-cuentas.json"),
      JSON.stringify(
        {
          fecha: new Date().toISOString(),
          limpiezaEjecutada: cleanup,
          cuentasRestantes: cleanup ? 0 : users.length,
        },
        null,
        2,
      ),
    );

    console.log(
      cleanup
        ? "[MULTI] Cuentas eliminadas al finalizar."
        : "[MULTI] Cuentas conservadas para inspección manual.",
    );
  });

  test("los 4 usuarios existen en Firebase con hash y sal propios", async () => {
    const keys = new Set();

    for (const user of users) {
      const record = await getUserRecord(user.correo);

      expect(record).not.toBeNull();
      expect(record.email).toBe(user.correo);
      expect(record.displayName).toBe(user.nombre);
      expect(record.passwordHash).toMatch(/^[a-f0-9]{64}$/);
      expect(record.salt).toMatch(/^[a-f0-9]{32}$/);
      expect(record.createdAt).toBeTruthy();

      keys.add(await hashEmail(user.correo));
      console.log(`[MULTI] Firebase GET OK: ${user.id} -> ${user.correo}`);
    }

    expect(keys.size).toBe(4);
  });

  test("ronda mixta API + login intercalado MU-03 -> MU-01 -> MU-04 -> MU-02", async ({ page }) => {
    const auth = new AuthPage(page);

    for (const index of loginOrder) {
      const user = users[index];
      const record = await getUserRecord(user.correo);

      expect(record.email).toBe(user.correo);
      await auth.login(user);
      await expect(page.getByTestId("user-email")).toHaveText(user.correo);
      await page.screenshot({
        path: path.join(evidenceDir, `login-${user.id}.png`),
        fullPage: true,
      });
      console.log(`[MULTI] Ronda API+UI intercalada OK: ${user.id} -> ${user.correo}`);

      await auth.logout();
    }
  });

  test("4 sesiones simultáneas aisladas con cierres intercalados", async ({ browser }) => {
    const sessions = [];

    try {
      for (const user of users) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const auth = new AuthPage(page);

        await auth.login(user);
        sessions.push({ user, context, page, auth });

        await page.screenshot({
          path: path.join(evidenceDir, `sesion-${user.id}.png`),
          fullPage: true,
        });
        console.log(`[MULTI] Sesión simultánea OK: ${user.id} -> ${user.correo}`);
      }

      const active = new Set(sessions);

      for (const index of logoutOrder) {
        const session = sessions[index];
        await session.auth.logout();
        active.delete(session);
        console.log(`[MULTI] Logout intercalado OK: ${session.user.id}`);

        const reloaded = sessions.find((item) => item.user.id === "MU-04");

        if (session.user.id === "MU-02") {
          await reloaded.page.reload();
          await expect(reloaded.page.getByTestId("user-email")).toHaveText(reloaded.user.correo);
          console.log("[MULTI] Recarga con sesión persistente OK: MU-04");
        }

        for (const other of active) {
          await expect(other.page.getByTestId("dashboard-empty")).toBeVisible();
          await expect(other.page.getByTestId("user-email")).toHaveText(other.user.correo);
        }
      }

      expect(active.size).toBe(0);
      console.log("[MULTI] Aislamiento de las 4 sesiones OK.");
    } finally {
      for (const session of sessions) {
        await session.context.close();
      }
    }
  });

  test("contraseña incorrecta intercalada no crea sesión", async ({ page }) => {
    const auth = new AuthPage(page);

    for (const index of loginOrder) {
      const user = users[index];

      await auth.loginExpectingError(user, "ClaveIncorrecta1");
      console.log(`[MULTI] Rechazo de contraseña OK: ${user.id} -> ${user.correo}`);
    }
  });
});
