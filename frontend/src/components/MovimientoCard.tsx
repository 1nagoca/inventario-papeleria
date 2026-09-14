import { useState } from "react";
import { anularVenta } from "../api/movements";
import { ApiError } from "../api/client";
import type { MovimientoConProducto } from "../types/movimiento";
import { formatFechaHora } from "../utils/format";
import "./MovimientoCard.css";

const TIPO_TEXTO = { VENTA: "Venta", ENTRADA: "Entrada" } as const;

interface Props {
  movimiento: MovimientoConProducto;
  onAnulado: () => void;
}

export function MovimientoCard({ movimiento, onAnulado }: Props) {
  const esVenta = movimiento.tipo === "VENTA";
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmarAnular() {
    setError(null);
    setEnviando(true);
    try {
      await anularVenta(movimiento.id);
      onAnulado();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo anular la venta.");
      setEnviando(false);
    }
  }

  const clases = [
    "movimiento-card",
    `movimiento-card--${movimiento.tipo.toLowerCase()}`,
    movimiento.cancelado ? "movimiento-card--cancelado" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={clases}>
      <div className="movimiento-card__fila">
        <span className="movimiento-card__producto">{movimiento.producto.nombre}</span>
        <span className="movimiento-card__tipo">
          <span className="movimiento-card__punto" aria-hidden="true" />
          {TIPO_TEXTO[movimiento.tipo]}
        </span>
      </div>
      <div className="movimiento-card__fila">
        <span className="movimiento-card__fecha">{formatFechaHora(movimiento.fecha)}</span>
        <span className="movimiento-card__cantidad">
          {esVenta ? "−" : "+"}
          {movimiento.cantidad}
        </span>
      </div>

      {movimiento.cancelado && (
        <p className="movimiento-card__anulada">Anulada — no cuenta en los totales.</p>
      )}

      {esVenta && !movimiento.cancelado && !confirmando && (
        <button
          type="button"
          className="movimiento-card__boton-anular"
          onClick={() => setConfirmando(true)}
        >
          Anular esta venta
        </button>
      )}

      {confirmando && (
        <div className="movimiento-card__confirmar">
          <p className="movimiento-card__pregunta">
            ¿Anular esta venta? Las {movimiento.cantidad} unidades vuelven al inventario.
          </p>

          {error && (
            <div className="mensaje-error" role="alert">
              {error}
            </div>
          )}

          <div className="movimiento-card__acciones">
            <button
              type="button"
              className="boton boton--peligro"
              disabled={enviando}
              onClick={confirmarAnular}
            >
              {enviando ? "Anulando..." : "Sí, anular"}
            </button>
            <button
              type="button"
              className="boton boton--secundario"
              onClick={() => setConfirmando(false)}
              disabled={enviando}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
