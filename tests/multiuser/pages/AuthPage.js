import { expect } from "@playwright/test";

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");

export class AuthPage {
  constructor(page) {
    this.page = page;
    this.tabLogin = page.getByTestId("auth-tab-login");
    this.tabRegister = page.getByTestId("auth-tab-register");
    this.loginForm = page.getByTestId("login-form");
    this.registerForm = page.getByTestId("register-form");
    this.loginEmail = page.getByTestId("login-email");
    this.loginPassword = page.getByTestId("login-password");
    this.loginSubmit = page.getByTestId("login-submit");
    this.registerName = page.getByTestId("register-name");
    this.registerEmail = page.getByTestId("register-email");
    this.registerPassword = page.getByTestId("register-password");
    this.registerConfirm = page.getByTestId("register-confirm");
    this.registerSubmit = page.getByTestId("register-submit");
    this.status = page.getByTestId("auth-status");
    this.logoutButton = page.getByTestId("logout-button");
    this.emptyDashboard = page.getByTestId("dashboard-empty");
    this.userEmail = page.getByTestId("user-email");
  }

  async goto() {
    await this.page.goto(`${BASE_URL}/index.html`);
    await expect(this.loginForm).toBeVisible();
    await expect(this.tabLogin).toHaveAttribute("aria-selected", "true");
  }

  async openRegister() {
    await this.tabRegister.click();
    await expect(this.registerForm).toBeVisible();
    await expect(this.tabRegister).toHaveAttribute("aria-selected", "true");
  }

  async register(user) {
    await this.openRegister();
    await this.registerName.fill(user.nombre);
    await this.registerEmail.fill(user.correo);
    await this.registerPassword.fill(user.contrasena);
    await this.registerConfirm.fill(user.contrasena);
    await this.registerSubmit.click();
    await expect(this.page).toHaveURL(/dashboard\.html$/, { timeout: 20_000 });
    await this.expectDashboard(user);
  }

  async expectDashboard(user) {
    await expect(this.emptyDashboard).toBeVisible();
    await expect(this.userEmail).toHaveText(user.correo);
    await expect(this.page.locator("[data-user-name]").first()).toContainText(user.nombre);
  }

  async logout() {
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/index\.html(?:#.*)?$/, { timeout: 10_000 });
    await expect(this.loginForm).toBeVisible();
  }

  async login(user, password = user.contrasena) {
    await this.goto();
    await this.loginEmail.fill(user.correo);
    await this.loginPassword.fill(password);
    await this.loginSubmit.click();
    await expect(this.page).toHaveURL(/dashboard\.html$/, { timeout: 20_000 });
    await this.expectDashboard(user);
  }

  async loginExpectingError(user, password) {
    await this.goto();
    await this.loginEmail.fill(user.correo);
    await this.loginPassword.fill(password);
    await this.loginSubmit.click();
    await expect(this.status).toContainText("Correo o contraseña incorrectos.");
    await expect(this.page).toHaveURL(/index\.html/);
    await expect(this.loginForm).toBeVisible();
  }
}
