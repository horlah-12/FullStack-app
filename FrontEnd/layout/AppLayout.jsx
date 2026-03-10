import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import styles from "./AppLayout.module.css";
import { AuthContext } from "../src/components/AuthContext.jsx";
import { logout } from "../src/services/auth.js";

export default function AppLayout({ children }) {
  const { user, setUser, setIsLoggedIn } = useContext(AuthContext);
  const username = user?.username ?? user?.name ?? "Username";
  const userImage = user?.image ?? null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      setUser(null);
      setIsLoggedIn(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className={styles.appLayout}>
      <div className={styles.userArea} ref={menuRef}>
        <button
          type="button"
          className={styles.userButton}
          onClick={handleToggleMenu}
          aria-expanded={isMenuOpen}
          aria-controls="user-menu"
          aria-label="User menu"
        >
          <span className={styles.username}>{username}</span>
          <span
            className={styles.avatar}
            aria-hidden="true"
            style={userImage ? { backgroundImage: `url(${userImage})` } : undefined}
          />
        </button>

        {isMenuOpen && (
          <div className={styles.userMenu} id="user-menu" role="menu">
            <Link to="/profile" className={styles.menuItem} role="menuitem">
              Ver Perfil
            </Link>

            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <main className={styles.main}>
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
