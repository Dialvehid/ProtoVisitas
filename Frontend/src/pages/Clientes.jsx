import { useEffect, useState } from "react";
import MapPicker from "../components/MapPicker/MapPicker";
import pagestyles from "./page.module.scss";
import styles from "./clientes.module.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const CLIENTES_ENDPOINT = `${API_BASE_URL}/clientes`;

const EMPTY_FORM = {
    nombre: "",
    direccion: "",
    departamento: "",
    municipio: "",
    telefono: "",
    email: "",
    latitud: "",
    longitud: "",
};

export default function Clientes() {
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [editingId, setEditingId] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {loadClients();}, []);

    /* ---------------- LOAD DATA ---------------- */

    const loadClients = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(CLIENTES_ENDPOINT);
            if (!res.ok) throw new Error("No se pudo obtener clientes");

            const data = await res.json();
            setClients(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    };

    /* ---------------- LISTA FILTRADA ---------------- */

    const filteredClients = clients.filter((c) =>
        [
            c.nombre, c.direccion, c.departamento,
            c.municipio, c.telefono, c.email
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(searchText.toLowerCase())
    );

    /* ---------------- HANDLERS ---------------- */

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value }));
    };

    const handleCoordinateSelect = (coords) => {
        setFormData((p) => ({
            ...p,
            latitud: coords?.lat.toFixed(6) ?? "",
            longitud: coords?.lng.toFixed(6) ?? "",
        }));
    };

    const handleEdit = (c) => {
        setFormData({
            nombre: c.nombre ?? "",
            direccion: c.direccion ?? "",
            departamento: c.departamento ?? "",
            municipio: c.municipio ?? "",
            telefono: c.telefono ?? "",
            email: c.email ?? "",
            latitud: c.latitud?.toFixed?.(6) ?? "",
            longitud: c.longitud?.toFixed?.(6) ?? "",
        });
        setEditingId(c.id);
    };

    const resetForm = () => {
        setFormData({ ...EMPTY_FORM });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim())
            return setError("El nombre es obligatorio.");

        setIsSubmitting(true);
        setError(null);

        const payload = {
            nombre: formData.nombre.trim(),
            direccion: formData.direccion.trim() || null,
            departamento: formData.departamento.trim() || null,
            municipio: formData.municipio.trim() || null,
            telefono: formData.telefono.trim() || null,
            email: formData.email.trim() || null,
            latitud: formData.latitud ? Number(formData.latitud) : null,
            longitud: formData.longitud ? Number(formData.longitud) : null,
        };

        try {
            const method = editingId ? "PUT" : "POST";
            const url = editingId
                ? `${CLIENTES_ENDPOINT}/${editingId}`
                : CLIENTES_ENDPOINT;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("No se pudo guardar el cliente");

            await loadClients();
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar cliente?")) return;

        setDeletingId(id);
        setError(null);

        try {
            const res = await fetch(`${CLIENTES_ENDPOINT}/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("No se pudo eliminar");

            await loadClients();
            if (editingId === id) resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const currentCoordinates = formData.latitud && formData.longitud
        ? { lat: Number(formData.latitud), lng: Number(formData.longitud) }
        : null;

    /* ---------------- UI ---------------- */

    return (
        <div className={pagestyles.page}>
            <header>
                <h2>Manejo de clientes</h2>
            </header>

            <section>
                <div className={styles.sectionHeader}>
                    <h3>{editingId ? "Editar cliente" : "Nuevo cliente"}</h3>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre *" required />

                    <input name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Dirección" />
                    <input name="departamento" value={formData.departamento} onChange={handleChange} placeholder="Departamento" />
                    <input name="municipio" value={formData.municipio} onChange={handleChange} placeholder="Municipio" />
                    <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono" />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Correo" />

                    <div className={styles.coordinates}>
                        <div className={styles.coordinatesGrid}>
                            <input name="latitud" value={formData.latitud} onChange={handleChange} placeholder="Latitud" />
                            <input name="longitud" value={formData.longitud} onChange={handleChange} placeholder="Longitud" />
                        </div>

                        <MapPicker
                            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                            value={currentCoordinates}
                            onChange={handleCoordinateSelect}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className={styles.formActions}>
                        {editingId && (
                            <button type="button" onClick={resetForm} className={styles.secondaryButton}>
                                Cancelar
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting}>
                            {editingId ? "Actualizar" : "Guardar"}
                        </button>
                    </div>
                </form>
            </section>

            <section>
                <h3>Clientes registrados</h3>

                <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar..."
                />

                {isLoading ? (
                    <p>Cargando...</p>
                ) : filteredClients.length === 0 ? (
                    <p>No hay resultados</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Dirección</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.nombre}</td>
                                    <td>{c.direccion}</td>
                                    <td>
                                        <button onClick={() => handleEdit(c)}>Editar</button>
                                        <button onClick={() => handleDelete(c.id)}
                                            disabled={deletingId === c.id}>
                                            {deletingId === c.id ? "..." : "Eliminar"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
