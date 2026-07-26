import { useEffect, useState } from "react";
import pagestyles from "./page.module.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const VISITS_ENDPOINT = `${API_BASE_URL}/visitas/dia`;

const toInputDate = (d) => d.toISOString().slice(0, 10);
const formatTime = (v) => (!v ? "-" : v.slice(0, 5));

export default function Home({ user }) {
  const [visits, setVisits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isSupervisor = user?.rol?.toLowerCase() === "supervisor";
  const isTechnician = user?.rol?.toLowerCase() === "tecnico";

  const tableCaption =
    isSupervisor
      ? "Visitas programadas para tu equipo"
      : isTechnician
      ? "Tus visitas programadas"
      : "Visitas del día";

  useEffect(() => {
    if (!user?.id) return;

    const fetchVisits = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          usuario_id: user.id,
          fecha: selectedDate,
        });

        const res = await fetch(`${VISITS_ENDPOINT}?${params}`);
        const payload = await res.json();

        if (!res.ok) throw new Error(payload?.detail || "No se pudo obtener visitas");

        setVisits(payload.visitas || []);
      } catch (err) {
        setError(err.message);
        setVisits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
  }, [user, selectedDate]);

  return (
    <div className={pagestyles.page}>
      <header>
        <h2>Visitas del día</h2>
        <p>Hola {user?.nombre}, estas son las visitas de hoy.</p>
      </header>

      <section className={pagestyles.filters}>
        <label>
          Seleccionar fecha
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </section>

      {isLoading && <p>Cargando visitas...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!isLoading && !error && (
        <section>
          {visits.length === 0 ? (
            <div className={pagestyles.emptyState}>
              No hay visitas registradas para esta fecha.
            </div>
          ) : (
            <div className={pagestyles.tableWrapper}>
              <table>
                <caption>{tableCaption}</caption>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    {isSupervisor && <th>Técnico</th>}
                    {isTechnician && <th>Supervisor</th>}
                    {!isSupervisor && !isTechnician && <th>Técnico</th>}
                    <th>Estado</th>
                    <th>Horario</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id}>
                      <td>{v.cliente}</td>
                      {isSupervisor && <td>{v.tecnico}</td>}
                      {isTechnician && <td>{v.supervisor}</td>}
                      {!isSupervisor && !isTechnician && <td>{v.tecnico}</td>}
                      <td>{v.estado}</td>
                      <td>
                        {formatTime(v.hora_inicio)} - {formatTime(v.hora_fin)}
                      </td>
                      <td>{v.notas || "Sin notas"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
