import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";

const crearProductoSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio."),
    precio: z
      .number()
      .int("El precio debe ser un número entero.")
      .positive("El precio debe ser mayor a 0."),
    stock: z
      .number()
      .int("La cantidad inicial debe ser un número entero.")
      .nonnegative("La cantidad inicial no puede ser negativa.")
      .default(0),
    stockMinimo: z
      .number()
      .int("El stock mínimo debe ser un número entero.")
      .positive("El stock mínimo debe ser mayor a 0.")
      .optional(),
  })
  .strict();

// stock NO es editable aquí: cambia únicamente a través de ventas/entradas
// (ver regla de negocio en /CLAUDE.md).
const actualizarProductoSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio.").optional(),
    precio: z
      .number()
      .int("El precio debe ser un número entero.")
      .positive("El precio debe ser mayor a 0.")
      .optional(),
    stockMinimo: z
      .number()
      .int("El stock mínimo debe ser un número entero.")
      .positive("El stock mínimo debe ser mayor a 0.")
      .optional(),
  })
  .strict();

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function listarProductos(_req: Request, res: Response) {
  const productos = await prisma.product.findMany({ orderBy: { nombre: "asc" } });
  res.json(productos);
}

export async function crearProducto(req: Request, res: Response) {
  const datos = crearProductoSchema.parse(req.body);
  const producto = await prisma.product.create({ data: datos });
  res.status(201).json(producto);
}

export async function actualizarProducto(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const datos = actualizarProductoSchema.parse(req.body);
  const producto = await prisma.product.update({ where: { id }, data: datos });
  res.json(producto);
}

export async function eliminarProducto(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await prisma.product.delete({ where: { id } });
  res.status(204).send();
}
