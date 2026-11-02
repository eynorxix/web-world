import { expect, test } from "@playwright/test";

const CAPTURE_DELAY = process.env.QA_CAPTURE === "1" ? Number(process.env.QA_CAPTURE_DELAY || 1200) : 0;

async function capturePause(page, multiplier = 1) {
  if (CAPTURE_DELAY > 0) {
    await page.waitForTimeout(CAPTURE_DELAY * multiplier);
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("pantalla de acceso: login y registro validan los datos", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /Un mundo que se construye/i })).toBeVisible();
  await expect(page.getByTestId("login-form")).toBeVisible();
  await capturePause(page);

  console.log("[UI] Validando login vacio");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("auth-status")).toContainText("El correo es obligatorio.");
  await capturePause(page);

  await page.getByTestId("auth-tab-register").click();
  await expect(page.getByTestId("register-form")).toBeVisible();
  await capturePause(page);

  console.log("[UI] Validando registro invalido");
  await page.getByTestId("register-name").fill("A");
  await page.getByTestId("register-email").fill("correo-invalido");
  await page.getByTestId("register-password").fill("corta");
  await page.getByTestId("register-confirm").fill("diferente");
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("auth-status")).toContainText("El nombre debe tener al menos 2 caracteres.");
  await capturePause(page);

  await page.getByTestId("register-name").fill("Jugador QA");
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("auth-status")).toContainText("Ingresa un correo válido.");
  await capturePause(page);

  await page.getByTestId("register-email").fill("qa@worldlayers.gg");
  await page.getByTestId("register-password").fill("Ab1");
  await page.getByTestId("register-confirm").fill("Ab1");
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("auth-status")).toContainText("al menos 8 caracteres");
  await capturePause(page);

  await page.getByTestId("register-password").fill("WorldLayers1");
  await page.getByTestId("register-confirm").fill("WorldLayers2");
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("auth-status")).toContainText("Las contraseñas no coinciden.");
  await capturePause(page, 2);
});

test("pantalla de acceso: registro exitoso guarda sesión y abre dashboard vacío", async ({ page }) => {
  await page.route("**/users/*.json", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
      return;
    }

    if (method === "PUT") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: route.request().postData() ?? "{}",
      });
      return;
    }

    await route.fulfill({ status: 405, contentType: "application/json", body: "{}" });
  });

  await page.getByTestId("auth-tab-register").click();
  await page.getByTestId("register-name").fill("Jugador QA");
  await page.getByTestId("register-email").fill("qa@worldlayers.gg");
  await page.getByTestId("register-password").fill("WorldLayers1");
  await page.getByTestId("register-confirm").fill("WorldLayers1");
  await capturePause(page);

  await page.screenshot({
    path: "docs/evidencias/ui-login.png",
    fullPage: true,
  });

  console.log("[UI] Registro valido; abriendo dashboard");
  await page.getByTestId("register-submit").click();

  await expect(page).toHaveURL(/dashboard\.html$/);
  await expect(page.getByTestId("dashboard-empty")).toBeVisible();
  await expect(page.getByTestId("user-email")).toHaveText("qa@worldlayers.gg");
  await capturePause(page, 3);

  await page.screenshot({
    path: "docs/evidencias/ui-dashboard.png",
    fullPage: true,
  });
});
