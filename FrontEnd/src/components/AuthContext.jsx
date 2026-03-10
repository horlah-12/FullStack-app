import { createContext, useEffect, useState } from "react";
import { getLoggedUser } from "../services/auth.js";

//Creamos un contexto para solicitar al backend el usuario logeado y guardarlo
const initialState = {
    isLoggedIn: false,
    user: null,
};

const AuthContext = createContext(initialState);

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(initialState.isLoggedIn);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const data = await getLoggedUser();
                setUser(data.user);
                setIsLoggedIn(true);

            } catch (error) {
                console.error("Error al obtener el usuario logeado:", error);
                setUser(null);
                setIsLoggedIn(false);

            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
