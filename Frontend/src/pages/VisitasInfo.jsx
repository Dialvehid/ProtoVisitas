import { useCallback, useEffect, useState } from "react";
import pagestyles from "./page.module.scss";
import styles from "./visitas.module.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const DATA_ENDPOINT = `${API_BASE_URL}/visitas/all`;

const formatTime = (v) => (!v ? "--:--" : v.slice(0, 5));
const abrirEnVenata = (url) => {window.open(url, "_blank", "noopener,noreferrer");};

export default function VisitasInfo({ user }) {
    const [data, setData] = useState({visitas:[]} );
    const [isLoading, setIsLoading] = useState(false);
    const [error , setError] = useState(null)

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                usuario_id: user.id,
            });

            const response = await fetch(`${DATA_ENDPOINT}?${params}`);
            const payload = await response.json();

            if (!response.ok) {
                throw new Error("No se pudo obtener la información.");
            }

            setData((p)=>({...p,visitas : payload.visitas}));
        } catch (err) {
            setError(err.message);
            setData({ visitas: [] });
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    if (isLoading) return <p>Cargando...</p>;
    if (error) return <p>Error: {error}</p>;
    return(
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
                {(data.visitas.map((v) => {
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
                }))}
            </tbody>
        </table>
    </div>
)}
