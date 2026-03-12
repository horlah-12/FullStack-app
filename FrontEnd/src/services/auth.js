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

  const username = payload.username ?? payload.name ?? null;
  let image = null;
  if (username) {
    try {
      image = localStorage.getItem(`avatar:${username}`);
    } catch {
      image = null;
    }
  }

  // Keep shape compatible with existing consumers.
  return {
    user: {
      id: payload.userId ?? payload.sub ?? null,
      username,
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
