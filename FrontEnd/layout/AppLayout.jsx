import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import styles from "./AppLayout.module.css";
import { AuthContext } from "../src/components/AuthContext.jsx";
import { logout } from "../src/services/auth.js";
import ChatPanel from "../src/components/ChatPanel.jsx";

export default function AppLayout({ children }) {
  const { user, setUser, setIsLoggedIn } = useContext(AuthContext);
  const username = user?.username ?? user?.name ?? "Username";
  const userImage = user?.image ?? null;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsChatOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
      <div className={styles.chatRail} aria-label="Chat rail">
        <div className={styles.chatRailInner}>
          <ChatPanel />
        </div>
      </div>

      {isChatOpen && (
        <div
          className={styles.chatOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Chat"
          onClick={() => setIsChatOpen(false)}
        >
          <div className={styles.chatOverlayInner} onClick={(e) => e.stopPropagation()}>
            <div className={styles.chatOverlayHeader}>
              <div className={styles.chatOverlayTitle}>Chat</div>
              <button type="button" className={styles.chatOverlayClose} onClick={() => setIsChatOpen(false)}>
                Close
              </button>
            </div>
            <ChatPanel />
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.chatFab}
        onClick={() => setIsChatOpen(true)}
        aria-label="Open chat"
      >
        Chat
      </button>
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
