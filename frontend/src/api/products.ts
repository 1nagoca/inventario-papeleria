import { apiFetch } from "./client";
import type { Product } from "../types/product";

export function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/products");
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
}

export function actualizarProducto(id: number, input: ActualizarProductoInput): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function eliminarProducto(id: number): Promise<void> {
  return apiFetch<void>(`/products/${id}`, { method: "DELETE" });
}
