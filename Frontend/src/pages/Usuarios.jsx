import { useCallback, useEffect, useState } from "react";
import pagestyles from "./page.module.scss";
import styles from "./usuarios.module.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USERS_ENDPOINT = `${API_BASE_URL}/usuarios`;

const EMPTY_FORM = {
    id: null,
    nombre: "",
    email: "",
    rol_id: "",
    supervisor_id: "",
    password: "",
    activo: true,
};

export default function Usuarios({ user }) {
    const isAdmin = user?.rol?.toLowerCase() === "administrador";
    const [users, setUsers] = useState([]);
    const [catalogs, setCatalogs] = useState({ roles: [], supervisores: [] });
const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        if (!isAdmin || !user?.id) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [usersRes, catalogsRes] = await Promise.all([
                fetch(`${USERS_ENDPOINT}?usuario_id=${user.id}`),
                fetch(`${USERS_ENDPOINT}/catalogos?usuario_id=${user.id}`),
            ]);

            const [usersBody, catalogsBody] = await Promise.all([
                usersRes.json().catch(() => null),
                catalogsRes.json().catch(() => null),
            ]);

            if (!usersRes.ok) {
                const message = usersBody?.detail || "No se pudieron cargar los usuarios.";
                throw new Error(message);
            }
            if (!catalogsRes.ok) {
                const message = catalogsBody?.detail || "No se pudieron cargar los catálogos.";
                throw new Error(message);
            }

            setUsers(usersBody || []);
            setCatalogs({
                roles: catalogsBody?.roles || [],
                supervisores: catalogsBody?.supervisores || [],
            });
        } catch (err) {
            setUsers([]);
            setCatalogs({ roles: [], supervisores: [] });
            setError(err.message || "No se pudo obtener la información de usuarios.");
        } finally {
            setIsLoading(false);
        }
    }, [isAdmin, user]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const resetForm = () => {
        setFormData({ ...EMPTY_FORM });
        setSuccess(null);
        setError(null);
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setSuccess(null);
        setError(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isAdmin || !user?.id) {
            return;
        }
        const trimmedName = formData.nombre.trim();
        const trimmedEmail = formData.email.trim();
        if (!trimmedName || !trimmedEmail || !formData.rol_id) {
            setError("Completa nombre, correo y rol.");
            return;
        }
        if (!formData.id && formData.password.trim().length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        const payload = {
            nombre: trimmedName,
            email: trimmedEmail,
            rol_id: Number(formData.rol_id),
            supervisor_id: formData.supervisor_id ? Number(formData.supervisor_id) : null,
            activo: formData.activo,
        };

        const endpoint = formData.id
            ? `${USERS_ENDPOINT}/${formData.id}?usuario_id=${user.id}`
            : `${USERS_ENDPOINT}?usuario_id=${user.id}`;
        const method = formData.id ? "PUT" : "POST";

        if (!formData.id) {
            payload.password = formData.password.trim();
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const body = await response.json().catch(() => null);
            if (!response.ok) {
                const message = body?.detail || "No se pudo guardar el usuario.";
                throw new Error(message);
            }

            await loadData();
            resetForm();
            setSuccess(formData.id ? "Usuario actualizado." : "Usuario creado.");
        } catch (err) {
            setError(err.message || "No se pudo guardar el usuario.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (record) => {
        setFormData({
            id: record.id,
            nombre: record.nombre,
            email: record.email,
            rol_id: String(record.rol_id),
            supervisor_id: record.supervisor_id ? String(record.supervisor_id) : "",
            password: "",
            activo: record.activo,
        });
        setSuccess(null);
        setError(null);
    };

    const handleResetPassword = async (record) => {
        if (!isAdmin || !user?.id) {
            return;
        }
        const nextPassword = window.prompt(`Ingresa la nueva contraseña para ${record.nombre}`);
        if (!nextPassword) {
            return;
        }
        const trimmedPassword = nextPassword.trim();
        if (trimmedPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        try {
            const response = await fetch(
                `${USERS_ENDPOINT}/${record.id}/reset-password?usuario_id=${user.id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password: trimmedPassword }),
                },
            );
            const body = await response.json().catch(() => null);
            if (!response.ok) {
                const message = body?.detail || "No se pudo reiniciar la contraseña.";
                throw new Error(message);
            }
            setSuccess(`Contraseña restablecida para ${record.nombre}.`);
        } catch (err) {
            setError(err.message || "No se pudo reiniciar la contraseña.");
        }
    };

    if (!isAdmin) {
        return (
            <div className={pagestyles.page}>
                <header>
                    <h2>Administración de usuarios</h2>
                    <p>Solo los administradores pueden acceder a esta sección.</p>
                </header>
                <section>
                    <p>No tienes permisos para ver este módulo.</p>
                </section>
            </div>
        );
    }

    return (
        <div className={pagestyles.page}>
            <header>
                <h2>Administración de usuarios</h2>
                <p>Agrega nuevos integrantes, actualiza roles o asigna supervisores.</p>
            </header>

            <section>
                <div className={styles.sectionHeader}>
                    <h3>{formData.id ? "Editar usuario" : "Registrar usuario"}</h3>
                    {formData.id && (
                        <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                            Cancelar edición
                        </button>
                    )}
                </div>

                {error && <p className={`${styles.feedback} ${styles.error}`}>{error}</p>}
                {success && <p className={`${styles.feedback} ${styles.success}`}>{success}</p>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        <label>
                            Nombre completo
                            <input
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Luis Gómez"
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
                                placeholder="usuario@empresa.com"
                                required
                            />
                        </label>
                        <label>
                            Rol
                            <select name="rol_id" value={formData.rol_id} onChange={handleChange} required>
                                <option value="">Selecciona un rol</option>
                                {catalogs.roles.map((rol) => (
                                    <option key={rol.id} value={rol.id}>
                                        {rol.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Supervisor (opcional)
                            <select
                                name="supervisor_id"
                                value={formData.supervisor_id}
                                onChange={handleChange}
                            >
                                <option value="">Sin supervisor</option>
                                {catalogs.supervisores.map((sup) => (
                                    <option key={sup.id} value={sup.id}>
                                        {sup.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {!formData.id && (
                            <label>
                                Contraseña temporal
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••"
                                    required
                                />
                            </label>
                        )}
                        <label className={styles.checkboxField}>
                            <input
                                type="checkbox"
                                name="activo"
                                checked={formData.activo}
                                onChange={handleChange}
                            />
                            Usuario activo
                        </label>
                    </div>

                    <div className={styles.formActions}>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : formData.id ? "Guardar cambios" : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </section>

            <section>
                <div className={styles.sectionHeader}>
                    <h3>Usuarios registrados</h3>
                    <p>Restablece contraseñas o ajusta roles según sea necesario.</p>
                </div>

                {isLoading ? (
                    <p>Cargando usuarios...</p>
                ) : users.length === 0 ? (
                    <div className={pagestyles.emptyState}>No hay usuarios registrados.</div>
                ) : (
                    <div className={pagestyles.tableWrapper}>
                        <table data-responsive="true">
                            <caption>Listado general de usuarios</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Nombre</th>
                                    <th scope="col">Correo</th>
                                    <th scope="col">Rol</th>
                                    <th scope="col">Supervisor</th>
                                    <th scope="col">Estado</th>
                                    <th scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((record) => (
                                    <tr key={record.id}>
                                        <td data-label="Nombre">{record.nombre}</td>
                                        <td data-label="Correo">{record.email}</td>
                                        <td data-label="Rol">{record.rol}</td>
                                        <td data-label="Supervisor">{record.supervisor || "—"}</td>
                                        <td data-label="Estado">
                                            <span
                                                className={`${styles.statusBadge} ${
                                                    record.activo ? styles.active : styles.inactive
                                                }`}
                                            >
                                                {record.activo ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td data-label="Acciones">
                                            <div className={styles.rowActions}>
                                                <button
                                                    type="button"
                                                    className={styles.secondaryButton}
                                                    onClick={() => handleEdit(record)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.dangerButton}
                                                    onClick={() => handleResetPassword(record)}
                                                >
                                                    Reiniciar contraseña
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
