import { useCallback, useEffect, useState } from "react";
import pagestyles from "./page.module.scss";
import styles from "./visitas.module.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const GESTION_ENDPOINT = `${API_BASE_URL}/visitas/gestion`;
const CREATE_VISIT_ENDPOINT = `${API_BASE_URL}/visitas`;

const toInputDate = (v) => v.toISOString().slice(0, 10);
const formatTime = (v) => (!v ? "--:--" : v.slice(0, 5));
const abrirEnVenata = (url) => {window.open(url, "_blank", "noopener,noreferrer");};

const EMPTY_FORM = {
    cliente_id: "",
    tecnico_id: "",
    fecha_programada: "",
    notas: "",
};

export default function VisitasSupervisor({ user }) {
    const isSupervisor = user?.rol?.toLowerCase() === "supervisor";
    const isAdmin = user?.rol?.toLowerCase() === "administrador";
    const allowed = isSupervisor || isAdmin;

    const today = toInputDate(new Date());

    const [selectedDate, setSelectedDate] = useState(today);
    const [data, setData] = useState({
        visitas: [],
        clientes: [],
        tecnicos: [],
        rol: user?.rol || "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        ...EMPTY_FORM,
        fecha_programada: today,
    });
    const [formError, setFormError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // LOAD DATA 

    const loadData = useCallback(async () => {
        if (!allowed || !user?.id) return;

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                usuario_id: user.id,
                fecha: selectedDate,
            });

            const response = await fetch(`${GESTION_ENDPOINT}?${params}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.detail || "No se pudo obtener la información.");
            }

            setData({
                visitas: payload.visitas || [],
                clientes: payload.clientes || [],
                tecnicos: payload.tecnicos || [],
                rol: payload.rol || user.rol,
            });
        } catch (err) {
            setError(err.message);
            setData((p) => ({ ...p, visitas: [] }));
        } finally {
            setIsLoading(false);
        }
    }, [allowed, selectedDate, user?.id, user?.rol]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // FORM 

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!isSupervisor) return;

        if (!formData.cliente_id || !formData.tecnico_id || !formData.fecha_programada) {
            setFormError("Selecciona cliente, técnico y fecha.");
            return;
        }

        setFormError(null);
        setIsSaving(true);

        try {
            const response = await fetch(`${CREATE_VISIT_ENDPOINT}?usuario_id=${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cliente_id: Number(formData.cliente_id),
                    tecnico_id: Number(formData.tecnico_id),
                    fecha_programada: formData.fecha_programada,
                    notas: formData.notas?.trim() || null,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.detail || "No se pudo crear la visita.");
            }

            // Reset form
            setFormData({
                ...EMPTY_FORM,
                fecha_programada: selectedDate,
            });

            await loadData();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // NO PERMISOS 

    if (!allowed) {
        return (
            <div className={pagestyles.page}>
                <h2>Visitas - Supervisión</h2>
                <p>No tienes permisos para acceder.</p>
            </div>
        );
    }

    const visitCaption = isSupervisor ? "Visitas de tu equipo" : "Visitas registradas";
    const noTechnicians = isSupervisor && data.tecnicos.length === 0;

    // RENDER 

    return (
        <div className={pagestyles.page}>
            <header>
                <h2>Visitas - Supervisión</h2>
            </header>

            <section className={pagestyles.filters}>
                <label>
                    Fecha
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </label>
            </section>

            {/* FORMULARIO */}

            <section>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3>Programar nueva visita</h3>
                        <p>Asigna visitas a tus técnicos.</p>
                    </div>
                    <span className={styles.badge}>Rol: {data.rol}</span>
                </div>

                {formError && <div className={styles.feedback}>{formError}</div>}

                {isSupervisor &&
                    (noTechnicians ? (
                        <p className={styles.warn}>No tienes técnicos asignados.</p>
                    ) : (
                        <form className={styles.form} onSubmit={handleCreate}>
                            <div className={styles.formGrid}>
                                <label>
                                    Cliente
                                    <select
                                        name="cliente_id"
                                        value={formData.cliente_id}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Selecciona un cliente</option>
                                        {data.clientes.map((cliente) => (
                                            <option key={cliente.id} value={cliente.id}>
                                                {cliente.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Técnico
                                    <select
                                        name="tecnico_id"
                                        value={formData.tecnico_id}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Selecciona un técnico</option>
                                        {data.tecnicos.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Fecha
                                    <input
                                        type="date"
                                        name="fecha_programada"
                                        value={formData.fecha_programada}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </label>

                                <label className={styles.fullRow}>
                                    Notas
                                    <textarea
                                        name="notas"
                                        value={formData.notas}
                                        onChange={handleFormChange}
                                        rows={3}
                                    />
                                </label>
                            </div>

                            <div className={styles.formActions}>
                                <button type="submit" disabled={isSaving}>
                                    {isSaving ? "Guardando..." : "Guardar visita"}
                                </button>
                            </div>
                        </form>
                    ))}
            </section>

            { /*TABLA*/ }

            <section>
                <div className={styles.sectionHeader}>
                    <div>
                        <h3>{visitCaption}</h3>
                        <p>Consulta estado de cada visita.</p>
                    </div>
                    <span className={styles.badge}>Rol: {data.rol}</span>
                </div>

                {error && <div className={styles.feedback}>{error}</div>}

                {isLoading ? (
                    <p>Cargando...</p>
                ) : data.visitas.length === 0 ? (
                    <div className={pagestyles.emptyState}>No hay visitas.</div>
                ) : (
                    <div className={pagestyles.tableWrapper}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Dirección</th>
                                    <th>Técnico</th>
                                    <th>Estado</th>
                                    <th>Horario</th>
                                    <th>Notas</th>
                                    <th>Enlace</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.visitas.map((v) => {
                                    const link =
                                        v.cliente_latitud && v.cliente_longitud
                                            ? `https://www.google.com/maps/dir/?api=1&destination=${v.cliente_latitud},${v.cliente_longitud}`
                                            : null;

                                    return (
                                        <tr key={v.id}>
                                            <td>{v.cliente}</td>
                                            <td>{v.cliente_direccion || "—"}</td>
                                            <td>{v.tecnico}</td>
                                            <td>
                                                <span className={styles.status}>
                                                    {v.estado || "Sin estado"}
                                                </span>
                                            </td>
                                            <td>
                                                {formatTime(v.hora_inicio)} - {formatTime(v.hora_fin)}
                                            </td>
                                            <td>{v.notas || "Sin notas"}</td>
                                            <td>
                                                {link ? (
                                                    <button onClick={()=>(abrirEnVenata(link))}>Ruta</button>
                                                ) : (
                                                    "Sin coordenadas"
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
