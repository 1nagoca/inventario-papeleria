import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import {
  CantidadInvalidaError,
  MovimientoNoEncontradoError,
  MovimientoNoEsVentaError,
  MovimientoYaCanceladoError,
  ProductoDescontinuadoError,
  ProductoNoEncontradoError,
  StockInsuficienteError,
} from "../services/movimientos.service";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    const { formErrors, fieldErrors } = err.flatten();
    return res.status(400).json({
      error: formErrors[0] ?? "Datos inválidos.",
      detalles: fieldErrors,
    });
  }

  if (err instanceof ProductoNoEncontradoError) {
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof StockInsuficienteError) {
    return res
      .status(409)
      .json({ error: err.message, disponibles: err.disponibles });
  }

  if (err instanceof CantidadInvalidaError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof MovimientoNoEncontradoError) {
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof MovimientoNoEsVentaError || err instanceof MovimientoYaCanceladoError) {
    return res.status(409).json({ error: err.message });
  }

  if (err instanceof ProductoDescontinuadoError) {
    return res.status(409).json({ error: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un producto con ese nombre." });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Producto no encontrado." });
    }
    if (err.code === "P2003" || err.code === "P2014") {
      return res.status(409).json({
        error: "No se puede eliminar un producto con movimientos registrados.",
      });
    }
  }

  console.error(err);
  return res.status(500).json({ error: "Error interno del servidor." });
}
