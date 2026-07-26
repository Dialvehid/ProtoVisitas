import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./navbar.module.scss";
import logo from "../assets/logo.jpg";
import defaultAvatar from "../assets/antoine-van-bergen-superball-avb.jpeg";

// Utilidad: cerrar al hacer click fuera
function useClickOutside(ref, onOutside) {
    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) onOutside();
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ref, onOutside]);
}

// Dropdown genérico
function Dropdown({ label, children, align = "left", className }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useClickOutside(ref, () => setOpen(false));

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className={`${styles.dropdown} ${className || ""}`} ref={ref}>
            <button
                className={styles.dropdownTrigger}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                {label}
                <span className={styles.caret} aria-hidden>▾</span>
            </button>
            <div
                className={`${styles.dropdownMenu} ${open ? styles.open : ""} ${align === "right" ? styles.right : ""
                    }`}
                role="menu"
            >
                {children}
            </div>
        </div>
    );
}

export default function Navbar({ user, onLogout }) {
    const navigate = useNavigate();
    const displayName = user?.nombre || "Usuario";
    const displayRole = user?.rol ? `(${user.rol})` : "";
    const avatarSrc = user?.avatarUrl || defaultAvatar;
    const isSupervisor = user?.rol?.toLowerCase() === "supervisor";
    const isTechnician = user?.rol?.toLowerCase() === "tecnico";
    const isAdmin = user?.rol?.toLowerCase() === "administrador";

    const handleLogout = () => {
        onLogout?.();
    };
    return (
        <nav className={styles.navbar} role="navigation" aria-label="Principal">
            {/* IZQUIERDA: Logo + título */}
            <div className={styles.left}>
                <button
                    type="button"
                    className={styles.logoLink}
                    onClick={() => navigate("/")}
                    aria-label="Ir al inicio"
                >
                    <img className={styles.logoImg} src={logo} alt="Logo Skynet" />
                    <span className={styles.brand}>Skynet</span>
                </button>
            </div>

            {/* CENTRO: Menús */}
            <ul className={styles.center} role="menubar" aria-label="Opciones">
                <li role="none">
                    <Dropdown label="Clientes">
                        <button
                            role="menuitem"
                            className={styles.menuItem}
                            onClick={() => navigate("/clientes")}
                        >
                            Clientes
                        </button>
                    </Dropdown>
                </li>
                <li role="none">
                    <Dropdown label="Visitas a clientes">
                        {(isSupervisor || isAdmin) && (
                            <button
                                role="menuitem"
                                className={styles.menuItem}
                                onClick={() => navigate("/visitas/supervisor")}
                            >
                                Visión de supervisor
                            </button>
                        )}
                        {(isTechnician || isAdmin) && (
                            <button
                                role="menuitem"
                                className={styles.menuItem}
                                onClick={() => navigate("/visitas/tecnico")}
                            >
                                Visión de técnico
                            </button>
                        )}
                        {(
                            <button
                                role="menuitem"
                                className={styles.menuItem}
                                onClick={() => navigate("/visitasInfo")}
                            >
                                Informacion de Visitas
                            </button>
                        )}
                        {!isSupervisor && !isTechnician && !isAdmin && (
                            <span className={styles.menuItem} role="menuitem" aria-disabled="true">
                                Sin permisos disponibles
                            </span>
                        )}
                    </Dropdown>
                </li>
                <li role="none">
                    <Dropdown label="Configuraciones de sistema">
                        <button
                            role="menuitem"
                            className={styles.menuItem}
                            onClick={() => navigate("/perfil")}
                        >
                            Configuración de perfil
                        </button>
                        {isAdmin && (
                            <button
                                role="menuitem"
                                className={styles.menuItem}
                                onClick={() => navigate("/usuarios")}
                            >
                                Usuarios
                            </button>
                        )}
                    </Dropdown>
                </li>
            </ul>

            {/* DERECHA: Usuario */}
            <div className={styles.right}>
                <Dropdown
                    label={
                        <span className={styles.userTrigger}>
                            <img
                                className={styles.avatar}
                                src={avatarSrc}
                                alt={`Avatar de ${displayName}`}
                            />
                            <span className={styles.userName}>{displayName}</span>
                        </span>
                    }
                    align="right"
                    className={styles.userDropdown}
                >
                    <span className={styles.menuItem} role="menuitem" aria-disabled="true">
                        {displayRole || "Sin rol"}
                    </span>
                    <hr className={styles.sep} />
                    <button role="menuitem" className={styles.menuItem} onClick={handleLogout}>Cerrar sesión</button>
                </Dropdown>
            </div>
        </nav>
    );
}
