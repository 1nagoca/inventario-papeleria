import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import {
  ProductoNoEncontradoError,
  anularVenta,
  obtenerResumenVentas,
  registrarEntrada,
  registrarVenta,
} from "../services/movimientos.service";

// Acepta productoId (usado por el frontend, vía un selector) o producto por
// nombre (pensado para una futura integración, ej. WhatsApp, que solo
// conocerá el nombre dicho/escrito por el usuario).
const registrarMovimientoSchema = z
  .object({
    productoId: z.number().int().positive().optional(),
    producto: z.string().trim().min(1).optional(),
    cantidad: z
      .number()
      .int("La cantidad debe ser un número entero.")
      .positive("La cantidad debe ser mayor a 0."),
  })
  .strict()
  .refine((datos) => datos.productoId !== undefined || datos.producto !== undefined, {
    message: "Debes indicar 'productoId' o 'producto'.",
    path: ["productoId"],
  });

async function resolverProductoId(datos: {
  productoId?: number;
  producto?: string;
}): Promise<number> {
  if (datos.productoId !== undefined) return datos.productoId;

  const producto = await prisma.product.findUnique({
    where: { nombre: datos.producto! },
  });
  if (!producto) throw new ProductoNoEncontradoError();
  return producto.id;
}

export async function crearVenta(req: Request, res: Response) {
  const datos = registrarMovimientoSchema.parse(req.body);
  const productoId = await resolverProductoId(datos);
  const resultado = await registrarVenta({ productoId, cantidad: datos.cantidad });
  res.status(201).json(resultado);
}

export async function crearEntrada(req: Request, res: Response) {
  const datos = registrarMovimientoSchema.parse(req.body);
  const productoId = await resolverProductoId(datos);
  const resultado = await registrarEntrada({ productoId, cantidad: datos.cantidad });
  res.status(201).json(resultado);
}

const TAMANO_PAGINA_DEFECTO = 15;

const listarMovimientosQuerySchema = z.object({
  tipo: z.enum(["VENTA", "ENTRADA"]).optional(),
  productoId: z.coerce.number().int().positive().optional(),
  // Cursor de paginación: trae movimientos anteriores a esta fecha (el más
  // antiguo de la página ya cargada), para el botón "Ver más antiguos".
  antesDe: z.coerce.date().optional(),
  limite: z.coerce.number().int().positive().max(200).optional(),
});

export async function listarMovimientos(req: Request, res: Response) {
  const { tipo, productoId, antesDe, limite } = listarMovimientosQuerySchema.parse(req.query);

  const movimientos = await prisma.movimiento.findMany({
    where: {
      tipo,
      productoId,
      ...(antesDe !== undefined ? { fecha: { lt: antesDe } } : {}),
    },
    orderBy: { fecha: "desc" },
    include: { producto: { select: { nombre: true } } },
    take: limite ?? TAMANO_PAGINA_DEFECTO,
  });

  res.json(movimientos);
}

export async function obtenerResumen(_req: Request, res: Response) {
  const resumen = await obtenerResumenVentas();
  res.json(resumen);
}

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export async function anularVentaController(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const resultado = await anularVenta(id);
  res.json(resultado);
}
