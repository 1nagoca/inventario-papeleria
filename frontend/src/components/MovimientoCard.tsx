import type { MovimientoConProducto } from "../types/movimiento";
import { formatFechaHora } from "../utils/format";
import "./MovimientoCard.css";

const TIPO_TEXTO = { VENTA: "Venta", ENTRADA: "Entrada" } as const;

export function MovimientoCard({ movimiento }: { movimiento: MovimientoConProducto }) {
  const esVenta = movimiento.tipo === "VENTA";

  return (
    <li className={`movimiento-card movimiento-card--${movimiento.tipo.toLowerCase()}`}>
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
    </li>
  );
}
