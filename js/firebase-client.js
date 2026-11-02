import { USERS_PATH } from "./config.js";
import { hashEmail } from "./security.js";

async function requestJson(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error("No se pudo conectar con Firebase. Revisa tu conexión.");
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Firebase respondió ${response.status}${detail ? `: ${detail}` : "."}`);
  }

  return data;
}

export async function userUrl(email) {
  const key = await hashEmail(email);
  return `${USERS_PATH}/${key}.json`;
}

export async function getUserRecord(email) {
  return requestJson(await userUrl(email));
}

export async function putUserRecord(email, record) {
  return requestJson(await userUrl(email), {
    method: "PUT",
    body: JSON.stringify(record),
  });
}

export async function deleteUserRecord(email) {
  return requestJson(await userUrl(email), {
    method: "DELETE",
  });
}
