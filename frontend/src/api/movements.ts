import { apiFetch } from "./client";
import type { MovimientoConProducto, ResumenVentas, TipoMovimiento } from "../types/movimiento";

interface OpcionesMovimientos {
  tipo?: TipoMovimiento;
  /** Cursor: trae movimientos anteriores a esta fecha (para "Ver más antiguos"). */
  antesDe?: string;
  limite?: number;
}

export function getMovements(opciones: OpcionesMovimientos = {}): Promise<MovimientoConProducto[]> {
  const params = new URLSearchParams();
  if (opciones.tipo) params.set("tipo", opciones.tipo);
  if (opciones.antesDe) params.set("antesDe", opciones.antesDe);
  if (opciones.limite !== undefined) params.set("limite", String(opciones.limite));
  const query = params.toString();
  return apiFetch<MovimientoConProducto[]>(`/movements${query ? `?${query}` : ""}`);
}

export function getResumenVentas(): Promise<ResumenVentas> {
  return apiFetch<ResumenVentas>("/movements/resumen");
}

export function anularVenta(id: number): Promise<void> {
  return apiFetch(`/movements/${id}/anular`, { method: "POST" });
}
