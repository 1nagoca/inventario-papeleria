import type { Product } from "../types/product";

export type EstadoProducto = "disponible" | "pocas-unidades" | "agotado";

export function calcularEstado(producto: Pick<Product, "stock" | "stockMinimo">): EstadoProducto {
  if (producto.stock === 0) return "agotado";
  if (producto.stock <= producto.stockMinimo) return "pocas-unidades";
  return "disponible";
}

export const ESTADO_TEXTO: Record<EstadoProducto, string> = {
  disponible: "Disponible",
  "pocas-unidades": "Pocas unidades",
  agotado: "Agotado",
};
