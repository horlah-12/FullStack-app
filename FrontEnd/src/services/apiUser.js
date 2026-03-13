import { apiUrl } from "./api.js";
import { getToken } from "./auth.js";

async function readResponsePayload(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await res.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
}

async function throwForBadResponse(res, fallbackMessage) {
  const payload = await readResponsePayload(res);
  const message = payload?.message || payload?.error || fallbackMessage;
  const error = new Error(message);
  error.status = res.status;
  error.payload = payload ?? null;
  throw error;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const updateUser = async (payload) => {
  const res = await fetch(apiUrl("/user"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!res.ok) await throwForBadResponse(res, "No se pudo actualizar el usuario");
  return await readResponsePayload(res);
};

export const deleteUser = async () => {
  const res = await fetch(apiUrl("/user"), {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) await throwForBadResponse(res, "No se pudo eliminar el usuario");
  return await readResponsePayload(res);
};
