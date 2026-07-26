import { useState } from "react";
import styles from "./Login.module.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;

export default function Login({ onSuccess }) {
  const [credentials, setCredentials] = useState({ user: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError(null);
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedUser = credentials.user.trim();
    const trimmedPassword = credentials.password.trim();

    if (!trimmedUser || !trimmedPassword) {
      setError("Ingresa correo y contraseña.");
      return;
    }

    const attemptLogin = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(LOGIN_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: trimmedUser,
            password: trimmedPassword,
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const message = payload?.detail || "No se pudo iniciar sesión.";
          throw new Error(message);
        }

        if (payload?.success && payload.user) {
          onSuccess(payload.user);
        } else {
          throw new Error("Respuesta inesperada del servidor.");
        }
      } catch (err) {
        setError(err.message || "Error desconocido.");
      } finally {
        setIsLoading(false);
      }
    };

    void attemptLogin();
  };

  return (
    <div className={styles.loginPage}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h1>Iniciar sesión</h1>

        <label>
          Correo electrónico
          <input
            type="email"
            name="user"
            value={credentials.user}
            onChange={handleChange}
            placeholder="usuario@empresa.com"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="Contraseña"
            required
          />
        </label>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Validando..." : "Entrar"}
        </button>

        {error && <p className={styles.loginError}>{error}</p>}
      </form>
    </div>
  );
}
