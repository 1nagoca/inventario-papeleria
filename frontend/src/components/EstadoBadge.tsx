import { ESTADO_TEXTO, type EstadoProducto } from "../utils/estadoProducto";
import "./EstadoBadge.css";

export function EstadoBadge({ estado }: { estado: EstadoProducto }) {
  return (
    <span className={`estado-badge estado-badge--${estado}`}>
      <span className="estado-badge__punto" aria-hidden="true" />
      {ESTADO_TEXTO[estado]}
    </span>
  );
}
