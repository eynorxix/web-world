import { clearSession, requireSession } from "./session.js";

const shell = document.querySelector("#dashboard-shell");
const logoutButton = document.querySelector("#logout-button");
const session = requireSession();

if (session) {
  const displayName = session.displayName || "Jugador";

  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = displayName;
  });

  document.querySelectorAll("[data-user-email]").forEach((element) => {
    element.textContent = session.email;
  });

  shell.hidden = false;
}

logoutButton.addEventListener("click", () => {
  clearSession();
  window.location.assign("./index.html");
});
