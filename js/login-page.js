import { loginUser, registerUser } from "./auth-service.js";
import { getSession, saveSession } from "./session.js";
import { validateEmail, validatePassword } from "./security.js";

const tabLogin = document.querySelector("#tab-login");
const tabRegister = document.querySelector("#tab-register");
const panelLogin = document.querySelector("#panel-login");
const panelRegister = document.querySelector("#panel-register");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginEmail = document.querySelector("#login-email");
const loginPassword = document.querySelector("#login-password");
const registerName = document.querySelector("#register-name");
const registerEmail = document.querySelector("#register-email");
const registerPassword = document.querySelector("#register-password");
const registerConfirm = document.querySelector("#register-confirm");
const status = document.querySelector("#auth-status");

function showStatus(message, state = "error") {
  status.textContent = message;
  status.dataset.state = state;
  status.hidden = false;
}

function clearStatus() {
  status.textContent = "";
  status.hidden = true;
  delete status.dataset.state;
}

function setBusy(form, isBusy) {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = isBusy;
  form.setAttribute("aria-busy", String(isBusy));
}

function setMode(mode) {
  const isLogin = mode === "login";

  tabLogin.classList.toggle("is-active", isLogin);
  tabLogin.setAttribute("aria-selected", String(isLogin));
  tabRegister.classList.toggle("is-active", !isLogin);
  tabRegister.setAttribute("aria-selected", String(!isLogin));
  panelLogin.hidden = !isLogin;
  panelRegister.hidden = isLogin;
  clearStatus();

  const hash = isLogin ? "#acceso" : "#registro";

  if (window.location.hash !== hash) {
    window.history.replaceState(null, "", hash);
  }
}

function focusFirstField(form) {
  form.querySelector("input")?.focus();
}

tabLogin.addEventListener("click", () => setMode("login"));
tabRegister.addEventListener("click", () => setMode("register"));

tabLogin.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    setMode("register");
    tabRegister.focus();
  }
});

tabRegister.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    setMode("login");
    tabLogin.focus();
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const email = loginEmail.value;
  const password = loginPassword.value;
  const emailError = validateEmail(email);

  if (emailError) {
    showStatus(emailError);
    loginEmail.focus();
    return;
  }

  if (!password) {
    showStatus("La contraseña es obligatoria.");
    loginPassword.focus();
    return;
  }

  setBusy(loginForm, true);

  try {
    const user = await loginUser({ email, password });
    saveSession(user);
    showStatus("Sesión iniciada. Abriendo tu dashboard…", "success");
    window.setTimeout(() => window.location.assign("./dashboard.html"), 350);
  } catch (error) {
    showStatus(error.message || "No se pudo iniciar sesión.");
  } finally {
    setBusy(loginForm, false);
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const displayName = registerName.value.trim();
  const email = registerEmail.value;
  const password = registerPassword.value;
  const confirmation = registerConfirm.value;

  if (displayName.length < 2) {
    showStatus("El nombre debe tener al menos 2 caracteres.");
    registerName.focus();
    return;
  }

  const emailError = validateEmail(email);

  if (emailError) {
    showStatus(emailError);
    registerEmail.focus();
    return;
  }

  const passwordError = validatePassword(password);

  if (passwordError) {
    showStatus(passwordError);
    registerPassword.focus();
    return;
  }

  if (password !== confirmation) {
    showStatus("Las contraseñas no coinciden.");
    registerConfirm.focus();
    return;
  }

  setBusy(registerForm, true);

  try {
    const user = await registerUser({ displayName, email, password });
    saveSession(user);
    showStatus("Cuenta creada. Abriendo tu dashboard…", "success");
    window.setTimeout(() => window.location.assign("./dashboard.html"), 350);
  } catch (error) {
    showStatus(error.message || "No se pudo crear la cuenta.");
  } finally {
    setBusy(registerForm, false);
  }
});

for (const form of [loginForm, registerForm]) {
  form.addEventListener("input", clearStatus);
}

if (getSession()) {
  window.location.replace("./dashboard.html");
} else if (window.location.hash === "#registro") {
  setMode("register");
  focusFirstField(registerForm);
} else {
  setMode("login");
}
