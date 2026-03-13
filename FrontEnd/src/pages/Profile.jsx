import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./profile.module.css";
import { AuthContext } from "../components/AuthContext.jsx";
import { updateUser, deleteUser } from "../services/apiUser.js";

export default function AccountSettings() {
    const navigate = useNavigate();
    const { user, setUser } = useContext(AuthContext);

    const displayName = useMemo(
        () => user?.name ?? user?.username ?? "Nombre usuario",
        [user],
    );
    const displayUsername = useMemo(() => user?.username ?? "username", [user]);
    const initials = useMemo(() => {
        const base = (user?.name ?? user?.username ?? "").trim();
        if (!base) return "U";
        const parts = base.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] ?? "U";
        const second = (parts[1]?.[0] ?? parts[0]?.[1] ?? "").trim();
        return (first + second).toUpperCase();
    }, [user]);

    const [profile, setProfile] = useState({
        name: "",
        username: "",
        email: "",
    });
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        setProfile({
            name: user?.name ?? "",
            username: user?.username ?? "",
            email: user?.email ?? "",
        });
    }, [user]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");

        if (
            passwords.newPassword ||
      passwords.confirmPassword ||
      passwords.currentPassword
        ) {
            if (!passwords.currentPassword) {
                setError("Introduce tu contraseña actual para cambiarla.");
                return;
            }
            if (passwords.newPassword !== passwords.confirmPassword) {
                setError("La nueva contraseña y la confirmación no coinciden.");
                return;
            }
        }
        try {
            const payload = {
                name: profile.name,
                username: profile.username,
                email: profile.email,
            };

            if (passwords.newPassword) {
                payload.currentPassword = passwords.currentPassword;
                payload.newPassword = passwords.newPassword;
            }

            const result = await updateUser(payload);
            const updatedUser = result?.user ?? result?.data?.user;

            setUser?.(
                updatedUser ?? ((prev) => ({
                    ...(prev ?? {}),
                    name: profile.name,
                    username: profile.username,
                    email: profile.email,
                })),
            );

            setNotice("Changes saved successfully.");
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDelete = async () => {
        setError("");
        setNotice("");

        try {
            await deleteUser();
            setUser(null);
            setNotice("Account deleted successfully.");
            navigate("/");
        } catch (error) {
            setError(error.message);
        }
    };

    if (!user) return null;

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Account Settings</h1>

            <form className={styles.card} onSubmit={handleSubmit}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.sectionTitle}>Profile Information</h2>
                </div>

                <div className={styles.profileRow}>
                    <div className={styles.avatarWrap} aria-hidden="true">
                        {user?.image ? (
                            <img className={styles.avatarImg} src={user.image} alt="" />
                        ) : (
                            <div className={styles.avatarFallback}>{initials}</div>
                        )}
                    </div>

                    <div className={styles.profileMeta}>
                        <div className={styles.profileName}>{displayName}</div>
                        <div className={styles.profileUsername}>{displayUsername}</div>
                    </div>
                </div>

                <div className={styles.grid}>
                    <label className={styles.field}>
                        <span className={styles.label}>Full name</span>
                        <input
                            className={styles.input}
                            value={profile.name}
                            onChange={(e) =>
                                setProfile((p) => ({ ...p, name: e.target.value }))
                            }
                            placeholder="Nombre completo"
                            autoComplete="name"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>Username</span>
                        <input
                            className={styles.input}
                            value={profile.username}
                            onChange={(e) =>
                                setProfile((p) => ({ ...p, username: e.target.value }))
                            }
                            placeholder="username"
                            autoComplete="username"
                        />
                    </label>

                    <label className={`${styles.field} ${styles.fullRow}`}>
                        <span className={styles.label}>Email</span>
                        <input
                            className={styles.input}
                            value={profile.email}
                            onChange={(e) =>
                                setProfile((p) => ({ ...p, email: e.target.value }))
                            }
                            placeholder="email@domain.com"
                            autoComplete="email"
                        />
                    </label>
                </div>

                <div className={styles.divider} />

                <h2 className={styles.sectionTitle}>Security &amp; Password</h2>

                <div className={styles.stack}>
                    <label className={styles.field}>
                        <span className={styles.label}>Current Password</span>
                        <input
                            className={styles.input}
                            type="password"
                            value={passwords.currentPassword}
                            onChange={(e) =>
                                setPasswords((p) => ({ ...p, currentPassword: e.target.value }))
                            }
                            autoComplete="current-password"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>New Password</span>
                        <input
                            className={styles.input}
                            type="password"
                            value={passwords.newPassword}
                            onChange={(e) =>
                                setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                            }
                            autoComplete="new-password"
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>Confirm Password</span>
                        <input
                            className={styles.input}
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={(e) =>
                                setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))
                            }
                            autoComplete="new-password"
                        />
                    </label>
                </div>

                {(error || notice) && (
                    <div
                        className={`${styles.message} ${error ? styles.error : styles.success}`}
                        role="status"
                    >
                        {error || notice}
                    </div>
                )}

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.cancel}
                        onClick={() => navigate(-1)}
                    >
            Cancelar
                    </button>
                    <button type="submit" className={styles.save}>
            Save Changes
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className={styles.delete}
                    >
            Delete Account
                    </button>
                </div>
            </form>
        </div>
    );
}
