import { useEffect, useState, type ReactNode } from "react";
import { clearStoredPassword, getStoredPassword, setStoredPassword } from "../auth/appPassword";
import "./AccesoGate.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

type Estado = "revisando" | "bloqueado" | "autorizado";

interface Props {
  children: ReactNode;
}

export function AccesoGate({ children }: Props) {
  const [estado, setEstado] = useState<Estado>("revisando");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guardada = getStoredPassword();
    if (!guardada) {
      setEstado("bloqueado");
      return;
    }
    verificar(guardada, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verificar(intento: string, mostrarError: boolean) {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: { "x-app-password": intento },
      });
      if (res.ok) {
        setStoredPassword(intento);
        setEstado("autorizado");
      } else {
        clearStoredPassword();
        setEstado("bloqueado");
        if (mostrarError) setError("La clave no es correcta.");
      }
    } catch {
      setEstado("bloqueado");
      if (mostrarError) setError("No se pudo conectar. Revisa tu conexión a internet.");
    } finally {
      setEnviando(false);
    }
  }

  if (estado === "autorizado") return <>{children}</>;

  if (estado === "revisando") {
    return (
      <div className="acceso-pantalla">
        <p className="acceso-cargando">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="acceso-pantalla">
      <div className="acceso-tarjeta">
        <h1 className="acceso-titulo">Inventario de Papelería</h1>
        <p className="acceso-instruccion">Escribe la clave para entrar.</p>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="clave-acceso">
            Clave
          </label>
          <input
            id="clave-acceso"
            className="campo__input"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && clave.trim() && !enviando) {
                verificar(clave.trim(), true);
              }
            }}
            autoFocus
          />
        </div>

        {error && (
          <div className="mensaje-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="boton boton--primario"
          disabled={enviando || !clave.trim()}
          onClick={() => verificar(clave.trim(), true)}
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
