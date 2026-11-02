import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import { FIREBASE_DB_URL } from "../js/config.js";
import { hashEmail } from "../js/security.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const port = 4199;
const baseUrl = `http://127.0.0.1:${port}`;
const email = `qa-live-${Date.now()}@worldlayers.test`;
const password = "WorldLayers1";
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore",
});

let browser;
let registered = false;

async function waitForServer(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // El servidor todavía está arrancando.
    }
    await delay(100);
  }
  throw new Error(`El servidor local no respondió en ${url}`);
}

try {
  await waitForServer(baseUrl);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("pageerror", (error) => console.error(`[LIVE] Error de página: ${error.message}`));

  await page.goto(`${baseUrl}/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByTestId("auth-tab-register").click();
  await page.getByTestId("register-name").fill("Jugador Live QA");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill(password);
  await page.getByTestId("register-confirm").fill(password);
  await page.getByTestId("register-submit").click();
  await page.waitForURL(/dashboard\.html$/, { timeout: 20_000 });
  registered = true;

  const registeredEmail = (await page.getByTestId("user-email").textContent())?.trim();
  if (registeredEmail !== email) {
    throw new Error(`El dashboard mostró '${registeredEmail}' en lugar de '${email}'`);
  }
  console.log(`[LIVE] Registro real en Firebase OK: ${email}`);

  await page.getByTestId("logout-button").click();
  await page.waitForURL(/\/index\.html$/, { timeout: 10_000 });

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL(/dashboard\.html$/, { timeout: 20_000 });

  const loggedInEmail = (await page.getByTestId("user-email").textContent())?.trim();
  if (loggedInEmail !== email) {
    throw new Error(`El segundo login mostró '${loggedInEmail}' en lugar de '${email}'`);
  }

  await page.screenshot({
    path: "docs/evidencias/ui-live-dashboard.png",
    fullPage: true,
  });
  console.log("[LIVE] Logout y login real OK. Dashboard vacío visible.");
} finally {
  const userKey = await hashEmail(email).catch(() => null);

  if (userKey) {
    const cleanup = await fetch(`${FIREBASE_DB_URL}/users/${userKey}.json`, {
      method: "DELETE",
    }).catch(() => null);
    console.log(`[LIVE] Limpieza de la cuenta de prueba: HTTP ${cleanup?.status ?? "sin conexión"}`);
  }

  await browser?.close();
  server.kill("SIGTERM");
}
