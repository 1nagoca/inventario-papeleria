import { apiFetch } from "./client";
import type { Product } from "../types/product";

export function getProducts(opciones: { incluirDescontinuados?: boolean } = {}): Promise<Product[]> {
  const query = opciones.incluirDescontinuados ? "?incluirDescontinuados=true" : "";
  return apiFetch<Product[]>(`/products${query}`);
}

export interface CrearProductoInput {
  nombre: string;
  precio: number;
  stock?: number;
  stockMinimo?: number;
}

export function crearProducto(input: CrearProductoInput): Promise<Product> {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface ActualizarProductoInput {
  nombre?: string;
  precio?: number;
  stockMinimo?: number;
  descontinuado?: boolean;
}

export function actualizarProducto(id: number, input: ActualizarProductoInput): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

