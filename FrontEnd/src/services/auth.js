import { apiUrl } from "./api.js";

function decodeJwt(token) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    // base64url -> base64 (+ padding)
    let base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = base64.length % 4;
    if (padLen) base64 += "=".repeat(4 - padLen);
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export async function getLoggedUser() {
  const token = getToken();
  if (!token) throw new Error("Not logged in");

  const payload = decodeJwt(token);
  if (!payload) throw new Error("Invalid token");
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    throw new Error("Token expired");
  }

  const fallbackUsername = payload.username ?? payload.name ?? null;

  // Prefer loading the profile from the backend so fields like `email` are available.
  try {
    const res = await fetch(apiUrl("/user"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const serverUser = data?.user ?? data?.data?.user ?? null;
      if (serverUser) {
        const username = serverUser.username ?? fallbackUsername ?? null;
        let image = serverUser.image ?? serverUser.imageUrl ?? null;
        if (!image && username) {
          try {
            image = localStorage.getItem(`avatar:${username}`);
          } catch {
            image = null;
          }
        }

        return {
          user: {
            id: serverUser.id ?? serverUser._id ?? payload.userId ?? payload.sub ?? null,
            name: serverUser.name ?? null,
            email: serverUser.email ?? null,
            username,
            image,
            imageUrl: serverUser.imageUrl ?? null,
          },
        };
      }
    }
  } catch {
    // fall back to token-derived data
  }

  let image = null;
  if (fallbackUsername) {
    try {
      image = localStorage.getItem(`avatar:${fallbackUsername}`);
    } catch {
      image = null;
    }
  }

  return {
    user: {
      id: payload.userId ?? payload.sub ?? null,
      username: fallbackUsername,
      image,
    },
  };
}

export async function logout() {
  try {
    localStorage.removeItem("token");
  } catch {
    // ignore
  }
}
