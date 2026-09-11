import type { Product } from "../types/product";
import { calcularEstado } from "../utils/estadoProducto";
import "./ResumenDashboard.css";

interface Props {
  totalProductos: number;
  totalUnidades: number;
  ventasHoy: number;
  productosBajos: Product[];
}

export function ResumenDashboard({ totalProductos, totalUnidades, ventasHoy, productosBajos }: Props) {
  return (
    <div className="resumen-dashboard">
      <div className="resumen-dashboard__grid">
        <div className="resumen-dashboard__tile">
          <span className="resumen-dashboard__numero">{totalProductos}</span>
          <span className="resumen-dashboard__etiqueta">productos diferentes</span>
        </div>
        <div className="resumen-dashboard__tile">
          <span className="resumen-dashboard__numero">{totalUnidades}</span>
          <span className="resumen-dashboard__etiqueta">unidades en total</span>
        </div>
        <div className="resumen-dashboard__tile">
          <span className="resumen-dashboard__numero">{ventasHoy}</span>
          <span className="resumen-dashboard__etiqueta">ventas hoy</span>
        </div>
      </div>

      {productosBajos.length > 0 && (
        <div className="alerta-inventario" role="alert">
          <p className="alerta-inventario__titulo">Necesitan atención:</p>
          <ul className="alerta-inventario__lista">
            {productosBajos.map((p) => (
              <li key={p.id}>
                {p.nombre} — {calcularEstado(p) === "agotado" ? "agotado" : "pocas unidades"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
