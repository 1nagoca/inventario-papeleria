import { apiFetch } from "./client";
import type { Product } from "../types/product";
import type { Movimiento } from "../types/movimiento";

export interface RegistrarMovimientoResultado {
  producto: Product;
  movimiento: Movimiento;
}

export function registrarVenta(input: {
  productoId: number;
  cantidad: number;
}): Promise<RegistrarMovimientoResultado> {
  return apiFetch<RegistrarMovimientoResultado>("/sales", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
