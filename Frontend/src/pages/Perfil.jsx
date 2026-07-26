import { useState } from "react";
import pagestyles from "./page.module.scss";
import styles from "./perfil.module.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const PROFILE_ENDPOINT = `${API_BASE_URL}/usuarios/perfil`;

export default function Perfil({ user, onProfileUpdate }) {
    const [formData, setFormData] = useState({
        nombre: user?.nombre || "",
        email: user?.email || "",
        nueva_contrasena: "",
        confirmar: "",
    });

    const [message, setMessage] = useState(null);
    const [status, setStatus] = useState(null); // "error" | "success" | "info"
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!user) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
        setMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nombre = formData.nombre.trim();
        const email = formData.email.trim();
        const pass = formData.nueva_contrasena;

        if (!nombre || !email) {
            return showFeedback("Nombre y correo son obligatorios", "error");
        }

        if (pass) {
            if (pass.length < 12)
                return showFeedback("La contraseña debe tener al menos 12 caracteres", "error");

            if (pass !== formData.confirmar)
                return showFeedback("Las contraseñas no coinciden", "error");
        }

        const payload = {
            ...(nombre !== user.nombre && { nombre }),
            ...(email !== user.email && { email }),
            ...(pass && { nueva_contrasena: pass }),
        };

        if (Object.keys(payload).length === 0) {
            return showFeedback("No hay cambios por guardar", "info");
        }

        setIsSubmitting(true);
        showFeedback(null, null);

        try {
            const res = await fetch(`${PROFILE_ENDPOINT}?usuario_id=${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const body = await res.json();
            if (!res.ok) throw new Error(body?.detail);

            onProfileUpdate?.(body);
            setFormData((p) => ({ ...p, nueva_contrasena: "", confirmar: "" }));
            showFeedback("Perfil actualizado correctamente", "success");
        } catch (err) {
            showFeedback(err.message || "No se pudo actualizar", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const showFeedback = (msg, type) => {
        setMessage(msg);
        setStatus(type);
    };

    return (
        <div className={pagestyles.page}>
            <header>
                <h2>Configuración de perfil</h2>
                <p>Actualiza tu información personal y contraseña.</p>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
                <label>
                    Nombre completo
                    <input
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    Correo electrónico
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    Nueva contraseña (opcional)
                    <input
                        type="password"
                        name="nueva_contrasena"
                        value={formData.nueva_contrasena}
                        onChange={handleChange}
                    />
                </label>

                {formData.nueva_contrasena && (
                    <label>
                        Confirmar nueva contraseña
                        <input
                            type="password"
                            name="confirmar"
                            value={formData.confirmar}
                            onChange={handleChange}
                        />
                    </label>
                )}

                {message && (
                    <p className={`${styles.feedback} ${styles[status]}`}>
                        {message}
                    </p>
                )}

                <div className={styles.actions}>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}
