import type { ResumenVentas } from "../types/movimiento";
import { formatPrecio } from "../utils/format";
import "./ResumenVentasPeriodo.css";

interface Props {
  resumen: ResumenVentas;
}

export function ResumenVentasPeriodo({ resumen }: Props) {
  return (
    <div className="resumen-ventas-periodo">
      <div className="resumen-ventas-periodo__tarjeta">
        <p className="resumen-ventas-periodo__titulo">Últimos 15 días</p>
        <p className="resumen-ventas-periodo__monto">{formatPrecio(resumen.ultimos15Dias.pesos)}</p>
        <p className="resumen-ventas-periodo__detalle">
          {resumen.ultimos15Dias.unidades} unidades vendidas
        </p>
      </div>
      <div className="resumen-ventas-periodo__tarjeta">
        <p className="resumen-ventas-periodo__titulo">Este mes</p>
        <p className="resumen-ventas-periodo__monto">{formatPrecio(resumen.esteMes.pesos)}</p>
        <p className="resumen-ventas-periodo__detalle">{resumen.esteMes.unidades} unidades vendidas</p>
      </div>
    </div>
  );
}
