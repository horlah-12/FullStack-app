const { VITE_BACK_HOST, VITE_BACK_PORT } = import.meta.env;
const API_BASE_URL = `http://${VITE_BACK_HOST}:${VITE_BACK_PORT}`;

const normalizeError = (error, fallbackMessage) => {
    const status = error.response?.status ?? 0;
    const message = error.response?.data?.message || fallbackMessage;
    const normalized = new Error(message);
    normalized.status = status;
    return normalized;
};



export const updateUser = async (payload) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const error = await res.json();
            throw error;
        }

        const data = await res.json();
        return data;
    } catch (error) {
        throw normalizeError(error, "No se pudo actualizar el usuario");
    }
};

export const deleteUser = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            const error = await res.json();
            throw error;
        }

        const data = await res.json();
        return data;
    } catch (error) {
        throw normalizeError(error, "No se pudo eliminar el usuario");
    }
};