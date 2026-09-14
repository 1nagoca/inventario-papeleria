import { apiFetch } from "./client";
import type { MovimientoConProducto, ResumenVentas, TipoMovimiento } from "../types/movimiento";

export function getMovements(tipo?: TipoMovimiento): Promise<MovimientoConProducto[]> {
  const query = tipo ? `?tipo=${tipo}` : "";
  return apiFetch<MovimientoConProducto[]>(`/movements${query}`);
}

export function getResumenVentas(): Promise<ResumenVentas> {
  return apiFetch<ResumenVentas>("/movements/resumen");
}

export function anularVenta(id: number): Promise<void> {
  return apiFetch(`/movements/${id}/anular`, { method: "POST" });
}
