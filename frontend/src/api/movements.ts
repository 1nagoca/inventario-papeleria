import { apiFetch } from "./client";
import type { MovimientoConProducto, TipoMovimiento } from "../types/movimiento";

export function getMovements(tipo?: TipoMovimiento): Promise<MovimientoConProducto[]> {
  const query = tipo ? `?tipo=${tipo}` : "";
  return apiFetch<MovimientoConProducto[]>(`/movements${query}`);
}
