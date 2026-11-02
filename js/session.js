import { SESSION_KEY } from "./config.js";

export function saveSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      displayName: user.displayName,
      email: user.email,
      loggedInAt: new Date().toISOString(),
    }),
  );
}

export function getSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function requireSession() {
  const session = getSession();

  if (!session?.email) {
    window.location.replace("./index.html");
    return null;
  }

  return session;
}
