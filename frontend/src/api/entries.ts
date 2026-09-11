import { apiFetch } from "./client";
import type { RegistrarMovimientoResultado } from "./sales";

export function registrarEntrada(input: {
  productoId: number;
  cantidad: number;
}): Promise<RegistrarMovimientoResultado> {
  return apiFetch<RegistrarMovimientoResultado>("/entries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
