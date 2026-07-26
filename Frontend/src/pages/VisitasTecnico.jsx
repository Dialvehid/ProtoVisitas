import { useCallback, useEffect, useState } from "react";
import MapPicker from "../components/MapPicker/MapPicker";
import pagestyles from "./page.module.scss";
import styles from "./visitas.module.scss";

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const GESTION_ENDPOINT = `${API_BASE_URL}/visitas/gestion`;

// Funciones
const START_VISIT_ENDPOINT = (id) => `${API_BASE_URL}/visitas/${id}/iniciar`;
const FINISH_VISIT_ENDPOINT = (id) => `${API_BASE_URL}/visitas/${id}/finalizar`;
const toInputDate = (value) => value.toISOString().slice(0, 10);
const formatTime = (v) => (!v ? "--:--" : v.slice(0, 5));

export default function VisitasTecnico({ user }) {
    const isTechnician = user?.rol?.toLowerCase() === "tecnico";
    const isAdmin = user?.rol?.toLowerCase() === "administrador";
    const allowed = isTechnician || isAdmin;
    const today = toInputDate(new Date());
    const abrirEnVenata = (url) => {window.open(url, "_blank", "noopener,noreferrer");};

    // Estados
    const [selectedDate, setSelectedDate] = useState(today);
    const [data, setData] = useState({ visitas: [], rol: user?.rol || "" });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionState, setActionState] = useState(null);
    const closeAction = () => setActionState(null);

    //Cargar visitas 
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
                throw new Error("No se pudo obtener las visitas.");
            }

            setData((prev)=>({...prev, visitas: payload.visitas || [] }));

        } catch (err) {
            setError(err.message);
            setData((p) => ({ ...p, visitas: [] }));
        } finally {
            setIsLoading(false);
        }
    }, [allowed, selectedDate, user?.id]);

    // Carga de data cada vez que se cambia la fecha
    useEffect(() => {loadData();}, [loadData]);


    //Abrir panel de acción 
    const openActionPanel = (visit, mode) => {
        if (!isTechnician) return;

        const coordsStart = visit.latitud_inicio && visit.longitud_inicio ? { lat: visit.latitud_inicio, lng: visit.longitud_inicio } : null;
        const coordsFinish = visit.latitud_fin && visit.longitud_fin ? { lat: visit.latitud_fin, lng: visit.longitud_fin } : null;
        const coordsClient = visit.cliente_latitud && visit.cliente_longitud ? { lat: visit.cliente_latitud, lng: visit.cliente_longitud } : null;

        let defaultCoords = null;
        if (mode === "start") defaultCoords = coordsStart || coordsClient;
        else defaultCoords = coordsFinish || coordsStart || coordsClient;

        setActionState({
            visit,
            mode,
            coordinates: defaultCoords || null,
            notes: "",
            isSubmitting: false,
            error: null,
            directionsUrl: coordsClient
                ? `https://www.google.com/maps/dir/?api=1&destination=${visit.cliente_latitud},${visit.cliente_longitud}`
                : null,
        });
    };


    const handleConfirm = async () => {
        if (!actionState) return;

        // Obtener informacion de accion
        const { mode, visit, coordinates, notes } = actionState;

        if (!coordinates)
            return setActionState((p) => ({ ...p, error: "Selecciona un punto en el mapa." }));

        // Se crea uri para consumir api
        const endpoint = `${mode === "start"
            ? START_VISIT_ENDPOINT(visit.id)
            : FINISH_VISIT_ENDPOINT(visit.id)
        }?usuario_id=${user.id}`;

        const body = {
            latitud: coordinates.lat,
            longitud: coordinates.lng,
            ...(mode === "finish" && notes.trim() ? { notas: notes.trim() } : {})
        };

        setActionState((p) => ({ ...p, isSubmitting: true, error: null }));

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error( "No se pudo actualizar la visita.");

            await loadData();
            closeAction();
        } catch (err) {
            setActionState((p) => ({ ...p, error: err.message }));
        } finally {
            setActionState((p) => ({ ...p, isSubmitting: false }));
        }
    };


    if (!allowed) {
        return (
            <div className={pagestyles.page}>
                <h2>Visitas - Técnicos</h2>
                <p>No tienes permisos para esta vista.</p>
            </div>
        );
    }

    return (
        <div className={pagestyles.page}>
            <header>
                <h2>Visitas - Técnicos</h2>
            </header>

            <section className={pagestyles.filters}>
                <label>
                    Fecha
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </label>

                <p>Mostrando datos para: {selectedDate}</p>
            </section>

            <section>
                <div className={styles.sectionHeader}>
                    <h3>{isTechnician ? "Tus visitas" : "Visitas registradas"}</h3>
                    <span className={styles.badge}>Rol: {data.rol}</span>
                </div>

                {error && <div className={styles.feedback}>{error}</div>}

                {isLoading ? (
                    <p>Cargando...</p>
                ) : data.visitas.length === 0 ? (
                    <div>No hay visitas para esta fecha.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Supervisor</th>
                                <th>Estado</th>
                                <th>Horario</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Iniciar y finalizar una visita */}
                            {data.visitas.map((v) => {
                                const canStart = isTechnician && !v.hora_inicio;
                                const canFinish = isTechnician && v.hora_inicio && !v.hora_fin;

                                return (
                                    <tr key={v.id}>
                                        <td>{v.cliente}</td>
                                        <td>{v.supervisor}</td>
                                        <td>{v.estado}</td>
                                        <td>{formatTime(v.hora_inicio)} - {formatTime(v.hora_fin)}</td>
                                        <td>
                                            {v.cliente_latitud && (
                                                
                                                    <button onClick={()=>(abrirEnVenata(`https://www.google.com/maps/dir/?api=1&destination=${v.cliente_latitud},${v.cliente_longitud}`))}>Ruta</button>
                                            )}
                                            {canStart && <button onClick={() => openActionPanel(v, "start")}>Iniciar</button>}
                                            {canFinish && <button onClick={() => openActionPanel(v, "finish")}>Finalizar</button>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </section>

            {actionState && (
                <div className={styles.actionOverlay}>
                    <div className={styles.actionPanel}>
                        <h3>{actionState.mode === "start" ? "Iniciar visita" : "Finalizar visita"}</h3>

                        <MapPicker
                            apiKey={googleMapsApiKey}
                            value={actionState.coordinates}
                            onChange={(coords) =>
                                setActionState((p) => ({ ...p, coordinates: coords }))
                            }
                            disabled={actionState.isSubmitting}
                        />

                        {actionState.mode === "finish" && (
                            <textarea
                                placeholder="Notas"
                                value={actionState.notes}
                                onChange={(e) =>
                                    setActionState((p) => ({ ...p, notes: e.target.value }))
                                }
                            />
                        )}

                        {actionState.error && <p className={styles.feedback}>{actionState.error}</p>}

                        <button onClick={closeAction}>Cancelar</button>
                        <button onClick={handleConfirm} disabled={actionState.isSubmitting}>
                            {actionState.isSubmitting ? "Guardando..." : "Confirmar"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
